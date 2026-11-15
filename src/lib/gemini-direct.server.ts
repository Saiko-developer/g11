import { geminiSpeechPrompt } from "./tts-prompt";
import { DEFAULT_GEMINI_FALLBACK_MODEL } from "./ai-gateway.server";

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; inlineData?: { data?: string } }[] } }[];
};

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Lovable gateway statuses where switching to the owner's own Gemini key can help. */
export function shouldUseGeminiFallback(status: number | null | undefined) {
  return (
    status == null ||
    status === 401 ||
    status === 402 ||
    status === 403 ||
    status === 429 ||
    status >= 500
  );
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

export type SpeechFailureCode =
  | "missing_key"
  | "invalid_model"
  | "cancelled"
  | "timeout"
  | "network"
  | "quota_zero"
  | "quota"
  | "billing"
  | "permission"
  | "model_unavailable"
  | "invalid_request"
  | "provider_error"
  | "blocked"
  | "no_audio"
  | "invalid_audio";
export type GeminiSpeechResult =
  | { ok: true; pcm: Uint8Array; model: string }
  | {
      ok: false;
      code: SpeechFailureCode;
      model: string;
      status?: number;
      providerStatus?: string;
      detail?: string;
    };

/** Admin diagnostics include a bounded, redacted message; raw payloads and keys are never logged. */
export async function requestGeminiSpeech(
  text: string,
  voiceName: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<GeminiSpeechResult> {
  const configured = process.env.GEMINI_TTS_MODEL?.trim() || "gemini-2.5-flash-preview-tts";
  // Google SDK model resource names and gateway-style names must not become duplicate URL paths.
  const model = configured.replace(/^(?:models\/|google\/)+/, "");
  const validModel = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(model);
  const failure = (
    code: SpeechFailureCode,
    extra: { status?: number; providerStatus?: string; detail?: string } = {},
  ): GeminiSpeechResult => ({ ok: false, code, model: validModel ? model : "invalid", ...extra });
  const k = key();
  if (!k) return failure("missing_key");
  if (!validModel) return failure("invalid_model");
  if (signal?.aborted) return failure("cancelled");
  const deadline = AbortSignal.timeout(25000);
  const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
  try {
    const res = await fetcher(`${BASE}/${model}:generateContent`, {
      signal: combined,
      method: "POST",
      headers: { "x-goog-api-key": k, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: geminiSpeechPrompt(text) }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
        },
      }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const rawStatus = payload?.error?.status;
      const providerStatus =
        typeof rawStatus === "string" && /^[A-Z_]{1,60}$/.test(rawStatus) ? rawStatus : undefined;
      // Inspect provider details only for classification; never return/log the raw body.
      const detail = JSON.stringify(payload ?? {}).toLowerCase();
      const code: SpeechFailureCode =
        res.status === 429
          ? /limit["\s:]+0\b|quota[_ ]limit[_ ]value["\s:]+0\b/.test(detail)
            ? "quota_zero"
            : "quota"
          : /billing|payment.required/.test(detail)
            ? "billing"
            : res.status === 401 || res.status === 403
              ? "permission"
              : res.status === 404
                ? "model_unavailable"
                : res.status === 400
                  ? "invalid_request"
                  : "provider_error";
      const detailMessage =
        typeof payload?.error?.message === "string"
          ? payload.error.message
              .split(k)
              .join("[redacted]")
              .replace(/AIza[0-9A-Za-z_-]+/g, "[redacted]")
              .replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]")
              .replace(/https?:\/\/[^\s]+/g, "[provider URL]")
              .slice(0, 400)
          : undefined;
      return failure(code, { status: res.status, providerStatus, detail: detailMessage });
    }
    const data = (await res.json()) as GeminiResponse & {
      promptFeedback?: { blockReason?: string };
    };
    if (data?.promptFeedback?.blockReason) return failure("blocked");
    const b64 = data?.candidates?.[0]?.content?.parts?.find((p) => p?.inlineData?.data)?.inlineData
      ?.data;
    if (typeof b64 !== "string") return failure("no_audio");
    try {
      const pcm = b64ToBytes(b64);
      return pcm.byteLength >= 1024 ? { ok: true, pcm, model } : failure("invalid_audio");
    } catch {
      return failure("invalid_audio");
    }
  } catch (error) {
    if (signal?.aborted) return failure("cancelled");
    if (
      deadline.aborted ||
      (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "TimeoutError")
    )
      return failure("timeout");
    return failure("network");
  }
}

export function describeSpeechFailure(result: Extract<GeminiSpeechResult, { ok: false }>) {
  const hints: Record<SpeechFailureCode, string> = {
    missing_key: "Server တွင် GEMINI_API_KEY ထည့်ပါ။",
    invalid_model: "GEMINI_TTS_MODEL တွင် Google model ID မှန်ကို သတ်မှတ်ပါ။",
    cancelled: "အသံတောင်းဆိုမှုကို ရပ်ထားပါသည်။",
    timeout: "Google အသံပြန်ပေးချိန် 25 စက္ကန့် ကျော်သွားပါသည်။",
    network: "Google ချိတ်ဆက်မှု သို့မဟုတ် response ဖတ်မှု မအောင်မြင်ပါ။",
    quota_zero:
      "Google TTS quota သုညဖြစ်နေပါသည်။ API project ၏ model quota နှင့် billing ကို စစ်ပါ။",
    quota: "Google TTS quota ပြည့်နေပါသည်။ Model rate/daily quota ကို စစ်ပါ။",
    billing: "Google API project ၏ billing ကို စစ်ပါ။",
    permission: "Google key restrictions၊ API enable နှင့် model access ကို စစ်ပါ။",
    model_unavailable: "Google တွင် ဤ TTS model မရပါ။ GEMINI_TTS_MODEL ကို စစ်ပါ။",
    invalid_request: "Google က request ကို ငြင်းပယ်ပါသည်။ TTS model နှင့် voice setting ကို စစ်ပါ။",
    provider_error: "Google အသံဝန်ဆောင်မှု အမှားဖြစ်ပါသည်။",
    blocked: "Google safety စနစ်က အသံတောင်းဆိုမှုကို ပိတ်ထားပါသည်။",
    no_audio: "Google response တွင် အသံမပါပါ။ TTS model ကို စစ်ပါ။",
    invalid_audio: "Google response မှ အသံဒေတာ မမှန်ပါ။",
  };
  return `${result.status ? `HTTP ${result.status} ` : ""}${result.providerStatus ?? result.code} · ${result.model} — ${hints[result.code]}${result.detail ? ` Google: ${result.detail}` : ""}`;
}

/** Keeps the shared playback API stable; detailed results are available to authenticated admins. */
export async function geminiDirectSpeech(
  text: string,
  voiceName: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
) {
  const result = await requestGeminiSpeech(text, voiceName, fetcher, signal);
  if (result.ok) return result.pcm;
  if (result.code !== "cancelled")
    console.warn("[gemini-direct] tts failed", {
      code: result.code,
      status: result.status,
      model: result.model,
    });
  return null;
}

/** Direct Gemini transcription of an audio file. Returns text ("" for silence), or null on failure. */
export async function geminiDirectTranscribe(
  file: Blob,
  mimeType: string,
  prompt: string,
  fetcher: typeof fetch = fetch,
  signal?: AbortSignal,
) {
  const k = key();
  if (!k || signal?.aborted) return null;
  const model = process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL;
  const audio = bytesToB64(new Uint8Array(await file.arrayBuffer()));
  const res = await fetcher(`${BASE}/${model}:generateContent`, {
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(25000)])
      : AbortSignal.timeout(25000),
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
