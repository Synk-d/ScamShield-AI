import { logger } from "../logger";

export interface DomainAgeSignal {
  source: "domain_age";
  score: number;
  verdict: string;
  domain: string;
  registrationDate: string | null;
  ageInDays: number | null;
  available: boolean;
  error?: string;
}

function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export async function checkDomainAge(url: string): Promise<DomainAgeSignal> {
  const domain = extractDomain(url);

  if (!domain) {
    return { source: "domain_age", score: 0, verdict: "invalid_url", domain: "", registrationDate: null, ageInDays: null, available: false, error: "Could not parse domain" };
  }

  try {
    const tld = domain.split(".").slice(-1)[0];
    const rdapBase = getRdapBase(tld);

    const res = await fetch(`${rdapBase}/domain/${domain}`, {
      headers: { accept: "application/rdap+json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`RDAP lookup failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      events?: Array<{ eventAction: string; eventDate: string }>;
    };

    const regEvent = data.events?.find((e) => e.eventAction === "registration");
    const registrationDate = regEvent?.eventDate ?? null;

    let ageInDays: number | null = null;
    let score = 0;
    let verdict = "unknown";

    if (registrationDate) {
      const regTime = new Date(registrationDate).getTime();
      const now = Date.now();
      ageInDays = Math.floor((now - regTime) / (1000 * 60 * 60 * 24));

      if (ageInDays < 30) {
        score = 80;
        verdict = "very_new";
      } else if (ageInDays < 90) {
        score = 50;
        verdict = "new";
      } else if (ageInDays < 365) {
        score = 20;
        verdict = "recent";
      } else {
        score = 0;
        verdict = "established";
      }
    }

    return { source: "domain_age", score, verdict, domain, registrationDate, ageInDays, available: true };
  } catch (err) {
    logger.warn({ err, domain }, "RDAP domain age check failed");
    return { source: "domain_age", score: 0, verdict: "error", domain, registrationDate: null, ageInDays: null, available: false, error: String(err) };
  }
}

function getRdapBase(tld: string): string {
  const rdapMap: Record<string, string> = {
    com: "https://rdap.verisign.com/com/v1",
    net: "https://rdap.verisign.com/net/v1",
    org: "https://rdap.publicinterestregistry.org/rdap",
    info: "https://rdap.afilias.net/rdap/info",
    io: "https://rdap.nic.io",
    co: "https://rdap.nic.co",
    uk: "https://rdap.nominet.uk",
    de: "https://rdap.denic.de",
    in: "https://rdap.registry.in",
    xyz: "https://rdap.nic.xyz",
    top: "https://rdap.nic.top",
    site: "https://rdap.nic.site",
    online: "https://rdap.nic.online",
    club: "https://rdap.nic.club",
    live: "https://rdap.nic.live",
  };
  return rdapMap[tld] ?? "https://rdap.org";
}
