import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadsCommand } from "../../src/commands/downloads.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

const downloadsFixture = JSON.parse(
  readFileSync(fileURLToPath(new URL("../fixtures/requests-downloads.json", import.meta.url)), "utf8"),
);

describe("downloadsCommand", () => {
  it("shapes a real captured pypistats response", async () => {
    mockFetch({ "pypistats.org/api/packages/requests/recent": { json: downloadsFixture } });
    const out = await downloadsCommand(["requests"]);
    const downloads = out.downloads as Record<string, unknown>;
    expect(downloads.package).toBe("requests");
    expect(downloads.lastDay).toBe(downloadsFixture.data.last_day);
    expect(downloads.lastWeek).toBe(downloadsFixture.data.last_week);
    expect(downloads.lastMonth).toBe(downloadsFixture.data.last_month);
    expect(out.help).toEqual(["Run `pypi-axi view requests` for package details"]);
  });

  it("returns a definitive no-data object (not an error) on a 404", async () => {
    mockFetch({ "pypistats.org/api/packages/nope/recent": { status: 404 } });
    const out = await downloadsCommand(["nope"]);
    expect(out.downloads).toEqual({ package: "nope", status: "no download data available yet" });
    expect(out.help).toBeUndefined();
  });

  it("requires a package name", async () => {
    await expect(downloadsCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects an unknown flag", async () => {
    await expect(downloadsCommand(["requests", "--bogus"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      suggestions: expect.arrayContaining(["valid flags: (none)"]),
    });
  });
});
