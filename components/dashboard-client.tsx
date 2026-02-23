"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Leaf, Target, Truck, ShieldCheck, MapPin, CheckCircle, Loader2, Factory, Zap, Navigation, PieChart as PieChartIcon, Cloud, Activity } from "lucide-react";
import { completeWastePickup } from "@/db/actions";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";

// Beautiful color palette for the Donut Chart
const COLORS = {
	plastic: "#10b981", // Emerald
	metal: "#6366f1",   // Indigo
	glass: "#3b82f6",   // Blue
	paper: "#f59e0b",   // Amber
	organic: "#84cc16", // Lime
	other: "#94a3b8"    // Slate
};

export function DashboardClient({
	user, role, myReports, activeRoutes, completedPickups, myRewards
}: {
	user: any; role: string; myReports: any[]; activeRoutes: any[]; completedPickups: any[]; myRewards: any[];
}) {
	const [completingId, setCompletingId] = useState<number | null>(null);

	const isMember = role === "member";
	const isSolo = role === "individual_collector";
	const isCompany = role === "company_collector";

	const handleCompleteJob = async (reportId: number) => {
		setCompletingId(reportId);
		const result = await completeWastePickup(reportId);
		if (result.success) {
			toast.success("Job Completed!", { description: "The waste has been collected and points have been awarded." });
		} else {
			toast.error("Failed", { description: result.error });
		}
		setCompletingId(null);
	};

	// --- Gamification Logic ---
	const getMemberRank = (points: number) => {
		if (points >= 500) return { title: "Earth Champion", color: "bg-emerald-500 text-white" };
		if (points >= 150) return { title: "Forest Guardian", color: "bg-green-400 text-white" };
		if (points >= 50) return { title: "Planter", color: "bg-lime-500 text-white" };
		return { title: "Seedling", color: "bg-gray-200 text-gray-700" };
	};

	const getSoloRank = (jobs: number) => {
		if (jobs >= 50) return { title: "Fleet Captain", color: "bg-indigo-600 text-white" };
		if (jobs >= 10) return { title: "Route Master", color: "bg-blue-500 text-white" };
		return { title: "Scrapper", color: "bg-gray-200 text-gray-700" };
	};

	const getCompanyTier = (jobs: number) => {
		if (jobs >= 100) return { title: "Platinum Impact Hub", color: "bg-slate-800 text-slate-100" };
		if (jobs >= 25) return { title: "Gold Sustainability Partner", color: "bg-amber-400 text-amber-900" };
		return { title: "Registered Partner", color: "bg-gray-200 text-gray-700" };
	};

	const calculateCO2 = (pickups: any[]) => {
		let totalKg = 0;
		pickups.forEach(p => {
			let num = parseFloat((p.totalWasteAmount || "0").replace(/[^0-9.]/g, ''));
			if ((p.totalWasteAmount || "").toLowerCase().includes('ton')) num *= 1000;
			if (!isNaN(num)) totalKg += num;
		});
		return Math.floor(totalKg * 1.5);
	};

	// --- CHART DATA GENERATION ---
	const { activityData, pointsData, pieData, co2Data } = useMemo(() => {
		// Setup Base Timelines (Last 7 Days)
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - (6 - i));
			return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		});

		const activityMap = last7Days.map(date => ({ date, reported: 0, collected: 0 }));
		const pointsMap = last7Days.map(date => ({ date, earned: 0, spent: 0 }));
		const co2Map = last7Days.map(date => ({ date, co2Saved: 0 }));
		const materialMap = new Map<string, number>();

		// Fill Data for Members / Solo
		myReports.forEach(r => {
			const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			const day = activityMap.find(x => x.date === date);
			if (day) day.reported += 1;
		});

		myRewards.forEach(r => {
			const date = new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			const day = pointsMap.find(x => x.date === date);
			if (day) {
				if (r.points > 0) day.earned += r.points;
				else day.spent += Math.abs(r.points);
			}
		});

		// Fill Data for Pickups (Activity, Donut, and CO2)
		completedPickups.forEach(p => {
			const date = new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

			// Activity Line
			const actDay = activityMap.find(x => x.date === date);
			if (actDay) actDay.collected += 1;

			// CO2 Line (1kg waste = 1.5kg CO2 roughly)
			const co2Day = co2Map.find(x => x.date === date);
			let num = parseFloat((p.totalWasteAmount || "0").replace(/[^0-9.]/g, ''));
			if ((p.totalWasteAmount || "").toLowerCase().includes('ton')) num *= 1000;
			if (!isNaN(num)) {
				if (co2Day) co2Day.co2Saved += Math.floor(num * 1.5);
			}

			// Material Donut
			const type = p.wasteType.toLowerCase();
			materialMap.set(type, (materialMap.get(type) || 0) + 1);
		});

		const formattedPie = Array.from(materialMap.entries()).map(([name, value]) => ({ name, value }));

		return { activityData: activityMap, pointsData: pointsMap, pieData: formattedPie, co2Data: co2Map };
	}, [myReports, completedPickups, myRewards]);


	return (
		<div className="space-y-8">

			{/* --- TOP METRICS ROW --- */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">
							{isMember ? "Total Balance" : isCompany ? "ESG Impact" : "Total Earnings"}
						</CardTitle>
						{isMember ? <Leaf className="w-4 h-4 text-emerald-600" /> : isCompany ? <Factory className="w-4 h-4 text-indigo-600" /> : <Zap className="w-4 h-4 text-amber-500" />}
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-black text-gray-900">
							{isMember ? (
								<>{user.balance} <span className="text-sm font-medium text-gray-500">pts</span></>
							) : isCompany ? (
								<>{calculateCO2(completedPickups)} <span className="text-sm font-medium text-gray-500">kg CO₂ Saved</span></>
							) : (
								<>{user.balance} <span className="text-sm font-medium text-gray-500">pts</span></>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider">
							{isMember ? "Lifetime Reports" : "Completed Routes"}
						</CardTitle>
						<Target className="w-4 h-4 text-emerald-600" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-black text-gray-900">
							{isMember ? myReports.length : completedPickups.length}
						</div>
					</CardContent>
				</Card>

				<Card className={`shadow-sm border-0 ${isCompany ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'}`}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className={`text-sm font-bold uppercase tracking-wider ${isCompany ? 'text-slate-400' : 'text-emerald-800'}`}>
							{isCompany ? "Certification Tier" : "Current League"}
						</CardTitle>
						<ShieldCheck className={`w-5 h-5 ${isCompany ? 'text-slate-300' : 'text-emerald-600'}`} />
					</CardHeader>
					<CardContent>
						<div className="mt-1">
							{isMember && <Badge className={`text-sm px-3 py-1 ${getMemberRank(user.balance).color}`}>{getMemberRank(user.balance).title}</Badge>}
							{isSolo && <Badge className={`text-sm px-3 py-1 ${getSoloRank(completedPickups.length).color}`}>{getSoloRank(completedPickups.length).title}</Badge>}
							{isCompany && <Badge className={`text-sm px-3 py-1 ${getCompanyTier(completedPickups.length).color}`}>{getCompanyTier(completedPickups.length).title}</Badge>}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* --- CHARTS ROW (DYNAMIC RENDER BASED ON ROLE) --- */}
			{isCompany ? (
				// COMPANY VIEW: Material Donut + CO2 Timeline
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Donut Pie Chart */}
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
								<PieChartIcon className="w-4 h-4 text-indigo-600" /> Material Composition
							</CardTitle>
							<CardDescription>Breakdown of recycled materials.</CardDescription>
						</CardHeader>
						<CardContent>
							{pieData.length === 0 ? (
								<div className="h-[250px] flex items-center justify-center text-gray-400 text-sm font-medium">No material data yet.</div>
							) : (
								<div className="h-[250px] w-full flex items-center">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
												{pieData.map((entry, index) => (
													<Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || COLORS.other} />
												))}
											</Pie>
											<RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', textTransform: 'capitalize' }} />
										</PieChart>
									</ResponsiveContainer>
									<div className="flex flex-col gap-2 ml-4">
										{pieData.map((entry, index) => (
											<div key={index} className="flex items-center gap-2 text-sm text-gray-600 capitalize">
												<div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] || COLORS.other }} />
												<span className="font-semibold">{entry.name}</span>
												<span className="text-gray-400">({entry.value})</span>
											</div>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* CO2 Savings Line Chart */}
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
								<Cloud className="w-4 h-4 text-emerald-600" /> ESG CO₂ Offset
							</CardTitle>
							<CardDescription>Estimated kg of CO₂ saved per day.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[250px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={co2Data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
										<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
										<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
										<RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
										<Line type="monotone" name="kg CO₂ Saved" dataKey="co2Saved" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					{/* Collection Velocity Line Chart */}
					<Card className="shadow-sm lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-base font-bold text-gray-800 flex items-center gap-2">
								<Activity className="w-4 h-4 text-blue-600" /> Collection Velocity
							</CardTitle>
							<CardDescription>Number of pickups completed over the last 7 days.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[250px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
										<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
										<YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
										<RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
										<Line type="monotone" name="Pickups Collected" dataKey="collected" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</div>
			) : (
				// MEMBER / SOLO VIEW: Points + Activity Timelines
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="text-base font-bold text-gray-800">Points & Rewards</CardTitle>
							<CardDescription>Your points gained and spent over the last 7 days.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[250px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={pointsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
										<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
										<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
										<RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
										<Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
										<Line type="monotone" name="Points Earned" dataKey="earned" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					<Card className="shadow-sm">
						<CardHeader>
							<CardTitle className="text-base font-bold text-gray-800">Platform Activity</CardTitle>
							<CardDescription>{isMember ? "Waste reports you submitted." : "Your reports and collections."}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="h-[250px] w-full">
								<ResponsiveContainer width="100%" height="100%">
									<LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
										<XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
										<YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
										<RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
										<Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
										<Line type="monotone" name="Reports Made" dataKey="reported" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
										{!isMember && (
											<Line type="monotone" name="Pickups Collected" dataKey="collected" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
										)}
									</LineChart>
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* --- MAIN DASHBOARD TABLE --- */}
			<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
				<div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
					<h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
						{isMember ? "My Request History" : "Active Logistics Routes"}
					</h2>
					{!isMember && (
						<Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
							{activeRoutes.length} Pending Pickups
						</Badge>
					)}
				</div>

				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow className="bg-white hover:bg-white">
								<TableHead className="font-bold">Location</TableHead>
								<TableHead className="font-bold">Payload</TableHead>
								<TableHead className="font-bold">Status</TableHead>
								<TableHead className="text-right font-bold">{isMember ? "Date" : "Action"}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{/* IF MEMBER */}
							{isMember && myReports.length === 0 && (
								<TableRow><TableCell colSpan={4} className="text-center py-12 text-gray-500">No reports yet. Click "Report Waste" to get started! 🌿</TableCell></TableRow>
							)}
							{isMember && myReports.map((report) => (
								<TableRow key={report.id}>
									<TableCell className="font-medium text-gray-900 max-w-[200px] truncate"><MapPin className="inline w-3 h-3 mr-1 text-gray-400" />{report.location}</TableCell>
									<TableCell><span className="capitalize font-semibold text-emerald-700">{report.wasteType}</span> <span className="text-xs text-gray-500 ml-1">({report.totalWasteAmount})</span></TableCell>
									<TableCell>
										<Badge variant="outline" className={`
                                            ${report.status === 'pending' ? 'bg-gray-100 text-gray-600' : ''}
                                            ${report.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                            ${report.status === 'collected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                        `}>
											{report.status.replace('_', ' ')}
										</Badge>
									</TableCell>
									<TableCell className="text-right text-gray-500 text-sm">{new Date(report.createdAt).toLocaleDateString()}</TableCell>
								</TableRow>
							))}

							{/* IF COLLECTOR */}
							{!isMember && activeRoutes.length === 0 && (
								<TableRow><TableCell colSpan={4} className="text-center py-12 text-gray-500">You have no active routes. Go to the Radar or Explore page to claim jobs!</TableCell></TableRow>
							)}
							{!isMember && activeRoutes.map((route) => (
								<TableRow key={route.id} className="bg-blue-50/30">
									<TableCell className="font-medium text-gray-900 max-w-[250px]"><div className="line-clamp-2 leading-snug"><MapPin className="inline w-3.5 h-3.5 mr-1 text-blue-500" />{route.location}</div></TableCell>
									<TableCell><span className="capitalize font-bold text-gray-800">{route.wasteType}</span> <br /><span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-0.5"><Truck className="w-3 h-3" /> {route.totalWasteAmount}</span></TableCell>
									<TableCell><Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 shadow-none">En Route</Badge></TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${route.latitude},${route.longitude}`, "_blank")}
												className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm transition-transform active:scale-95"
											>
												<Navigation className="w-3.5 h-3.5 mr-1.5" /> Navigate
											</Button>

											<Button
												size="sm"
												onClick={() => handleCompleteJob(route.id)}
												disabled={completingId === route.id}
												className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm transition-transform active:scale-95"
											>
												{completingId === route.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1.5" /> Complete Job</>}
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>

		</div>
	);
}
