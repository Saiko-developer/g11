import { useState } from "react";
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
}: {
  prompt: string;
  expected?: string;
  subjective?: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reveal, setReveal] = useState(false);
  return (
    <div className="space-y-2">
      {subjective ? (
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

function Reading({ text }: { text: string }) {
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
        <English text={text} />
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

function extractExercises(section: Section): { introduction: string; exercises: Exercise[] } {
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
  const keys = unit1Keys[`${section.id}:${exercise.key}`];
  const waitingForRecording =
    section.id === "listening-speaking" && !unit1AudioUrl && ["A", "B"].includes(exercise.key);
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h3 className="font-semibold">{exercise.instruction}</h3>
      {section.id === "vocabulary" && exercise.key === "A" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm">
            <div>
              <strong>Column A</strong>
              <ol>
                {matchColumns[0].map((word, i) => (
                  <li key={word}>
                    {i + 1}. {word}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <strong>Column B</strong>
              <ol>
                {matchColumns[1].map((word, i) => (
                  <li key={word}>
                    ({String.fromCharCode(97 + i)}) {word}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          {matchColumns[0].map((word, i) => (
            <div key={word} className="space-y-1">
              <p>
                {i + 1}. {word}
              </p>
              <Answer prompt={`Column B letter for ${word}`} expected={matchAnswers[i]} />
            </div>
          ))}
        </div>
      ) : keys ? (
        exercise.lines
          .filter((line) => /^\d+\. /.test(line))
          .map((question, index) => (
            <div className="space-y-2 border-t pt-3" key={question}>
              <English text={question} />
              <Answer
                prompt={question}
                expected={keys[index]}
                subjective={section.id === "reading" && exercise.key === "C"}
              />
            </div>
          ))
      ) : (
        <>
          <English text={exercise.lines.join("\n").trim()} />
          {!waitingForRecording && (
            <Answer
              prompt={exercise.instruction}
              expected={section.id === "writing" && exercise.key === "B" ? sampleReply : undefined}
              subjective
            />
          )}
        </>
      )}
    </section>
  );
}

export function Unit1Lesson({ section }: { section: Section }) {
  const { introduction, exercises } = extractExercises(section);
  const marker = "\n\nRead the passage.\n\n";
  const [preReading, passage] = introduction.split(marker);
  return (
    <div className="space-y-4">
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
      {passage ? (
        <>
          <details className="rounded-xl border p-4">
            <summary className="cursor-pointer font-medium">Pre-reading</summary>
            <English text={preReading.replace(/^Pre-reading\n\n/, "")} />
          </details>
          <Reading text={passage.replace(/\n\nComprehension\s*$/, "")} />
        </>
      ) : (
        introduction.trim() && <English text={introduction} />
      )}
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.key} section={section} exercise={exercise} />
      ))}
    </div>
  );
}
