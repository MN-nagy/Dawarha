"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin, Calendar, Weight, Package, Truck, User, Search, Filter, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils"; // Standard shadcn utility

// Dummy location data
const LOCATIONS = [
	{ value: "all", label: "All Locations" },
	{ value: "cairo", label: "Cairo" },
	{ value: "alexandria", label: "Alexandria" },
	{ value: "giza", label: "Giza" },
	{ value: "sharm", label: "Sharm El-Sheikh" },
	{ value: "hurghada", label: "Hurghada" },
	{ value: "mansoura", label: "Mansoura" },
];

export function ExploreFeed({ initialReports }: { initialReports: any[] }) {
	const [filterType, setFilterType] = useState<string>("all");
	const [filterScale, setFilterScale] = useState<string>("all");

	// Combobox State
	const [openLocation, setOpenLocation] = useState(false);
	const [filterLocation, setFilterLocation] = useState<string>("all");

	const [filterTime, setFilterTime] = useState<string>("all");

	// Filtering Logic (Type and Scale)
	const filteredReports = initialReports.filter((report) => {
		const matchesType = filterType === "all" || report.wasteType === filterType;
		const matchesScale = filterScale === "all" || report.scale === filterScale;
		return matchesType && matchesScale;
	});

	return (
		<div className="space-y-6">

			{/* --- ENTERPRISE FILTER BAR --- */}
			<div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">

				<div className="flex items-center gap-2 text-gray-700 font-semibold w-full md:w-auto">
					<Filter className="w-5 h-5 text-emerald-600" />
					Filters
				</div>

				<div className="grid grid-cols-2 md:flex md:flex-row gap-3 w-full md:w-auto flex-grow justify-end">

					{/* 1. Material Filter */}
					<Select value={filterType} onValueChange={setFilterType}>
						<SelectTrigger className="w-full md:w-[150px] bg-gray-50">
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

					{/* 2. Scale Filter */}
					<Select value={filterScale} onValueChange={setFilterScale}>
						<SelectTrigger className="w-full md:w-[150px] bg-gray-50">
							<SelectValue placeholder="Scale" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Any Size</SelectItem>
							<SelectItem value="small">Small (&lt;20kg)</SelectItem>
							<SelectItem value="large">Large (&gt;20kg)</SelectItem>
						</SelectContent>
					</Select>

					{/* 3. COMBOBOX: Searchable Location Filter */}
					<Popover open={openLocation} onOpenChange={setOpenLocation}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={openLocation}
								className="w-full md:w-[180px] justify-between bg-gray-50 font-normal border-gray-200"
							>
								{filterLocation === "all"
									? "All Locations"
									: LOCATIONS.find((loc) => loc.value === filterLocation)?.label}
								<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-full md:w-[180px] p-0">
							<Command>
								<CommandInput placeholder="Search city..." />
								<CommandList>
									<CommandEmpty>No city found.</CommandEmpty>
									<CommandGroup>
										{LOCATIONS.map((location) => (
											<CommandItem
												key={location.value}
												value={location.value}
												onSelect={(currentValue) => {
													setFilterLocation(currentValue);
													setOpenLocation(false);
												}}
											>
												<Check
													className={cn(
														"mr-2 h-4 w-4",
														filterLocation === location.value ? "opacity-100" : "opacity-0"
													)}
												/>
												{location.label}
											</CommandItem>
										))}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					{/* 4. Dummy Time Filter */}
					<Select value={filterTime} onValueChange={setFilterTime}>
						<SelectTrigger className="w-full md:w-[150px] bg-gray-50">
							<SelectValue placeholder="Time" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Any Time</SelectItem>
							<SelectItem value="today">Today</SelectItem>
							<SelectItem value="week">This Week</SelectItem>
							<SelectItem value="month">This Month</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* --- RESULTS GRID --- */}
			{/* (Keep your exact existing results grid code here!) */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{filteredReports.length === 0 ? (
					<div className="col-span-full text-center py-16 text-gray-500 bg-white rounded-xl border border-gray-100 border-dashed flex flex-col items-center">
						<Search className="w-10 h-10 text-gray-300 mb-3" />
						<p>No available waste matching these filters.</p>
						<Button variant="link" onClick={() => { setFilterType("all"); setFilterScale("all"); setFilterLocation("all"); }} className="text-emerald-600 mt-2">
							Clear Filters
						</Button>
					</div>
				) : (
					filteredReports.map((report) => (
						<Card key={report.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-emerald-100 flex flex-col group">

							<div className="relative h-48 w-full bg-gray-100 overflow-hidden">
								<img src={report.imageUrl} alt="Waste" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
								<div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
									<Badge className="capitalize bg-white/90 text-emerald-800 backdrop-blur-sm shadow-sm">
										{report.wasteType}
									</Badge>
									<Badge variant="outline" className={`backdrop-blur-sm shadow-sm border-0 ${report.scale === 'large' ? 'bg-amber-100/90 text-amber-800' : 'bg-blue-100/90 text-blue-800'}`}>
										{report.scale === 'large' ? <Truck className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
										{report.scale}
									</Badge>
								</div>
							</div>

							<CardContent className="p-5 flex-grow space-y-4">
								<div className="flex items-start gap-2 text-gray-700">
									<MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
									<span className="font-medium line-clamp-2">{report.location}</span>
								</div>
								<div className="flex items-center gap-2 text-gray-600 text-sm">
									<Weight className="w-4 h-4 text-emerald-500 shrink-0" />
									<span className="font-semibold">{report.amount}</span>
								</div>
								{report.additionalWaste && (
									<div className="flex items-start gap-2 text-gray-500 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
										<Package className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
										<span className="line-clamp-2 text-xs italic">Includes: {report.additionalWaste}</span>
									</div>
								)}
							</CardContent>

							<CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-gray-100 mt-auto bg-gray-50/50">
								<div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
									<Calendar className="w-3 h-3" />
									{new Date(report.createdAt).toLocaleDateString()}
								</div>
								<Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-transform active:scale-95">
									Claim Waste
								</Button>
							</CardFooter>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
