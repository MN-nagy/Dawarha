"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logOut } from "@/db/actions";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf, Plus, ChevronDown, Settings, LogOut, LayoutDashboard, Compass, Radar, User, Info, Bug, Coins } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

export default function Header({ user }: { user: any }) {
	const pathname = usePathname() || "";
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// --- WALLET ANIMATION STATE ---
	const [balanceNotification, setBalanceNotification] = useState<{ change: number; id: number } | null>(null);
	const prevBalanceRef = useRef(user?.balance || 0);

	// Watch for balance changes to trigger the animation
	useEffect(() => {
		const currentBalance = user?.balance || 0;
		const diff = currentBalance - prevBalanceRef.current;

		if (diff !== 0) {
			setBalanceNotification({ change: diff, id: Date.now() });
			prevBalanceRef.current = currentBalance;

			// Auto-hide the notification after 2 seconds
			const timer = setTimeout(() => setBalanceNotification(null), 2000);
			return () => clearTimeout(timer);
		}
	}, [user?.balance]);


	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	// Animation variants
	const containerVariants: Variants = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { staggerChildren: 0.1 } }
	};
	const itemVariants: Variants = {
		hidden: { opacity: 0, y: -10 },
		show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } }
	};

	// Main Navigation Links
	const navLinks = [
		{ name: "Home", path: "/", icon: null },
		{ name: "About", path: "/about", icon: Info },
		{ name: "Explore", path: "/explore", icon: Compass },
		{ name: "Radar", path: "/feed", icon: Radar },
		{ name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
	];

	const getInitials = (name: string) => {
		return name ? name.charAt(0).toUpperCase() : "U";
	};

	return (
		<header className="w-full bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-16">

					{/* Logo / Brand */}
					<motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}>
						<Link href="/" className="flex items-center gap-2 shrink-0 text-xl font-black tracking-tight text-emerald-900 transition-transform hover:scale-105">
							<div className="bg-emerald-600 text-white flex size-8 items-center justify-center rounded-lg shadow-sm border border-emerald-500">
								<Leaf className="size-5" />
							</div>
							Dawarha
						</Link>
					</motion.div>

					{/* Desktop Navigation */}
					<motion.nav variants={containerVariants} initial="hidden" animate="show" className="hidden md:flex space-x-1 items-center bg-gray-50/50 p-1 rounded-full border border-gray-100">
						{navLinks.map((link) => {
							if (link.name === "Radar" && (!user || user.role === "member")) return null;
							if (link.name === "Dashboard" && !user) return null;

							const isActive = pathname === link.path || (link.path !== "/" && pathname.startsWith(link.path));

							return (
								<motion.div key={link.name} variants={itemVariants}>
									<Link
										href={link.path}
										className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${isActive
											? "bg-white text-emerald-700 shadow-sm border border-gray-200/50"
											: "text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50"
											}`}
									>
										{link.icon && <link.icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />}
										{link.name}
									</Link>
								</motion.div>
							);
						})}
					</motion.nav>

					{/* Actions & User Profile */}
					<motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex items-center gap-3">

						{user ? (
							<>
								{/* WALLET BADGE - HIDE IF COMPANY */}
								{user.role !== "company_collector" && (
									<Link href="/rewards" className="relative hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-emerald-50 hover:border-emerald-200 transition-colors group">
										<div className="bg-emerald-100 p-1 rounded-full group-hover:scale-110 transition-transform">
											<Coins className="w-4 h-4 text-emerald-600" />
										</div>
										<span className="text-sm font-bold text-gray-700 group-hover:text-emerald-700">{user.balance}</span>

										<AnimatePresence mode="popLayout">
											{balanceNotification && (
												<motion.div
													key={balanceNotification.id}
													initial={{ opacity: 0, y: 10, x: "-50%" }}
													animate={{ opacity: 1, y: -20 }}
													exit={{ opacity: 0 }}
													className={`absolute left-1/2 -translate-x-1/2 text-xs font-black ${balanceNotification.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}
												>
													{balanceNotification.change > 0 ? '+' : ''}{balanceNotification.change}
												</motion.div>
											)}
										</AnimatePresence>
									</Link>
								)}

								{/* REPORT BUTTON - HIDE IF COMPANY */}
								{user.role !== "company_collector" && (
									<Button size="sm" asChild className="hidden sm:flex bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-transform hover:scale-105 rounded-full px-4 font-bold">
										<Link href="/report">
											<Plus className="w-4 h-4 mr-1" /> Report Waste
										</Link>
									</Button>
								)}

								{/* User Profile Dropdown */}
								<div className="relative ml-2" ref={dropdownRef}>
									<button
										onClick={() => setIsDropdownOpen(!isDropdownOpen)}
										className={`flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border transition-all duration-200 ${isDropdownOpen ? 'bg-emerald-50 border-emerald-200 shadow-inner' : 'bg-white border-gray-200 hover:border-emerald-200 hover:bg-gray-50 shadow-sm'}`}
									>
										<div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">
											{getInitials(user.name)}
										</div>
										<ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
									</button>

									<AnimatePresence>
										{isDropdownOpen && (
											<motion.div
												initial={{ opacity: 0, y: 10, scale: 0.95 }}
												animate={{ opacity: 1, y: 0, scale: 1 }}
												exit={{ opacity: 0, y: 10, scale: 0.95 }}
												transition={{ duration: 0.15 }}
												className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 origin-top-right"
											>
												<div className="p-4 border-b border-gray-100 bg-gray-50/50">
													<p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
													<p className="text-xs text-gray-500 truncate">{user.email}</p>
												</div>

												<div className="p-2 space-y-1">
													<Link href="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors">
														<Settings className="w-4 h-4" /> Account Settings
													</Link>
													<Link href="/dashboard" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors">
														<User className="w-4 h-4" /> My Profile
													</Link>
													{/* Added Rewards link to dropdown for mobile users since the header badge is hidden on mobile */}
													<Link href="/rewards" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors">
														<Coins className="w-4 h-4" /> Rewards & Points
													</Link>
												</div>

												<div className="p-2 border-t border-gray-100">
													<a href="mailto:support@dawarha.com?subject=Bug%20Report" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg transition-colors font-medium">
														<Bug className="w-4 h-4" /> Report a Bug
													</a>
												</div>

												<div className="p-2 border-t border-gray-100">
													<form action={logOut}>
														<button type="submit" className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
															<LogOut className="w-4 h-4" /> Sign Out
														</button>
													</form>
												</div>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</>
						) : (
							<>
								<Button variant="ghost" size="sm" asChild className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-full font-semibold">
									<Link href="/login">Log in</Link>
								</Button>
								<Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 text-white transition-transform hover:scale-105 rounded-full font-bold shadow-sm">
									<Link href="/register">Sign up</Link>
								</Button>
							</>
						)}
					</motion.div>

				</div>
			</div>
		</header>
	);
}
