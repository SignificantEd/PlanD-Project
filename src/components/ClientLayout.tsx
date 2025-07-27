'use client';

import { SessionProvider } from "next-auth/react";
import Link from 'next/link';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ background: '#eef', padding: '8px 0', textAlign: 'center' }}>
        <Link href="/debug" style={{ color: '#2d3a7b', fontWeight: 700, fontSize: 18, textDecoration: 'underline' }}>
          Debug Page
        </Link>
      </div>
      <SessionProvider>
        <nav className="mb-8 flex space-x-6">
          <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
          <a href="/master-schedule" className="text-indigo-700 font-semibold hover:underline">Master Schedule</a>
          <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
          <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
          <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
        </nav>
        {children}
      </SessionProvider>
    </>
  );
}
