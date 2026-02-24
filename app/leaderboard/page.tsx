import { auth } from "@/auth";
import { db } from "@/db/index";
import { Users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import LeaderboardClient from "@/components/LeaderboardClient";

export const dynamic = "force-dynamic";

type LeaderboardUser = {
	id: number;
	name: string;
	balance: number;
	avatar: string;
	league: 'seedling' | 'sapling' | 'tree';
	globalRank: number;
	leagueRank: number;
};

// Helper to determine league
function getLeague(balance: number): 'seedling' | 'sapling' | 'tree' {
	if (balance >= 5000) return 'tree';
	if (balance >= 1000) return 'sapling';
	return 'seedling';
}

export default async function LeaderboardPage() {
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const [dbUser] = await db.select().from(Users).where(eq(Users.email, session.user.email));
	if (!dbUser) redirect("/login");

	// 1. Fetch ALL users (for MVP this is fine; for scale, use specialized SQL queries)
	const allUsers = await db.select().from(Users).orderBy(desc(Users.balance));

	// 2. Process Data for Members and Collectors
	const processRole = (role: string): LeaderboardUser[] => {
		// Filter by role
		const roleUsers = allUsers.filter(u => u.role === role);

		// Calculate ranks
		return roleUsers.map((user, index) => {
			const league = getLeague(user.balance || 0);

			// Calculate League Rank: Filter users in this league, find index
			const usersInThisLeague = roleUsers.filter(u => getLeague(u.balance || 0) === league);
			const leagueRank = usersInThisLeague.findIndex(u => u.id === user.id) + 1;

			return {
				id: user.id,
				name: user.name,
				balance: user.balance || 0,
				avatar: user.name, // Placeholder for avatar logic
				league: league,
				globalRank: index + 1, // Already sorted by balance
				leagueRank: leagueRank
			};
		});
	};

	const members = processRole("member");
	const collectors = processRole("collector"); // Assuming role is 'collector'
	const companies = processRole("company_collector");

	const data = {
		members,
		collectors,
		companies,
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Header user={session.user} />
			<LeaderboardClient
				data={data}
				currentUserId={dbUser.id}
			/>
		</div>
	);
}
