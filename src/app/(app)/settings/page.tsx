"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import BorderTile from "@/components/ui/BorderTile";

export default function SettingsPage() {
  const { data: session } = useRouter() ? useSession() : { data: null };
  const role = (session?.user as { role?: string })?.role;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff" | "manager">("staff");

  async function handleCreateEmployee(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email, fullName, role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      toast.success(`Employee "${fullName}" created`);
      setUsername("");
      setPassword("");
      setEmail("");
      setFullName("");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-headline text-2xl uppercase tracking-headline">Settings</h1>

      {/* Theme */}
      <BorderTile title="Appearance">
        <div className="mt-2">
          <p className="text-sm text-outline font-body">Dark mode is the default and only theme.</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-4 h-4 bg-void border border-obsidian inline-block" />
            <span className="w-4 h-4 bg-surface border border-obsidian inline-block" />
            <span className="w-4 h-4 bg-obsidian inline-block" />
            <span className="w-4 h-4 bg-cyber-blue inline-block" />
            <span className="w-4 h-4 bg-tactical-gold inline-block" />
          </div>
        </div>
      </BorderTile>

      {/* Manage Employees — Admin Only */}
      {role === "admin" && (
        <BorderTile title="Manage Employees">
          <form onSubmit={handleCreateEmployee} className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary text-xs font-headline uppercase tracking-headline w-full">
                Create Employee
              </button>
            </div>
          </form>
        </BorderTile>
      )}

      {role !== "admin" && (
        <BorderTile>
          <p className="text-sm text-outline font-headline">Admin access required to manage employees.</p>
        </BorderTile>
      )}
    </div>
  );
}
