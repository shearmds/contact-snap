/**
 * Contact Snap — Cloudflare Worker
 *
 * Accepts POST requests with either { imageBase64, mimeType? } or { text }
 * and returns { text } containing raw Gemini JSON output.
 *
 * Deploy:
 *   cd worker
 *   wrangler secret put GEMINI_API_KEY   ← paste your key when prompted
 *   wrangler deploy
 */

const EXTRACTION_PROMPT = `Analyze this image and extract any contact information you can find.
Return a JSON object with exactly these fields (use empty string "" for any field not found):

{
  "firstName": "",
  "lastName": "",
  "company": "",
  "jobTitle": "",
  "email": "",
  "phone": "",
  "address": "",
  "website": ""
}

Rules:
- Return ONLY the JSON object, no markdown fences, no explanation.
- If the image contains a business card, extract all visible fields.
- If a name is a single word, put it in firstName and leave lastName as "".
- For phone numbers, ALWAYS include the country calling code with a + prefix. If the country code is not explicitly shown, infer it from context clues like the address, area code format, or any other visible information.
- For addresses, combine all address lines into a single string.
- For websites, include the full URL if visible (add https:// if protocol is missing).`;

const TEXT_EXTRACTION_PROMPT = `Extract contact information from the following text.
Return a JSON object with exactly these fields (use empty string "" for any field not found):

{
  "firstName": "",
  "lastName": "",
  "company": "",
  "jobTitle": "",
  "email": "",
  "phone": "",
  "address": "",
  "website": ""
}

Rules:
- Return ONLY the JSON object, no markdown fences, no explanation.
- If a name is a single word, put it in firstName and leave lastName as "".
- For phone numbers, ALWAYS include the country calling code with a + prefix (e.g. +1 for US/Canada, +44 for UK). If not shown, infer from context.
- For addresses, combine all address parts into a single string.
- For websites, include the full URL (add https:// if protocol is missing).
- Social media handles (e.g. @username) should go in the website field as a full URL if the platform is identifiable.

Text:
`;

const GEMINI_MODEL = "gemini-2.5-flash";

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!env.GEMINI_API_KEY) {
      return jsonResponse({ error: "Server misconfigured: missing API key" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    let contents;
    if (body.imageBase64) {
      contents = [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inlineData: {
                mimeType: body.mimeType ?? "image/png",
                data: body.imageBase64,
              },
            },
          ],
        },
      ];
    } else if (body.text) {
      contents = [{ parts: [{ text: TEXT_EXTRACTION_PROMPT + body.text }] }];
    } else {
      return jsonResponse({ error: "Provide imageBase64 or text in request body" }, 400);
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      },
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      const msg = data?.error?.message ?? "Gemini API error";
      return jsonResponse({ error: msg }, geminiRes.status);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return jsonResponse({ text });
  },
};
