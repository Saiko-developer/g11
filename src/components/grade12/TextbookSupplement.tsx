import { Fragment } from "react";
import { Answer, BurmeseTranslation, English, ReadingPane } from "./Unit1Lesson";
import { textbookReviews, type BilingualText, type SupplementItem } from "@/data/grade12/reviews";
import { textbookPoems } from "@/data/grade12/poems";

export const supplementNumbers = [1, 2, 3, 4] as const;
export type SupplementNumber = (typeof supplementNumbers)[number];

function Bilingual({ text: [english, myanmar] }: { text: BilingualText }) {
  return (
    <>
      <English text={english} />
      <BurmeseTranslation text={myanmar} />
    </>
  );
}

function Questions({
  items,
  open = false,
  bank,
}: {
  items: readonly SupplementItem[];
  open?: boolean;
  bank?: readonly string[];
}) {
  return (
    <ol className="space-y-3">
      {items.map(([english, myanmar, answer, choices], index) => (
        <li key={english} className="rounded-lg border bg-background/50 p-3">
          <div className="mb-2 grid grid-cols-[1.7rem_1fr] gap-1">
            <span aria-hidden="true" className="pt-0.5 text-sm font-semibold text-primary">
              {index + 1}.
            </span>
            <div className="min-w-0">
              <Bilingual text={[english, myanmar]} />
            </div>
          </div>
          <Answer prompt={english} expected={answer} choices={choices ?? bank} subjective={open} />
        </li>
      ))}
    </ol>
  );
}

export function TextbookReview({ number }: { number: SupplementNumber }) {
  const groups = textbookReviews[number - 1];

  return (
    <div className="space-y-3">
      <nav aria-label="Review exercises" className="flex flex-wrap gap-2">
        {groups.map((group, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <a
              key={letter}
              href={`#review-${number}-${letter}`}
              title={group.instructions[0]}
              className="rounded-md border bg-card px-3 py-1.5 text-sm font-medium text-primary hover:border-primary"
            >
              Exercise {letter}
            </a>
          );
        })}
      </nav>
      {groups.map((group, index) => {
        const letter = String.fromCharCode(65 + index);
        return (
          <div key={letter} id={`review-${number}-${letter}`} className="scroll-mt-20">
            <ReadingPane title={`Exercise ${letter}`} scroll={false}>
              <div className="font-medium">
                <Bilingual text={group.instructions} />
              </div>
              {group.bank && (
                <ul aria-label="Word bank" className="flex flex-wrap gap-2">
                  {group.bank.map((entry) => (
                    <li key={entry[0]} className="rounded-lg bg-accent/20 px-3 py-1.5 text-sm">
                      <Bilingual text={entry} />
                    </li>
                  ))}
                </ul>
              )}
              <Questions
                items={group.items}
                open={group.open}
                bank={group.bank?.map(([word]) => word)}
              />
            </ReadingPane>
          </div>
        );
      })}
    </div>
  );
}

export function TextbookPoem({ number }: { number: SupplementNumber }) {
  const poem = textbookPoems[number - 1];
  const table = poem.table;
  const writingTitle = table ? "5. Writing" : "4. Writing";

  return (
    <div className="grid items-start gap-3 lg:grid-cols-2">
      <ReadingPane title="2. Read the poem">
        <div className="space-y-4 rounded-lg bg-accent/15 px-4 py-4 sm:px-6">
          <BurmeseTranslation text={poem.titleMy} />
          <p className="text-sm font-semibold text-primary" lang="en">
            {poem.author[0]}
          </p>
          <BurmeseTranslation text={poem.author[1]} />
          {poem.overview && <Bilingual text={poem.overview} />}
          {poem.stanzas?.map((stanza) => (
            <div key={stanza[0]} className="font-serif text-base sm:text-lg">
              <Bilingual text={stanza} />
            </div>
          ))}
        </div>
        {poem.glossary && (
          <section className="space-y-2">
            <h3 className="font-semibold">Glossary</h3>
            <dl className="divide-y rounded-lg border px-3">
              {poem.glossary.map(([term, en, my]) => (
                <div
                  key={term}
                  className="grid gap-1 py-2 text-sm sm:grid-cols-[minmax(7rem,1fr)_2fr]"
                >
                  <dt className="font-semibold text-primary" lang="en">
                    {term}
                  </dt>
                  <dd>
                    <Bilingual text={[en, my]} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </ReadingPane>
      <ReadingPane title="Pre-reading and exercises">
        <details className="space-y-2 rounded-lg border p-3">
          <summary className="cursor-pointer font-semibold">1. Pre-reading</summary>
          {poem.illustration && (
            <div className="rounded-md bg-accent/20 p-2 text-sm">
              <Bilingual text={poem.illustration} />
            </div>
          )}
          <Questions items={poem.preReading} open />
        </details>
        <section className="space-y-2">
          <h3 className="font-semibold">3. Answer the following questions.</h3>
          <BurmeseTranslation text="အောက်ပါ မေးခွန်းများကို ဖြေပါ။" />
          <Questions items={poem.questions} open />
        </section>
        {table && (
          <section className="space-y-2 rounded-lg border p-3">
            <h3 className="font-semibold" lang="en">
              4. {table.instructions[0]}
            </h3>
            <BurmeseTranslation text={table.instructions[1]} />
            <table className="w-full table-fixed text-sm">
              <caption className="sr-only">{table.instructions[0]}</caption>
              {table.headings && (
                <thead className="bg-primary/10">
                  <tr>
                    {table.headings.map((heading) => (
                      <th className="p-2 text-left" scope="col" key={heading[0]}>
                        <Bilingual text={heading} />
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody className="divide-y">
                {table.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map(([en, my, answer], cellIndex) => (
                      <td key={cellIndex} className="p-2 align-top">
                        <Bilingual text={[en, my]} />
                        {answer && (
                          <Answer
                            prompt={`${table.headings?.[cellIndex]?.[0] ?? "Missing phrase"} for ${row[1 - cellIndex][0]}`}
                            expected={answer}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        <section className="space-y-2 rounded-lg border p-3">
          <h3 className="font-semibold">{writingTitle}</h3>
          <Bilingual text={poem.writing} />
          {poem.example && (
            <div className="rounded-md bg-accent/20 p-3">
              <Bilingual text={poem.example} />
            </div>
          )}
          {poem.points && (
            <ul className="list-disc space-y-1 ps-5">
              {poem.points.map((point) => (
                <li key={point[0]}>
                  <Bilingual text={point} />
                </li>
              ))}
            </ul>
          )}
          {Array.from({ length: poem.writingCount ?? 1 }, (_, index) => (
            <Fragment key={index}>
              {poem.writingCount && (
                <label htmlFor={`poem-writing-${index}`} className="block text-sm font-medium">
                  Item {index + 1}
                </label>
              )}
              <textarea
                id={`poem-writing-${index}`}
                aria-label={poem.writingCount ? `Item ${index + 1}` : poem.writing[0]}
                rows={poem.writingCount ? 2 : 5}
                className="w-full rounded-lg border bg-background p-2 text-sm"
              />
            </Fragment>
          ))}
        </section>
      </ReadingPane>
    </div>
  );
}
