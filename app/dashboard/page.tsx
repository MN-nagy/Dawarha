import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { eq, desc, and } from "drizzle-orm";
import { Users, Reports, UserProfiles, Rewards } from "@/db/schema";
import Header from "@/components/Header";
import { DashboardClient } from "@/components/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	// 1. Identify User and Role
	const [dbUser] = await db.select().from(Users).where(eq(Users.email, session.user.email));
	if (!dbUser) redirect("/login");

	const [profile] = await db.select().from(UserProfiles).where(eq(UserProfiles.userId, dbUser.id));
	const userRole = profile?.role || dbUser.role || "member";

	// 2. Fetch Base Data (EVERYONE gets to see their own reports and rewards)
	const myReports = await db.select().from(Reports)
		.where(eq(Reports.userId, dbUser.id))
		.orderBy(desc(Reports.createdAt));

	const myRewards = await db.select().from(Rewards)
		.where(eq(Rewards.userId, dbUser.id))
		.orderBy(desc(Rewards.createdAt));

	// 3. Fetch Collector Specific Data
	let activeRoutes: typeof myReports = [];
	let completedPickups: typeof myReports = [];

	if (userRole !== "member") {
		activeRoutes = await db.select().from(Reports)
			.where(and(eq(Reports.collectorId, dbUser.id), eq(Reports.status, "in_progress")))
			.orderBy(desc(Reports.createdAt));

		completedPickups = await db.select().from(Reports)
			.where(and(eq(Reports.collectorId, dbUser.id), eq(Reports.status, "collected")))
			.orderBy(desc(Reports.createdAt));
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Header user={session.user} />
			<main className="grow max-w-7xl mx-auto w-full p-4 md:p-8 animate-in fade-in duration-500">

				<div className="mb-8">
					<h1 className="text-3xl font-black text-gray-900 tracking-tight">
						{userRole === "member" ? "My Impact" : "Command Center"}
					</h1>
					<p className="text-gray-500 mt-1">
						Welcome back, <span className="font-semibold text-emerald-700">{dbUser.name}</span>
					</p>
				</div>

				<DashboardClient
					user={dbUser}
					role={userRole}
					myReports={myReports}
					activeRoutes={activeRoutes}
					completedPickups={completedPickups}
					myRewards={myRewards}
				/>

			</main>
		</div>
	);
}
