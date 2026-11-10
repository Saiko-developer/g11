/**
 * Pulls the official Grade 11 textbook reading passage for a unit so the
 * exam's Section V (seen passage) quotes real textbook text.
 */
type Block = { t?: string; x?: string; area?: string };
type Section = { title?: string; blocks?: Block[] };

const loaders = import.meta.glob<{ default: unknown }>("/src/data/grade11/textbook/unit*.json");

export async function grade11ReadingPassage(unit: number, maxChars = 2500): Promise<string> {
  const load = loaders[`/src/data/grade11/textbook/unit${unit}.json`];
  if (!load) return "";
  try {
    const data = (await load()).default;
    if (!Array.isArray(data)) return "";
    const reading = (data as Section[]).find((s) => /reading/i.test(s.title ?? ""));
    const text = (reading?.blocks ?? [])
      .filter((b) => b.t === "para" && b.area !== "exercise" && b.x)
      .map((b) => b.x!.replace(/^\d+\.\s*_{2,}\s*/m, "").trim())
      .join("\n\n");
    return text.slice(0, maxChars);
  } catch {
    return "";
  }
}
