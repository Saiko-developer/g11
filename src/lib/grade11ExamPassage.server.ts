/** Reads actual textbook passages across both existing Grade 11 data formats. */
import unit7 from "@/data/grade11/textbook/unit7-text.json";
import upper from "@/data/grade11/textbook/upper-lesson-text.json";
type Block = { t?: string; x?: string; en?: string; area?: string };
type Section = { title?: string; blocks?: Block[] };
const loaders = import.meta.glob<{ default: unknown }>("/src/data/grade11/textbook/unit*.json");
export async function grade11ReadingPassage(unit: number, maxChars = 2500): Promise<string> {
  if (!Number.isInteger(unit) || unit < 1 || unit > 12) return "";
  let blocks: Block[];
  if (unit === 7) blocks = unit7.reading;
  else if (unit >= 8)
    blocks = (upper.units as Record<string, { reading: Block[] }>)[unit]?.reading ?? [];
  else {
    const load = loaders[`/src/data/grade11/textbook/unit${unit}.json`];
    if (!load) return "";
    const data = (await load()).default;
    if (!Array.isArray(data)) return "";
    blocks =
      (data as Section[]).find((section) => /reading/i.test(section.title ?? ""))?.blocks ?? [];
  }
  return blocks
    .filter((block) => block.t === "para" && block.area !== "exercise")
    .map((block) => (block.x ?? block.en ?? "").replace(/^\d+\.\s*_{2,}\s*/m, "").trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, Math.max(0, maxChars));
}
