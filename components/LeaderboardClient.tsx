"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, Trophy, User, Shield, Search, Leaf, Sprout, Trees } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type LeaderboardUser = {
	id: number;
	name: string;
	balance: number;
	avatar: string;
	league: 'seedling' | 'sapling' | 'tree';
	globalRank: number; // Rank among ALL users of this role
	leagueRank: number; // Rank among users in this specific league
};

type RoleData = {
	members: LeaderboardUser[];
	collectors: LeaderboardUser[];
	companies: LeaderboardUser[];
};

export default function LeaderboardClient({
	data,
	currentUserId
}: {
	data: RoleData,
	currentUserId: number
}) {
	const [activeRole, setActiveRole] = useState<'members' | 'collectors' | 'companies'>('members');
	const [activeLeagueFilter, setActiveLeagueFilter] = useState<'all' | 'seedling' | 'sapling' | 'tree'>('all');
	const [search, setSearch] = useState("");

	// 1. Get the list based on Role
	const currentRoleList = data[activeRole];

	// 2. Filter by League (Visual Filter)
	let displayList = currentRoleList;
	if (activeLeagueFilter !== 'all') {
		displayList = currentRoleList.filter(u => u.league === activeLeagueFilter);
	}

	// 3. Filter by Search
	displayList = displayList.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

	// 4. Determine Top 3 (for Podium) - Only if viewing "All" (Global)
	const podiumUsers = activeLeagueFilter === 'all'
		? [displayList[1], displayList[0], displayList[2]].filter(Boolean)
		: [];

	// 5. The rest of the list
	const listUsers = activeLeagueFilter === 'all'
		? displayList.filter(u => !podiumUsers.includes(u))
		: displayList;

	// 6. Get Current User Stats
	const currentUserStats = currentRoleList.find(u => u.id === currentUserId);

	const getInitials = (name: string) => name.charAt(0).toUpperCase();

	// Helper to get League Icon
	const LeagueIcon = ({ league, className }: { league: string, className?: string }) => {
		if (league === 'tree') return <Trees className={`text-emerald-700 ${className}`} />;
		if (league === 'sapling') return <Leaf className={`text-emerald-500 ${className}`} />;
		return <Sprout className={`text-emerald-300 ${className}`} />;
	};

	return (
		<div className="max-w-4xl mx-auto p-4 sm:p-8 pb-32">

			{/* --- HEADER & ROLE TABS --- */}
			<div className="text-center mb-8">
				<h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center justify-center gap-3 mb-6">
					<Trophy className="w-8 h-8 text-amber-500" /> Leaderboard
				</h1>


				{/* Role Switcher */}
				<div className="inline-flex bg-gray-100 p-1 rounded-xl">
					<button
						onClick={() => setActiveRole('members')}
						className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeRole === 'members' ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
					>
						Members
					</button>
					<button
						onClick={() => setActiveRole('collectors')}
						className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeRole === 'collectors' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
					>
						Collectors
					</button>
					<button
						onClick={() => setActiveRole('companies')}
						className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeRole === 'companies' ? 'bg-white shadow-sm text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
					>
						Enterprises
					</button>
				</div>
			</div>

			{/* --- LEAGUE FILTER TABS --- */}
			<div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-center">
				{[
					{ id: 'all', label: 'Global', icon: Trophy },
					{ id: 'tree', label: 'Tree League', icon: Trees },
					{ id: 'sapling', label: 'Sapling League', icon: Leaf },
					{ id: 'seedling', label: 'Seedling League', icon: Sprout },
				].map((league) => (
					<button
						key={league.id}
						onClick={() => setActiveLeagueFilter(league.id as any)}
						className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all
                            ${activeLeagueFilter === league.id
								? 'bg-emerald-600 text-white border-emerald-600'
								: 'bg-white border-gray-200 text-gray-600 hover:bg-emerald-50 hover:border-emerald-200'}`}
					>
						<league.icon className="w-3 h-3" />
						{league.label}
					</button>
				))}
			</div>


			{/* --- PODIUM SECTION (Only visible on Global View) --- */}
			{activeLeagueFilter === 'all' && (
				<div className="flex justify-center items-end gap-4 sm:gap-8 mb-12 h-56 mt-16">
					{/* 2nd Place */}
					{displayList[1] && (
						<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center w-1/3 max-w-[100px]">
							<div className="w-14 h-14 rounded-full bg-gray-200 border-4 border-white shadow-md flex items-center justify-center font-bold text-gray-600 mb-2 relative">
								{getInitials(displayList[1].name)}
								<div className="absolute -bottom-2 bg-gray-500 text-white text-[10px] px-2 rounded-full border border-white">#2</div>
							</div>
							<p className="font-bold text-xs text-gray-700 truncate w-full text-center">{displayList[1].name}</p>
							<p className="font-bold text-[10px] text-emerald-600">{displayList[1].balance} pts</p>
							<div className="w-full h-24 bg-gray-100 rounded-t-lg mt-2 border-t border-gray-200"></div>
						</motion.div>
					)}

					{/* 1st Place */}
					{displayList[0] && (
						<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center w-1/3 max-w-[120px] -mt-6 z-10">
							<Crown className="w-6 h-6 text-amber-500 mb-1 animate-bounce" />
							<div className="w-20 h-20 rounded-full bg-amber-100 border-4 border-amber-400 shadow-xl flex items-center justify-center font-bold text-amber-700 text-xl mb-2 relative">
								{getInitials(displayList[0].name)}
								<div className="absolute -bottom-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full border-2 border-white">#1</div>
							</div>
							<p className="font-bold text-sm text-gray-900 truncate w-full text-center">{displayList[0].name}</p>
							<p className="font-bold text-xs text-emerald-600">{displayList[0].balance} pts</p>
							<div className="w-full h-32 bg-amber-50 rounded-t-lg mt-2 border-t border-amber-200 shadow-sm relative overflow-hidden">
								<div className="absolute inset-0 bg-white/30 skew-y-12 translate-y-20"></div>
							</div>
						</motion.div>
					)}

					{/* 3rd Place */}
					{displayList[2] && (
						<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center w-1/3 max-w-[100px]">
							<div className="w-14 h-14 rounded-full bg-orange-100 border-4 border-white shadow-md flex items-center justify-center font-bold text-orange-700 mb-2 relative">
								{getInitials(displayList[2].name)}
								<div className="absolute -bottom-2 bg-orange-400 text-white text-[10px] px-2 rounded-full border border-white">#3</div>
							</div>
							<p className="font-bold text-xs text-gray-700 truncate w-full text-center">{displayList[2].name}</p>
							<p className="font-bold text-[10px] text-emerald-600">{displayList[2].balance} pts</p>
							<div className="w-full h-16 bg-orange-50 rounded-t-lg mt-2 border-t border-orange-200"></div>
						</motion.div>
					)}
				</div>
			)}

			{/* --- LIST SECTION --- */}
			<div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
				<div className="p-4 border-b border-gray-100 bg-gray-50/50">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
						<Input
							placeholder="Find a user..."
							className="pl-9 h-10 rounded-full border-gray-200 bg-white"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
					</div>
				</div>

				<div className="divide-y divide-gray-50">
					{listUsers.length === 0 && (
						<div className="p-8 text-center text-gray-500 text-sm">No users found in this category.</div>
					)}

					{listUsers.map((user, index) => {
						const isMe = user.id === currentUserId;
						// Determine rank to display based on current filter
						const displayRank = activeLeagueFilter === 'all' ? user.globalRank : user.leagueRank;

						return (
							<motion.div
								key={user.id}
								initial={{ opacity: 0, x: -10 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.03 }}
								className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${isMe ? 'bg-emerald-50/50' : ''}`}
							>
								<div className="font-bold text-gray-400 w-8 text-center text-sm">#{displayRank}</div>

								<div className="relative">
									<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-emerald-700 font-bold border border-gray-200 text-sm">
										{getInitials(user.name)}
									</div>
									<div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
										<LeagueIcon league={user.league} className="w-3 h-3" />
									</div>
								</div>

								<div className="flex-grow">
									<p className={`font-bold text-sm ${isMe ? 'text-emerald-900' : 'text-gray-900'}`}>
										{user.name} {isMe && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
									</p>
									<p className="text-[10px] text-gray-400 capitalize flex items-center gap-1">
										<LeagueIcon league={user.league} className="w-3 h-3" />
										{user.league} League
									</p>
								</div>

								<div className="text-right">
									<p className="font-bold text-gray-900 text-sm">{user.balance}</p>
									<p className="text-[10px] text-gray-400">pts</p>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>

			{/* --- STICKY USER STATS BAR --- */}
			{/* Shows dual ranking: Global + League */}
			{currentUserStats && (
				<div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40">
					<motion.div
						initial={{ y: 50, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4 max-w-lg w-full border border-gray-700/50"
					>
						<div className="flex items-center gap-3">
							<div className="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner">
								{getInitials(currentUserStats.name)}
							</div>
							<div>
								<p className="font-bold text-sm text-white">{currentUserStats.balance} pts</p>
								<p className="text-[10px] text-emerald-400 font-medium capitalize flex items-center gap-1">
									{currentUserStats.league} League
								</p>
							</div>
						</div>

						{/* Dual Ranks */}
						<div className="flex gap-4 text-right">
							<div>
								<p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Global</p>
								<p className="text-lg font-black leading-none">#{currentUserStats.globalRank}</p>
							</div>
							<div className="w-px bg-gray-700 h-8 self-center"></div>
							<div>
								<p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider capitalize">{currentUserStats.league}</p>
								<p className="text-lg font-black text-emerald-400 leading-none">#{currentUserStats.leagueRank}</p>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</div>
	);
}
