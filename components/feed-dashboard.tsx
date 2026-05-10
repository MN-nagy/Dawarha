"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Weight, Truck, User, Navigation, Radar, Search, Filter, ArrowUpDown, MapPin } from "lucide-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { claimWasteReport } from "@/db/actions";

const FeedMap = dynamic(() => import("./feed-map"), {
	ssr: false,
	loading: () => <div className="w-full h-full bg-blue-50/50 animate-pulse flex flex-col items-center justify-center text-emerald-600"><Radar className="w-12 h-12 mb-4 animate-spin-slow" /><p className="font-bold">Initializing Radar...</p></div>
});

const parseWeight = (str: string) => {
	if (!str) return 0;
	let num = parseFloat(str.replace(/[^0-9.]/g, ''));
	if (str.toLowerCase().includes('ton')) num *= 1000;
	return isNaN(num) ? 0 : num;
};

export function FeedDashboard({ initialReports, userRole }: { initialReports: any[], userRole: string }) {
	const [activeReportId, setActiveReportId] = useState<number | null>(null);

	// Tactical Filter States
	const [searchQuery, setSearchQuery] = useState("");
	const [materialFilter, setMaterialFilter] = useState("all");
	const [sortBy, setSortBy] = useState("distance");

	// Search Autocomplete States
	const [showSuggestions, setShowSuggestions] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	// Claim States
	const [claimingId, setClaimingId] = useState<number | null>(null);
	const [claimedReportIds, setClaimedReportsIds] = useState<number[]>([]);


	// Close suggestions if clicking outside the search box
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const availableMaterials = useMemo(() => {
		const materials = new Set(initialReports.map(r => r.wasteType));
		return Array.from(materials);
	}, [initialReports]);

	// Extract unique city names ONLY for the currently filtered materials
	const availableLocations = useMemo(() => {
		const locationsMap = new Map<string, number>();

		// 1. Only look at reports that match the current Material dropdown
		const relevantReports = initialReports.filter(report =>
			materialFilter === "all" || report.wasteType === materialFilter
		);

		// 2. Extract and count the locations
		relevantReports.forEach(report => {
			if (!report.location) return;
			const parts = report.location.split(',').map((p: string) => p.trim());

			parts.forEach((part: string) => {
				if (part.length > 2 && isNaN(Number(part))) {
					locationsMap.set(part, (locationsMap.get(part) || 0) + 1);
				}
			});
		});

		return Array.from(locationsMap.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count);
	}, [initialReports, materialFilter]);

	// Filter the suggestions based on what the user is typing 
	const filteredSuggestions = useMemo(() => {
		if (!searchQuery) return [];
		const lowerQuery = searchQuery.toLowerCase();
		return availableLocations
			.filter(loc => loc.name.toLowerCase().includes(lowerQuery) && loc.name.toLowerCase() !== lowerQuery)
			.slice(0, 5); // Show max 5 suggestions
	}, [searchQuery, availableLocations]);


	const displayReports = useMemo(() => {
		let filtered = initialReports.filter(report => {
			if (claimedReportIds.includes(report.id)) return false;
			const searchLower = searchQuery.toLowerCase();
			const matchesSearch = report.location?.toLowerCase().includes(searchLower) ||
				report.additionalWaste?.toLowerCase().includes(searchLower);
			const matchesMaterial = materialFilter === "all" || report.wasteType === materialFilter;
			return matchesSearch && matchesMaterial;
		});

		filtered.sort((a, b) => {
			if (sortBy === "distance") return a.distance - b.distance;
			if (sortBy === "heaviest") return parseWeight(b.totalWasteAmount) - parseWeight(a.totalWasteAmount);
			if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			return 0;
		});

		return filtered;
	}, [initialReports, searchQuery, materialFilter, sortBy]);


	const handleClaim = async (reportId: number) => {
		setClaimingId(reportId);
		const result = await claimWasteReport(reportId);

		if (result.success) {
			toast.success("Route Secured!", {
				description: "This pickup has been added to your Active Routes."
			});
			setClaimedReportsIds(prev => [...prev, reportId]);
		} else {
			toast.error("Claim Failed", { description: result.error });
		}
		setClaimingId(null);
	};


	return (
		<div className="flex w-full h-full overflow-hidden bg-white">

			{/* LEFT SIDEBAR */}
			<div className="w-full lg:w-112.5 xl:w-125 h-full flex flex-col border-r border-gray-200 bg-gray-50/50 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0">

				{/* Dashboard Header */}
				<div className="p-5 bg-white border-b border-gray-100 z-20 shrink-0">
					<div className="flex items-center justify-between mb-1">
						<div className="flex items-center gap-2">
							<Radar className="w-6 h-6 text-emerald-600" />
							<h1 className="text-xl font-black text-gray-900 tracking-tight">Live Radar</h1>
						</div>
						<Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
							{initialReports.length} Signals
						</Badge>
					</div>

					{/* TACTICAL CONTROLS */}
					<div className="mt-4 space-y-3">

						{/* 👇 NEW: Smart Search Bar with Autocomplete 👇 */}
						<div className="relative" ref={searchContainerRef}>
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
							<Input
								placeholder="Search city, neighborhood, or keywords..."
								value={searchQuery}
								onChange={(e) => {
									setSearchQuery(e.target.value);
									setShowSuggestions(true);
								}}
								onFocus={() => setShowSuggestions(true)}
								className="pl-9 bg-gray-50 border-gray-200 h-9 text-sm focus-visible:ring-emerald-500"
							/>

							{/* Floating Suggestions Menu */}
							{showSuggestions && filteredSuggestions.length > 0 && (
								<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden">
									{filteredSuggestions.map((suggestion) => (
										<button
											key={suggestion.name}
											type="button"
											// Using onMouseDown instead of onClick prevents the Input blur event from closing the menu too early
											onMouseDown={(e) => {
												e.preventDefault();
												setSearchQuery(suggestion.name);
												setShowSuggestions(false);
											}}
											className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex justify-between items-center transition-colors"
										>
											<span className="flex items-center gap-2">
												<MapPin className="w-3.5 h-3.5 text-emerald-500" />
												{suggestion.name}
											</span>
											<span className="text-xs text-gray-400 font-medium">({suggestion.count})</span>
										</button>
									))}
								</div>
							)}
						</div>

						{/* Dropdown Filters */}
						<div className="flex gap-2">
							<Select value={materialFilter} onValueChange={setMaterialFilter}>
								<SelectTrigger className="h-8 text-xs bg-white border-gray-200">
									<Filter className="w-3 h-3 mr-2 text-gray-400" />
									<SelectValue placeholder="Material" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Materials</SelectItem>
									{availableMaterials.map(mat => (
										<SelectItem key={mat} value={mat} className="capitalize">{mat}</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select value={sortBy} onValueChange={setSortBy}>
								<SelectTrigger className="h-8 text-xs bg-white border-gray-200">
									<ArrowUpDown className="w-3 h-3 mr-2 text-gray-400" />
									<SelectValue placeholder="Sort by" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="distance">Closest First</SelectItem>
									<SelectItem value="heaviest">Heaviest First</SelectItem>
									<SelectItem value="newest">Newest First</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>

				{/* The Scrollable Cards */}
				<div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
					{displayReports.length === 0 ? (
						<div className="text-center py-20 text-gray-500 px-4">
							<Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
							<p className="font-semibold text-gray-700">No signals match your filters.</p>
							<p className="text-xs mt-1">Try adjusting your search or clearing the material filter.</p>
						</div>
					) : (
						displayReports.map((report) => (
							<Card
								key={report.id}
								onMouseEnter={() => setActiveReportId(report.id)}
								onMouseLeave={() => setActiveReportId(null)}
								className={`overflow-hidden transition-all duration-200 cursor-pointer border-2 ${activeReportId === report.id ? "border-emerald-500 shadow-md bg-emerald-50/30 transform scale-[1.01]" : "border-transparent shadow-sm hover:border-emerald-200 bg-white"}`}
							>
								<div className="flex h-32">
									<div className="w-1/3 bg-gray-100 relative shrink-0">
										<img src={report.imageUrl} alt="Waste" className="w-full h-full object-cover" />
										<div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-black text-emerald-800 shadow-sm flex items-center gap-1">
											<Navigation className="w-3 h-3" />
											{report.distance.toFixed(1)} km
										</div>
									</div>

									<div className="w-2/3 p-3 flex flex-col justify-between">
										<div>
											<div className="flex justify-between items-start mb-1">
												<Badge className="capitalize bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 shadow-none">{report.wasteType}</Badge>
												{report.scale === 'large' ? <Truck className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4 text-blue-500" />}
											</div>
											<p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight mt-1">{report.location}</p>
										</div>

										<div className="flex justify-between items-end mt-2">
											<div className="flex items-center gap-1 text-emerald-700 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
												<Weight className="w-3.5 h-3.5" />
												{report.totalWasteAmount}
											</div>
											<Button
												size="sm"
												disabled={claimingId === report.id}
												onClick={(e) => {
													e.stopPropagation(); // Prevents map from zooming when you click the button
													handleClaim(report.id);
												}}
												className="h-7 text-xs bg-gray-900 hover:bg-emerald-600 transition-colors text-white min-w-20"
											>
												{claimingId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Route"}
											</Button>
										</div>
									</div>
								</div>
							</Card>
						))
					)}
				</div>
			</div>

			{/* RIGHT MAIN VIEW: THE FULLSCREEN MAP */}
			<div className="hidden lg:block flex-1 relative bg-gray-100 z-0 border-l border-gray-200">
				<FeedMap reports={displayReports} activeReportId={activeReportId} />
			</div>

		</div>
	);
}
