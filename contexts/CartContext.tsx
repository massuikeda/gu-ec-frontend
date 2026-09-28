"use client";

// カートの状態を管理するContext。
// カートの中身はBackend（FastAPI）側のDBが正であり、ここでは
//   - GET  /api/cart        で最新のカートを取得して表示用に保持する
//   - POST /api/cart/items  でカートに追加する（在庫数・運用上限99のチェックはBackendが行う）
//   - PATCH  /api/cart/items/{cartItemId} で数量を変更する
//   - DELETE /api/cart/items/{cartItemId} で削除する
// だけを行う。以前はこのContextの中だけで数量を足し算していたため、
// 在庫数を超えてカートに入ってしまうことがあった。
// （/api/... はNext.jsのRoute Handler → lib/backendProxy.ts 経由でBackendに中継される）

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import type { ApiError, Cart, CartLineItem } from "@/types/product";

const EMPTY_CART: Cart = {
  cartId: null,
  items: [],
  cartTotalQuantity: 0,
  cartTotalPrice: 0,
};

export type CartActionResult = { ok: true } | { ok: false; message: string };

type CartContextType = {
  items: CartLineItem[];
  totalQuantity: number;
  totalPrice: number;
  isLoading: boolean;
  loadError: string | null;
  addItem: (skuId: string, quantity: number) => Promise<CartActionResult>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<CartActionResult>;
  removeItem: (cartItemId: string) => Promise<CartActionResult>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// Backendのエラーレスポンス（{errorCode, message}）からメッセージを取り出す。
// 想定外の形式（FastAPIのバリデーションエラー等）の場合は汎用メッセージにする。
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as Partial<ApiError>;
    if (typeof body.message === "string") return body.message;
  } catch {
    // JSONでない場合は下の汎用メッセージ
  }
  return `エラーが発生しました（${res.status}）`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart", { cache: "no-store" });
      if (!res.ok) {
        setLoadError(await readErrorMessage(res));
        return;
      }
      setCart((await res.json()) as Cart);
      setLoadError(null);
    } catch {
      setLoadError("カートを取得できませんでした");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回表示時にBackendから現在のカートを読み込む（cart_id Cookieで識別される）。
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部（Backend）との同期のための初回取得
    void refreshCart();
  }, [refreshCart]);

  // Backendへの変更リクエストを送り、成功したらカートを取り直す共通処理。
  // 失敗時は在庫超過（QUANTITY_EXCEEDS_LIMIT）等のBackendのメッセージを返す。
  const mutate = useCallback(
    async (url: string, init: RequestInit, fallbackMessage: string): Promise<CartActionResult> => {
      try {
        const res = await fetch(url, init);
        if (!res.ok) {
          return { ok: false, message: await readErrorMessage(res) };
        }
        await refreshCart();
        return { ok: true };
      } catch {
        return { ok: false, message: fallbackMessage };
      }
    },
    [refreshCart],
  );

  const addItem = useCallback(
    (skuId: string, quantity: number) =>
      mutate(
        "/api/cart/items",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skuId, quantity }),
        },
        "カートに追加できませんでした",
      ),
    [mutate],
  );

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) =>
      mutate(
        `/api/cart/items/${encodeURIComponent(cartItemId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        },
        "数量を変更できませんでした",
      ),
    [mutate],
  );

  const removeItem = useCallback(
    (cartItemId: string) =>
      mutate(
        `/api/cart/items/${encodeURIComponent(cartItemId)}`,
        { method: "DELETE" },
        "削除できませんでした",
      ),
    [mutate],
  );

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        totalQuantity: cart.cartTotalQuantity,
        totalPrice: cart.cartTotalPrice,
        isLoading,
        loadError,
        addItem,
        updateQuantity,
        removeItem,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartはCartProviderの内側でのみ使えます");
  }
  return context;
}
