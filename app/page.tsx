import { redirect } from "next/navigation";

// トップページは、今のところ唯一の商品（prod-001）の商品詳細ページを表示する。
// 商品一覧ページを作ったら、ここをその一覧に差し替える。
export default function Home() {
  redirect("/products/prod-001");
}
