import { providerFailure } from "./ai-provider.server";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModelV3, LanguageModelV3StreamPart } from "@ai-sdk/provider";

export const DEFAULT_LOVABLE_CHAT_MODEL = "google/gemini-3-flash-preview";
/** Model used on the direct Google Gemini fallback (own GEMINI_API_KEY). */
export const DEFAULT_GEMINI_FALLBACK_MODEL = "gemini-3.5-flash";

/** Create a server-only OpenAI-compatible client for Lovable's AI Gateway. */
export function createLovableGatewayClient() {
  const key = process.env.LOVABLE_API_KEY?.trim();
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  return createOpenAI({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: key,
    headers: {
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}

function geminiFallbackModel(): LanguageModelV3 | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const modelId = process.env.GEMINI_FALLBACK_MODEL?.trim() || DEFAULT_GEMINI_FALLBACK_MODEL;
  return createGoogleGenerativeAI({ apiKey: key })(modelId);
}

/** Fail over once before any generated content is delivered; never replay partial output. */
export function withGeminiFallback(
  primary: LanguageModelV3,
  allowFallback = true,
): LanguageModelV3 {
  const fallback = allowFallback ? geminiFallbackModel() : null;
  const failover = (error: unknown, signal?: AbortSignal) => {
    if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
    console.warn("[ai] primary provider unavailable", { fallbackConfigured: !!fallback });
    if (!fallback) throw providerFailure();
    return fallback;
  };
  return {
    specificationVersion: "v3",
    provider: primary.provider,
    modelId: primary.modelId,
    supportedUrls: primary.supportedUrls,
    async doGenerate(options) {
      try {
        return await primary.doGenerate(options);
      } catch (error) {
        const backup = failover(error, options.abortSignal);
        try {
          return await backup.doGenerate(options);
        } catch (failure) {
          if (options.abortSignal?.aborted) throw failure;
          throw providerFailure();
        }
      }
    },
    async doStream(options) {
      let reader: ReadableStreamDefaultReader<LanguageModelV3StreamPart> | undefined;
      try {
        const result = await primary.doStream(options);
        reader = result.stream.getReader();
        const prefix: LanguageModelV3StreamPart[] = [];
        // SDK providers may return an error frame instead of throwing doStream.
        // Buffer only the prelude, stopping at the first visible/tool output.
        for (let i = 0; i < 32; i++) {
          const next = await reader.read();
          if (next.done) break;
          if (next.value.type === "error") throw next.value.error;
          prefix.push(next.value);
          if (
            ["text-delta", "reasoning-delta", "tool-call", "tool-input-delta"].includes(
              next.value.type,
            )
          )
            break;
        }
        const source = reader;
        return {
          ...result,
          stream: new ReadableStream<LanguageModelV3StreamPart>({
            start(controller) {
              for (const part of prefix) controller.enqueue(part);
            },
            async pull(controller) {
              try {
                const next = await source.read();
                if (next.done) controller.close();
                else
                  controller.enqueue(
                    next.value.type === "error"
                      ? { type: "error", error: providerFailure() }
                      : next.value,
                  );
              } catch (error) {
                controller.error(options.abortSignal?.aborted ? error : providerFailure());
              }
            },
            cancel(reason) {
              return source.cancel(reason);
            },
          }),
        };
      } catch (error) {
        await reader?.cancel().catch(() => {});
        const backup = failover(error, options.abortSignal);
        try {
          const result = await backup.doStream(options);
          return {
            ...result,
            stream: result.stream.pipeThrough(
              new TransformStream<LanguageModelV3StreamPart, LanguageModelV3StreamPart>({
                transform(part, controller) {
                  controller.enqueue(
                    part.type === "error" ? { type: "error", error: providerFailure() } : part,
                  );
                },
              }),
            ),
          };
        } catch (failure) {
          if (options.abortSignal?.aborted) throw failure;
          throw providerFailure();
        }
      }
    },
  };
}

/** Supports Gemini-only environments too, without exposing either key to browsers. */
export function getChatModel(modelId: string): LanguageModelV3 {
  if (!process.env.LOVABLE_API_KEY?.trim()) {
    const backup = geminiFallbackModel();
    if (!backup) throw providerFailure();
    return withGeminiFallback(backup, false);
  }
  return withGeminiFallback(createLovableGatewayClient().chat(modelId) as LanguageModelV3);
}

export function getLovableChatModel(setting = "LOVABLE_CHAT_MODEL") {
  const modelId = process.env[setting]?.trim() || DEFAULT_LOVABLE_CHAT_MODEL;
  return getChatModel(modelId);
}
