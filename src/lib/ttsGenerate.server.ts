import { geminiSpeechPrompt } from "./tts-prompt";
import { providerUnavailable } from "./ai-provider.server";
import { sanitizeForSpeech } from "./sanitizeSpeech";
import { geminiDirectSpeech } from "./gemini-direct.server";

// Sayar Owl uses a warm, clear, upbeat male voice everywhere.
const GEMINI_VOICES: Record<string, string> = {
  alloy: "Puck",
  sarah: "Puck",
  nova: "Puck",
  shimmer: "Puck",
  echo: "Charon",
  fable: "Puck",
  onyx: "Charon",
};

const DEFAULT_GEMINI_VOICE = "Puck";

function pcmToWav(pcm: Uint8Array, sampleRate = 24000): Uint8Array {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  const out = new Uint8Array(44 + pcm.byteLength);
  out.set(new Uint8Array(header), 0);
  out.set(pcm, 44);
  return out;
}

export type SpeechInput = {
  text: string;
  voice?: string;
  speed?: number;
  provider?: "openai" | string;
  signal?: AbortSignal;
  fetcher?: typeof fetch;
};

/** Keep each caller's preferred voice; all callers can recover using the owner's Gemini key. */
export async function generateSpeech({
  text,
  voice,
  speed,
  provider,
  signal,
  fetcher = fetch,
}: SpeechInput): Promise<Response> {
  const lovableKey = process.env.LOVABLE_API_KEY?.trim();
  const clean = sanitizeForSpeech(text);
  if (!clean) return new Response("empty text", { status: 400 });
  const input = clean.slice(0, 3500);
  const safeSpeed = Math.min(1.3, Math.max(0.7, speed ?? 1));
  const geminiVoice = (voice && GEMINI_VOICES[voice.toLowerCase()]) || DEFAULT_GEMINI_VOICE;
  const cancelled = () => new Response("Speech preparation cancelled", { status: 499 });
  if (signal?.aborted) return cancelled();
  const wav = (pcm: Uint8Array) =>
    new Response(pcmToWav(pcm).slice().buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
        "X-TTS-Provider": "gemini",
      },
    });
  let lastStatus: number | undefined;
  const gateway = async (openai: boolean): Promise<Response | null> => {
    if (!lovableKey || signal?.aborted) return null;
    try {
      const upstream = await fetcher("https://ai.gateway.lovable.dev/v1/audio/speech", {
        method: "POST",
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(provider === "gemini" ? 60000 : 15000)])
          : AbortSignal.timeout(provider === "gemini" ? 60000 : 15000),
        headers: {
          "Lovable-API-Key": lovableKey,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(
          openai
            ? {
                model: process.env.LOVABLE_TTS_FALLBACK_MODEL?.trim() || "openai/gpt-4o-mini-tts",
                input,
                voice: provider === "openai" && voice ? voice.toLowerCase() : "echo",
                response_format: "mp3",
                speed: safeSpeed,
              }
            : {
                model: process.env.LOVABLE_TTS_MODEL?.trim() || "google/gemini-2.5-flash-tts",
                contents: [{ role: "user", parts: [{ text: geminiSpeechPrompt(input) }] }],
                generationConfig: {
                  responseModalities: ["AUDIO"],
                  speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } },
                  },
                },
              },
        ),
      });
      lastStatus = upstream.status;
      if (!upstream.ok) {
        await upstream.body?.cancel();
        return null;
      }
      const bytes = new Uint8Array(await upstream.arrayBuffer());
      if (bytes.byteLength < 1024) return null;
      if (
        !openai &&
        !(bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46)
      )
        return wav(bytes);
      return new Response(bytes.slice().buffer as ArrayBuffer, {
        headers: {
          "Content-Type": openai ? "audio/mpeg" : "audio/wav",
          "Cache-Control": "no-store",
          "X-TTS-Provider": openai ? "openai" : "gemini",
        },
      });
    } catch {
      return null;
    }
  };
  const primary = await gateway(provider === "openai");
  if (primary) return primary;
  if (signal?.aborted) return cancelled();
  // Includes explicit OpenAI requests from Grade 10/11 speaking and Gemini-only classrooms.
  const pcm = await geminiDirectSpeech(input, geminiVoice, fetcher, signal);
  if (signal?.aborted) return cancelled();
  if (pcm) return wav(pcm);
  // Keep legacy alternative voice for general callers, but avoid the same exhausted gateway.
  if (
    provider !== "openai" &&
    provider !== "gemini" &&
    ![402, 403, 429].includes(lastStatus ?? 0)
  ) {
    const alternate = await gateway(true);
    if (alternate) return alternate;
  }
  return signal?.aborted ? cancelled() : providerUnavailable();
}
