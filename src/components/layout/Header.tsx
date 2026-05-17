"use client";

import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "UNKNOWN";
  const role = (session?.user as { role?: string })?.role?.toUpperCase() ?? "N/A";

  return (
    <header className="border-b border-outline px-4 py-2 flex items-center justify-between bg-void sticky top-0 z-50">
      <div className="flex items-center gap-4 font-headline text-sm uppercase tracking-headline">
        {/* Logo */}
        <span className="text-cyber-blue font-bold mr-2">MANOLIS</span>

        {/* Status indicators */}
        <div className="flex items-center gap-3 text-xs">
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
        className="border border-outline text-outline px-3 py-1 text-xs font-headline uppercase
                   tracking-headline hover:border-red-600 hover:text-red-500 transition-colors"
      >
        Disconnect
      </button>
    </header>
  );
}
