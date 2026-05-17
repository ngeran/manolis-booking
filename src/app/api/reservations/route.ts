import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reservations, customers } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

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

  const today = new Date().toISOString().split("T")[0];
  if (reservationDate < today) {
    return NextResponse.json({ error: "Cannot book in the past" }, { status: 400 });
  }

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  if (reservationDate > maxDate.toISOString().split("T")[0]) {
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
      const [created] = await db
        .insert(customers)
        .values({
          firstName: parts[0] || "Unknown",
          lastName: parts.slice(1).join(" ") || "",
          phone: customerPhone,
        })
        .returning();
      finalCustomerId = created.id;
    }
  }

  if (!finalCustomerId) {
    return NextResponse.json({ error: "Customer ID or phone required" }, { status: 400 });
  }

  const duplicate = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.reservationDate, reservationDate),
        eq(reservations.reservationTime, reservationTime),
        eq(reservations.partySize, partySize)
      )
    )
    .limit(1);

  if (duplicate.length) {
    return NextResponse.json({ error: "Time slot already booked for this party size" }, { status: 409 });
  }

  const [reservation] = await db
    .insert(reservations)
    .values({ customerId: finalCustomerId, partySize, reservationDate, reservationTime, employeeId, specialRequests })
    .returning();

  return NextResponse.json(reservation, { status: 201 });
}
