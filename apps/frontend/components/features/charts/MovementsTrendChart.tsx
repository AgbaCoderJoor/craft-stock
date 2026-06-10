"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MOVEMENT_COLORS } from "@/lib/chart-colors";
import type { MovementTrendPoint } from "@/types";

interface Props {
  data: MovementTrendPoint[];
}

const TYPES = ["IN", "OUT", "ADJUSTMENT", "PRODUCTION"] as const;

export function MovementsTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          {TYPES.map((t) => (
            <linearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={MOVEMENT_COLORS[t]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={MOVEMENT_COLORS[t]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
          }}
          interval="preserveStartEnd"
        />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} width={36} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          labelFormatter={(v) => new Date(String(v)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
        {TYPES.map((t) => (
          <Area
            key={t}
            type="monotone"
            dataKey={t}
            stroke={MOVEMENT_COLORS[t]}
            strokeWidth={2}
            fill={`url(#grad-${t})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
