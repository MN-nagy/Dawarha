"use client";

import { motion } from "framer-motion";

export default function AnimatedReport({ children }: { children: React.ReactNode }) {
	// Hardcoded particle configs to prevent React Hydration mismatch errors
	const particles = [
		{ size: 12, top: "20%", left: "15%", color: "bg-emerald-400", duration: 7, delay: 0 },
		{ size: 8, top: "60%", left: "10%", color: "bg-green-300", duration: 8, delay: 2 },
		{ size: 10, top: "30%", left: "85%", color: "bg-emerald-300", duration: 6, delay: 1 },
		{ size: 14, top: "75%", left: "80%", color: "bg-indigo-300", duration: 9, delay: 3 },
		{ size: 6, top: "85%", left: "40%", color: "bg-green-400", duration: 5, delay: 4 },
		{ size: 16, top: "10%", left: "60%", color: "bg-emerald-200", duration: 10, delay: 2 },
	];

	return (
		<div className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-gradient-to-br from-white via-gray-50 to-emerald-50/20 flex flex-col items-center py-10 px-4 md:px-10">

			{/* --- 1. AMBIENT BACKGROUND BLOBS (The Soft Mesh) --- */}

			{/* Top Left Blob */}
			<motion.div
				className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-200/20 blur-3xl pointer-events-none"
				animate={{
					x: [0, 50, 0],
					y: [0, 30, 0],
					scale: [1, 1.1, 1],
				}}
				transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
			/>

			{/* Bottom Right Blob */}
			<motion.div
				className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-green-200/20 blur-3xl pointer-events-none"
				animate={{
					x: [0, -40, 0],
					y: [0, -50, 0],
					scale: [1, 1.2, 1],
				}}
				transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
			/>

			{/* Center Right Accent Blob (Subtle Indigo) */}
			<motion.div
				className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-indigo-100/30 blur-3xl pointer-events-none"
				animate={{
					x: [0, -30, 0],
					y: [0, 40, 0],
				}}
				transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
			/>

			{/* --- 2. FLOATING ECO-PARTICLES (The Fireflies) --- */}
			{particles.map((particle, i) => (
				<motion.div
					key={i}
					className={`absolute rounded-full pointer-events-none ${particle.color}`}
					style={{
						width: particle.size,
						height: particle.size,
						top: particle.top,
						left: particle.left,
						opacity: 0.3,
					}}
					animate={{
						y: [0, -60, -120],
						x: [0, i % 2 === 0 ? 20 : -20, 0],
						opacity: [0, 0.6, 0],
						scale: [0.5, 1, 0.5],
					}}
					transition={{
						duration: particle.duration,
						repeat: Infinity,
						ease: "easeInOut",
						delay: particle.delay,
					}}
				/>
			))}

			{/* --- CONTENT WRAPPER --- */}
			<div className="relative z-10 w-full max-w-3xl">

				{/* Animated Header Text */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-8 text-center"
				>
					<h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Report Waste</h1>
					<p className="text-gray-500 text-lg max-w-xl mx-auto">
						Snap a photo, categorize it, and earn points for keeping the environment clean.
					</p>
				</motion.div>

				{/* Animated Form Container */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
				>
					{children}
				</motion.div>
			</div>
		</div>
	);
}
