import { supabaseAdmin as db } from "./src/integrations/supabase/client.server";
import { grade11GrammarAudio, isPlayableWav } from "./src/lib/grade11GrammarAudioCache.server";
import { generateSpeech } from "./src/lib/ttsGenerate.server";
import { grade11AuthoredClips, grade11AudioHash } from "./src/lib/grade11GrammarAudioCache.server";
const bad = ["39f721598ba8b11c8bff351fc81434f32380c59ad03764941c340b7fed9ac090","94016efd49809c4540982d5a9d0c56f9f4a8ab4332dfb3bf33aa311701ac5ec1"];
await db.storage.from("grade11-grammar-audio").remove(bad.map(h=>`${h}.wav`));
const r = await db.from("grade11_grammar_audio").delete().in("hash", bad);
console.log("deleted", r.error?.message ?? "ok");
for (const c of grade11AuthoredClips()) {
  const h = await grade11AudioHash(c.text);
  if (h !== bad[0]) continue;
  const res = await grade11GrammarAudio(new Request("https://x/api/tts"), { text: c.text, voice: "sarah", speed: 1 },
    () => generateSpeech({ text: c.text, voice: "sarah", speed: 1 } as any) as any);
  const b = await res.arrayBuffer();
  console.log(res.status, res.headers.get("X-Grade11-Audio-Cache"), b.byteLength, isPlayableWav(b));
}
const { data } = await db.from("grade11_grammar_audio").select("status,bytes").eq("hash", bad[0]);
console.log(data);
