import { checkVirusTotal, type VirusTotalSignal } from "./checkers/virustotal";
import { checkSafeBrowsing, type SafeBrowsingSignal } from "./checkers/safebrowsing";
import { checkPhishTank, type PhishTankSignal } from "./checkers/phishtank";
import { checkDomainAge, type DomainAgeSignal } from "./checkers/domainage";
import type { ScamAnalysisResult } from "./gemini";

export interface SignalBreakdown {
  gemini: { score: number; weight: number };
  virustotal: VirusTotalSignal & { weight: number };
  google_safe_browsing: SafeBrowsingSignal & { weight: number };
  phishtank: PhishTankSignal & { weight: number };
  domain_age: DomainAgeSignal & { weight: number };
  ensembleScore: number;
}

const WEIGHTS = {
  gemini: 0.50,
  virustotal: 0.275,
  google_safe_browsing: 0.15,
  phishtank: 0.05,
  domain_age: 0.025,
};

export async function runUrlEnsemble(
  url: string,
  geminiResult: ScamAnalysisResult
): Promise<{ finalResult: ScamAnalysisResult; signals: SignalBreakdown }> {
  const [vtSignal, sbSignal, ptSignal, daSignal] = await Promise.all([
    checkVirusTotal(url),
    checkSafeBrowsing(url),
    checkPhishTank(url),
    checkDomainAge(url),
  ]);

  const geminiScore = geminiResult.riskScore;

  let totalWeight = WEIGHTS.gemini;
  let weightedSum = geminiScore * WEIGHTS.gemini;

  if (vtSignal.available) {
    weightedSum += vtSignal.score * WEIGHTS.virustotal;
    totalWeight += WEIGHTS.virustotal;
  }
  if (sbSignal.available) {
    weightedSum += sbSignal.score * WEIGHTS.google_safe_browsing;
    totalWeight += WEIGHTS.google_safe_browsing;
  }
  if (ptSignal.available) {
    weightedSum += ptSignal.score * WEIGHTS.phishtank;
    totalWeight += WEIGHTS.phishtank;
  }
  if (daSignal.available) {
    weightedSum += daSignal.score * WEIGHTS.domain_age;
    totalWeight += WEIGHTS.domain_age;
  }

  const ensembleScore = Math.round(weightedSum / totalWeight);

  const finalScore = Math.min(100, ensembleScore);

  let severity: ScamAnalysisResult["severity"];
  if (finalScore < 30) severity = "low";
  else if (finalScore < 60) severity = "medium";
  else if (finalScore < 80) severity = "high";
  else severity = "critical";

  const extraRedFlags: string[] = [];
  if (vtSignal.available && vtSignal.malicious >= 1) {
    extraRedFlags.push(`VirusTotal: ${vtSignal.malicious} security vendor(s) flagged this URL as malicious`);
  }
  if (vtSignal.available && vtSignal.suspicious >= 1) {
    extraRedFlags.push(`VirusTotal: ${vtSignal.suspicious} vendor(s) marked URL as suspicious`);
  }
  if (sbSignal.available && sbSignal.threats.length > 0) {
    extraRedFlags.push(`Google Safe Browsing: ${sbSignal.threats.join(", ").toLowerCase().replace(/_/g, " ")}`);
  }
  if (ptSignal.available && ptSignal.isPhishing) {
    extraRedFlags.push("PhishTank: URL is confirmed in the phishing database");
  }
  if (daSignal.available && daSignal.ageInDays !== null && daSignal.ageInDays < 30) {
    extraRedFlags.push(`Domain registered only ${daSignal.ageInDays} day(s) ago — extremely new domain`);
  } else if (daSignal.available && daSignal.ageInDays !== null && daSignal.ageInDays < 90) {
    extraRedFlags.push(`Domain registered ${daSignal.ageInDays} days ago — newly registered domain`);
  }

  const allRedFlags = [...new Set([...geminiResult.redFlags, ...extraRedFlags])];

  const signals: SignalBreakdown = {
    gemini: { score: geminiScore, weight: WEIGHTS.gemini },
    virustotal: { ...vtSignal, weight: WEIGHTS.virustotal },
    google_safe_browsing: { ...sbSignal, weight: WEIGHTS.google_safe_browsing },
    phishtank: { ...ptSignal, weight: WEIGHTS.phishtank },
    domain_age: { ...daSignal, weight: WEIGHTS.domain_age },
    ensembleScore: finalScore,
  };

  const finalResult: ScamAnalysisResult = {
    ...geminiResult,
    riskScore: finalScore,
    severity,
    redFlags: allRedFlags,
  };

  return { finalResult, signals };
}
