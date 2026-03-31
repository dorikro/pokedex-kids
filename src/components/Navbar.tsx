"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/index";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: "/", label: t.nav.browse },
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
          <div className="flex gap-2">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
