// English translation dictionary

export interface TranslationFeature {
  heading: string;
  text: string;
}

export interface TranslationDictionary {
  nav: {
    browse: string;
    battle: string;
    stats: string;
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
    // ── v0.2.1 interactive battle ──
    yourTurn: string;
    enemyTurn: string;
    chooseMove: string;
    pp: string;
    flee: string;
    fleeSuccess: string;
    fleeFail: string;
    fainted: (name: string) => string;
    xpGained: (name: string, xp: number) => string;
    levelUp: (name: string, level: number) => string;
    evolved: (from: string, to: string) => string;
    wildBattleTitle: (name: string) => string;
    playerWins: string;
    enemyWins: string;
    continueBtn: string;
    usePartyPokemon: string;
    noPP: string;
    critical: string;
    superEffectiveMsg: string;
    notVeryEffectiveMsg: string;
    noEffectMsg: string;
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
  statsExplorer: {
    title: string;
    subtitle: string;
    sortBy: string;
    sortOrder: string;
    highest: string;
    lowest: string;
    statRanges: string;
    total: string;
    min: string;
    max: string;
    results: (count: number, total: number) => string;
    noResults: string;
    rank: string;
    reset: string;
  };
  // ─── Game / v0.2 ──────────────────────────────────────────────────
  game: {
    // Starter selection
    starterTitle: string;
    starterSubtitle: string;
    starterChoose: string;
    starterConfirm: string;
    trainerNameLabel: string;
    trainerNamePlaceholder: string;
    // Party page
    partyTitle: string;
    partySubtitle: string;
    partySlot: (n: number) => string;
    partyEmpty: string;
    boxTitle: string;
    boxEmpty: string;
    moveToBox: string;
    moveToParty: string;
    release: string;
    releaseConfirm: (name: string) => string;
    // Wild page
    wildTitle: string;
    wildSubtitle: string;
    wildEncounter: (name: string) => string;
    wildAppeared: (name: string) => string;
    throwBall: string;
    flee: string;
    noPokeballsTitle: string;
    noPokeballsText: string;
    catchSuccess: (name: string) => string;
    catchFail: string;
    catchAdded: (name: string, location: string) => string;
    catchBoxed: (name: string) => string;
    partyFull: string;
    pokeballsLeft: (n: number) => string;
    // Wild encounter overlay (browsing page)
    wildOverlayTitle: string;
    wildOverlayText: (name: string) => string;
    wildOverlayCatch: string;
    wildOverlayIgnore: string;
    // Stats / XP
    level: string;
    xp: string;
    hp: string;
    maxHp: string;
    // Pokedex counts
    seen: string;
    caught: string;
    // General
    newGame: string;
    newGameConfirm: string;
    save: string;
    back: string;
    // Economy
    money: string;
    balls: string;
    // Shop
    shopTitle: string;
    shopSubtitle: string;
    shopBuy: string;
    shopBought: (name: string) => string;
    shopNotEnoughMoney: string;
    shopOwned: (n: number) => string;
    // Trainer battles
    trainerBattleTitle: string;
    trainerBattleSubtitle: string;
    trainerChallenge: string;
    trainerReward: (amount: number) => string;
    trainerWon: (name: string, reward: number) => string;
    trainerLocked: (badges: number) => string;
    badgeCount: (n: number) => string;
    // Item use (party page)
    useItem: string;
    itemUsed: (msg: string) => string;
    // Pokéball regen
    regenNotice: (n: number) => string;
    // Play page tabs
    tabParty: string;
    tabWild: string;
    tabTrainers: string;
    tabShop: string;
    tabClinic: string;
    // Clinic
    clinicTitle: string;
    clinicSubtitle: string;
    clinicHeal: string;
    clinicCost: (amount: number) => string;
    clinicHealed: string;
    clinicNoMoney: string;
    clinicAlreadyHealthy: string;
  };
}

export const en: TranslationDictionary = {
  // ─── Navigation ───────────────────────────────────────────────────
  nav: {
    browse: "Browse",
    battle: "Battle",
    stats: "Stats",
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
    // ── v0.2.1 interactive ────────────────────────────────────────
    yourTurn: "Your turn! Choose a move:",
    enemyTurn: "Enemy is thinking...",
    chooseMove: "Choose a move",
    pp: "PP",
    flee: "Flee",
    fleeSuccess: "Got away safely!",
    fleeFail: "Can't escape!",
    fainted: (name: string) => `${name} fainted!`,
    xpGained: (name: string, xp: number) => `${name} gained ${xp} XP!`,
    levelUp: (name: string, level: number) => `${name} grew to level ${level}!`,
    evolved: (from: string, to: string) => `${from} is evolving into ${to}!`,
    wildBattleTitle: (name: string) => `Wild ${name} appeared!`,
    playerWins: "You won the battle!",
    enemyWins: "You lost... Try again!",
    continueBtn: "Continue",
    usePartyPokemon: "Fight with your party",
    noPP: "No PP left — using Struggle!",
    critical: "A critical hit!",
    superEffectiveMsg: "It's super effective!",
    notVeryEffectiveMsg: "It's not very effective...",
    noEffectMsg: "It doesn't affect",
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

  // ─── Stats Explorer page ─────────────────────────────────────────
  statsExplorer: {
    title: "Stats Explorer",
    subtitle: "Find Pokémon by their stats",
    sortBy: "Sort by",
    sortOrder: "Order",
    highest: "Highest first",
    lowest: "Lowest first",
    statRanges: "Stat Ranges",
    total: "Total",
    min: "Min",
    max: "Max",
    results: (count: number, total: number) =>
      `Showing ${count} of ${total} Pokémon`,
    noResults: "No Pokémon match these filters. Try widening the ranges!",
    rank: "#",
    reset: "Reset",
  },

  // ─── Game / v0.2 ─────────────────────────────────────────────────
  game: {
    starterTitle: "Choose Your Starter Pokémon!",
    starterSubtitle: "Pick one of these three to begin your adventure.",
    starterChoose: "Choose",
    starterConfirm: "Start Adventure!",
    trainerNameLabel: "Your Trainer Name",
    trainerNamePlaceholder: "Enter your name...",
    partyTitle: "My Party",
    partySubtitle: "Your active Pokémon team",
    partySlot: (n: number) => `Slot ${n}`,
    partyEmpty: "Empty slot",
    boxTitle: "PC Box",
    boxEmpty: "Your PC box is empty.",
    moveToBox: "Send to Box",
    moveToParty: "Add to Party",
    release: "Release",
    releaseConfirm: (name: string) =>
      `Are you sure you want to release ${name}? This cannot be undone.`,
    wildTitle: "Wild Area",
    wildSubtitle: "Walk through the tall grass and find wild Pokémon!",
    wildEncounter: (name: string) => `A wild ${name} appeared!`,
    wildAppeared: (name: string) => `${name} is waiting...`,
    throwBall: "Throw Pokéball!",
    flee: "Run Away",
    noPokeballsTitle: "No Pokéballs!",
    noPokeballsText: "You don't have any Pokéballs. You'll need to find more!",
    catchSuccess: (name: string) => `Gotcha! ${name} was caught!`,
    catchFail: "Oh no! The Pokémon broke free!",
    catchAdded: (name: string, location: string) =>
      `${name} was added to your party from ${location}!`,
    catchBoxed: (name: string) =>
      `Your party is full! ${name} was sent to your PC box.`,
    partyFull: "Party is full! Send a Pokémon to the box first.",
    pokeballsLeft: (n: number) => `${n} Pokéball${n === 1 ? "" : "s"} left`,
    wildOverlayTitle: "Wild Pokémon!",
    wildOverlayText: (name: string) => `A wild ${name} is nearby!`,
    wildOverlayCatch: "Try to Catch!",
    wildOverlayIgnore: "Ignore",
    level: "Lv.",
    xp: "XP",
    hp: "HP",
    maxHp: "Max HP",
    seen: "Seen",
    caught: "Caught",
    newGame: "New Game",
    newGameConfirm: "Start a new game? All progress will be lost!",
    save: "Saved",
    back: "Back",
    // Economy
    money: "₽",
    balls: "Balls",
    // Shop
    shopTitle: "Poké Mart",
    shopSubtitle: "Stock up before heading out!",
    shopBuy: "Buy",
    shopBought: (name: string) => `Bought ${name}!`,
    shopNotEnoughMoney: "Not enough PokéDollars!",
    shopOwned: (n: number) => `You have: ${n}`,
    // Trainer battles
    trainerBattleTitle: "Trainer Battles",
    trainerBattleSubtitle: "Challenge trainers to earn PokéDollars!",
    trainerChallenge: "Battle!",
    trainerReward: (amount: number) => `₽${amount}`,
    trainerWon: (name: string, reward: number) => `You beat ${name} and earned ₽${reward}!`,
    trainerLocked: (badges: number) => `Need ${badges} badge${badges === 1 ? "" : "s"}`,
    badgeCount: (n: number) => `${n} badge${n === 1 ? "" : "s"}`,
    // Item use (party page)
    useItem: "Use Item",
    itemUsed: (msg: string) => msg,
    // Pokéball regen
    regenNotice: (n: number) => `You received ${n} free Pokéballs!`,
    // Play page tabs
    tabParty: "Party",
    tabWild: "Wild",
    tabTrainers: "Trainers",
    tabShop: "Shop",
    tabClinic: "Clinic",
    // Clinic
    clinicTitle: "Pokémon Clinic",
    clinicSubtitle: "Heal all your Pokémon for a flat fee.",
    clinicHeal: "Heal All",
    clinicCost: (amount: number) => `Cost: ₽${amount}`,
    clinicHealed: "All Pokémon healed!",
    clinicNoMoney: "Not enough PokéDollars!",
    clinicAlreadyHealthy: "All Pokémon are already healthy!",
  },
};
