import { useEffect, useState } from "react";

export const SPLASH_TTL = 8 * 60 * 60 * 1000;

export function useSplash() {
  const [visible, setVisible] = useState(() => {
    try {
      const raw = localStorage.getItem("lastSeen");
      if (!raw) return true;
      return Date.now() - Number(raw) > SPLASH_TTL;
    } catch { return true; }
  });

  useEffect(() => {
    if (!visible) return;
    try { localStorage.setItem("lastSeen", String(Date.now())); } catch {}
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      try {
        const raw = localStorage.getItem("lastSeen");
        if (!raw || Date.now() - Number(raw) > SPLASH_TTL) {
          localStorage.setItem("lastSeen", String(Date.now()));
          setVisible(true);
        }
      } catch {}
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return visible;
}
