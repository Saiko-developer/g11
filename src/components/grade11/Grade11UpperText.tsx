import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UPPER_LESSON_TEXT, type UpperTextBlock } from "@/lib/grade11UpperStudy";
import type { UpperUnitNumber } from "@/lib/grade11Upper";
import type { G11SkillKind } from "@/data/grade11/syllabus";

function HighlightedText({ block }: { block: UpperTextBlock }) {
  if (!block.highlights?.length) return <>{block.en}</>;
  const words = new Set(block.highlights);
  return (
    <>
      {block.en.split(/(\b[\w’-]+\b)/).map((part, index) =>
        words.has(part) ? (
          <mark
            key={index}
            className="rounded bg-amber-200/60 px-0.5 text-inherit underline decoration-primary/50"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function Grade11UpperText({ unit, kind }: { unit: UpperUnitNumber; kind: G11SkillKind }) {
  const [translate, setTranslate] = useState(true);
  const blocks = UPPER_LESSON_TEXT[unit]?.[kind] ?? [];
  if (!blocks.length) return null;
  return (
    <article
      aria-label={`Unit ${unit} ${kind} textbook text`}
      className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="font-semibold">
          {kind === "reading" ? "Reading passage" : "Textbook lesson"}
        </h2>
        <Button
          size="sm"
          variant="outline"
          aria-pressed={translate}
          onClick={() => setTranslate((old) => !old)}
        >
          {translate ? "Hide Myanmar translation" : "Show Myanmar translation"}
        </Button>
      </div>
      <div className="space-y-5">
        {blocks.map((block) =>
          block.t === "h" ? (
            <header key={block.id} className="rounded-xl bg-primary/5 p-3">
              <h3 lang="en" className="text-lg font-semibold text-primary">
                {block.en}
              </h3>
              {translate && (
                <p lang="my" className="mt-2 text-sm leading-7 text-muted-foreground">
                  {block.my}
                </p>
              )}
            </header>
          ) : (
            <section
              key={block.id}
              data-text-block={block.id}
              className="rounded-xl border border-border/60 bg-background p-4"
            >
              <p lang="en" className="whitespace-pre-line text-base leading-8">
                <HighlightedText block={block} />
              </p>
              {translate && (
                <p
                  lang="my"
                  className="mt-3 border-t border-border/60 pt-3 text-sm leading-8 text-muted-foreground"
                >
                  {block.my}
                </p>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Textbook {(block.pages?.length ?? 1) > 1 ? "pages" : "page"}{" "}
                {(block.pages ?? [block.page]).map((page) => page - 5).join(", ")}
                {block.sourceLine ? ` · reference line ${block.sourceLine}` : ""}
                {block.paragraph ? ` · Paragraph ${block.paragraph}` : ""}
              </p>
            </section>
          ),
        )}
      </div>
    </article>
  );
}
