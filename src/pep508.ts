export interface ParsedRequirement {
  name: string;
  specifier?: string;
  marker?: string;
}

/**
 * Best-effort parser for PEP 508 requirement strings, as found in PyPI's
 * `requires_dist` and in `requirements.txt` / `pyproject.toml` dependency
 * lists. This is not a full PEP 508 grammar — just enough to split a
 * dependency name, version specifier, and environment marker for display.
 *
 * Handles both the current unparenthesized form (`foo<4,>=2; extra == "x"`)
 * and the legacy PyPI form with a parenthesized specifier (`foo (>=1.0)`).
 */
export function parseRequirement(raw: string): ParsedRequirement {
  const entry = raw.trim();
  const [reqPart, markerPart] = splitOnce(entry, ";");

  const match = reqPart.trim().match(/^([A-Za-z0-9][A-Za-z0-9._-]*)\s*(?:\[[^\]]*\])?\s*(.*)$/);
  const name = (match?.[1] ?? reqPart.trim()).trim();

  let specifier = (match?.[2] ?? "").trim();
  const parenMatch = specifier.match(/^\((.*)\)$/);
  if (parenMatch) specifier = parenMatch[1].trim();

  const marker = markerPart?.trim();

  const result: ParsedRequirement = { name };
  if (specifier) result.specifier = specifier;
  if (marker) result.marker = marker;
  return result;
}

function splitOnce(text: string, separator: string): [string, string | undefined] {
  const index = text.indexOf(separator);
  if (index === -1) return [text, undefined];
  return [text.slice(0, index), text.slice(index + 1)];
}
