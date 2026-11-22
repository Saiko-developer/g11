import { useState } from "react";
import { Grade11AIReview } from "@/components/grade11/Grade11AIReview";
import core from "@/data/grade12/unit1-core.json";
import { compounds, modals } from "@/data/grade12/unit1-reference";
import { Button } from "@/components/ui/button";
import { isAnswerMatch } from "@/lib/answerMatch";
import { unit1Sections, unit1AudioUrl } from "@/data/grade12/unit1";
import {
  matchAnswers,
  sampleReply,
  matchColumns,
  readingStructures,
  readingTranslation,
  unit1Keys,
} from "@/data/grade12/unit1-support";

type Section = (typeof unit1Sections)[number];
type Exercise = { key: string; instruction: string; lines: string[] };

function Answer({
  prompt,
  expected,
  subjective = false,
  choices,
  review,
}: {
  prompt: string;
  expected?: string;
  subjective?: boolean;
  choices?: readonly string[];
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
        <p className="rounded-lg bg-primary/10 p-3 text-sm">
          <strong>Suggested answer:</strong> {expected}
        </p>
      )}
    </div>
  );
}

function English({ text }: { text: string }) {
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

function Reading() {
  const [view, setView] = useState<"english" | "myanmar" | "structure">("english");
  return (
    <div className="space-y-4">
      <div aria-label="Reading support" className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={view === "english" ? "default" : "outline"}
          aria-pressed={view === "english"}
          onClick={() => setView("english")}
        >
          English
        </Button>
        <Button
          size="sm"
          variant={view === "myanmar" ? "default" : "outline"}
          aria-pressed={view === "myanmar"}
          onClick={() => setView("myanmar")}
        >
          မြန်မာဘာသာပြန်
        </Button>
        <Button
          size="sm"
          variant={view === "structure" ? "default" : "outline"}
          aria-pressed={view === "structure"}
          onClick={() => setView("structure")}
        >
          ဝါကျဖွဲ့စည်းပုံ
        </Button>
      </div>
      {view === "english" ? (
        <div className="space-y-4">
          {core.paragraphs.map((block) => (
            <English key={block} text={block} />
          ))}
        </div>
      ) : (
        <div lang="my" className="space-y-4 leading-loose">
          {(view === "myanmar" ? readingTranslation : readingStructures).map((block) => (
            <p key={block}>{block}</p>
          ))}
        </div>
      )}
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
  const waitingForRecording =
    section.id === "listening-speaking" && !unit1AudioUrl && ["A", "B"].includes(exercise.key);
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h3 className="font-semibold">{exercise.instruction}</h3>
      <English text={exercise.lines.join("\n").trim()} />
      {!waitingForRecording && (
        <Answer
          prompt={exercise.instruction}
          expected={section.id === "writing" && exercise.key === "B" ? sampleReply : undefined}
          subjective
        />
      )}
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
            choices: ["A little polite", "Polite", "Very polite"],
          },
          {
            instruction:
              "2. Read the following manners. Decide whether each manner is good or bad. Mark (✓) your answers. Then compare your answers with a partner.",
            items: core.manners,
            choices: ["Good", "Bad"],
          },
        ].map(({ instruction, items, choices }) => (
          <fieldset key={instruction} className="space-y-2">
            <legend className="mb-2 font-medium">{instruction}</legend>
            {items.map((item) => (
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
            ))}
          </fieldset>
        ))}
        <div className="space-y-3">
          <p className="font-medium">3. Answer the following questions.</p>
          <ol className="list-[lower-alpha] space-y-3 pl-5">
            {core.discussion.map((prompt) => (
              <li key={prompt}>
                <p>{prompt}</p>
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
                <dt className="font-medium">{word}</dt>
                <dd className="text-sm text-muted-foreground">{pattern}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function GrammarReference() {
  return modals.map(({ word, negative, uses }) => (
    <article key={word} className="rounded-xl border p-4">
      <h2 className="mb-3 font-semibold">{word}</h2>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <h4 className="font-semibold">Form</h4>
          <p>Affirmative: Subject + {word.toLowerCase()} + v-inf</p>
          <p>Negative: Subject + {negative} + v-inf</p>
          <p>Interrogative: {word} + subject + v-inf …?</p>
        </div>
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <h4 className="font-semibold">Use and Example</h4>
          <ol className="list-decimal space-y-2 pl-5">
            {uses.map(([usage, example]) => (
              <li key={usage}>
                <strong className="font-medium">{usage}</strong>
                <English text={example} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </article>
  ));
}

function Matching() {
  const choices = matchColumns[1].map(
    (word, index) => `${String.fromCharCode(97 + index)}) ${word}`,
  );
  return (
    <>
      <p className="font-medium">Column B</p>
      <ul className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-3 sm:grid-cols-3">
        {choices.map((choice) => (
          <li key={choice}>{choice}</li>
        ))}
      </ul>
      <p className="font-medium">Column A</p>
      <ol className="list-decimal space-y-3 pl-5">
        {matchColumns[0].map((word, i) => (
          <li key={word}>
            <p>{word}</p>
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
          <p>1. {example}</p>
          {[2, 3, 4, 5].map((number) => (
            <Answer key={number} prompt={`${title} ${number}`} />
          ))}
        </fieldset>
      ))}
    </div>
  );
}

function CoreLesson({ skill }: { skill: "reading" | "vocabulary" | "grammar" }) {
  return (
    <>
      {skill === "reading" && (
        <>
          <PreReading />
          <Reading />
          <h2 className="text-lg font-semibold">Comprehension</h2>
        </>
      )}
      {skill === "vocabulary" && <VocabularyReference />}
      {skill === "grammar" && <GrammarReference />}
      {core[skill].map(({ instruction, questions }) => {
        const key = instruction[0];
        const answers = unit1Keys[`${skill}:${key}`];
        const comprehension = skill === "reading" && key === "C";
        return (
          <section key={instruction} className="space-y-3 rounded-xl border p-4">
            <h3 className="font-semibold">{instruction}</h3>
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
                    <Answer
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
