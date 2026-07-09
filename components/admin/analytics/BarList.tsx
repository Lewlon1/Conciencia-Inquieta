import { CHART } from "./palette";

export interface BarItem {
  label: string;
  value: number;
}

// Reusable horizontal magnitude bars (signups-by-channel, top articles). Single
// series → one hue, no legend (dataviz: the title names it). Value is direct-
// labelled at the row end; the track is recessive.
export default function BarList({
  items,
  color = CHART.primary,
  emptyText,
  valueLabel,
}: {
  items: BarItem[];
  color?: string;
  emptyText: string;
  valueLabel?: (n: number) => string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[#b8b0a4]">{emptyText}</p>;
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  const fmt = valueLabel ?? ((n: number) => new Intl.NumberFormat("es-ES").format(n));

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span
            className="text-sm text-[#1a1a18] shrink-0 truncate w-28"
            title={item.label}
          >
            {item.label}
          </span>
          <div
            className="flex-1 h-2.5 rounded-full overflow-hidden"
            style={{ background: CHART.track }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, background: color }}
            />
          </div>
          <span className="text-sm font-medium text-[#1a1a18] w-10 text-right tabular-nums">
            {fmt(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
