// Next.jsのRoute HandlerからFastAPI Backend（別プロセス／別リポジトリ）へリクエストを中継する共通ヘルパー。
// ブラウザは常にNext.js自身（同一オリジン）にしかアクセスしないため、
// FastAPI側でCORS設定を持たなくてよくなり、Cookieのcross-site（SameSite）問題も発生しない。
import { NextRequest, NextResponse } from "next/server";

// ローカルではuvicornのデフォルトである8000番を想定。
// Azureにデプロイする際は、App Service等の環境変数にBACKEND_API_URLを設定してURLを切り替える。
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:8000";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD", "DELETE"]);

export async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const url = new URL(backendPath, BACKEND_API_URL);
  url.search = req.nextUrl.search; // クエリパラメータもそのまま引き継ぐ

  const headers = new Headers();
  const cookie = req.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const hasBody = !METHODS_WITHOUT_BODY.has(req.method);

  let backendResponse: Response;
  try {
    backendResponse = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
    });
  } catch (error) {
    // FastAPIが起動していない・到達できない場合はここに来る。
    console.error(`[backendProxy] ${req.method} ${url.toString()} への接続に失敗しました`, error);
    return NextResponse.json(
      { errorCode: "BACKEND_UNREACHABLE", message: "Backendに接続できません" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  const responseContentType = backendResponse.headers.get("content-type");
  if (responseContentType) responseHeaders.set("content-type", responseContentType);

  // Set-Cookieは複数付く場合があるため、getSetCookie()（Node 20+）があればそちらを使う。
  const getSetCookie = (backendResponse.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  const setCookies = getSetCookie
    ? getSetCookie.call(backendResponse.headers)
    : (() => {
        const single = backendResponse.headers.get("set-cookie");
        return single ? [single] : [];
      })();
  for (const setCookie of setCookies) {
    responseHeaders.append("set-cookie", setCookie);
  }

  // 204 No Content（DELETE成功時など）・304 はボディを持てないため、nullで返す
  // （空文字列でもボディ付きとみなされ、Responseの生成時にエラーになる）。
  const isNullBodyStatus = backendResponse.status === 204 || backendResponse.status === 304;
  const bodyText = isNullBodyStatus ? null : await backendResponse.text();
  return new NextResponse(bodyText, {
    status: backendResponse.status,
    headers: responseHeaders,
  });
}
