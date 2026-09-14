import { useEffect, useState } from "react";

export function useRefreshInterval() {
  const read = () => { try { return Math.max(3000, Number(JSON.parse(localStorage.getItem("sepid-settings") || "{}").refreshInterval || 3) * 1000); } catch { return 3000; } };
  const [interval, setIntervalValue] = useState(read);
  useEffect(() => { const onSettings = (event: Event) => { const next = (event as CustomEvent).detail; if (next?.refreshInterval) setIntervalValue(Math.max(3000, Number(next.refreshInterval) * 1000)); else setIntervalValue(read()); }; window.addEventListener("sepid-settings-updated", onSettings); return () => window.removeEventListener("sepid-settings-updated", onSettings); }, []);
  return interval;
}
