"use client";

// Root-level boundary — replaces the entire document when the root layout
// itself throws, so it must render its own <html>/<body>.
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-body bg-void text-white antialiased">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="border border-outline bg-void p-6 max-w-sm text-center">
            <h2 className="font-headline text-lg uppercase tracking-headline text-red-400">
              System Fault
            </h2>
            <p className="text-sm text-outline mt-2 mb-5">
              A critical error occurred. Try again.
            </p>
            <button
              onClick={reset}
              className="btn-ghost w-full py-2.5 text-sm font-headline uppercase tracking-headline"
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
