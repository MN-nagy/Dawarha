import { auth } from "@/auth";
import { db } from "@/db/index";
import { Users, Rewards } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import RewardsClient from "@/components/RewardsClient";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const [dbUser] = await db.select().from(Users).where(eq(Users.email, session.user.email));
	if (!dbUser) redirect("/login");

	if (dbUser.role === "company_collector") {
		return redirect("/dashboard");
	}

	// Fetch transactions history to show previous redemptions if needed
	const rewardsHistory = await db.select().from(Rewards)
		.where(eq(Rewards.userId, dbUser.id))
		.orderBy(desc(Rewards.createdAt));

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Header user={session.user} />
			<RewardsClient user={dbUser} balance={dbUser.balance || 0} rewardsHistory={rewardsHistory} />
		</div>
	);
}
