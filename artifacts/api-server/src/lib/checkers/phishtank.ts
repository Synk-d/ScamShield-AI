import { logger } from "../logger";

export interface PhishTankSignal {
  source: "phishtank";
  score: number;
  verdict: string;
  isPhishing: boolean;
  available: boolean;
  matchedIndicators?: string[];
  error?: string;
}

const URL_SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "buff.ly",
  "adf.ly", "short.link", "rb.gy", "cutt.ly", "is.gd", "v.gd",
  "shrtco.de", "tiny.cc", "shorte.st", "bc.vc", "clck.ru",
]);

const HIGH_RISK_TLDS = new Set([
  "tk", "ml", "ga", "cf", "gq", "xyz", "top", "click", "surf",
  "work", "date", "loan", "review", "win", "stream", "download",
  "men", "accountant", "faith", "racing", "trade", "webcam",
  "country", "cricket", "science", "party", "bid", "trade",
]);

const IMPERSONATED_BRANDS = [
  "paypal", "amazon", "google", "microsoft", "apple", "facebook",
  "instagram", "netflix", "wellsfargo", "bankofamerica", "chase",
  "citibank", "irs", "usps", "fedex", "dhl", "binance", "coinbase",
  "metamask", "opensea", "steam", "discord", "twitter", "linkedin",
];

const PHISHING_PATH_KEYWORDS = [
  "verify-account", "confirm-identity", "secure-login", "update-info",
  "reset-password", "validate-account", "suspended-account", "unlock-account",
];

// Maps leet-speak / digit substitutions back to their letter equivalents.
// e.g. "g00gle" → "google", "paypa1" → "paypal", "amaz0n" → "amazon"
function normalizeLeet(s: string): string {
  return s
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/6/g, "g")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

// Returns true if the hostname is the genuine official domain for a brand.
function isOfficialDomain(hostname: string, brand: string): boolean {
  const official = [`${brand}.com`, `${brand}.net`, `${brand}.org`, `www.${brand}.com`];
  return official.some((d) => hostname === d || hostname.endsWith(`.${d}`));
}

export async function checkPhishTank(url: string): Promise<PhishTankSignal> {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const tld = hostname.split(".").slice(-1)[0];
    const pathLower = parsed.pathname.toLowerCase();
    const fullLower = url.toLowerCase();
    const subdomains = hostname.split(".");
    const matchedIndicators: string[] = [];

    // Normalized version of hostname with leet-speak decoded
    const normalizedHostname = normalizeLeet(hostname);

    // 1. IP address in hostname (no domain name)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      matchedIndicators.push("IP address used instead of domain name");
    }

    // 2. URL shortener
    const baseDomain = subdomains.slice(-2).join(".");
    if (URL_SHORTENERS.has(baseDomain)) {
      matchedIndicators.push(`URL shortener detected (${baseDomain})`);
    }

    // 3. High-risk TLD
    if (HIGH_RISK_TLDS.has(tld)) {
      matchedIndicators.push(`High-risk TLD (.${tld})`);
    }

    // 4. Excessive subdomains (more than 3 levels deep)
    if (subdomains.length > 4) {
      matchedIndicators.push(`Excessive subdomains (${subdomains.length - 2} levels)`);
    }

    // 5a. Brand impersonation — exact substring match on raw hostname
    let brandMatched = false;
    for (const brand of IMPERSONATED_BRANDS) {
      if (hostname.includes(brand) && !isOfficialDomain(hostname, brand)) {
        matchedIndicators.push(`Brand impersonation: "${brand}" in non-official domain`);
        brandMatched = true;
        break;
      }
    }

    // 5b. Brand impersonation via leet-speak / digit substitution (e.g. g00gle, paypa1, amaz0n)
    // Key: check the ORIGINAL hostname is not official — the normalized form may coincidentally
    // equal an official domain (e.g. g00gle.com → google.com) but the original is still a spoof.
    if (!brandMatched && normalizedHostname !== hostname) {
      for (const brand of IMPERSONATED_BRANDS) {
        if (normalizedHostname.includes(brand) && !isOfficialDomain(hostname, brand)) {
          matchedIndicators.push(`Digit/leet-speak brand spoofing: "${hostname}" looks like "${brand}"`);
          break;
        }
      }
    }

    // 6. Multiple hyphens in domain (paypal-secure-update-login.com)
    const domainPart = subdomains.slice(-2, -1)[0] ?? "";
    const hyphenCount = (domainPart.match(/-/g) ?? []).length;
    if (hyphenCount >= 2) {
      matchedIndicators.push(`Suspicious domain with ${hyphenCount} hyphens`);
    }

    // 7. Punycode / international homograph
    if (hostname.includes("xn--")) {
      matchedIndicators.push("Punycode domain (possible homograph attack)");
    }

    // 8. Phishing keywords in path
    for (const kw of PHISHING_PATH_KEYWORDS) {
      if (pathLower.includes(kw)) {
        matchedIndicators.push(`Suspicious path keyword: "${kw}"`);
        break;
      }
    }

    // 9. Excessive query parameters (> 5 keys)
    const paramCount = [...parsed.searchParams.keys()].length;
    if (paramCount > 5) {
      matchedIndicators.push(`Unusually long URL with ${paramCount} query parameters`);
    }

    // 10. Credential-harvesting file extensions
    if (/\.(php|asp|aspx)$/i.test(parsed.pathname) && (fullLower.includes("login") || fullLower.includes("signin") || fullLower.includes("verify"))) {
      matchedIndicators.push("Login/verify page with server-side script extension");
    }

    const count = matchedIndicators.length;
    let score = 0;
    let verdict = "clean";

    if (count === 0) {
      score = 0;
      verdict = "clean";
    } else if (count === 1) {
      score = 25;
      verdict = "low-risk";
    } else if (count === 2) {
      score = 55;
      verdict = "suspicious";
    } else {
      score = Math.min(90, 55 + (count - 2) * 10);
      verdict = count >= 4 ? "malicious" : "suspicious";
    }

    return {
      source: "phishtank",
      score,
      verdict,
      isPhishing: count >= 3,
      matchedIndicators,
      available: true,
    };
  } catch (err) {
    logger.warn({ err }, "Heuristic URL check failed");
    return {
      source: "phishtank",
      score: 0,
      verdict: "error",
      isPhishing: false,
      available: false,
      error: String(err),
    };
  }
}
