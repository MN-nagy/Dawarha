import Link from "next/link";
import { Leaf } from "lucide-react";

export default function Footer() {
	return (
		<footer className="bg-white border-t border-gray-200 mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">

					{/* Brand Section */}
					<div className="col-span-1 md:col-span-2">
						<Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight text-emerald-900 mb-4">
							<div className="bg-emerald-600 text-white flex size-7 items-center justify-center rounded-md shadow-sm">
								<Leaf className="size-4" />
							</div>
							Dawarha
						</Link>
						<p className="text-gray-500 text-sm leading-relaxed max-w-sm">
							Empowering communities to turn waste into value. Join our logistics network to build a cleaner, more sustainable future together.
						</p>
					</div>

					{/* Quick Links */}
					<div>
						<h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Platform</h3>
						<ul className="space-y-3">
							<li><Link href="/explore" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">Explore Waste</Link></li>
							<li><Link href="/dashboard" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">My Dashboard</Link></li>
							<li><Link href="/about" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">About Us</Link></li>
						</ul>
					</div>

					{/* Support */}
					<div>
						<h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Support</h3>
						<ul className="space-y-3">
							<li><a href="mailto:support@dawarha.com" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">Contact Us</a></li>
							<li><a href="mailto:support@dawarha.com?subject=Bug%20Report" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">Report a Bug</a></li>
							<li><Link href="#" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
						</ul>
					</div>
				</div>

				<div className="border-t border-gray-100 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
					<p className="text-xs text-gray-400">
						© {new Date().getFullYear()} Dawarha. All rights reserved.
					</p>
					<p className="text-xs text-gray-400 mt-2 md:mt-0 flex items-center gap-1">
						Built with <span className="text-emerald-500">♥</span> for a greener earth.
					</p>
				</div>
			</div>
		</footer>
	);
}
