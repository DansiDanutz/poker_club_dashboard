"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TVRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to TV display
    window.location.href = '/tv-display.html';
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-xl">Redirecting to TV Display...</p>
      </div>
    </div>
  );
}