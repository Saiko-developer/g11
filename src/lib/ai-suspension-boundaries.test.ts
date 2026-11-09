import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
import { Route as tts } from "../routes/api/tts";
import { Route as transcription } from "../routes/api/transcribe";
import { Route as chat } from "../routes/api/chat-home";
import { handleGrade11Roleplay } from "./grade11Roleplay.server";
const post = (route: unknown) =>
  (route as { server: { handlers: { POST: (args: { request: Request }) => Promise<Response> } } })
    .server.handlers.POST;
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://database.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-key");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/v1/user")) return Response.json({ id: "student" });
      if (url.endsWith("/rpc/my_access"))
        return Response.json({ status: "suspended", is_admin: false });
      throw new Error("Unexpected paid provider or quota request");
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it.each([
  ["speech", post(tts)],
  ["transcription", post(transcription)],
  ["popup", post(chat)],
  ["roleplay", ({ request }: { request: Request }) => handleGrade11Roleplay(request)],
] as const)(
  "%s refuses a suspended caller before provider/quota/session work",
  async (_name, handler) => {
    const response = await handler({
      request: new Request("https://school.test/api/test", {
        method: "POST",
        headers: { Authorization: "Bearer token" },
      }),
    });
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("account_suspended");
    expect(
      vi
        .mocked(fetch)
        .mock.calls.every(([url]) => String(url).startsWith("https://database.test/")),
    ).toBe(true);
  },
);
