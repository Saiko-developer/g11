import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { signInWithGoogle } from "@/components/RequireSignIn";
import {
  listStudents,
  setStudentStatus,
  deleteStudent,
  setAdminRole,
  setTeacherRole,
  updateTutorWallet,
} from "@/lib/admin.functions";
import { useAuth } from "@/components/AuthGate";
import {
  AdminDashboard,
  type AdminAction,
  type AdminStudent,
} from "@/components/admin/AdminDashboard";
import { AdminTopups } from "@/components/Topup";
import { AdminTeacherRequests } from "@/components/TeacherRequest";
import { Button } from "@/components/ui/button";
import { AdminAiStatus } from "@/components/AdminAiStatus";
import { AdminSupportInbox, AdminAnnouncements } from "@/components/Support";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Sayar Owl Academy" },
      {
        name: "description",
        content: "Manage your academy, student accounts, payments and AI services.",
      },
      { property: "og:title", content: "Admin — Sayar Owl Academy" },
      { property: "og:description", content: "Teacher dashboard for managing student accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { access, session, signOut, ready } = useAuth();
  if (!ready || (session && !access))
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Loading…
      </main>
    );
  if (!session) return <AdminLogin />;
  if (!access?.is_admin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
        <p>Admin only. (သင်သည် Admin မဟုတ်ပါ)</p>
        <div className="flex gap-2">
          <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
            Back
          </Link>
          <button onClick={signOut} className="rounded-lg border border-input px-4 py-2 text-sm">
            Sign out
          </button>
        </div>
      </main>
    );
  }
  return <Dashboard myId={session.user.id} onSignOut={signOut} />;
}

function Dashboard({ myId, onSignOut }: { myId: string; onSignOut: () => void }) {
  const qc = useQueryClient();
  const list = useServerFn(listStudents);
  const setStatus = useServerFn(setStudentStatus);
  const del = useServerFn(deleteStudent);
  const setRole = useServerFn(setAdminRole);
  const setTeacher = useServerFn(setTeacherRole);
  const tutor = useServerFn(updateTutorWallet);
  const {
    data = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({ queryKey: ["students"], queryFn: () => list() });
  const changed = () => qc.invalidateQueries({ queryKey: ["students"] });
  const onAction = async (student: AdminStudent, action: AdminAction, amount?: number) => {
    const id = student.id;
    switch (action) {
      case "tutor":
        await tutor({ data: { id, addBonus: amount } });
        break;
      case "exam":
        await tutor({ data: { id, addExam: amount } });
        break;
      case "activate":
        await setStatus({ data: { id, status: "active" } });
        break;
      case "suspend7":
        await setStatus({ data: { id, status: "suspended", days: 7 } });
        break;
      case "suspend":
        await setStatus({ data: { id, status: "suspended" } });
        break;
      case "admin":
        await setRole({ data: { id, admin: !student.is_admin } });
        break;
      case "teacher":
        await setTeacher({ data: { id, teacher: !student.is_teacher } });
        break;
      case "delete":
        await del({ data: { id } });
        break;
      case "approve":
        await tutor({ data: { id, scholarship: "approved" } });
        break;
      case "reject":
        await tutor({ data: { id, scholarship: "rejected" } });
        break;
      case "end-scholarship":
        await tutor({ data: { id, scholarship: "none" } });
        break;
    }
    await changed();
  };
  const emails = Object.fromEntries(
    data.map((student) => [student.id, student.email ?? student.id]),
  );
  return (
    <AdminDashboard
      students={data}
      myId={myId}
      loading={isLoading}
      refreshing={isFetching}
      error={error instanceof Error ? error.message : undefined}
      onRefresh={() => {
        void refetch();
      }}
      onSignOut={onSignOut}
      onAction={onAction}
      panels={{
        ai: <AdminAiStatus />,
        payments: <AdminTopups emails={emails} onChanged={changed} />,
        requests: <AdminTeacherRequests emails={emails} onChanged={changed} />,
        support: (
          <AdminSupportInbox
            emails={Object.fromEntries(
              data.map((student) => [student.id, student.full_name || student.email || student.id]),
            )}
          />
        ),
        announcements: <AdminAnnouncements />,
      }}
    />
  );
}

function AdminLogin() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const go = async () => {
    setBusy(true);
    setMsg(null);
    localStorage.setItem("postLoginRedirect", "/admin");
    try {
      const r = await signInWithGoogle();
      if (r.error) {
        setMsg(r.error.message);
        localStorage.removeItem("postLoginRedirect");
        setBusy(false);
        return;
      }
      if (r.redirected) return;
      localStorage.removeItem("postLoginRedirect");
      setBusy(false);
    } catch {
      setMsg("Login မအောင်မြင်ပါ။ ထပ်စမ်းပါ။");
      setBusy(false);
    }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <p className="text-sm text-muted-foreground">
          Google အကောင့်ရွေးသည့်နေရာတွင် Admin Gmail ကို ရွေးပါ (သို့) "Use another account"
          ကိုနှိပ်ပြီး ရိုက်ထည့်ပါ။
        </p>
        <Button onClick={go} disabled={busy} className="w-full">
          {busy ? "Google ဝင်းဒိုး ဖွင့်နေသည်…" : "Sign in with Google"}
        </Button>
        {msg && <p className="text-sm text-destructive">{msg}</p>}
        <Link to="/" className="block text-xs text-muted-foreground underline">
          Home သို့ ပြန်သွားရန်
        </Link>
      </div>
    </main>
  );
}
