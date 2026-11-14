import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CreditCard,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { AdminStudent } from "./AdminDashboard";
import { cn } from "@/lib/utils";
function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon aria-hidden="true" className="h-4 w-4 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function AdminOverview({
  students,
  loading,
  error,
  navigate,
}: {
  students: AdminStudent[];
  loading: boolean;
  error?: string;
  navigate: (section: "students" | "payments" | "requests" | "ai" | "teaching") => void;
}) {
  const active = students.filter((student) => student.status !== "suspended").length;
  const scholarships = students.filter((student) => student.scholarship === "pending");
  const tutorUsed = students.reduce((sum, student) => sum + student.tutor_used_today, 0);
  const exams = students.reduce((sum, student) => sum + student.exam_used_today, 0);
  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-primary-foreground/5" />
        <p className="text-xs font-medium uppercase tracking-[0.16em] opacity-70">
          A little clarity. A better learning day.
        </p>
        <h2 className="relative mt-3 max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
          One place to look after
          <br className="hidden sm:block" /> your learning community.
        </h2>
        <p className="relative mt-3 max-w-lg text-sm leading-relaxed opacity-80" lang="my">
          ကျောင်းသားများ၊ အသုံးပြုခွင့်နဲ့ ငွေဖြည့်တောင်းဆိုမှုတွေကို တစ်နေရာတည်းမှာ စီမံပါ။
        </p>
        <button
          onClick={() => navigate("students")}
          className="relative mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-foreground px-4 py-2.5 text-sm font-medium text-primary"
        >
          Manage students
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat
          label="Accounts loaded"
          value={loading || error ? "—" : students.length.toLocaleString()}
          hint="Students, teachers and admins"
          icon={Users}
        />
        <Stat
          label="Active accounts"
          value={loading || error ? "—" : active.toLocaleString()}
          hint="Account status, not online presence"
          icon={ShieldCheck}
        />
        <Stat
          label="Tutor messages today"
          value={loading || error ? "—" : tutorUsed.toLocaleString()}
          hint="Reported for loaded accounts"
          icon={MessageSquare}
        />
        <Stat
          label="Exam papers today"
          value={loading || error ? "—" : exams.toLocaleString()}
          hint="Generated, not marked papers"
          icon={BookOpen}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Account overview</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                A snapshot of the accounts in this list.
              </p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          {[
            { label: "Active", count: active, tone: "bg-primary" },
            {
              label: "Suspended",
              count: students.length - active,
              tone: "bg-destructive/70",
            },
            {
              label: "Teachers",
              count: students.filter((student) => student.is_teacher).length,
              tone: "bg-primary/50",
            },
          ].map((item) => (
            <div key={item.label} className="mt-4">
              <div className="mb-2 flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-medium">{loading || error ? "—" : item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", item.tone)}
                  style={{
                    width: `${!error && students.length ? (item.count / students.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </section>
        <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Provider billing</h2>
          </div>
          <p className="text-2xl font-semibold tracking-tight">Check in Lovable</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Live provider balance and spending are not connected to this dashboard. Student credits
            are a separate allowance.
          </p>
          <a
            href="https://lovable.dev/settings/billing"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            Open Lovable billing
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </section>
      </div>
      <section className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
        <div className="mb-4">
          <h2 className="font-semibold">Your next actions</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Jump straight to the work that matters.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              id: "teaching" as const,
              title: "Open teaching setup",
              text: "Review Grade 10/11 classroom scripts",
              icon: BookOpen,
            },
            {
              id: "payments" as const,
              title: "Review top-ups",
              text: "Verify transfers and approve requests",
              icon: CreditCard,
            },
            {
              id: "requests" as const,
              title: "Review applications",
              text: `${scholarships.length} scholarship requests in this list`,
              icon: GraduationCap,
            },
            {
              id: "ai" as const,
              title: "Check AI services",
              text: "Run an on-demand connection test",
              icon: Sparkles,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className="group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
            >
              <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0">
                <strong className="block text-sm font-medium">{item.title}</strong>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {item.text}
                </span>
              </span>
              <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
