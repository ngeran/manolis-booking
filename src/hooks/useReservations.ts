import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Reservation {
  id: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  status: string;
  specialRequests: string | null;
  createdAt: string;
  customerId: string;
  employeeId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
}

type ReservationPatch = Partial<
  Pick<Reservation, "partySize" | "reservationTime" | "status" | "specialRequests">
>;

export function useReservations(date?: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  return useQuery<Reservation[]>({
    queryKey: ["reservations", { date, from, to }],
    queryFn: async () => {
      const res = await fetch(`/api/reservations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch reservations");
      return res.json();
    },
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to create reservation (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

// Apply a patch optimistically to every cached reservations list (week views,
// day views, dashboards) so the UI reacts instantly; roll back on failure.
function patchCachedReservations(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: ReservationPatch
) {
  const cached = qc.getQueriesData<Reservation[]>({ queryKey: ["reservations"] });
  for (const [key, data] of cached) {
    if (!data) continue;
    qc.setQueryData<Reservation[]>(
      key,
      data.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }
  return cached;
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & ReservationPatch) => {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update reservation");
      }
      return res.json();
    },
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ["reservations"] });
      const previous = patchCachedReservations(qc, id, patch);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to cancel reservation");
      }
      return res.json();
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["reservations"] });
      const previous = patchCachedReservations(qc, id, { status: "cancelled" });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
