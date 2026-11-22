import { GrammarScriptView } from "@/components/lesson/GrammarScriptView";
import { UnitGrammarVideos } from "@/components/grade11/Grade11GrammarVideos";
import { PracticePanel } from "@/components/grade11/Grade11SpeakingPractice";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { unit2Grammar } from "@/data/grade12/unit2-grammar";
import videos from "@/data/grade12/grammarVideos.json";
import { Grade11Pronunciation } from "@/components/grade11/Grade11Pronunciation";
import { Answer, BurmeseTranslation, English, ReadingWorkspace } from "./Unit1Lesson";
import {
  unit2Exercises,
  unit2Reading,
  unit2ReadingMy,
  unit2ReadingQuestionsMy,
  unit2ComprehensionSamples,
  unit2References,
  unit2VocabularyMy,
  unit2SpeakingLines,
} from "@/data/grade12/unit2";
import { grade12SkillTopics, type Grade12Skill } from "@/data/grade12/syllabus";

const pages: Record<Grade12Skill, string> = {
  reading: "12–15",
  vocabulary: "15–16",
  grammar: "16–18",
  listening: "18–19",
  speaking: "19",
  writing: "19–20",
};

export function Unit2Lesson({ skill }: { skill: Grade12Skill }) {
  const [shadowing, setShadowing] = useState(false);
  const groups = unit2Exercises[skill];
  const exercises = groups.map(({ instruction, reference, items }, groupIndex) => (
    <section key={instruction} className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{instruction}</h3>
      {skill === "grammar" && (
        <>
          <GrammarScriptView grammar={unit2Grammar} />
          <UnitGrammarVideos videos={videos["2"]} showPending />
        </>
      )}
      {skill === "speaking" && (
        <nav aria-label="Grade 12 Unit 2 speaking modes" className="flex flex-wrap gap-2">
          <Button
            variant={shadowing ? "outline" : "default"}
            aria-pressed={!shadowing}
            onClick={() => setShadowing(false)}
          >
            📖 သင်ခန်းစာ
          </Button>
          <Button
            variant={shadowing ? "default" : "outline"}
            aria-pressed={shadowing}
            onClick={() => setShadowing(true)}
          >
            🎯 လိုက်ဆို
          </Button>
        </nav>
      )}
      {shadowing && <PracticePanel grade={12} unit={2} textbookLines={unit2SpeakingLines} />}
      {reference && <English text={reference} />}
      <ol className="list-decimal space-y-3 pl-5">
        {items.map(({ text, answer, choices }, index) => (
          <li className="space-y-2 border-t pt-3" key={text}>
            <div className="flex flex-wrap items-center gap-x-2">
              <English text={text} />
              {skill === "vocabulary" && unit2VocabularyMy[text] && (
                <Grade11Pronunciation text={text} />
              )}
            </div>
            {skill === "vocabulary" && unit2VocabularyMy[text] && (
              <p lang="my" className="text-sm text-muted-foreground">
                {unit2VocabularyMy[text]}
              </p>
            )}
            {skill === "reading" && (
              <BurmeseTranslation
                label="Translate question"
                text={unit2ReadingQuestionsMy[groupIndex][index]}
              />
            )}
            <Answer
              prompt={text}
              expected={
                skill === "reading" && groupIndex === 3 ? unit2ComprehensionSamples[index] : answer
              }
              choices={choices}
              subjective={!answer && !choices}
              review={
                skill === "reading" && instruction.startsWith("C.")
                  ? { instructions: instruction, context: unit2Reading.join("\n\n") }
                  : undefined
              }
            />
          </li>
        ))}
      </ol>
    </section>
  ));
  const reference =
    skill === "grammar" || skill === "vocabulary" || skill === "writing"
      ? unit2References[skill]
      : null;
  return (
    <article className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
      <h2 className="text-xl font-semibold">{grade12SkillTopics[2][skill]}</h2>
      <p className="text-xs text-muted-foreground">Textbook pages {pages[skill]}</p>
      {skill === "listening" && (
        <p lang="my" className="rounded-xl bg-muted p-3 text-sm">
          မူရင်းနားထောင်ရန် အသံဖိုင် မထည့်ရသေးပါ။
        </p>
      )}
      {reference && (
        <div className="space-y-3 rounded-xl border p-4">
          {skill === "writing" && (
            <h3 className="font-semibold">Some important hints for summary writing</h3>
          )}
          {reference.map((text) => (
            <English key={text} text={text} />
          ))}
        </div>
      )}
      {skill === "reading" ? (
        <ReadingWorkspace
          passage={
            <>
              {exercises[0]}
              {unit2Reading.map((text, index) =>
                /^\d+\. /.test(text) ? (
                  <h3 key={text} className="font-semibold">
                    {text}
                  </h3>
                ) : (
                  <div key={text} className="rounded-xl border p-3">
                    <English text={text} />
                    {unit2ReadingMy[index] && <BurmeseTranslation text={unit2ReadingMy[index]} />}
                  </div>
                ),
              )}
            </>
          }
          exercises={exercises.slice(1)}
        />
      ) : (
        !shadowing && exercises
      )}
    </article>
  );
}
