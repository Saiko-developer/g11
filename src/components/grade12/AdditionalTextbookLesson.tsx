import { useState } from "react";
import { Grade11Pronunciation } from "@/components/grade11/Grade11Pronunciation";
import { Grade11RequireSignIn } from "@/components/grade11/Grade11RequireSignIn";
import { Grade11RolePlay } from "@/components/grade11/Grade11RolePlay";
import { UnitGrammarVideos } from "@/components/grade11/Grade11GrammarVideos";
import { PracticePanel } from "@/components/grade11/Grade11SpeakingPractice";
import { ToggleReveal } from "@/components/lesson/ExerciseKit";
import { GrammarScriptView } from "@/components/lesson/GrammarScriptView";
import { Button } from "@/components/ui/button";
import { additionalGrammar } from "@/data/grade12/additionalGrammar";
import { additionalRoleplay } from "@/data/grade12/additionalRoleplay";
import {
  additionalUnits,
  type AdditionalExerciseGroup,
  type AdditionalUnitNumber,
} from "@/data/grade12/additionalUnits";
import { grade12SkillTopics, type Grade12Skill } from "@/data/grade12/syllabus";
import { Answer, BurmeseTranslation, English, ReadingWorkspace } from "./Unit1Lesson";

function Exercise({
  group,
  skill,
  readingContext,
}: {
  group: AdditionalExerciseGroup;
  skill: Grade12Skill;
  readingContext: string;
}) {
  const { source, translation, structure, entries, informational } = group;
  const tick = group.input === "tick" || group.input === "personal";
  const pronunciation = informational && skill === "vocabulary";

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h3 lang="en" className="font-semibold">
        {source.instruction}
      </h3>
      <BurmeseTranslation label="Translate instructions" text={translation.instruction} />
      {entries.map((entry, position) => {
        if (entry.kind === "reference") {
          return (
            <div className="space-y-2 rounded-lg bg-muted/45 p-3" key={position}>
              <English text={entry.line.en} />
              <BurmeseTranslation label="Translate reference" text={entry.line.my} />
            </div>
          );
        }
        const {
          item: { text, choices, answer },
          index,
        } = entry;
        const sentenceStructure = structure[index];
        const vocabularyWords =
          skill === "vocabulary" && !informational
            ? [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((match) => match[1])
            : [];
        if (
          skill === "vocabulary" &&
          !informational &&
          vocabularyWords.length === 0 &&
          /^[a-z][a-z -]+$/i.test(text) &&
          text.split(" ").length <= 3
        ) {
          vocabularyWords.push(text);
        }
        return (
          <div key={position} className="space-y-2 border-t pt-3">
            <div className="flex items-start gap-2">
              {tick && (
                <input type="checkbox" aria-label={text} className="mt-1.5 size-4 shrink-0" />
              )}
              {!informational && !tick && !/^\([a-z]\)/i.test(text) && (
                <span className="shrink-0 text-muted-foreground">{index + 1}.</span>
              )}
              <English text={text} />
              {pronunciation && <Grade11Pronunciation text={text} />}
              {vocabularyWords.map((word) => (
                <Grade11Pronunciation key={word} text={word} />
              ))}
            </div>
            {pronunciation ? (
              <>
                <p lang="my" className="text-sm text-muted-foreground">
                  {translation.items[index]}
                </p>
                {sentenceStructure && <English text={sentenceStructure} />}
                {choices?.[0] && <BurmeseTranslation label="Translate example" text={choices[0]} />}
              </>
            ) : (
              <>
                <BurmeseTranslation label="Translate question" text={translation.items[index]} />
                {skill === "reading" && sentenceStructure && (
                  <ToggleReveal
                    label="Sentence Structure"
                    hiddenLabel="Hide sentence structure"
                    tone="primary"
                  >
                    <p lang="my">{sentenceStructure}</p>
                  </ToggleReveal>
                )}
              </>
            )}
            {!informational && group.input !== "tick" && (
              <Answer
                prompt={tick ? `Correction: ${text}` : text}
                choices={choices}
                expected={answer}
                subjective={Boolean(sentenceStructure) || (!answer && skill !== "listening")}
                review={
                  sentenceStructure && skill === "reading"
                    ? {
                        instructions: source.instruction,
                        context: readingContext,
                      }
                    : undefined
                }
              />
            )}
          </div>
        );
      })}
      {!informational && source.items.length === 0 && (
        <Answer prompt={source.instruction} subjective />
      )}
    </section>
  );
}

export function AdditionalTextbookLesson({
  unit,
  skill,
}: {
  unit: AdditionalUnitNumber;
  skill: Grade12Skill;
}) {
  const [speakingMode, setSpeakingMode] = useState<"lesson" | "shadowing" | "ai">("lesson");
  const data = additionalUnits[unit];
  const { pages, groups } = data.sections[skill];
  const speaking = skill === "speaking";
  const readingContext = skill === "reading" ? data.reading.join("\n\n") : "";
  const exercises = groups.map((group) => (
    <Exercise
      key={group.source.instruction}
      group={group}
      skill={skill}
      readingContext={readingContext}
    />
  ));
  const shadowing = data.shadowing.map((line, index) => ({
    ...line,
    id: `g12-u${unit}-shadow-${index + 1}`,
    page: Number(data.sections.speaking.pages.split("–")[0]),
  }));
  const modes = [
    { value: "lesson", label: "သင်ခန်းစာ" },
    ...(shadowing.length > 0 ? [{ value: "shadowing", label: "လိုက်ဆို" } as const] : []),
    { value: "ai", label: "Practise with AI" },
  ] as const;
  return (
    <article className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
      <header>
        <h2 className="text-xl font-semibold">{grade12SkillTopics[unit][skill]}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Textbook pages {pages}</p>
      </header>
      {skill === "listening" && (
        <p lang="my" className="rounded-lg bg-muted p-3 text-sm">
          မူရင်းနားထောင်ရန် အသံဖိုင် မထည့်ရသေးပါ။
          {unit !== 7 && " အသံနှင့် တိုက်စစ်ရမည့် အဖြေအချို့ကို ဖိုင်ရပြီးမှ ထည့်ပါမည်။"}
        </p>
      )}
      {skill === "grammar" && (
        <>
          <GrammarScriptView grammar={additionalGrammar[unit]} />
          <UnitGrammarVideos videos={[]} showPending />
        </>
      )}
      {speaking && (
        <nav className="flex flex-wrap gap-2" aria-label={`Grade 12 Unit ${unit} speaking modes`}>
          {modes.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant={speakingMode === value ? "default" : "outline"}
              aria-pressed={speakingMode === value}
              onClick={() => setSpeakingMode(value)}
            >
              {label}
            </Button>
          ))}
        </nav>
      )}
      {speaking && speakingMode === "ai" && (
        <Grade11RequireSignIn>
          <Grade11RolePlay unit={unit} exercise={additionalRoleplay[unit].id} />
        </Grade11RequireSignIn>
      )}
      {speaking && speakingMode === "shadowing" && (
        <PracticePanel grade={12} unit={unit} textbookLines={shadowing} />
      )}
      {skill === "reading" ? (
        <ReadingWorkspace
          passage={
            <>
              {exercises[0]}
              {data.passage.map(({ en, my, heading }) => (
                <section key={en} className="space-y-2 rounded-xl border p-4">
                  {heading ? (
                    <h3 lang="en" className="font-semibold">
                      {en}
                    </h3>
                  ) : (
                    <English text={en} />
                  )}
                  <BurmeseTranslation text={my} />
                </section>
              ))}
            </>
          }
          exercises={exercises.slice(1)}
        />
      ) : (
        speakingMode === "lesson" && <div className="space-y-4">{exercises}</div>
      )}
      {unit === 7 && speaking && speakingMode === "lesson" && (
        <details className="space-y-3 rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">Textbook dialogue · Exercise A</summary>
          {data.shadowing.map(({ en, my }) => (
            <div className="space-y-1 border-t pt-2" key={en}>
              <English text={en} />
              <BurmeseTranslation text={my} />
            </div>
          ))}
        </details>
      )}
    </article>
  );
}
