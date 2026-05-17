"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BorderTile from "@/components/ui/BorderTile";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useReservations, useCreateReservation } from "@/hooks/useReservations";
import { useCustomers } from "@/hooks/useCustomers";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

const timeSlots = Array.from({ length: 22 }, (_, i) => {
  const hour = 11 + Math.floor(i / 2);
  const min = i % 2 === 0 ? "00" : "30";
  if (hour > 22) return null;
  return `${String(hour).padStart(2, "0")}:${min}:00`;
}).filter(Boolean);

const statusColors: Record<string, string> = {
  confirmed: "text-cyber-blue",
  seated: "text-green-400",
  cancelled: "text-red-400",
  no_show: "text-yellow-500",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const employeeName = session?.user?.name ?? "OPERATOR";
  const employeeId = session?.user?.id ?? "";

  const today = getToday();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: todayReservations, isLoading: resLoading } = useReservations(today);
  const createRes = useCreateReservation();

  // Quick reservation form
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [resDate, setResDate] = useState(today);
  const [resTime, setResTime] = useState("19:00:00");
  const [specialReqs, setSpecialReqs] = useState("");

  // Customer lookup
  const [customerSearch, setCustomerSearch] = useState("");
  const { data: searchResults, isLoading: searchLoading } = useCustomers(
    customerSearch.length >= 2 ? customerSearch : undefined
  );

  async function handleQuickBook(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createRes.mutateAsync({
        customerName: custName,
        customerPhone: custPhone,
        partySize,
        reservationDate: resDate,
        reservationTime: resTime,
        employeeId,
        specialRequests: specialReqs,
      });
      toast.success("Reservation created");
      setCustName("");
      setCustPhone("");
      setSpecialReqs("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create reservation");
    }
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-2xl uppercase tracking-headline">
          Welcome, <span className="text-cyber-blue">{employeeName}</span>
        </h1>
        <span className="font-headline text-xs text-outline uppercase tracking-headline">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
      </div>

      {/* Stats Row */}
      {statsLoading ? (
        <LoadingSkeleton rows={1} />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <BorderTile title="Today">
            <p className="text-3xl font-headline text-white">{stats?.todayReservations ?? 0}</p>
            <p className="text-xs text-outline font-headline uppercase tracking-headline mt-1">Reservations</p>
          </BorderTile>
          <BorderTile title="This Week">
            <p className="text-3xl font-headline text-white">{stats?.weekReservations ?? 0}</p>
            <p className="text-xs text-outline font-headline uppercase tracking-headline mt-1">Total Bookings</p>
          </BorderTile>
          <BorderTile title="Expected Guests">
            <p className="text-3xl font-headline text-tactical-gold">{stats?.todayGuests ?? 0}</p>
            <p className="text-xs text-outline font-headline uppercase tracking-headline mt-1">Covers Today</p>
          </BorderTile>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Quick Reservation Form */}
        <BorderTile title="Quick Reservation">
          <form onSubmit={handleQuickBook} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Name</label>
                <input
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Phone</label>
                <input
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  required
                  className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Party Size</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={resDate}
                  onChange={(e) => setResDate(e.target.value)}
                  min={today}
                  className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-outline font-headline uppercase mb-1">Time</label>
                <select
                  value={resTime}
                  onChange={(e) => setResTime(e.target.value)}
                  className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                >
                  {timeSlots.map((t, i) => (
                    <option key={i} value={t!}>{formatTime(t!)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-outline font-headline uppercase mb-1">Special Requests</label>
              <input
                value={specialReqs}
                onChange={(e) => setSpecialReqs(e.target.value)}
                className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
                placeholder="Allergies, celebrations, etc."
              />
            </div>
            <button
              type="submit"
              disabled={createRes.isPending}
              className="w-full bg-obsidian text-white py-2 font-headline uppercase tracking-headline hover:brightness-110 active:animate-pulse transition-all disabled:opacity-50"
            >
              {createRes.isPending ? "Booking..." : "Book Reservation"}
            </button>
          </form>
        </BorderTile>

        {/* Customer Lookup */}
        <BorderTile title="Customer Lookup">
          <div className="space-y-3 mt-2">
            <input
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full bg-surface-low text-white px-3 py-2 border border-obsidian focus:border-cyber-blue focus:outline-none text-sm"
              placeholder="Search by name, phone, or email..."
            />
            {searchLoading && customerSearch.length >= 2 && <LoadingSkeleton rows={2} />}
            {searchResults && customerSearch.length >= 2 && (
              <div className="space-y-2 max-h-64 overflow-auto">
                {searchResults.length === 0 && (
                  <p className="text-xs text-outline font-headline">No customers found</p>
                )}
                {searchResults.map((c) => (
                  <div key={c.id} className="border border-obsidian p-2 bg-surface-low">
                    <div className="flex justify-between">
                      <span className="text-sm text-white">{c.firstName} {c.lastName}</span>
                      <span className="text-xs text-outline">{c.totalVisits} visits</span>
                    </div>
                    <p className="text-xs text-outline">{c.phone} {c.email && `• ${c.email}`}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </BorderTile>
      </div>

      {/* Today's Reservations */}
      <BorderTile title="Today's Schedule">
        {resLoading ? (
          <LoadingSkeleton rows={4} />
        ) : !todayReservations?.length ? (
          <p className="text-sm text-outline font-headline py-4">No reservations today</p>
        ) : (
          <div className="space-y-2 mt-2">
            {todayReservations.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-obsidian p-3 bg-surface-low">
                <div className="flex items-center gap-4">
                  <span className="font-headline text-cyber-blue text-lg w-20">{formatTime(r.reservationTime)}</span>
                  <div>
                    <p className="text-sm text-white">
                      {r.customerFirstName} {r.customerLastName}
                      <span className="text-outline ml-2">({r.customerPhone})</span>
                    </p>
                    <p className="text-xs text-outline">
                      Party of {r.partySize}
                      {r.specialRequests && ` • ${r.specialRequests}`}
                    </p>
                  </div>
                </div>
                <span className={`font-headline text-xs uppercase tracking-headline ${statusColors[r.status] || "text-outline"}`}>
                  {r.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </BorderTile>
    </div>
  );
}
