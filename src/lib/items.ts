/**
 * Item catalogue and use-item logic — v0.2.4
 *
 * New in v0.2.4: status-cure items (Antidote, Burn Heal, Awakening,
 * Paralyze Heal, Ice Heal, Full Heal).
 */

import type { ItemDef, ItemId, OwnedPokemon, StatusCondition } from "./types";

// ─── Catalogue ────────────────────────────────────────────────────────────────

const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

export const ITEM_CATALOGUE: ItemDef[] = [
  // ── Poké Balls ────────────────────────────────────────────────────────────
  {
    id: "pokeball",
    name: "Pokéball",
    description: "A basic ball for catching wild Pokémon.",
    price: 200,
    emoji: "🎾",
    sprite: `${SPRITES}/poke-ball.png`,
    effect: "catch",
    catchModifier: 1,
  },
  {
    id: "great-ball",
    name: "Great Ball",
    description: "A higher-performance ball with a better catch rate.",
    price: 600,
    emoji: "🔵",
    sprite: `${SPRITES}/great-ball.png`,
    effect: "catch",
    catchModifier: 1.5,
  },
  // ── Healing items ─────────────────────────────────────────────────────────
  {
    id: "potion",
    name: "Potion",
    description: "Restores 20 HP to one Pokémon.",
    price: 300,
    emoji: "🧪",
    sprite: `${SPRITES}/potion.png`,
    effect: "heal",
    healAmount: 20,
  },
  {
    id: "super-potion",
    name: "Super Potion",
    description: "Restores 50 HP to one Pokémon.",
    price: 700,
    emoji: "💊",
    sprite: `${SPRITES}/super-potion.png`,
    effect: "heal",
    healAmount: 50,
  },
  {
    id: "revive",
    name: "Revive",
    description: "Revives a fainted Pokémon with half its max HP.",
    price: 1500,
    emoji: "⭐",
    sprite: `${SPRITES}/revive.png`,
    effect: "revive",
  },
  // ── Status cures ──────────────────────────────────────────────────────────
  {
    id: "antidote",
    name: "Antidote",
    description: "Cures a poisoned Pokémon.",
    price: 100,
    emoji: "🟣",
    sprite: `${SPRITES}/antidote.png`,
    effect: "cure_status",
    curesStatus: "poison",
  },
  {
    id: "burn-heal",
    name: "Burn Heal",
    description: "Heals a burned Pokémon.",
    price: 250,
    emoji: "🔥",
    sprite: `${SPRITES}/burn-heal.png`,
    effect: "cure_status",
    curesStatus: "burn",
  },
  {
    id: "awakening",
    name: "Awakening",
    description: "Wakes up a sleeping Pokémon.",
    price: 250,
    emoji: "💤",
    sprite: `${SPRITES}/awakening.png`,
    effect: "cure_status",
    curesStatus: "sleep",
  },
  {
    id: "paralyze-heal",
    name: "Paralyze Heal",
    description: "Cures a paralysed Pokémon.",
    price: 200,
    emoji: "⚡",
    sprite: `${SPRITES}/parlyz-heal.png`,
    effect: "cure_status",
    curesStatus: "paralysis",
  },
  {
    id: "ice-heal",
    name: "Ice Heal",
    description: "Thaws a frozen Pokémon.",
    price: 250,
    emoji: "🧊",
    sprite: `${SPRITES}/ice-heal.png`,
    effect: "cure_status",
    curesStatus: "freeze",
  },
  {
    id: "full-heal",
    name: "Full Heal",
    description: "Cures any status condition.",
    price: 600,
    emoji: "✨",
    sprite: `${SPRITES}/full-heal.png`,
    effect: "cure_status",
    curesStatus: null, // null = cures any
  },
];

export const ITEM_MAP = Object.fromEntries(
  ITEM_CATALOGUE.map((i) => [i.id, i])
) as Record<ItemId, ItemDef>;

// ─── Use-item logic ───────────────────────────────────────────────────────────

export interface UseItemResult {
  ok: boolean;
  message: string;
  updatedPokemon?: OwnedPokemon;
}

export function applyItemToPokemon(itemId: ItemId, pokemon: OwnedPokemon): UseItemResult {
  const item = ITEM_MAP[itemId];
  if (!item) return { ok: false, message: "Unknown item." };

  if (item.effect === "heal") {
    if (pokemon.currentHp >= pokemon.maxHp)
      return { ok: false, message: `${formatName(pokemon.nickname)}'s HP is already full!` };
    if (pokemon.currentHp <= 0)
      return { ok: false, message: `${formatName(pokemon.nickname)} has fainted — use a Revive first!` };
    const healed = Math.min(pokemon.maxHp, pokemon.currentHp + (item.healAmount ?? 20));
    const gained = healed - pokemon.currentHp;
    return {
      ok: true,
      message: `${formatName(pokemon.nickname)} recovered ${gained} HP!`,
      updatedPokemon: { ...pokemon, currentHp: healed },
    };
  }

  if (item.effect === "revive") {
    if (pokemon.currentHp > 0)
      return { ok: false, message: `${formatName(pokemon.nickname)} hasn't fainted!` };
    const reviveHp = Math.floor(pokemon.maxHp / 2);
    return {
      ok: true,
      message: `${formatName(pokemon.nickname)} was revived with ${reviveHp} HP!`,
      updatedPokemon: { ...pokemon, currentHp: reviveHp },
    };
  }

  if (item.effect === "cure_status") {
    if (!pokemon.statusCondition)
      return { ok: false, message: `${formatName(pokemon.nickname)} has no status condition!` };
    // Specific cure must match
    if (item.curesStatus !== null && item.curesStatus !== pokemon.statusCondition) {
      const label: Record<StatusCondition, string> = {
        poison: "poisoned", burn: "burned", sleep: "asleep", paralysis: "paralysed", freeze: "frozen",
      };
      return { ok: false, message: `${formatName(pokemon.nickname)} is ${label[pokemon.statusCondition]}, not ${item.curesStatus}!` };
    }
    const statusLabel: Record<StatusCondition, string> = {
      poison: "cured of poison", burn: "healed of burn", sleep: "awakened",
      paralysis: "cured of paralysis", freeze: "thawed out",
    };
    return {
      ok: true,
      message: `${formatName(pokemon.nickname)} was ${statusLabel[pokemon.statusCondition]}!`,
      updatedPokemon: { ...pokemon, statusCondition: null, statusTurnsLeft: 0 },
    };
  }

  return { ok: false, message: "This item can't be used here." };
}

function formatName(name: string): string {
  return name.split(/[-\s]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
