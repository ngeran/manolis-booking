import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  totalVisits: number;
  totalSpent: string | null;
  dietaryNotes: string | null;
  birthday: string | null;
  createdAt: string;
  lastVisit: string | null;
  optInMarketing: boolean;
}

export function useCustomers(search?: string) {
  return useQuery<Customer[]>({
    queryKey: ["customers", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/customers${params}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    },
    enabled: true,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create customer");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, any>) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update customer");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
