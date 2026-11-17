import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';

interface LoaderScreenProps {
  onReady?: () => void;
  minDisplayTimeMs?: number;
}

const MINIMAL_STATUSES = [
  'Waking assurance engine...',
  'Initializing ledger vault...',
  'Calibrating anomaly models...',
  'Synchronizing audit rules...',
  'Establishing secure connection...',
];

export const LoaderScreen: React.FC<LoaderScreenProps> = ({
  onReady,
  minDisplayTimeMs = 800,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [statusIndex, setStatusIndex] = useState<number>(0);
  const [isHealthy, setIsHealthy] = useState<boolean>(false);

  const mountTimeRef = useRef<number>(Date.now());
  const completedRef = useRef<boolean>(false);

  // 1. Elapsed timer for subtle status transitions
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timerInterval);
  }, []);

  // 2. Rotate through natural status pulses every 9 seconds
  useEffect(() => {
    if (isHealthy) return;
    const nextIndex = Math.min(
      Math.floor(elapsedSeconds / 9),
      MINIMAL_STATUSES.length - 1
    );
    setStatusIndex(nextIndex);
  }, [elapsedSeconds, isHealthy]);

  // 3. Active Background Health Probe (checks /api/health every 2.5s)
  useEffect(() => {
    let isCancelled = false;

    const probeBackend = async () => {
      if (completedRef.current) return;

      const ok = await api.checkHealth();
      if (ok && !isCancelled && !completedRef.current) {
        completedRef.current = true;
        setIsHealthy(true);

        const elapsedSinceMount = Date.now() - mountTimeRef.current;
        const remainingTime = Math.max(0, minDisplayTimeMs - elapsedSinceMount);

        setTimeout(() => {
          if (onReady) onReady();
        }, remainingTime + 400);
      }
    };

    probeBackend();
    const pollInterval = setInterval(probeBackend, 2500);

    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
  }, [onReady, minDisplayTimeMs]);

  const currentStatus = isHealthy
    ? 'Connected • Launching workspace...'
    : MINIMAL_STATUSES[statusIndex];

  return (
    <div className="min-h-screen w-full bg-[#08090B] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none text-[#F5F3EF]">
      {/* Subtle Atmospheric Ambient Glow */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[380px] bg-[#FFC900]/8 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Ultra-Minimal Frosted Glass Card */}
      <div className="w-full max-w-[340px] glass-card p-8 flex flex-col items-center text-center relative z-10 border border-white/12 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.85)] rounded-3xl">
        {/* Cosmic Gyroscopic Animation Centerpiece */}
        <div className="relative w-28 h-28 my-2 flex items-center justify-center">
          {/* Outer Rotating Dashed Orbit Ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-[#FFC900]/30 animate-[spin_16s_linear_infinite]" />

          {/* Outer Satellite Marker */}
          <div className="absolute inset-0 animate-[spin_16s_linear_infinite]">
            <div className="w-2 h-2 rounded-full bg-[#FFC900] shadow-[0_0_10px_#FFC900] absolute -top-1 left-1/2 -translate-x-1/2" />
          </div>

          {/* Middle Reverse Ring */}
          <div className="absolute inset-2.5 rounded-full border border-white/10 border-t-[#FFC900]/70 border-b-[#FFC900]/70 animate-[spin_9s_linear_infinite_reverse]" />

          {/* Inner Golden Core Emblem */}
          <div
            className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
              isHealthy
                ? 'bg-emerald-400 text-[#08090B] shadow-emerald-400/30'
                : 'bg-[#FFC900] text-[#08090B] shadow-[#FFC900]/35 animate-gyro-pulse'
            }`}
          >
            {isHealthy ? (
              <svg className="w-6 h-6 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-6 h-6 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="4.5" />
                <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
              </svg>
            )}
          </div>
        </div>

        {/* Minimal Typography */}
        <div className="mt-4 mb-5">
          <h3 className="text-base font-bold font-display text-[#F5F3EF] tracking-tight">
            FinAudit Platform
          </h3>
          <p className="text-xs text-[#F5F3EF]/60 font-mono mt-1 transition-all duration-300">
            {currentStatus}
          </p>
        </div>

        {/* Sleek Indeterminate Shimmer Beam (No fake percentages) */}
        <div className="w-full max-w-[200px] h-1 bg-white/[0.08] rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isHealthy
                ? 'w-full bg-emerald-400'
                : 'absolute bg-gradient-to-r from-[#FFC900]/30 via-[#FFC900] to-[#FFE27D] animate-indeterminate'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
