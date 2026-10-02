import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isLockedOut, recordFailure, clearFailures } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = (credentials.username as string).toLowerCase().trim();

        // Throttle brute-force attempts per account (locked-out users get the
        // same generic error as a wrong password)
        if (isLockedOut(username)) {
          console.warn("[AUTH] Login throttled for:", username);
          return null;
        }

        try {
          const user = await db
            .select()
            .from(users)
            .where(eq(users.username, credentials.username as string))
            .limit(1);

          if (!user.length) {
            recordFailure(username);
            return null;
          }

          const valid = await bcrypt.compare(
            credentials.password as string,
            user[0].passwordHash
          );
          if (!valid) {
            recordFailure(username);
            return null;
          }

          clearFailures(username);

          await db
            .update(users)
            .set({ lastLogin: new Date() })
            .where(eq(users.id, user[0].id));

          return {
            id: user[0].id,
            name: user[0].fullName,
            email: user[0].email,
            role: user[0].role,
          };
        } catch (error) {
          console.error("[AUTH] Login error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
});
