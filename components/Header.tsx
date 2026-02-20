"use client";

import { Button } from "@/components/ui/button";
import { logOut } from "@/db/actions";
import Link from "next/link";
import { Leaf, Plus } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function Header({ user }: { user: any }) {
	// Animation variants for staggered link loading
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: { staggerChildren: 0.1 }
		}
	};

	const itemVariants: Variants = {
		hidden: { opacity: 0, y: -10 },
		show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
	};

	return (
		<header className="w-full bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">

					{/* Logo / Brand - Animated Pop */}
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
					>
						<Link href="/" className="flex items-center gap-2 shrink-0 text-2xl font-bold text-emerald-800 transition-transform hover:scale-105">
							<div className="bg-emerald-600 text-white flex size-8 items-center justify-center rounded-md">
								<Leaf className="size-5" />
							</div>
							Dawarha
						</Link>
					</motion.div>

					{/* Desktop navigation - Staggered Slide Down */}
					<motion.nav
						variants={containerVariants}
						initial="hidden"
						animate="show"
						className="hidden md:flex space-x-8 items-center"
					>
						<motion.div variants={itemVariants}>
							<Link href="/" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Home</Link>
						</motion.div>
						<motion.div variants={itemVariants}>
							<Link href="/about" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">About</Link>
						</motion.div>

						{user && (
							<>
								<motion.div variants={itemVariants}>
									<Link href="/dashboard" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Dashboard</Link>
								</motion.div>
								{/* Changed from Feed to Explore */}
								<motion.div variants={itemVariants}>
									<Link href="/explore" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Explore</Link>
								</motion.div>
								<motion.div variants={itemVariants}>
									<Link href="/settings" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Settings</Link>
								</motion.div>
							</>
						)}


					</motion.nav>

					{/* Action buttons - Fade In */}
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="flex items-center gap-4"
					>
						{user && (
							<span className="hidden md:block text-emerald-800 font-medium text-sm">
								{user.name}
							</span>
						)}

						{user ? (
							<div className="flex items-center gap-3">
								{/* The Dedicated Report Button */}
								<Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-transform hover:scale-105">
									<Link href="/report">
										<Plus className="w-4 h-4 mr-1" /> Report Waste
									</Link>
								</Button>

								<form action={logOut}>
									<Button variant="outline" size="sm" type="submit" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
										Logout
									</Button>
								</form>
							</div>
						) : (
							<>
								<Button variant="ghost" size="sm" asChild className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50">
									<Link href="/login">Login</Link>
								</Button>
								<Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white transition-transform hover:scale-105">
									<Link href="/register">Sign Up</Link>
								</Button>
							</>
						)}
					</motion.div>
				</div>
			</div>
		</header>
	);
}
