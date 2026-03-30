import { TYPE_EFFECTIVENESS } from "./constants";
import { LocalPokemon } from "./types";
import { formatPokemonName } from "./api-client";
import type { TranslationDictionary } from "./i18n/en";

export interface BattleResult {
  winner: LocalPokemon;
  loser: LocalPokemon;
  reason: string;
  isTie: boolean;
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

  // Determine winner
  const scoreDiff = Math.abs(adjustedScore1 - adjustedScore2);
  const avgScore = (adjustedScore1 + adjustedScore2) / 2;
  const closeMatch = scoreDiff / avgScore < 0.05; // within 5%

  if (closeMatch) {
    // Very close - essentially a tie
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
    };
  }

  if (adjustedScore1 > adjustedScore2) {
    const reason = buildReason(name1, name2, types1, types2, multiplier1vs2, totalStats1, totalStats2, t);
    return { winner: pokemon1, loser: pokemon2, reason, isTie: false };
  } else {
    const reason = buildReason(name2, name1, types2, types1, multiplier2vs1, totalStats2, totalStats1, t);
    return { winner: pokemon2, loser: pokemon1, reason, isTie: false };
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
