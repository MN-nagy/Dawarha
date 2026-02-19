import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getRecentReports } from "@/db/actions";
import Header from "@/components/Header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Leaf, Target } from "lucide-react";

export default async function DashboardPage() {
	const session = await auth();
	if (!session?.user) {
		redirect("/login");
	}

	const reports = await getRecentReports();
	const user = session.user;

	return (
		<div className="min-h-screen bg-gray-50">
			<Header user={user} />

			<main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">

				{/* Welcome Section */}
				<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
					<h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
					<p className="text-gray-500">Welcome back, {user.name || "Eco-Warrior"}!</p>
				</div>

				{/* Analytics Cards Row */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
					<Card className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<CardTitle className="text-sm font-medium text-gray-600">Total Points</CardTitle>
							<Leaf className="w-4 h-4 text-emerald-600" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-gray-900">0</div>
							<p className="text-xs text-gray-500 mt-1">Earn points by reporting waste!</p>
						</CardContent>
					</Card>

					<Card className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
							<Activity className="w-4 h-4 text-emerald-600" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-gray-900">{reports.length}</div>
							<p className="text-xs text-gray-500 mt-1">Lifetime contributions</p>
						</CardContent>
					</Card>

					<Card className="border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
							<CardTitle className="text-sm font-medium text-gray-600">Impact Level</CardTitle>
							<Target className="w-4 h-4 text-emerald-600" />
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-gray-900">Seedling</div>
							<p className="text-xs text-gray-500 mt-1">Complete 5 reports to level up</p>
						</CardContent>
					</Card>
				</div>

				{/* Full-Width Activity Table */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
					<div className="p-6 border-b border-gray-100">
						<h2 className="font-semibold text-lg text-gray-800">Your Recent Activity</h2>
					</div>

					<Table>
						<TableHeader>
							<TableRow className="bg-gray-50 hover:bg-gray-50">
								<TableHead>Location</TableHead>
								<TableHead>Dominant Type</TableHead>
								<TableHead>Amount</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Date</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{reports.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="text-center py-12 text-gray-500">
										No reports yet. Click "Report Waste" to get started! 🌿
									</TableCell>
								</TableRow>
							) : (
								reports.map((report) => (
									<TableRow key={report.id} className="transition-colors hover:bg-gray-50/50">
										<TableCell className="font-medium text-gray-900">{report.location}</TableCell>
										<TableCell className="capitalize">{report.wasteType}</TableCell>
										<TableCell>{report.amount}</TableCell>
										<TableCell>
											<Badge variant={report.status === "pending" ? "secondary" : "default"}>
												{report.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right text-gray-500 text-sm">
											{new Date(report.createdAt).toLocaleDateString()}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</main>
		</div>
	);
}
