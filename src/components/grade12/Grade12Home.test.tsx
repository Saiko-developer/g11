import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { grade12Units } from "@/data/grade12/syllabus";
import { Route } from "@/routes/grade-12.index";

vi.mock("@/components/AuthGate", () => ({
  useAuth: () => ({ session: { access_token: "test" }, ready: true }),
}));
vi.mock("@/components/SayaOwlHome", () => ({
  SayaOwlHome: ({ grade, lessonContext }: { grade: number; lessonContext: string }) => (
    <button type="button" aria-label={`Grade ${grade} Saya Owl`} title={lessonContext} />
  ),
}));
vi.mock("@/components/SiteHeader", () => ({ SiteHeader: () => null }));
vi.mock("@/components/grade11/GradeSwitcher", () => ({ GradeSwitcher: () => null }));

afterEach(cleanup);

it("opens a Unit 1 skill and returns to the expanded curriculum card", async () => {
  const root = createRootRoute();
  const grade12 = createRoute({
    getParentRoute: () => root,
    path: "/grade-12/",
    validateSearch: Route.options.validateSearch,
    component: Route.options.component,
  });
  const router = createRouter({
    routeTree: root.addChildren([grade12]),
    history: createMemoryHistory({ initialEntries: ["/grade-12"] }),
  });
  render(<RouterProvider router={router} />);
  const unit1 = await screen.findByRole("button", { name: /Unit 1 Good Manners/i });
  expect(screen.getByRole("button", { name: "Grade 12 Saya Owl" })).toHaveAttribute(
    "title",
    expect.stringContaining("Unit 12 · Intercultural Communication"),
  );
  expect(unit1).toHaveAttribute("aria-expanded", "true");
  for (const label of ["Receptive Skills", "Productive Skills", "Knowledge about Language"]) {
    expect(screen.getByRole("heading", { name: label })).toBeVisible();
  }
  fireEvent.click(screen.getByRole("link", { name: "Listening Good manners in four countries" }));
  const back = await screen.findByRole("link", { name: "Grade 12 Units" });
  expect(screen.getByRole("region", { name: "Grade 12 Unit 1 listening audio" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Grade 12 Saya Owl" })).toHaveAttribute(
    "title",
    expect.stringContaining("[Exercise B · Question 1 | source Grade 12 Unit 1]"),
  );
  expect(document.querySelector("[data-saya-home-section]")).toHaveTextContent("travel expert");
  fireEvent.click(back);
  expect(await screen.findByRole("button", { name: /Unit 1 Good Manners/i })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(screen.getByRole("link", { name: "Speaking Good and bad manners" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "2 Unit 2 Key to Happiness" }));
  fireEvent.click(screen.getByRole("link", { name: "Grammar Relative clauses" }));
  expect(await screen.findByRole("heading", { name: "Relative clauses" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Grade 12 Saya Owl" })).toHaveAttribute(
    "title",
    expect.stringContaining("Grade 12 English · Unit 2 · grammar"),
  );
  expect(screen.getByText("People ______ are honest are always trusted.")).toBeVisible();
  expect(screen.getAllByRole("button", { name: "Oral Explanation" })).toHaveLength(2);
  fireEvent.click(screen.getAllByRole("button", { name: "Translate instructions" })[0]);
  expect(
    screen.getByText("သင့်တော်သော ဆက်စပ်နာမ်စားဖြင့် ကွက်လပ်တစ်ခုစီကို ဖြည့်ပါ။"),
  ).toBeVisible();

  fireEvent.click(screen.getByRole("link", { name: "Grade 12 Units" }));
  expect(await screen.findByRole("button", { name: "2 Unit 2 Key to Happiness" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "3 Unit 3 Diet and Nutrition" }));
  fireEvent.click(screen.getByRole("link", { name: "Vocabulary Affixes in English" }));
  expect(await screen.findByRole("heading", { name: "Affixes in English" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Prefix" })).toBeVisible();
  expect(screen.getByRole("columnheader", { name: "Suffix" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Grade 12 Saya Owl" })).toHaveAttribute(
    "title",
    expect.stringContaining("[Exercise A · Question 10 | source Grade 12 Unit 3]"),
  );
  fireEvent.click(screen.getByRole("link", { name: "Grade 12 Units" }));
  expect(
    await screen.findByRole("button", { name: "3 Unit 3 Diet and Nutrition" }),
  ).toHaveAttribute("aria-expanded", "true");
  for (const { number, title } of grade12Units.slice(3)) {
    fireEvent.click(screen.getByRole("button", { name: `${number} Unit ${number} ${title}` }));
    expect(screen.getByRole("heading", { name: "Receptive Skills" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Productive Skills" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Knowledge about Language" })).toBeVisible();
    expect(screen.getByText(title, { selector: "span.text-muted-foreground" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /^Listening/ })).not.toBeInTheDocument();
  }
  expect(screen.getByText("Writing a blog post")).toBeVisible();
}, 30000);
