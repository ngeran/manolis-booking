import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";

export const dynamic = "force-dynamic";
import { campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = await db.select().from(campaigns).orderBy(campaigns.startDate);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, startDate, endDate, discountPercent } = body;

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "Name, start date, and end date required" }, { status: 400 });
  }

  const [campaign] = await db
    .insert(campaigns)
    .values({ name, description, startDate, endDate, discountPercent })
    .returning();

  return NextResponse.json(campaign, { status: 201 });
}
