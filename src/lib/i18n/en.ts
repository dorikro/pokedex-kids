// English translation dictionary

export interface TranslationFeature {
  heading: string;
  text: string;
}

export interface TranslationDictionary {
  nav: {
    browse: string;
    battle: string;
    about: string;
    brand: string;
    brandSuffix: string;
  };
  home: {
    loading: string;
    empty: string;
    loadMore: string;
    loadingMore: string;
  };
  search: {
    placeholder: string;
  };
  generations: {
    all: string;
    genI: string;
    genII: string;
    genIII: string;
    genIV: string;
    genV: string;
    genVI: string;
    genVII: string;
    genVIII: string;
    genIX: string;
  };
  typeFilter: {
    label: string;
    clearAll: string;
  };
  types: Record<string, string>;
  detail: {
    loading: string;
    notFound: string;
    error: string;
    backToBrowse: string;
    back: string;
    info: string;
    height: string;
    weight: string;
    generation: string;
    pokedexEntry: string;
    stats: string;
    total: string;
    abilities: string;
    hidden: string;
    evolution: string;
    officialArtwork: string;
  };
  stats: Record<string, string>;
  battle: {
    title: string;
    subtitle: string;
    pokemon1: string;
    pokemon2: string;
    vs: string;
    fight: string;
    searchPlaceholder: string;
    searchNotFound: string;
    typeNameOrNumber: string;
    samePokemon: string;
    closeMatch: string;
    wins: (name: string) => string;
    totalStats: string;
    typeEffectiveness: string;
    adjustedScore: string;
    superEffective: string;
    notVeryEffective: string;
    noEffect: string;
    neutral: string;
    statComparison: string;
    breakdown: string;
    winsStatCount: (name: string, count: number, total: number) => string;
  };
  battleReasons: {
    tieReason: (winner: string, loser: string) => string;
    typeAndStats: (winner: string, winnerTypes: string, loser: string, loserTypes: string) => string;
    typeOnly: (winner: string, winnerTypes: string, loser: string, loserTypes: string) => string;
    statsOnly: (winner: string, loser: string) => string;
    slightEdge: (winner: string, loser: string) => string;
  };
  speak: {
    title: (name: string) => string;
    ariaLabel: (name: string) => string;
  };
  about: {
    title: string;
    welcome: string;
    description: string;
    whatCanYouDo: string;
    features: TranslationFeature[];
    funFact: string;
    funFactText: string;
    builtWith: string;
  };
  meta: {
    title: string;
    description: string;
    aboutTitle: string;
    aboutDescription: string;
  };
  language: {
    en: string;
    he: string;
    switchLabel: string;
  };
}

export const en: TranslationDictionary = {
  // ─── Navigation ───────────────────────────────────────────────────
  nav: {
    browse: "Browse",
    battle: "Battle",
    about: "About",
    brand: "Pokédex",
    brandSuffix: "Kids",
  },

  // ─── Home page ────────────────────────────────────────────────────
  home: {
    loading: "Loading Pokémon...",
    empty: "No Pokémon found. Try a different search!",
    loadMore: "Load More",
    loadingMore: "Loading...",
  },

  // ─── Search ───────────────────────────────────────────────────────
  search: {
    placeholder: "Search by name or number...",
  },

  // ─── Generation tabs ─────────────────────────────────────────────
  generations: {
    all: "All",
    genI: "Gen I",
    genII: "Gen II",
    genIII: "Gen III",
    genIV: "Gen IV",
    genV: "Gen V",
    genVI: "Gen VI",
    genVII: "Gen VII",
    genVIII: "Gen VIII",
    genIX: "Gen IX",
  },

  // ─── Type filter ──────────────────────────────────────────────────
  typeFilter: {
    label: "Filter by type:",
    clearAll: "Clear all",
  },

  // ─── Pokemon type names ───────────────────────────────────────────
  types: {
    normal: "Normal",
    fire: "Fire",
    water: "Water",
    electric: "Electric",
    grass: "Grass",
    ice: "Ice",
    fighting: "Fighting",
    poison: "Poison",
    ground: "Ground",
    flying: "Flying",
    psychic: "Psychic",
    bug: "Bug",
    rock: "Rock",
    ghost: "Ghost",
    dragon: "Dragon",
    dark: "Dark",
    steel: "Steel",
    fairy: "Fairy",
  },

  // ─── Pokemon detail page ─────────────────────────────────────────
  detail: {
    loading: "Loading Pokémon...",
    notFound: "Pokémon not found",
    error: "Could not find that Pokémon. Please try again!",
    backToBrowse: "Back to Browse",
    back: "Back",
    info: "Info",
    height: "Height",
    weight: "Weight",
    generation: "Generation",
    pokedexEntry: "Pokédex Entry",
    stats: "Stats",
    total: "Total",
    abilities: "Abilities",
    hidden: "Hidden",
    evolution: "Evolution",
    officialArtwork: "Official Artwork",
  },

  // ─── Stat names ───────────────────────────────────────────────────
  stats: {
    hp: "HP",
    attack: "Attack",
    defense: "Defense",
    "special-attack": "Sp. Atk",
    "special-defense": "Sp. Def",
    speed: "Speed",
  },

  // ─── Battle page ──────────────────────────────────────────────────
  battle: {
    title: "Battle!",
    subtitle: "Pick two Pokémon and see who wins",
    pokemon1: "Pokémon 1",
    pokemon2: "Pokémon 2",
    vs: "VS",
    fight: "Fight!",
    searchPlaceholder: "Name or number...",
    searchNotFound: "Pokémon not found! Check the name or number.",
    typeNameOrNumber: "Type a name or number",
    samePokemon: "Pick two different Pokémon to battle!",
    closeMatch: "Close Match!",
    wins: (name: string) => `${name} Wins!`,
    totalStats: "Total Stats",
    typeEffectiveness: "Type Effectiveness",
    adjustedScore: "Adjusted Score",
    superEffective: "Super effective",
    notVeryEffective: "Not very effective",
    noEffect: "No effect",
    neutral: "Neutral",
    statComparison: "Stat Comparison",
    breakdown: "Battle Breakdown",
    winsStatCount: (name: string, count: number, total: number) =>
      `${name} wins ${count} of ${total} stats`,
  },

  // ─── Battle reasons ───────────────────────────────────────────────
  battleReasons: {
    tieReason: (winner: string, loser: string) =>
      `It's a super close match! ${winner} barely edges out ${loser}.`,
    typeAndStats: (winner: string, winnerTypes: string, loser: string, loserTypes: string) =>
      `${winner} wins! ${winnerTypes} is super effective against ${loser}'s ${loserTypes} type, and ${winner} has stronger stats too!`,
    typeOnly: (winner: string, winnerTypes: string, loser: string, loserTypes: string) =>
      `${winner} wins! ${winnerTypes} is super effective against ${loser}'s ${loserTypes} type, which overcomes the stats difference!`,
    statsOnly: (winner: string, loser: string) =>
      `${winner} wins! Its stats are much stronger than ${loser}'s, even without a type advantage!`,
    slightEdge: (winner: string, loser: string) =>
      `${winner} wins with a slight overall edge over ${loser}!`,
  },

  // ─── Speak button ─────────────────────────────────────────────────
  speak: {
    title: (name: string) => `Hear "${name}"`,
    ariaLabel: (name: string) => `Speak ${name}`,
  },

  // ─── About page ──────────────────────────────────────────────────
  about: {
    title: "What is Pokédex Kids?",
    welcome: "Welcome to Pokédex Kids!",
    description:
      "Pokédex Kids is a fun and easy-to-use Pokémon encyclopedia made just for kids (and anyone who loves Pokémon!). You can explore all the Pokémon from every generation, learn cool facts about each one, and even battle them against each other!",
    whatCanYouDo: "What can you do here?",
    features: [
      {
        heading: "Browse Pokémon",
        text: "Scroll through all 1,025 Pokémon! You can search by name or number, filter by type (like Fire, Water, or Dragon), and explore different generations.",
      },
      {
        heading: "Learn About Each Pokémon",
        text: "Tap on any Pokémon to see its stats, abilities, type, height, weight, Pokédex entry, evolution chain, and official artwork.",
      },
      {
        heading: "Battle!",
        text: "Pick two Pokémon and see who would win in a battle! The app uses real stats and type advantages to figure out the winner.",
      },
      {
        heading: "Hear Their Names",
        text: "Press the speaker button on a Pokémon's page to hear its name spoken out loud!",
      },
    ],
    funFact: "Fun fact",
    funFactText:
      "There are over 1,000 Pokémon in this app, going all the way from Bulbasaur (#0001) to Pecharunt (#1025)!",
    builtWith: "Built with care for curious kids everywhere.",
  },

  // ─── Metadata ─────────────────────────────────────────────────────
  meta: {
    title: "Pokédex Kids",
    description: "A fun Pokémon encyclopedia for kids!",
    aboutTitle: "About | Pokédex Kids",
    aboutDescription: "About this project — a kid-friendly Pokémon encyclopedia.",
  },

  // ─── Language switcher ────────────────────────────────────────────
  language: {
    en: "EN",
    he: "HE",
    switchLabel: "Language",
  },
};
