import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Grade11GrammarVideos } from "./Grade11GrammarVideos";

vi.mock("@/data/grade11/grammarVideos.json", () => ({
  default: {
    "1": [{ title: "Both ... and", url: "" }],
    "2": [
      { title: "First grammar video", url: "https://youtu.be/abcdefghijk" },
      { title: "Second grammar video", url: "https://www.youtube.com/watch?v=ABCDEFGHIJK" },
    ],
    "3": [{ title: "Unconfigured video", url: "https://example.com/embed/abcdefghijk" }],
    "4": [
      {
        title: "Present perfect clip",
        url: "https://youtu.be/abcdefghijk",
        start: 660,
        end: 1229,
        channel: "English with Lucy",
      },
      { title: "Another chapter", url: "https://youtu.be/abcdefghijk", start: 181, end: 322 },
    ],
  },
}));

afterEach(cleanup);

describe("Grade 11 grammar video links", () => {
  it("shows a placeholder without loading a Grade 10 video when a link is empty", () => {
    const { container } = render(<Grade11GrammarVideos unit={1} />);
    expect(screen.getByText("ဗီဒီယို မထည့်ရသေးပါ။")).toBeVisible();
    expect(container.querySelector("iframe")).toBeNull();
  });
  it("embeds teacher YouTube links and switches between multiple lessons", () => {
    const { container } = render(<Grade11GrammarVideos unit={2} />);
    expect(container.querySelector("iframe")?.src).toBe(
      "https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0",
    );
    fireEvent.click(screen.getByRole("button", { name: "Second grammar video" }));
    expect(container.querySelector("iframe")?.src).toBe(
      "https://www.youtube-nocookie.com/embed/ABCDEFGHIJK?rel=0",
    );
  });
  it("does not embed unrelated websites", () => {
    const { container } = render(<Grade11GrammarVideos unit={3} />);
    expect(container.querySelector("iframe")).toBeNull();
  });
});

it("bounds the long lesson to the selected chapter and remounts the same video on chapter changes", () => {
  const { container } = render(<Grade11GrammarVideos unit={4} />);
  const first = container.querySelector("iframe");
  expect(first?.src).toBe(
    "https://www.youtube-nocookie.com/embed/abcdefghijk?rel=0&start=660&end=1229",
  );
  expect(screen.getByText(/11:00–20:29 · 9:29/)).toBeVisible();
  expect(screen.getByRole("link").getAttribute("href")).toBe(
    "https://www.youtube.com/watch?v=abcdefghijk&t=660s",
  );
  fireEvent.click(screen.getByRole("button", { name: "Another chapter" }));
  expect(container.querySelector("iframe")).not.toBe(first);
  expect(container.querySelector("iframe")?.src).toContain("start=181&end=322");
});
it("starts at the first topic when navigating to another unit", () => {
  const { container, rerender } = render(<Grade11GrammarVideos unit={2} />);
  fireEvent.click(screen.getByRole("button", { name: "Second grammar video" }));
  rerender(<Grade11GrammarVideos unit={4} />);
  expect(screen.getByRole("button", { name: "Present perfect clip" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(container.querySelector("iframe")?.src).toContain("start=660&end=1229");
});
