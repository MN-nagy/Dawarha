// The Haversine Formula (Calculates distance over the Earth's curve)
export function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Radius of the earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// AI Weight Parser (Turns "1.5 tons" into 1500)
export function parseWeightToKg(weightStr: string | null): number {
  if (!weightStr) return 0;
  const lowerStr = weightStr.toLowerCase();

  // Extract only the numbers and decimals using a Regular Expression
  let num = parseFloat(lowerStr.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return 0;

  // If the AI used the word "ton", multiply by 1000 to keep it in KG
  if (lowerStr.includes("ton")) num *= 1000;

  return num;
}
