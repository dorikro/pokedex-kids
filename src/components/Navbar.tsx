"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/index";
import { useEffect, useState } from "react";
import { playerState } from "@/lib/player-state";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [money, setMoney] = useState<number | null>(null);
  const [balls, setBalls] = useState<number | null>(null);

  useEffect(() => {
    function refresh() {
      const save = playerState.get();
      if (save.hasStarted) {
        setMoney(save.money);
        const ballCount =
          (save.inventory.find((i) => i.itemId === "pokeball")?.quantity ?? 0) +
          (save.inventory.find((i) => i.itemId === "great-ball")?.quantity ?? 0);
        setBalls(ballCount);
      }
    }
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const links = [
    { href: "/", label: t.nav.browse },
    { href: "/wild", label: "Wild" },
    { href: "/party", label: "Party" },
    { href: "/shop", label: "Shop" },
    { href: "/battle", label: t.nav.battle },
    { href: "/stats", label: t.nav.stats },
    { href: "/about", label: t.nav.about },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-red-500">{t.nav.brand}</span>
          <span className="text-sm text-gray-400 font-medium">{t.nav.brandSuffix}</span>
        </Link>
        <div className="flex items-center gap-3">
          {/* Money + balls HUD */}
          {money !== null && (
            <div className="hidden sm:flex items-center gap-3 text-sm font-medium">
              <span className="text-yellow-600">₽{money.toLocaleString()}</span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500">🎾 {balls}</span>
            </div>
          )}
          <div className="flex gap-1">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-red-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}

