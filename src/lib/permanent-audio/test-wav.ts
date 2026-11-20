export function syntheticWav(seconds = 1) {
  const rate = 24000,
    length = rate * seconds,
    b = new Uint8Array(44 + length * 2),
    v = new DataView(b.buffer);
  const tag = (offset: number, s: string) =>
    [...s].forEach((c, i) => (b[offset + i] = c.charCodeAt(0)));
  tag(0, "RIFF");
  tag(8, "WAVE");
  tag(12, "fmt ");
  tag(36, "data");
  v.setUint32(4, b.length - 8, true);
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  v.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++)
    v.setInt16(44 + i * 2, Math.round(Math.sin((i * 2 * Math.PI * 440) / rate) * 3000), true);
  return b;
}
