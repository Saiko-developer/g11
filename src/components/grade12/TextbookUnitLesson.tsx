import { unit2ExercisesMy } from "@/data/grade12/unit2-exercises-my";
import {
  unit3Affixes,
  unit3Exercises,
  unit3Reading,
  unit3ReadingMy,
  unit3References,
  unit3SpeakingTopics,
} from "@/data/grade12/unit3";
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
  unit2ComprehensionSamples,
  unit2References,
  unit2VocabularyMy,
  unit2SpeakingLines,
} from "@/data/grade12/unit2";
import { grade12SkillTopics, type Grade12Skill } from "@/data/grade12/syllabus";

const unit2Pages: Record<Grade12Skill, string> = {
  reading: "12–15",
  vocabulary: "15–16",
  grammar: "16–18",
  listening: "18–19",
  speaking: "19",
  writing: "19–20",
};

const unit3Pages: Record<Grade12Skill, string> = {
  reading: "22–25",
  vocabulary: "25–27",
  grammar: "27–28",
  listening: "29",
  speaking: "29–30",
  writing: "30–31",
};

function AffixTables() {
  return Object.entries(unit3Affixes).map(([label, entries]) => (
    <div key={label} className="overflow-x-auto rounded-xl border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted">
          <tr>
            {[label, "Meaning", "Examples"].map((heading) => (
              <th key={heading} scope="col" className="p-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(([affix, meaning, examples]) => (
            <tr key={affix} className="border-t">
              <th scope="row" className="p-3 font-medium">
                {affix}
              </th>
              <td className="p-3">{meaning}</td>
              <td className="p-3">{examples}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ));
}

export function TextbookUnitLesson({ unit, skill }: { unit: 2 | 3; skill: Grade12Skill }) {
  const [shadowing, setShadowing] = useState(false);
  const [speakingTopic, setSpeakingTopic] = useState("");
  const groups = unit === 2 ? unit2Exercises[skill] : unit3Exercises[skill];
  const reading = unit === 2 ? unit2Reading : unit3Reading;
  const readingMy = unit === 2 ? unit2ReadingMy : unit3ReadingMy;
  const translated = unit === 2 ? unit2ExercisesMy[skill] : undefined;
  const exercises = groups.map(({ instruction, reference, items }, groupIndex) => (
    <section key={instruction} className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="font-semibold">{instruction}</h3>
      {translated?.[groupIndex] && (
        <BurmeseTranslation
          label="Translate instructions"
          text={translated[groupIndex].instruction}
        />
      )}
      {unit === 3 && skill === "speaking" && (
        <label className="block text-sm font-medium">
          Choose a speaking topic
          <select
            value={speakingTopic}
            onChange={(event) => setSpeakingTopic(event.target.value)}
            className="mt-1 block w-full rounded-lg border bg-background p-2"
          >
            <option value="">Choose a card</option>
            {unit3SpeakingTopics.map((topic) => (
              <option key={topic}>{topic}</option>
            ))}
          </select>
        </label>
      )}
      {reference && <English text={reference} />}
      {translated?.[groupIndex]?.reference && (
        <BurmeseTranslation label="Translate reference" text={translated[groupIndex].reference} />
      )}
      <ol className="list-decimal space-y-3 pl-5">
        {items.map(({ text, answer, choices }, index) => (
          <li className="space-y-2 border-t pt-3" key={text}>
            <div className="flex flex-wrap items-center gap-x-2">
              <English text={text} />
              {unit === 2 && skill === "vocabulary" && unit2VocabularyMy[text] && (
                <Grade11Pronunciation text={text} />
              )}
            </div>
            {unit === 2 && skill === "vocabulary" && unit2VocabularyMy[text] && (
              <p lang="my" className="text-sm text-muted-foreground">
                {unit2VocabularyMy[text]}
              </p>
            )}
            {translated?.[groupIndex]?.items[index] && (
              <BurmeseTranslation
                label="Translate question"
                text={translated[groupIndex].items[index]}
              />
            )}
            <Answer
              prompt={unit === 3 && skill === "speaking" && speakingTopic ? speakingTopic : text}
              expected={
                unit === 2 && skill === "reading" && groupIndex === 3
                  ? unit2ComprehensionSamples[index]
                  : answer
              }
              choices={choices}
              subjective={!answer && !choices}
              review={
                skill === "reading" && instruction.startsWith(unit === 2 ? "C." : "D.")
                  ? { instructions: instruction, context: reading.join("\n\n") }
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
      ? (unit === 2 ? unit2References : unit3References)[skill]
      : null;
  return (
    <article className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
      <h2 className="text-xl font-semibold">{grade12SkillTopics[unit][skill]}</h2>
      <p className="text-xs text-muted-foreground">
        Textbook pages {(unit === 2 ? unit2Pages : unit3Pages)[skill]}
      </p>
      {skill === "listening" && (
        <p lang="my" className="rounded-xl bg-muted p-3 text-sm">
          မူရင်းနားထောင်ရန် အသံဖိုင် မထည့်ရသေးပါ။
        </p>
      )}
      {skill === "grammar" && (
        <>
          {unit === 2 && <GrammarScriptView grammar={unit2Grammar} />}
          <UnitGrammarVideos videos={unit === 2 ? videos["2"] : []} showPending />
        </>
      )}
      {unit === 2 && skill === "speaking" && (
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
      {reference && (
        <div className="space-y-3 rounded-xl border p-4">
          {unit === 2 && skill === "writing" && (
            <h3 className="font-semibold">Some important hints for summary writing</h3>
          )}
          {reference.map((text) => (
            <English key={text} text={text} />
          ))}
        </div>
      )}
      {unit === 3 && skill === "vocabulary" && <AffixTables />}
      {skill === "reading" ? (
        <ReadingWorkspace
          passage={
            <>
              {exercises[0]}
              {reading.map((text, index) =>
                /^\d+\. /.test(text) ? (
                  <h3 key={text} className="font-semibold">
                    {text}
                  </h3>
                ) : (
                  <div key={text} className="rounded-xl border p-3">
                    <English text={text} />
                    {readingMy[index] && <BurmeseTranslation text={readingMy[index]} />}
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
