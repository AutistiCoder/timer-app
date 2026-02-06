"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(ms:number) {
  const totalMs = Math.max(0, Math.floor(ms));
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const millis = totalMs % 1000;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(millis).padStart(3, "0");

  return `${mm}:${ss}.${mmm}`;
}

export default function Page() {
  // "Truth" state
  const [isRunning, setIsRunning] = useState(false);
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null); // number | null
  const [accumulatedMs, setAccumulatedMs] = useState(0); // number

  // "Display" state (UI refresh only)
  const [displayMs, setDisplayMs] = useState(0);

  // Use a ref for RAF id so we can cancel cleanly
  const rafIdRef = useRef<number | null>(null);

  // Compute current elapsed time from timestamps (this is the accurate value)
  const currentElapsedMs = useMemo(() => {
    if (!isRunning || startTimeMs === null) return accumulatedMs;
    return accumulatedMs + (performance.now() - startTimeMs);
  }, [isRunning, startTimeMs, accumulatedMs]);

  // Keep display in sync while running (does NOT "create" time—just recomputes)
  useEffect(() => {
    // Always show accurate time even when paused
    setDisplayMs(currentElapsedMs);

    if (!isRunning) {
      // Stop any animation loop when not running
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const tick = () => {
      // recompute from timestamps (accurate)
      const now = performance.now();
      const elapsed = startTimeMs === null ? accumulatedMs : accumulatedMs + (now - startTimeMs);
      setDisplayMs(elapsed);
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isRunning, startTimeMs, accumulatedMs, currentElapsedMs]);

  const handleStartPause = () => {
    if (!isRunning) {
      // Start (or resume)
      setStartTimeMs(performance.now());
      setIsRunning(true);
      return;
    }

    // Pause: fold this run into accumulated time
    const now = performance.now();
    setAccumulatedMs((prev) => {
      // startTimeMs should be non-null here, but guard anyway
      const runMs = startTimeMs === null ? 0 : now - startTimeMs;
      return prev + runMs;
    });
    setStartTimeMs(null);
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setStartTimeMs(null);
    setAccumulatedMs(0);
    setDisplayMs(0);
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: "min(520px, 100%)", border: "1px solid #ddd", borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: 48, fontVariantNumeric: "tabular-nums", textAlign: "center", marginBottom: 16 }}>
          {formatTime(displayMs)}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={handleStartPause} style={{ padding: "10px 14px" }}>
            {isRunning ? "Pause" : "Start"}
          </button>

          <button onClick={handleReset} style={{ padding: "10px 14px" }} disabled={isRunning && displayMs > 0 ? false : displayMs === 0}>
            Reset
          </button>
        </div>
      </div>
    </main>
  );
}
