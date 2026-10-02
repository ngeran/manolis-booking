import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, reservations } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq, sql } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, params.id)).limit(1);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();

  // Whitelist editable fields — never pass the request body straight to the DB
  const updates: Partial<typeof customers.$inferInsert> = {};
  if (body.firstName !== undefined) updates.firstName = body.firstName;
  if (body.lastName !== undefined) updates.lastName = body.lastName;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.email !== undefined) updates.email = body.email || null;
  if (body.dietaryNotes !== undefined) updates.dietaryNotes = body.dietaryNotes || null;
  if (body.birthday !== undefined) updates.birthday = body.birthday || null;
  if (body.optInMarketing !== undefined) updates.optInMarketing = body.optInMarketing;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(customers)
    .set(updates)
    .where(eq(customers.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Reservations cascade-delete with their customer — refuse to wipe history
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reservations)
    .where(eq(reservations.customerId, params.id));

  const reservationCount = Number(row?.count ?? 0);
  if (reservationCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this customer has ${reservationCount} reservation${reservationCount === 1 ? "" : "s"} on record` },
      { status: 409 }
    );
  }

  const [deleted] = await db
    .delete(customers)
    .where(eq(customers.id, params.id))
    .returning({ id: customers.id });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
