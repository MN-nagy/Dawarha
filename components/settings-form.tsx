"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Shield, MapPin, Leaf, Truck, Loader2, Save, Info, Trash2, CheckCircle, Navigation, Plus } from "lucide-react";
import { Map } from "lucide-react";
import { Upload, Clock, ShieldCheck } from "lucide-react";
import { CreditCard, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useUploadThing } from "@/lib/uploadthing";
import {
	updateProfileSettings,
	addCompanyLocation,
	removeCompanyLocation,
	createStripeCheckoutSession,
	createStripePortalSession,
	updateUserName,
	requestEmailChange,
	requestPasswordReset,
	submitCompanyVerification
} from "@/db/actions";

interface SettingsFormProps {
	userId: number;
	baseUser: { name: string; email: string };
	initialProfile: any;
	initialLocations: any[];
}

export function SettingsForm({ userId, baseUser, initialProfile, initialLocations }: SettingsFormProps) {
	const [activeTab, setActiveTab] = useState<"general" | "role" | "logistics" | "billing">("general");
	const [isPending, startTransition] = useTransition();
	const MiniMap = dynamic(() => import("./mini-map"), { ssr: false, loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse rounded-md flex items-center justify-center text-xs text-gray-400">Loading map...</div> });

	// Profile States
	const [role, setRole] = useState<string>(initialProfile?.role || "member");
	const [preferredWaste, setPreferredWaste] = useState<string[]>(
		initialProfile?.preferredWaste ? initialProfile.preferredWaste.split(",") : ["all"]
	);
	//NOTE: check the capacity, if not needed remove.
	const [_capacity, _setCapacity] = useState<string>(initialProfile?.capacity || "all");
	const [companyType, setCompanyType] = useState<string>(initialProfile?.companyType || "for-profit");
	const [targetAmount, setTargetAmount] = useState<string>(initialProfile?.targetAmount || "any");
	const [radius, setRadius] = useState<number>(initialProfile?.radius || 10);

	// Value Exchange States
	const [contributionModel, setContributionModel] = useState<string>("subscription");
	const [slaDoc, setSlaDoc] = useState<File | null>(null);

	// Location Manager States
	const [savedLocations, setSavedLocations] = useState<any[]>(initialLocations || []);
	const [isLocationLoading, setIsLocationLoading] = useState(false);

	// Strict Coordinate States (Brought over from Report Form)
	const [manualCoords, setManualCoords] = useState("");
	const [coordinates, setCoordinates] = useState<{ lat: string, lng: string } | null>(null);
	const [approximateAddress, setApproximateAddress] = useState<string>("");
	const [isFetchingAddress, setIsFetchingAddress] = useState(false);
	const [isLocating, setIsLocating] = useState(false);


	// resend
	const [name, setName] = useState(baseUser.name);
	const [newEmail, setNewEmail] = useState("");
	const [isEditingName, setIsEditingName] = useState(false);
	const [isEditingEmail, setIsEditingEmail] = useState(false);
	const [verificationStatus, setVerificationStatus] = useState(initialProfile?.verificationStatus || "unverified");

	// UploadThing Hook for Company Documents
	const { startUpload, isUploading } = useUploadThing("companyDocument");
	const [selectedDoc, setSelectedDoc] = useState<File | null>(null);

	// Helper to check if they have an active paid subscription
	const hasActiveSubscription = initialProfile?.stripeCurrentPeriodEnd && new Date(initialProfile.stripeCurrentPeriodEnd) > new Date();


	const toggleWasteType = (type: string) => {
		if (type === "all") {
			setPreferredWaste(["all"]);
			return;
		}
		let newSelection = preferredWaste.filter(w => w !== "all");
		if (newSelection.includes(type)) {
			newSelection = newSelection.filter(w => w !== type);
			if (newSelection.length === 0) newSelection = ["all"]; // Fallback if they uncheck everything
		} else {
			if (newSelection.length < 3) newSelection.push(type);
			else toast.error("You can only select up to 3 waste types.");
		}
		setPreferredWaste(newSelection);
	}

	// Sync saved locations if the server data updates
	useEffect(() => {
		setSavedLocations(initialLocations);
	}, [initialLocations]);

	// --- PROFILE SAVE ENGINE ---
	const handleSaveProfile = () => {
		startTransition(async () => {
			const payloadRole = role;
			// Solo defaults to all, Companies join their array into a string
			const payloadWaste = role === "solo_collector"
				? "all"
				: (Array.isArray(preferredWaste) ? preferredWaste.join(",") : "all");
			// Lock capacity securely on save
			const payloadCapacity = role === "solo_collector" ? "small_under_20" : "large_over_20";
			const payloadCompanyType = role === "company_collector" ? companyType : null;


			const result = await updateProfileSettings(userId, {
				role: payloadRole,
				preferredWaste: payloadWaste,
				capacity: payloadCapacity,
				companyType: payloadCompanyType,
				contributionModel: contributionModel,
				targetAmount: role === "company_collector" ? targetAmount : "any", // Solo doesn't use target amount
				radius: radius,
			});

			if (result.success) {
				toast.success("Profile Updated", { description: "Your settings have been saved successfully." });
				if (role === 'member') setSavedLocations([]);
			} else {
				toast.error("Update Failed", { description: result.error });
			}
		});
	};

	// --- LOCATION SEARCH ENGINE ---
	const fetchAddressFromCoords = async (lat: string, lng: string) => {
		setIsFetchingAddress(true);
		try {
			const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
			const data = await res.json();
			if (data && data.display_name) {
				setApproximateAddress(data.display_name);
			} else {
				setApproximateAddress("Unknown Location (Coordinates Saved)");
			}
		} catch (error) {
			setApproximateAddress("Could not fetch address name, but coordinates are saved.");
		} finally {
			setIsFetchingAddress(false);
		}
	};

	const handleGetLocation = () => {
		setIsLocating(true);
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const lat = position.coords.latitude.toString();
					const lng = position.coords.longitude.toString();
					setCoordinates({ lat, lng });
					setManualCoords(`${lat}, ${lng}`);
					fetchAddressFromCoords(lat, lng);
					setIsLocating(false);
				},
				(_error) => {
					toast.error("Could not get location. Please ensure location services are enabled.");
					setIsLocating(false);
				},
				{ enableHighAccuracy: true }
			);
		} else {
			toast.error("Geolocation is not supported by this browser.");
			setIsLocating(false);
		}
	};

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (manualCoords.includes(',')) {
				const [lat, lng] = manualCoords.split(',').map(s => s.trim());
				if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
					setCoordinates({ lat, lng });
					fetchAddressFromCoords(lat, lng);
				}
			}
		}, 800);
		return () => clearTimeout(timeout);
	}, [manualCoords]);

	// --- LOCATION DATABASE ENGINE ---
	const handleAddLocationToDatabase = () => {
		if (!coordinates || !approximateAddress) return;
		setIsLocationLoading(true);
		startTransition(async () => {
			const result = await addCompanyLocation(userId, approximateAddress, coordinates.lat, coordinates.lng);
			if (result.success) {
				toast.success("Location added to your profile!");
				// Clear the inputs for the next one
				setManualCoords("");
				setCoordinates(null);
				setApproximateAddress("");
			} else {
				toast.error("Failed to add location.");
			}
			setIsLocationLoading(false);
		});
	};

	const handleDeleteLocation = (locationId: number) => {
		startTransition(async () => {
			const result = await removeCompanyLocation(locationId, userId);
			if (result.success) {
				toast.success("Location removed.");
			} else {
				toast.error("Failed to remove location.");
			}
		});
	};

	const isSoloAtLimit = role === "solo_collector" && savedLocations.length >= 1;


	// for now
	//NOTE: related to reset password
	const handleReset = () => {
		startTransition(async () => {
			const res = await requestPasswordReset(baseUser.email);

			if (res.success) {
				toast.success(res.success);
			} else {
				toast.error(res.error);
			}
		})
	}

	return (
		<div className="flex flex-col md:flex-row gap-6">

			{/* SIDEBAR NAVIGATION */}
			<Card className="w-full md:w-64 shrink-0 border-emerald-100 shadow-lg h-fit">
				<CardContent className="p-4 space-y-2">
					<div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2 pt-2">Account Settings</div>
					<button onClick={() => setActiveTab("general")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "general" ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}><User className="w-4 h-4" /> General Info</button>
					<button onClick={() => setActiveTab("role")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "role" ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}><Shield className="w-4 h-4" /> Role Selection</button>
					{role !== "member" && (
						<button onClick={() => setActiveTab("logistics")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "logistics" ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}><MapPin className="w-4 h-4" /> Logistics & Location</button>
					)}
					{/* Only show Billing if they are a For-Profit Company AND chose the Subscription Model */}
					{role === "company_collector" && companyType === "for-profit" && contributionModel === "subscription" && (
						<button onClick={() => setActiveTab("billing")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "billing" ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
							<CreditCard className="w-4 h-4" /> Billing & Subscription
						</button>
					)}
				</CardContent>
			</Card>

			{/* MAIN CONTENT AREA */}
			<Card className="grow border-emerald-100 shadow-xl overflow-hidden min-h-125">
				<CardContent className="p-6 sm:p-8">

					{/* --- TAB 1: GENERAL INFO  --- */}
					{activeTab === "general" && (
						<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
							<div>
								<h2 className="text-xl font-bold text-gray-900">General Information</h2>
								<p className="text-sm text-gray-500">Manage your identity and security credentials.</p>
							</div>

							<div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-w-2xl">

								{/* NAME ROW */}
								<div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									<div>
										<p className="text-sm font-semibold text-gray-900">Display Name</p>
										{!isEditingName && <p className="text-sm text-gray-500 mt-1">{name}</p>}
									</div>
									{isEditingName ? (
										<div className="flex items-center gap-2 w-full sm:w-auto">
											<Input value={name} onChange={(e) => setName(e.target.value)} className="w-full sm:w-48 h-9" />
											<Button size="sm" variant="ghost" onClick={() => { setName(baseUser.name); setIsEditingName(false); }}>Cancel</Button>
											<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => startTransition(async () => { const res = await updateUserName(userId, name); if (res.success) { toast.success(res.success); setIsEditingName(false); } else toast.error(res.error); })} disabled={isPending || name === baseUser.name}>Save</Button>
										</div>
									) : (
										<Button variant="outline" size="sm" onClick={() => setIsEditingName(true)}>Change Name</Button>
									)}
								</div>

								{/* EMAIL ROW */}
								<div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
									<div className="grow">
										<p className="text-sm font-semibold text-gray-900">Email Address</p>
										{!isEditingEmail && <p className="text-sm text-gray-500 mt-1">{baseUser.email}</p>}
									</div>
									{isEditingEmail ? (
										<div className="flex items-center gap-2 w-full sm:w-auto">
											<Input placeholder="New email..." type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full sm:w-48 h-9" />
											<Button size="sm" variant="ghost" onClick={() => { setNewEmail(""); setIsEditingEmail(false); }}>Cancel</Button>
											<Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap" onClick={() => startTransition(async () => { const res = await requestEmailChange(userId, baseUser.email, newEmail); if (res.success) { toast.success(res.success); setIsEditingEmail(false); } else toast.error(res.error); })} disabled={isPending || !newEmail || newEmail === baseUser.email}>Verify Email</Button>
										</div>
									) : (
										<Button variant="outline" size="sm" onClick={() => setIsEditingEmail(true)}>Change Email</Button>
									)}
								</div>

								{/* PASSWORD ROW */}
								<div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
									<div>
										<p className="text-sm font-semibold text-gray-900">Password</p>
										<p className="text-sm text-gray-500 mt-1">••••••••••••</p>
									</div>
									<Button variant="outline" size="sm" onClick={handleReset} disabled={isPending}>
										Change Password
									</Button>
								</div>

							</div>
						</motion.div>
					)}

					{/* TAB 2: ROLE SELECTION */}
					{activeTab === "role" && (
						<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
							<div>
								<h2 className="text-xl font-bold text-gray-900">Platform Role</h2>
								<p className="text-sm text-gray-500">How do you want to interact with the Dawarha ecosystem?</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{/* Roles (Member, Solo, Company) */}
								<div onClick={() => setRole("member")} className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200 ${role === "member" ? "border-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"}`}>
									<div className={`p-3 rounded-full mb-3 ${role === "member" ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}><Leaf className="w-5 h-5" /></div>
									<h3 className="font-bold text-gray-900 text-sm mb-1">Standard Member</h3>
									<p className="text-xs text-gray-500 mt-1">Report waste only.</p>
								</div>
								<div onClick={() => setRole("solo_collector")} className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200 ${role === "solo_collector" ? "border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"}`}>
									<div className={`p-3 rounded-full mb-3 ${role === "solo_collector" ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"}`}><User className="w-5 h-5" /></div>
									<h3 className="font-bold text-gray-900 text-sm mb-1">Solo Collector</h3>
									<p className="text-xs text-gray-500 mt-1">Personal vehicle pickups.</p>
								</div>
								<div onClick={() => setRole("company_collector")} className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all duration-200 ${role === "company_collector" ? "border-blue-500 bg-blue-50 shadow-md scale-[1.02]" : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"}`}>
									<div className={`p-3 rounded-full mb-3 ${role === "company_collector" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}><Truck className="w-5 h-5" /></div>
									<h3 className="font-bold text-gray-900 text-sm mb-1">Company</h3>
									<p className="text-xs text-gray-500 mt-1">Commercial trucking.</p>
								</div>
							</div>

							{/*  Logistics Warning UI  */}
							{role !== "member" && (
								<div className="pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100">
									<div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-100">
										<Info className="w-4 h-4 shrink-0" />
										<span className="text-xs font-medium">Please complete your Logistics & Location settings after saving to activate this role.</span>
									</div>
								</div>
							)}
							<Button onClick={handleSaveProfile} disabled={isPending} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shrink-0">
								{isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Role
							</Button>
						</motion.div>
					)}

					{/* TAB 3: LOGISTICS & LOCATION */}
					{(activeTab === "logistics") && role !== "member" && (
						<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
							{/* THE SOLO COLLECTOR VIEW */}
							{role === "solo_collector" && (
								<div className="space-y-6">
									<Alert className="bg-indigo-50 border-indigo-200">
										<Info className="h-4 w-4 text-indigo-600" />
										<AlertTitle className="text-indigo-800 font-bold">Solo Collector Restrictions Active</AlertTitle>
										<AlertDescription className="text-indigo-700/80">
											As an Solo collector, you are automatically set to collect <strong>mixed materials</strong> for <strong>small loads (&lt; 20kg)</strong>.
										</AlertDescription>
									</Alert>

									<div className="space-y-2 p-5 border border-indigo-100 bg-white rounded-xl shadow-sm">
										<div className="flex justify-between items-center mb-2">
											<Label className="text-base font-semibold text-gray-900">Notification Radius</Label>
											<span className="text-sm font-bold text-indigo-600">{Math.min(radius, 20)} km</span>
										</div>
										<p className="text-xs text-gray-500 mb-4">Set how far you are willing to travel for pickups (Max 20km for Solo Collectors).</p>
										<input
											type="range"
											min="1"
											max="20"
											value={Math.min(radius, 20)}
											onChange={(e) => setRadius(parseInt(e.target.value))}
											className="w-full accent-indigo-600"
										/>
										<div className="flex justify-between text-[10px] text-gray-400 mt-1">
											<span>1 km</span>
											<span>20 km max</span>
										</div>
									</div>

									<div className="flex justify-end">
										<Button onClick={handleSaveProfile} disabled={isPending} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
											{isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Update Radius
										</Button>
									</div>
								</div>
							)}

							{/* THE COMPANY VIEW */}
							{role === "company_collector" && (
								<div className="space-y-6">
									<div><h2 className="text-xl font-bold text-gray-900">Feed Radar & Logistics</h2><p className="text-sm text-gray-500">Configure your fleet capabilities and personalized feed notifications.</p></div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label>Organization Type</Label>
											<Select value={companyType} onValueChange={setCompanyType}>
												<SelectTrigger className="bg-white"><SelectValue placeholder="Select Type" /></SelectTrigger>
												<SelectContent>
													<SelectItem value="for-profit">For-Profit</SelectItem>
													<SelectItem value="non-profit">Non-Profit / NGO</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<Label>Target Amounts (Feed Filter)</Label>
											<Select value={targetAmount} onValueChange={setTargetAmount}>
												<SelectTrigger className="bg-white"><SelectValue placeholder="Select Target" /></SelectTrigger>
												<SelectContent>
													<SelectItem value="any">Any Amount (over 20kg)</SelectItem>
													<SelectItem value="50-100">50kg - 100kg</SelectItem>
													<SelectItem value="110-200">110kg - 200kg</SelectItem>
													<SelectItem value="200+">200kg+</SelectItem>
												</SelectContent>
											</Select>
										</div>

										<div className="space-y-2">
											<div className="flex justify-between items-center">
												<Label>Notification Radius</Label>
												<span className="text-xs font-bold text-emerald-600">{radius} km</span>
											</div>
											<input type="range" min="1" max="100" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="w-full accent-emerald-600" />
											<div className="flex justify-between text-[10px] text-gray-400"><span>1 km</span><span>100 km max</span></div>
										</div>

										<div className="space-y-2">
											<Label className="text-gray-400">Hauling Capacity (Locked)</Label>
											<Input disabled value="Large Commercial (> 20kg)" className="bg-gray-50 text-gray-500 font-medium" />
										</div>
									</div>

									{/* Multi-Select Badges for Waste Type */}
									<div className="space-y-3 pt-2">
										<div className="flex justify-between items-end">
											<Label>Target Materials (Select up to 3)</Label>
											<span className="text-xs text-gray-400">{preferredWaste.includes("all") ? "0" : preferredWaste.length}/3 selected</span>
										</div>
										<div className="flex flex-wrap gap-2">
											{["all", "plastic", "metal", "glass", "paper", "organic"].map((type) => {
												const isSelected = preferredWaste.includes(type);
												return (
													<Badge
														key={type}
														variant={isSelected ? "default" : "outline"}
														onClick={() => toggleWasteType(type)}
														className={`cursor-pointer capitalize px-3 py-1.5 transition-colors ${isSelected ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white hover:bg-emerald-50 text-gray-600"}`}
													>
														{type === "all" ? "Mixed / Any" : type}
													</Badge>
												)
											})}
										</div>
									</div>

									{/*  PLATFORM CONTRIBUTION MODEL (For-Profits Only)  */}
									{companyType === "for-profit" && (
										<div className="space-y-4 pt-4 border-t border-gray-100">
											<Label className="text-base font-semibold text-gray-900">Platform Access Model</Label>
											<p className="text-sm text-gray-500">Choose how your business contributes to the Dawarha ecosystem to access the live feed.</p>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												{/* Option 1: Subscription */}
												<div
													onClick={() => setContributionModel("subscription")}
													className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 ${contributionModel === "subscription" ? "border-indigo-500 bg-indigo-50 shadow-sm" : "border-gray-200 hover:border-indigo-200"}`}
												>
													<div className="flex items-center gap-2 mb-1">
														<CreditCard className={`w-5 h-5 ${contributionModel === "subscription" ? "text-indigo-600" : "text-gray-400"}`} />
														<h4 className="font-bold text-gray-900">Monthly Subscription</h4>
													</div>
													<p className="text-xs text-gray-600 ml-7">Standard $49/mo access fee.</p>
												</div>

												{/* Option 2: Reward Partner */}
												<div
													onClick={() => {
														if (hasActiveSubscription) {
															toast.info("Please manage your billing and cancel your active subscription first to switch models.");
															return;
														}
														setContributionModel("reward_partner");
													}}
													className={`border-2 rounded-xl p-4 transition-all duration-200 ${hasActiveSubscription
														? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-200"
														: contributionModel === "reward_partner"
															? "border-amber-500 bg-amber-50 shadow-sm cursor-pointer"
															: "border-gray-200 hover:border-amber-200 cursor-pointer"
														}`}
												>
													<div className="flex items-center justify-between mb-1">
														<div className="flex items-center gap-2">
															<Zap className={`w-5 h-5 ${hasActiveSubscription ? "text-gray-400" : contributionModel === "reward_partner" ? "text-amber-600" : "text-gray-400"}`} />
															<h4 className={`font-bold ${hasActiveSubscription ? "text-gray-500" : "text-gray-900"}`}>Reward Partner</h4>
														</div>
														{hasActiveSubscription && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-200 px-2 py-0.5 rounded">Locked</span>}
													</div>
													<p className="text-xs text-gray-600 ml-7">Waive fees by offering user discounts.</p>
												</div>

											</div>

											{/* Dynamic Content based on selection */}
											<AnimatePresence mode="wait">
												{contributionModel === "subscription" ? (
													<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
														<Alert className="bg-indigo-50/50 border-indigo-100">
															<Info className="h-4 w-4 text-indigo-600" />
															<AlertDescription className="text-indigo-700 text-sm">
																After saving your logistics, please navigate to the <strong>Billing & Subscription</strong> tab in the sidebar to activate your plan.
															</AlertDescription>
														</Alert>
													</motion.div>
												) : (
													<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="p-5 border border-amber-200 bg-amber-50/30 rounded-xl space-y-4">
														<div>
															<h4 className="text-sm font-bold text-gray-900">Partnership SLA Required</h4>
															<p className="text-xs text-gray-600 mt-1">To waive your subscription fee, you must sign and upload a legally binding Service Level Agreement (SLA) guaranteeing up to 30% discounts for Dawarha users redeeming points.</p>
														</div>
														<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
															<Input type="file" accept=".pdf" className="bg-white text-xs w-full sm:w-auto" onChange={(e) => setSlaDoc(e.target.files?.[0] || null)} />
															<Button type="button" size="sm" disabled={!slaDoc || isUploading} className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white">
																<Upload className="w-3 h-3 mr-2" /> Upload Signed SLA
															</Button>
														</div>
													</motion.div>
												)}
											</AnimatePresence>
										</div>
									)}

									<div className="flex justify-end">
										<Button onClick={handleSaveProfile} disabled={isPending} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
											{isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Update Logistics
										</Button>
									</div>
								</div>
							)}

							{/* --- COMPANY TAB (KYB UPDATE) - ONLY VISIBLE TO COMPANIES --- */}
							{role === "company_collector" && (
								<>
									<div className="h-px bg-gray-100 w-full my-6"></div>

									<div>
										<div className="flex items-center gap-2 mb-4">
											<h3 className="text-lg font-bold text-gray-900">KYB Verification (Required)</h3>
											<HoverCard>
												<HoverCardTrigger asChild>
													<button type="button" className="text-gray-400 hover:text-blue-600 transition-colors focus:outline-none">
														<Info className="w-4 h-4" />
													</button>
												</HoverCardTrigger>
												<HoverCardContent side="top" align="center" className="w-80 p-4 shadow-xl border-emerald-100 z-50">
													<div className="space-y-2">
														<h4 className="text-sm font-semibold text-gray-900">Accepted Documents</h4>
														<p className="text-xs text-gray-600 leading-relaxed">
															Please provide a clear copy of your <strong>Commercial Register (Sijil Tijari)</strong>, <strong>Tax ID (Bitaqa Daribiya)</strong>, or official <strong>NGO Registration</strong>.
														</p>
														<p className="text-[10px] text-emerald-600 font-medium pt-1">Formats: PDF (Max 256MB)</p>
													</div>
												</HoverCardContent>
											</HoverCard>
										</div>

										{verificationStatus === "verified" && (
											<Alert className="bg-emerald-50 border-emerald-200">
												<ShieldCheck className="h-4 w-4 text-emerald-600" />
												<AlertTitle className="text-emerald-800 font-bold">Business Verified</AlertTitle>
												<AlertDescription className="text-emerald-700">Your commercial documents have been approved. Your account has full access to the Explore map.</AlertDescription>
											</Alert>
										)}

										{verificationStatus === "pending" && (
											<Alert className="bg-amber-50 border-amber-200">
												<Clock className="h-4 w-4 text-amber-600" />
												<AlertTitle className="text-amber-800 font-bold">Verification Pending</AlertTitle>
												<AlertDescription className="text-amber-700">Our team is reviewing your documents. You can report waste and use Explore, but the <strong>Collect</strong> feature is locked until approved.</AlertDescription>
											</Alert>
										)}

										{(verificationStatus === "unverified" || verificationStatus === "rejected") && (
											<div className="p-6 border border-gray-200 rounded-xl bg-gray-50">
												<p className="text-sm text-gray-600 mb-4">Please upload your Commercial Register or NGO documentation to unlock platform features.</p>

												<div className="flex flex-col gap-4">
													<Input type="file" accept=".pdf" onChange={(e) => setSelectedDoc(e.target.files?.[0] || null)} />
													<Button
														disabled={!selectedDoc || isUploading || isPending}
														onClick={async () => {
															if (!selectedDoc) return;
															try {
																const uploadRes = await startUpload([selectedDoc]);
																if (uploadRes && uploadRes[0]) {
																	const dbRes = await submitCompanyVerification(userId, uploadRes[0].ufsUrl);
																	if (dbRes.success) {
																		toast.success(dbRes.success);
																		setVerificationStatus("pending");
																	}
																}
															} catch (e) { toast.error("Upload failed"); }
														}}
														className="w-full bg-blue-600 hover:bg-blue-700 text-white"
													>
														{isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} Submit Document
													</Button>
												</div>
											</div>
										)}
									</div>
								</>
							)}

							{/* --- THE LOCATION MANAGER --- */}
							<div>
								<div className="flex justify-between items-center mb-4">
									<div>
										<h3 className="text-lg font-bold text-gray-900">Operating Locations</h3>
										<p className="text-sm text-gray-500">{role === "solo_collector" ? "Set your home base." : "Add all your operational branch offices."}</p>
									</div>
									<div className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
										{savedLocations.length} {role === "solo_collector" ? "/ 1 Location" : "Locations"} Saved
									</div>
								</div>

								{/* List the already saved locations */}
								{savedLocations.length > 0 && (
									<div className="space-y-3 mb-6">
										{savedLocations.map((loc) => (
											<div key={loc.id} className="flex justify-between items-center bg-white border border-gray-200 rounded-lg p-4 shadow-sm group hover:border-emerald-300 transition-colors">
												<div className="flex items-start gap-3">
													<MapPin className="w-5 h-5 text-emerald-500 mt-0.5" />
													<div>
														<p className="text-sm font-semibold text-gray-900">{loc.address}</p>
														<p className="text-xs text-gray-400 font-mono mt-0.5">
															Lat: {parseFloat(loc.latitude).toFixed(4)}, Lng: {parseFloat(loc.longitude).toFixed(4)}
														</p>
													</div>
												</div>

												<div className="flex items-center gap-2">
													{/*  THE HOVER CARD MAP */}
													<HoverCard>
														<HoverCardTrigger asChild>
															<Button variant="outline" size="icon" className="h-8 w-8 text-blue-500 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
																<Map className="w-4 h-4" />
															</Button>
														</HoverCardTrigger>
														<HoverCardContent side="top" align="end" className="w-80 p-3 shadow-xl border-emerald-100 z-50">
															<div className="space-y-2">
																<h4 className="text-sm font-semibold text-gray-900">Location Verification</h4>
																<MiniMap lat={parseFloat(loc.latitude)} lng={parseFloat(loc.longitude)} />
																<p className="text-[10px] text-gray-400 text-center pt-1">Powered by OpenStreetMap</p>
															</div>
														</HoverCardContent>
													</HoverCard>

													<Button variant="ghost" size="icon" onClick={() => handleDeleteLocation(loc.id)} disabled={isPending} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</div>
										))}
									</div>
								)}

								{/* Add Location Form (Hidden if Solo Collector already has 1 location) */}
								{!isSoloAtLimit && (
									<div className="space-y-4 p-4 border border-emerald-100 bg-emerald-50/20 rounded-xl">
										<Label className="text-emerald-800 font-semibold text-sm">Add New Location</Label>

										<div className="flex flex-col md:flex-row gap-3 items-end">
											<div className="relative grow w-full">
												<Label htmlFor="manualCoords" className="text-xs font-semibold text-gray-600 mb-1 block">Paste Coordinates (Lat, Lng)</Label>
												<MapPin className="absolute left-3 top-8 h-4 w-4 text-emerald-500 z-10" />
												<Input id="manualCoords" value={manualCoords} onChange={(e) => setManualCoords(e.target.value)} placeholder="e.g., 30.0444, 31.2357" className="pl-9 bg-white" autoComplete="off" />
											</div>

											<div className="hidden md:flex pb-3 text-emerald-400 font-bold text-xs uppercase">OR</div>

											<Button type="button" variant={coordinates ? "outline" : "default"} onClick={handleGetLocation} disabled={isLocating} className={`w-full md:w-auto shrink-0 shadow-sm h-10 ${coordinates ? 'border-green-500 text-green-600 bg-green-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
												{isLocating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : coordinates ? <CheckCircle className="w-4 h-4 mr-2" /> : <Navigation className="w-4 h-4 mr-2" />}
												Use Current Location
											</Button>
										</div>

										<AnimatePresence>
											{(approximateAddress || isFetchingAddress) && (
												<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white p-4 rounded-lg border border-emerald-200 shadow-inner flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
													<div className="flex flex-col gap-1 w-full">
														<span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Approximate Location Found:</span>
														{isFetchingAddress ? (
															<div className="flex items-center text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Translating coordinates...</div>
														) : (
															<span className="text-sm text-gray-800 font-medium">{approximateAddress}</span>
														)}
													</div>

													{/* Independent Save Button just for this location */}
													{coordinates && approximateAddress && !isFetchingAddress && (
														<Button onClick={handleAddLocationToDatabase} disabled={isLocationLoading} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
															{isLocationLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Add to Profile
														</Button>
													)}
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								)}
							</div>

						</motion.div>
					)}

					{/* --- TAB 4: BILLING & SUBSCRIPTION (FOR-PROFIT COMPANIES ONLY) --- */}
					{activeTab === "billing" && role === "company_collector" && companyType === "for-profit" && (
						<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
							<div>
								<h2 className="text-xl font-bold text-gray-900">Subscription Plan</h2>
								<p className="text-sm text-gray-500">Manage your billing to unlock premium logistics features.</p>
							</div>

							{/* Check if they have an active subscription */}
							{initialProfile?.stripeCurrentPeriodEnd && new Date(initialProfile.stripeCurrentPeriodEnd) > new Date() ? (
								<div className="border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/30 shadow-sm max-w-2xl p-6">
									<div className="flex justify-between items-start mb-6">
										<div>
											<div className="flex items-center gap-2 mb-1">
												<h3 className="text-lg font-bold text-emerald-900">Dawarha Pro</h3>
												<span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wider">Active</span>
											</div>
											<p className="text-sm text-emerald-700/80">Your company has full access to the Explore map and routing features.</p>
										</div>
										<div className="p-3 bg-white rounded-full shadow-sm border border-emerald-100 text-emerald-600">
											<Zap className="w-6 h-6" />
										</div>
									</div>
									<div className="pt-4 border-t border-emerald-100 flex justify-between items-center">
										<p className="text-xs text-emerald-600 font-medium">Renews on: {new Date(initialProfile.stripeCurrentPeriodEnd).toLocaleDateString()}</p>
										<Button
											variant="outline"
											className="text-emerald-700 border-emerald-200 hover:bg-emerald-100"
											disabled={isPending}
											onClick={() => startTransition(async () => {
												// Check for ID, throw toast, THEN return empty
												if (!initialProfile?.stripeCustomerId) {
													toast.error("No billing profile found.");
													return;
												}

												const res = await createStripePortalSession(initialProfile.stripeCustomerId);

												if (res.url) {
													window.location.href = res.url;
												} else {
													toast.error(res?.error || "Something went wrong.");
												}
											})}
										>
											{isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Manage Billing"}
										</Button>
									</div>
								</div>
							) : (
								<div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm max-w-2xl">
									<div className="p-6 border-b border-gray-100">
										<div className="flex justify-between items-start mb-4">
											<div>
												<h3 className="text-lg font-bold text-gray-900">Free Tier (Restricted)</h3>
												<p className="text-sm text-gray-500 mt-1">You are currently on the free tier. Upgrade to access real-time waste feeds.</p>
											</div>
											<div className="p-3 bg-gray-50 rounded-full border border-gray-100 text-gray-400">
												<CreditCard className="w-6 h-6" />
											</div>
										</div>
									</div>
									<div className="p-6 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
										<div>
											<p className="text-2xl font-black text-gray-900">$49<span className="text-sm font-medium text-gray-500"> / month</span></p>
											<p className="text-xs text-gray-500 mt-0.5">Cancel anytime.</p>
										</div>
										<Button
											onClick={() => startTransition(async () => {
												const res = await createStripeCheckoutSession(userId, baseUser.email);
												if (res.url) window.location.href = res.url;  // Redirecting to the Stripe Hosted Page
												else if (res.error) toast.error(res.error);
											})}
											disabled={isPending}
											className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
										>
											{isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
											Upgrade to Pro
										</Button>
									</div>
								</div>
							)}
						</motion.div>
					)}

				</CardContent>
			</Card>
		</div>
	);
}
