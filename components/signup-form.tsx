"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useEffect } from "react";
import { createUser } from "@/db/actions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction, isPending] = useActionState(createUser, null);
  const router = useRouter();


  useEffect(() => {
    if (state?.success) {
      toast.success("Account Created successfully");
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state, router]);


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden shadow-xl border-emerald-100 w-4xl">
        <CardContent className="grid p-0 md:grid-cols-2">

          {/* LEFT SIDE: FORM */}
          <form action={formAction} className="p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold text-emerald-800">Create Account</h1>
              <p className="text-emerald-600/80 text-sm text-balance">
                Start your recycling journey today
              </p>
            </div>

            {/* MESSAGES */}
            {state?.error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-pulse">
                ⚠️ {state.error}
              </div>
            )}

            {state?.success && (
              <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg text-center">
                ✅ {state.success}
              </div>
            )}

            <div className="grid gap-4">
              {/* Full Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                {/* Standard Placeholder */}
                <Input id="name" name="name" type="text" placeholder="Name" required />
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Email" required />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required />
              </div>

              {/* Confirm Password */}
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Role */}
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>

                <Select name="role" defaultValue="member">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="collector">Collector</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isPending}>
                {isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4 hover:text-emerald-600">
                Sign in
              </Link>
            </div>
          </form>

          {/* RIGHT SIDE: IMAGE */}
          <div className="relative hidden bg-emerald-900 md:block">
            <img
              src="/top_right.png"
              alt="Recycling"
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
