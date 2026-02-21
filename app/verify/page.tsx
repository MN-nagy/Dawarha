import { db } from "@/db/index";
import { Users, VerificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

// 👇 1. Define searchParams as a Promise
export default async function VerifyPage({
	searchParams
}: {
	searchParams: Promise<{ token: string, type: string, id?: string }>
}) {

	// 👇 2. Await the Promise before grabbing the data
	const { token, type, id } = await searchParams;

	if (!token || !type) redirect("/login");

	// 1. Find the token in the database
	const dbToken = await db.select().from(VerificationTokens).where(eq(VerificationTokens.token, token)).limit(1);

	if (dbToken.length === 0 || new Date(dbToken[0].expires) < new Date()) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="max-w-md">
					<CardHeader>
						<CardTitle className="text-red-600 flex items-center gap-2"><XCircle /> Invalid or Expired Link</CardTitle>
					</CardHeader>
					<CardContent>Please request a new verification link.</CardContent>
				</Card>
			</div>
		);
	}

	// 2. Process based on type
	if (type === "email" && id) {
		// Update the user's email
		await db.update(Users).set({ email: dbToken[0].identifier }).where(eq(Users.id, parseInt(id)));
		// Delete the used token
		await db.delete(VerificationTokens).where(eq(VerificationTokens.token, token));

		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="max-w-md">
					<CardHeader>
						<CardTitle className="text-emerald-600 flex items-center gap-2"><CheckCircle /> Email Updated!</CardTitle>
					</CardHeader>
					<CardContent>Your email has been successfully changed. You can now log in with your new email address.</CardContent>
				</Card>
			</div>
		);
	}

	if (type === "password") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="max-w-md">
					<CardHeader><CardTitle>Reset Password</CardTitle></CardHeader>
					<CardContent>Token valid! In a full app, you would enter your new password here.</CardContent>
				</Card>
			</div>
		);
	}

	redirect("/");
}
