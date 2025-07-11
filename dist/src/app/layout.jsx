"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});
export default function RootLayout({ children, }) {
    return (<html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <nav className="mb-8 flex space-x-6">
            <a href="/absences/new" className="text-indigo-700 font-semibold hover:underline">Report Absence</a>
            <a href="/absences/assign" className="text-indigo-700 font-semibold hover:underline">Assign Coverage</a>
            <a href="/dashboard" className="text-indigo-700 font-semibold hover:underline">Dashboard</a>
            <a href="/admin" className="text-indigo-700 font-semibold hover:underline">Admin</a>
          </nav>
          {children}
        </SessionProvider>
      </body>
    </html>);
}
