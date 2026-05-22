import brazilMap from "@/assets/brazil-map.jpg";
import type { SeismicEvent } from "./EventsList";
import { Minus, Plus } from "lucide-react";

// Approx bounding box for plotting markers over the static map image
const BOUNDS = { latMin: -34, latMax: 6, lonMin: -74, lonMax: -33 };

function project(lat: number, lon: number) {
  const x = ((lon - BOUNDS.lonMin) / (BOUNDS.lonMax - BOUNDS.lonMin)) * 100;
  const y = ((BOUNDS.latMax - lat) / (BOUNDS.latMax - BOUNDS.latMin)) * 100;
  return { x, y };
}

export function BrazilMap({
  events,
  selectedId,
  onSelect,
}: {
  events: SeismicEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative bg-panel border border-border rounded-xl overflow-hidden aspect-[16/10]">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
          VIEWPORT: LAT -14.2350, LON -51.9253
        </div>
        <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
          ZOOM: 4.5X
        </div>
      </div>

      <img
        src={brazilMap}
        alt="Mapa sismográfico do Brasil com marcadores de eventos recentes"
        width={1280}
        height={800}
        className="absolute inset-0 w-full h-full object-cover opacity-90"
      />

      {/* Markers */}
      <div className="absolute inset-0">
        {events.map((e) => {
          const { x, y } = project(e.lat, e.lon);
          const active = e.id === selectedId;
          const size = Math.max(8, e.magnitude * 4);
          return (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-label={`${e.location}, ${e.state} magnitude ${e.magnitude}`}
            >
              <span
                className="absolute inset-0 rounded-full bg-primary/40 animate-ping"
                style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
              />
              <span
                className={`block rounded-full border ${
                  active
                    ? "bg-primary border-primary-foreground/50 shadow-[0_0_16px_rgba(239,68,68,0.7)]"
                    : "bg-primary/80 border-primary-foreground/20"
                }`}
                style={{ width: size, height: size }}
              />
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap bg-background/90 backdrop-blur px-2 py-0.5 rounded border border-border text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {e.location} · {e.magnitude.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button className="p-2 bg-panel border border-border rounded hover:bg-secondary transition-colors">
          <Plus className="size-3" />
        </button>
        <button className="p-2 bg-panel border border-border rounded hover:bg-secondary transition-colors">
          <Minus className="size-3" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-md border border-border rounded px-3 py-2">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 font-mono">
          Legenda
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            <span className="text-[10px] font-mono">≥ 4.0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warn" />
            <span className="text-[10px] font-mono">2.5 – 3.9</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-muted-foreground" />
            <span className="text-[10px] font-mono">&lt; 2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
