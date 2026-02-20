"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix for Next.js breaking Leaflet's default marker icons
const icon = L.icon({
	iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
	iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
	shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
	// Prevent hydration mismatch
	useEffect(() => {
		window.dispatchEvent(new Event("resize"));
	}, []);

	return (
		<div className="h-48 w-full rounded-md overflow-hidden border border-gray-200 z-10 relative">
			<MapContainer
				center={[lat, lng]}
				zoom={15}
				style={{ height: "100%", width: "100%" }}
				zoomControl={false}
				scrollWheelZoom={false} // Prevents annoying page scrolling issues
			>
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<Marker position={[lat, lng]} icon={icon} />
			</MapContainer>
		</div>
	);
}
