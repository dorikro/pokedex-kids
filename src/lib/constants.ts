// Pokemon type colors for tags
export const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: "bg-stone-200", text: "text-stone-800", border: "border-stone-300" },
  fire: { bg: "bg-red-200", text: "text-red-800", border: "border-red-300" },
  water: { bg: "bg-blue-200", text: "text-blue-800", border: "border-blue-300" },
  electric: { bg: "bg-yellow-200", text: "text-yellow-800", border: "border-yellow-300" },
  grass: { bg: "bg-green-200", text: "text-green-800", border: "border-green-300" },
  ice: { bg: "bg-cyan-200", text: "text-cyan-800", border: "border-cyan-300" },
  fighting: { bg: "bg-orange-200", text: "text-orange-800", border: "border-orange-300" },
  poison: { bg: "bg-purple-200", text: "text-purple-800", border: "border-purple-300" },
  ground: { bg: "bg-amber-200", text: "text-amber-800", border: "border-amber-300" },
  flying: { bg: "bg-indigo-200", text: "text-indigo-800", border: "border-indigo-300" },
  psychic: { bg: "bg-pink-200", text: "text-pink-800", border: "border-pink-300" },
  bug: { bg: "bg-lime-200", text: "text-lime-800", border: "border-lime-300" },
  rock: { bg: "bg-yellow-300", text: "text-yellow-900", border: "border-yellow-400" },
  ghost: { bg: "bg-violet-200", text: "text-violet-800", border: "border-violet-300" },
  dragon: { bg: "bg-indigo-300", text: "text-indigo-900", border: "border-indigo-400" },
  dark: { bg: "bg-gray-400", text: "text-gray-900", border: "border-gray-500" },
  steel: { bg: "bg-slate-300", text: "text-slate-800", border: "border-slate-400" },
  fairy: { bg: "bg-pink-200", text: "text-pink-800", border: "border-pink-300" },
};

// All Pokemon types
export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
];

// Generation info with Pokemon ID ranges
export const GENERATIONS = [
  { id: 1, name: "generation-i", label: "Gen I", range: [1, 151] as [number, number] },
  { id: 2, name: "generation-ii", label: "Gen II", range: [152, 251] as [number, number] },
  { id: 3, name: "generation-iii", label: "Gen III", range: [252, 386] as [number, number] },
  { id: 4, name: "generation-iv", label: "Gen IV", range: [387, 493] as [number, number] },
  { id: 5, name: "generation-v", label: "Gen V", range: [494, 649] as [number, number] },
  { id: 6, name: "generation-vi", label: "Gen VI", range: [650, 721] as [number, number] },
  { id: 7, name: "generation-vii", label: "Gen VII", range: [722, 809] as [number, number] },
  { id: 8, name: "generation-viii", label: "Gen VIII", range: [810, 905] as [number, number] },
  { id: 9, name: "generation-ix", label: "Gen IX", range: [906, 1025] as [number, number] },
];

// Stat display names
export const STAT_NAMES: Record<string, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Sp. Atk",
  "special-defense": "Sp. Def",
  speed: "Speed",
};

// Stat colors for bars
export const STAT_COLORS: Record<string, string> = {
  hp: "bg-red-400",
  attack: "bg-orange-400",
  defense: "bg-yellow-400",
  "special-attack": "bg-blue-400",
  "special-defense": "bg-green-400",
  speed: "bg-pink-400",
};

// Type effectiveness chart for battle mode
// effectiveness[attacking][defending] = multiplier
export const TYPE_EFFECTIVENESS: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};
