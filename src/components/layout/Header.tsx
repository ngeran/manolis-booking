"use client";

import { useSession, signOut } from "next-auth/react";
import MobileNav from "./MobileNav";

export default function Header() {
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "UNKNOWN";
  const role = (session?.user as { role?: string })?.role?.toUpperCase() ?? "N/A";

  return (
    <header className="border-b border-outline px-4 py-2 flex items-center justify-between bg-void sticky top-0 z-50">
      <div className="flex items-center gap-2 sm:gap-4 font-headline text-sm uppercase tracking-headline">
        {/* Mobile hamburger */}
        <MobileNav />

        {/* Logo */}
        <span className="text-cyber-blue font-bold">MANOLIS</span>

        {/* Status indicators — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 inline-block" />
            <span className="text-outline">API: ONLINE</span>
          </span>
          <span className="text-outline">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 inline-block" />
            <span className="text-outline">DB: CONNECTED</span>
          </span>
          <span className="text-outline">|</span>
          <span className="text-outline">
            USER: <span className="text-white">{userName}</span>
          </span>
          <span className="text-outline">|</span>
          <span className="text-outline">
            ROLE: <span className="text-tactical-gold">{role}</span>
          </span>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="border border-outline text-outline px-2 sm:px-3 py-1.5 text-xs font-headline uppercase
                   tracking-headline hover:border-red-600 hover:text-red-500 transition-colors"
      >
        <span className="hidden sm:inline">Disconnect</span>
        <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
      </button>
    </header>
  );
}
