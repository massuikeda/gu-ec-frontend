// data/dummyProducts.ts
import { Product } from "@/types/product";

export const dummyProduct: Product = {
  productId: "prod-001",
  name: "スウェットプルパーカ",
  category: "トップス",
  description: "肉厚な裏毛素材を使用したリラックスフィットのパーカ。",
  material: "綿80% ポリエステル20%",
  careInstructions: "洗濯機の使用可（ネット使用推奨）",
  countryOfOrigin: "中国",
  basePrice: 2990,
  discountRate: 0,
  defaultSize: "M",
  variations: [
    {
      skuId: "sku-001",
      productId: "prod-001",
      color: "ブラック",
      size: "S",
      stockQuantity: 5,
    },
    {
      skuId: "sku-002",
      productId: "prod-001",
      color: "ブラック",
      size: "M",
      stockQuantity: 0,
    },
    {
      skuId: "sku-003",
      productId: "prod-001",
      color: "ブラック",
      size: "L",
      stockQuantity: 120,
    },
    {
      skuId: "sku-004",
      productId: "prod-001",
      color: "ホワイト",
      size: "S",
      stockQuantity: 3,
    },
    {
      skuId: "sku-005",
      productId: "prod-001",
      color: "ホワイト",
      size: "M",
      stockQuantity: 8,
    },
    {
      skuId: "sku-006",
      productId: "prod-001",
      color: "ホワイト",
      size: "L",
      stockQuantity: 0,
    },
  ],
};
