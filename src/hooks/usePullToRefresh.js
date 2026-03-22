import { useCallback, useRef, useState } from "react";

export const PTR_THRESHOLD = 72;

export function usePullToRefresh(onRefresh, scrollRef) {
  const [pullY, setPullY] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const startY = useRef(null);
  const pulling = useRef(false);

  // El scroll container real es #root (no el tab div)
  const getScrollTop = () => {
    const root = document.getElementById("root");
    return root ? root.scrollTop : 0;
  };

  const onTouchStart = useCallback((e) => {
    if (getScrollTop() > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || startY.current === null) return;
    if (getScrollTop() > 0) { pulling.current = false; startY.current = null; return; }
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) return;
    const y = Math.min(delta * 0.45, PTR_THRESHOLD + 20);
    setPullY(y);
    if (y >= PTR_THRESHOLD && !triggered) setTriggered(true);
    if (y < PTR_THRESHOLD && triggered) setTriggered(false);
  }, [triggered]);

  const onTouchEnd = useCallback(() => {
    if (triggered) onRefresh();
    setPullY(0);
    setTriggered(false);
    pulling.current = false;
    startY.current = null;
  }, [triggered, onRefresh]);

  return { pullY, triggered, onTouchStart, onTouchMove, onTouchEnd };
}
