"use client";

// 全ページ共通のヘッダー（告知バー＋ロゴ・カテゴリ・アイコン）。
// カートアイコンのバッジは、Backendから取得したカートの合計数量を表示する。
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

function Icon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span aria-label={label} className="inline-flex h-6 w-6 items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[22px] w-[22px]"
      >
        {children}
      </svg>
    </span>
  );
}

export default function SiteHeader() {
  const { totalQuantity } = useCart();

  return (
    <header className="border-b border-neutral-200 bg-white">
      {/* 告知バー（文言は仮） */}
      <div className="bg-neutral-900 text-white">
        <div className="mx-auto flex h-10 max-w-6xl items-center justify-between px-4 text-xs">
          <span>【お知らせ】オンラインストア限定商品を販売中</span>
          <span aria-hidden>›</span>
        </div>
      </div>

      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          {/* ロゴは仮置き。正式なロゴ画像は public/ に置いて差し替える */}
          <Link
            href="/"
            className="flex h-8 items-center border border-neutral-900 px-2 text-xs font-bold tracking-widest"
          >
            LOGO
          </Link>
          <nav className="hidden gap-6 text-[15px] font-bold text-neutral-700 sm:flex">
            <span>WOMEN</span>
            <span>MEN</span>
            <span>KIDS・TEEN</span>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-neutral-900">
          <Icon label="検索">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </Icon>
          <Icon label="お気に入り">
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
          </Icon>
          <Icon label="アカウント">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
          </Icon>
          <Link href="/cart" className="relative" aria-label="カート">
            <Icon label="カート">
              <path d="M3 4h2l2.2 10.5h10.3L19.5 7H6.2" />
              <circle cx="9" cy="19" r="1.3" />
              <circle cx="16.5" cy="19" r="1.3" />
            </Icon>
            {totalQuantity > 0 && (
              <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-bold text-white">
                {totalQuantity > 99 ? "99+" : totalQuantity}
              </span>
            )}
          </Link>
          <Icon label="メニュー">
            <path d="M5 7h14M5 12h14M5 17h14" />
          </Icon>
        </div>
      </div>
    </header>
  );
}
