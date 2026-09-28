// 商品画像が未用意のため、指定した色で塗った仮のパーカ画像を表示する（商品ページ・カートで共用）。
// 実際の商品画像を用意したら、next/image 等に差し替える。

// カラー名 → スウォッチ・仮画像の色
export const colorSwatchMap: Record<string, string> = {
  ブラック: "#1a1a1a",
  ホワイト: "#f2f2f2",
};

type View = "front" | "back" | "flat" | "detail";

export default function ProductPlaceholderImage({
  color,
  view = "front",
}: {
  color: string;
  view?: View;
}) {
  const fill = colorSwatchMap[color] ?? "#bdbdbd";
  const stroke = fill === "#f2f2f2" ? "#bdbdbd" : "rgba(0,0,0,0.25)";
  const bg = view === "flat" || view === "detail" ? "bg-[#e9e9ec]" : "bg-[#f1f0ee]";
  return (
    <div className={`flex aspect-[3/4] items-center justify-center ${bg}`}>
      <svg viewBox="0 0 200 220" className={view === "detail" ? "w-[85%]" : "w-[60%]"} aria-hidden>
        {/* 袖 */}
        <path d="M52 62 22 150l24 8 22-62" fill={fill} stroke={stroke} strokeWidth={2} />
        <path d="M148 62l30 88-24 8-22-62" fill={fill} stroke={stroke} strokeWidth={2} />
        {/* 胴体 */}
        <path d="M52 62q48-22 96 0l2 138H50Z" fill={fill} stroke={stroke} strokeWidth={2} />
        {/* フード */}
        <path d="M70 58q30-50 60 0q-30 14-60 0Z" fill={fill} stroke={stroke} strokeWidth={2} />
        {view !== "back" && (
          <>
            {/* ポケット */}
            <path d="M72 140h56l8 34H64Z" fill="none" stroke={stroke} strokeWidth={2} />
            {/* 紐 */}
            <path d="M92 64v26M108 64v26" stroke={stroke} strokeWidth={2} />
          </>
        )}
      </svg>
    </div>
  );
}

