"use client";

import dynamic from 'next/dynamic';

// Dynamically import the dashboard with no SSR
const PokerClubDashboard = dynamic(
  () => import('../components/poker-club-dashboard'),
  { ssr: false }
);

export default function Home() {
  return <PokerClubDashboard />;
}