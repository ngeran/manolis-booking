import { ReactNode } from "react";

interface BorderTileProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function BorderTile({ title, children, className = "" }: BorderTileProps) {
  return (
    <div className={`relative border border-obsidian p-3 sm:p-[0.9rem] ${className}`}>
      {title && (
        <span className="absolute -top-[8px] left-3 bg-void px-2 text-xs font-headline uppercase tracking-headline text-outline">
          {title}
        </span>
      )}
      {children}
    </div>
  );
}
