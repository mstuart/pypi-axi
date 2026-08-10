import { afterEach, describe, expect, it, vi } from "vitest";
import { versionsCommand } from "../../src/commands/versions.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

function packument() {
  return {
    info: { name: "demo", version: "1.2.0" },
    releases: {
      "0.0.1-empty": [], // no files uploaded -> no upload date -> excluded
      "1.0.0": [
        {
          filename: "demo-1.0.0.tar.gz",
          upload_time_iso_8601: "2024-01-01T00:00:00Z",
          yanked: false,
        },
      ],
      "1.1.0": [
        {
          filename: "demo-1.1.0.tar.gz",
          upload_time_iso_8601: "2024-02-01T00:00:00Z",
          yanked: true,
        },
      ],
      "1.2.0": [
        {
          filename: "demo-1.2.0.tar.gz",
          upload_time_iso_8601: "2024-03-01T00:00:00Z",
          yanked: false,
        },
      ],
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
      { uploadDate: "2024-03-01", version: "1.2.0", yanked: "no" },
      { uploadDate: "2024-02-01", version: "1.1.0", yanked: "yes" },
      { uploadDate: "2024-01-01", version: "1.0.0", yanked: "no" },
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
    await expect(versionsCommand([])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects an unknown flag", async () => {
    await expect(versionsCommand(["demo", "--bogus"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      suggestions: expect.arrayContaining(["valid flags: --limit"]),
    });
  });

  it("omits help when the full list is returned", async () => {
    mockFetch({ "pypi.org/pypi/demo/json": { json: packument() } });
    const out = await versionsCommand(["demo"]);
    expect(out.help).toBeUndefined();
  });

  it("suggests raising --limit and viewing the package when the list is truncated", async () => {
    mockFetch({ "pypi.org/pypi/demo/json": { json: packument() } });
    const out = await versionsCommand(["demo", "--limit", "2"]);
    expect(out.help).toEqual([
      "Run `pypi-axi versions demo --limit 4` to see more",
      "Run `pypi-axi view demo` for package details",
    ]);
  });
});
