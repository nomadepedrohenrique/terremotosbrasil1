interface WaveformProps {
  variant?: "calm" | "spike";
  color?: string;
}

// Generates a deterministic seismograph-style polyline
function makePath(width: number, height: number, spike: boolean, seed: number) {
  const points: string[] = [];
  const mid = height / 2;
  const step = 2;
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let x = 0; x <= width; x += step) {
    const noise = (rand() - 0.5) * 6;
    let y = mid + Math.sin(x * 0.08) * 4 + Math.sin(x * 0.21) * 3 + noise;
    if (spike && x > width * 0.55 && x < width * 0.7) {
      const k = (x - width * 0.55) / (width * 0.15);
      const env = Math.sin(k * Math.PI);
      y += env * (rand() - 0.5) * 60;
    }
    points.push(`${x},${y.toFixed(2)}`);
  }
  return `M ${points.join(" L ")}`;
}

export function Waveform({ variant = "calm", color = "var(--color-ok)" }: WaveformProps) {
  const w = 800;
  const h = 96;
  const path = makePath(w, h, variant === "spike", variant === "spike" ? 7 : 3);
  const path2 = makePath(w, h, variant === "spike", variant === "spike" ? 11 : 5);

  return (
    <div className="relative w-full h-24 overflow-hidden rounded-md bg-background/60 border border-border">
      {/* grid */}
      <svg className="absolute inset-0 w-full h-full opacity-40" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="40" height="24" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 24" fill="none" stroke="var(--color-border)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* scrolling waveform */}
      <div className="absolute inset-0 flex animate-waveform" style={{ width: "200%" }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-1/2 shrink-0">
          <path d={path} fill="none" stroke={color} strokeWidth="1.2" />
        </svg>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-1/2 shrink-0">
          <path d={path2} fill="none" stroke={color} strokeWidth="1.2" />
        </svg>
      </div>

      {/* center axis */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-border/60" />
    </div>
  );
}
