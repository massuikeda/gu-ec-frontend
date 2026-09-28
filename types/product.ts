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
  defaultSize?: string;
  variations: ProductVariation[];
};

// --- カート（Backend GET /api/cart のレスポンス。gu-ec-backend/app/schemas.py と対応） ---

export type CartLineItem = {
  cartItemId: string;
  skuId: string;
  productId: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type Cart = {
  cartId: string | null;
  items: CartLineItem[];
  cartTotalQuantity: number;
  cartTotalPrice: number;
};

// Backend・lib/backendProxy.ts 共通のエラーレスポンス形式
export type ApiError = {
  errorCode: string;
  message: string;
};
