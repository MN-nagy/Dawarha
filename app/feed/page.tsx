import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getPersonalizedFeed } from "@/db/actions";
import { FeedDashboard } from "@/components/feed-dashboard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MapPin, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic"; // Never cache the live feed

export default async function FeedPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	// Call our new Radar Engine
	const data = await getPersonalizedFeed();

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
			<Header user={session.user} />

			{/* If the backend throws an error (like missing locations), show this interceptor */}
			{data.error ? (
				<main className="grow flex items-center justify-center p-6">
					<div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-emerald-100 text-center space-y-4">
						<div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
							{data.error.includes("locations") ? <MapPin className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
						</div>
						<h2 className="text-2xl font-bold text-gray-900">Radar Offline</h2>
						<p className="text-gray-500 text-sm leading-relaxed">{data.error}</p>
						<div className="pt-4">
							<Link href="/settings">
								<Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-md">
									Configure Radar Settings
								</Button>
							</Link>
						</div>
					</div>
				</main>
			) : (
				/* If everything is good, load the massive Split-Screen UI! */
				<main className="grow flex flex-col h-[calc(100vh-73px)]">
					<FeedDashboard initialReports={data.feed || []} userRole={data.userRole || "member"} />
				</main>
			)}
		</div>
	);
}
