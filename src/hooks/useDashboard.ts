import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  todayReservations: number;
  weekReservations: number;
  todayGuests: number;
  todayByStatus: Record<string, number>;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats/dashboard");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 60000,
  });
}
