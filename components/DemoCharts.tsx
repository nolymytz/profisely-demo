"use client";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import type { ChartPoint } from "@/lib/data";

function tickDate(v: string) {
  const d = new Date(v + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const tipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #eceef0",
  borderRadius: "10px",
  fontSize: "11px",
  fontFamily: "Inter, sans-serif",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  padding: "8px 10px",
};

export default function DemoCharts({ data }: { data: ChartPoint[] }) {
  if (!data.length) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Net Profit", "Avg Margin", "Revenue"].map((label) => (
          <div key={label} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5 flex items-center justify-center h-44 text-on-surface-variant text-xs">
            No data yet
          </div>
        ))}
      </div>
    );
  }

  const totalNetProfit = data.reduce((s, d) => s + d.netProfit, 0);
  const totalRevenue   = data.reduce((s, d) => s + d.revenue,   0);

  const marginData = data.map((d) => ({
    date:   d.date,
    margin: d.revenue > 0 ? parseFloat(((d.netProfit / d.revenue) * 100).toFixed(1)) : 0,
  }));
  const daysWithRevenue = marginData.filter((d) => d.margin !== 0);
  const avgMargin = daysWithRevenue.length > 0
    ? parseFloat((daysWithRevenue.reduce((s, d) => s + d.margin, 0) / daysWithRevenue.length).toFixed(1))
    : 0;

  function fmtFull(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Net Profit */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-0.5">Net Profit</p>
        <p className={`font-headline text-2xl font-bold tabular-nums mb-3 ${totalNetProfit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {fmtFull(totalNetProfit)}
        </p>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip formatter={(v: number) => [fmtFull(v), "Net Profit"]} labelFormatter={tickDate} contentStyle={tipStyle} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="3 3" />
            <Bar dataKey="netProfit" radius={[2, 2, 0, 0]}>
              {data.map((entry, i) => <Cell key={i} fill={entry.netProfit >= 0 ? "#10b981" : "#ef4444"} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Avg Margin */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-0.5">Avg Margin</p>
        <p className={`font-headline text-2xl font-bold tabular-nums mb-3 ${avgMargin >= 20 ? "text-emerald-600" : avgMargin >= 10 ? "text-amber-500" : "text-red-500"}`}>
          {avgMargin.toFixed(1)}%
        </p>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={marginData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, "Margin"]} labelFormatter={tickDate} contentStyle={tipStyle} />
            <ReferenceLine y={0} stroke="#e5e7eb" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="margin" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-on-surface-variant mb-0.5">Revenue</p>
        <p className="font-headline text-2xl font-bold tabular-nums mb-3 text-blue-600">
          {fmtFull(totalRevenue)}
        </p>
        <ResponsiveContainer width="100%" height={90}>
          <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" hide />
            <YAxis hide />
            <Tooltip formatter={(v: number) => [fmtFull(v), "Revenue"]} labelFormatter={tickDate} contentStyle={tipStyle} />
            <Bar dataKey="revenue" fill="#3b82f6" fillOpacity={0.75} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
