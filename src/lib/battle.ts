import { TYPE_EFFECTIVENESS } from "./constants";
import { LocalPokemon } from "./types";
import { formatPokemonName } from "./api-client";
import type { TranslationDictionary } from "./i18n/en";

export interface StatComparison {
  name: string;       // raw stat name (e.g. "hp", "attack")
  stat1: number;      // pokemon1's value
  stat2: number;      // pokemon2's value
  winner: 1 | 2 | 0;  // which pokemon wins this stat (0 = tie)
}

export interface BattleBreakdown {
  totalStats1: number;
  totalStats2: number;
  typeMultiplier1vs2: number;
  typeMultiplier2vs1: number;
  adjustedScore1: number;
  adjustedScore2: number;
  statComparisons: StatComparison[];
  statsWon1: number;   // how many individual stats pokemon1 wins
  statsWon2: number;
}

export interface BattleResult {
  winner: LocalPokemon;
  loser: LocalPokemon;
  reason: string;
  isTie: boolean;
  pokemon1: LocalPokemon;
  pokemon2: LocalPokemon;
  breakdown: BattleBreakdown;
}

// Calculate type effectiveness multiplier for attacker vs defender
function getTypeMultiplier(attackerTypes: string[], defenderTypes: string[]): number {
  let bestMultiplier = 1;

  for (const atkType of attackerTypes) {
    let multiplier = 1;
    for (const defType of defenderTypes) {
      const effectiveness = TYPE_EFFECTIVENESS[atkType]?.[defType];
      if (effectiveness !== undefined) {
        multiplier *= effectiveness;
      }
    }
    bestMultiplier = Math.max(bestMultiplier, multiplier);
  }

  return bestMultiplier;
}

// Get total base stats
function getTotalStats(pokemon: LocalPokemon): number {
  return pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
}

// Build per-stat comparisons
function buildStatComparisons(p1: LocalPokemon, p2: LocalPokemon): StatComparison[] {
  const statNames = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];

  return statNames.map((name) => {
    const s1 = p1.stats.find((s) => s.name === name)?.base_stat ?? 0;
    const s2 = p2.stats.find((s) => s.name === name)?.base_stat ?? 0;
    return {
      name,
      stat1: s1,
      stat2: s2,
      winner: s1 > s2 ? 1 : s2 > s1 ? 2 : 0,
    };
  });
}

export function calculateBattle(pokemon1: LocalPokemon, pokemon2: LocalPokemon, t: TranslationDictionary): BattleResult {
  const types1 = pokemon1.types;
  const types2 = pokemon2.types;

  // Calculate type advantage multipliers
  const multiplier1vs2 = getTypeMultiplier(types1, types2);
  const multiplier2vs1 = getTypeMultiplier(types2, types1);

  // Get base stat totals
  const totalStats1 = getTotalStats(pokemon1);
  const totalStats2 = getTotalStats(pokemon2);

  // Apply type effectiveness to stats
  const adjustedScore1 = totalStats1 * multiplier1vs2;
  const adjustedScore2 = totalStats2 * multiplier2vs1;

  const name1 = formatPokemonName(pokemon1.name);
  const name2 = formatPokemonName(pokemon2.name);

  // Build stat comparisons
  const statComparisons = buildStatComparisons(pokemon1, pokemon2);
  const statsWon1 = statComparisons.filter((s) => s.winner === 1).length;
  const statsWon2 = statComparisons.filter((s) => s.winner === 2).length;

  const breakdown: BattleBreakdown = {
    totalStats1,
    totalStats2,
    typeMultiplier1vs2: multiplier1vs2,
    typeMultiplier2vs1: multiplier2vs1,
    adjustedScore1: Math.round(adjustedScore1),
    adjustedScore2: Math.round(adjustedScore2),
    statComparisons,
    statsWon1,
    statsWon2,
  };

  // Determine winner
  const scoreDiff = Math.abs(adjustedScore1 - adjustedScore2);
  const avgScore = (adjustedScore1 + adjustedScore2) / 2;
  const closeMatch = scoreDiff / avgScore < 0.05; // within 5%

  if (closeMatch) {
    const slightWinner = adjustedScore1 >= adjustedScore2 ? pokemon1 : pokemon2;
    const slightLoser = slightWinner === pokemon1 ? pokemon2 : pokemon1;
    return {
      winner: slightWinner,
      loser: slightLoser,
      reason: t.battleReasons.tieReason(
        formatPokemonName(slightWinner.name),
        formatPokemonName(slightLoser.name)
      ),
      isTie: true,
      pokemon1,
      pokemon2,
      breakdown,
    };
  }

  if (adjustedScore1 > adjustedScore2) {
    const reason = buildReason(name1, name2, types1, types2, multiplier1vs2, totalStats1, totalStats2, t);
    return { winner: pokemon1, loser: pokemon2, reason, isTie: false, pokemon1, pokemon2, breakdown };
  } else {
    const reason = buildReason(name2, name1, types2, types1, multiplier2vs1, totalStats2, totalStats1, t);
    return { winner: pokemon2, loser: pokemon1, reason, isTie: false, pokemon1, pokemon2, breakdown };
  }
}

function buildReason(
  winnerName: string,
  loserName: string,
  winnerTypes: string[],
  loserTypes: string[],
  typeMultiplier: number,
  winnerStats: number,
  loserStats: number,
  t: TranslationDictionary
): string {
  const hasTypeAdvantage = typeMultiplier > 1;
  const hasStatsAdvantage = winnerStats > loserStats;

  if (hasTypeAdvantage && hasStatsAdvantage) {
    return t.battleReasons.typeAndStats(winnerName, winnerTypes.join("/"), loserName, loserTypes.join("/"));
  }

  if (hasTypeAdvantage) {
    return t.battleReasons.typeOnly(winnerName, winnerTypes.join("/"), loserName, loserTypes.join("/"));
  }

  if (hasStatsAdvantage) {
    return t.battleReasons.statsOnly(winnerName, loserName);
  }

  return t.battleReasons.slightEdge(winnerName, loserName);
}
