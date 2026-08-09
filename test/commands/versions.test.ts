import { afterEach, describe, expect, it, vi } from "vitest";
import { versionsCommand } from "../../src/commands/versions.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

function packument() {
  return {
    info: { name: "demo", version: "1.2.0" },
    releases: {
      "1.0.0": [{ filename: "demo-1.0.0.tar.gz", upload_time_iso_8601: "2024-01-01T00:00:00Z", yanked: false }],
      "1.1.0": [{ filename: "demo-1.1.0.tar.gz", upload_time_iso_8601: "2024-02-01T00:00:00Z", yanked: true }],
      "1.2.0": [{ filename: "demo-1.2.0.tar.gz", upload_time_iso_8601: "2024-03-01T00:00:00Z", yanked: false }],
      "0.0.1-empty": [], // no files uploaded -> no upload date -> excluded
    },
    urls: [],
  };
}

describe("versionsCommand", () => {
  it("lists versions newest-first with upload dates, yanked status, and a total count", async () => {
    mockFetch({ "pypi.org/pypi/demo/json": { json: packument() } });
    const out = await versionsCommand(["demo"]);
    expect(out.count).toBe("3 of 3 total");
    expect(out.versions).toEqual([
      { version: "1.2.0", uploadDate: "2024-03-01", yanked: "no" },
      { version: "1.1.0", uploadDate: "2024-02-01", yanked: "yes" },
      { version: "1.0.0", uploadDate: "2024-01-01", yanked: "no" },
    ]);
  });

  it("respects --limit and reports N of M total", async () => {
    mockFetch({ "pypi.org/pypi/demo/json": { json: packument() } });
    const out = await versionsCommand(["demo", "--limit", "2"]);
    expect(out.count).toBe("2 of 3 total");
    expect((out.versions as unknown[]).length).toBe(2);
  });

  it("clamps --limit to the max", async () => {
    mockFetch({ "pypi.org/pypi/demo/json": { json: packument() } });
    const out = await versionsCommand(["demo", "--limit", "9999"]);
    expect(out.count).toBe("3 of 3 total");
  });

  it("requires a package name", async () => {
    await expect(versionsCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
