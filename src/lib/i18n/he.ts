// Hebrew translation dictionary
import type { TranslationDictionary } from "./en";

export const he: TranslationDictionary = {
  // ─── Navigation ───────────────────────────────────────────────────
  nav: {
    browse: "עיון",
    battle: "קרב",
    stats: "סטטיסטיקות",
    about: "אודות",
    brand: "Pokédex",
    brandSuffix: "ילדים",
  },

  // ─── Home page ────────────────────────────────────────────────────
  home: {
    loading: "...טוען פוקימונים",
    empty: "לא נמצאו פוקימונים. נסו חיפוש אחר!",
    loadMore: "טען עוד",
    loadingMore: "...טוען",
  },

  // ─── Search ───────────────────────────────────────────────────────
  search: {
    placeholder: "...חפשו לפי שם או מספר",
  },

  // ─── Generation tabs ─────────────────────────────────────────────
  generations: {
    all: "הכל",
    genI: "דור I",
    genII: "דור II",
    genIII: "דור III",
    genIV: "דור IV",
    genV: "דור V",
    genVI: "דור VI",
    genVII: "דור VII",
    genVIII: "דור VIII",
    genIX: "דור IX",
  },

  // ─── Type filter ──────────────────────────────────────────────────
  typeFilter: {
    label: ":סינון לפי סוג",
    clearAll: "נקה הכל",
  },

  // ─── Pokemon type names ───────────────────────────────────────────
  types: {
    normal: "רגיל",
    fire: "אש",
    water: "מים",
    electric: "חשמל",
    grass: "דשא",
    ice: "קרח",
    fighting: "לחימה",
    poison: "רעל",
    ground: "אדמה",
    flying: "מעופף",
    psychic: "פסיכי",
    bug: "חרק",
    rock: "סלע",
    ghost: "רוח",
    dragon: "דרקון",
    dark: "חושך",
    steel: "פלדה",
    fairy: "פיה",
  },

  // ─── Pokemon detail page ─────────────────────────────────────────
  detail: {
    loading: "...טוען פוקימון",
    notFound: "הפוקימון לא נמצא",
    error: "לא הצלחנו למצוא את הפוקימון. נסו שוב!",
    backToBrowse: "חזרה לעיון",
    back: "חזרה",
    info: "מידע",
    height: "גובה",
    weight: "משקל",
    generation: "דור",
    pokedexEntry: "ערך בפוקדקס",
    stats: "סטטיסטיקות",
    total: "סה״כ",
    abilities: "יכולות",
    hidden: "מוסתר",
    evolution: "אבולוציה",
    officialArtwork: "איור רשמי",
  },

  // ─── Stat names ───────────────────────────────────────────────────
  stats: {
    hp: "HP",
    attack: "התקפה",
    defense: "הגנה",
    "special-attack": "התק׳ מיוח׳",
    "special-defense": "הג׳ מיוח׳",
    speed: "מהירות",
  },

  // ─── Battle page ──────────────────────────────────────────────────
  battle: {
    title: "קרב!",
    subtitle: "בחרו שני פוקימונים וגלו מי מנצח",
    pokemon1: "פוקימון 1",
    pokemon2: "פוקימון 2",
    vs: "נגד",
    fight: "להילחם!",
    searchPlaceholder: "...שם או מספר",
    searchNotFound: "פוקימון לא נמצא! בדקו את השם או המספר.",
    typeNameOrNumber: "הקלידו שם או מספר",
    samePokemon: "בחרו שני פוקימונים שונים לקרב!",
    closeMatch: "קרב צמוד!",
    wins: (name: string) => `${name} מנצח!`,
    totalStats: "סה״כ סטטיסטיקות",
    typeEffectiveness: "יעילות סוג",
    adjustedScore: "ניקוד מותאם",
    superEffective: "אפקטיבי במיוחד",
    notVeryEffective: "לא כל כך אפקטיבי",
    noEffect: "ללא השפעה",
    neutral: "נייטרלי",
    statComparison: "השוואת סטטיסטיקות",
    breakdown: "פירוט הקרב",
    winsStatCount: (name: string, count: number, total: number) =>
      `${name} מנצח ב-${count} מתוך ${total} סטטיסטיקות`,
  },

  // ─── Battle reasons ───────────────────────────────────────────────
  battleReasons: {
    tieReason: (winner: string, loser: string) =>
      `זה קרב צמוד מאוד! ${winner} מנצח בקושי את ${loser}.`,
    typeAndStats: (winner: string, winnerTypes: string, loser: string, loserTypes: string) =>
      `${winner} מנצח! סוג ${winnerTypes} אפקטיבי במיוחד נגד סוג ${loserTypes} של ${loser}, ובנוסף ל-${winner} יש סטטיסטיקות חזקות יותר!`,
    typeOnly: (winner: string, winnerTypes: string, loser: string, loserTypes: string) =>
      `${winner} מנצח! סוג ${winnerTypes} אפקטיבי במיוחד נגד סוג ${loserTypes} של ${loser}, מה שמפצה על הפרש הסטטיסטיקות!`,
    statsOnly: (winner: string, loser: string) =>
      `${winner} מנצח! הסטטיסטיקות שלו חזקות בהרבה מאלו של ${loser}, גם ללא יתרון סוג!`,
    slightEdge: (winner: string, loser: string) =>
      `${winner} מנצח עם יתרון קל על ${loser}!`,
  },

  // ─── Speak button ─────────────────────────────────────────────────
  speak: {
    title: (name: string) => `שמעו "${name}"`,
    ariaLabel: (name: string) => `הקראת ${name}`,
  },

  // ─── About page ──────────────────────────────────────────────────
  about: {
    title: "מהו Pokédex Kids?",
    welcome: "!ברוכים הבאים ל-Pokédex Kids",
    description:
      "Pokédex Kids הוא אנציקלופדיית פוקימונים כייפית וקלה לשימוש, שנבנתה במיוחד לילדים (ולכל מי שאוהב פוקימונים!). אפשר לגלות את כל הפוקימונים מכל הדורות, ללמוד עובדות מגניבות על כל אחד, ואפילו להילחם בהם אחד נגד השני!",
    whatCanYouDo: "מה אפשר לעשות כאן?",
    features: [
      {
        heading: "עיון בפוקימונים",
        text: "גללו בין כל 1,025 הפוקימונים! אפשר לחפש לפי שם או מספר, לסנן לפי סוג (כמו אש, מים או דרקון), ולחקור דורות שונים.",
      },
      {
        heading: "למדו על כל פוקימון",
        text: "לחצו על כל פוקימון כדי לראות את הסטטיסטיקות, היכולות, הסוג, הגובה, המשקל, ערך הפוקדקס, שרשרת האבולוציה והאיור הרשמי.",
      },
      {
        heading: "קרב!",
        text: "בחרו שני פוקימונים וגלו מי ינצח בקרב! האפליקציה משתמשת בסטטיסטיקות אמיתיות ויתרונות סוג כדי לקבוע את המנצח.",
      },
      {
        heading: "שמעו את השמות שלהם",
        text: "לחצו על כפתור הרמקול בדף של פוקימון כדי לשמוע את שמו בקול רם!",
      },
    ],
    funFact: "עובדה מעניינת",
    funFactText:
      "יש מעל 1,000 פוקימונים באפליקציה הזו, מ-Bulbasaur (#0001) ועד Pecharunt (#1025)!",
    builtWith: "נבנה באהבה לילדים סקרנים בכל מקום.",
  },

  // ─── Metadata ─────────────────────────────────────────────────────
  meta: {
    title: "Pokédex Kids",
    description: "!אנציקלופדיית פוקימונים כייפית לילדים",
    aboutTitle: "Pokédex Kids | אודות",
    aboutDescription: "על הפרויקט — אנציקלופדיית פוקימונים ידידותית לילדים.",
  },

  // ─── Language switcher ────────────────────────────────────────────
  language: {
    en: "EN",
    he: "HE",
    switchLabel: "שפה",
  },

  // ─── Stats Explorer page ─────────────────────────────────────────
  statsExplorer: {
    title: "סייר סטטיסטיקות",
    subtitle: "מצאו פוקימונים לפי הסטטיסטיקות שלהם",
    sortBy: "מיין לפי",
    sortOrder: "סדר",
    highest: "הגבוה ביותר",
    lowest: "הנמוך ביותר",
    statRanges: "טווחי סטטיסטיקות",
    total: "סה״כ",
    min: "מינימום",
    max: "מקסימום",
    results: (count: number, total: number) =>
      `מציג ${count} מתוך ${total} פוקימונים`,
    noResults: "אין פוקימונים שמתאימים למסננים. נסו להרחיב את הטווחים!",
    rank: "#",
    reset: "איפוס",
  },
};
