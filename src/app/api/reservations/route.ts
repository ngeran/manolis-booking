import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, customers } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq, and, gte, lte, ne, sql } from "drizzle-orm";
import { localDateKey } from "@/lib/date";
import { slotHasCapacity } from "@/lib/booking";

const MAX_COVERS_PER_SLOT = Number(process.env.MAX_COVERS_PER_SLOT) || 40;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = db
    .select({
      id: reservations.id,
      partySize: reservations.partySize,
      reservationDate: reservations.reservationDate,
      reservationTime: reservations.reservationTime,
      status: reservations.status,
      specialRequests: reservations.specialRequests,
      createdAt: reservations.createdAt,
      customerId: reservations.customerId,
      employeeId: reservations.employeeId,
      customerFirstName: customers.firstName,
      customerLastName: customers.lastName,
      customerPhone: customers.phone,
    })
    .from(reservations)
    .innerJoin(customers, eq(reservations.customerId, customers.id));

  const conditions = [];
  if (date) {
    conditions.push(eq(reservations.reservationDate, date));
  } else if (from && to) {
    conditions.push(gte(reservations.reservationDate, from));
    conditions.push(lte(reservations.reservationDate, to));
  }

  if (conditions.length) {
    query = query.where(and(...conditions)) as any;
  }

  const results = await query.orderBy(reservations.reservationDate, reservations.reservationTime);
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { customerId, partySize, reservationDate, reservationTime, employeeId, specialRequests, customerName, customerPhone } = body;

  if (!partySize || partySize < 1 || partySize > 20) {
    return NextResponse.json({ error: "Party size must be between 1 and 20" }, { status: 400 });
  }

  const today = localDateKey();
  if (reservationDate < today) {
    return NextResponse.json({ error: "Cannot book in the past" }, { status: 400 });
  }

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  if (reservationDate > localDateKey(maxDate)) {
    return NextResponse.json({ error: "Max 60 days in advance" }, { status: 400 });
  }

  const timeRegex = /^(1[1-9]|2[0-1]):(00|30):00$/;
  if (!timeRegex.test(reservationTime)) {
    return NextResponse.json({ error: "Time must be 11:00-22:00 in 30-min increments" }, { status: 400 });
  }

  let finalCustomerId = customerId;

  if (!finalCustomerId && customerPhone) {
    const existing = await db.select().from(customers).where(eq(customers.phone, customerPhone)).limit(1);
    if (existing.length) {
      finalCustomerId = existing[0].id;
    } else {
      const parts = (customerName || "Unknown").split(" ");
      try {
        const [created] = await db
          .insert(customers)
          .values({
            firstName: parts[0] || "Unknown",
            lastName: parts.slice(1).join(" ") || "",
            phone: customerPhone,
          })
          .returning();
        finalCustomerId = created.id;
      } catch (err: any) {
        // 23505 = unique violation — another request created this phone mid-flight
        if (err?.code !== "23505") throw err;
        const [existing] = await db.select().from(customers).where(eq(customers.phone, customerPhone)).limit(1);
        if (!existing) throw err;
        finalCustomerId = existing.id;
      }
    }
  }

  if (!finalCustomerId) {
    return NextResponse.json({ error: "Customer ID or phone required" }, { status: 400 });
  }

  try {
    const booked = await db.transaction(async (tx) => {
      // Serialize concurrent bookings for the same slot; the advisory lock is
      // released automatically when the transaction ends
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${reservationDate} || ' ' || ${reservationTime}))`
      );

      const [row] = await tx
        .select({ total: sql<number>`COALESCE(sum(${reservations.partySize}), 0)` })
        .from(reservations)
        .where(
          and(
            eq(reservations.reservationDate, reservationDate),
            eq(reservations.reservationTime, reservationTime),
            ne(reservations.status, "cancelled")
          )
        );

      if (!slotHasCapacity(Number(row?.total ?? 0), partySize, MAX_COVERS_PER_SLOT)) {
        return null;
      }

      const [reservation] = await tx
        .insert(reservations)
        .values({ customerId: finalCustomerId, partySize, reservationDate, reservationTime, employeeId, specialRequests })
        .returning();
      return reservation;
    });

    if (!booked) {
      return NextResponse.json({ error: "Time slot is full — try another time" }, { status: 409 });
    }

    return NextResponse.json(booked, { status: 201 });
  } catch (err: any) {
    // 23505 = unique violation — typically the legacy unique_booking index is
    // still in place because db:push hasn't run against this database yet
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Slot conflict — this date, time, and party size is already booked" },
        { status: 409 }
      );
    }
    console.error("[RESERVATIONS] Booking failed:", err);
    return NextResponse.json({ error: "Booking failed — please try again" }, { status: 500 });
  }
}
