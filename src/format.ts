/** Collapse all runs of whitespace (including newlines) into single spaces. */
export function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Collapse then hard-truncate a single-line value, appending an ellipsis. */
export function truncateLine(text: string, max: number): string {
  const line = collapseWhitespace(text);
  if (line.length <= max) {
    return line;
  }
  return `${line.slice(0, max).trimEnd()} …`;
}

export interface TruncateResult {
  text: string;
  truncated: boolean;
}

/**
 * Collapse then truncate a longer text field, appending a
 * `... (truncated, N chars total)` note so the agent knows how much it's
 * missing without a separate size field.
 */
export function truncateWithCount(text: string, max: number): TruncateResult {
  const collapsed = collapseWhitespace(text);
  if (collapsed.length <= max) {
    return { text: collapsed, truncated: false };
  }
  const preview = collapsed.slice(0, max).trimEnd();
  return {
    text: `${preview}... (truncated, ${collapsed.length} chars total)`,
    truncated: true,
  };
}

/** Convert an ISO 8601 timestamp to a YYYY-MM-DD date. */
export function isoDate(timestamp: string | undefined): string | undefined {
  if (!timestamp) {
    return;
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Normalize a package name per PEP 503: lowercase, and collapse any run of
 * `-`, `_`, or `.` into a single `-`. Applied to every package name before
 * building a PyPI URL, since PyPI treats these forms as equivalent.
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[-_.]+/g, "-");
}
