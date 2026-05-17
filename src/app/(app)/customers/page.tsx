"use client";

import { useState } from "react";
import { toast } from "sonner";
import BorderTile from "@/components/ui/BorderTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useCustomers, useCreateCustomer, useUpdateCustomer, Customer } from "@/hooks/useCustomers";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useCustomers(search.length >= 2 ? search : undefined);
  const createCust = useCreateCustomer();
  const updateCust = useUpdateCustomer();

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dietaryNotes: "",
    birthday: "",
    optInMarketing: false,
  });

  function resetForm() {
    setForm({ firstName: "", lastName: "", phone: "", email: "", dietaryNotes: "", birthday: "", optInMarketing: false });
    setShowAdd(false);
    setEditing(null);
  }

  function startEdit(c: Customer) {
    setForm({
      firstName: c.firstName,
      lastName: c.lastName,
      phone: c.phone,
      email: c.email ?? "",
      dietaryNotes: c.dietaryNotes ?? "",
      birthday: c.birthday ?? "",
      optInMarketing: c.optInMarketing,
    });
    setEditing(c);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (editing) {
        await updateCust.mutateAsync({ id: editing.id, ...form });
        toast.success("Customer updated");
      } else {
        await createCust.mutateAsync(form);
        toast.success("Customer created");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-headline text-xl sm:text-2xl uppercase tracking-headline">Customers</h1>
        <button onClick={() => { resetForm(); setShowAdd(true); }} className="btn-primary text-xs font-headline uppercase tracking-headline">
          + Add
        </button>
      </div>

      {/* Search */}
      <BorderTile title="Search">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm mt-2"
          placeholder="Search by name, phone, or email..."
        />
      </BorderTile>

      {/* Add/Edit Form */}
      {(showAdd || editing) && (
        <BorderTile title={editing ? "Edit Customer" : "New Customer"}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">First Name</label>
              <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Last Name</label>
              <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Birthday</label>
              <input value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} type="date" className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Dietary Notes</label>
              <input value={form.dietaryNotes} onChange={(e) => setForm({ ...form, dietaryNotes: e.target.value })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.optInMarketing} onChange={(e) => setForm({ ...form, optInMarketing: e.target.checked })} className="w-5 h-5 accent-cyber-blue" />
                <span className="text-xs text-outline font-headline uppercase">Marketing</span>
              </label>
              <div className="flex-1" />
              <button type="button" onClick={resetForm} className="btn-ghost text-xs">Cancel</button>
              <button type="submit" disabled={createCust.isPending || updateCust.isPending} className="btn-primary text-xs">
                {editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </BorderTile>
      )}

      {/* Customer List */}
      {isLoading ? (
        <LoadingSkeleton rows={6} />
      ) : (
        <BorderTile title={`Customers (${customers?.length ?? 0})`}>
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-obsidian text-left">
                  <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Name</th>
                  <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Phone</th>
                  <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Email</th>
                  <th className="px-3 py-2 font-headline text-xs uppercase text-outline text-center">Visits</th>
                  <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Last Visit</th>
                  <th className="px-3 py-2 font-headline text-xs uppercase text-outline text-center">Mkt</th>
                  <th className="px-3 py-2 font-headline text-xs uppercase text-outline">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers?.map((c) => (
                  <tr key={c.id} className="border-b border-obsidian/50 hover:bg-surface-low">
                    <td className="px-3 py-2 text-white">{c.firstName} {c.lastName}</td>
                    <td className="px-3 py-2 text-outline">{c.phone}</td>
                    <td className="px-3 py-2 text-outline">{c.email || "—"}</td>
                    <td className="px-3 py-2 text-center text-white">{c.totalVisits}</td>
                    <td className="px-3 py-2 text-outline">{c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-2 text-center">{c.optInMarketing ? <span className="text-cyber-blue">YES</span> : <span className="text-outline">NO</span>}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => startEdit(c)} className="text-cyber-blue text-xs font-headline uppercase hover:underline">Edit</button>
                    </td>
                  </tr>
                ))}
                {(!customers || customers.length === 0) && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-outline font-headline text-xs">
                      {search.length < 2 ? "Type at least 2 characters to search" : "No customers found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2 mt-2">
            {(!customers || customers.length === 0) && (
              <p className="text-xs text-outline font-headline py-3 text-center">
                {search.length < 2 ? "Type at least 2 chars to search" : "No customers found"}
              </p>
            )}
            {customers?.map((c) => (
              <div key={c.id} className="border border-obsidian p-3 bg-surface-low">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white">{c.firstName} {c.lastName}</p>
                    <p className="text-xs text-outline">{c.phone}</p>
                    {c.email && <p className="text-xs text-outline">{c.email}</p>}
                  </div>
                  <button onClick={() => startEdit(c)} className="text-cyber-blue text-xs font-headline uppercase ml-2">Edit</button>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-outline">
                  <span>{c.totalVisits} visits</span>
                  <span>{c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : "—"}</span>
                  {c.optInMarketing && <span className="text-cyber-blue">MKT</span>}
                </div>
              </div>
            ))}
          </div>
        </BorderTile>
      )}
    </div>
  );
}
