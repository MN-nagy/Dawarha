"use client"; // 👈 Client component for hooks

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Swapped FieldLabel for standard Label (easier)
import { useActionState } from "react";
import { logIn } from "@/db/actions";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // 1. Hook up the Server Action
  const [state, formAction, isPending] = useActionState(logIn, null);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-xl border-green-100">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* LEFT SIDE: FORM */}
          <form action={formAction} className="p-6 md:p-8 flex flex-col justify-center gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold text-emerald-700">Welcome Back</h1>
              <p className="text-emerald-600 text-sm">
                Login to your Dawarha account
              </p>
            </div>

            {/* ERROR MESSAGE */}
            {state?.error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-pulse">
                ⚠️ {state.error}
              </div>
            )}

            <div className="grid gap-4">
              {/* EMAIL */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email" // 👈 CRITICAL: Needed for FormData
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="focus-visible:ring-green-500"
                />
              </div>

              {/* PASSWORD */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="#"
                    className="ml-auto text-sm text-emerald-600 underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password" // 👈 CRITICAL
                  type="password"
                  required
                  className="focus-visible:ring-green-500"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-green-700"
                disabled={isPending}
              >
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </div>

            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline underline-offset-4 hover:text-green-600">
                Sign up
              </Link>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-4">
              By clicking continue, you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
            </div>
          </form>

          {/* RIGHT SIDE: IMAGE */}
          <div className="relative hidden bg-emerald-900 md:block">
            <img
              src="/recycle_login.png"
              alt="Recycling illustration"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
