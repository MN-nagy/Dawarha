"use client";

import { SignupForm } from "@/components/signup-form";
import { motion } from "framer-motion";
import { GalleryVerticalEnd } from "lucide-react";

export default function SignupPage() {
	return (
		<div className="relative min-h-screen w-full bg-white overflow-hidden flex items-center justify-center p-6 md:p-10">

			{/* --- BACKGROUND SHAPES --- */}

			{/* Shape 1: Big Emerald Circle (Top Right Corner) */}
			<motion.div
				className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-100/50"
				animate={{ y: [0, 20, 0], scale: [1, 1.05, 1] }}
				transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
			/>

			{/* Shape 2: Green Pill (Bottom Left Corner) */}
			<motion.div
				className="absolute bottom-10 -left-10 w-64 h-32 rounded-full bg-green-100/60"
				animate={{ x: [0, 30, 0], rotate: [0, 5, 0] }}
				transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
			/>

			{/* Shape 3: Donut Ring (Top Left - Pushed further left) */}
			<motion.div
				// Changed 'left-10' to 'left-4' to keep it visible but out of the way
				className="absolute top-20 left-4 w-24 h-24 border-8 border-emerald-500/20 rounded-full"
				animate={{ y: [0, -30, 0] }}
				transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
			/>

			{/* Shape 4: Decorative Dots (STRETCHED TO EDGES) */}

			{/* Dot 1: Moved from 'right-1/4' to 'right-10' (Far right edge) */}
			<motion.div
				className="absolute bottom-1/3 right-70 w-6 h-6 bg-green-500 rounded-full"
				animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
				transition={{ duration: 3, repeat: Infinity }}
			/>

			{/* Dot 2: Moved from 'left-1/4' to 'left-10' (Far left edge, vertically centered) */}
			<motion.div
				className="absolute top-1/2 left-70 w-4 h-4 bg-emerald-400 rounded-full"
				animate={{ y: [0, -20, 0] }}
				transition={{ duration: 2, repeat: Infinity }}
			/>

			{/* Dot 3: Added a tiny new one at the very top center for balance */}
			<motion.div
				className="absolute top-6 left-1/2 w-3 h-3 bg-emerald-300 rounded-full"
				animate={{ opacity: [0, 1, 0] }}
				transition={{ duration: 4, repeat: Infinity }}
			/>

			{/* --- CONTENT LAYER --- */}
			<div className="relative z-10 w-full max-w-sm md:max-w-4xl flex flex-col items-center">

				{/* Brand Logo */}
				<div className="mb-6 flex items-center gap-2 font-medium text-emerald-900">
					<div className="bg-emerald-600 text-white flex size-6 items-center justify-center rounded-md">
						<GalleryVerticalEnd className="size-4" />
					</div>
					Dawarha Inc.
				</div>

				<SignupForm />
			</div>
		</div>
	);
}
