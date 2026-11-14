import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AdminDashboard, type AdminStudent } from "./AdminDashboard";
vi.mock("@/components/StudentProgress", () => ({
  StudentProgress: ({ userId }: { userId: string }) => <div>Progress for {userId}</div>,
}));
afterEach(cleanup);
const student = (id: number, overrides: Partial<AdminStudent> = {}): AdminStudent => ({
  id: String(id),
  email: `student${id}@example.test`,
  full_name: `Student ${id}`,
  avatar_url: null,
  status: "active",
  suspended_until: null,
  created_at: "2026-11-01T00:00:00Z",
  last_seen_at: "2026-11-09T06:00:00Z",
  tutor_bonus: 5,
  exam_bonus: 2,
  tutor_used_today: id,
  exam_used_today: 1,
  scholarship: "none",
  scholarship_note: null,
  is_admin: false,
  is_teacher: false,
  is_main_admin: false,
  ...overrides,
});
function setup(
  students = [student(1), student(2, { status: "suspended" }), student(3, { is_teacher: true })],
  onAction = vi.fn().mockResolvedValue(undefined),
  extra = {},
) {
  render(
    <AdminDashboard
      students={students}
      myId="me"
      loading={false}
      refreshing={false}
      onRefresh={vi.fn()}
      onSignOut={vi.fn()}
      onAction={onAction}
      panels={{
        payments: <div>Payment panel</div>,
        ai: <div>AI panel</div>,
        requests: <div>Teacher panel</div>,
        support: <div>Support panel</div>,
        announcements: <div>Announcement panel</div>,
      }}
      {...extra}
    />,
  );
  return { onAction };
}
const directory = () => fireEvent.click(screen.getByRole("button", { name: "Students" }));
it("shows actual counts and provider billing link without inventing a provider balance", () => {
  setup();
  expect(screen.getByRole("heading", { name: "Academy overview" })).toBeVisible();
  expect(screen.getByText("Accounts loaded").parentElement?.parentElement).toHaveTextContent("3");
  expect(screen.getByRole("link", { name: "Open Lovable billing" })).toHaveAttribute(
    "href",
    "https://lovable.dev/settings/billing",
  );
  expect(screen.getByText(/Live provider balance and spending are not connected/)).toBeVisible();
  expect(screen.queryByText("Payment panel")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Payments" }));
  expect(screen.getByText("Payment panel")).toBeVisible();
});
it("searches, filters and paginates the loaded account list", () => {
  setup(
    Array.from({ length: 12 }, (_, i) =>
      student(i + 1, { status: i === 11 ? "suspended" : "active" }),
    ),
  );
  directory();
  expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Manage Student 12" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screen.getByRole("button", { name: "Manage Student 12" })).toBeVisible();
  fireEvent.change(screen.getByLabelText("Search students"), { target: { value: "student12@" } });
  expect(screen.getByRole("button", { name: "Manage Student 12" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Filter accounts"), { target: { value: "active" } });
  expect(screen.getByText("No matching accounts")).toBeVisible();
});
it("requires confirmation and a valid amount before granting allowance, and preserves failed forms", async () => {
  const onAction = vi
    .fn()
    .mockRejectedValueOnce(new Error("Server unavailable"))
    .mockResolvedValueOnce(undefined);
  setup([student(1)], onAction);
  directory();
  fireEvent.click(screen.getByRole("button", { name: "Manage Student 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Add tutor questions" }));
  expect(onAction).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Credit amount"), { target: { value: "-2" } });
  fireEvent.submit(screen.getByRole("button", { name: "Confirm" }).closest("form")!);
  expect(screen.getByRole("alert")).toHaveTextContent("whole number");
  expect(onAction).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Credit amount"), { target: { value: "20" } });
  fireEvent.submit(screen.getByRole("button", { name: "Confirm" }).closest("form")!);
  await screen.findByText("Server unavailable");
  expect(screen.getByLabelText("Credit amount")).toHaveValue(20);
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await screen.findByText("Account updated successfully.");
  expect(onAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: "1" }), "tutor", 20);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("keeps destructive role/account actions hidden for self and main admin", () => {
  setup([student(1, { id: "me", is_admin: true }), student(2, { is_main_admin: true })]);
  directory();
  fireEvent.click(screen.getByRole("button", { name: "Manage Student 1" }));
  expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Remove admin" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  fireEvent.click(screen.getByRole("button", { name: "Manage Student 2" }));
  expect(screen.queryByRole("button", { name: "Delete account" })).not.toBeInTheDocument();
});
it("confirms scholarship decisions and does not modify an account on cancel", async () => {
  const { onAction } = setup([student(1, { scholarship: "pending" })]);
  fireEvent.click(screen.getByRole("button", { name: /Requests/ }));
  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(onAction).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Approve" }));
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  await waitFor(() =>
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1" }),
      "approve",
      undefined,
    ),
  );
});
it("shows an explicit loading and error state instead of claiming zero accounts", () => {
  setup([], vi.fn(), { loading: true, error: "Cannot load accounts" });
  expect(screen.getByRole("alert")).toHaveTextContent("Cannot load accounts");
  expect(screen.getByRole("status")).toHaveTextContent("Loading accounts");
  expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
});
it("preserves a payment draft when navigating away and back", () => {
  setup(undefined, undefined, {
    panels: {
      payments: <input aria-label="Payment draft" defaultValue="original" />,
      ai: null,
      requests: null,
      support: null,
      announcements: null,
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Payments" }));
  fireEvent.change(screen.getByLabelText("Payment draft"), { target: { value: "unsaved edit" } });
  directory();
  fireEvent.click(screen.getByRole("button", { name: "Payments" }));
  expect(screen.getByLabelText("Payment draft")).toHaveValue("unsaved edit");
});

it("opens the embedded teaching setup from dashboard navigation", () => {
  setup(undefined, undefined, {
    panels: {
      payments: null,
      ai: null,
      requests: null,
      support: null,
      announcements: null,
      teaching: <div>Classroom teaching setup</div>,
    },
  });
  fireEvent.click(screen.getByRole("button", { name: "Teaching setup", exact: true }));
  expect(screen.getByText("Classroom teaching setup")).toBeVisible();
});
it("opens legacy teaching links directly in the admin teaching panel", () => {
  setup(undefined, undefined, {
    initialSection: "teaching",
    panels: {
      payments: null,
      ai: null,
      requests: null,
      support: null,
      announcements: null,
      teaching: <div>Classroom teaching setup</div>,
    },
  });
  expect(screen.getByText("Classroom teaching setup")).toBeVisible();
  expect(screen.getByRole("button", { name: "Teaching setup", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});
