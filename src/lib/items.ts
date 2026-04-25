/**
 * Item catalogue and use-item logic.
 */

import type { ItemDef, ItemId, OwnedPokemon } from "./types";

// ─── Catalogue ────────────────────────────────────────────────────────────────

const SPRITES = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

export const ITEM_CATALOGUE: ItemDef[] = [
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

/**
 * Apply a consumable item to a Pokémon.
 * Returns the updated Pokémon and a message for the UI.
 * Does NOT mutate player state — caller handles inventory deduction.
 */
export function applyItemToPokemon(
  itemId: ItemId,
  pokemon: OwnedPokemon
): UseItemResult {
  const item = ITEM_MAP[itemId];
  if (!item) return { ok: false, message: "Unknown item." };

  if (item.effect === "heal") {
    if (pokemon.currentHp >= pokemon.maxHp) {
      return { ok: false, message: `${formatName(pokemon.nickname)}'s HP is already full!` };
    }
    if (pokemon.currentHp <= 0) {
      return { ok: false, message: `${formatName(pokemon.nickname)} has fainted and can't be healed with a Potion!` };
    }
    const healed = Math.min(pokemon.maxHp, pokemon.currentHp + (item.healAmount ?? 20));
    const gained = healed - pokemon.currentHp;
    return {
      ok: true,
      message: `${formatName(pokemon.nickname)} recovered ${gained} HP!`,
      updatedPokemon: { ...pokemon, currentHp: healed },
    };
  }

  if (item.effect === "revive") {
    if (pokemon.currentHp > 0) {
      return { ok: false, message: `${formatName(pokemon.nickname)} hasn't fainted!` };
    }
    const reviveHp = Math.floor(pokemon.maxHp / 2);
    return {
      ok: true,
      message: `${formatName(pokemon.nickname)} was revived with ${reviveHp} HP!`,
      updatedPokemon: { ...pokemon, currentHp: reviveHp },
    };
  }

  return { ok: false, message: "This item can't be used here." };
}

function formatName(name: string): string {
  return name
    .split(/[-\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
