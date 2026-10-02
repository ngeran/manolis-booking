import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="font-headline text-4xl uppercase tracking-headline text-cyber-blue">
          404
        </h1>
        <p className="font-headline text-sm uppercase tracking-headline text-outline mt-2">
          Sector not found
        </p>
        <Link
          href="/dashboard"
          className="btn-ghost inline-block mt-8 text-xs font-headline uppercase tracking-headline"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
