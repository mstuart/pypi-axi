// Network-gated integration test against the real PyPI JSON API. Skipped
// automatically when offline so `npm test` still passes in a sandboxed CI
// runner with no outbound network access.
import { describe, expect, it } from "vitest";
import { versionsCommand } from "../src/commands/versions.js";
import { viewCommand } from "../src/commands/view.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VERSION_COUNT_PATTERN = /^5 of \d+ total$/;

async function isOnline(): Promise<boolean> {
  try {
    const response = await fetch("https://pypi.org/pypi/requests/json", {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const online = await isOnline();

describe.skipIf(!online)("live PyPI integration", () => {
  it("view requests returns a real, shaped package view", async () => {
    const out = await viewCommand(["requests"]);
    const pkg = out.package as Record<string, unknown>;
    expect(pkg.name).toBe("requests");
    expect(typeof pkg.version).toBe("string");
    expect(typeof pkg.releaseCount).toBe("number");
    expect(pkg.releaseCount as number).toBeGreaterThan(50);
    expect(typeof pkg.dependencyCount).toBe("number");
  }, 30_000);

  it("versions requests returns real release history newest-first", async () => {
    const out = await versionsCommand(["requests", "--limit", "5"]);
    expect(out.count).toMatch(VERSION_COUNT_PATTERN);
    const versions = out.versions as Array<{
      version: string;
      uploadDate: string;
    }>;
    expect(versions).toHaveLength(5);
    for (const entry of versions) {
      expect(entry.version).toBeTruthy();
      expect(entry.uploadDate).toMatch(DATE_PATTERN);
    }
    // newest-first
    const dates = versions.map((v) => v.uploadDate);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  }, 30_000);
});
