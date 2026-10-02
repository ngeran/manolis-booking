"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP] Render error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="border border-outline bg-void p-6 max-w-sm text-center">
        <h2 className="font-headline text-lg uppercase tracking-headline text-red-400">
          System Fault
        </h2>
        <p className="text-sm text-outline font-body mt-2 mb-5">
          Something went wrong loading this page.
        </p>
        <button
          onClick={reset}
          className="btn-ghost w-full py-2.5 text-sm font-headline uppercase tracking-headline"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
