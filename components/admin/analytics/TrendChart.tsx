"use client";

import { useState } from "react";
import { t } from "@/lib/admin/strings";
import type { TrendPoint } from "@/lib/analytics/queries";
import { CHART } from "./palette";

// Two-series time chart (visitors + signups). Line/area gets a hover crosshair +
// tooltip by default (dataviz interaction rule). Legend is always present for two
// series, so identity is never colour-alone. Single light admin theme.

const W = 740;
const H = 240;
const M = { top: 16, right: 16, bottom: 26, left: 34 };
const INNER_W = W - M.left - M.right;
const INNER_H = H - M.top - M.bottom;

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function fmtDay(day: string, long = false): string {
  const d = new Date(`${day}T00:00:00`);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: long ? "long" : "short",
  });
}

export default function TrendChart({ points }: { points: TrendPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  const fmt = new Intl.NumberFormat("es-ES");

  const top = niceMax(Math.max(1, ...points.map((p) => Math.max(p.visitors, p.signups))));
  const x = (i: number) => M.left + (n <= 1 ? INNER_W / 2 : (INNER_W * i) / (n - 1));
  const y = (v: number) => M.top + INNER_H * (1 - v / top);

  const line = (key: "visitors" | "signups") =>
    points.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");

  const areaPath =
    n > 0
      ? `M ${x(0)},${y(points[0].visitors)} ` +
        points.map((p, i) => `L ${x(i)},${y(p.visitors)}`).join(" ") +
        ` L ${x(n - 1)},${M.top + INNER_H} L ${x(0)},${M.top + INNER_H} Z`
      : "";

  // ~5 evenly spaced x labels.
  const tickStep = Math.max(1, Math.ceil(n / 5));
  const gridVals = [0, top / 2, top];
  const band = n > 1 ? INNER_W / (n - 1) : INNER_W;
  const p = active !== null ? points[active] : null;

  return (
    <div className="bg-white border border-[#e8e5df] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg text-[#1a1a18]">{t.analytics.trendTitle}</h2>
        <div className="flex items-center gap-4 text-xs text-[#6b6560]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART.primary }} />
            {t.analytics.legendVisitors}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART.signups }} />
            {t.analytics.legendSignups}
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: "auto" }}
          onMouseLeave={() => setActive(null)}
          role="img"
          aria-label={t.analytics.trendTitle}
        >
          {/* gridlines + y labels */}
          {gridVals.map((gv, i) => (
            <g key={i}>
              <line
                x1={M.left}
                x2={W - M.right}
                y1={y(gv)}
                y2={y(gv)}
                stroke={CHART.grid}
                strokeWidth={1}
              />
              <text x={M.left - 6} y={y(gv) + 3} textAnchor="end" fontSize="10" fill="#b8b0a4">
                {fmt.format(Math.round(gv))}
              </text>
            </g>
          ))}

          {/* x labels */}
          {points.map((pt, i) =>
            i % tickStep === 0 || i === n - 1 ? (
              <text
                key={pt.day}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#b8b0a4"
              >
                {fmtDay(pt.day)}
              </text>
            ) : null
          )}

          {/* visitors area + lines */}
          {n > 0 && <path d={areaPath} fill={CHART.primary} opacity={0.08} />}
          {n > 1 && (
            <>
              <polyline points={line("visitors")} fill="none" stroke={CHART.primary} strokeWidth={2} />
              <polyline points={line("signups")} fill="none" stroke={CHART.signups} strokeWidth={2} />
            </>
          )}

          {/* crosshair + active dots */}
          {active !== null && (
            <>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={M.top}
                y2={M.top + INNER_H}
                stroke="#c9c2b6"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={x(active)} cy={y(points[active].visitors)} r={4} fill={CHART.primary}
                stroke="#fff" strokeWidth={1.5} />
              <circle cx={x(active)} cy={y(points[active].signups)} r={4} fill={CHART.signups}
                stroke="#fff" strokeWidth={1.5} />
            </>
          )}

          {/* invisible hover bands */}
          {points.map((pt, i) => (
            <rect
              key={pt.day}
              x={Math.max(M.left, x(i) - band / 2)}
              y={M.top}
              width={band}
              height={INNER_H}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
            />
          ))}
        </svg>

        {p && (
          <div
            className="absolute top-1 -translate-x-1/2 pointer-events-none bg-white border border-[#e8e5df] rounded-lg shadow-sm px-3 py-2 text-xs whitespace-nowrap z-10"
            style={{
              left: `${Math.min(90, Math.max(10, (x(active!) / W) * 100))}%`,
            }}
          >
            <p className="font-medium text-[#1a1a18] mb-1">{fmtDay(p.day, true)}</p>
            <p className="flex items-center gap-1.5 text-[#6b6560]">
              <span className="w-2 h-2 rounded-full" style={{ background: CHART.primary }} />
              {t.analytics.legendVisitors}:{" "}
              <span className="font-medium text-[#1a1a18]">{fmt.format(p.visitors)}</span>
            </p>
            <p className="flex items-center gap-1.5 text-[#6b6560]">
              <span className="w-2 h-2 rounded-full" style={{ background: CHART.signups }} />
              {t.analytics.legendSignups}:{" "}
              <span className="font-medium text-[#1a1a18]">{fmt.format(p.signups)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
