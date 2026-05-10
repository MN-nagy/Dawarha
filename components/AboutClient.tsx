"use client";

import { motion } from "framer-motion";
import { Leaf, Target, Users, Globe2, Recycle, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Variants } from "framer-motion";

export default function AboutClient({ user }: { user: any }) {
	// --- Content Animation Variants ---
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.15, delayChildren: 0.1 }
		}
	};

	const itemVariants: Variants = {
		hidden: { y: 20, opacity: 0 },
		visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 20 } }
	};

	const ctaVariants: Variants = {
		hidden: { opacity: 0, scale: 0.95, y: 40 },
		visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20, delay: 0.4 } }
	};

	// --- Background Animation Variants (Continuous floating) ---
	const floatVariant1: Variants = {
		animate: {
			y: [0, -20, 0],
			x: [0, 15, 0],
			rotate: [0, 5, 0],
			transition: { duration: 8, repeat: Infinity, ease: "easeInOut" }
		}
	};

	const floatVariant2: Variants = {
		animate: {
			y: [0, 25, 0],
			x: [0, -10, 0],
			rotate: [0, -5, 0],
			transition: { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }
		}
	};

	const spinVariant: Variants = {
		animate: {
			rotate: 360,
			transition: { duration: 40, repeat: Infinity, ease: "linear" }
		}
	};


	return (
		<main className="grow relative overflow-hidden md:py-12">

			{/* BACKGROUND ANIMATION LAYER */}
			<div className="absolute inset-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
				{/* Soft Gradient Blobs */}
				<motion.div
					variants={floatVariant1} animate="animate"
					className="absolute top-0 left-0 w-125 h-125 bg-emerald-200/30 rounded-full blur-3xl opacity-60 -translate-x-1/2 -translate-y-1/4"
				/>
				<motion.div
					variants={floatVariant2} animate="animate"
					className="absolute bottom-0 right-0 w-100 h-100 bg-green-100/40 rounded-full blur-3xl opacity-60 translate-x-1/3 translate-y-1/3"
				/>

				{/* Thematic Floating Icons */}
				<motion.div variants={floatVariant1} animate="animate" className="absolute top-1/4 left-10 text-emerald-800/5">
					<Leaf className="w-24 h-24 transform -rotate-12" />
				</motion.div>
				<motion.div variants={spinVariant} animate="animate" className="absolute top-1/3 right-20 text-emerald-800/10">
					<Recycle className="w-40 h-40" />
				</motion.div>
				<motion.div variants={floatVariant2} animate="animate" className="absolute bottom-1/4 left-1/4 text-blue-800/5">
					<ArrowUpRight className="w-20 h-20" />
				</motion.div>
			</div>


			{/* MAIN FOREGROUND CONTENT */}
			<div className="relative z-10 max-w-4xl mx-auto w-full p-6">
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
				>
					{/* Hero Section */}
					<div className="text-center mb-16 mt-8">
						<motion.div variants={itemVariants} className="inline-flex items-center justify-center p-3 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-2xl mb-6 shadow-sm">
							<Leaf className="w-8 h-8 text-emerald-600" />
						</motion.div>
						<motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">
							Turning Waste into <span className="text-emerald-600">Value.</span>
						</motion.h1>
						<motion.p variants={itemVariants} className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-medium">
							Dawarha is a next-generation logistics platform bridging the gap between everyday people who want to recycle, and the network of collectors and enterprises capable of processing it.
						</motion.p>
					</div>

					{/* Core Values Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
						<motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
							<Target className="w-6 h-6 text-emerald-500 mb-4" />
							<h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
							<p className="text-gray-600 leading-relaxed">
								To eliminate the friction in the global recycling supply chain. We believe that by gamifying the collection process and rewarding users, we can drastically reduce the amount of reusable material ending up in landfills.
							</p>
						</motion.div>

						<motion.div variants={itemVariants} className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
							<Users className="w-6 h-6 text-blue-500 mb-4" />
							<h3 className="text-xl font-bold text-gray-900 mb-2">The Community</h3>
							<p className="text-gray-600 leading-relaxed">
								Whether you are a regular household reporting a few plastic bottles, a solo collector running daily routes, or an enterprise tracking your ESG metrics, Dawarha provides the tools you need to make an impact.
							</p>
						</motion.div>
					</div>
				</motion.div>

				{/* Closing Statement */}
				<motion.div
					variants={ctaVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-100px" }}
					className="bg-emerald-900 text-white rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-xl"
				>
					{/* Subtle background icon animation inside the CTA card */}
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
						className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10"
					>
						<Globe2 className="w-64 h-64" />
					</motion.div>

					<div className="relative z-10">
						<h2 className="text-2xl md:text-3xl font-bold mb-4">Join the Movement</h2>
						<p className="text-emerald-100 mb-8 max-w-xl mx-auto text-lg">
							Every single report, pickup, and collection matters. Start earning points  and making a tangible difference today.
						</p>
						{!user && (
							<Button asChild size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold rounded-full shadow-lg hover:scale-105 transition-transform px-8 h-12 text-base">
								<Link href="/register">Create an Account</Link>
							</Button>
						)}
					</div>
				</motion.div>
			</div>

		</main>
	);
}
