import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grade11RequireSignIn } from "./Grade11RequireSignIn";
import { Grade11RolePlay } from "./Grade11RolePlay";
import type { Grade11RoleplayExercise } from "@/lib/grade11RoleplayExercises";

export function Grade11ExerciseRoleplay({
  unit,
  exercise,
}: {
  unit: number;
  exercise: Grade11RoleplayExercise;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <p lang="my" className="text-sm leading-relaxed">
        Saya Owl နဲ့ အလှည့်ကျ ပြောပြီး ဒီလေ့ကျင့်ခန်းကို လေ့ကျင့်နိုင်ပါတယ်။
      </p>
      <Button variant="outline" aria-expanded={open} onClick={() => setOpen((old) => !old)}>
        {open ? "Close AI practice" : "Practise with AI"}
      </Button>
      {open && (
        <Grade11RequireSignIn>
          <Grade11RolePlay unit={unit} exercise={exercise} />
        </Grade11RequireSignIn>
      )}
    </div>
  );
}
