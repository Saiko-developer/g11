/** ZIP STORE streaming: one source file at a time, no hundreds-of-MP3 browser buffer. */
const enc = new TextEncoder();
export function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function header(length: number, values: [number, number, 2 | 4][]) {
  const b = new Uint8Array(length),
    v = new DataView(b.buffer);
  for (const [offset, value, size] of values)
    if (size === 2) v.setUint16(offset, value, true);
    else v.setUint32(offset, value, true);
  return b;
}
export type ZipEntry = { name: string; read: () => Promise<Uint8Array> };
export async function* zipEntries(entries: ZipEntry[]) {
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(entry.name)) throw Error("Unsafe archive filename");
    const name = enc.encode(entry.name),
      data = await entry.read(),
      crc = crc32(data),
      size = data.length;
    const local = header(30, [
      [0, 0x04034b50, 4],
      [4, 20, 2],
      [6, 0x800, 2],
      [10, 0, 2],
      [12, 33, 2],
      [14, crc, 4],
      [18, size, 4],
      [22, size, 4],
      [26, name.length, 2],
    ]);
    const record = header(46, [
      [0, 0x02014b50, 4],
      [4, 20, 2],
      [6, 20, 2],
      [8, 0x800, 2],
      [14, 33, 2],
      [16, crc, 4],
      [20, size, 4],
      [24, size, 4],
      [28, name.length, 2],
      [42, offset, 4],
    ]);
    central.push(record, name);
    offset += local.length + name.length + size;
    yield local;
    yield name;
    yield data;
  }
  const start = offset;
  for (const record of central) {
    yield record;
    offset += record.length;
  }
  yield header(22, [
    [0, 0x06054b50, 4],
    [8, entries.length, 2],
    [10, entries.length, 2],
    [12, offset - start, 4],
    [16, start, 4],
  ]);
}
export function zipStream(entries: ZipEntry[]) {
  const iterator = zipEntries(entries);
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const item = await iterator.next();
        if (item.done) controller.close();
        else controller.enqueue(item.value);
      } catch (e) {
        controller.error(e);
      }
    },
    async cancel() {
      await iterator.return(undefined);
    },
  });
}
