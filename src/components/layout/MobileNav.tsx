"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Reservations", href: "/reservations" },
  { label: "Customers", href: "/customers" },
  { label: "Settings", href: "/settings" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-outline hover:text-white"
        aria-label="Toggle menu"
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="fixed top-[41px] left-0 right-0 z-50 bg-void border-b border-outline py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm font-headline uppercase tracking-headline ${
                  pathname === item.href ? "bg-obsidian text-white" : "text-outline hover:bg-surface-low"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
