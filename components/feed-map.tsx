"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "./ui/badge";
import { Map, MapPin, Satellite } from "lucide-react";

const createIcon = (isActive: boolean) => L.divIcon({
	className: 'custom-pin',
	html: `<div style="background-color: ${isActive ? '#10b981' : '#3b82f6'}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; justify-content: center; align-items: center; transition: all 0.3s ease; transform: scale(${isActive ? 1.2 : 1});">
             <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
           </div>`,
	iconSize: [24, 24],
	iconAnchor: [12, 12],
	popupAnchor: [0, -12],
});

function MapController({ reports, activeId }: { reports: any[], activeId: number | null }) {
	const map = useMap();

	useEffect(() => {
		if (activeId) {
			const activeReport = reports.find(r => r.id === activeId);
			if (activeReport && activeReport.latitude && activeReport.longitude) {
				map.flyTo([parseFloat(activeReport.latitude), parseFloat(activeReport.longitude)], 15, { animate: true, duration: 1.5 });
			}
		} else if (reports.length > 0) {
			const validReports = reports.filter(r => r.latitude && r.longitude);
			if (validReports.length > 0) {
				const bounds = L.latLngBounds(validReports.map(r => [parseFloat(r.latitude), parseFloat(r.longitude)]));
				map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
			}
		}
	}, [activeId, reports, map]);

	return null;
}

// Our Map Themes Dictionary
const MAP_THEMES = {
	minimal: {
		url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
		attribution: '&copy; OpenStreetMap'
	},
	street: {
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
		attribution: '&copy; Esri'
	},
	satellite: {
		url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
		attribution: '&copy; Esri'
	}
};

export default function FeedMap({ reports, activeReportId }: { reports: any[], activeReportId: number | null }) {
	// State to track our beautiful modern toggle
	const [activeTheme, setActiveTheme] = useState<keyof typeof MAP_THEMES>("minimal");

	const defaultCenter: [number, number] = [26.8206, 30.8025];
	const initialCenter = reports.length > 0 && reports[0].latitude && reports[0].longitude
		? [parseFloat(reports[0].latitude), parseFloat(reports[0].longitude)] as [number, number]
		: defaultCenter;

	return (
		<div className="w-full h-full relative z-0">
			<MapContainer
				key="feed-map-instance"
				center={initialCenter}
				zoom={reports.length > 0 ? 12 : 5}
				className="w-full h-full z-0"
				zoomControl={false}
			>
				{/* Dynamically render only the selected theme */}
				<TileLayer
					key={activeTheme}
					url={MAP_THEMES[activeTheme].url}
					attribution={MAP_THEMES[activeTheme].attribution}
				/>

				<MapController reports={reports} activeId={activeReportId} />

				{reports.map((report) => {
					if (!report.latitude || !report.longitude) return null;
					return (
						<Marker
							key={report.id}
							position={[parseFloat(report.latitude), parseFloat(report.longitude)]}
							icon={createIcon(activeReportId === report.id)}
							zIndexOffset={activeReportId === report.id ? 1000 : 0}
						>
							<Popup className="rounded-xl overflow-hidden border-0 shadow-xl">
								<div className="p-1 min-w-[200px]">
									<div className="flex justify-between items-center mb-2">
										<Badge className="capitalize bg-emerald-100 text-emerald-800">{report.wasteType}</Badge>
										<span className="text-xs font-bold text-gray-700">{report.totalWasteAmount}</span>
									</div>
									<p className="text-xs text-gray-500 line-clamp-2">{report.location}</p>
								</div>
							</Popup>
						</Marker>
					);
				})}
			</MapContainer>

			{/* 👇 MODERN TAILWIND THEME TOGGLE 👇 */}
			<div
				className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-200 flex gap-1"
				onPointerDown={(e) => e.stopPropagation()} // Prevents dragging the map when clicking the buttons
			>
				<button
					onClick={() => setActiveTheme("minimal")}
					className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${activeTheme === 'minimal' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
				>
					<Map className="w-3.5 h-3.5" /> Minimal
				</button>
				<button
					onClick={() => setActiveTheme("street")}
					className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${activeTheme === 'street' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
				>
					<MapPin className="w-3.5 h-3.5" /> Streets
				</button>
				<button
					onClick={() => setActiveTheme("satellite")}
					className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all duration-200 ${activeTheme === 'satellite' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
				>
					<Satellite className="w-3.5 h-3.5" /> Satellite
				</button>
			</div>
			{/* 👆 END TOGGLE 👆 */}
		</div>
	);
}
