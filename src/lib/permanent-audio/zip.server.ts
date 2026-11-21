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

export const MAX_AUDIO_BACKUP_BYTES = 34 * 1024 * 1024;

/** Read only the uncompressed ZIP format produced by Audio Manager. */
export function readAudioZip(bytes: Uint8Array) {
  if (bytes.length > MAX_AUDIO_BACKUP_BYTES) throw Error("Backup is too large");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = new Map<string, Uint8Array>();
  let offset = 0;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  while (offset + 4 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    if (offset + 30 > bytes.length || files.size >= 201) throw Error("Invalid ZIP header");
    if (view.getUint16(offset + 6, true) !== 0x800 || view.getUint16(offset + 8, true) !== 0)
      throw Error("Use the original Audio Manager ZIP");
    const size = view.getUint32(offset + 18, true);
    const nameSize = view.getUint16(offset + 26, true);
    const start = offset + 30 + nameSize + view.getUint16(offset + 28, true);
    const end = start + size;
    if (end > bytes.length || size !== view.getUint32(offset + 22, true))
      throw Error("Truncated ZIP entry");
    const name = decoder.decode(bytes.subarray(offset + 30, offset + 30 + nameSize));
    if (!/^[a-zA-Z0-9_.-]+$/.test(name) || files.has(name)) throw Error("Invalid ZIP filename");
    const data = bytes.subarray(start, end);
    if (crc32(data) !== view.getUint32(offset + 14, true)) throw Error("ZIP checksum mismatch");
    files.set(name, data);
    offset = end;
  }
  const directoryStart = offset;
  for (let i = 0; i < files.size; i++) {
    if (offset + 46 > bytes.length || view.getUint32(offset, true) !== 0x02014b50)
      throw Error("Invalid ZIP directory");
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
  if (
    offset + 22 !== bytes.length ||
    view.getUint32(offset, true) !== 0x06054b50 ||
    view.getUint16(offset + 10, true) !== files.size ||
    view.getUint32(offset + 12, true) !== offset - directoryStart ||
    view.getUint32(offset + 16, true) !== directoryStart
  )
    throw Error("Incomplete ZIP backup");
  return files;
}
