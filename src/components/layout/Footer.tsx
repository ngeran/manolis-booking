"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const shortcuts = [
  { key: "D", label: "DASHBOARD", href: "/dashboard" },
  { key: "R", label: "RESERVATIONS", href: "/reservations" },
  { key: "C", label: "CUSTOMERS", href: "/customers" },
  { key: "S", label: "SETTINGS", href: "/settings" },
];

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-outline px-4 py-2
                        bg-void z-50 font-headline text-sm uppercase tracking-headline">
      <div className="flex items-center gap-6">
        {shortcuts.map((s) => {
          const active = pathname === s.href;
          return (
            <Link
              key={s.key}
              href={s.href}
              className={`flex items-center gap-1.5 transition-colors ${
                active ? "text-cyber-blue" : "text-outline hover:text-white"
              }`}
            >
              <span className="text-cyber-blue">[{s.key}]</span>
              <span>{s.label}</span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
