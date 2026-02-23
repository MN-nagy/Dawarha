"use client";

import { motion, animate, useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Leaf, MapPin, Truck, Coins, ShieldCheck, Factory, Users, ArrowRight, Sparkles, Shield } from "lucide-react";
import { Variants } from "framer-motion";

// --- Custom Animated Counter Component ---
function AnimatedCounter({ value }: { value: number }) {
	const ref = useRef<HTMLSpanElement>(null);
	const inView = useInView(ref, { once: true, margin: "-100px" });

	useEffect(() => {
		if (inView && ref.current) {
			const controls = animate(0, value, {
				duration: 2.5,
				ease: "easeOut",
				onUpdate(val) {
					if (ref.current) {
						ref.current.textContent = Math.round(val).toLocaleString();
					}
				}
			});
			return () => controls.stop();
		}
	}, [value, inView]);

	return <span ref={ref}>0</span>;
}

export default function AnimatedHome({ user, stats }: { user: any, stats: any }) {

	// Scroll Animation Variants
	const fadeUp: Variants = {
		hidden: { opacity: 0, y: 40 },
		visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
	};

	const staggerContainer: Variants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
	};

	return (
		<div className="relative w-full">

			{/* --- FIXED BACKGROUND ANIMATIONS --- */}
			<div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
				<motion.div
					className="absolute -top-20 right-10 w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl"
					animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
					transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
				/>
				<motion.div
					className="absolute bottom-10 -left-20 w-[400px] h-[400px] rounded-full bg-green-100/40 blur-3xl"
					animate={{ x: [0, 40, 0], rotate: [0, 15, 0] }}
					transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
				/>
			</div>

			{/* --- SECTION 1: HERO --- */}
			<section className="relative z-10 min-h-[calc(100vh-4rem)] flex items-center justify-center pt-10 pb-20">
				<div className="text-center px-4 max-w-4xl mx-auto">

					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.8, type: "spring" }}
						className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm font-semibold tracking-wide shadow-sm"
					>
						<Sparkles className="w-4 h-4 text-emerald-500" /> A Cleaner Future Starts Here
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.1 }}
						className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight"
					>
						Recycle smarter with <br className="hidden md:block" />
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-500">Dawarha.</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
						className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed"
					>
						The intelligent logistics network bridging the gap between households, collectors, and recycling facilities. Report waste, earn points, and make an impact.
					</motion.p>

					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.3 }}
						className="flex flex-col sm:flex-row items-center justify-center gap-4"
					>
						{user ? (
							<Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 text-lg rounded-full shadow-lg hover:shadow-emerald-600/20 transition-all hover:-translate-y-1">
								<Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" /></Link>
							</Button>
						) : (
							<>
								<Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 text-lg rounded-full shadow-lg hover:shadow-emerald-600/20 transition-all hover:-translate-y-1">
									<Link href="/register">Join the Network</Link>
								</Button>
								<Button size="lg" variant="outline" asChild className="border-emerald-200 bg-white/50 backdrop-blur-sm text-emerald-800 hover:bg-emerald-50 px-8 h-14 text-lg rounded-full transition-all hover:-translate-y-1">
									<Link href="/about">Learn More</Link>
								</Button>
							</>
						)}
					</motion.div>
				</div>
			</section>

			{/* --- SECTION 2: LIVE IMPACT STATS --- */}
			<section className="relative z-10 py-20 bg-white/60 backdrop-blur-md border-y border-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
						className="text-center mb-12"
					>
						<h2 className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-2">Platform Scale</h2>
						<h3 className="text-3xl font-bold text-gray-900">Our Real-Time Impact</h3>
					</motion.div>

					<motion.div
						variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
					>
						<motion.div variants={fadeUp}>
							<div className="text-5xl font-black text-emerald-600 mb-2">
								<AnimatedCounter value={stats.reports} />
							</div>
							<div className="text-gray-600 font-medium">Waste Reports Filed</div>
						</motion.div>
						<motion.div variants={fadeUp}>
							<div className="text-5xl font-black text-blue-600 mb-2">
								<AnimatedCounter value={stats.collections} />
							</div>
							<div className="text-gray-600 font-medium">Successful Pickups</div>
						</motion.div>
						<motion.div variants={fadeUp}>
							<div className="text-5xl font-black text-indigo-600 mb-2">
								<AnimatedCounter value={stats.users} />
							</div>
							<div className="text-gray-600 font-medium">Active Eco-Warriors</div>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* --- SECTION 3: HOW IT WORKS --- */}
			<section className="relative z-10 py-24">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How Dawarha Works</h2>
						<p className="text-gray-600 max-w-2xl mx-auto">Three simple steps to clean up your community and get rewarded for your environmental responsibility.</p>
					</motion.div>

					<motion.div
						variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-3 gap-12"
					>
						<motion.div variants={fadeUp} whileHover={{ y: -10 }} className="text-center relative p-6 rounded-3xl transition-colors hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-100">
							<div className="w-20 h-20 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
								<MapPin className="w-10 h-10 text-emerald-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">1. Pin & Report</h3>
							<p className="text-gray-600">Snap a photo of the waste, tag your location, and our AI instantly estimates the material and weight.</p>
						</motion.div>

						<motion.div variants={fadeUp} whileHover={{ y: -10 }} className="text-center relative p-6 rounded-3xl transition-colors hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-100">
							<div className="w-20 h-20 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-200">
								<Truck className="w-10 h-10 text-blue-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">2. Quick Collection</h3>
							<p className="text-gray-600">Solo collectors and company fleets use the Dawarha Radar to find and claim waste near their active routes.</p>
						</motion.div>

						<motion.div variants={fadeUp} whileHover={{ y: -10 }} className="text-center relative p-6 rounded-3xl transition-colors hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-100">
							<div className="w-20 h-20 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-amber-200">
								<Coins className="w-10 h-10 text-amber-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-3">3. Earn Rewards</h3>
							<p className="text-gray-600">Once the pickup is completed, points are securely transferred to your account. Rank up and climb the leaderboard!</p>
						</motion.div>
					</motion.div>
				</div>
			</section>

			{/* --- SECTION 4: BUILT FOR EVERYONE --- */}
			<section className="relative z-10 py-24 bg-gray-50/80 border-t border-gray-100">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">An Ecosystem Built for You</h2>
						<p className="text-gray-600 max-w-2xl mx-auto">Select your role and get access to tailored tools designed for your specific recycling needs.</p>
					</motion.div>

					<motion.div
						variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}
						className="grid grid-cols-1 md:grid-cols-3 gap-8"
					>
						{/* Member Card */}
						<motion.div variants={fadeUp} whileHover={{ scale: 1.02, y: -5 }} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 transition-all cursor-default">
							<Users className="w-8 h-8 text-emerald-500 mb-6" />
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Household Member</h3>
							<p className="text-gray-600 mb-6">Perfect for individuals who want to report waste, clear their homes, and earn gamified rewards.</p>
							<ul className="space-y-3 text-sm font-medium text-gray-700">
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Earn Points & Badges</motion.li>
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Track AI-Valued Waste</motion.li>
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Personal Impact Analytics</motion.li>
							</ul>
						</motion.div>

						{/* Solo Collector Card */}
						<motion.div variants={fadeUp} whileHover={{ scale: 1.02, y: -5 }} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 transition-all cursor-default">
							<Truck className="w-8 h-8 text-blue-500 mb-6" />
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Independent Collector</h3>
							<p className="text-gray-600 mb-6">Designed for freelancers and local drivers looking to optimize their daily pickup routes.</p>
							<ul className="space-y-3 text-sm font-medium text-gray-700">
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" /> Live Radar Access</motion.li>
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><Shield it-Check className="w-4 h-4 text-blue-500" /> Turn-by-Turn Navigation</motion.li>
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" /> Route Management</motion.li>
							</ul>
						</motion.div>

						{/* Company Card */}
						<motion.div variants={fadeUp} whileHover={{ scale: 1.02, y: -5 }} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 transition-all cursor-default">
							<Factory className="w-8 h-8 text-indigo-500 mb-6" />
							<h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Facility</h3>
							<p className="text-gray-600 mb-6">For recycling plants and massive fleets requiring logistics oversight and corporate reporting.</p>
							<ul className="space-y-3 text-sm font-medium text-gray-700">
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Material Composition Analytics</motion.li>
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> CO₂ ESG Reporting</motion.li>
								<motion.li whileHover={{ x: 5 }} className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-indigo-500" /> Bulk Fleet Claiming</motion.li>
							</ul>
						</motion.div>
					</motion.div>
				</div>
			</section>

		</div>
	);
}
