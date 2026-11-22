import { Grade11RequireSignIn } from "@/components/grade11/Grade11RequireSignIn";
import { Grade11RolePlay } from "@/components/grade11/Grade11RolePlay";
import { grade12Unit3SpeakingCards } from "@/data/grade12/unit3-roleplay";
import { ToggleReveal } from "@/components/lesson/ExerciseKit";
import { unit3Grammar } from "@/data/grade12/unit3-grammar";
import {
  unit3AffixMeaningsMy,
  unit3ExercisesMy,
  unit3SpeakingTopicsMy,
  unit3WritingGuidanceMy,
  unit3ReadingStructuresMy,
  unit3ComprehensionSamples,
} from "@/data/grade12/unit3-exercises-my";
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

const unit3SpeakingLines = unit3SpeakingTopics.map((en, index) => ({
  id: `g12-u3-speaking-${index + 1}`,
  en,
  my: unit3SpeakingTopicsMy[index],
  page: 29,
}));

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
  return (["Prefix", "Suffix"] as const).map((label) => (
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
          {unit3Affixes[label].map(([affix, meaning, examples], index) => (
            <tr key={affix} className="border-t">
              <th scope="row" className="p-3 font-medium">
                {affix}
              </th>
              <td className="p-3">
                {meaning}
                <p lang="my" className="mt-1 text-muted-foreground">
                  {unit3AffixMeaningsMy[label][index]}
                </p>
              </td>
              <td className="p-3">
                <div className="flex flex-wrap gap-x-3">
                  {examples.split(", ").map((word) => (
                    <span key={word} className="inline-flex items-center">
                      <span lang="en">{word}</span>
                      <Grade11Pronunciation text={word} />
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ));
}

function SpeakingTopicPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Choose a speaking topic
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 block w-full rounded-lg border bg-background p-2"
        >
          <option value="">Choose a card</option>
          {grade12Unit3SpeakingCards.map(({ id, label }) => (
            <option key={id}>{label}</option>
          ))}
        </select>
      </label>
      <BurmeseTranslation
        label="Translate speaking topics"
        text={unit3SpeakingTopicsMy.map((topic, index) => `${index + 1}. ${topic}`).join("\n")}
      />
    </div>
  );
}

export function TextbookUnitLesson({ unit, skill }: { unit: 2 | 3; skill: Grade12Skill }) {
  const [speakingMode, setSpeakingMode] = useState<"lesson" | "shadowing" | "ai">("lesson");
  const [speakingTopic, setSpeakingTopic] = useState("");
  const speakingCard = grade12Unit3SpeakingCards.find(({ label }) => label === speakingTopic);
  const groups = unit === 2 ? unit2Exercises[skill] : unit3Exercises[skill];
  const reading = unit === 2 ? unit2Reading : unit3Reading;
  const readingMy = unit === 2 ? unit2ReadingMy : unit3ReadingMy;
  const translated = (unit === 2 ? unit2ExercisesMy : unit3ExercisesMy)[skill];
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
        <SpeakingTopicPicker value={speakingTopic} onChange={setSpeakingTopic} />
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
            {unit === 3 && skill === "reading" && groupIndex === 4 && (
              <ToggleReveal
                label="Sentence Structure"
                hiddenLabel="Hide sentence structure"
                tone="primary"
              >
                <p lang="my">{unit3ReadingStructuresMy[index]}</p>
              </ToggleReveal>
            )}
            <Answer
              prompt={unit === 3 && skill === "speaking" && speakingTopic ? speakingTopic : text}
              expected={
                skill === "reading" && groupIndex === groups.length - 1
                  ? (unit === 2 ? unit2ComprehensionSamples : unit3ComprehensionSamples)[index]
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
          <GrammarScriptView grammar={unit === 2 ? unit2Grammar : unit3Grammar} />
          <UnitGrammarVideos videos={unit === 2 ? videos["2"] : []} showPending />
        </>
      )}
      {skill === "speaking" && (
        <nav aria-label={`Grade 12 Unit ${unit} speaking modes`} className="flex flex-wrap gap-2">
          <Button
            variant={speakingMode === "lesson" ? "default" : "outline"}
            aria-pressed={speakingMode === "lesson"}
            onClick={() => setSpeakingMode("lesson")}
          >
            📖 သင်ခန်းစာ
          </Button>
          <Button
            variant={speakingMode === "shadowing" ? "default" : "outline"}
            aria-pressed={speakingMode === "shadowing"}
            onClick={() => setSpeakingMode("shadowing")}
          >
            🎯 လိုက်ဆို
          </Button>
          {unit === 3 && (
            <Button
              type="button"
              variant={speakingMode === "ai" ? "default" : "outline"}
              aria-pressed={speakingMode === "ai"}
              onClick={() => setSpeakingMode("ai")}
            >
              💬 Practise with AI
            </Button>
          )}
        </nav>
      )}
      {speakingMode === "shadowing" && (
        <PracticePanel
          grade={12}
          unit={unit}
          textbookLines={unit === 2 ? unit2SpeakingLines : unit3SpeakingLines}
        />
      )}
      {unit === 3 && skill === "speaking" && speakingMode === "ai" && (
        <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Practise with AI">
          <SpeakingTopicPicker value={speakingTopic} onChange={setSpeakingTopic} />
          {speakingCard ? (
            <Grade11RequireSignIn>
              <Grade11RolePlay key={speakingCard.id} unit={3} exercise={speakingCard.id} />
            </Grade11RequireSignIn>
          ) : (
            <p lang="my" className="text-sm text-muted-foreground">
              စကားပြောလေ့ကျင့်ဖို့ စာအုပ်ထဲက ခေါင်းစဉ်တစ်ခု ရွေးပါ။
            </p>
          )}
        </section>
      )}
      {reference && (
        <div className="space-y-3 rounded-xl border p-4">
          {unit === 2 && skill === "writing" && (
            <h3 className="font-semibold">Some important hints for summary writing</h3>
          )}
          {reference.map((text) => (
            <English key={text} text={text} />
          ))}
          {unit === 3 && skill === "writing" && (
            <BurmeseTranslation label="Translate writing guidance" text={unit3WritingGuidanceMy} />
          )}
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
        speakingMode === "lesson" && exercises
      )}
    </article>
  );
}
