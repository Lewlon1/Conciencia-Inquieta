// Unit tests for the security-critical ingestion helpers (lib/analytics/ingest.ts):
// bot filtering, source classification, the anonymous visitor hash, and the
// prop/string sanitizers that bound what a hostile beacon can store. Run with:
//   node --test --experimental-strip-types --import ./test/_alias-loader.mjs test/*.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  isKnownEvent,
  isBot,
  parseDevice,
  visitorHash,
  hostOf,
  cleanPath,
  classifySource,
  sanitizeProps,
  clampStr,
} from "@/lib/analytics/ingest";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Mobile/15E148 Safari/604.1";

test("isKnownEvent: only whitelisted events accepted", () => {
  for (const e of ["pageview", "signup", "cta_click", "channel_click", "article_read", "scroll_depth"])
    assert.equal(isKnownEvent(e), true, e);
  for (const e of ["", "PAGEVIEW", "purchase", "click", "drop table"])
    assert.equal(isKnownEvent(e), false, e);
});

test("isBot: missing UA is a bot; crawlers/tools flagged; real browsers pass", () => {
  assert.equal(isBot(null), true);
  assert.equal(isBot(""), true);
  for (const ua of [
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "facebookexternalhit/1.1",
    "curl/8.4.0",
    "python-requests/2.31",
    "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120",
    "node-fetch/1.0",
    "Mozilla/5.0 ... PhantomJS",
  ])
    assert.equal(isBot(ua), true, `should flag: ${ua}`);
  for (const ua of [CHROME, IPHONE])
    assert.equal(isBot(ua), false, `should pass: ${ua}`);
});

test("parseDevice: tablet vs mobile vs desktop", () => {
  assert.equal(parseDevice(IPHONE), "mobile");
  assert.equal(parseDevice("Mozilla/5.0 (iPad; CPU OS 17_0) Safari"), "tablet");
  assert.equal(parseDevice("Mozilla/5.0 (Linux; Android 13; Pixel Tablet)"), "tablet"); // android w/o "mobile"
  assert.equal(parseDevice("Mozilla/5.0 (Linux; Android 13; Pixel) Mobile Safari"), "mobile");
  assert.equal(parseDevice(CHROME), "desktop");
  assert.equal(parseDevice(null), "desktop");
});

test("visitorHash: deterministic, 32-hex, salt-sensitive, holds no PII", () => {
  const ip = "203.0.113.7";
  const salt = "s3cr3t";
  const h1 = visitorHash(ip, CHROME, salt);
  const h2 = visitorHash(ip, CHROME, salt);
  assert.equal(h1, h2, "same inputs → same hash");
  assert.match(h1, /^[0-9a-f]{32}$/, "32 lowercase hex chars");
  assert.notEqual(h1, visitorHash("203.0.113.8", CHROME, salt), "different ip → different hash");
  assert.notEqual(h1, visitorHash(ip, CHROME, "other-salt"), "different salt → different hash");
  // Privacy: the raw IP / UA must not be recoverable from the stored value.
  assert.equal(h1.includes(ip), false);
  assert.equal(h1.includes("Chrome"), false);
});

test("hostOf: strips scheme/www/path, tolerates bare hosts, null on garbage", () => {
  assert.equal(hostOf("https://www.google.com/search?q=x"), "google.com");
  assert.equal(hostOf("instagram.com"), "instagram.com"); // bare Origin host
  assert.equal(hostOf("http://sub.example.co.uk/a"), "sub.example.co.uk");
  assert.equal(hostOf(null), null);
  assert.equal(hostOf(undefined), null);
  assert.equal(hostOf("   "), null);
});

test("cleanPath: drops query + fragment, truncates, null-safe", () => {
  assert.equal(cleanPath("/articulos/mi-nota?utm_source=x#top"), "/articulos/mi-nota");
  assert.equal(cleanPath("/"), "/");
  assert.equal(cleanPath(null), null);
  assert.equal(cleanPath(undefined), null);
  assert.equal(cleanPath("/" + "a".repeat(1000))!.length, 512);
});

test("classifySource: UTM first, else referrer dictionary, else Directo", () => {
  const self = "concienciainquieta.com";
  assert.equal(classifySource("instagram", null, self), "Instagram");
  assert.equal(classifySource("x", null, self), "X");
  assert.equal(classifySource("twitter", null, self), "X");
  assert.equal(classifySource("Newsletter", null, self), "Newsletter"); // case-insensitive UTM
  assert.equal(classifySource("nuevoblog", null, self), "Nuevoblog"); // unknown UTM → titlecase
  assert.equal(classifySource(null, "google.com", self), "Búsqueda");
  assert.equal(classifySource(null, "instagram.com", self), "Instagram");
  assert.equal(classifySource(null, "t.co", self), "X");
  assert.equal(classifySource(null, self, self), "Directo"); // internal referrer
  assert.equal(classifySource(null, `blog.${self}`, self), "Directo"); // internal subdomain
  assert.equal(classifySource(null, "unknownsite.example", self), "unknownsite.example"); // pass through host
  assert.equal(classifySource(null, null, self), "Directo");
  assert.equal(classifySource("", null, self), "Directo"); // empty UTM ignored
});

test("sanitizeProps: bounded key count/length, drops junk types", () => {
  assert.equal(sanitizeProps(null), null);
  assert.equal(sanitizeProps("str"), null);
  assert.equal(sanitizeProps(["a"]), null);
  assert.equal(sanitizeProps({}), null);
  const okp = sanitizeProps({ cta: "topbar_unete", depth: 75 });
  assert.deepEqual(okp, { cta: "topbar_unete", depth: "75" }); // values coerced to string
  // caps at 12 keys
  const many: Record<string, unknown> = {};
  for (let i = 0; i < 30; i++) many["k" + i] = i;
  assert.equal(Object.keys(sanitizeProps(many)!).length, 12);
  // bounds key length (40) and value length (200)
  const big = sanitizeProps({ ["K".repeat(100)]: "V".repeat(1000) })!;
  const k = Object.keys(big)[0];
  assert.equal(k.length, 40);
  assert.equal(big[k].length, 200);
  // null values dropped
  assert.deepEqual(sanitizeProps({ a: null, b: "x" }), { b: "x" });
});

test("clampStr: strings sliced, non-strings null", () => {
  assert.equal(clampStr("hello", 3), "hel");
  assert.equal(clampStr("", 10), null);
  assert.equal(clampStr(123), null);
  assert.equal(clampStr(null), null);
  assert.equal(clampStr("x".repeat(500))!.length, 128); // default cap
});
