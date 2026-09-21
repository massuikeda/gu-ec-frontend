// app/products/[productId]/page.tsx
"use client";

import { dummyProduct } from "@/data/dummyProducts";

export default function ProductDetailPage() {
  const product = dummyProduct; // 今はダミーデータ固定。将来Backend連携時にproductIdで検索する形に変更する

    // 重複を除いた色の一覧を作る
  const colors = Array.from(new Set(product.variations.map((v) => v.color)));

console.log("①", product.variations);

console.log("①", product.variations);

console.log("②",new Set(product.variations.map((v) => v.color)));
console.log("④",Array.from)

console.log("②", product.variations.map((v) => v.color));
console.log("③", new Set(product.variations.map((v) => v.color)));
console.log("④", Array.from(new Set(product.variations.map((v) => v.color))));

  return (
    <div>
      <h1>{product.name}</h1>
      {/* ここから商品情報・カラー選択・サイズ選択・数量入力を実装していく */}
    </div>
  );
}