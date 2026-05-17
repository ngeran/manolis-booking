"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BorderTile from "@/components/ui/BorderTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useReservations, useCreateReservation, useUpdateReservation, useCancelReservation, Reservation } from "@/hooks/useReservations";
import { useCustomers } from "@/hooks/useCustomers";

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

const statusColors: Record<string, string> = {
  confirmed: "text-cyber-blue border-cyber-blue",
  seated: "text-green-400 border-green-400",
  cancelled: "text-red-400 border-red-400",
  no_show: "text-yellow-500 border-yellow-500",
};

const statusBg: Record<string, string> = {
  confirmed: "bg-cyber-blue/10",
  seated: "bg-green-400/10",
  cancelled: "bg-red-400/10",
  no_show: "bg-yellow-500/10",
};

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayFull = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const timeSlots = Array.from({ length: 22 }, (_, i) => {
  const hour = 11 + Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  if (hour > 22) return null;
  return `${String(hour).padStart(2, "0")}:${min}:00`;
}).filter(Boolean);

function getWeekDates(offset: number): Date[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmt(date: Date) {
  return date.toISOString().split("T")[0];
}

function isToday(date: Date) {
  return date.toDateString() === new Date().toDateString();
}

function exportCSV(data: any[]) {
  const headers = ["Date", "Time", "Customer", "Phone", "Party Size", "Status", "Special Requests"];
  const rows = data.map((r) => [
    r.reservationDate, formatTime(r.reservationTime),
    `${r.customerFirstName} ${r.customerLastName}`, r.customerPhone,
    r.partySize, r.status, r.specialRequests || "",
  ]);
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservations-${fmt(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Modal component ──────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-x-3 top-[5%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 bg-void border border-obsidian p-4 sm:p-6 overflow-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg uppercase tracking-headline">{title}</h2>
          <button onClick={onClose} className="text-outline hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────

export default function ReservationsPage() {
  const { data: session } = useSession();
  const employeeId = session?.user?.id ?? "";

  const [weekOffset, setWeekOffset] = useState(0);
  const week = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekFrom = fmt(week[0]);
  const weekTo = fmt(week[6]);

  const { data: reservations, isLoading } = useReservations(undefined, weekFrom, weekTo);
  const createRes = useCreateReservation();
  const updateRes = useUpdateReservation();
  const cancelRes = useCancelReservation();

  // Selected day for detail view
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Add reservation modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: "", customerPhone: "", partySize: 2,
    reservationDate: fmt(new Date()), reservationTime: "19:00:00",
    specialRequests: "",
  });

  // Edit reservation modal
  const [editRes, setEditRes] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    partySize: 2, reservationTime: "19:00:00", specialRequests: "", status: "confirmed",
  });

  // Customer lookup for autofill
  const [phoneLookup, setPhoneLookup] = useState("");
  const { data: foundCustomers } = useCustomers(phoneLookup.length >= 3 ? phoneLookup : undefined);

  function handlePhoneBlur() {
    if (!foundCustomers?.length) return;
    const c = foundCustomers[0];
    setAddForm(f => ({ ...f, customerName: `${c.firstName} ${c.lastName}` }));
  }

  function openEdit(r: Reservation) {
    setEditRes(r);
    setEditForm({
      partySize: r.partySize,
      reservationTime: r.reservationTime,
      specialRequests: r.specialRequests || "",
      status: r.status,
    });
  }

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    try {
      await createRes.mutateAsync({ ...addForm, employeeId });
      toast.success("Reservation created");
      setShowAdd(false);
      setAddForm({ customerName: "", customerPhone: "", partySize: 2, reservationDate: fmt(new Date()), reservationTime: "19:00:00", specialRequests: "" });
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleEditSave(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editRes) return;
    try {
      await updateRes.mutateAsync({ id: editRes.id, ...editForm });
      toast.success("Reservation updated");
      setEditRes(null);
    } catch { toast.error("Failed to update"); }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateRes.mutateAsync({ id, status });
      toast.success(`Status → ${status.replace("_", " ")}`);
    } catch { toast.error("Failed"); }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this reservation?")) return;
    try {
      await cancelRes.mutateAsync(id);
      toast.success("Reservation cancelled");
    } catch { toast.error("Failed"); }
  }

  // Group by date
  const byDate = useMemo(() => {
    const map: Record<string, typeof reservations> = {};
    if (reservations) {
      for (const r of reservations) {
        (map[r.reservationDate] ??= []).push(r);
      }
    }
    return map;
  }, [reservations]);

  const allReservations = reservations ?? [];

  // Selected day details
  const selectedDayReservations = useMemo(() => {
    if (!selectedDay) return [];
    return (byDate[selectedDay] ?? []).sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
  }, [selectedDay, byDate]);

  const selectedDayObj = selectedDay ? new Date(selectedDay + "T12:00:00") : null;
  const selectedDayLabel = selectedDayObj ? dayFull[(selectedDayObj.getDay() + 6) % 7] : "";
  const selectedDayTotalGuests = selectedDayReservations.reduce((a, r) => a + r.partySize, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-headline text-xl sm:text-2xl uppercase tracking-headline">Reservations</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => reservations && exportCSV(reservations)} disabled={!reservations?.length} className="btn-ghost text-xs px-2 sm:px-3 py-1.5 font-headline uppercase">CSV</button>
          <button onClick={() => setShowAdd(true)} className="btn-primary text-xs font-headline uppercase tracking-headline">+ Add</button>
        </div>
      </div>

      {/* Week Navigation */}
      <BorderTile>
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-ghost text-xs px-2 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="text-center">
            <span className="font-headline text-sm uppercase tracking-headline text-white">
              {week[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {week[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            {weekOffset !== 0 && (
              <button onClick={() => setWeekOffset(0)} className="block mx-auto text-xs text-cyber-blue font-headline uppercase mt-0.5">Today</button>
            )}
          </div>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost text-xs px-2 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </BorderTile>

      {/* Weekly Calendar */}
      {isLoading ? (
        <LoadingSkeleton rows={7} />
      ) : (
        <div className="grid grid-cols-7 gap-px bg-obsidian border border-obsidian">
          {week.map((date, i) => {
            const dateStr = fmt(date);
            const dayRes = byDate[dateStr] ?? [];
            const active = dayRes.filter(r => r.status !== "cancelled").length;
            const today = isToday(date);
            const selected = selectedDay === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(selected ? null : dateStr)}
                className={`bg-void flex flex-col text-left transition-colors ${
                  selected ? "ring-2 ring-cyber-blue ring-inset" : today ? "ring-1 ring-cyber-blue/40 ring-inset" : ""
                } hover:bg-surface-low`}
              >
                <div className={`px-2 py-1.5 text-center border-b border-obsidian ${today ? "bg-cyber-blue/10" : ""}`}>
                  <p className="font-headline text-[10px] sm:text-xs uppercase tracking-headline text-outline">{dayLabels[i]}</p>
                  <p className={`font-headline text-base sm:text-lg ${today ? "text-cyber-blue" : "text-white"}`}>{date.getDate()}</p>
                </div>
                <div className="flex-1 p-1">
                  {active > 0 ? (
                    <div className="text-center">
                      <p className={`font-headline text-sm ${active > 10 ? "text-tactical-gold" : active > 5 ? "text-cyber-blue" : "text-white"}`}>{active}</p>
                      <p className="text-[9px] text-outline">{active === 1 ? "booking" : "bookings"}</p>
                      <p className="text-[9px] text-outline">{dayRes.reduce((a, r) => a + (r.status !== "cancelled" ? r.partySize : 0), 0)} guests</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-obsidian text-center mt-2">—</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Week Summary */}
      <BorderTile title="Week Summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div>
            <p className="text-xl font-headline text-cyber-blue">{allReservations.filter(r => r.status !== "cancelled").length}</p>
            <p className="text-xs text-outline font-headline uppercase">Active</p>
          </div>
          <div>
            <p className="text-xl font-headline text-green-400">{allReservations.filter(r => r.status === "confirmed").length}</p>
            <p className="text-xs text-outline font-headline uppercase">Confirmed</p>
          </div>
          <div>
            <p className="text-xl font-headline text-white">{allReservations.filter(r => r.status === "seated").length}</p>
            <p className="text-xs text-outline font-headline uppercase">Seated</p>
          </div>
          <div>
            <p className="text-xl font-headline text-tactical-gold">{allReservations.reduce((a, r) => a + (r.status !== "cancelled" ? r.partySize : 0), 0)}</p>
            <p className="text-xs text-outline font-headline uppercase">Guests</p>
          </div>
        </div>
      </BorderTile>

      {/* Selected Day Detail View */}
      {selectedDay && (
        <BorderTile title={`${selectedDayLabel} — ${selectedDayReservations.length} reservations • ${selectedDayTotalGuests} guests`}>
          <div className="mt-2 space-y-2 max-h-[60vh] overflow-auto">
            {selectedDayReservations.length === 0 ? (
              <p className="text-sm text-outline font-headline py-4 text-center">No reservations for this day</p>
            ) : (
              selectedDayReservations.map((r) => (
                <div key={r.id} className={`border border-obsidian p-3 ${statusBg[r.status] || ""}`}>
                  <div className="flex flex-col gap-2">
                    {/* Row 1: time + customer info */}
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        <p className="font-headline text-cyber-blue">{formatTime(r.reservationTime)}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{r.customerFirstName} {r.customerLastName}</p>
                        <p className="text-xs text-outline">{r.customerPhone} • {r.partySize} guests</p>
                        {r.specialRequests && <p className="text-xs text-tactical-gold mt-0.5">{r.specialRequests}</p>}
                      </div>
                      <span className={`shrink-0 text-xs font-headline uppercase tracking-headline border px-2 py-1 ${statusColors[r.status] || "text-outline border-outline"}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Row 2: actions */}
                    <div className="flex items-center gap-2 flex-wrap pl-0 sm:pl-[72px]">
                      <button onClick={() => openEdit(r)} className="border border-obsidian text-outline text-xs px-2 py-1 font-headline uppercase hover:border-cyber-blue hover:text-cyber-blue">
                        Edit
                      </button>
                      {r.status === "confirmed" && (
                        <>
                          <button onClick={() => handleStatusChange(r.id, "seated")} className="border border-green-800 text-green-400 text-xs px-2 py-1 font-headline uppercase hover:bg-green-900/20">Seat</button>
                          <button onClick={() => handleStatusChange(r.id, "no_show")} className="border border-yellow-600 text-yellow-500 text-xs px-2 py-1 font-headline uppercase hover:bg-yellow-500/10">No Show</button>
                        </>
                      )}
                      {r.status === "seated" && (
                        <button onClick={() => handleStatusChange(r.id, "confirmed")} className="border border-cyber-blue text-cyber-blue text-xs px-2 py-1 font-headline uppercase">Undo Seat</button>
                      )}
                      {r.status !== "cancelled" && (
                        <button onClick={() => handleCancel(r.id)} className="border border-red-800 text-red-400 text-xs px-2 py-1 font-headline uppercase hover:bg-red-900/20">Cancel</button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </BorderTile>
      )}

      {/* ── Add Reservation Modal ──────────────────────── */}
      {showAdd && (
        <Modal title="New Reservation" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Phone</label>
                <input
                  value={addForm.customerPhone}
                  onChange={(e) => { setAddForm({ ...addForm, customerPhone: e.target.value }); setPhoneLookup(e.target.value); }}
                  onBlur={handlePhoneBlur}
                  required
                  className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                  placeholder="(555) 123-4567"
                />
                {foundCustomers && foundCustomers.length > 0 && phoneLookup.length >= 3 && (
                  <p className="text-xs text-cyber-blue mt-1">Found: {foundCustomers[0].firstName} {foundCustomers[0].lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Name</label>
                <input value={addForm.customerName} onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })} required className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Party Size</label>
                <input type="number" min={1} max={20} value={addForm.partySize} onChange={(e) => setAddForm({ ...addForm, partySize: parseInt(e.target.value) || 1 })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Date</label>
                <input type="date" value={addForm.reservationDate} onChange={(e) => setAddForm({ ...addForm, reservationDate: e.target.value })} min={fmt(new Date())} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Time</label>
                <select value={addForm.reservationTime} onChange={(e) => setAddForm({ ...addForm, reservationTime: e.target.value })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm">
                  {timeSlots.map((t, i) => (<option key={i} value={t!}>{formatTime(t!)}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Special Requests</label>
              <input value={addForm.specialRequests} onChange={(e) => setAddForm({ ...addForm, specialRequests: e.target.value })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" placeholder="Allergies, celebrations..." />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={createRes.isPending} className="flex-1 bg-obsidian text-white py-2.5 font-headline uppercase tracking-headline hover:brightness-110 active:animate-pulse transition-all disabled:opacity-50">
                {createRes.isPending ? "Booking..." : "Book Reservation"}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-xs px-4">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Edit Reservation Modal ─────────────────────── */}
      {editRes && (
        <Modal title={`Edit — ${editRes.customerFirstName} ${editRes.customerLastName}`} onClose={() => setEditRes(null)}>
          <form onSubmit={handleEditSave} className="space-y-3">
            {/* Read-only info */}
            <div className="border border-obsidian p-3 bg-surface-low">
              <p className="text-xs text-outline">
                {editRes.customerFirstName} {editRes.customerLastName} • {editRes.customerPhone}
              </p>
              <p className="text-xs text-outline mt-0.5">{editRes.reservationDate}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Time</label>
                <select value={editForm.reservationTime} onChange={(e) => setEditForm({ ...editForm, reservationTime: e.target.value })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm">
                  {timeSlots.map((t, i) => (<option key={i} value={t!}>{formatTime(t!)}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Party Size</label>
                <input type="number" min={1} max={20} value={editForm.partySize} onChange={(e) => setEditForm({ ...editForm, partySize: parseInt(e.target.value) || 1 })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm">
                <option value="confirmed">Confirmed</option>
                <option value="seated">Seated</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Special Requests</label>
              <input value={editForm.specialRequests} onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })} className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={updateRes.isPending} className="flex-1 bg-obsidian text-white py-2.5 font-headline uppercase tracking-headline hover:brightness-110 active:animate-pulse transition-all disabled:opacity-50">
                {updateRes.isPending ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" onClick={() => setEditRes(null)} className="btn-ghost text-xs px-4">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
