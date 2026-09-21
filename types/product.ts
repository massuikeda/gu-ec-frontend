// types/product.ts

export type ProductVariation = {
  skuId: string;
  productId: string;
  color: string;
  size: string;
  stockQuantity: number;
};

export type Product = {
  productId: string;
  name: string;
  category: string;
  description: string;
  material: string;
  careInstructions: string;
  countryOfOrigin: string;
  basePrice: number;
  discountRate: number;
  variations: ProductVariation[];
};