import { withAiCredit } from "@/lib/ai-credit.server";
import { validateGrade11Speaking } from "@/lib/grade11SpeakingSessions.server";
import { grade11GrammarAudio } from "@/lib/grade11GrammarAudioCache.server";
import { generateSpeech } from "@/lib/ttsGenerate.server";
import { requireUser, untrusted, cleanLine } from "@/lib/api-guard.server";
import { createFileRoute } from "@tanstack/react-router";


type TtsBody = {
  grade11SpeakingSession?: string;
  grade11SpeakingUnit?: number;
  lessonCache?: string;
  text?: string;
  voice?: string;
  speed?: number;
  provider?: "openai";
};

/**
 * Voice pipeline for Sayar Owl.
 *
 * Primary: Google Gemini TTS through the Lovable AI Gateway — it reads
 * Burmese (Pyidaungsu Unicode) naturally, which ElevenLabs/OpenAI voices do not.
 * Fallback: OpenAI gpt-4o-mini-tts through the same gateway.
 */

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authed = await requireUser(request, { enforceAccountStatus: true });
        if (authed instanceof Response) return authed;
        const {
          text,
          voice,
          speed,
          provider,
          lessonCache,
          grade11SpeakingSession,
          grade11SpeakingUnit,
        } = (await request.json()) as TtsBody;
        if (!text || typeof text !== "string") {
          return new Response("text is required", { status: 400 });
        }

        if (grade11SpeakingSession !== undefined) {
          const access = await validateGrade11Speaking(
            request,
            grade11SpeakingSession,
            Number(grade11SpeakingUnit),
          );
          if (access instanceof Response) return access;
        }
        const generate = () => withAiCredit(request, "speech", () => generateSpeech({ text, voice, speed, provider }));
        return lessonCache === "grade11-unit1" || lessonCache === "grade11-grammar"
          ? grade11GrammarAudio(request, { text, voice, speed, provider }, generate)
          : generate();
      },
    },
  },
});
