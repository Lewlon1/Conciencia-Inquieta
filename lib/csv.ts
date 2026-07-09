// Minimal CSV serializer for admin exports. Pure + dependency-free.
// Escapes per RFC 4180: wrap every field in double-quotes and double any embedded
// double-quote, so commas / quotes / newlines in values can't break the columns.

function escapeField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
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
