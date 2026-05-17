"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="border-b border-outline px-4 py-3 mb-8">
          <h1 className="font-headline text-sm uppercase tracking-headline text-cyber-blue">
            Manolis Booking
          </h1>
          <p className="font-headline text-xs text-outline mt-1">
            AUTHENTICATION REQUIRED
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div className="relative border border-obsidian p-3">
            <span className="absolute -top-3 left-3 bg-void px-2 text-xs font-headline uppercase tracking-headline text-outline">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-low text-white px-3 py-2 font-body
                         border border-obsidian focus:border-cyber-blue focus:outline-none"
              placeholder="Enter username"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative border border-obsidian p-3">
            <span className="absolute -top-3 left-3 bg-void px-2 text-xs font-headline uppercase tracking-headline text-outline">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-low text-white px-3 py-2 font-body
                         border border-obsidian focus:border-cyber-blue focus:outline-none"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Remember Me */}
          <label className="flex items-center gap-3 cursor-pointer px-1">
            <div
              className={`w-4 h-4 border flex items-center justify-center ${
                remember ? "border-cyber-blue bg-cyber-blue/20" : "border-obsidian"
              }`}
            >
              {remember && (
                <svg
                  className="w-3 h-3 text-cyber-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="hidden"
            />
            <span className="text-sm font-body text-outline">
              Remember this terminal
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="border border-red-800 bg-red-900/20 px-4 py-2 text-red-400 text-sm font-body">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-obsidian text-white px-4 py-3 font-headline uppercase
                       tracking-headline hover:brightness-110 active:animate-pulse
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Authenticating..." : "Access System"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 border-t border-outline pt-3">
          <p className="text-xs font-headline text-outline tracking-headline">
            MANOLIS BOOKING v0.1.0 — AUTHORIZED PERSONNEL ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
