"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KpiCard } from "@/components/features/dashboard/KpiCard";
import { MovementsTrendChart } from "@/components/features/charts/MovementsTrendChart";
import { CategoryDonutChart } from "@/components/features/charts/CategoryDonutChart";
import { MovementDistributionChart } from "@/components/features/charts/MovementDistributionChart";
import { TopMaterialsChart } from "@/components/features/charts/TopMaterialsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import type { Material, FinishedGood } from "@/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ROLE_LABELS, canViewInventoryValue, canViewPricingCharts } from "@/lib/permissions";
import {
  useMovementsTrend,
  useInventoryByCategory,
  useMovementDistribution,
  useTopMaterials,
} from "@/hooks/useAnalytics";

const DAYS_OPTIONS = [7, 14, 30, 90] as const;

export default function DashboardPage() {
  const { user, role } = useCurrentUser();
  const [trendDays, setTrendDays] = useState<number>(30);

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async () => (await api.get("/materials")).data,
  });

  const { data: finishedGoods = [] } = useQuery<FinishedGood[]>({
    queryKey: ["finished-goods"],
    queryFn: async () => (await api.get("/finished-goods")).data,
  });

  const { data: lowStock = [] } = useQuery<Material[]>({
    queryKey: ["materials-low-stock"],
    queryFn: async () => (await api.get("/materials/low-stock")).data,
  });

  const { data: trendData = [] } = useMovementsTrend(trendDays);
  const { data: categoryData = [] } = useInventoryByCategory();
  const { data: distributionData = [] } = useMovementDistribution();
  const { data: topMaterials = [] } = useTopMaterials(8);

  const totalMaterialValue = materials.reduce(
    (sum, m) => sum + Number(m.cost_price) * Number(m.quantity_available),
    0
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Dashboard</h2>
        {user && (
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back,{" "}
            <span className="font-medium text-gray-700">{user.name || user.email}</span>
            {" · "}
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard title="Total Materials" value={materials.length} subtitle="unique SKUs" />
        <KpiCard
          title="Low Stock Alerts"
          value={lowStock.length}
          subtitle="below minimum"
          alert={lowStock.length > 0}
        />
        <KpiCard title="Finished Goods" value={finishedGoods.length} subtitle="product types" />
        {canViewInventoryValue(role ?? "") && (
          <KpiCard
            title="Inventory Value"
            value={`₦${totalMaterialValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
            subtitle="materials at cost"
          />
        )}
      </div>

      {/* Movements Trend + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
            <CardTitle className="text-base font-semibold">Stock Movement Trend</CardTitle>
            <div className="flex flex-wrap gap-1">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    trendDays === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-gray-100"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <MovementsTrendChart data={trendData} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Movement Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <MovementDistributionChart data={distributionData} />
          </CardContent>
        </Card>
      </div>

      {/* Category Value + Top Materials — admin only (pricing data) */}
      {canViewPricingCharts(role ?? "") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Inventory Value by Category</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <CategoryDonutChart data={categoryData} />
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Materials by Value</CardTitle>
              <p className="text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-400 mr-1" />
                Red = below minimum stock
              </p>
            </CardHeader>
            <CardContent className="pt-2">
              <TopMaterialsChart data={topMaterials} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Low Stock Alert Table */}
      {lowStock.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-red-600">
              Low Stock Items ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Material</th>
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-right">Available</th>
                  <th className="px-4 py-2 text-right">Minimum</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((m) => (
                  <tr key={m.material_id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">{m.name}</td>
                    <td className="px-4 py-2 text-muted-foreground">{m.category}</td>
                    <td className="px-4 py-2 text-right text-red-600 font-medium">{m.quantity_available}</td>
                    <td className="px-4 py-2 text-right">{m.minimum_stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
