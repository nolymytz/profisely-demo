"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ChartPoint } from "@/lib/data";
import { format, parseISO } from "date-fns";

function formatCurrency(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${value.toFixed(0)}`;
}

export default function RevenueChart({ data }: { data: ChartPoint[] }) {
  if (data.length === 0) return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">No sales data for this period</div>;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), "MMM d")} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={48} />
        <Tooltip formatter={(value: number, name: string) => [`$${(value as number).toFixed(2)}`, name === "revenue" ? "Revenue" : "Net Profit"]} labelFormatter={(label) => format(parseISO(label as string), "MMM d, yyyy")} contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
        <Legend formatter={(value) => (value === "revenue" ? "Revenue" : "Net Profit")} wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
        <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Area type="monotone" dataKey="netProfit" stroke="#10B981" strokeWidth={2} fill="url(#colorProfit)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
