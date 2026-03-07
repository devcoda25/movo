'use client';

import { useState, useEffect, ReactNode } from 'react';
import LoadingScreen from './ui/LoadingScreen';

interface LoadingWrapperProps {
  children: ReactNode;
}

export default function LoadingWrapper({ children }: LoadingWrapperProps) {
  const [showLoading, setShowLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we've already shown the loading screen in this session
    const loadingShown = sessionStorage.getItem('movo_loading_shown');
    
    if (!loadingShown) {
      setShowLoading(true);
      sessionStorage.setItem('movo_loading_shown', 'true');
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    setShowLoading(false);
    setIsLoading(false);
  };

  if (isLoading && !showLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {showLoading && (
        <LoadingScreen onComplete={handleLoadingComplete} duration={10} />
      )}
      <div className={showLoading ? 'hidden' : ''}>
        {children}
      </div>
    </>
  );
}
