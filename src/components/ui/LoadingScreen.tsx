'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export default function LoadingScreen({ onComplete, duration = 1000 }: LoadingScreenProps) {
  const [phase, setPhase] = useState<'init' | 'fade' | 'complete'>('init');

  useEffect(() => {
    // Start fade out after duration
    const fadeTimer = setTimeout(() => {
      setPhase('fade');
    }, duration);

    const completeTimer = setTimeout(() => {
      setPhase('complete');
      if (onComplete) onComplete();
    }, duration + 500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  if (phase === 'complete') return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background overflow-hidden transition-all duration-500 ${
        phase === 'fade' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-background to-pink-900/20" />
        
        {/* Animated orbs */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-pink-600/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Logo Container - Centered */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo with Effects */}
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-purple-500/30 blur-2xl animate-pulse" />
          
          {/* Rotating ring */}
          <div className="absolute -inset-3 rounded-full opacity-40">
            <div className="w-full h-full rounded-full border-2 border-transparent border-t-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Logo */}
          <div className="relative w-32 h-32">
            <Image
              src="/logo.png"
              alt="Movo"
              fill
              sizes="128px"
              className="object-cover rounded-2xl shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* App Name */}
        <h1 className="mt-6 text-4xl font-bold text-white tracking-tight">
          Movo
        </h1>
      </div>

      {/* Bottom dots */}
      <div className="absolute bottom-12 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div 
            key={i}
            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
            style={{ 
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Loading spinner for inline use
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  return (
    <div className={`${sizeClasses[size]} border-purple-500/20 border-t-purple-500 rounded-full animate-spin`} />
  );
}

// Full screen loading overlay
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-xl">
      <div className="relative">
        <div className="w-20 h-20 border-3 border-purple-500/20 rounded-full animate-spin" />
        <div className="absolute inset-0 w-20 h-20 border-3 border-pink-500/20 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <p className="mt-6 text-gray-400 animate-pulse font-medium">{message}</p>
    </div>
  );
}
