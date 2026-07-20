// Unit tests for the pure dashboard helpers in lib/analytics/queries.ts:
// range clamping, period-over-period deltas, conversion rate, and the daily
// series padding that makes the trend chart span the full window.
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeRange,
  delta,
  conversionRate,
  fillDailySeries,
  summaryIsEmpty,
  EMPTY_SUMMARY,
  type TrendPoint,
} from "@/lib/analytics/queries";

test("normalizeRange: accepts 7/30/90, defaults to 30", () => {
  assert.equal(normalizeRange("7"), 7);
  assert.equal(normalizeRange("30"), 30);
  assert.equal(normalizeRange("90"), 90);
  assert.equal(normalizeRange(["90"]), 90); // array param (Next searchParams)
  assert.equal(normalizeRange("15"), 30); // unsupported → default
  assert.equal(normalizeRange(undefined), 30);
  assert.equal(normalizeRange("abc"), 30);
});

test("delta: null baseline when prev is 0, else rounded % change", () => {
  assert.equal(delta(5, 0), null);
  assert.equal(delta(10, 5), 100);
  assert.equal(delta(5, 10), -50);
  assert.equal(delta(3, 3), 0);
  assert.equal(delta(1, 3), -67); // rounding
});

test("conversionRate: signups/visitors as 1-decimal %, 0 when no visitors", () => {
  assert.equal(conversionRate({ visitors: 0, pageviews: 0, signups: 0 }), 0);
  assert.equal(conversionRate({ visitors: 4, pageviews: 9, signups: 3 }), 75);
  assert.equal(conversionRate({ visitors: 3, pageviews: 3, signups: 1 }), 33.3); // 1-decimal
});

test("fillDailySeries: spans exactly rangeDays, fills gaps with zero, preserves data", () => {
  const today = new Date();
  const key = (d: number) =>
    new Date(today.getTime() - d * 86400000).toISOString().slice(0, 10);
  const sparse: TrendPoint[] = [
    { day: key(1), visitors: 5, pageviews: 9, signups: 2 },
  ];
  const out = fillDailySeries(sparse, 7);
  assert.equal(out.length, 7, "one point per day in range");
  // ascending order, last entry is today
  assert.equal(out[out.length - 1].day, key(0));
  assert.equal(out[0].day, key(6));
  // provided day preserved
  const kept = out.find((p) => p.day === key(1))!;
  assert.deepEqual(kept, sparse[0]);
  // gaps zero-filled
  const gap = out.find((p) => p.day === key(3))!;
  assert.deepEqual(gap, { day: key(3), visitors: 0, pageviews: 0, signups: 0 });
});

test("summaryIsEmpty: true only when all headline KPIs are zero", () => {
  assert.equal(summaryIsEmpty(EMPTY_SUMMARY), true);
  assert.equal(
    summaryIsEmpty({ ...EMPTY_SUMMARY, kpis: { visitors: 1, pageviews: 0, signups: 0 } }),
    false
  );
});
