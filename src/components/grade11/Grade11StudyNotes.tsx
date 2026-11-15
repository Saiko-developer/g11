import type { Unit1Block } from "@/lib/grade11Unit1";
/** Source text and Burmese stay together, without a translation button on every line. */
export function Grade11StudyNotes({ blocks }: { blocks: Unit1Block[] }) {
  const groups: { title?: Unit1Block; items: Unit1Block[] }[] = [];
  for (const block of blocks.filter((b) => b.t !== "scan")) {
    const heading =
      ["h", "sub", "ins"].includes(block.t) ||
      /^(Introduction|Body|Conclusion|Useful Language|Vocabulary|Sentence connectors)$/.test(
        block.x,
      );
    if (heading) groups.push({ title: block, items: [] });
    else {
      if (!groups.length) groups.push({ items: [] });
      groups.at(-1)!.items.push(block);
    }
  }
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2" aria-label="Bilingual study notes">
      {groups.map((group, i) => (
        <section
          key={group.title?.id ?? i}
          data-exercise={group.title?.id}
          className={`min-w-0 rounded-2xl border border-border bg-background p-4 sm:p-5 ${["3B-3", "4E-12"].includes(group.title?.id ?? "") || group.items.some((b) => b.t === "para") ? "md:col-span-2" : ""}`}
        >
          {group.title && (
            <header className="mb-4 border-b border-border pb-3">
              <h4 className="font-semibold leading-relaxed text-primary">{group.title.x}</h4>
              {group.title.my && (
                <p lang="my" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {group.title.my}
                </p>
              )}
            </header>
          )}
          <div
            className={
              ["3B-3", "4E-12"].includes(group.title?.id ?? "")
                ? "grid gap-3 sm:grid-cols-2"
                : "space-y-3"
            }
          >
            {group.items.map((block) => (
              <div key={block.id} className="rounded-xl bg-secondary/40 p-3">
                <p lang="en" className="whitespace-pre-line break-words text-sm leading-relaxed">
                  {group.title?.id === "3B-3" ? (
                    <>
                      <strong className="block text-base text-primary">
                        {block.x.split(" = ")[0]}
                      </strong>
                      <span className="mt-2 block">
                        {block.x.split(" = ").slice(1).join(" = ")}
                      </span>
                    </>
                  ) : (
                    block.x
                  )}
                </p>
                {block.my && (
                  <p
                    lang="my"
                    className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
                  >
                    {block.my}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
