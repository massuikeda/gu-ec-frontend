"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import ProductPlaceholderImage from "@/components/ProductPlaceholderImage";
import type { CartLineItem, Product } from "@/types/product";

// カラー名 → 表示用のカラーコード（商品ページと同じ表記）
const colorLabelMap: Record<string, string> = {
  ブラック: "09 BLACK",
  ホワイト: "00 WHITE",
};

// 設計仕様書「入力値・数量の制約定義とエラー処理設計」：上限＝在庫数（かつ運用上限99）
const OPERATIONAL_MAX_QUANTITY = 99;

// 表示価格は税込のため、内消費税（10%）は 合計 × 10/110 の切り捨てで表示する（表示のみ）。
function includedTax(totalPrice: number) {
  return Math.floor((totalPrice * 10) / 110);
}

export default function CartPage() {
  // 小計・合計はBackendが計算した値をそのまま表示する（Frontendでは再計算しない）。
  const { items, totalQuantity, totalPrice, isLoading, loadError } = useCart();

  // 商品名と在庫数（＋ボタンの上限用）は商品APIから取得する。
  const products = useProducts(items);

  if (isLoading) {
    return <p className="mx-auto max-w-6xl px-4 py-10 text-neutral-500">読み込み中…</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 text-neutral-900">
      <h1 className="border-b border-neutral-200 py-6 text-[28px]">カート</h1>

      {loadError ? (
        // Backendに接続できない等でカートを取得できなかった場合は、エラーのみ表示する
        <p className="mt-6 text-sm text-red-700">{loadError}</p>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-neutral-600">カートに商品がありません</p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-neutral-900 px-10 py-3 text-sm font-bold text-white"
          >
            お買い物を続ける
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-10 md:grid-cols-[1fr_340px]">
          {/* 左：カート内商品 */}
          <ul className="space-y-8">
            {items.map((item) => (
              <CartItemRow key={item.cartItemId} item={item} product={products[item.productId]} />
            ))}
          </ul>

          {/* 右：注文内容 */}
          <aside className="md:self-start">
            <div className="bg-neutral-100 px-6 py-2 text-sm">
              <div className="flex items-center justify-between border-b border-neutral-300 py-5">
                <span className="font-bold">注文内容</span>
                <span className="font-bold">{totalQuantity} 件</span>
              </div>
              <div className="space-y-4 border-b border-neutral-300 py-5">
                <div className="flex justify-between">
                  <span>商品合計</span>
                  <span>¥{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>送料</span>
                  <span>未定</span>
                </div>
              </div>
              <div className="flex justify-between border-b border-neutral-300 py-5 font-bold">
                <span>合計</span>
                <span>¥{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-5">
                <span>内消費税</span>
                <span>¥{includedTax(totalPrice).toLocaleString()}</span>
              </div>
            </div>

            {/* 購入手続きは未実装のため、ボタンは押せない状態で表示する */}
            <button
              type="button"
              disabled
              className="mt-8 h-12 w-full cursor-not-allowed rounded-full bg-neutral-900 text-sm font-bold text-white opacity-40"
            >
              購入手続きへ
            </button>
            <p className="mt-2 text-center text-xs text-neutral-500">購入手続きは準備中です</p>
          </aside>
        </div>
      )}
    </div>
  );
}

// カート内の商品IDごとに、商品API（GET /api/products/{productId}）から商品情報を取得する。
function useProducts(items: CartLineItem[]) {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const productIdsKey = Array.from(new Set(items.map((i) => i.productId))).sort().join(",");

  useEffect(() => {
    const ids = productIdsKey ? productIdsKey.split(",") : [];
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/products/${encodeURIComponent(id)}`, { cache: "no-store" });
            return res.ok ? ([id, (await res.json()) as Product] as const) : null;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      setProducts(Object.fromEntries(entries.filter((e) => e !== null)));
    })();
    return () => {
      cancelled = true;
    };
  }, [productIdsKey]);

  return products;
}

function CartItemRow({ item, product }: { item: CartLineItem; product?: Product }) {
  const { updateQuantity, removeItem } = useCart();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stock = product?.variations.find((v) => v.skuId === item.skuId)?.stockQuantity;
  // 在庫数が取れるまでは運用上限のみで判定する（最終的なチェックはBackendが行う）
  const maxQuantity = Math.min(stock ?? OPERATIONAL_MAX_QUANTITY, OPERATIONAL_MAX_QUANTITY);

  async function run(action: () => Promise<{ ok: true } | { ok: false; message: string }>) {
    setIsBusy(true);
    setError(null);
    const result = await action();
    // 削除成功時はこの行自体が消えるので、状態の更新は不要
    if (!result.ok) setError(result.message);
    setIsBusy(false);
  }

  return (
    <li className="flex gap-4">
      <Link href={`/products/${item.productId}`} className="w-[110px] shrink-0 sm:w-[136px]">
        <ProductPlaceholderImage color={item.color} />
      </Link>

      <div className="min-w-0 flex-1 text-sm">
        <Link href={`/products/${item.productId}`} className="hover:underline">
          {product?.name ?? "　"}
        </Link>
        <p className="mt-1.5 text-xs">カラー: {colorLabelMap[item.color] ?? item.color}</p>
        <p className="mt-0.5 text-xs">サイズ: {item.size}</p>
        <p className="mt-2 text-lg">¥{item.unitPrice.toLocaleString()}</p>
        <p className="text-xs text-neutral-500">オンライン商品</p>

        {/* 数量変更（－ 数量 ＋） */}
        <div className="mt-3 flex h-10 w-[120px] items-center justify-between rounded-full bg-neutral-100 px-1.5">
          <button
            type="button"
            aria-label="数量を減らす"
            disabled={isBusy || item.quantity <= 1}
            onClick={() => run(() => updateQuantity(item.cartItemId, item.quantity - 1))}
            className="h-8 w-8 cursor-pointer rounded-full text-lg disabled:cursor-not-allowed disabled:text-neutral-300"
          >
            －
          </button>
          <span className="text-sm">{item.quantity}</span>
          <button
            type="button"
            aria-label="数量を増やす"
            disabled={isBusy || item.quantity >= maxQuantity}
            onClick={() => run(() => updateQuantity(item.cartItemId, item.quantity + 1))}
            className="h-8 w-8 cursor-pointer rounded-full text-lg disabled:cursor-not-allowed disabled:text-neutral-300"
          >
            ＋
          </button>
        </div>
        {stock !== undefined && item.quantity >= maxQuantity && (
          <p className="mt-1 text-xs text-neutral-500">上限（{maxQuantity}点）に達しています</p>
        )}

        <button
          type="button"
          disabled={isBusy}
          onClick={() => run(() => removeItem(item.cartItemId))}
          className="mt-3 block cursor-pointer text-xs text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          削除
        </button>
        {error && <p className="mt-1 text-xs text-red-700">{error}</p>}

        <p className="mt-3 text-sm">
          小計: <span className="font-bold">¥{item.subtotal.toLocaleString()}</span>
        </p>
      </div>
    </li>
  );
}
