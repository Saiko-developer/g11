import { expect, it } from "vitest";
import { readAudioZip, zipEntries } from "./zip.server";

it("reads the original Audio Manager ZIP and rejects corrupted or truncated copies", async () => {
  const payload = new Uint8Array([1, 2, 3, 4]);
  const chunks: Uint8Array[] = [];
  for await (const chunk of zipEntries([
    { name: "manifest.json", read: async () => new TextEncoder().encode("{}") },
    { name: "clip.mp3", read: async () => payload },
  ]))
    chunks.push(chunk);
  const zip = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    zip.set(chunk, offset);
    offset += chunk.length;
  }
  expect(readAudioZip(zip).get("clip.mp3")).toEqual(payload);
  expect(() => readAudioZip(zip.subarray(0, -1))).toThrow("Incomplete ZIP backup");
  zip[30 + "manifest.json".length] ^= 1;
  expect(() => readAudioZip(zip)).toThrow("ZIP checksum mismatch");
});
