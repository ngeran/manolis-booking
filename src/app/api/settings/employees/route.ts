import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createEmployee } from "@/lib/auth-actions";

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { username, password, email, fullName, role: newRole } = body;

  if (!username || !password || !email || !fullName) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  try {
    const user = await createEmployee(username, password, email, fullName, newRole);
    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
