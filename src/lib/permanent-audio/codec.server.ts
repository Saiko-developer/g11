import { Mp3Encoder } from "@breezystack/lamejs";
export function pcm16Wav(bytes: Uint8Array) {
  if (bytes.length < 44 || bytes.length > 32 * 1024 * 1024) throw Error("Invalid WAV size");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (i: number) => String.fromCharCode(...bytes.subarray(i, i + 4));
  if (tag(0) !== "RIFF" || tag(8) !== "WAVE") throw Error("Expected real RIFF/WAVE audio");
  let channels = 0,
    rate = 0,
    bits = 0,
    format = 0,
    data: Uint8Array | undefined;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const size = view.getUint32(offset + 4, true),
      end = offset + 8 + size;
    if (end > bytes.length) throw Error("Truncated WAV chunk");
    if (tag(offset) === "fmt ") {
      if (size < 16) throw Error("Invalid WAV format");
      format = view.getUint16(offset + 8, true);
      channels = view.getUint16(offset + 10, true);
      rate = view.getUint32(offset + 12, true);
      bits = view.getUint16(offset + 22, true);
    }
    if (tag(offset) === "data") data = bytes.subarray(offset + 8, end);
    offset = end + (size % 2);
  }
  if (
    format !== 1 ||
    bits !== 16 ||
    ![1, 2].includes(channels) ||
    ![16000, 22050, 24000, 32000, 44100, 48000].includes(rate) ||
    !data?.length ||
    data.length % (channels * 2)
  )
    throw Error("Only complete PCM16 mono/stereo WAV is supported");
  const input = new DataView(data.buffer, data.byteOffset, data.byteLength),
    pcm = new Int16Array(data.length / (2 * channels));
  for (let i = 0; i < pcm.length; i++)
    pcm[i] =
      channels === 1
        ? input.getInt16(i * 2, true)
        : Math.round((input.getInt16(i * 4, true) + input.getInt16(i * 4 + 2, true)) / 2);
  return { pcm, rate, duration: pcm.length / rate };
}
/** Inspect complete Layer III frames, not a renamed WAV or a single sync byte. */
export function inspectMp3(bytes: Uint8Array) {
  let offset = 0,
    frames = 0,
    duration = 0;
  if (bytes.length < 100 || bytes.length > 8 * 1024 * 1024) throw Error("Invalid MP3 size");
  if (String.fromCharCode(...bytes.subarray(0, 3)) === "ID3") {
    if (bytes.subarray(6, 10).some((x) => x > 127)) throw Error("Invalid ID3 header");
    offset =
      10 +
      ((bytes[6] << 21) | (bytes[7] << 14) | (bytes[8] << 7) | bytes[9]) +
      (bytes[5] & 16 ? 10 : 0);
  }
  while (offset < bytes.length) {
    if (offset + 4 > bytes.length || bytes[offset] !== 255 || (bytes[offset + 1] & 224) !== 224)
      throw Error("Malformed MP3 frame");
    const version = (bytes[offset + 1] >> 3) & 3,
      layer = (bytes[offset + 1] >> 1) & 3,
      index = (bytes[offset + 2] >> 4) & 15,
      sample = (bytes[offset + 2] >> 2) & 3,
      pad = (bytes[offset + 2] >> 1) & 1;
    if (version === 1 || layer !== 1 || index === 0 || index === 15 || sample === 3)
      throw Error("Unsupported MP3 frame");
    const rates =
      version === 3
        ? [44100, 48000, 32000]
        : version === 2
          ? [22050, 24000, 16000]
          : [11025, 12000, 8000];
    const bitrates =
      version === 3
        ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
        : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];
    const size =
      Math.floor(((version === 3 ? 144000 : 72000) * bitrates[index]) / rates[sample]) + pad;
    if (offset + size > bytes.length) throw Error("Truncated MP3 frame");
    duration += (version === 3 ? 1152 : 576) / rates[sample];
    frames++;
    offset += size;
  }
  if (frames < 2 || !Number.isFinite(duration)) throw Error("Empty MP3");
  return { duration, frames, bytes: bytes.length };
}
export function wavToMp3(bytes: Uint8Array) {
  const source = pcm16Wav(bytes),
    encoder = new Mp3Encoder(1, source.rate, 64),
    parts: Uint8Array[] = [];
  for (let i = 0; i < source.pcm.length; i += 1152)
    parts.push(new Uint8Array(encoder.encodeBuffer(source.pcm.subarray(i, i + 1152))));
  parts.push(new Uint8Array(encoder.flush()));
  const output = new Uint8Array(parts.reduce((n, b) => n + b.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  const result = inspectMp3(output);
  if (Math.abs(result.duration - source.duration) > 0.3) throw Error("MP3 duration mismatch");
  return { bytes: output, duration: source.duration };
}
