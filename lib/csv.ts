// Minimal CSV serializer for admin exports. Pure + dependency-free.
// Escapes per RFC 4180 (wrap every field in double-quotes, double embedded quotes)
// AND neutralizes CSV formula injection: a field a spreadsheet would treat as a
// formula (leading = + - @ tab or CR) gets a leading apostrophe so Excel/Sheets
// render it as inert text. Both export columns come from a public signup form, so a
// crafted value (e.g. =HYPERLINK(...)) could otherwise run in the reader's spreadsheet
// and exfiltrate the subscriber list — the exact PII this export handles.

const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

function escapeField(value: string): string {
  const safe = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * Serialize rows to a CSV string. `headers` are the column keys (and the header row);
 * each row is looked up by those keys. null / undefined become empty strings.
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers: (keyof T & string)[]
): string {
  const headerLine = headers.map(escapeField).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => escapeField(row[h] == null ? "" : String(row[h])))
      .join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}
