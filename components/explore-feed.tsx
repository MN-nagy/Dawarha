"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, Calendar, Weight, Package, Truck, User, Search, Filter, ArrowUpDown, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { claimWasteReport } from "@/db/actions";
import { toast } from "sonner";

// Helper to extract numbers for sorting by weight
const parseWeight = (str: string) => {
	if (!str) return 0;
	let num = parseFloat(str.replace(/[^0-9.]/g, ''));
	if (str.toLowerCase().includes('ton')) num *= 1000;
	return isNaN(num) ? 0 : num;
};

export function ExploreFeed({ initialReports, userRole }: { initialReports: any[], userRole: string }) {
	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState<string>("all");
	const [filterScale, setFilterScale] = useState<string>("all");
	const [sortBy, setSortBy] = useState("newest");
	// Claim States
	const [claimingId, setClaimingId] = useState<number | null>(null);
	const [claimedReportIds, setClaimedReportsIds] = useState<number[]>([]);


	// Autocomplete States
	const [showSuggestions, setShowSuggestions] = useState(false);
	const searchContainerRef = useRef<HTMLDivElement>(null);

	// Close suggestions on outside click
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Extract dynamic locations for autocomplete based on current filters
	const availableLocations = useMemo(() => {
		const locationsMap = new Map<string, number>();
		const relevantReports = initialReports.filter(report =>
			(filterType === "all" || report.wasteType === filterType) &&
			(filterScale === "all" || report.scale === filterScale)
		);

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
	}, [initialReports, filterType, filterScale]);

	const filteredSuggestions = useMemo(() => {
		if (!searchQuery) return [];
		const lowerQuery = searchQuery.toLowerCase();
		return availableLocations
			.filter(loc => loc.name.toLowerCase().includes(lowerQuery) && loc.name.toLowerCase() !== lowerQuery)
			.slice(0, 5);
	}, [searchQuery, availableLocations]);

	// Apply Filters & Sorting
	const displayReports = useMemo(() => {
		let filtered = initialReports.filter(report => {
			if (claimedReportIds.includes(report.id)) return false;

			const searchLower = searchQuery.toLowerCase();
			const matchesSearch = report.location?.toLowerCase().includes(searchLower) ||
				report.additionalWaste?.toLowerCase().includes(searchLower) ||
				report.description?.toLowerCase().includes(searchLower);
			const matchesType = filterType === "all" || report.wasteType === filterType;
			const matchesScale = filterScale === "all" || report.scale === filterScale;
			return matchesSearch && matchesType && matchesScale;
		});

		filtered.sort((a, b) => {
			if (sortBy === "heaviest") return parseWeight(b.totalWasteAmount) - parseWeight(a.totalWasteAmount);
			if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			return 0;
		});

		return filtered;
	}, [initialReports, searchQuery, filterType, filterScale, sortBy]);

	// Determine if user can claim
	const canClaim = (scale: string) => {
		if (userRole === "member") return { allowed: false, reason: "Members cannot claim waste. Upgrade your role in settings." };
		if (userRole === "individual_collector" && scale === "large") return { allowed: false, reason: "Requires commercial vehicle (>20kg)." };
		if (userRole === "company_collector" && scale === "small") return { allowed: false, reason: "Too small for commercial fleet (<20kg)." };
		return { allowed: true, reason: "" };
	};

	// Function to handle the claim button click
	const handleClaim = async (reportId: number) => {
		setClaimingId(reportId);
		const result = await claimWasteReport(reportId);

		if (result.success) {
			toast.success("Job Claimed Successfully!", {
				description: "Route Secured! Go to your dashboard to complete the pickup.",
			});
			// Hide the card instantly without reloading the page
			setClaimedReportsIds(prev => [...prev, reportId]);
		} else {
			toast.error("Claim Failed", { description: result.error });
		}
		setClaimingId(null);
	};


	return (
		<div className="space-y-6">

			{/* --- SMART FILTER BAR --- */}
			<div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">

				{/* Search with Autocomplete */}
				<div className="relative w-full lg:max-w-md" ref={searchContainerRef}>
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
					<Input
						placeholder="Search regions, materials, or keywords..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setShowSuggestions(true);
						}}
						onFocus={() => setShowSuggestions(true)}
						className="pl-9 bg-gray-50 border-gray-200 h-10 w-full focus-visible:ring-emerald-500"
					/>

					{showSuggestions && filteredSuggestions.length > 0 && (
						<div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden">
							{filteredSuggestions.map((suggestion) => (
								<button
									key={suggestion.name}
									type="button"
									onMouseDown={(e) => {
										e.preventDefault();
										setSearchQuery(suggestion.name);
										setShowSuggestions(false);
									}}
									className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 flex justify-between items-center transition-colors border-b border-gray-50 last:border-0"
								>
									<span className="flex items-center gap-2 font-medium">
										<MapPin className="w-4 h-4 text-emerald-500" />
										{suggestion.name}
									</span>
									<span className="text-xs text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{suggestion.count}</span>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Dropdown Filters */}
				<div className="grid grid-cols-2 sm:flex sm:flex-row gap-3 w-full lg:w-auto">
					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger className="w-full sm:w-35 bg-white h-10">
							<Filter className="w-3.5 h-3.5 mr-2 text-gray-400" />
							<SelectValue placeholder="Material" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Materials</SelectItem>
							<SelectItem value="plastic">Plastic</SelectItem>
							<SelectItem value="metal">Metal</SelectItem>
							<SelectItem value="glass">Glass</SelectItem>
							<SelectItem value="paper">Paper</SelectItem>
							<SelectItem value="organic">Organic</SelectItem>
						</SelectContent>
					</Select>

					<Select value={filterScale} onValueChange={setFilterScale}>
						<SelectTrigger className="w-full sm:w-35 bg-white h-10">
							<SelectValue placeholder="Scale" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Any Size</SelectItem>
							<SelectItem value="small">Small (&lt;20kg)</SelectItem>
							<SelectItem value="large">Large (&gt;20kg)</SelectItem>
						</SelectContent>
					</Select>

					<Select value={sortBy} onValueChange={setSortBy}>
						<SelectTrigger className="w-full sm:w-35 bg-white h-10 col-span-2 sm:col-span-1">
							<ArrowUpDown className="w-3.5 h-3.5 mr-2 text-gray-400" />
							<SelectValue placeholder="Sort" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="newest">Newest First</SelectItem>
							<SelectItem value="heaviest">Heaviest First</SelectItem>
							<SelectItem value="oldest">Oldest First</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* --- RESULTS GRID --- */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{displayReports.length === 0 ? (
					<div className="col-span-full text-center py-24 text-gray-500 bg-white rounded-2xl border border-gray-200 border-dashed flex flex-col items-center shadow-sm">
						<Search className="w-12 h-12 text-gray-300 mb-4" />
						<p className="text-lg font-semibold text-gray-900">No reports found</p>
						<p className="text-sm mt-1 mb-4">Try adjusting your filters or searching a different area.</p>
						<Button variant="outline" onClick={() => { setFilterType("all"); setFilterScale("all"); setSearchQuery(""); }} className="text-emerald-600 border-emerald-200 hover:bg-emerald-50">
							Clear All Filters
						</Button>
					</div>
				) : (
					displayReports.map((report) => {
						const claimStatus = canClaim(report.scale);

						return (
							<Card key={report.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200 flex flex-col group bg-white">

								{/* Image Header */}
								<div className="relative h-48 w-full bg-gray-100 overflow-hidden">
									<img src={report.imageUrl} alt="Waste" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" />

									{/* Top overlay badges */}
									<div className="absolute top-3 inset-x-3 flex justify-between items-start">
										<Badge className="capitalize bg-white/95 text-emerald-900 backdrop-blur-sm shadow-sm font-bold border-0 flex items-center gap-1.5">
											<span>{report.wasteType}</span>
											<span className="text-emerald-500/50 opacity-70 font-black">•</span>
											<span className="text-emerald-700">{report.amount}</span>
										</Badge>
										<Badge variant="outline" className={`backdrop-blur-md shadow-sm border-0 font-bold px-2 py-1 ${report.scale === 'large' ? 'bg-amber-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
											{report.scale === 'large' ? <Truck className="w-3.5 h-3.5 mr-1.5" /> : <User className="w-3.5 h-3.5 mr-1.5" />}
											{report.scale}
										</Badge>
									</div>

									{/* Bottom gradient & Weight */}
									<div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent p-3 pt-12 flex justify-end">
										<div className="flex items-center gap-1.5 text-white font-black text-lg drop-shadow-md">
											<Weight className="w-5 h-5 text-emerald-400" />
											{report.totalWasteAmount}
										</div>
									</div>
								</div>

								<CardContent className="p-5 grow space-y-3">
									<div className="flex items-start gap-2 text-gray-700">
										<MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
										<span className="font-medium text-sm line-clamp-2 leading-tight">{report.location}</span>
									</div>

									{report.additionalWaste && report.additionalWaste !== "None" && (
										<div className="flex items-start gap-2 text-gray-500 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
											<Package className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-400" />
											<span className="line-clamp-2 italic">Contains: {report.additionalWaste}</span>
										</div>
									)}
								</CardContent>

								<CardFooter className="p-4 flex items-center justify-between border-t border-gray-100 mt-auto bg-gray-50/30">
									<div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
										<Calendar className="w-3.5 h-3.5" />
										{new Date(report.createdAt).toLocaleDateString()}
									</div>

									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<div>
													<Button
														size="sm"
														disabled={!claimStatus.allowed || claimingId === report.id}
														onClick={() => handleClaim(report.id)}
														className={`transition-all ${claimStatus.allowed ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}
													>
														{claimingId === report.id ? (
															<Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
														) : !claimStatus.allowed ? (
															<Lock className="w-3 h-3 mr-1.5" />
														) : null}
														{claimingId === report.id ? "Securing..." : "Claim Job"}
													</Button>
												</div>
											</TooltipTrigger>
											{!claimStatus.allowed && (
												<TooltipContent className="bg-gray-900 text-white border-0">
													<p className="text-xs font-medium">{claimStatus.reason}</p>
												</TooltipContent>
											)}
										</Tooltip>
									</TooltipProvider>

								</CardFooter>
							</Card>
						);
					})
				)}
			</div>
		</div>
	);
}
