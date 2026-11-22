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
  expect(unit1).toHaveAttribute("aria-expanded", "true");
  for (const label of ["Receptive Skills", "Productive Skills", "Knowledge about Language"]) {
    expect(screen.getByRole("heading", { name: label })).toBeVisible();
  }
  fireEvent.click(screen.getByRole("link", { name: "Listening Good manners in four countries" }));
  const back = await screen.findByRole("link", { name: "Grade 12 Units" });
  expect(screen.getByRole("region", { name: "Grade 12 Unit 1 listening audio" })).toBeVisible();
  fireEvent.click(back);
  expect(await screen.findByRole("button", { name: /Unit 1 Good Manners/i })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  expect(screen.getByRole("link", { name: "Speaking Good and bad manners" })).toBeVisible();
  for (const { number, title } of grade12Units.slice(1)) {
    fireEvent.click(screen.getByRole("button", { name: `${number} Unit ${number} ${title}` }));
    expect(screen.getByRole("heading", { name: "Receptive Skills" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Productive Skills" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Knowledge about Language" })).toBeVisible();
    expect(screen.getByText(title, { selector: "span.text-muted-foreground" })).toBeVisible();
    expect(screen.queryByRole("link", { name: /^Listening/ })).not.toBeInTheDocument();
  }
  expect(screen.getByText("Writing a blog post")).toBeVisible();
});
