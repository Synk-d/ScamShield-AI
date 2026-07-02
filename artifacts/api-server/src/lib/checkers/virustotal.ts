import { logger } from "../logger";

export interface VirusTotalSignal {
  source: "virustotal";
  score: number;
  verdict: string;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  available: boolean;
  error?: string;
}

const API_KEY = process.env.VIRUSTOTAL_API_KEY;

export async function checkVirusTotal(url: string): Promise<VirusTotalSignal> {
  if (!API_KEY) {
    return { source: "virustotal", score: 0, verdict: "skipped", malicious: 0, suspicious: 0, harmless: 0, undetected: 0, available: false, error: "API key not configured" };
  }

  try {
    const urlId = Buffer.from(url).toString("base64url").replace(/=+$/, "");

    const res = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: { "x-apikey": API_KEY },
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 404) {
      const submitRes = await fetch("https://www.virustotal.com/api/v3/urls", {
        method: "POST",
        headers: { "x-apikey": API_KEY, "content-type": "application/x-www-form-urlencoded" },
        body: `url=${encodeURIComponent(url)}`,
        signal: AbortSignal.timeout(8000),
      });

      if (!submitRes.ok) {
        throw new Error(`VT submit failed: ${submitRes.status}`);
      }

      return { source: "virustotal", score: 0, verdict: "submitted", malicious: 0, suspicious: 0, harmless: 0, undetected: 0, available: true };
    }

    if (!res.ok) {
      throw new Error(`VT API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      data: { attributes: { last_analysis_stats: { malicious: number; suspicious: number; harmless: number; undetected: number } } };
    };

    const stats = data.data.attributes.last_analysis_stats;
    const total = stats.malicious + stats.suspicious + stats.harmless + stats.undetected;
    const threatWeight = stats.malicious + stats.suspicious * 0.5;
    const score = total > 0 ? Math.round((threatWeight / total) * 100) : 0;

    let verdict = "clean";
    if (stats.malicious >= 3) verdict = "malicious";
    else if (stats.malicious >= 1 || stats.suspicious >= 3) verdict = "suspicious";
    else if (stats.suspicious >= 1) verdict = "low-risk";

    return { source: "virustotal", score, verdict, malicious: stats.malicious, suspicious: stats.suspicious, harmless: stats.harmless, undetected: stats.undetected, available: true };
  } catch (err) {
    logger.warn({ err }, "VirusTotal check failed");
    return { source: "virustotal", score: 0, verdict: "error", malicious: 0, suspicious: 0, harmless: 0, undetected: 0, available: false, error: String(err) };
  }
}
