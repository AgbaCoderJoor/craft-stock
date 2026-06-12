"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MovementsTrendChart } from "@/components/features/charts/MovementsTrendChart";
import { CategoryDonutChart } from "@/components/features/charts/CategoryDonutChart";
import { TopMaterialsChart } from "@/components/features/charts/TopMaterialsChart";
import { MovementDistributionChart } from "@/components/features/charts/MovementDistributionChart";
import { FinishedGoodsChart } from "@/components/features/charts/FinishedGoodsChart";
import {
  useMovementsTrend,
  useInventoryByCategory,
  useTopMaterials,
  useMovementDistribution,
  useFinishedGoodsSummary,
} from "@/hooks/useAnalytics";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Material, FinishedGood } from "@/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { canViewInventoryValue, canViewPricingCharts } from "@/lib/permissions";

const DAYS_OPTIONS = [7, 14, 30, 90, 180, 365] as const;
const TOP_OPTIONS = [5, 10, 15, 20] as const;

export default function ReportsPage() {
  const { role } = useCurrentUser();
  const [trendDays, setTrendDays] = useState<number>(30);
  const [topLimit, setTopLimit] = useState<number>(10);

  const { data: trendData = [] } = useMovementsTrend(trendDays);
  const { data: categoryData = [] } = useInventoryByCategory();
  const { data: topMaterials = [] } = useTopMaterials(topLimit);
  const { data: distributionData = [] } = useMovementDistribution();
  const { data: finishedGoodsData = [] } = useFinishedGoodsSummary();

  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ["materials"],
    queryFn: async () => (await api.get("/materials")).data,
  });
  const { data: finishedGoods = [] } = useQuery<FinishedGood[]>({
    queryKey: ["finished-goods"],
    queryFn: async () => (await api.get("/finished-goods")).data,
  });

  const totalInventoryValue = materials.reduce(
    (sum, m) => sum + Number(m.cost_price) * Number(m.quantity_available),
    0
  );
  const totalInStock = finishedGoods.reduce((s, g) => s + g.current_quantity, 0);
  const totalProduced = finishedGoods.reduce((s, g) => s + g.quantity_produced, 0);
  const totalSold = finishedGoods.reduce((s, g) => s + g.quantity_sold, 0);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">Overview of inventory, movements, and production</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {canViewInventoryValue(role ?? "") && (
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">₦{totalInventoryValue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
            </CardContent>
          </Card>
        )}
        {[
          { label: "Finished Goods In Stock", value: totalInStock.toLocaleString() },
          { label: "Total Units Produced", value: totalProduced.toLocaleString() },
          { label: "Total Units Sold", value: totalSold.toLocaleString() },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 break-words">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Movements Trend */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Stock Movement Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">IN / OUT / Adjustments / Production over time</p>
          </div>
          <div className="flex gap-1 flex-wrap sm:justify-end">
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
                {d >= 365 ? "1y" : d >= 180 ? "6m" : d >= 90 ? "3m" : `${d}d`}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <MovementsTrendChart data={trendData} />
        </CardContent>
      </Card>

      {/* Distribution — visible to all; Category — admin only */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Movement Distribution</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Count of each movement type</p>
          </CardHeader>
          <CardContent className="pt-2">
            <MovementDistributionChart data={distributionData} />
          </CardContent>
        </Card>

        {canViewPricingCharts(role ?? "") && (
          <Card className="min-w-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Inventory Value by Category</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Total value of materials in each category</p>
            </CardHeader>
            <CardContent className="pt-2">
              <CategoryDonutChart data={categoryData} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Materials — admin only */}
      {canViewPricingCharts(role ?? "") && (
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Top Materials by Value</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sorted by (cost price × quantity) · <span className="text-rose-500">Red = low stock</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {TOP_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setTopLimit(n)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    topLimit === n
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-gray-100"
                  }`}
                >
                  Top {n}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <TopMaterialsChart data={topMaterials} />
          </CardContent>
        </Card>
      )}

      {/* Finished Goods */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Finished Goods Overview</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Produced vs. sold vs. current stock per product</p>
        </CardHeader>
        <CardContent className="pt-2">
          <FinishedGoodsChart data={finishedGoodsData} />
        </CardContent>
      </Card>
    </div>
  );
}
