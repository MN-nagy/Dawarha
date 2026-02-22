import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getAvailableReports, getUserByEmail, getCompleteUserProfile } from "@/db/actions";
import { ExploreFeed } from "@/components/explore-feed";

export const dynamic = "force-dynamic"; // Ensure fresh data on load

export default async function ExplorePage() {
	const session = await auth();

	if (!session?.user?.email) {
		redirect("/login");
	}

	// 1. Fetch all pending reports globally
	const reports = await getAvailableReports();

	// 2. Fetch the user's role to enforce Smart Locks on the UI
	const dbUser = await getUserByEmail(session.user.email);
	let userRole = "member";
	if (dbUser) {
		const profileData = await getCompleteUserProfile(dbUser.id);
		if (profileData.profile) {
			userRole = profileData.profile.role;
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Header user={session.user} />

			<main className="max-w-7xl mx-auto w-full p-6 md:p-10 grow animate-in fade-in duration-500">
				<div className="mb-8">
					<h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Global Waste Directory</h1>
					<p className="text-gray-500 text-sm">
						Search the entire Dawarha marketplace. Use filters to find specific materials and volumes.
					</p>
				</div>

				<ExploreFeed initialReports={reports || []} userRole={userRole} />
			</main>
		</div>
	);
}
