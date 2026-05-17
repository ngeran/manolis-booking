import { NextResponse } from "next/server";
import { db } from "@/db";
import { reservations } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq, gte, lte, and, sql } from "drizzle-orm";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const todayCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(reservations)
    .where(eq(reservations.reservationDate, today));

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(reservations)
    .where(
      and(
        gte(reservations.reservationDate, weekStart.toISOString().split("T")[0]),
        lte(reservations.reservationDate, weekEnd.toISOString().split("T")[0])
      )
    );

  const todayByStatus = await db
    .select({
      status: reservations.status,
      count: sql<number>`count(*)`,
    })
    .from(reservations)
    .where(eq(reservations.reservationDate, today))
    .groupBy(reservations.status);

  const todayGuests = await db
    .select({ total: sql<number>`COALESCE(sum(party_size), 0)` })
    .from(reservations)
    .where(and(eq(reservations.reservationDate, today), eq(reservations.status, "confirmed")));

  return NextResponse.json({
    todayReservations: Number(todayCount[0]?.count ?? 0),
    weekReservations: Number(weekCount[0]?.count ?? 0),
    todayGuests: Number(todayGuests[0]?.total ?? 0),
    todayByStatus: todayByStatus.reduce(
      (acc, row) => ({ ...acc, [row.status]: Number(row.count) }),
      {} as Record<string, number>
    ),
  });
}
