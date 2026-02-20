"use client";

import { useActionState, useState, useEffect, useRef, startTransition, SubmitEventHandler } from "react";
import { createReport, analyzeWasteImage } from "@/db/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, X, Sparkles, Loader2, Coins, Upload, CheckCircle, Search, Navigation } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { toast } from "sonner";

export function ReportForm() {
	const [state, formAction, isPending] = useActionState(createReport, null);

	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const [wasteType, setWasteType] = useState<string>("plastic");
	const [amount, setAmount] = useState<string>("");
	const [description, setDescription] = useState<string>("");
	const [additionalWaste, setAdditionalWaste] = useState<string>("");
	const [scale, setScale] = useState<string>("small");

	// 👇 NEW: OpenStreetMap States 👇
	const [_locationQuery, setLocationQuery] = useState("");
	const [_osmResults, setOsmResults] = useState<any[]>([]);
	const [_isSearchingOSM, setIsSearchingOSM] = useState(false);
	const [coordinates, setCoordinates] = useState<{ lat: string, lng: string } | null>(null);
	const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// 👇 The Strict Coordinate States 👇
	const [manualCoords, setManualCoords] = useState("");
	const [approximateAddress, setApproximateAddress] = useState<string>("");
	const [isFetchingAddress, setIsFetchingAddress] = useState(false);
	const [isLocating, setIsLocating] = useState(false);


	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const { startUpload, isUploading } = useUploadThing("wasteImage");
	const formRef = useRef<HTMLFormElement>(null);

	// Clear form on success
	useEffect(() => {
		if (state?.success) {
			toast.success("Waste reported successfully!", {
				description: "Thank you for keeping Dawarha clean. You've earned points!",
			});
			setSelectedFile(null);
			setPreviewUrl(null);
			setAmount("");
			setDescription("");
			setAdditionalWaste("");
			setWasteType("plastic");
			setLocationQuery("");
			setCoordinates(null);
			setOsmResults([]);
			formRef.current?.reset();
		}
	}, [state]);

	// ... [Keep your handleFileChange, handleDragOver, handleDragLeave, handleDrop exactly the same] ...
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setSelectedFile(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};
	const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
	const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault(); setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0];
			setSelectedFile(file);
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	// AI Auto-Fill
	const handleAIAutoFill = async () => {
		if (!selectedFile) return;
		setIsAnalyzing(true);
		try {
			const aiData = new FormData();
			aiData.append("file", selectedFile);
			aiData.append("description", description);

			const result = await analyzeWasteImage(aiData);

			if (result.success && result.data) {
				setWasteType(result.data.wasteType);
				setAmount(result.data.amount);
				setAdditionalWaste(result.data.additionalWaste || "");
			} else {
				alert(`AI Error: ${result.error}`);
			}
		} catch (error) {
			alert("Something went wrong talking to Gemini.");
		} finally {
			setIsAnalyzing(false);
		}
	};

	// Form Submit
	const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		const form = e.currentTarget as HTMLFormElement;

		if (!selectedFile) return;

		try {
			const uploadResult = await startUpload([selectedFile]);
			if (!uploadResult || !uploadResult[0]) throw new Error("Failed to upload image.");

			const formData = new FormData(form);
			formData.set("imageUrl", uploadResult[0].ufsUrl);

			startTransition(() => {
				formAction(formData);
			});
		} catch (error: any) {
			alert(`Submission Error: ${error.message}`);
		}
	};


	// 👇 NEW: The Debounced OSM Search Function 👇
	const handleLocationType = (e: React.ChangeEvent<HTMLInputElement>) => {
		const text = e.target.value;
		setLocationQuery(text);
		setCoordinates(null); // Reset coordinates if they start typing again

		// Clear the previous timer (The Bartender waits...)
		if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

		if (text.length < 3) {
			setOsmResults([]);
			return;
		}

		// Set a new timer for 500ms
		searchTimeoutRef.current = setTimeout(async () => {
			setIsSearchingOSM(true);
			try {
				// Fetch from the free OpenStreetMap Nominatim API
				const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&countrycodes=eg&limit=5`);
				const data = await res.json();
				setOsmResults(data);
			} catch (error) {
				console.error("OSM Error:", error);
			} finally {
				setIsSearchingOSM(false);
			}
		}, 500);
	};

	const fetchAddressFromCoords = async (lat: string, lng: string) => {
		setIsFetchingAddress(true);
		try {
			// Ask OpenStreetMap what is at this exact spot
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

	// When the user clicks a result from the dropdown
	const selectOSMResult = (result: any) => {
		setLocationQuery(result.display_name); // Put the full address in the input
		setCoordinates({ lat: result.lat, lng: result.lon }); // Save exact coords
		setOsmResults([]); // Hide the dropdown
	};

	const handleGetLocation = () => {
		setIsLocating(true);
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const lat = position.coords.latitude.toString();
					const lng = position.coords.longitude.toString();

					setCoordinates({ lat, lng });
					setManualCoords(`${lat}, ${lng}`); // Auto-fill the text box
					fetchAddressFromCoords(lat, lng);  // Fetch the human-readable address

					setIsLocating(false);
				},
				(error) => {
					alert("Could not get location. Please ensure location services are enabled.");
					setIsLocating(false);
				},
				{ enableHighAccuracy: true }
			);
		} else {
			alert("Geolocation is not supported by this browser.");
			setIsLocating(false);
		}
	};

	useEffect(() => {
		const timeout = setTimeout(() => {
			if (manualCoords.includes(',')) {
				const [lat, lng] = manualCoords.split(',').map(s => s.trim());
				// Verify they are actual numbers
				if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
					setCoordinates({ lat, lng });
					fetchAddressFromCoords(lat, lng);
				}
			}
		}, 800);

		return () => clearTimeout(timeout);
	}, [manualCoords]);

	// Animation Variants
	const containerVariants: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
	const itemVariants: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

	return (
		<Card className="border-emerald-100 shadow-xl overflow-hidden">
			<CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
				<CardTitle className="text-emerald-800 flex items-center gap-2">♻️ Report Waste Details</CardTitle>
			</CardHeader>

			<CardContent className="p-6">
				<motion.form ref={formRef} onSubmit={handleSubmit} className="space-y-6" variants={containerVariants} initial="hidden" animate="show">

					{/* ... [Success/Error Messages] ... */}
					{ /* commented out for now "testing toast" */}
					{/* <AnimatePresence> */}
					{/* 	{state?.success && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4">🎉 {state.success}</motion.div>)} */}
					{/* 	{state?.error && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">⚠️ {state.error}</motion.div>)} */}
					{/* </AnimatePresence> */}

					<input type="hidden" name="scale" value={scale} />

					{/* 1. Image Upload */}
					<motion.div variants={itemVariants} className="space-y-2">
						<Label className="text-gray-700 font-semibold">1. Photo Evidence (Required)</Label>
						{previewUrl ? (
							<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-lg overflow-hidden border-2 border-emerald-200 shadow-sm">
								<img src={previewUrl} alt="Local Preview" className="w-full h-56 object-cover" />
								<button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-red-500/90 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-sm backdrop-blur-sm"><X className="w-4 h-4" /></button>
								<div className="absolute bottom-2 left-2 right-2">
									<Button type="button" onClick={handleAIAutoFill} disabled={isAnalyzing} className="w-full bg-indigo-600/95 hover:bg-indigo-700 text-white shadow-lg backdrop-blur-md border border-indigo-400/30 transition-all active:scale-95">
										{isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing Waste...</> : <><Sparkles className="w-4 h-4 mr-2 text-indigo-200" /> Auto-Fill Type & Amount with AI</>}
									</Button>
								</div>
							</motion.div>
						) : (
							<>
								<Label htmlFor="image-upload" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${isDragging ? "border-emerald-500 bg-emerald-100/80 scale-[1.02]" : "border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50 hover:border-emerald-300"}`}>
									<div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? "bg-emerald-200" : "bg-emerald-100"}`}><Upload className={`w-8 h-8 ${isDragging ? "text-emerald-700" : "text-emerald-600"}`} /></div>
									<span className="text-base font-semibold text-emerald-800">{isDragging ? "Drop image here!" : "Click or drag an image here"}</span>
									<span className="text-xs text-emerald-500 mt-1">PNG, JPG up to 4MB</span>
								</Label>
								<input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
							</>
						)}
					</motion.div>

					{/* 2. Description */}
					<motion.div variants={itemVariants} className="space-y-2 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
						<div className="flex justify-between items-center">
							<Label htmlFor="description">2. Description</Label>
							<Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200"><Coins className="w-3 h-3 mr-1" /> +5 Bonus Points</Badge>
						</div>
						<Textarea id="description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Help our AI by describing the waste..." className="bg-white" />
					</motion.div>

					{/* 3. Materials Grid */}
					<motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 border border-emerald-100 bg-emerald-50/20 p-4 rounded-lg">
						<div className="space-y-2">
							<Label htmlFor="wasteType">Dominant Waste Type</Label>
							<Select name="wasteType" value={wasteType} onValueChange={setWasteType} required>
								<SelectTrigger className="bg-white"><SelectValue placeholder="Select type" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="plastic">Plastic</SelectItem>
									<SelectItem value="metal">Metal</SelectItem>
									<SelectItem value="glass">Glass</SelectItem>
									<SelectItem value="paper">Paper/Cardboard</SelectItem>
									<SelectItem value="organic">Organic</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="amount">Dominant Amount</Label>
							<Input id="amount" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g., 4kg" className="bg-white" required />
						</div>
					</motion.div>

					{/* 4. Additional Waste (Mandatory) */}
					<motion.div variants={itemVariants} className="space-y-2">
						<Label htmlFor="additionalWaste" className="text-gray-900 font-semibold">Other Waste Present (Mandatory)</Label>
						<Input id="additionalWaste" name="additionalWaste" value={additionalWaste} onChange={(e) => setAdditionalWaste(e.target.value)} placeholder="e.g., 3kg organic (Or type 'None')" required />
					</motion.div>

					<motion.div variants={itemVariants} className="space-y-4 p-4 border border-emerald-100 bg-emerald-50/20 rounded-xl">
						<div className="flex justify-between items-center">
							<Label className="text-emerald-800 font-semibold">5. Exact Location (Required)</Label>
						</div>

						{/* Input Area: Manual Coords OR GPS Button */}
						<div className="flex flex-col md:flex-row gap-3 items-end">
							<div className="relative flex-grow w-full">
								<Label htmlFor="manualCoords" className="text-xs font-semibold text-gray-600 mb-1 block">Paste Coordinates (Lat, Lng)</Label>
								<MapPin className="absolute left-3 top-8 h-4 w-4 text-emerald-500 z-10" />
								<Input
									id="manualCoords"
									value={manualCoords}
									onChange={(e) => setManualCoords(e.target.value)}
									placeholder="e.g., 30.0444, 31.2357"
									className="pl-9 bg-white"
									autoComplete="off"
								/>
							</div>

							<div className="hidden md:flex pb-3 text-emerald-400 font-bold text-xs uppercase">
								OR
							</div>

							<Button
								type="button"
								variant={coordinates ? "outline" : "default"}
								onClick={handleGetLocation}
								disabled={isLocating}
								className={`w-full md:w-auto shrink-0 shadow-sm h-10 ${coordinates ? 'border-green-500 text-green-600 bg-green-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
							>
								{isLocating ? (
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
								) : coordinates ? (
									<CheckCircle className="w-4 h-4 mr-2" />
								) : (
									<Navigation className="w-4 h-4 mr-2" />
								)}
								Use Current Location
							</Button>
						</div>

						{/* The Acknowledgment UI */}
						<AnimatePresence>
							{(approximateAddress || isFetchingAddress) && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: "auto" }}
									className="bg-white p-3 rounded-lg border border-emerald-200 shadow-inner flex flex-col gap-1 mt-2"
								>
									<span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
										Approximate Location Found:
									</span>

									{isFetchingAddress ? (
										<div className="flex items-center text-sm text-gray-500">
											<Loader2 className="w-4 h-4 animate-spin mr-2" /> Translating coordinates...
										</div>
									) : (
										<span className="text-sm text-gray-800 font-medium">
											{approximateAddress}
										</span>
									)}
								</motion.div>
							)}
						</AnimatePresence>

						{/* Hidden Payload for Database */}
						{/* We use the fetched address as the string so the DB still has readable text */}
						<input type="hidden" name="location" value={approximateAddress || manualCoords} />
						<input type="hidden" name="latitude" value={coordinates?.lat || ""} />
						<input type="hidden" name="longitude" value={coordinates?.lng || ""} />
					</motion.div>

					<motion.div variants={itemVariants}>
						<Button
							type="submit"
							className="w-full bg-emerald-600 hover:bg-emerald-700"
							disabled={isPending || isUploading || !selectedFile || isAnalyzing || !coordinates} // 👈 MUST have coordinates
						>
							{isUploading || isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Submit Report"}
						</Button>
					</motion.div>
				</motion.form>
			</CardContent>
		</Card>
	);
}
