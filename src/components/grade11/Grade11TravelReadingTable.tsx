import { Input } from "@/components/ui/input";
import { Grade11SourceAnswer } from "./Grade11SourceAnswer";
import type { Unit1Exercise } from "@/lib/grade11Unit1";

export function Grade11TravelReadingTable({
  exercise,
  keys,
  answers,
  setAnswer,
}: {
  exercise: Unit1Exercise;
  keys: Record<string, { answer: string; answerMy?: string }>;
  answers: Record<string, string>;
  setAnswer: (id: string, value: string) => void;
}) {
  const destinations = exercise.instruction.id === "6A-32";
  return (
    <section
      data-exercise={exercise.instruction.id}
      className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
    >
      <header>
        <h3 className="font-semibold">{exercise.instruction.x}</h3>
        <p lang="my" className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {exercise.instruction.my}
        </p>
      </header>
      <div className="max-w-full overflow-x-auto rounded-xl border border-border">
        <table
          className={`w-full border-collapse text-sm ${destinations ? "min-w-[760px]" : "min-w-[440px]"}`}
        >
          <caption className="sr-only">
            {destinations
              ? "Tourist destinations, countries and attractions"
              : "Countries and capital cities"}
          </caption>
          <thead className="bg-secondary/60">
            <tr>
              <th scope="col" className="p-4 text-left">
                {destinations ? "Tourist destination" : "Country"}
              </th>
              {destinations && (
                <th scope="col" className="w-44 p-4 text-left">
                  Country
                </th>
              )}
              <th scope="col" className="p-4 text-left">
                {destinations ? "Why it is famous" : "Capital city"}
              </th>
            </tr>
          </thead>
          <tbody>
            {destinations && (
              <tr className="border-t border-border bg-primary/5">
                <th scope="row" className="p-4 text-left font-normal">
                  1. The Shwedagon Pagoda
                  <p lang="my" className="mt-1 text-xs text-muted-foreground">
                    ပေးထားသော နမူနာ
                  </p>
                </th>
                <td className="p-4">Myanmar</td>
                <td className="p-4">a historic pagoda</td>
              </tr>
            )}
            {exercise.blocks
              .filter((b) => b.t === "q")
              .map((q) => (
                <tr key={q.id} className="border-t border-border align-top">
                  <th scope="row" className="max-w-64 p-4 text-left font-normal">
                    <p className="font-medium leading-relaxed">{q.x}</p>
                    <p lang="my" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {q.my}
                    </p>
                  </th>
                  {destinations && (
                    <td className="p-4">
                      <Input
                        aria-label={`Country: ${q.x}`}
                        value={answers[`${q.id}:country`] ?? ""}
                        onChange={(e) => setAnswer(`${q.id}:country`, e.target.value)}
                      />
                    </td>
                  )}
                  <td className="min-w-72 p-4">
                    <Grade11SourceAnswer
                      question={q.x}
                      instructions={exercise.instruction.x}
                      correct={keys[q.id].answer}
                      correctMy={keys[q.id].answerMy}
                      value={answers[q.id] ?? ""}
                      onChange={(value) => setAnswer(q.id, value)}
                      multiline={destinations}
                      allowCheck={!destinations}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
