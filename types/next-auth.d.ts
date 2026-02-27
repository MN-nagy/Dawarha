import NextAuth, { type DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// 1. Extend the built-in session and user types
declare module "next-auth" {
  interface Session {
    user: {
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

// 2. Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    role: string;
  }
}
