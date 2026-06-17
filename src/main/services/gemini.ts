import { ContactInfo, parseContactJson, ensureCountryCode } from "./contact-utils";

export type { ContactInfo };

// Replace with your deployed Worker URL after running `wrangler deploy`
const WORKER_URL = "https://contact-snap.shearm.workers.dev";

function isTransientError(error: unknown): boolean {
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("overloaded") ||
    msg.includes("resource has been exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("too many requests") ||
    msg.includes("service unavailable")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isTransientError(err) || attempt === maxAttempts) throw err;
      const delayMs = 1000 * Math.pow(2, attempt - 1);
      console.log(`[GeminiService] Transient error on attempt ${attempt}, retrying in ${delayMs}ms`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

async function callWorker(body: Record<string, string>): Promise<string> {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { text?: string; error?: string };

  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Worker returned ${res.status}`);
  }

  return data.text ?? "";
}

class GeminiService {
  async extractContact(imageBase64: string): Promise<ContactInfo> {
    const text = await withRetry(() => callWorker({ imageBase64 }));
    const contact = parseContactJson(text);
    if (contact.phone) contact.phone = ensureCountryCode(contact.phone);
    return contact;
  }

  async extractContactFromText(inputText: string): Promise<ContactInfo> {
    const text = await withRetry(() => callWorker({ text: inputText }));
    const contact = parseContactJson(text);
    if (contact.phone) contact.phone = ensureCountryCode(contact.phone);
    return contact;
  }
}

export const geminiService = new GeminiService();
