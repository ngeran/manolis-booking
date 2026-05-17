import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const [customer] = await db.select().from(customers).where(eq(customers.id, params.id)).limit(1);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const [updated] = await db
    .update(customers)
    .set({ ...body, lastVisit: body.lastVisit ? new Date(body.lastVisit) : undefined })
    .where(eq(customers.id, params.id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
