"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AnimatedHome({ user }: { user: any }) {
	return (
		<div className="relative w-full overflow-hidden min-h-[calc(100vh-4rem)] flex items-center justify-center">

			{/* --- BACKGROUND SHAPES --- */}
			<motion.div
				className="absolute -top-20 right-10 w-[500px] h-[500px] rounded-full bg-emerald-100/40"
				animate={{ y: [0, -20, 0], scale: [1, 1.02, 1] }}
				transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
			/>
			<motion.div
				className="absolute bottom-10 -left-20 w-[400px] h-[400px] rounded-full bg-green-100/40"
				animate={{ x: [0, 30, 0], rotate: [0, 10, 0] }}
				transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
			/>

			{/* Floating Dots */}
			<motion.div
				className="absolute top-1/4 left-1/4 w-4 h-4 bg-emerald-400 rounded-full"
				animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }}
				transition={{ duration: 3, repeat: Infinity }}
			/>
			<motion.div
				className="absolute bottom-1/3 right-1/4 w-6 h-6 bg-green-500 rounded-full"
				animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
				transition={{ duration: 4, repeat: Infinity }}
			/>

			{/* --- HERO CONTENT --- */}
			<div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className="inline-block mb-4 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold tracking-wide"
				>
					A Cleaner Future Starts Here 🌿
				</motion.div>

				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.1 }}
					className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6"
				>
					Recycle smarter with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">Dawarha.</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
					className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto"
				>
					Report waste, earn points, and help keep our communities clean. Join the eco-revolution today.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.3 }}
					className="flex flex-col sm:flex-row items-center justify-center gap-4"
				>
					{user ? (
						<Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base rounded-full">
							<Link href="/dashboard">Go to Dashboard</Link>
						</Button>
					) : (
						<>
							<Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-12 text-base rounded-full">
								<Link href="/register">Get Started</Link>
							</Button>
							<Button size="lg" variant="outline" asChild className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-8 h-12 text-base rounded-full">
								<Link href="/about">Learn More</Link>
							</Button>
						</>
					)}
				</motion.div>
			</div>
		</div>
	);
}
