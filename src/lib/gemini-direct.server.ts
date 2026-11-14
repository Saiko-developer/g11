import { DEFAULT_GEMINI_FALLBACK_MODEL } from "./ai-gateway.server";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; inlineData?: { data?: string } }[] } }[];
};

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Lovable gateway statuses where switching to the owner's own Gemini key can help. */
export function shouldUseGeminiFallback(status: number | null | undefined) {
  return status == null || status === 402 || status === 403 || status === 429 || status >= 500;
}

function key() {
  return process.env.GEMINI_API_KEY?.trim() || null;
}

export function hasGeminiKey() {
  return !!key();
}

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Direct Gemini TTS with the same prebuilt voice. Returns raw 24 kHz PCM, or null. */
export async function geminiDirectSpeech(
  text: string,
  voiceName: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
) {
  const k = key();
  if (!k) return null;
  const model = process.env.GEMINI_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts";
  const res = await fetcher(`${BASE}/${model}:generateContent`, {
    ...(signal ? { signal } : {}),
    method: "POST",
    headers: { "x-goog-api-key": k, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }),
  }).catch(() => null);
  if (!res?.ok) {
    console.warn("[gemini-direct] tts failed", res?.status);
    return null;
  }
  const data = (await res.json().catch(() => null)) as GeminiResponse | null;
  const b64 = data?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data)?.inlineData
    ?.data;
  if (typeof b64 !== "string") return null;
  const pcm = b64ToBytes(b64);
  return pcm.byteLength >= 1024 ? pcm : null;
}

/** Direct Gemini transcription of an audio file. Returns text ("" for silence), or null on failure. */
export async function geminiDirectTranscribe(
  file: Blob,
  mimeType: string,
  prompt: string,
  fetcher: typeof fetch = fetch,
) {
  const k = key();
  if (!k) return null;
  const model = process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL;
  const audio = bytesToB64(new Uint8Array(await file.arrayBuffer()));
  const res = await fetcher(`${BASE}/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": k, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${prompt}\nReturn ONLY the transcript text, nothing else.` },
            { inlineData: { mimeType, data: audio } },
          ],
        },
      ],
      generationConfig: { temperature: 0 },
    }),
  }).catch(() => null);
  if (!res?.ok) {
    console.warn("[gemini-direct] transcribe failed", res?.status);
    return null;
  }
  const data = (await res.json().catch(() => null)) as GeminiResponse | null;
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  return parts
    .map((p) => (typeof p?.text === "string" ? p.text : ""))
    .join("")
    .trim();
}
