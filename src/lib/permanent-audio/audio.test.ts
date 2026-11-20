import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { pcm16Wav, wavToMp3, inspectMp3 } from "./codec.server";
import { zipEntries } from "./zip.server";
import { syntheticWav } from "./test-wav";
describe("permanent audio codec and archive", () => {
  it("encodes genuine MP3 frames from PCM16 WAV at 64 kbps without mutating source", async () => {
    const wav = syntheticWav(),
      copy = wav.slice(),
      output = wavToMp3(wav);
    expect(wav).toEqual(copy);
    expect(output.bytes.length).toBeLessThan(wav.length / 3);
    expect(output.duration).toBe(1);
    expect(inspectMp3(output.bytes).duration).toBeGreaterThanOrEqual(1);
    expect(output.bytes[0]).toBe(255);
    const { writeFile } = await import("node:fs/promises");
    await writeFile("/tmp/saya-owl-codec-test.mp3", output.bytes);
  });
  it("rejects malformed/truncated WAV, renamed WAV and truncated MP3", () => {
    expect(() => pcm16Wav(new Uint8Array(44))).toThrow();
    expect(() => pcm16Wav(syntheticWav().subarray(0, 100))).toThrow();
    expect(() => inspectMp3(syntheticWav())).toThrow();
    const mp3 = wavToMp3(syntheticWav()).bytes;
    expect(() => inspectMp3(mp3.subarray(0, mp3.length - 7))).toThrow();
  });
  it("streams a valid ZIP with original playable MP3 bytes and manifest", async () => {
    const mp3 = wavToMp3(syntheticWav()).bytes,
      parts: Uint8Array[] = [];
    for await (const part of zipEntries([
      {
        name: "manifest.json",
        read: async () => new TextEncoder().encode('{"grade":11,"voice":"Puck"}'),
      },
      { name: "g11-unit01-grammar.mp3", read: async () => mp3 },
    ]))
      parts.push(part);
    const bytes = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
    expect(await zip.file("manifest.json")!.async("string")).toContain("Puck");
    expect(await zip.file("g11-unit01-grammar.mp3")!.async("uint8array")).toEqual(mp3);
  });
  it("does not read the next ZIP file until the current entry is consumed", async () => {
    let reads = 0;
    const iterator = zipEntries([
      {
        name: "one.mp3",
        read: async () => {
          reads++;
          return new Uint8Array([1]);
        },
      },
      {
        name: "two.mp3",
        read: async () => {
          reads++;
          return new Uint8Array([2]);
        },
      },
    ]);
    await iterator.next();
    expect(reads).toBe(1);
    await iterator.return(undefined);
    expect(reads).toBe(1);
  });
  it("rejects unsafe ZIP entry names", async () => {
    await expect(
      zipEntries([{ name: "../bad.mp3", read: async () => new Uint8Array() }]).next(),
    ).rejects.toThrow("Unsafe");
  });
});
