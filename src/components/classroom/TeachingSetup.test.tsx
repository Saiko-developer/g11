import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TeachingSetup } from "./TeachingSetup";
const auth = vi.hoisted(() => ({ admin: true }));
vi.mock("@/components/AuthGate", () => ({
  useAuth: () => ({
    ready: true,
    session: { user: { id: "admin" } },
    access: { is_admin: auth.admin },
  }),
}));
beforeEach(() => {
  auth.admin = true;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) =>
      Response.json(
        init?.method === "POST"
          ? { ok: true }
          : {
              config: { database: true, serviceRole: true, speechProvider: true },
              missing: [],
              ready: [],
              published: false,
              live: false,
              contentHash: "a".repeat(64),
            },
      ),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());
it("shows Grade → Unit → Reading and requires explicit approval without bulk generation", async () => {
  render(<TeachingSetup />);
  expect(screen.getByRole("combobox", { name: "Grade" })).toHaveValue("10");
  expect(screen.getByRole("combobox", { name: "Unit" })).toHaveValue("1");
  expect(screen.getByRole("button", { name: "Grammar" })).toBeEnabled();
  const approve = screen.getByRole("button", { name: "Reading အတန်း ဖွင့်မယ်" });
  expect(approve).toBeDisabled();
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("checkbox"));
  await waitFor(() => expect(approve).toBeEnabled());
  fireEvent.click(approve);
  await screen.findByRole("link", { name: /ကျောင်းသားလို အတန်းစမ်းမယ်/ });
  const requests = vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "POST");
  expect(requests).toHaveLength(1);
  expect(JSON.parse(requests[0][1]!.body as string)).toMatchObject({
    grade: 10,
    action: "approve_script",
    contentHash: "a".repeat(64),
  });
});
it("never loads admin setup for students", () => {
  auth.admin = false;
  render(<TeachingSetup />);
  expect(screen.getByRole("alert")).toHaveTextContent("Admin");
  expect(fetch).not.toHaveBeenCalled();
});

it("lets admins review classroom Grammar/Writing in either grade without generating audio", async () => {
  render(<TeachingSetup />);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByRole("combobox", { name: "Grade" }), { target: { value: "11" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Unit" }), { target: { value: "7" } });
  fireEvent.click(screen.getByRole("button", { name: "Writing" }));
  expect(screen.getByRole("heading", { name: "Grade 11 · Unit 7 · Writing" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /ရှိပြီးသား textbook lesson/ })).toHaveAttribute(
    "href",
    "/grade-11/7/writing",
  );
  expect(screen.queryByRole("button", { name: "Reading အတန်း ဖွင့်မယ်" })).not.toBeInTheDocument();
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
});

it("clears Reading approval acknowledgement when switching preparation sections", async () => {
  render(<TeachingSetup />);
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole("checkbox"));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Reading အတန်း ဖွင့်မယ်" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Grammar" }));
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  await screen.findByRole("button", { name: "ကျောင်းသားသင်ကြားမှု ဖွင့်မယ်" });
  fireEvent.click(screen.getByRole("button", { name: "Reading" }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(screen.getByRole("button", { name: "Reading အတန်း ဖွင့်မယ်" })).toBeDisabled();
  expect(vi.mocked(fetch).mock.calls.filter(([, init]) => init?.method === "POST")).toHaveLength(0);
});
