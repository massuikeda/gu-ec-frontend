"use client";

import { useState } from "react";
import { dummyProduct } from "@/data/dummyProducts";

// exportは他のページから使っていいよということ
// defaultはこの関数だけを返すよってこと
// functionは関数
export default function ProductDetailsPage() {
  const product = dummyProduct;
  const colors = Array.from(new Set(product.variations.map((v) => v.color)));

  // 前が現在の値、後ろが次の値
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const colorSwatchMap: Record<string, string> = {
    ブラック: "#1a1a1a",
    ホワイト: "#f2f2f2",
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <div>
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setSelectedColor(color)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: colorSwatchMap[color],
              border:
                selectedColor === color ? "2px solid black" : "1px solid #ccc",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
      <p>選択中の色：{selectedColor ?? "未選択"}</p>
    </div>
  );
}
