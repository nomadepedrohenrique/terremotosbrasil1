export interface SeismicEvent {
  id: string;
  location: string;
  state: string;
  date: string;
  time: string;
  magnitude: number;
  depthKm: number;
  lat: number;
  lon: number;
  status?: "review" | "confirmed" | "auto";
  note?: string;
}

export const EVENTS: SeismicEvent[] = [
  {
    id: "1",
    location: "Tarauacá",
    state: "AC",
    date: "22 MAI 2026",
    time: "08:12 BRT",
    magnitude: 4.8,
    depthKm: 582,
    lat: -8.12,
    lon: -70.76,
    status: "confirmed",
    note: "Sismo profundo • Confirmado pela RSBR",
  },
  {
    id: "2",
    location: "Santarém",
    state: "PA",
    date: "21 MAI 2026",
    time: "21:03 BRT",
    magnitude: 3.2,
    depthKm: 12,
    lat: -2.44,
    lon: -54.71,
    status: "auto",
    note: "Sismógrafo automático — aguardando revisão",
  },
  {
    id: "3",
    location: "Cascavel",
    state: "CE",
    date: "20 MAI 2026",
    time: "14:12 BRT",
    magnitude: 2.1,
    depthKm: 10,
    lat: -4.13,
    lon: -38.24,
    status: "confirmed",
    note: "Confirmado pela Estação RCBR",
  },
  {
    id: "4",
    location: "Cachoeira dos Índios",
    state: "PB",
    date: "19 MAI 2026",
    time: "03:45 BRT",
    magnitude: 1.8,
    depthKm: 5,
    lat: -6.91,
    lon: -38.72,
    status: "confirmed",
  },
  {
    id: "5",
    location: "Serra do Tombador",
    state: "MT",
    date: "17 MAI 2026",
    time: "11:20 BRT",
    magnitude: 2.4,
    depthKm: 8,
    lat: -13.55,
    lon: -57.21,
    status: "confirmed",
    note: "Confirmado pelo Observatório Sismológico UnB",
  },
  {
    id: "6",
    location: "Itacarambi",
    state: "MG",
    date: "15 MAI 2026",
    time: "06:48 BRT",
    magnitude: 2.7,
    depthKm: 4,
    lat: -15.09,
    lon: -44.09,
    status: "confirmed",
  },
];

function magClass(m: number) {
  if (m >= 4) return "text-primary";
  if (m >= 2.5) return "text-warn";
  return "text-muted-foreground";
}

export function EventsList({
  events,
  selectedId,
  onSelect,
}: {
  events: SeismicEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-panel border border-border rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border bg-white/[0.03] flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          Eventos Recentes
          <span className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-mono">
            AO VIVO
          </span>
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">{events.length} eventos</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.map((e) => {
          const active = e.id === selectedId;
          const highlight = e.status === "auto";
          return (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={[
                "w-full text-left p-4 border-b border-border transition-colors",
                active
                  ? "bg-primary/10 border-l-2 border-l-primary"
                  : highlight
                  ? "bg-primary/[0.04] border-l-2 border-l-primary/40 hover:bg-white/[0.04]"
                  : "hover:bg-white/[0.04]",
              ].join(" ")}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-base font-semibold text-foreground tracking-tight">
                    {e.location}, {e.state}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {e.date} • {e.time}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-mono font-bold ${magClass(e.magnitude)}`}>
                    {e.magnitude.toFixed(1)}
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
                    mR
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                Prof: {e.depthKm}km • Epi: {e.lat.toFixed(2)}, {e.lon.toFixed(2)}
              </div>
              {e.note && (
                <div className="text-[10px] text-muted-foreground/80 mt-1.5 uppercase tracking-wide">
                  {e.note}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
