import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lon: number;
  source: "geolocation" | "fallback";
  label?: string;
}

const FALLBACK: UserLocation = {
  lat: -15.7939,
  lon: -47.8828,
  source: "fallback",
  label: "Brasília, DF (padrão)",
};

export function useGeolocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  const request = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation(FALLBACK);
      setStatus("denied");
      return;
    }
    setStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: "geolocation",
        });
        setStatus("granted");
      },
      () => {
        setLocation(FALLBACK);
        setStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

  useEffect(() => {
    request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location: location ?? FALLBACK, status, request };
}
