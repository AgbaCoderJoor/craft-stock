"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { FinishedGoodSummary } from "@/types";

interface Props {
  data: FinishedGoodSummary[];
}

export function FinishedGoodsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          interval={0}
          tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 12) + "…" : v)}
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} width={36} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        <Bar dataKey="quantity_produced" name="Produced" fill={CHART_COLORS.teal} radius={[4, 4, 0, 0]} animationDuration={700} />
        <Bar dataKey="quantity_sold" name="Sold" fill={CHART_COLORS.violet} radius={[4, 4, 0, 0]} animationDuration={700} animationBegin={100} />
        <Bar dataKey="current_quantity" name="In Stock" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} animationDuration={700} animationBegin={200} />
      </BarChart>
    </ResponsiveContainer>
  );
}
