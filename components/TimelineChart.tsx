"use client";
import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtShort } from "@/lib/dates";
import { money } from "@/lib/format";
import type { Forecast } from "@/lib/types";

export interface Series {
  name: string;
  forecast: Forecast;
  color: string;
  dashed?: boolean;
  fill?: boolean;
}

/** One or two forecast lines over the next weeks, with the below-$0 zone shaded red. */
export default function TimelineChart({ series, height = 190, days = 30 }: { series: Series[]; height?: number; days?: number }) {
  if (!series.length) return null;
  const n = Math.min(days + 1, series[0].forecast.days.length);
  const data = Array.from({ length: n }, (_, i) => {
    const row: Record<string, number | string> = { date: series[0].forecast.days[i].date };
    series.forEach((s, k) => (row[`s${k}`] = s.forecast.days[i]?.balance ?? 0));
    return row;
  });
  const all = data.flatMap((r) => series.map((_, k) => r[`s${k}`] as number));
  const min = Math.min(0, ...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.12 || 100;
  const yMin = Math.floor((min - pad) / 100) * 100;
  const yMax = Math.ceil((max + pad) / 100) * 100;
  const payday = series[0].forecast.nextPayday;

  return (
    <div style={{ height }} className="-mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 18, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="fillGood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1E8C80" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1E8C80" stopOpacity={0} />
            </linearGradient>
          </defs>
          {yMin < 0 && <ReferenceArea y1={yMin} y2={0} fill="#e0393e" fillOpacity={0.08} ifOverflow="hidden" />}
          <ReferenceLine y={0} stroke="#e0393e" strokeDasharray="4 4" strokeOpacity={0.7} />
          {payday && (
            <ReferenceLine
              x={payday}
              stroke="#94a3b8"
              strokeDasharray="2 3"
              label={{ value: "Payday", position: "insideTopRight", fontSize: 10, fill: "#64748b" }}
            />
          )}
          <XAxis
            dataKey="date"
            tickFormatter={fmtShort}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval={Math.ceil(n / 5)}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v) => money(v)}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            formatter={(v, name) => [money(Number(v)), String(name)]}
            labelFormatter={(l) => fmtShort(String(l))}
            contentStyle={{ borderRadius: 12, border: "1px solid #e7e9ee", fontSize: 12 }}
          />
          {series.map((s, k) =>
            s.fill ? (
              <Area
                key={s.name}
                type="monotone"
                dataKey={`s${k}`}
                name={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                fill="url(#fillGood)"
                dot={false}
                isAnimationActive
                animationDuration={700}
              />
            ) : (
              <Line
                key={s.name}
                type="monotone"
                dataKey={`s${k}`}
                name={s.name}
                stroke={s.color}
                strokeWidth={s.dashed ? 2 : 2.5}
                strokeDasharray={s.dashed ? "5 5" : undefined}
                dot={false}
                isAnimationActive
                animationDuration={700}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <svg width="18" height="4">
            <line x1="0" y1="2" x2="18" y2="2" stroke={i.color} strokeWidth="2.5" strokeDasharray={i.dashed ? "4 3" : undefined} />
          </svg>
          {i.label}
        </span>
      ))}
    </div>
  );
}
