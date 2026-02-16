"use client";

import { useEffect, useRef, useState } from "react";

function formatTime(ms: number) {
  const safeMs = Math.max(0, Math.floor(ms));

  const minutes = Math.floor(safeMs / 60000);
  const seconds = Math.floor((safeMs % 60000) / 1000);
  const millis = safeMs % 1000;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(millis).padStart(3, "0");

  return `${mm}:${ss}.${mmm}`;
}

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [displayMs, setDisplayMs] = useState(0);

  // Internal refs (no re-renders)
  const startTimeRef = useRef<number | null>(null); // timestamp when current run began
  const accumulatedRef = useRef(0); // total elapsed from previous runs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStartPause = () => {
    if (!isRunning) {
      // Start / Resume
      startTimeRef.current = Date.now();
      setIsRunning(true);
      return;
    }

    // Pause
    if (startTimeRef.current !== null) {
      accumulatedRef.current += Date.now() - startTimeRef.current;
    }
    startTimeRef.current = null;
    setIsRunning(false);
  };

  const handleReset = () => {
    // Stop and clear everything
    setIsRunning(false);
    startTimeRef.current = null;
    accumulatedRef.current = 0;
    setDisplayMs(0);
  };

  // Continuous UI updates while running (accuracy comes from timestamps)
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current === null) return;

      const elapsedThisRun = Date.now() - startTimeRef.current;
      setDisplayMs(accumulatedRef.current + elapsedThisRun);
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Ensure display is correct immediately after pausing (no stale display)
  useEffect(() => {
    if (!isRunning) {
      setDisplayMs(accumulatedRef.current);
    }
  }, [isRunning]);

  const isResetDisabled = displayMs === 0 && !isRunning;

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

          <button onClick={handleReset} style={{ padding: "10px 14px" }} disabled={isResetDisabled}>
            Reset
          </button>
        </div>
      </div>
    </main>
  );
}
