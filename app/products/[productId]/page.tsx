"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import type { ApiError, Product } from "@/types/product";
import ProductPlaceholderImage, { colorSwatchMap } from "@/components/ProductPlaceholderImage";

// カラー名 → 表示用のカラーコード（例：「09 BLACK」）。未登録の色は名前だけ表示する。
const colorLabelMap: Record<string, string> = {
  ブラック: "09 BLACK",
  ホワイト: "00 WHITE",
};

// 設計仕様書「入力値・数量の制約定義とエラー処理設計」：上限＝在庫数（かつ運用上限99）
const OPERATIONAL_MAX_QUANTITY = 99;

// 商品情報はBackend（GET /api/products/{productId}）から取得する。
// 在庫数の正はBackend側のDBなので、ダミーデータではなくAPIの値を使う。
export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
          cache: "no-store",
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setLoadError((body as ApiError).message ?? "商品を取得できませんでした");
          return;
        }
        setProduct(body as Product);
      } catch {
        if (!cancelled) setLoadError("商品を取得できませんでした");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loadError) {
    return <p className="mx-auto max-w-6xl px-4 py-10 text-red-700">{loadError}</p>;
  }
  if (!product) {
    return <p className="mx-auto max-w-6xl px-4 py-10 text-neutral-500">読み込み中…</p>;
  }
  return <ProductDetail product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { items, totalQuantity, totalPrice, addItem } = useCart();

  const colors = Array.from(new Set(product.variations.map((v) => v.color)));
  const sizes = Array.from(new Set(product.variations.map((v) => v.size)));

  // UC001-03対応：初期表示ではカラー・サイズとも未選択とし、
  // include関係（カラー・サイズを選択する）をユーザー操作として成立させる。
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showAddedModal, setShowAddedModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // カラー・サイズを切り替えたら数量を1に戻す。
  // （以前は数量がそのまま残り、Lで16個にしてからSに切り替えると在庫5を超えて追加できてしまった）
  function handleSelectColor(color: string) {
    setSelectedColor(color);
    setQuantity(1);
    setAddError(null);
  }

  function handleSelectSize(size: string) {
    setSelectedSize(size);
    setQuantity(1);
    setAddError(null);
  }

  const selectedVariation = product.variations.find(
    (v) => v.color === selectedColor && v.size === selectedSize,
  );
  const isSelectedOutOfStock =
    !selectedVariation || selectedVariation.stockQuantity === 0;
  const finalPrice = Math.round(product.basePrice * (1 - product.discountRate));

  // 上限＝在庫数と運用上限99のいずれか小さい方
  const maxQuantity = Math.min(
    selectedVariation?.stockQuantity ?? 1,
    OPERATIONAL_MAX_QUANTITY,
  );
  // 同じSKUが既にカートに入っている場合は、その分を差し引いた数までしか追加できない
  // （Backendも「カート内の数量＋今回の数量」で上限チェックしている）。
  const inCartQuantity =
    items.find((i) => i.skuId === selectedVariation?.skuId)?.quantity ?? 0;
  const remainingQuantity = Math.max(0, maxQuantity - inCartQuantity);
  const cannotAddMore = !isSelectedOutOfStock && remainingQuantity === 0;
  const isAddDisabled =
    !selectedColor ||
    !selectedSize ||
    isSelectedOutOfStock ||
    cannotAddMore ||
    quantity > remainingQuantity ||
    isAdding;
  const isIncreaseDisabled = isSelectedOutOfStock || quantity >= remainingQuantity;

  function handleDecrease() {
    setQuantity((prev) => Math.max(1, prev - 1));
  }

  function handleIncrease() {
    setQuantity((prev) => Math.min(remainingQuantity, prev + 1));
  }

  async function handleAddToCart() {
    if (!selectedVariation || isAddDisabled) return;

    setIsAdding(true);
    setAddError(null);
    // 最終的な在庫・上限チェックはBackendが行う。エラー時はBackendのメッセージを表示する。
    const result = await addItem(selectedVariation.skuId, quantity);
    setIsAdding(false);

    if (!result.ok) {
      setAddError(result.message);
      return;
    }
    setQuantity(1);
    setShowAddedModal(true);
  }

  // 画像は色が未選択なら先頭の色で表示する
  const imageColor = selectedColor ?? colors[0];

  // 在庫表示（未選択時はカラー・サイズの選択を促す）
  const stockMessage =
    !selectedColor || !selectedSize
      ? "カラーとサイズを選択してください"
      : isSelectedOutOfStock
        ? "在庫なし"
        : "在庫あり";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-0 pb-16 md:grid-cols-[1fr_360px] md:px-4 lg:gap-14">
      {/* 左：商品画像（2列グリッド） */}
      <div className="grid grid-cols-2">
        <ProductPlaceholderImage color={imageColor} view="front" />
        <ProductPlaceholderImage color={imageColor} view="back" />
        <ProductPlaceholderImage color={imageColor} view="flat" />
        <ProductPlaceholderImage color={imageColor} view="detail" />
      </div>

      {/* 右：商品情報・購入エリア */}
      <div className="px-4 pt-2 md:sticky md:top-4 md:self-start md:px-0">
        {/* ①商品名 */}
        <h1 className="text-[17px] leading-snug text-neutral-900">{product.name}</h1>

        {/* ②カラー選択（丸スウォッチ） */}
        <p className="mt-5 text-xs text-neutral-500">
          カラー: {selectedColor ? (colorLabelMap[selectedColor] ?? selectedColor) : "未選択"}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {colors.map((color) => {
            const isSelected = selectedColor === color;
            return (
              <button
                key={color}
                type="button"
                aria-label={color}
                aria-pressed={isSelected}
                onClick={() => handleSelectColor(color)}
                className={`h-9 w-9 cursor-pointer rounded-full p-[3px] ${
                  isSelected ? "ring-2 ring-neutral-900" : "ring-1 ring-transparent hover:ring-neutral-300"
                }`}
              >
                <span
                  className="block h-full w-full rounded-full border border-neutral-300"
                  style={{ backgroundColor: colorSwatchMap[color] }}
                />
              </button>
            );
          })}
        </div>

        {/* ③サイズ選択（在庫なしは斜線・グレーアウト） */}
        <p className="mt-6 text-xs text-neutral-500">サイズ: {selectedSize ?? "未選択"}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizes.map((size) => {
            const sizeVariation = product.variations.find(
              (v) => v.color === selectedColor && v.size === size,
            );
            // カラー未選択の間は、いずれかの色に在庫があれば選択可能にする
            const sizeIsOutOfStock = selectedColor
              ? !sizeVariation || sizeVariation.stockQuantity === 0
              : !product.variations.some((v) => v.size === size && v.stockQuantity > 0);
            const isSelected = selectedSize === size;

            return (
              <button
                key={size}
                type="button"
                onClick={() => handleSelectSize(size)}
                disabled={sizeIsOutOfStock}
                aria-pressed={isSelected}
                className={`relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[11px] font-bold ${
                  isSelected
                    ? "bg-neutral-900 text-white ring-2 ring-neutral-900 ring-offset-2"
                    : sizeIsOutOfStock
                      ? "cursor-not-allowed border border-neutral-300 text-neutral-300"
                      : "cursor-pointer border border-neutral-400 text-neutral-900 hover:border-neutral-900"
                }`}
              >
                {size}
                {sizeIsOutOfStock && (
                  <span
                    aria-hidden
                    className="absolute left-1/2 top-1/2 h-px w-[140%] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-neutral-300"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ④価格 */}
        <p className="mt-8 text-[26px] font-bold tracking-tight text-neutral-900">
          ¥{finalPrice.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-neutral-500">オンライン商品</p>

        {/* ⑤数量入力（－ 1 ＋）と ⑥カートに入れるボタン */}
        <div className="mt-8 flex gap-3">
          <div className="flex h-12 w-[140px] shrink-0 items-center justify-between rounded-full bg-neutral-100 px-2">
            <button
              type="button"
              onClick={handleDecrease}
              disabled={quantity <= 1}
              aria-label="数量を減らす"
              className="h-9 w-9 rounded-full text-lg text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              －
            </button>
            <span className="text-[15px] text-neutral-900">{quantity}</span>
            <button
              type="button"
              onClick={handleIncrease}
              disabled={isIncreaseDisabled}
              aria-label="数量を増やす"
              className="h-9 w-9 rounded-full text-lg text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
            >
              ＋
            </button>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isAddDisabled}
            className="h-12 flex-1 cursor-pointer rounded-full bg-neutral-900 text-[15px] font-bold text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isAdding ? "追加中…" : "カートに入れる"}
          </button>
        </div>

        {/* ⑦在庫あり／なし表示 */}
        <p className="mt-2 text-[11px] text-neutral-600">{stockMessage}</p>

        {/* カート内の同じSKUの数量と、あと何点追加できるか */}
        {inCartQuantity > 0 && (
          <p className="mt-2 text-xs text-neutral-600">
            この商品はカートに{inCartQuantity}点入っています
            {cannotAddMore
              ? "（上限に達しているため、これ以上追加できません）"
              : `（あと${remainingQuantity}点まで追加できます）`}
          </p>
        )}
        {addError && <p className="mt-2 text-xs text-red-700">{addError}</p>}

        {/* 商品説明 */}
        <dl className="mt-10 space-y-3 border-t border-neutral-200 pt-6 text-xs leading-relaxed text-neutral-700">
          {product.description && <dd>{product.description}</dd>}
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-neutral-500">素材</dt>
            <dd>{product.material}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-neutral-500">取り扱い</dt>
            <dd>{product.careInstructions}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-20 shrink-0 text-neutral-500">原産国</dt>
            <dd>{product.countryOfOrigin}</dd>
          </div>
        </dl>
      </div>

      {/* カート追加後の確認モーダル */}
      {showAddedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-neutral-900">
            <p className="font-bold">カートに商品が追加されました</p>
            <p className="mt-2 text-sm">
              カート内合計：{totalQuantity}点　¥{totalPrice.toLocaleString()}
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                // カートを見るボタンをクリックするとrouter.pushで/cartに移動することができる。
                onClick={() => router.push("/cart")}
                className="flex-1 cursor-pointer rounded-full bg-neutral-900 py-2.5 text-sm font-bold text-white"
              >
                カートを見る
              </button>
              <button
                type="button"
                onClick={() => setShowAddedModal(false)}
                className="flex-1 cursor-pointer rounded-full border border-neutral-400 py-2.5 text-sm"
              >
                お買い物を続ける
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
