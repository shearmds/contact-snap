export interface ContactInfo {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  note: string;
}

export const REGION_TO_CALLING_CODE: Record<string, string> = {
  US: "+1",  CA: "+1",  GB: "+44", UK: "+44", AU: "+61", NZ: "+64",
  DE: "+49", FR: "+33", IT: "+39", ES: "+34", PT: "+351",
  NL: "+31", BE: "+32", AT: "+43", CH: "+41", SE: "+46",
  NO: "+47", DK: "+45", FI: "+358", IE: "+353", PL: "+48",
  CZ: "+420", RO: "+40", HU: "+36", GR: "+30", TR: "+90",
  RU: "+7",  UA: "+380", IN: "+91", CN: "+86", JP: "+81",
  KR: "+82", TW: "+886", HK: "+852", SG: "+65", MY: "+60",
  TH: "+66", PH: "+63", ID: "+62", VN: "+84", IL: "+972",
  AE: "+971", SA: "+966", ZA: "+27", NG: "+234", EG: "+20",
  BR: "+55", MX: "+52", AR: "+54", CL: "+56", CO: "+57",
};

export function getSystemRegion(): string | undefined {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const parts = locale.split("-");
    if (parts.length >= 2) {
      return parts[parts.length - 1].toUpperCase();
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function ensureCountryCode(phone: string): string {
  if (!phone || phone.startsWith("+")) return phone;
  const region = getSystemRegion();
  if (!region) return phone;
  const code = REGION_TO_CALLING_CODE[region];
  if (!code) return phone;
  const stripped = phone.replace(/^0+/, "");
  return `${code} ${stripped}`;
}

export function parseContactJson(text: string): ContactInfo {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Could not parse contact data. The AI returned an unexpected format. Raw: "${text.slice(0, 200)}"`,
    );
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("AI returned a non-object response. Please try again.");
  }

  const obj = parsed as Record<string, unknown>;
  return {
    firstName: typeof obj.firstName === "string" ? obj.firstName : "",
    lastName:  typeof obj.lastName  === "string" ? obj.lastName  : "",
    company:   typeof obj.company   === "string" ? obj.company   : "",
    jobTitle:  typeof obj.jobTitle  === "string" ? obj.jobTitle  : "",
    email:     typeof obj.email     === "string" ? obj.email     : "",
    phone:     typeof obj.phone     === "string" ? obj.phone     : "",
    address:   typeof obj.address   === "string" ? obj.address   : "",
    website:   typeof obj.website   === "string" ? obj.website   : "",
    note:      typeof obj.note      === "string" ? obj.note      : "",
  };
}
