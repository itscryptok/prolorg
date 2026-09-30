import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Minimal typed access to the ExpertMedia delegate. The local generated
// Prisma client is stale (production regenerates it at build time), so the
// delegate is reached through this narrow interface.
type MediaRow = { mime: string; data: Buffer };
type MediaDelegate = {
  findUnique(args: {
    where: { expertId_kind: { expertId: string; kind: string } };
    select: { mime: true; data: true };
  }): Promise<MediaRow | null>;
};

const KINDS = new Set(["photo", "video"]);

// Serves an AI pro's uploaded photo or intro video binary.
// Supports single-range requests so <video> can seek.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ expertId: string; kind: string }> }
) {
  const { expertId, kind } = await params;
  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "Unknown media kind." }, { status: 404 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const delegate = (db as unknown as { expertMedia: MediaDelegate }).expertMedia;
  const row = await delegate.findUnique({
    where: { expertId_kind: { expertId, kind: kind.toUpperCase() } },
    select: { mime: true, data: true },
  });
  if (!row) return NextResponse.json({ error: "Media not found." }, { status: 404 });

  const total = row.data.length;
  const headers: Record<string, string> = {
    "Content-Type": row.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=86400",
  };

  const range = req.headers.get("range");
  if (range) {
    const m = /^bytes=(\d+)-(\d*)$/.exec(range.trim());
    if (m) {
      const start = Math.min(parseInt(m[1], 10), total - 1);
      const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
      if (start <= end) {
        headers["Content-Range"] = `bytes ${start}-${end}/${total}`;
        headers["Content-Length"] = String(end - start + 1);
        const slice = new Uint8Array(end - start + 1);
        slice.set(row.data.subarray(start, end + 1));
        return new Response(slice, { status: 206, headers });
      }
    }
  }

  headers["Content-Length"] = String(total);
  const full = new Uint8Array(total);
  full.set(row.data);
  return new Response(full, { headers });
}
