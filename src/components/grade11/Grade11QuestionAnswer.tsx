import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Grade11AIReview } from "./Grade11AIReview";
import { Grade11SourceAnswer } from "./Grade11SourceAnswer";

type AnswerKey = { answer: string; answerMy?: string; kind?: string };
/** Closed questions check locally; full-sentence responses retain semantic checking per question. */
export function Grade11QuestionAnswer({
  question,
  instructions,
  context,
  answerKey,
  value,
  onChange,
  fullSentence = false,
}: {
  question: string;
  instructions: string;
  context: string;
  answerKey?: AnswerKey;
  value: string;
  onChange: (value: string) => void;
  fullSentence?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  if (answerKey && !fullSentence)
    return (
      <Grade11SourceAnswer
        question={question}
        instructions={instructions}
        correct={answerKey.answer}
        correctMy={answerKey.answerMy}
        value={value}
        onChange={onChange}
      />
    );
  return (
    <div className="space-y-3">
      <Textarea
        aria-label={`Your answer: ${question}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        maxLength={12000}
        placeholder="Write your answer…"
      />
      <div className="flex flex-wrap items-start gap-2">
        <Grade11AIReview
          question={question}
          instructions={instructions}
          context={context}
          answer={value}
          checkLabel="Check Answer"
          compact
        />
        <Button size="sm" variant="ghost" onClick={() => setRevealed((old) => !old)}>
          {revealed ? "Hide Answer" : "Reveal Answer"}
        </Button>
      </div>
      {revealed && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm leading-relaxed">
          {answerKey ? (
            <>
              <p className="mb-2 text-xs font-semibold text-primary">
                Suggested answer · အဓိပ္ပာယ်တူ ကိုယ့်စကားနဲ့ ဖြေနိုင်ပါတယ်။
              </p>
              <p>{answerKey.answer}</p>
              <p lang="my" className="mt-2 text-muted-foreground">
                {answerKey.answerMy}
              </p>
            </>
          ) : (
            <p lang="my">
              ကိုယ်ပိုင်အတွေ့အကြုံနဲ့ အမြင်ကို မေးထားတာဖြစ်လို့ ပုံသေအဖြေတစ်ခု မရှိပါ။ မေးခွန်းကို
              ဝါကျအပြည့်နဲ့ တိုက်ရိုက်ဖြေပြီး ကိုယ့်အကြောင်းရင်းကို ထည့်ရှင်းပါ။
            </p>
          )}
        </div>
      )}
    </div>
  );
}
