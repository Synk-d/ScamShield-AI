import { logger } from "../logger";

export interface SafeBrowsingSignal {
  source: "google_safe_browsing";
  score: number;
  verdict: string;
  threats: string[];
  available: boolean;
  error?: string;
}

const API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingSignal> {
  if (!API_KEY) {
    return { source: "google_safe_browsing", score: 0, verdict: "skipped", threats: [], available: false, error: "API key not configured" };
  }

  try {
    const body = {
      client: { clientId: "scamshield-ai", clientVersion: "1.0.0" },
      threatInfo: {
        threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    };

    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Safe Browsing API error: ${res.status}`);
    }

    const data = (await res.json()) as { matches?: Array<{ threatType: string }> };
    const threats = data.matches?.map((m) => m.threatType) ?? [];

    const score = threats.length > 0 ? 90 : 0;
    const verdict = threats.length > 0 ? "unsafe" : "safe";

    return { source: "google_safe_browsing", score, verdict, threats, available: true };
  } catch (err) {
    logger.warn({ err }, "Google Safe Browsing check failed");
    return { source: "google_safe_browsing", score: 0, verdict: "error", threats: [], available: false, error: String(err) };
  }
}
