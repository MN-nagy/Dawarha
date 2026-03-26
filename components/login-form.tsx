"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useState, useEffect } from "react";
import { logIn, requestPasswordReset } from "@/db/actions";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [LoginState, loginAction, isLoginPending] = useActionState(logIn, null);
  const [resetState, resetAction, isResetPending] = useActionState(
    async (_prevState: any, formData: FormData) => {
      const email = formData.get("email") as string;
      return await requestPasswordReset(email);
    },
    null
  )
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  useEffect(() => {
    if (resetState) {
      if (resetState.error === "Failed to send reset email.") {
        toast.error("Something went wrong on our end. Please try again later.");
      } else {
        toast.success("If an account exists, a reset link has been sent. Please check your inbox.");
        setIsDialogOpen(false);
      }
    }
  }, [resetState]);


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-xl border-green-100">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* LEFT SIDE: FORM */}
          <form action={loginAction} className="p-6 md:p-8 flex flex-col justify-center gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold text-emerald-700">Welcome Back</h1>
              <p className="text-emerald-600 text-sm">
                Login to your Dawarha account
              </p>
            </div>

            {/* ERROR MESSAGE */}
            {LoginState?.error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-pulse">
                ⚠️ {LoginState.error}
              </div>
            )}

            <div className="grid gap-4">
              {/* EMAIL */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
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

                  {/* -- New Forgot Pass Dialog */}
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="ml-auto text-sm text-emerald-600 underline-offset-2 hover:underline cursor-pointer"
                      >
                        Forgot your password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                          Enter your email address and we will send you a link to securely reset your password.
                        </DialogDescription>
                      </DialogHeader>

                      {/* Form inside the modal */}
                      <form action={resetAction} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="resetEmail" className="sr-only">Email</Label>
                          <Input
                            id="resetEmail"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="focus-visible:ring-green-500"
                          />
                        </div>




                        <Button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                          disabled={isResetPending}
                        >
                          {isResetPending ? "Sending..." : "Send Reset Link"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="focus-visible:ring-green-500"
                />
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-green-700"
                disabled={isLoginPending}
              >
                {isLoginPending ? "Logging in..." : "Login"}
              </Button>
            </div>

            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline underline-offset-4 hover:text-green-600">
                Sign up
              </Link>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-4">
              By clicking continue, you agree to our <a href="/about">Terms</a> and <a href="/about">Privacy Policy</a>.
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
