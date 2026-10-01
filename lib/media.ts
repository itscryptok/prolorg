// Shared upload validation for AI pro media (photo / intro video).
// Magic-byte sniffing so a renamed .exe/.html can't pass as media.

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

export function sniffMedia(buf: Uint8Array, kind: "photo" | "video"): boolean {
  const sig = (offset: number, bytes: number[]) =>
    bytes.every((b, i) => buf[offset + i] === b);
  if (kind === "photo") {
    return (
      sig(0, [0xff, 0xd8, 0xff]) || // JPEG
      sig(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) || // PNG
      sig(0, [0x47, 0x49, 0x46, 0x38]) || // GIF87a/GIF89a
      (sig(0, [0x52, 0x49, 0x46, 0x46]) && sig(8, [0x57, 0x45, 0x42, 0x50])) || // WebP
      (sig(4, [0x66, 0x74, 0x79, 0x70]) && sig(8, [0x61, 0x76, 0x69, 0x66])) || // AVIF
      sig(0, [0x42, 0x4d]) // BMP
    );
  }
  return (
    sig(4, [0x66, 0x74, 0x79, 0x70]) || // MP4 / MOV / 3GP ("....ftyp")
    sig(0, [0x1a, 0x45, 0xdf, 0xa3]) || // WebM / MKV
    (sig(0, [0x52, 0x49, 0x46, 0x46]) && sig(8, [0x41, 0x56, 0x49, 0x20])) // AVI
  );
}

export async function checkUpload(
  file: File | null,
  kind: "photo" | "video"
): Promise<{ ok: true; file: File } | { ok: false; error: string }> {
  if (!file || file.size === 0) return { ok: false, error: "" }; // not provided
  const max = kind === "photo" ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
  const prefix = kind === "photo" ? "image/" : "video/";
  const label = kind === "photo" ? "image" : "video";
  if (!file.type.startsWith(prefix)) {
    return { ok: false, error: `The ${kind} must be a ${label} file.` };
  }
  if (file.size > max) {
    const mb = Math.round(max / 1024 / 1024);
    return { ok: false, error: `The ${kind} is too large — keep it under ${mb} MB.` };
  }
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!sniffMedia(head, kind)) {
    return {
      ok: false,
      error: `That ${kind} file looks corrupted or isn't a real ${label} — please pick another file.`,
    };
  }
  return { ok: true, file };
}

export type MediaUpsertDelegate = {
  upsert(args: {
    where: { expertId_kind: { expertId: string; kind: string } };
    update: { mime: string; data: Buffer };
    create: { expertId: string; kind: string; mime: string; data: Buffer };
  }): Promise<unknown>;
};
