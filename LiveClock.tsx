import { useEffect, useState } from "react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : "--:--:--";

  return (
    <div className="font-mono text-lg sm:text-xl tabular-nums tracking-tight text-foreground">
      {time}{" "}
      <span className="text-muted-foreground text-[10px] uppercase tracking-widest">UTC-3</span>
    </div>
  );
}
