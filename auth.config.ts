import { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // 1. Pass the role from the database user object to the JWT token
    async jwt({ token, user }) {
      if (user) {
        // @ts-ignore - NextAuth types don't know about our custom 'role' field by default
        token.role = user.role;
      }
      return token;
    },
    // 2. Pass the role from the JWT token to the active browser session object
    async session({ session, token }) {
      if (session.user && token.role) {
        // @ts-ignore
        session.user.role = token.role as string;
      }
      return session;
    },

    // 3. Your existing route protection logic
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnReport = nextUrl.pathname.startsWith("/report");
      const isOnFeed = nextUrl.pathname.startsWith("/feed");

      // If they are on a protected route and NOT logged in, kick them out
      if (isOnDashboard || isOnReport || isOnFeed) {
        if (isLoggedIn) return true;
        return false;
      }

      // If they are logged in and try to go to the login page, redirect to home
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
