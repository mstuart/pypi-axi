import { describe, expect, it } from "vitest";
import { assertKnownFlags, parseFlags, parseLimit } from "../src/args.js";

describe("parseFlags", () => {
  it("collects positionals and --key value flags", () => {
    const { positionals, flags } = parseFlags(["view", "requests", "--version", "2.31.0"]);
    expect(positionals).toEqual(["view", "requests"]);
    expect(flags.version).toBe("2.31.0");
  });

  it("supports --key=value form", () => {
    const { flags } = parseFlags(["--limit=5"]);
    expect(flags.limit).toBe("5");
  });

  it("treats a trailing flag with no value as boolean true", () => {
    const { flags } = parseFlags(["--full"]);
    expect(flags.full).toBe(true);
  });

  it("treats a flag followed by another flag as boolean true", () => {
    const { flags } = parseFlags(["--full", "--version", "1.0"]);
    expect(flags.full).toBe(true);
    expect(flags.version).toBe("1.0");
  });

  it("forces booleans-list names to boolean even when followed by a bare word", () => {
    const { positionals, flags } = parseFlags(["--full", "requests"], ["full"]);
    expect(flags.full).toBe(true);
    expect(positionals).toEqual(["requests"]);
  });
});

describe("assertKnownFlags", () => {
  it("passes when all flags are allowed", () => {
    expect(() => assertKnownFlags({ version: "1.0", full: true }, ["version", "full"], "usage")).not.toThrow();
  });

  it("throws VALIDATION_ERROR listing valid flags on an unrecognized flag", () => {
    expect(() => assertKnownFlags({ bogus: true }, ["version", "full"], "usage")).toThrowError(
      expect.objectContaining({
        code: "VALIDATION_ERROR",
        suggestions: expect.arrayContaining(["valid flags: --version, --full"]),
      }),
    );
  });

  it("reports \"(none)\" when the command takes no flags", () => {
    expect(() => assertKnownFlags({ bogus: true }, [], "usage")).toThrowError(
      expect.objectContaining({ suggestions: expect.arrayContaining(["valid flags: (none)"]) }),
    );
  });
});

describe("parseLimit", () => {
  it("falls back when the value is missing or non-numeric", () => {
    expect(parseLimit(undefined, 20, 100)).toBe(20);
    expect(parseLimit(true, 20, 100)).toBe(20);
    expect(parseLimit("nope", 20, 100)).toBe(20);
  });

  it("clamps to the max", () => {
    expect(parseLimit("500", 20, 100)).toBe(100);
  });

  it("rejects zero and negative values", () => {
    expect(parseLimit("0", 20, 100)).toBe(20);
    expect(parseLimit("-5", 20, 100)).toBe(20);
  });

  it("parses a valid value within range", () => {
    expect(parseLimit("42", 20, 100)).toBe(42);
  });
});
