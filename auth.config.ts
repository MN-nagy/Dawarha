import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnReport = nextUrl.pathname.startsWith("/report");

      if (isOnDashboard || isOnReport) {
        if (isLoggedIn) return true;
        return false;
      }

      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
