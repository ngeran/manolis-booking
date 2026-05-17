"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BorderTile from "@/components/ui/BorderTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, Employee } from "@/hooks/useEmployees";

const emptyForm = { username: "", password: "", email: "", fullName: "", role: "staff" as "admin" | "staff" | "manager" };

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const currentUserId = session?.user?.id;

  const { data: employees, isLoading } = useEmployees();
  const createEmp = useCreateEmployee();
  const updateEmp = useUpdateEmployee();
  const deleteEmp = useDeleteEmployee();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
    setEditing(null);
  }

  function startEdit(e: Employee) {
    setForm({
      username: e.username,
      password: "",
      email: e.email,
      fullName: e.fullName,
      role: e.role as "admin" | "staff" | "manager",
    });
    setEditing(e);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    try {
      if (editing) {
        const data: any = { id: editing.id, email: form.email, fullName: form.fullName, role: form.role };
        if (form.password) data.password = form.password;
        await updateEmp.mutateAsync(data);
        toast.success("Employee updated");
      } else {
        await createEmp.mutateAsync(form);
        toast.success("Employee created");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await deleteEmp.mutateAsync(id);
      toast.success("Employee removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="font-headline text-xl sm:text-2xl uppercase tracking-headline">Settings</h1>

      {/* Appearance */}
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

      {role !== "admin" ? (
        <BorderTile>
          <p className="text-sm text-outline font-headline">Admin access required to manage employees.</p>
        </BorderTile>
      ) : (
        <>
          {/* Add/Edit Employee Form */}
          {(showForm || editing) && (
            <BorderTile title={editing ? "Edit Employee" : "New Employee"}>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs text-outline font-headline uppercase mb-1">Username</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    disabled={!!editing}
                    className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-outline font-headline uppercase mb-1">
                    Password {editing && "(leave blank to keep)"}
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editing}
                    className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-outline font-headline uppercase mb-1">Full Name</label>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    required
                    className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-outline font-headline uppercase mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-outline font-headline uppercase mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button type="submit" disabled={createEmp.isPending || updateEmp.isPending} className="btn-primary text-xs font-headline uppercase tracking-headline flex-1">
                    {editing ? "Update" : "Create"}
                  </button>
                  <button type="button" onClick={resetForm} className="btn-ghost text-xs px-3 py-2">Cancel</button>
                </div>
              </form>
            </BorderTile>
          )}

          {/* Employees Table */}
          <BorderTile title="Employees">
            <div className="flex justify-end mt-1 mb-2">
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="btn-primary text-xs font-headline uppercase tracking-headline"
              >
                + Add Employee
              </button>
            </div>

            {isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-obsidian text-left">
                        <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Name</th>
                        <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Username</th>
                        <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Email</th>
                        <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Role</th>
                        <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Last Login</th>
                        <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees?.map((emp) => (
                        <tr key={emp.id} className="border-b border-obsidian/50 hover:bg-surface-low">
                          <td className="px-3 py-2 text-white">
                            {emp.fullName}
                            {emp.id === currentUserId && <span className="text-cyber-blue ml-1 text-xs">(you)</span>}
                          </td>
                          <td className="px-3 py-2 text-outline">{emp.username}</td>
                          <td className="px-3 py-2 text-outline">{emp.email}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-headline uppercase px-2 py-0.5 border ${
                              emp.role === "admin" ? "text-tactical-gold border-tactical-gold" :
                              emp.role === "manager" ? "text-cyber-blue border-cyber-blue" :
                              "text-outline border-outline"
                            }`}>
                              {emp.role}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-outline text-xs">
                            {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString() : "Never"}
                          </td>
                          <td className="px-3 py-2 flex gap-2">
                            <button onClick={() => startEdit(emp)} className="text-cyber-blue text-xs font-headline uppercase hover:underline">Edit</button>
                            {emp.id !== currentUserId && (
                              <button onClick={() => handleDelete(emp.id, emp.fullName)} className="text-red-400 text-xs font-headline uppercase hover:underline">Remove</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-2">
                  {employees?.map((emp) => (
                    <div key={emp.id} className="border border-obsidian p-3 bg-surface-low">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-white">
                            {emp.fullName}
                            {emp.id === currentUserId && <span className="text-cyber-blue ml-1 text-xs">(you)</span>}
                          </p>
                          <p className="text-xs text-outline">@{emp.username} • {emp.email}</p>
                        </div>
                        <span className={`text-xs font-headline uppercase px-2 py-0.5 border ${
                          emp.role === "admin" ? "text-tactical-gold border-tactical-gold" :
                          emp.role === "manager" ? "text-cyber-blue border-cyber-blue" :
                          "text-outline border-outline"
                        }`}>
                          {emp.role}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => startEdit(emp)} className="text-cyber-blue text-xs font-headline uppercase">Edit</button>
                        {emp.id !== currentUserId && (
                          <button onClick={() => handleDelete(emp.id, emp.fullName)} className="text-red-400 text-xs font-headline uppercase">Remove</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </BorderTile>
        </>
      )}
    </div>
  );
}
