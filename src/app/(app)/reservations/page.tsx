"use client";

import { useState } from "react";
import { toast } from "sonner";
import BorderTile from "@/components/ui/BorderTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useReservations, useUpdateReservation, useCancelReservation } from "@/hooks/useReservations";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

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

function exportCSV(data: any[]) {
  const headers = ["Date", "Time", "Customer", "Phone", "Party Size", "Status", "Special Requests"];
  const rows = data.map((r) => [
    r.reservationDate,
    formatTime(r.reservationTime),
    `${r.customerFirstName} ${r.customerLastName}`,
    r.customerPhone,
    r.partySize,
    r.status,
    r.specialRequests || "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservations-${getToday()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReservationsPage() {
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"single" | "range">("single");

  const queryDate = viewMode === "single" ? selectedDate : undefined;
  const queryFrom = viewMode === "range" ? dateFrom : undefined;
  const queryTo = viewMode === "range" ? dateTo : undefined;

  const { data: reservations, isLoading } = useReservations(queryDate, queryFrom, queryTo);
  const updateRes = useUpdateReservation();
  const cancelRes = useCancelReservation();

  async function handleStatusChange(id: string, status: string) {
    try {
      await updateRes.mutateAsync({ id, status });
      toast.success(`Status updated to ${status.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleCancel(id: string) {
    try {
      await cancelRes.mutateAsync(id);
      toast.success("Reservation cancelled");
    } catch {
      toast.error("Failed to cancel");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl uppercase tracking-headline">
          Reservations
        </h1>
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex border border-obsidian">
            <button
              onClick={() => setViewMode("single")}
              className={`px-3 py-1 text-xs font-headline uppercase tracking-headline ${
                viewMode === "single" ? "bg-obsidian text-white" : "text-outline"
              }`}
            >
              Single Day
            </button>
            <button
              onClick={() => setViewMode("range")}
              className={`px-3 py-1 text-xs font-headline uppercase tracking-headline ${
                viewMode === "range" ? "bg-obsidian text-white" : "text-outline"
              }`}
            >
              Date Range
            </button>
          </div>

          {/* CSV Export */}
          <button
            onClick={() => reservations && exportCSV(reservations)}
            disabled={!reservations?.length}
            className="btn-ghost text-xs px-3 py-1 font-headline uppercase tracking-headline"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <BorderTile title="Date Filter">
        <div className="flex items-center gap-4 mt-2">
          {viewMode === "single" ? (
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                />
              </div>
              <span className="text-outline mt-4">—</span>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                />
              </div>
            </div>
          )}
          {reservations && (
            <span className="text-xs text-outline font-headline uppercase mt-4">
              {reservations.length} result{reservations.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </BorderTile>

      {/* Reservations List */}
      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : !reservations?.length ? (
        <BorderTile>
          <p className="text-sm text-outline font-headline py-4">No reservations found for this period</p>
        </BorderTile>
      ) : (
        <div className="space-y-2">
          {reservations.map((r) => (
            <BorderTile key={r.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Date + Time */}
                  <div className="w-28">
                    <p className="font-headline text-cyber-blue">{formatTime(r.reservationTime)}</p>
                    <p className="text-xs text-outline">{r.reservationDate}</p>
                  </div>

                  {/* Customer */}
                  <div className="w-48">
                    <p className="text-sm text-white">
                      {r.customerFirstName} {r.customerLastName}
                    </p>
                    <p className="text-xs text-outline">{r.customerPhone}</p>
                  </div>

                  {/* Party */}
                  <div className="w-20 text-center">
                    <p className="text-lg font-headline text-white">{r.partySize}</p>
                    <p className="text-xs text-outline">guests</p>
                  </div>

                  {/* Special Requests */}
                  <div className="flex-1 max-w-xs">
                    {r.specialRequests ? (
                      <p className="text-xs text-tactical-gold truncate">{r.specialRequests}</p>
                    ) : (
                      <p className="text-xs text-outline">—</p>
                    )}
                  </div>
                </div>

                {/* Status + Actions */}
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-headline uppercase tracking-headline border px-2 py-1 ${statusColors[r.status] || "text-outline border-outline"}`}>
                    {r.status.replace("_", " ")}
                  </span>

                  {r.status === "confirmed" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(r.id, "seated")}
                        className="btn-ghost text-xs px-2 py-1"
                      >
                        Seat
                      </button>
                      <button
                        onClick={() => handleStatusChange(r.id, "no_show")}
                        className="border border-yellow-600 text-yellow-500 text-xs px-2 py-1 hover:bg-yellow-500/10"
                      >
                        No Show
                      </button>
                    </>
                  )}
                  {r.status !== "cancelled" && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      className="border border-red-800 text-red-400 text-xs px-2 py-1 hover:bg-red-900/20"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </BorderTile>
          ))}
        </div>
      )}
    </div>
  );
}
