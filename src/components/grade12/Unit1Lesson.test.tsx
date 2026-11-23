import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { unit1Sections } from "@/data/grade12/unit1";
import { Unit1Lesson } from "./Unit1Lesson";

afterEach(cleanup);

it("uses separate passage and exercise translation controls and keeps sentence structure help", () => {
  render(<Unit1Lesson section={unit1Sections[0]} />);
  const first = within(screen.getByRole("region", { name: "Paragraph 1" }));
  const second = within(screen.getByRole("region", { name: "Paragraph 2" }));
  const passage = screen.getByRole("button", { name: "Myanmar translation for Reading passage" });
  const exercises = screen.getByRole("button", { name: "Myanmar translation for Comprehension" });
  expect(first.queryByText(/အပြုအမူပုံစံဆိုသည်မှာ/)).not.toBeInTheDocument();
  fireEvent.click(passage);
  expect(passage).toHaveAttribute("aria-pressed", "true");
  expect(first.getByText(/အပြုအမူပုံစံဆိုသည်မှာ/)).toBeVisible();
  expect(second.getByText((_, element) => element?.getAttribute("lang") === "my")).toBeVisible();
  expect(exercises).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(exercises);
  expect(
    within(screen.getByRole("region", { name: "Comprehension" })).getAllByText(
      (_, element) => element?.getAttribute("lang") === "my" && element?.tagName === "P",
    ).length,
  ).toBeGreaterThan(27);
  expect(first.queryByRole("button", { name: "Sentence Structure" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Translate question" })).not.toBeInTheDocument();
  fireEvent.click(passage);
  expect(first.queryByText(/အပြုအမူပုံစံဆိုသည်မှာ/)).not.toBeInTheDocument();
  expect(exercises).toHaveAttribute("aria-pressed", "true");
  expect(screen.getAllByRole("button", { name: "Sentence Structure" })).toHaveLength(10);
  fireEvent.click(screen.getAllByRole("button", { name: "Sentence Structure" })[0]);
  expect(screen.getByText(/ကွာခြားချက်ကို မေးထားသည်/)).toBeInTheDocument();
});

it.each([
  [0, ["A.", "B.", "C."]],
  [1, ["A.", "B.", "C."]],
  [2, ["A.", "B."]],
  [3, ["A.", "B."]],
] as const)("renders all exercise groups for section index %s", (index, labels) => {
  render(<Unit1Lesson section={unit1Sections[index]} />);
  expect(
    screen
      .getAllByRole("heading", { level: 3 })
      .filter((h) => /^[A-E]\./.test(h.textContent ?? ""))
      .map((h) => h.textContent?.slice(0, 2)),
  ).toEqual(labels);
});

it("keeps both pre-reading activities interactive and all comprehension questions available", () => {
  render(<Unit1Lesson section={unit1Sections[0]} />);
  fireEvent.click(screen.getByText("Pre-reading"));
  const choices = screen.getAllByRole("combobox");
  expect(choices).toHaveLength(24);
  fireEvent.change(choices[0], { target: { value: "Very polite" } });
  expect(choices[0]).toHaveValue("Very polite");
  expect(screen.getAllByRole("button", { name: "Reveal answer" })).toHaveLength(24);
});

it("checks vocabulary matching by choice and leaves four entries per column to complete", () => {
  render(<Unit1Lesson section={unit1Sections[1]} />);
  expect(screen.getByRole("button", { name: "Speak role model" })).toBeInTheDocument();
  expect(screen.getByText("အတုယူစရာ စံနမူနာရှင်")).toBeInTheDocument();
  const match = screen.getByRole("combobox", { name: "Match key" });
  expect(screen.getAllByRole("combobox")).toHaveLength(10);
  fireEvent.change(match, { target: { value: "i) player" } });
  fireEvent.click(screen.getAllByRole("button", { name: "Check Answer" })[0]);
  expect(screen.getByRole("status")).toHaveTextContent("Matches the suggested answer.");
  expect(screen.getAllByRole("textbox", { name: /Compound nouns [2-5]/ })).toHaveLength(4);
  expect(screen.getAllByRole("textbox", { name: /Compound adjectives [2-5]/ })).toHaveLength(4);
});

it("provides all ten modal blanks and six original-sentence inputs", () => {
  render(<Unit1Lesson section={unit1Sections[2]} />);
  fireEvent.click(screen.getAllByRole("button", { name: "Text Explanation" })[0]);
  expect(screen.getByText("Can I take your umbrella?")).toBeInTheDocument();
  expect(screen.getAllByRole("combobox")).toHaveLength(10);
  expect(screen.getAllByRole("textbox", { name: /Sentence [1-6]/ })).toHaveLength(6);
});

it("offers the shared oral and video sections for Grade 12 grammar", () => {
  render(<Unit1Lesson section={unit1Sections[2]} />);
  expect(screen.getAllByRole("button", { name: "Oral Explanation" })).toHaveLength(3);
  const video = within(screen.getByRole("region", { name: "Grammar video explanation" }));
  expect(video.getByText("Video Lesson")).toBeInTheDocument();
  expect(video.getByText("ဗီဒီယို မထည့်ရသေးပါ။")).toBeInTheDocument();
  expect(video.queryByRole("button")).not.toBeInTheDocument();
});

it("requests the authored Burmese narration when Oral Explanation opens", async () => {
  const fetchAudio = vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 }));
  vi.stubGlobal("fetch", fetchAudio);
  try {
    render(<Unit1Lesson section={unit1Sections[2]} />);
    expect(fetchAudio).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "Oral Explanation" })[0]);
    await screen.findByText(/အသံ ဖွင့်၍ မရပါ/);
    expect(fetchAudio).toHaveBeenCalledWith(
      "/api/tts",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("လေးလံတဲ့ သေတ္တာ"),
      }),
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

it("translates grammar instructions and individual modal blanks without revealing answers", () => {
  render(<Unit1Lesson section={unit1Sections[2]} />);
  const instructions = screen.getAllByRole("button", { name: "Translate instructions" });
  expect(instructions).toHaveLength(2);
  fireEvent.click(instructions[1]);
  expect(screen.getByText(/ကိုယ်ပိုင်ဝါကျ ခြောက်ကြောင်း ရေးပါ/)).toBeVisible();
  const sentences = screen.getAllByRole("button", { name: "Translate sentence" });
  expect(sentences).toHaveLength(10);
  fireEvent.click(sentences[1]);
  expect(screen.getByText("သင် မော်တော်ဆိုင်ကယ် မောင်း ______ သလား။")).toBeVisible();
  expect(screen.queryByText(/Suggested answer/)).not.toBeInTheDocument();
});
