import { AdminSpeakingUsage } from "./AdminSpeakingUsage";
import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StudentProgress } from "@/components/StudentProgress";
import type { listStudents } from "@/lib/admin.functions";
import { AdminOverview } from "./AdminOverview";
import { cn } from "@/lib/utils";

export type AdminStudent = Awaited<ReturnType<typeof listStudents>>[number];
export type AdminAction =
  | "tutor"
  | "exam"
  | "activate"
  | "suspend7"
  | "suspend"
  | "admin"
  | "teacher"
  | "delete"
  | "approve"
  | "reject"
  | "end-scholarship";
type Section =
  "overview" | "students" | "payments" | "ai" | "requests" | "support" | "announcements";
const NAV = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    subtitle: "Your academy, at a glance.",
  },
  {
    id: "students",
    label: "Students",
    icon: Users,
    subtitle: "People, access and learning progress.",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    subtitle: "Review top-ups and manage your packages.",
  },
  {
    id: "ai",
    label: "AI services",
    icon: Sparkles,
    subtitle: "Check your providers and review available usage.",
  },
  {
    id: "requests",
    label: "Requests",
    icon: GraduationCap,
    subtitle: "Teacher applications and scholarships.",
  },
  {
    id: "support",
    label: "Support inbox",
    icon: MessageSquare,
    subtitle: "Keep the conversation with your students going.",
  },
  {
    id: "announcements",
    label: "Announcements",
    icon: Megaphone,
    subtitle: "Share an update with your academy.",
  },
] as const;
const date = (value: string) => {
  const time = new Date(value);
  return Number.isNaN(time.getTime())
    ? "Unavailable"
    : time.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Yangon",
      });
};
function Avatar({ student }: { student: AdminStudent }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {student.avatar_url ? (
        <img
          src={student.avatar_url}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        (student.full_name || student.email || "?").charAt(0).toUpperCase()
      )}
    </span>
  );
}
function Status({ student }: { student: AdminStudent }) {
  const suspended = student.status === "suspended";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        suspended ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {suspended ? "Suspended" : "Active"}
    </span>
  );
}
export function AdminDashboard({
  students,
  myId,
  loading,
  refreshing,
  error,
  onRefresh,
  onSignOut,
  onAction,
  panels,
}: {
  students: AdminStudent[];
  myId: string;
  loading: boolean;
  refreshing: boolean;
  error?: string;
  onRefresh: () => void;
  onSignOut: () => void;
  onAction: (student: AdminStudent, action: AdminAction, amount?: number) => Promise<void>;
  panels: Record<"payments" | "ai" | "requests" | "support" | "announcements", ReactNode>;
}) {
  const [section, setSection] = useState<Section>("overview");
  const [visited, setVisited] = useState<Set<Section>>(() => new Set(["overview"]));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [progress, setProgress] = useState(false);
  const [action, setAction] = useState<{ student: AdminStudent; kind: AdminAction } | null>(null);
  const [amount, setAmount] = useState("50");
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const selected = students.find((student) => student.id === selectedId);
  const title = NAV.find((item) => item.id === section)!;
  const scholarships = students.filter((student) => student.scholarship === "pending");
  const filtered = students.filter((student) => {
    const matches = `${student.full_name || ""} ${student.email || ""}`
      .toLowerCase()
      .includes(search.toLowerCase().trim());
    return (
      matches &&
      (filter === "all" ||
        (filter === "active" && student.status !== "suspended") ||
        (filter === "suspended" && student.status === "suspended") ||
        (filter === "teacher" && student.is_teacher) ||
        (filter === "admin" && (student.is_admin || student.is_main_admin)))
    );
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages - 1);
  const visible = filtered.slice(currentPage * 10, currentPage * 10 + 10);
  const navigate = (next: Section) => {
    setSection(next);
    setVisited((previous) => new Set(previous).add(next));
    setNotice("");
  };
  const openAction = (student: AdminStudent, kind: AdminAction) => {
    setSelectedId(null);
    setAction({ student, kind });
    setAmount(kind === "exam" ? "5" : "50");
    setActionError("");
  };
  const submit = async () => {
    if (!action || pending) return;
    const adding = action.kind === "tutor" || action.kind === "exam";
    const value = Number(amount);
    if (adding && (!Number.isSafeInteger(value) || value <= 0 || value > 100000)) {
      setActionError("Enter a whole number between 1 and 100,000.");
      return;
    }
    setPending(true);
    setActionError("");
    try {
      await onAction(action.student, action.kind, adding ? value : undefined);
      setAction(null);
      setNotice("Account updated successfully.");
    } catch (failure) {
      setActionError(
        failure instanceof Error ? failure.message : "Could not save. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 text-foreground lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
      <aside className="border-b border-border bg-foreground text-background lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0">
        <a href="/admin" className="flex items-center gap-3 px-5 py-5 lg:py-7">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-background/10">
            <BookOpen className="h-5 w-5" />
          </span>
          <span>
            <strong className="block text-base tracking-tight">Sayar Owl</strong>
            <span className="text-[11px] uppercase tracking-[0.2em] opacity-55">Academy admin</span>
          </span>
        </a>
        <nav
          aria-label="Admin navigation"
          className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-1.5 lg:px-4 lg:pt-5"
        >
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={section === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                section === item.id
                  ? "bg-background/12 font-medium text-background"
                  : "text-background/65 hover:bg-background/5 hover:text-background",
              )}
            >
              <item.icon aria-hidden="true" className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
              {item.id === "requests" && scholarships.length > 0 && (
                <span className="ml-auto rounded-md bg-background/15 px-1.5 text-xs">
                  {scholarships.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-3 border-t border-background/10 p-5 lg:block">
          <div className="flex items-center gap-2 text-xs text-background/65">
            <ShieldCheck className="h-4 w-4" /> Admin workspace
          </div>
          <a
            href="/"
            className="flex items-center justify-between text-sm text-background/80 hover:text-background"
          >
            Open academy
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 text-sm text-background/65 hover:text-background"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 bg-card px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Workspace</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium">{title.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">Myanmar time</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh accounts"
              title="Reload account and reported usage data"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              className="rounded-lg p-2 hover:bg-muted lg:hidden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-8">
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              SAYAR OWL ACADEMY
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {title.label === "Overview" ? "Academy overview" : title.label}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{title.subtitle}</p>
          </div>
          {loading && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border bg-card p-4 text-sm"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading accounts…
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              {error}{" "}
              <button onClick={onRefresh} className="ml-2 underline">
                Try again
              </button>
            </div>
          )}
          {notice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary"
            >
              <Check className="h-4 w-4" />
              {notice}
            </div>
          )}
          {section === "overview" && (
            <AdminOverview
              students={students}
              loading={loading}
              error={error}
              navigate={navigate}
            />
          )}
          {section === "students" && (
            <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                <div>
                  <h2 className="font-semibold">
                    Student directory{" "}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {filtered.length}
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Find an account to manage access, credits and progress.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 border-b border-border bg-muted/20 p-4">
                <label className="relative min-w-0 flex-1">
                  <Search
                    aria-hidden="true"
                    className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                  />
                  <input
                    aria-label="Search students"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                    className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
                  />
                </label>
                <select
                  aria-label="Filter accounts"
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value);
                    setPage(0);
                  }}
                  className="h-10 max-w-full rounded-lg border border-input bg-card px-3 text-sm"
                >
                  <option value="all">All accounts</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="block w-full text-left text-sm sm:table sm:min-w-[650px]">
                  <caption className="sr-only">Student accounts and reported usage</caption>
                  <thead className="hidden border-b border-border bg-muted/20 text-[11px] uppercase tracking-wider text-muted-foreground sm:table-header-group">
                    <tr>
                      {["Student", "Status", "Tutor today", "Exam today", "Last seen", ""].map(
                        (label, index) => (
                          <th key={index} scope="col" className="px-5 py-3 font-medium">
                            {label || <span className="sr-only">Actions</span>}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="block divide-y divide-border/70 sm:table-row-group">
                    {visible.map((student) => (
                      <tr
                        key={student.id}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 hover:bg-muted/25 sm:table-row sm:p-0"
                      >
                        <td className="min-w-0 sm:px-5 sm:py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar student={student} />
                            <div className="min-w-0">
                              <p className="max-w-56 truncate font-medium">
                                {student.full_name || "Unnamed account"}
                                {student.id === myId && (
                                  <span className="ml-2 text-xs text-muted-foreground">You</span>
                                )}
                              </p>
                              <p className="max-w-56 truncate text-xs text-muted-foreground">
                                {student.email}
                              </p>
                              <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                                {student.is_main_admin
                                  ? "Main admin"
                                  : student.is_admin
                                    ? "Admin"
                                    : student.is_teacher
                                      ? "Teacher"
                                      : "Student"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="sm:px-5 sm:py-4">
                          <Status student={student} />
                        </td>
                        <td className="rounded-lg bg-muted/40 p-3 sm:rounded-none sm:bg-transparent sm:px-5 sm:py-4">
                          <span className="mb-1 block text-xs text-muted-foreground sm:hidden">
                            Tutor today
                          </span>
                          <span className="font-medium">{student.tutor_used_today}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {student.tutor_bonus} bonus
                          </span>
                        </td>
                        <td className="rounded-lg bg-muted/40 p-3 sm:rounded-none sm:bg-transparent sm:px-5 sm:py-4">
                          <span className="mb-1 block text-xs text-muted-foreground sm:hidden">
                            Exams today
                          </span>
                          <span className="font-medium">{student.exam_used_today}</span>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {student.exam_bonus} bonus
                          </span>
                        </td>
                        <td className="hidden whitespace-nowrap px-5 py-4 text-xs text-muted-foreground sm:table-cell">
                          {date(student.last_seen_at)}
                        </td>
                        <td className="col-span-2 sm:px-5 sm:py-4">
                          <Button
                            className="w-full sm:w-auto"
                            variant="outline"
                            size="sm"
                            aria-label={`Manage ${student.full_name || student.email || student.id}`}
                            onClick={() => {
                              setSelectedId(student.id);
                              setProgress(false);
                            }}
                          >
                            Manage
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && !visible.length && (
                <div className="p-12 text-center">
                  <Search className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="font-medium">
                    {students.length ? "No matching accounts" : "No accounts loaded"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {students.length
                      ? "Try another name, email or filter."
                      : "Accounts will appear here when available."}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-xs text-muted-foreground">
                <span>
                  {filtered.length
                    ? `${currentPage * 10 + 1}–${Math.min((currentPage + 1) * 10, filtered.length)} of ${filtered.length} loaded accounts`
                    : "0 accounts"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Previous page"
                    disabled={!currentPage}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span>
                    Page {currentPage + 1} of {pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Next page"
                    disabled={currentPage + 1 >= pages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          )}
          {section !== "overview" && section !== "students" && (
            <div className="space-y-5">
              {section === "ai" && (
                <section className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Connection tests can use provider credits. A successful test does not show your
                    remaining balance.{" "}
                    <a
                      className="font-medium text-primary underline"
                      href="https://lovable.dev/settings/usage-breakdown"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Lovable usage
                    </a>
                  </p>
                </section>
              )}
              {section === "requests" && (
                <section className="rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-semibold">
                    Scholarship applications{" "}
                    <span className="text-muted-foreground">({scholarships.length})</span>
                  </h2>
                  {!scholarships.length && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No pending scholarship applications in this list.
                    </p>
                  )}
                  {scholarships.map((student) => (
                    <div
                      key={student.id}
                      className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4"
                    >
                      <Avatar student={student} />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">
                          {student.full_name || student.email}
                        </p>
                        <p className="mt-1 break-words text-xs text-muted-foreground">
                          {student.scholarship_note || "No note supplied"}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => openAction(student, "approve")}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(student, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}
          {(Object.keys(panels) as Array<keyof typeof panels>).map((key) =>
            visited.has(key) ? (
              <div key={key} hidden={section !== key} className="space-y-5">
                {panels[key]}
              </div>
            ) : null,
          )}
          <footer className="flex flex-wrap justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
            <span>Sayar Owl · Academy management</span>
            <span>Usage totals reflect the accounts returned by the server.</span>
          </footer>
        </main>
      </div>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Account details</DialogTitle>
            <DialogDescription>Manage this account and its existing allowances.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar student={selected} />
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold">
                    {selected.full_name || "Unnamed account"}
                  </p>
                  <p className="break-all text-sm text-muted-foreground">{selected.email}</p>
                </div>
                <Status student={selected} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-xs text-muted-foreground">Tutor messages today</p>
                  <p className="mt-1 text-2xl font-semibold">{selected.tutor_used_today}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bonus remaining: {selected.tutor_bonus}
                  </p>
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-xs text-muted-foreground">Exam papers today</p>
                  <p className="mt-1 text-2xl font-semibold">{selected.exam_used_today}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Bonus remaining: {selected.exam_bonus}
                  </p>
                </div>
              </div>
              <AdminSpeakingUsage student={selected} />
              <p className="text-xs text-muted-foreground">
                Scholarship: {selected.scholarship || "Not set"} · Last seen{" "}
                {date(selected.last_seen_at)}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => openAction(selected, "tutor")}>
                  <MessageSquare className="h-4 w-4" />
                  Add tutor questions
                </Button>
                <Button variant="outline" onClick={() => openAction(selected, "exam")}>
                  <BookOpen className="h-4 w-4" />
                  Add exam credits
                </Button>
                {selected.scholarship === "approved" && (
                  <Button variant="outline" onClick={() => openAction(selected, "end-scholarship")}>
                    End scholarship
                  </Button>
                )}
              </div>
              <Button variant="outline" onClick={() => setProgress(!progress)}>
                {progress ? "Hide progress" : "View progress"}
              </Button>
              {progress && <StudentProgress userId={selected.id} />}
              {selected.id !== myId && !selected.is_main_admin && (
                <section className="space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">Account access</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.status === "suspended" ? (
                      <Button variant="outline" onClick={() => openAction(selected, "activate")}>
                        Activate account
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" onClick={() => openAction(selected, "suspend7")}>
                          Suspend 7 days
                        </Button>
                        <Button variant="outline" onClick={() => openAction(selected, "suspend")}>
                          Suspend account
                        </Button>
                      </>
                    )}
                    <Button variant="outline" onClick={() => openAction(selected, "admin")}>
                      {selected.is_admin ? "Remove admin" : "Make admin"}
                    </Button>
                    {!selected.is_admin && (
                      <Button variant="outline" onClick={() => openAction(selected, "teacher")}>
                        {selected.is_teacher ? "Remove teacher" : "Make teacher"}
                      </Button>
                    )}
                    <Button variant="destructive" onClick={() => openAction(selected, "delete")}>
                      Delete account
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !pending) setAction(null);
        }}
      >
        <DialogContent
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (pending) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {action?.kind === "tutor"
                ? "Add tutor questions"
                : action?.kind === "exam"
                  ? "Add exam credits"
                  : "Confirm account change"}
            </DialogTitle>
            <DialogDescription>
              {action?.student.full_name || action?.student.email}.{" "}
              {action?.kind === "delete"
                ? "This permanently deletes the account and cannot be undone."
                : "Review this action before saving."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="space-y-4"
          >
            {action && ["tutor", "exam"].includes(action.kind) ? (
              <label className="block space-y-2 text-sm font-medium">
                Amount
                <input
                  aria-label="Credit amount"
                  type="number"
                  min="1"
                  max="100000"
                  step="1"
                  required
                  value={amount}
                  disabled={pending}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3"
                />
                <span className="block text-xs font-normal text-muted-foreground">
                  Adds student allowance. This does not top up your provider balance.
                </span>
              </label>
            ) : (
              <p className="rounded-lg bg-muted p-3 text-sm">
                Action:{" "}
                {action?.kind === "admin"
                  ? action.student.is_admin
                    ? "Remove admin role"
                    : "Grant admin role"
                  : action?.kind === "teacher"
                    ? action.student.is_teacher
                      ? "Remove teacher role"
                      : "Grant teacher role"
                    : action?.kind.replaceAll("-", " ")}
              </p>
            )}
            {actionError && (
              <p role="alert" className="text-sm text-destructive">
                {actionError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setAction(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={action?.kind === "delete" ? "destructive" : "default"}
                disabled={pending}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? "Saving…" : "Confirm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
