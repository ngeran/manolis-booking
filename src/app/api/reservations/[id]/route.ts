import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";

const VALID_STATUSES = ["confirmed", "seated", "cancelled", "no_show"];

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  // Whitelist editable fields — never pass the request body straight to the DB
  const updates: Partial<typeof reservations.$inferInsert> = {};
  if (body.partySize !== undefined) {
    if (!Number.isInteger(body.partySize) || body.partySize < 1 || body.partySize > 20) {
      return NextResponse.json({ error: "Party size must be between 1 and 20" }, { status: 400 });
    }
    updates.partySize = body.partySize;
  }
  if (body.reservationTime !== undefined) {
    if (!/^(1[1-9]|2[0-1]):(00|30):00$/.test(body.reservationTime)) {
      return NextResponse.json({ error: "Time must be 11:00-22:00 in 30-min increments" }, { status: 400 });
    }
    updates.reservationTime = body.reservationTime;
  }
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.specialRequests !== undefined) {
    updates.specialRequests = body.specialRequests;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(reservations)
    .set(updates)
    .where(eq(reservations.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const [updated] = await db
    .update(reservations)
    .set({ status: "cancelled" })
    .where(eq(reservations.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
