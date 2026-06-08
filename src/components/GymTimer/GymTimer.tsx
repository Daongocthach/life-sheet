import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Timer } from 'lucide-react';
import { useWorkoutStore } from '../../store/useWorkoutStore';

export const GymTimer: React.FC = () => {
  const { t } = useTranslation();
  const { timerSeconds, isTimerActive, stopTimer, tickTimer } = useWorkoutStore();
  const tickIntervalRef = useRef<any>(null);

  // Bộ đếm thời gian
  useEffect(() => {
    if (isTimerActive) {
      tickIntervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [isTimerActive, tickTimer]);

  // Synthesize beep sound via Web Audio API
  const playSynthesizedBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const playSingleBeep = (startTime: number) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, startTime); // Beep frequency
        
        gainNode.gain.setValueAtTime(0.15, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      };

      const now = audioCtx.currentTime;
      playSingleBeep(now);
      playSingleBeep(now + 0.4); // Double beep
    } catch (e) {
      console.warn("Autoplay blocked or Web Audio API not supported", e);
    }
  };

  // Phát nhạc khi hết giờ
  useEffect(() => {
    if (isTimerActive && timerSeconds === 0) {
      playSynthesizedBeep();
    }
  }, [timerSeconds, isTimerActive]);

  if (!isTimerActive) return null;

  const totalTime = 60; // Mặc định thời gian bắt đầu
  const percentage = Math.min((timerSeconds / totalTime) * 100, 100);
  const size = 220;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
      }}
    >
      {/* Timer container */}
      <div
        className="glass-card"
        style={{
          width: '90%',
          maxWidth: '360px',
          padding: '40px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          borderColor: 'rgba(37, 99, 235, 0.3)',
          boxShadow: '0 0 40px rgba(37, 99, 235, 0.25)',
        }}
      >
        <Timer size={32} style={{ color: 'var(--primary-accent)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-accent)', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t('workout.timer_title')}
        </h2>

        {/* Circular indicator */}
        <div style={{ position: 'relative', width: size, height: size, marginBottom: '32px' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />
            {/* Progress ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="var(--primary)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 1s linear',
                filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.5))',
              }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'monospace' }}>
              {timerSeconds}s
            </span>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={stopTimer}
          className="btn"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            padding: '10px 32px',
            borderRadius: 'var(--rounded-full)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--error)';
            e.currentTarget.style.borderColor = 'var(--error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }}
        >
          Bỏ Qua
        </button>
      </div>
    </div>
  );
};
export default GymTimer;
