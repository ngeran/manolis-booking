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
        const err = await res.json();
        throw new Error(err.error || "Failed to create reservation");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useUpdateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) => {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update reservation");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to cancel reservation");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
