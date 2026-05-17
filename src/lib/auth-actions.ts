"use server";

import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createEmployee(
  username: string,
  password: string,
  email: string,
  fullName: string,
  role: "admin" | "staff" | "manager" = "staff"
) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing.length) {
    throw new Error("Username already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({ username, passwordHash, email, fullName, role })
    .returning();

  return user;
}

export async function seedInitialAdmin() {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, "admin"))
    .limit(1);

  if (!existing.length) {
    await createEmployee(
      "admin",
      "admin123",
      "admin@manolis.booking",
      "System Admin",
      "admin"
    );
  }
}
