"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "@/lib/chart-colors";
import type { TopMaterialStat } from "@/types";

interface Props {
  data: TopMaterialStat[];
}

export function TopMaterialsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickFormatter={(v: number) =>
            v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`
          }
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#374151" }}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          formatter={(v) => [
            `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            "Value",
          ]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={700} animationEasing="ease-out">
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.isLow ? CHART_COLORS.rose : CHART_COLORS.teal}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
