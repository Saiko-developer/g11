import { expect, it } from "vitest";
import { isClassroomCancellation } from "./cancellation";
it.each([
  new DOMException("signal is aborted without reason", "AbortError"),
  { name: "AbortError", message: "cancelled by browser" },
  { code: "ABORT_ERR" },
  new Error("signal is aborted without reason"),
  new Error("AbortError: signal is aborted without reason"),
  new Error("The operation was aborted."),
])("recognizes normal cancellation across browser/fetch wrappers: %s", (error) => {
  expect(isClassroomCancellation(error)).toBe(true);
});
it.each([
  new Error("Provider failed"),
  new DOMException("The operation was aborted due to timeout", "TimeoutError"),
  new Error("ဆရာ့အသံ ပြင်ဆင်မှု ကြာနေပါသည်။"),
  new Error("Generation aborted because provider credits ran out"),
  null,
  undefined,
])("does not hide real failures or timeouts: %s", (error) => {
  expect(isClassroomCancellation(error)).toBe(false);
});
