"use client";
//TODO: wire up the db info

import { useState } from "react";
import { Coins, Search, Ticket, Heart, Coffee, ShoppingBag, Wifi, Copy, Sparkles, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { redeemReward } from "@/db/actions";
import { motion, AnimatePresence } from "framer-motion";

// --- DUMMY DATA FOR PARTNERS ---
const partners = [
	{ id: "vodafone", name: "Vodafone", logo: Wifi, color: "bg-red-100 text-red-600", description: "Telecom & Cash" },
	{ id: "zara", name: "Zara", logo: ShoppingBag, color: "bg-stone-100 text-stone-700", description: "Fashion Retail" },
	{ id: "starbucks", name: "Starbucks", logo: Coffee, color: "bg-green-100 text-green-700", description: "Coffee House" },
	{ id: "carrefour", name: "Carrefour", logo: ShoppingBag, color: "bg-blue-100 text-blue-600", description: "Hypermarket" },
	{ id: "imax", name: "IMAX", logo: Ticket, color: "bg-purple-100 text-purple-600", description: "Cinema Experience" },
	{ id: "charity", name: "Charity", logo: Heart, color: "bg-rose-100 text-rose-600", description: "Donations" },
];

// --- DUMMY DATA FOR COUPONS (With Quantity) ---
const initialRewards = [
	{ id: 1, name: "100 EGP Vodafone Cash", cost: 500, quantity: 5, icon: Wifi, color: "bg-red-100 text-red-600", brand: "Vodafone" },
	{ id: 7, name: "50 EGP Vodafone Cash", cost: 250, quantity: 0, icon: Wifi, color: "bg-red-100 text-red-600", brand: "Vodafone" }, // Starts Out of Stock
	{ id: 2, name: "20% Off at Zara", cost: 200, quantity: 12, icon: ShoppingBag, color: "bg-stone-100 text-stone-700", brand: "Zara" },
	{ id: 3, name: "Free Starbucks Coffee", cost: 150, quantity: 50, icon: Coffee, color: "bg-green-100 text-green-700", brand: "Starbucks" },
	{ id: 8, name: "Caramel Macchiato", cost: 180, quantity: 3, icon: Coffee, color: "bg-green-100 text-green-700", brand: "Starbucks" },
	{ id: 4, name: "Donate to Green Egypt", cost: 300, quantity: 999, icon: Heart, color: "bg-rose-100 text-rose-600", brand: "Charity" },
	{ id: 5, name: "500 EGP Carrefour", cost: 2000, quantity: 2, icon: ShoppingBag, color: "bg-blue-100 text-blue-600", brand: "Carrefour" },
	{ id: 6, name: "IMAX Cinema Ticket", cost: 400, quantity: 8, icon: Ticket, color: "bg-purple-100 text-purple-600", brand: "IMAX" },
];

export default function RewardsClient({ user, balance, rewardsHistory }: { user: any, balance: number, rewardsHistory: any[] }) {
	const [activeTab, setActiveTab] = useState<'market' | 'partners' | 'my-rewards'>('market');
	const [rewardsList, setRewardsList] = useState(initialRewards); // Local state to track stock decrement
	const [selectedPartner, setSelectedPartner] = useState<typeof partners[0] | null>(null);
	const [loadingId, setLoadingId] = useState<number | null>(null);
	const [search, setSearch] = useState("");

	// Animation States
	const [floatingPoints, setFloatingPoints] = useState<{ id: number, val: number } | null>(null);
	const [newCouponsCount, setNewCouponsCount] = useState(0);

	// Filter Logic
	const marketRewards = rewardsList.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

	const partnerRewards = selectedPartner
		? rewardsList.filter(r => r.brand === selectedPartner.name)
		: [];

	const handleCopy = (code: string) => {
		navigator.clipboard.writeText(code);
		toast.success("Code Copied!");
	};

	const handleRedeem = async (rewardId: number, cost: number) => {
		if (balance < cost) {
			toast.error("Insufficient Balance", { description: "You need more points to redeem this reward." });
			return;
		}

		setLoadingId(rewardId);
		try {
			const result = await redeemReward(user.id, rewardId);
			if (result.success) {
				// 1. Trigger Animation
				setFloatingPoints({ id: Date.now(), val: cost });
				setTimeout(() => setFloatingPoints(null), 1500);

				// 2. Decrement Stock Locally
				setRewardsList(prev => prev.map(r =>
					r.id === rewardId ? { ...r, quantity: r.quantity - 1 } : r
				));

				setNewCouponsCount(prev => prev + 1);
				toast.success("Reward Redeemed!", { description: "Check 'My Coupons' to see your code." });
			} else {
				toast.error("Error", { description: result.error });
			}
		} catch (e) {
			toast.error("Something went wrong");
		} finally {
			setLoadingId(null);
		}
	};

	const handleTabChange = (tab: typeof activeTab) => {
		setActiveTab(tab);
		if (tab === 'my-rewards') setNewCouponsCount(0);
		if (tab !== 'partners') setSelectedPartner(null);
	};

	// Reusable Card Component to ensure consistent look across tabs
	const RewardCard = ({ reward }: { reward: typeof initialRewards[0] }) => {
		const isOutOfStock = reward.quantity === 0;

		return (
			<motion.div
				layout
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				whileHover={!isOutOfStock ? { y: -5 } : {}}
				className={`rounded-3xl border shadow-sm p-6 flex flex-col justify-between h-full transition-all group relative overflow-hidden
                    ${isOutOfStock
						? 'bg-gray-50 border-gray-100 opacity-75'
						: 'bg-white border-gray-100 hover:shadow-lg'
					}`}
			>
				{/* Out of Stock Overlay */}
				{isOutOfStock && (
					<div className="absolute top-4 right-4 bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
						<AlertCircle className="w-3 h-3" /> Sold Out
					</div>
				)}

				{/* Stock Badge (If low stock) */}
				{!isOutOfStock && reward.quantity < 5 && (
					<div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
						Only {reward.quantity} Left
					</div>
				)}

				<div>
					<div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform 
                        ${isOutOfStock ? 'bg-gray-200 grayscale' : `${reward.color} group-hover:scale-110`}`}
					>
						<reward.icon className="w-7 h-7" />
					</div>
					<h3 className={`text-xl font-bold mb-1 ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>{reward.name}</h3>
					<p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{reward.brand}</p>
				</div>

				<div className="mt-auto pt-4 border-t border-gray-100">
					<div className="flex items-center justify-between mb-4">
						<span className={`font-bold flex items-center gap-1 ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>
							<Coins className={`w-4 h-4 ${isOutOfStock ? 'text-gray-400' : 'text-emerald-500'}`} /> {reward.cost}
						</span>
						<div className="text-xs text-gray-400 font-medium">
							{isOutOfStock ? "Out of Stock" : `${reward.quantity} in stock`}
						</div>
					</div>

					<Button
						onClick={() => handleRedeem(reward.id, reward.cost)}
						disabled={loadingId === reward.id || balance < reward.cost || isOutOfStock}
						className={`w-full rounded-full font-bold transition-all active:scale-95 
                            ${isOutOfStock
								? 'bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200'
								: balance < reward.cost
									? 'bg-gray-100 text-gray-400 hover:bg-gray-100 cursor-not-allowed'
									: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-200'
							}`}
					>
						{loadingId === reward.id ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : (isOutOfStock ? "Sold Out" : "Redeem")}
					</Button>
				</div>
			</motion.div>
		);
	};

	return (
		<div className="max-w-6xl mx-auto p-4 sm:p-8 relative min-h-screen">

			{/* --- FIXED FLOATING BALANCE WIDGET --- */}
			<div className="fixed top-20 right-4 md:right-8 z-50">
				<div className="relative bg-white/90 backdrop-blur-md border border-emerald-100 p-3 pr-6 rounded-2xl flex items-center gap-4 shadow-xl ring-1 ring-black/5 min-w-[180px] transition-all animate-in fade-in slide-in-from-top-4 duration-700">
					<div className="bg-emerald-100 p-2 rounded-xl">
						<Coins className="w-6 h-6 text-emerald-600" />
					</div>
					<div>
						<p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance</p>
						<p className="text-2xl font-black text-gray-900 leading-none">{balance} <span className="text-xs text-gray-400 font-medium">pts</span></p>
					</div>
					<AnimatePresence>
						{floatingPoints && (
							<motion.div
								key={floatingPoints.id}
								initial={{ opacity: 1, y: 10, scale: 0.5 }}
								animate={{ opacity: 0, y: -50, scale: 1.5 }}
								exit={{ opacity: 0 }}
								transition={{ duration: 1, ease: "easeOut" }}
								className="absolute right-0 -top-10 text-4xl font-black text-red-500 pointer-events-none drop-shadow-sm flex items-center"
							>
								-{floatingPoints.val}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			</div>

			{/* --- HEADER --- */}
			<div className="mb-8 pr-[200px]">
				<h1 className="text-3xl font-black text-gray-900 tracking-tight">Rewards Marketplace</h1>
				<p className="text-gray-500 text-sm mt-1">Redeem your hard-earned points for real-world value.</p>
			</div>

			{/* --- TABS --- */}
			<div className="flex gap-6 mb-8 border-b border-gray-200 overflow-x-auto">
				{[
					{ id: 'market', label: 'Rewards' },
					{ id: 'partners', label: 'Browse Partners' },
					{ id: 'my-rewards', label: 'My Coupons' }
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => handleTabChange(tab.id as any)}
						className={`relative pb-3 text-sm font-bold border-b-2 transition-colors px-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
					>
						{tab.label}
						{tab.id === 'my-rewards' && (
							<AnimatePresence>
								{newCouponsCount > 0 && (
									<motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="bg-red-500 text-white text-[10px] font-bold px-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full shadow-sm">
										{newCouponsCount}
									</motion.span>
								)}
							</AnimatePresence>
						)}
					</button>
				))}
			</div>

			{/* --- TAB CONTENT --- */}
			<div className="min-h-[400px]">

				{/* 1. GENERAL REWARDS TAB */}
				{activeTab === 'market' && (
					<div className="animate-in fade-in duration-500">
						<div className="relative mb-8 max-w-md">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
							<Input
								placeholder="Search rewards..."
								className="pl-10 h-12 rounded-full border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white shadow-sm"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
							{marketRewards.map((reward) => (
								<RewardCard key={reward.id} reward={reward} />
							))}
						</div>
					</div>
				)}

				{/* 2. BROWSE PARTNERS TAB */}
				{activeTab === 'partners' && (
					<AnimatePresence mode="wait">
						{!selectedPartner ? (
							<motion.div
								key="partner-list"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
							>
								{partners.map((partner) => (
									<motion.div
										key={partner.id}
										layoutId={`card-${partner.id}`}
										whileHover={{ scale: 1.02 }}
										onClick={() => setSelectedPartner(partner)}
										className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-lg hover:border-emerald-100 transition-all group relative overflow-hidden"
									>
										<div className="flex items-center justify-between mb-4">
											<motion.div
												layoutId={`logo-${partner.id}`}
												className={`w-16 h-16 rounded-2xl flex items-center justify-center ${partner.color}`}
											>
												<partner.logo className="w-8 h-8" />
											</motion.div>
										</div>
										<h3 className="text-xl font-bold text-gray-900">{partner.name}</h3>
										<p className="text-gray-500 text-sm mt-1">{partner.description}</p>
										<div className="mt-4 text-xs font-semibold text-emerald-600 uppercase tracking-wide">View Coupons</div>
									</motion.div>
								))}
							</motion.div>
						) : (
							<motion.div
								key="partner-details"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
							>
								<div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
									<Button
										variant="ghost"
										onClick={() => setSelectedPartner(null)}
										className="group text-gray-500 hover:text-gray-900"
									>
										<ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
										Back to Partners
									</Button>

									<div className="text-right flex items-center gap-4">
										<div>
											<h2 className="text-2xl font-black text-gray-900">{selectedPartner.name}</h2>
											<p className="text-sm text-gray-500">{selectedPartner.description}</p>
										</div>
										<motion.div
											layoutId={`logo-${selectedPartner.id}`}
											className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${selectedPartner.color}`}
										>
											<selectedPartner.logo className="w-8 h-8" />
										</motion.div>
									</div>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
									{partnerRewards.length === 0 ? (
										<div className="col-span-full py-12 text-center text-gray-400">
											No active coupons available for {selectedPartner.name} right now.
										</div>
									) : (
										partnerRewards.map((reward) => (
											<RewardCard key={reward.id} reward={reward} />
										))
									)}
								</div>
							</motion.div>
						)}
					</AnimatePresence>
				)}

				{/* 3. MY COUPONS TAB */}
				{activeTab === 'my-rewards' && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
						{rewardsHistory.filter(h => h.points < 0).length === 0 && (
							<div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
								<Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
								<h3 className="text-gray-900 font-bold text-lg">No rewards yet</h3>
								<p className="text-gray-500">Earn points by recycling and redeem them for cool stuff!</p>
							</div>
						)}

						{rewardsHistory.map((historyItem) => {
							if (historyItem.points >= 0) return null;
							const code = historyItem.collectionInfo.replace('Coupon Code: ', '');
							return (
								<div key={historyItem.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all hover:shadow-md">
									<div className="flex items-center gap-4">
										<div className="bg-gray-50 p-3 rounded-xl">
											<Sparkles className="w-5 h-5 text-emerald-500" />
										</div>
										<div>
											<p className="font-bold text-gray-900 mb-1">{historyItem.description.replace('Redeemed: ', '')}</p>
											<p className="text-xs text-gray-500">{new Date(historyItem.createdAt).toLocaleDateString()}</p>
										</div>
									</div>
									<div className="text-right">
										<button
											onClick={() => handleCopy(code)}
											className="bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-2 transition-all active:scale-95"
										>
											<span className="font-mono text-sm font-bold text-gray-700">{code}</span>
											<Copy className="w-3 h-3 text-gray-400 group-hover:text-emerald-500" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
