import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq, or, ilike, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  if (search) {
    const results = await db
      .select()
      .from(customers)
      .where(
        or(
          ilike(customers.firstName, `%${search}%`),
          ilike(customers.lastName, `%${search}%`),
          ilike(customers.phone, `%${search}%`),
          ilike(customers.email, `%${search}%`)
        )
      )
      .limit(20);
    return NextResponse.json(results);
  }

  const all = await db
    .select()
    .from(customers)
    .orderBy(sql`${customers.lastVisit} DESC NULLS LAST`)
    .limit(50);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { firstName, lastName, phone, email, dietaryNotes, birthday, optInMarketing } = body;

  if (!firstName || !lastName || !phone) {
    return NextResponse.json({ error: "First name, last name, and phone are required" }, { status: 400 });
  }

  const phoneRegex = /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json({ error: "Invalid US phone format" }, { status: 400 });
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
  }

  const existing = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  if (existing.length) {
    return NextResponse.json(existing[0]);
  }

  const [customer] = await db
    .insert(customers)
    .values({ firstName, lastName, phone, email, dietaryNotes, birthday, optInMarketing })
    .returning();

  return NextResponse.json(customer, { status: 201 });
}
