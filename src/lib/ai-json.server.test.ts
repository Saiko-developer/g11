import { describe, expect, it } from "vitest";
import { parseJson } from "./ai-json.server";

describe("parseJson", () => {
  it("repairs a reply with a missing comma between array items", () => {
    expect(parseJson<{ a: number[] }>('{"a":[1 2,3]}')).toEqual({ a: [1, 2, 3] });
  });
  it("repairs a reply that was cut off", () => {
    expect(parseJson<{ a: string[] }>('{"a":["x","y"')).toEqual({ a: ["x", "y"] });
  });
});
