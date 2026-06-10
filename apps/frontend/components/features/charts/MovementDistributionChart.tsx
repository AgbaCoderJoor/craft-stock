"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MOVEMENT_COLORS } from "@/lib/chart-colors";
import type { MovementDistribution } from "@/types";

interface Props {
  data: MovementDistribution[];
}

export function MovementDistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          innerRadius="50%"
          outerRadius="78%"
          paddingAngle={3}
          animationBegin={0}
          animationDuration={700}
          animationEasing="ease-out"
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={MOVEMENT_COLORS[entry.type] ?? "#94a3b8"}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          formatter={(v) => [`${v} movements`]}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
