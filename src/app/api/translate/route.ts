import { NextRequest, NextResponse } from "next/server";

// In-memory cache for translations (persists across requests while the server is running)
const cache = new Map<string, string>();

// Lingva Translate API — free Google Translate proxy, no API key needed
const LINGVA_BASE = "https://lingva.ml/api/v1";

// Language code mapping (Lingva/Google uses "iw" for Hebrew, not "he")
const LANG_CODES: Record<string, string> = {
  he: "iw",
};

export async function POST(request: NextRequest) {
  try {
    const { text, from = "en", to } = await request.json();

    if (!text || !to) {
      return NextResponse.json(
        { error: "Missing required fields: text, to" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `${from}:${to}:${text}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ translation: cached, cached: true });
    }

    // Map language code for Lingva
    const targetLang = LANG_CODES[to] || to;
    const sourceLang = LANG_CODES[from] || from;

    // Call Lingva Translate API
    const url = `${LINGVA_BASE}/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      const body = await res.text();
      console.error("Lingva API error:", res.status, body);
      return NextResponse.json(
        { error: "Translation service unavailable" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.translation) {
      return NextResponse.json(
        { error: "No translation returned" },
        { status: 502 }
      );
    }

    // Cache the result
    cache.set(cacheKey, data.translation);

    return NextResponse.json({ translation: data.translation, cached: false });
  } catch (err) {
    console.error("Translation error:", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
