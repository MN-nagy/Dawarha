import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import Credentials from "next-auth/providers/credentials";
import { Users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "hello@example.com",
        },
        password: { label: "Password", type: "password" },
      },

      authorize: async (credentials) => {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const [user] = await db
          .select()
          .from(Users)
          .where(eq(Users.email, email))
          .limit(1);

        if (!user) return null;
        if (!user.password) return null;

        const passMatch = await bcrypt.compare(password, user.password);

        if (passMatch) {
          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        console.log("Invalid Credentials");
        return null;
      },
    }),
  ],
});
