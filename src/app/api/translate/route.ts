import { NextRequest, NextResponse } from "next/server";

const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY;
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION || "westus3";

const SUPPORTED_LANGUAGES: Record<string, string> = {
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese (Simplified)",
  ko: "Korean",
  ja: "Japanese",
  pt: "Portuguese",
  ru: "Russian",
  ar: "Arabic",
  it: "Italian",
  hi: "Hindi",
  vi: "Vietnamese",
  tl: "Filipino",
  yue: "Yup'ik",
};

export async function POST(req: NextRequest) {
  if (!AZURE_TRANSLATOR_KEY) {
    return NextResponse.json(
      { error: "Azure Translator not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { text, targetLanguage = "es", sourceLanguage } = body;

  if (!text || typeof text !== "string" || text.length === 0) {
    return NextResponse.json(
      { error: "Text is required" },
      { status: 400 }
    );
  }

  if (text.length > 50000) {
    return NextResponse.json(
      { error: "Text exceeds 50,000 character limit" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    "api-version": "3.0",
    to: targetLanguage,
  });

  if (sourceLanguage) {
    params.set("from", sourceLanguage);
  }

  const response = await fetch(
    `https://api.cognitive.microsofttranslator.com/translate?${params}`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
        "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ text }]),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { error: `Translation failed: ${response.status}`, details: errText },
      { status: 502 }
    );
  }

  const data = await response.json();
  const translation = data[0]?.translations?.[0];

  return NextResponse.json({
    translatedText: translation?.text ?? "",
    detectedLanguage: data[0]?.detectedLanguage?.language,
    targetLanguage,
    targetLanguageName: SUPPORTED_LANGUAGES[targetLanguage] ?? targetLanguage,
  });
}

export async function GET() {
  return NextResponse.json({
    languages: Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
      code,
      name,
    })),
  });
}
