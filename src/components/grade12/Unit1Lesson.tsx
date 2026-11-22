import { GrammarScriptView } from "@/components/lesson/GrammarScriptView";
import { UnitGrammarVideos } from "@/components/grade11/Grade11GrammarVideos";
import { unit1Grammar } from "@/data/grade12/unit1-grammar";
import grammarVideos from "@/data/grade12/grammarVideos.json";
import { Grade11Pronunciation } from "@/components/grade11/Grade11Pronunciation";
import { ToggleReveal } from "@/components/lesson/ExerciseKit";
import {
  grammarInstructionsMy,
  grammarSentencesMy,
  peopleMy,
  mannersMy,
  discussionMy,
  matchPartsMy,
  questionStructuresMy,
  readingInstructionsMy,
  readingQuestionsMy,
  vocabularyMy,
  vocabularySentencesMy,
} from "@/data/grade12/unit1-study-support";
import { useState, type ReactNode } from "react";
import { Grade11AIReview } from "@/components/grade11/Grade11AIReview";
import core from "@/data/grade12/unit1-core.json";
import { compounds } from "@/data/grade12/unit1-reference";
import { Button } from "@/components/ui/button";
import { isAnswerMatch } from "@/lib/answerMatch";
import { unit1Sections } from "@/data/grade12/unit1";
import {
  matchAnswers,
  sampleReply,
  matchColumns,
  readingTranslation,
  unit1Keys,
} from "@/data/grade12/unit1-support";

type Section = (typeof unit1Sections)[number];
type Exercise = { key: string; instruction: string; lines: string[] };

export function Answer({
  prompt,
  expected,
  subjective = false,
  choices,
  review,
  vocabularyAnswer = false,
}: {
  prompt: string;
  expected?: string;
  subjective?: boolean;
  choices?: readonly string[];
  vocabularyAnswer?: boolean;
  review?: { instructions: string; context: string };
}) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reveal, setReveal] = useState(false);
  return (
    <div className="space-y-2">
      {choices ? (
        <select
          aria-label={prompt}
          className="w-full rounded-lg border bg-background p-2 text-sm"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setFeedback("");
          }}
        >
          <option value="">Choose an answer</option>
          {choices.map((choice) => (
            <option key={choice}>{choice}</option>
          ))}
        </select>
      ) : subjective ? (
        <textarea
          aria-label={prompt}
          rows={3}
          className="w-full rounded-lg border bg-background p-2 text-sm"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      ) : (
        <input
          aria-label={prompt}
          className="w-full rounded-lg border bg-background p-2 text-sm"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setFeedback("");
          }}
        />
      )}
      {expected && (
        <div className="flex flex-wrap gap-2">
          {!subjective && (
            <Button
              size="sm"
              variant="outline"
              disabled={!answer.trim()}
              onClick={() =>
                setFeedback(
                  isAnswerMatch(answer.trim(), expected)
                    ? "Matches the suggested answer."
                    : "Try again or compare with the suggested answer.",
                )
              }
            >
              Check Answer
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setReveal(!reveal)}>
            {reveal ? "Hide answer" : "Reveal answer"}
          </Button>
        </div>
      )}
      {review && (
        <Grade11AIReview grade={12} question={prompt} answer={answer} {...review} compact />
      )}
      {feedback && (
        <p role="status" className="text-sm">
          {feedback}
        </p>
      )}
      {reveal && (
        <div className="rounded-lg bg-primary/10 p-3 text-sm">
          <strong>Suggested answer:</strong>{" "}
          {vocabularyAnswer && expected ? <VocabularyWord word={expected} /> : expected}
        </div>
      )}
    </div>
  );
}

export function English({ text }: { text: string }) {
  return (
    <div lang="en" className="whitespace-pre-wrap break-words leading-relaxed">
      {text
        .split(/(\*\*[^*]+\*\*)/)
        .map((part, index) =>
          part.startsWith("**") ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
        )}
    </div>
  );
}

export function BurmeseTranslation({
  text,
  label = "မြန်မာဘာသာပြန်",
}: {
  text: string;
  label?: string;
}) {
  return (
    <ToggleReveal label={label} hiddenLabel="ဘာသာပြန် ပိတ်ရန်">
      <p lang="my" className="whitespace-pre-line">
        {text}
      </p>
    </ToggleReveal>
  );
}

function Reading() {
  return (
    <div className="space-y-4">
      {core.paragraphs.map((block, index) => (
        <section
          key={block}
          aria-label={`Paragraph ${index + 1}`}
          className="space-y-2 rounded-xl border p-4"
        >
          <p className="text-sm font-medium text-muted-foreground">Paragraph {index + 1}</p>
          <English text={block} />
          <BurmeseTranslation text={readingTranslation[index]} />
        </section>
      ))}
    </div>
  );
}

function VocabularyWord({ word }: { word: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2">
        <span lang="en" className="font-medium">
          {word}
        </span>
        <Grade11Pronunciation text={word} />
      </div>
      <p lang="my" className="text-sm text-muted-foreground">
        {vocabularyMy[word] ?? matchPartsMy[word]}
      </p>
    </div>
  );
}

function extractExercises(section: Extract<Section, { text: string }>): {
  introduction: string;
  exercises: Exercise[];
} {
  const parts = ("\n" + section.text).split(/\n(?=[A-E]\. )/);
  return {
    introduction: parts.shift() ?? "",
    exercises: parts.map((part) => {
      const [instruction, ...lines] = part.trim().split("\n");
      return { key: instruction[0], instruction, lines };
    }),
  };
}

function ExerciseCard({ section, exercise }: { section: Section; exercise: Exercise }) {
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h3 className="font-semibold">{exercise.instruction}</h3>
      <English text={exercise.lines.join("\n").trim()} />
      <Answer
        prompt={exercise.instruction}
        expected={section.id === "writing" && exercise.key === "B" ? sampleReply : undefined}
        subjective
      />
    </section>
  );
}

function PreReading() {
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-medium">Pre-reading</summary>
      <div className="mt-4 space-y-6">
        {[
          {
            instruction:
              "1. How polite do you think you should be to these people? Tick (✓) your answers. Then compare your answers with a partner.",
            items: core.people,
            translations: peopleMy,
            choices: ["A little polite", "Polite", "Very polite"],
          },
          {
            instruction:
              "2. Read the following manners. Decide whether each manner is good or bad. Mark (✓) your answers. Then compare your answers with a partner.",
            items: core.manners,
            translations: mannersMy,
            choices: ["Good", "Bad"],
          },
        ].map(({ instruction, items, translations, choices }) => (
          <fieldset key={instruction} className="space-y-2">
            <legend className="mb-2 font-medium">{instruction}</legend>
            {items.map((item, index) => (
              <div key={item}>
                <label
                  className="grid items-center gap-2 rounded-lg bg-muted/40 p-2 sm:grid-cols-[1fr_10rem]"
                  key={item}
                >
                  <span>{item}</span>
                  <select className="rounded-md border bg-background p-2 text-sm" defaultValue="">
                    <option value="">Choose</option>
                    {choices.map((choice) => (
                      <option key={choice}>{choice}</option>
                    ))}
                  </select>
                </label>
                <BurmeseTranslation text={translations[index]} />
              </div>
            ))}
          </fieldset>
        ))}
        <div className="space-y-3">
          <p className="font-medium">3. Answer the following questions.</p>
          <ol className="list-[lower-alpha] space-y-3 pl-5">
            {core.discussion.map((prompt, index) => (
              <li key={prompt}>
                <p>{prompt}</p>
                <BurmeseTranslation label="Translate question" text={discussionMy[index]} />
                <Answer prompt={prompt} subjective />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </details>
  );
}

function VocabularyReference() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {compounds.map(({ title, description, note, examples }) => (
        <article key={title} className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">{title}</h2>
          <p>{description}</p>
          {note && <p>{note}</p>}
          <dl className="space-y-2">
            {examples.map(([word, pattern]) => (
              <div className="rounded-lg bg-muted/50 p-2" key={word}>
                <dt>
                  <VocabularyWord word={word} />
                </dt>
                <dd className="text-sm text-muted-foreground">{pattern}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function Matching() {
  const choices = matchColumns[1].map(
    (word, index) => `${String.fromCharCode(97 + index)}) ${word}`,
  );
  return (
    <>
      <p className="font-medium">Column B</p>
      <ul className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-3 sm:grid-cols-3">
        {choices.map((choice, index) => (
          <li key={choice}>
            <span>({String.fromCharCode(97 + index)})</span>{" "}
            <VocabularyWord word={matchColumns[1][index]} />
          </li>
        ))}
      </ul>
      <p className="font-medium">Column A</p>
      <ol className="list-decimal space-y-3 pl-5">
        {matchColumns[0].map((word, i) => (
          <li key={word}>
            <VocabularyWord word={word} />
            <Answer
              prompt={`Match ${word}`}
              choices={choices}
              expected={choices[matchAnswers[i].charCodeAt(0) - 97]}
            />
          </li>
        ))}
      </ol>
    </>
  );
}

function CompoundPractice() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        ["Compound nouns", "science fiction"],
        ["Compound adjectives", "kind-hearted"],
      ].map(([title, example]) => (
        <fieldset key={title} className="space-y-2">
          <legend className="mb-2 font-medium">{title}</legend>
          <div className="rounded-lg bg-muted/50 p-2">
            <VocabularyWord word={example} />
          </div>
          {[2, 3, 4, 5].map((number) => (
            <Answer key={number} prompt={`${title} ${number}`} />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

type CoreSkill = "reading" | "vocabulary" | "grammar";

export function ReadingWorkspace({
  passage,
  exercises,
}: {
  passage: ReactNode;
  exercises: ReactNode;
}) {
  const pane =
    "min-w-0 space-y-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:max-h-[clamp(22rem,calc(100dvh_-_18rem),60rem)] lg:overflow-y-auto lg:overscroll-y-contain lg:p-1 lg:[scrollbar-gutter:stable]";
  return (
    <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
      <section aria-labelledby="grade12-reading-passage" tabIndex={0} className={pane}>
        <h2 id="grade12-reading-passage" className="text-lg font-semibold">
          Reading passage
        </h2>
        {passage}
      </section>
      <section aria-labelledby="grade12-reading-comprehension" tabIndex={0} className={pane}>
        <h2 id="grade12-reading-comprehension" className="text-lg font-semibold">
          Comprehension
        </h2>
        {exercises}
      </section>
    </div>
  );
}

function CoreLesson({ skill }: { skill: CoreSkill }) {
  if (skill === "reading") {
    return (
      <ReadingWorkspace
        passage={
          <>
            <PreReading />
            <Reading />
          </>
        }
        exercises={<CoreExercises skill="reading" />}
      />
    );
  }

  return (
    <>
      {skill === "vocabulary" ? (
        <VocabularyReference />
      ) : (
        <>
          <GrammarScriptView grammar={unit1Grammar} />
          <UnitGrammarVideos videos={grammarVideos["1"]} showPending />
        </>
      )}
      <CoreExercises skill={skill} />
    </>
  );
}

function CoreExercises({ skill }: { skill: CoreSkill }) {
  return (
    <>
      {core[skill].map(({ instruction, questions }) => {
        const key = instruction[0];
        const answers = unit1Keys[`${skill}:${key}`];
        const comprehension = skill === "reading" && key === "C";
        return (
          <section key={instruction} className="space-y-3 rounded-xl border p-4">
            <h3 className="font-semibold">{instruction}</h3>
            {skill === "reading" && (
              <BurmeseTranslation
                label="Translate instructions"
                text={readingInstructionsMy[key as keyof typeof readingInstructionsMy]}
              />
            )}
            {skill === "grammar" && grammarInstructionsMy[key] && (
              <BurmeseTranslation
                label="Translate instructions"
                text={grammarInstructionsMy[key]}
              />
            )}
            {skill === "vocabulary" && key === "A" && <Matching />}
            {skill === "vocabulary" && key === "C" && <CompoundPractice />}
            {skill === "grammar" && key === "B" && (
              <ol className="list-decimal space-y-3 pl-5">
                {[1, 2, 3, 4, 5, 6].map((number) => (
                  <li key={number}>
                    <Answer prompt={`Sentence ${number}`} />
                  </li>
                ))}
              </ol>
            )}
            {questions.length > 0 && (
              <ol className="list-decimal space-y-3 pl-5">
                {questions.map((prompt, index) => (
                  <li className="space-y-2 border-t pt-3" key={prompt}>
                    <English text={prompt} />
                    {skill === "reading" && (
                      <BurmeseTranslation
                        label="Translate question"
                        text={readingQuestionsMy[key as keyof typeof readingQuestionsMy][index]}
                      />
                    )}
                    {skill === "vocabulary" && (
                      <BurmeseTranslation
                        label="Translate sentence"
                        text={vocabularySentencesMy[index]}
                      />
                    )}
                    {skill === "grammar" && (
                      <BurmeseTranslation
                        label="Translate sentence"
                        text={grammarSentencesMy[index]}
                      />
                    )}
                    {comprehension && (
                      <ToggleReveal
                        label="Sentence Structure"
                        hiddenLabel="Hide sentence structure"
                        tone="primary"
                      >
                        <p lang="my">{questionStructuresMy[index]}</p>
                      </ToggleReveal>
                    )}
                    <Answer
                      vocabularyAnswer={skill === "vocabulary"}
                      prompt={prompt}
                      expected={answers?.[index]}
                      subjective={comprehension}
                      choices={skill === "grammar" ? ["must", "can", "should"] : undefined}
                      review={
                        comprehension
                          ? {
                              instructions: instruction,
                              context: core.paragraphs.join("\n\n"),
                            }
                          : undefined
                      }
                    />
                  </li>
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </>
  );
}

export function Unit1Lesson({ section }: { section: Section }) {
  const legacy = "text" in section ? extractExercises(section) : null;
  return (
    <div className="space-y-4" key={section.id}>
      <p className="text-xs text-muted-foreground">Textbook pages {section.pages}</p>
      {"text" in section ? (
        <>
          {legacy?.introduction.trim() && <English text={legacy.introduction} />}
          {legacy?.exercises.map((exercise) => (
            <ExerciseCard key={exercise.key} section={section} exercise={exercise} />
          ))}
        </>
      ) : (
        <CoreLesson skill={section.id} />
      )}
    </div>
  );
}
