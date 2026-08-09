import { describe, expect, it } from "vitest";
import {
  collapseWhitespace,
  isoDate,
  normalizeName,
  truncateLine,
  truncateWithCount,
} from "../src/format.js";

describe("collapseWhitespace", () => {
  it("collapses whitespace and newlines", () => {
    expect(collapseWhitespace("a\n\n  b   c")).toBe("a b c");
  });
});

describe("truncateLine", () => {
  it("truncates long lines with an ellipsis", () => {
    expect(truncateLine("hello world", 5)).toBe("hello …");
    expect(truncateLine("short", 100)).toBe("short");
  });
});

describe("truncateWithCount", () => {
  it("returns the collapsed text untouched when under the limit", () => {
    const result = truncateWithCount("short summary", 800);
    expect(result).toEqual({ text: "short summary", truncated: false });
  });

  it("appends a truncated-count note when over the limit", () => {
    const long = "word ".repeat(400); // ~2000 chars
    const result = truncateWithCount(long, 800);
    expect(result.truncated).toBe(true);
    expect(result.text).toContain("... (truncated,");
    expect(result.text).toContain("chars total)");
    expect(result.text.length).toBeGreaterThan(800);
    expect(result.text.length).toBeLessThan(900);
  });
});

describe("isoDate", () => {
  it("formats ISO timestamps as YYYY-MM-DD", () => {
    expect(isoDate("2024-04-25T17:09:33.123Z")).toBe("2024-04-25");
    expect(isoDate("not-a-date")).toBeUndefined();
    expect(isoDate(undefined)).toBeUndefined();
  });
});

describe("normalizeName (PEP 503)", () => {
  it("lowercases names", () => {
    expect(normalizeName("Django")).toBe("django");
  });

  it("collapses runs of -, _, . into a single -", () => {
    expect(normalizeName("flask_cors")).toBe("flask-cors");
    expect(normalizeName("zope.interface")).toBe("zope-interface");
    expect(normalizeName("A...B---C___D")).toBe("a-b-c-d");
  });

  it("treats equivalent forms identically", () => {
    expect(normalizeName("Flask-Cors")).toBe(normalizeName("flask_cors"));
    expect(normalizeName("Flask-Cors")).toBe(normalizeName("Flask.Cors"));
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeName("  requests  ")).toBe("requests");
  });
});
