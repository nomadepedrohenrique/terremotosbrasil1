import { createServerFn } from "@tanstack/react-start";

export interface RsbrEvent {
  id: string;
  magnitude: number;
  place: string;
  location: string;
  state: string;
  time: number; // epoch ms
  depthKm: number;
  lat: number;
  lon: number;
  url: string;
  source: string;
}

// Brazil bounding box (approx)
const BR = { latMin: -34, latMax: 6, lonMin: -74, lonMax: -33 };

// Rough mapping of Brazilian state by (lat, lon). Best-effort; falls back to "BR".
function inferState(lat: number, lon: number, place: string): { location: string; state: string } {
  // Try to parse "X km DIR of City, Country/State"
  const m = place.match(/of\s+(.+?),\s*(.+)$/i);
  const city = m?.[1]?.trim() ?? place;
  const region = m?.[2]?.trim() ?? "";

  // If USGS labels a non-Brazil country, keep region as-is
  const nonBR = ["Chile", "Argentina", "Bolivia", "Peru", "Venezuela", "Colombia", "Guyana", "Suriname", "French Guiana", "Paraguay", "Uruguay", "Ecuador"];
  if (nonBR.some((c) => region.includes(c))) {
    return { location: city, state: region };
  }

  // Coarse Brazilian state inference by lat/lon
  const states: { name: string; abbr: string; latMin: number; latMax: number; lonMin: number; lonMax: number }[] = [
    { name: "Acre", abbr: "AC", latMin: -11, latMax: -7, lonMin: -74, lonMax: -66.5 },
    { name: "Amazonas", abbr: "AM", latMin: -10, latMax: 2.5, lonMin: -73, lonMax: -56 },
    { name: "Roraima", abbr: "RR", latMin: 0.5, latMax: 5.5, lonMin: -64.5, lonMax: -58.5 },
    { name: "Pará", abbr: "PA", latMin: -10, latMax: 2.5, lonMin: -58.5, lonMax: -46 },
    { name: "Amapá", abbr: "AP", latMin: -1, latMax: 4.5, lonMin: -54.5, lonMax: -50 },
    { name: "Rondônia", abbr: "RO", latMin: -14, latMax: -7.5, lonMin: -67, lonMax: -59 },
    { name: "Mato Grosso", abbr: "MT", latMin: -18, latMax: -7, lonMin: -62, lonMax: -50 },
    { name: "Tocantins", abbr: "TO", latMin: -14, latMax: -5, lonMin: -50.5, lonMax: -45 },
    { name: "Maranhão", abbr: "MA", latMin: -10, latMax: -1, lonMin: -48.5, lonMax: -41.5 },
    { name: "Piauí", abbr: "PI", latMin: -11, latMax: -2.5, lonMin: -46, lonMax: -40.5 },
    { name: "Ceará", abbr: "CE", latMin: -8, latMax: -2.5, lonMin: -41.5, lonMax: -37 },
    { name: "Rio Grande do Norte", abbr: "RN", latMin: -7, latMax: -4.5, lonMin: -38.5, lonMax: -34.8 },
    { name: "Paraíba", abbr: "PB", latMin: -8.5, latMax: -6, lonMin: -38.8, lonMax: -34.8 },
    { name: "Pernambuco", abbr: "PE", latMin: -9.5, latMax: -7, lonMin: -41, lonMax: -34.8 },
    { name: "Alagoas", abbr: "AL", latMin: -10.5, latMax: -8.8, lonMin: -38.3, lonMax: -35 },
    { name: "Sergipe", abbr: "SE", latMin: -11.6, latMax: -9.5, lonMin: -38.3, lonMax: -36.4 },
    { name: "Bahia", abbr: "BA", latMin: -18.5, latMax: -8.5, lonMin: -47, lonMax: -37 },
    { name: "Goiás", abbr: "GO", latMin: -19.5, latMax: -12.5, lonMin: -53, lonMax: -45.9 },
    { name: "Distrito Federal", abbr: "DF", latMin: -16.1, latMax: -15.5, lonMin: -48.3, lonMax: -47.3 },
    { name: "Mato Grosso do Sul", abbr: "MS", latMin: -24, latMax: -17, lonMin: -58, lonMax: -50.9 },
    { name: "Minas Gerais", abbr: "MG", latMin: -22.9, latMax: -14, lonMin: -51, lonMax: -39.8 },
    { name: "Espírito Santo", abbr: "ES", latMin: -21.4, latMax: -17.8, lonMin: -41.9, lonMax: -39.6 },
    { name: "Rio de Janeiro", abbr: "RJ", latMin: -23.4, latMax: -20.7, lonMin: -44.9, lonMax: -40.9 },
    { name: "São Paulo", abbr: "SP", latMin: -25.4, latMax: -19.7, lonMin: -53.1, lonMax: -44.1 },
    { name: "Paraná", abbr: "PR", latMin: -26.7, latMax: -22.5, lonMin: -54.6, lonMax: -48 },
    { name: "Santa Catarina", abbr: "SC", latMin: -29.4, latMax: -25.9, lonMin: -53.8, lonMax: -48.3 },
    { name: "Rio Grande do Sul", abbr: "RS", latMin: -33.8, latMax: -27.0, lonMin: -57.7, lonMax: -49.6 },
  ];

  for (const s of states) {
    if (lat >= s.latMin && lat <= s.latMax && lon >= s.lonMin && lon <= s.lonMax) {
      return { location: city, state: s.abbr };
    }
  }
  return { location: city, state: "BR" };
}

export const fetchRsbrEvents = createServerFn({ method: "GET" }).handler(async (): Promise<{ events: RsbrEvent[]; error: string | null }> => {
  const params = new URLSearchParams({
    format: "geojson",
    minlatitude: String(BR.latMin),
    maxlatitude: String(BR.latMax),
    minlongitude: String(BR.lonMin),
    maxlongitude: String(BR.lonMax),
    orderby: "time",
    limit: "50",
  });

  try {
    const res = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { events: [], error: `Falha ao consultar serviço sismológico (${res.status})` };
    }
    const json = (await res.json()) as {
      features: Array<{
        id: string;
        properties: { mag: number | null; place: string; time: number; url: string; net?: string };
        geometry: { coordinates: [number, number, number] };
      }>;
    };

    const events: RsbrEvent[] = json.features
      .filter((f) => f.properties.mag != null)
      .map((f) => {
        const [lon, lat, depth] = f.geometry.coordinates;
        const { location, state } = inferState(lat, lon, f.properties.place || "");
        return {
          id: f.id,
          magnitude: f.properties.mag as number,
          place: f.properties.place,
          location,
          state,
          time: f.properties.time,
          depthKm: Math.max(0, Math.round(depth ?? 0)),
          lat,
          lon,
          url: f.properties.url,
          source: f.properties.net?.toUpperCase() ?? "USGS",
        };
      });

    return { events, error: null };
  } catch (err) {
    console.error("RSBR fetch failed", err);
    return { events: [], error: "Serviço sismológico indisponível no momento" };
  }
});
