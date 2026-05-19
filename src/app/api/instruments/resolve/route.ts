import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const dynamic = "force-dynamic";

const SYSTEM = `You are a financial instrument classifier. Given a list of strings, classify each as KNOWN or UNRECOGNIZED.

KNOWN: Any real financial market category (Forex, Crypto, Equities, Commodities, Bonds, Indices, Options, Futures, ETFs, CFDs), specific instrument or ticker (EUR/USD, BTC/USD, AAPL, Gold, Brent Crude, S&P 500, FTSE 100, Volatility Index, etc.), exchange name (NYSE, LSE, CME), or asset class.

UNRECOGNIZED: Anything that is not a real financial instrument, market category, ticker, or asset class — including test strings, nonsense words, or clearly non-financial terms.

When classifying as KNOWN, also return the canonical name (e.g. "btc" → "Bitcoin (BTC)", "fx" → "Forex (FX)", "sp500" → "S&P 500 (SPX)").

Return ONLY a JSON array, no other text:
[{"input": "Forex", "status": "KNOWN", "canonical": "Forex (FX)"}, {"input": "testing123", "status": "UNRECOGNIZED", "canonical": null}]`;

export type InstrumentResolution = {
  input: string;
  status: "KNOWN" | "UNRECOGNIZED";
  canonical: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const markets: string[] = Array.isArray(body.markets) ? body.markets : [];

    if (markets.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const model = new ChatOpenAI({
      model: "gemini-3.1-flash-lite-preview",
      temperature: 0,
      maxTokens: 512,
      configuration: {
        baseURL: process.env.LITELLM_BASE_URL || "https://litellmprod.deriv.ai/v1",
        apiKey: process.env.LITELLM_API_KEY,
      },
    });

    const response = await model.invoke([
      new SystemMessage(SYSTEM),
      new HumanMessage(`Classify these: ${JSON.stringify(markets)}`),
    ]);

    const content =
      typeof response.content === "string" ? response.content : "";

    let results: InstrumentResolution[];
    try {
      results = JSON.parse(content);
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      results = match
        ? JSON.parse(match[0])
        : markets.map((m) => ({ input: m, status: "UNRECOGNIZED" as const, canonical: null }));
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[instruments/resolve]", err);
    // Fail open — don't block the form on a resolver error
    return NextResponse.json({ results: [] });
  }
}
