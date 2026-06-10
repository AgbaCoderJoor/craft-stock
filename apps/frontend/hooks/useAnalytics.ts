"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  MovementTrendPoint,
  CategoryStat,
  TopMaterialStat,
  MovementDistribution,
  FinishedGoodSummary,
} from "@/types";

const STALE = 1000 * 60 * 5; // 5 min

export function useMovementsTrend(days = 30) {
  return useQuery<MovementTrendPoint[]>({
    queryKey: ["analytics", "movements-trend", days],
    queryFn: () => api.get(`/analytics/movements-trend?days=${days}`).then((r) => r.data),
    staleTime: STALE,
  });
}

export function useInventoryByCategory() {
  return useQuery<CategoryStat[]>({
    queryKey: ["analytics", "inventory-by-category"],
    queryFn: () => api.get("/analytics/inventory-by-category").then((r) => r.data),
    staleTime: STALE,
  });
}

export function useTopMaterials(limit = 10) {
  return useQuery<TopMaterialStat[]>({
    queryKey: ["analytics", "top-materials", limit],
    queryFn: () => api.get(`/analytics/top-materials?limit=${limit}`).then((r) => r.data),
    staleTime: STALE,
  });
}

export function useMovementDistribution() {
  return useQuery<MovementDistribution[]>({
    queryKey: ["analytics", "movement-distribution"],
    queryFn: () => api.get("/analytics/movement-distribution").then((r) => r.data),
    staleTime: STALE,
  });
}

export function useFinishedGoodsSummary() {
  return useQuery<FinishedGoodSummary[]>({
    queryKey: ["analytics", "finished-goods-summary"],
    queryFn: () => api.get("/analytics/finished-goods-summary").then((r) => r.data),
    staleTime: STALE,
  });
}
