import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { GradeSwitcher } from "@/components/grade11/GradeSwitcher";
import { unit1Sections, unit1AudioUrl } from "@/data/grade12/unit1";

export const Route = createFileRoute("/grade-12/")({
  head: () => ({ meta: [{ title: "Grade 12 English | Sayar Owl Academy" }] }),
  component: Grade12Home,
});

function Grade12Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <GradeSwitcher current={12} />
        <header className="space-y-2">
          <p className="text-sm font-semibold text-primary">Grade 12 English</p>
          <h1 className="text-3xl font-bold">Unit 1 · Good Manners</h1>
          <p className="text-sm text-muted-foreground">
            Grade 12 ပထမသင်ခန်းစာ · Textbook pages 1–10
          </p>
          <a
            className="inline-block text-sm font-medium text-primary underline"
            href="/textbook/grade-12/unit-01-source.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Open original Unit 1 textbook pages (PDF)
          </a>
        </header>
        <nav aria-label="Unit 1 sections" className="flex flex-wrap gap-2">
          {unit1Sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent"
              onClick={() => {
                const target = document.getElementById(section.id);
                if (target instanceof HTMLDetailsElement) target.open = true;
              }}
            >
              {section.code} {section.title}
            </a>
          ))}
        </nav>
        <div className="space-y-4">
          {unit1Sections.map((section, index) => (
            <details
              id={section.id}
              key={section.id}
              open={index === 0 ? true : undefined}
              className="scroll-mt-24 rounded-xl border border-border bg-card"
            >
              <summary className="cursor-pointer px-5 py-4 font-semibold">
                {section.code} {section.title}
                <span className="ms-2 font-normal text-muted-foreground">· {section.topic}</span>
              </summary>
              <div className="space-y-4 border-t border-border px-5 py-4">
                <p className="text-xs text-muted-foreground">Textbook pages {section.pages}</p>
                {section.id === "listening-speaking" &&
                  (unit1AudioUrl ? (
                    <audio
                      controls
                      preload="none"
                      src={unit1AudioUrl}
                      aria-label="Grade 12 Unit 1 listening audio"
                    />
                  ) : (
                    <p className="rounded-lg bg-muted p-3 text-sm">
                      Listening recording pending. Speaking exercises C–E can be practised now.
                    </p>
                  ))}
                <div className="whitespace-pre-wrap [overflow-wrap:anywhere] leading-relaxed">
                  {section.text
                    .split(/(\*\*[^*]+\*\*)/)
                    .map((text, index) =>
                      text.startsWith("**") ? (
                        <strong key={index}>{text.slice(2, -2)}</strong>
                      ) : (
                        text
                      ),
                    )}
                </div>
              </div>
            </details>
          ))}
        </div>
      </main>
    </div>
  );
}
