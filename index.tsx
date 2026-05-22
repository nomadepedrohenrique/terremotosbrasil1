import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { MapPin, RefreshCcw } from "lucide-react";

import { BrazilMap } from "@/components/sismo/BrazilMap";
import { EventsList } from "@/components/sismo/EventsList";
import { Waveform } from "@/components/sismo/Waveform";
import { LiveClock } from "@/components/sismo/LiveClock";
import { fetchRsbrEvents, type RsbrEvent } from "@/lib/earthquakes.functions";
import { haversineKm, formatKm, timeAgo } from "@/lib/distance";
import { useGeolocation } from "@/hooks/useGeolocation";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SismoBR — Detecção Sismográfica do Brasil em Tempo Real" },
      {
        name: "description",
        content:
          "Monitor sismográfico do Brasil em tempo real com dados ao vivo, distância do epicentro à sua localização em km e notificações imediatas de novos tremores.",
      },
    ],
  }),
});

const POLL_MS = 60_000;
const NOTIFY_MIN_MAG = 2.5;

function formatDateBR(epoch: number) {
  return new Date(epoch).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).toUpperCase();
}
function formatTimeBR(epoch: number) {
  return new Date(epoch).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }) + " BRT";
}

function toListShape(e: RsbrEvent, distanceKm: number | null) {
  return {
    id: e.id,
    location: e.location,
    state: e.state,
    date: formatDateBR(e.time),
    time: formatTimeBR(e.time),
    magnitude: e.magnitude,
    depthKm: e.depthKm,
    lat: e.lat,
    lon: e.lon,
    status: "confirmed" as const,
    note: distanceKm != null ? `${formatKm(distanceKm)} de você • ${timeAgo(e.time)}` : timeAgo(e.time),
  };
}

function Index() {
  const { location: userLoc, status: geoStatus, request: requestGeo } = useGeolocation();

  const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["rsbr-events"],
    queryFn: () => fetchRsbrEvents(),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const events = data?.events ?? [];
  const apiError = data?.error ?? (error instanceof Error ? error.message : null);

  // Notify on new events
  const seenIdsRef = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!events.length) return;
    if (seenIdsRef.current === null) {
      // First load — seed without notifying
      seenIdsRef.current = new Set(events.map((e) => e.id));
      return;
    }
    const seen = seenIdsRef.current;
    const fresh = events.filter((e) => !seen.has(e.id));
    fresh.forEach((e) => {
      seen.add(e.id);
      if (e.magnitude < NOTIFY_MIN_MAG) return;
      const distKm = haversineKm(userLoc, { lat: e.lat, lon: e.lon });
      toast(`Tremor M${e.magnitude.toFixed(1)} — ${e.location}, ${e.state}`, {
        description: `${formatKm(distKm)} de você • Profundidade ${e.depthKm} km • ${timeAgo(e.time)}`,
        duration: 12000,
      });
    });
  }, [events, userLoc]);

  const enriched = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        distanceKm: haversineKm(userLoc, { lat: e.lat, lon: e.lon }),
      })),
    [events, userLoc]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedId && enriched.length) setSelectedId(enriched[0].id);
  }, [enriched, selectedId]);

  const selected = enriched.find((e) => e.id === selectedId) ?? enriched[0];

  const listEvents = useMemo(
    () => enriched.map((e) => toListShape(e, e.distanceKm)),
    [enriched]
  );

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      {/* Nav */}
      <nav className="flex items-center justify-between border-b border-border pb-5 mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="size-3 rounded-full bg-primary" />
              <div className="absolute inset-0 size-3 rounded-full bg-primary animate-ping" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              SISMO<span className="text-primary">BR</span>
            </h1>
          </div>
          <div className="hidden md:flex gap-6 text-xs font-medium text-muted-foreground uppercase tracking-widest">
            <a href="#" className="text-foreground border-b border-primary pb-1">Monitor</a>
            <a href="#" className="hover:text-foreground transition-colors">Alertas</a>
            <a href="#" className="hover:text-foreground transition-colors">Estações</a>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={requestGeo}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-panel hover:bg-secondary transition-colors text-[10px] font-mono uppercase tracking-wider"
            title="Atualizar localização"
          >
            <MapPin className="size-3" />
            {userLoc.source === "geolocation"
              ? `${userLoc.lat.toFixed(2)}, ${userLoc.lon.toFixed(2)}`
              : geoStatus === "denied"
              ? "Brasília (padrão)"
              : "Localizando…"}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-panel hover:bg-secondary transition-colors text-[10px] font-mono uppercase tracking-wider disabled:opacity-50"
          >
            <RefreshCcw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </button>
          <LiveClock />
        </div>
      </nav>

      {apiError && (
        <div className="mb-6 px-4 py-3 rounded-md border border-primary/40 bg-primary/10 text-sm">
          <span className="font-mono uppercase text-[10px] tracking-widest text-primary mr-2">Aviso:</span>
          {apiError} — exibindo últimos dados disponíveis.
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <BrazilMap events={listEvents} selectedId={selectedId ?? ""} onSelect={setSelectedId} />

          {/* Selected event detail */}
          {selected ? (
            <div className="bg-panel border border-border rounded-xl p-5">
              <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
                <div>
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">
                    Evento Selecionado
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {selected.location}, {selected.state}
                  </h2>
                  <div className="text-xs font-mono text-muted-foreground mt-1">
                    {formatDateBR(selected.time)} • {formatTimeBR(selected.time)} • {timeAgo(selected.time)}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 sm:text-right w-full sm:w-auto">
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Mag.</div>
                    <div className="text-2xl font-mono font-bold text-primary">
                      {selected.magnitude.toFixed(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Prof.</div>
                    <div className="text-2xl font-mono font-bold">
                      {selected.depthKm}
                      <span className="text-sm text-muted-foreground">km</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Distância</div>
                    <div className="text-2xl font-mono font-bold text-warn">
                      {formatKm(selected.distanceKm)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Coord.</div>
                    <div className="text-xs font-mono mt-2">
                      {selected.lat.toFixed(2)}<br />{selected.lon.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Sismograma · Componente Vertical (Z) — simulado a partir de magnitude
                </span>
                <span className="text-[10px] font-mono text-warn uppercase">
                  Fonte: {selected.lat ? "USGS / RSBR" : "—"}
                </span>
              </div>
              <Waveform variant={selected.magnitude >= 2.5 ? "spike" : "calm"} color="oklch(0.7 0.2 30)" />
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-2">
                <span>T − 120s</span>
                <span>T − 60s</span>
                <span className="text-primary">CHEGADA FASE P</span>
                <span>T − 30s</span>
                <span>AGORA</span>
              </div>
            </div>
          ) : isLoading ? (
            <div className="bg-panel border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Carregando eventos sismográficos…
            </div>
          ) : (
            <div className="bg-panel border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Nenhum evento registrado na região no momento.
            </div>
          )}

          {/* Station waveforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-panel border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Brasília (DF) · Estação BSB01
                </span>
                <span className="text-[10px] font-mono text-ok uppercase">Sinal Estável</span>
              </div>
              <Waveform variant="calm" />
            </div>
            <div className="bg-panel border border-border rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Manaus (AM) · Estação MN04
                </span>
                <span className="text-[10px] font-mono text-warn uppercase">Microsismicidade</span>
              </div>
              <Waveform variant="spike" />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 min-h-[600px]">
          <EventsList events={listEvents} selectedId={selectedId ?? ""} onSelect={setSelectedId} />
        </div>
      </div>

      {/* Stats footer */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-border pt-8">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
            Eventos carregados
          </span>
          <span className="text-2xl font-bold mt-1">{events.length}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
            Maior magnitude
          </span>
          <span className="text-2xl font-bold text-warn mt-1">
            {events.length ? Math.max(...events.map((e) => e.magnitude)).toFixed(1) : "—"} mR
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
            Mais próximo de você
          </span>
          <span className="text-2xl font-bold mt-1">
            {enriched.length
              ? formatKm(Math.min(...enriched.map((e) => e.distanceKm)))
              : "—"}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
            Última atualização
          </span>
          <span className="text-2xl font-bold text-ok mt-1 font-mono">{lastUpdated}</span>
        </div>
      </div>

      <footer className="mt-8 pt-4 border-t border-border text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">
        SismoBR · Dados em tempo real do serviço sismológico USGS (cobertura RSBR) · Atualização a cada 60s
      </footer>
    </div>
  );
}
