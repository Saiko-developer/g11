import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleReveal } from "@/components/lesson/ExerciseKit";
import { ListeningTrackPlayer } from "@/components/grade11/Grade11AudioPlayer";
import { PracticePanel } from "@/components/grade11/Grade11SpeakingPractice";
import { Grade11RequireSignIn } from "@/components/grade11/Grade11RequireSignIn";
import { Grade11RolePlay } from "@/components/grade11/Grade11RolePlay";
import {
  grade12Unit1Roleplay,
  type Grade12Unit1RoleplayExercise,
} from "@/data/grade12/unit1-roleplay";
import { unit1AudioUrl } from "@/data/grade12/unit1";
import { unit1Captions, speakingMy, listeningMy, practiceLines } from "@/data/grade12/unit1-media";
import textbook from "@/data/grade12/unit1-listening-speaking.json";

const panel = "space-y-3 rounded-2xl border bg-card p-4 sm:p-5";
const roleplays = Object.keys(grade12Unit1Roleplay) as Grade12Unit1RoleplayExercise[];

function Translation({ text }: { text: string }) {
  return (
    <ToggleReveal label="Show Myanmar Translation" hiddenLabel="Hide Myanmar Translation">
      <p lang="my" className="whitespace-pre-line">
        {text}
      </p>
    </ToggleReveal>
  );
}

function AudioCard({ reference = false }: { reference?: boolean }) {
  if (unit1AudioUrl) {
    return (
      <ListeningTrackPlayer
        grade={12}
        track={{ unit: 1, src: unit1AudioUrl }}
        cues={unit1Captions}
        reference={reference}
      />
    );
  }
  return (
    <section className={panel} aria-label="Grade 12 Unit 1 listening audio">
      <h2 className="font-semibold">🎧 Unit 1 · Listening audio</h2>
      <p lang="my" className="text-sm text-muted-foreground">
        မူရင်းနားထောင်ရန် အသံဖိုင် မထည့်ရသေးပါ။
      </p>
    </section>
  );
}

function Progress({ answered, total }: { answered: number; total: number }) {
  return (
    <div className={panel}>
      <div className="flex justify-between gap-2 text-sm font-medium text-muted-foreground">
        <span>
          Progress: {answered} / {total} answered
        </span>
        <span>{Math.round((answered / total) * 100)}%</span>
      </div>
      <progress
        aria-label="Exercise progress"
        className="block h-2 w-full accent-primary"
        value={answered}
        max={total}
      />
    </div>
  );
}

function Listening() {
  const { instructionA, topics, instructionB, questions } = textbook.listening;
  const [checked, setChecked] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  return (
    <>
      <AudioCard />
      <Progress answered={Object.keys(answers).length} total={questions.length} />
      <section className={panel}>
        <h2 className="font-semibold">{instructionA}</h2>
        <Translation text={listeningMy.a} />
        <div className="grid gap-2 sm:grid-cols-2">
          {topics.map((topic, index) => (
            <label
              key={topic}
              className="flex items-start gap-3 rounded-xl border bg-background p-3"
            >
              <input
                type="checkbox"
                className="mt-1 accent-primary"
                checked={index === 0 || checked.includes(index)}
                disabled={index === 0}
                onChange={(event) => {
                  const selected = event.currentTarget.checked;
                  setChecked((previous) =>
                    selected ? [...previous, index] : previous.filter((value) => value !== index),
                  );
                }}
              />
              <span>
                {topic}
                <span lang="my" className="block text-sm text-muted-foreground">
                  {listeningMy.topics[index]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>
      <section className={panel}>
        <h2 className="font-semibold">{instructionB}</h2>
        <Translation text={listeningMy.b} />
        {questions.map(({ prompt, options }, index) => (
          <fieldset className="space-y-2 rounded-xl border p-3" key={prompt}>
            <legend className="px-1 font-medium">
              {index + 1}. {prompt}
            </legend>
            <Translation text={listeningMy.questions[index]} />
            <div className="grid gap-2 sm:grid-cols-3">
              {options.map((option, choice) => (
                <label
                  key={option}
                  className="flex items-start gap-2 rounded-lg border bg-background p-2 text-sm"
                >
                  <input
                    type="radio"
                    name={`grade12-listening-${index}`}
                    className="mt-1 accent-primary"
                    checked={answers[index] === choice}
                    onChange={() => setAnswers((previous) => ({ ...previous, [index]: choice }))}
                  />
                  <span>
                    ({String.fromCharCode(97 + choice)}) {option}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </section>
    </>
  );
}

const speakingModes = [
  ["lesson", "📖 သင်ခန်းစာ"],
  ["practice", "🎯 လိုက်ဆို"],
  ["roleplay", "💬 AI စကားပြော"],
] as const;

function Speaking() {
  const [mode, setMode] = useState<(typeof speakingModes)[number][0]>("lesson");
  const [exercise, setExercise] = useState<Grade12Unit1RoleplayExercise>("1D-G12-C");
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  return (
    <>
      <nav
        aria-label="Grade 12 speaking modes"
        className="flex flex-wrap gap-2 rounded-2xl border bg-card p-3"
      >
        {speakingModes.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={mode === value ? "default" : "outline"}
            aria-pressed={mode === value}
            onClick={() => setMode(value)}
          >
            {label}
          </Button>
        ))}
      </nav>
      {mode === "lesson" && (
        <>
          <AudioCard reference />
          <Progress
            answered={Object.values(drafts).filter((draft) => draft.trim()).length}
            total={textbook.speaking.length}
          />
          {textbook.speaking.map(({ instruction, body }, index) => (
            <section className={panel} key={instruction}>
              <h2 className="font-semibold">{instruction}</h2>
              {body && (
                <p lang="en" className="whitespace-pre-line leading-relaxed">
                  {body}
                </p>
              )}
              <Translation text={speakingMy[index]} />
              <label className="block text-sm font-medium">
                Practice notes
                <textarea
                  rows={3}
                  className="mt-1 block w-full rounded-lg border bg-background p-2 font-normal"
                  value={drafts[index] ?? ""}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setDrafts((previous) => ({ ...previous, [index]: value }));
                  }}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setExercise(roleplays[index]);
                  setMode("roleplay");
                }}
              >
                Practise {String.fromCharCode(67 + index)} with AI
              </Button>
            </section>
          ))}
        </>
      )}
      {mode === "practice" && <PracticePanel grade={12} unit={1} textbookLines={practiceLines} />}
      {mode === "roleplay" && (
        <>
          <div
            className="flex flex-wrap gap-2 rounded-2xl border bg-card p-3"
            aria-label="Role-play exercises"
          >
            {roleplays.map((id) => (
              <Button
                key={id}
                type="button"
                variant={exercise === id ? "default" : "outline"}
                aria-pressed={exercise === id}
                onClick={() => setExercise(id)}
              >
                {id.slice(-1)} · {grade12Unit1Roleplay[id].label}
              </Button>
            ))}
          </div>
          <Grade11RequireSignIn>
            <Grade11RolePlay key={exercise} unit={1} exercise={exercise} />
          </Grade11RequireSignIn>
        </>
      )}
    </>
  );
}

export function Unit1ListeningSpeaking({ skill }: { skill: "listening" | "speaking" }) {
  return skill === "listening" ? <Listening /> : <Speaking />;
}
