"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { playerState } from "@/lib/player-state";
import { ITEM_CATALOGUE } from "@/lib/items";
import { TRAINERS } from "@/lib/trainer";
import { useTranslation } from "@/lib/i18n/index";
import type { PlayerState } from "@/lib/types";

const POKEMON_SPRITE = (id: number) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export default function ShopPage() {
  const { t } = useTranslation();
  const [save, setSave] = useState<PlayerState | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    const s = playerState.get();
    // Show regen notice if balls were topped up
    const prev = s.inventory.find((i) => i.itemId === "pokeball")?.quantity ?? 0;
    setSave(s);
    // Regen already applied in playerState.get() → load()
    const after = playerState.get().inventory.find((i) => i.itemId === "pokeball")?.quantity ?? 0;
    if (after > prev) setFlash(t.game.regenNotice(after - prev));
  }, [t]);

  if (!save) return null;

  function itemCount(itemId: string) {
    return save!.inventory.find((s) => s.itemId === itemId)?.quantity ?? 0;
  }

  function handleBuy(itemId: string) {
    const item = ITEM_CATALOGUE.find((i) => i.id === itemId);
    if (!item) return;
    const result = playerState.spendMoney(save!, item.price);
    if (!result.ok) {
      setFlash(t.game.shopNotEnoughMoney);
      return;
    }
    const next = playerState.addItem(result.state, item.id as import("@/lib/types").ItemId, 1);
    setSave(next);
    setFlash(t.game.shopBought(item.name));
  }

  const availableTrainers = TRAINERS.filter((tr) => tr.requiredBadges <= (save.badges ?? 0));

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.game.shopTitle}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t.game.shopSubtitle}</p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-yellow-600">₽{save.money.toLocaleString()}</div>
          <div className="text-xs text-gray-400">{t.game.balls}: {itemCount("pokeball") + itemCount("great-ball")}</div>
        </div>
      </div>

      {/* Flash message */}
      {flash && (
        <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          {flash}
          <button className="float-right text-green-400 hover:text-green-600" onClick={() => setFlash(null)}>✕</button>
        </div>
      )}

      {/* Items for sale */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</h2>
        <div className="space-y-3">
          {ITEM_CATALOGUE.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
            >
              {/* Item sprite */}
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-50 rounded-xl">
                <img
                  src={item.sprite}
                  alt={item.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain image-rendering-pixelated"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                <div className="text-xs text-gray-400 mt-0.5">{t.game.shopOwned(itemCount(item.id))}</div>
              </div>

              {/* Price + buy */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-sm font-bold text-yellow-600">₽{item.price}</span>
                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={save.money < item.price}
                  className="px-4 py-1.5 bg-red-500 text-white text-sm font-semibold rounded-full hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  type="button"
                >
                  {t.game.shopBuy}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trainer battle section */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">{t.game.trainerBattleTitle}</h2>
        <p className="text-xs text-gray-400 mb-3">{t.game.trainerBattleSubtitle}</p>
        <div className="space-y-3">
          {TRAINERS.map((trainer) => {
            const locked = (save.badges ?? 0) < trainer.requiredBadges;
            return (
              <div
                key={trainer.id}
                className={`flex items-center gap-4 border rounded-2xl p-4 shadow-sm transition-opacity ${locked ? "opacity-50 bg-gray-50 border-gray-200" : "bg-white border-gray-200"}`}
              >
                {/* Lead Pokémon sprite as trainer avatar */}
                <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-xl overflow-hidden">
                  <img
                    src={POKEMON_SPRITE(trainer.leadPokemonId)}
                    alt={trainer.name}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-contain image-rendering-pixelated"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800">{trainer.emoji} {trainer.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{trainer.intro}</div>
                  <div className="text-xs text-yellow-600 font-semibold mt-1">
                    {locked
                      ? t.game.trainerLocked(trainer.requiredBadges)
                      : t.game.trainerReward(trainer.reward)}
                  </div>
                </div>

                {/* Battle button */}
                {!locked && (
                  <Link
                    href={`/battle?trainer=${trainer.id}`}
                    className="px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-full hover:bg-blue-600 transition-colors flex-shrink-0"
                  >
                    {t.game.trainerChallenge}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-8 text-center">
        <Link href="/party" className="text-sm text-gray-400 hover:text-gray-600">← Party</Link>
      </div>
    </div>
  );
}
