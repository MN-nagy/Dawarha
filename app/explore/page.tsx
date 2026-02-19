import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getAvailableReports } from "@/db/actions";
import { ExploreFeed } from "@/components/explore-feed"; // 👈 Updated import

export default async function ExplorePage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const reports = await getAvailableReports();

	return (
		<div className="min-h-screen bg-gray-50">
			<Header user={session.user} />

			<main className="max-w-7xl mx-auto p-6 md:p-10 mt-4 animate-in fade-in duration-500">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Available Waste</h1>
					<p className="text-gray-500">
						Search the global marketplace. Use filters to find exact materials, scales, and locations.
					</p>
				</div>

				<ExploreFeed initialReports={reports} />
			</main>
		</div>
	);
}
