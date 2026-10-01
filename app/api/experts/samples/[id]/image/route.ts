import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Minimal typed access to the ExpertSample delegate. The local generated
// Prisma client is stale (production regenerates it at build time), so the
// delegate is reached through this narrow interface.
type SampleRow = {
  image: Buffer | null;
  imageMime: string | null;
  expert: { status: string };
};
type SampleDelegate = {
  findUnique(args: {
    where: { id: string };
    select: { image: true; imageMime: true; expert: { select: { status: true } } };
  }): Promise<SampleRow | null>;
};

// Serves a sample-work image. Only samples belonging to APPROVED profiles
// are publicly reachable.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable." }, { status: 503 });

  const delegate = (db as unknown as { expertSample: SampleDelegate }).expertSample;
  const row = await delegate.findUnique({
    where: { id },
    select: {
      image: true,
      imageMime: true,
      expert: { select: { status: true } },
    },
  });
  if (!row || !row.image || row.expert.status !== "APPROVED") {
    return NextResponse.json({ error: "Sample image not found." }, { status: 404 });
  }

  const data = new Uint8Array(row.image.length);
  data.set(row.image);
  return new Response(data, {
    headers: {
      "Content-Type": row.imageMime ?? "image/jpeg",
      "Content-Length": String(row.image.length),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
