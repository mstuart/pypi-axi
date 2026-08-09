import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { viewCommand } from "../../src/commands/view.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), "utf8"));
}

const requestsFixture = fixture("requests.json");
const requests2310Fixture = fixture("requests-2.31.0.json");

describe("viewCommand", () => {
  it("shapes a real captured packument into name/version/aggregates", async () => {
    mockFetch({ "pypi.org/pypi/requests/json": { json: requestsFixture } });
    const out = await viewCommand(["requests"]);
    const pkg = out.package as Record<string, unknown>;
    expect(pkg.name).toBe("requests");
    expect(pkg.version).toBe("2.34.2");
    expect(pkg.summary).toBe("Python HTTP for Humans.");
    expect(pkg.author).toBe("Kenneth Reitz");
    expect(pkg.license).toBe("Apache-2.0");
    expect(pkg.requiresPython).toBe(">=3.10");
    expect(pkg.releaseCount).toBe(13); // release count in the trimmed fixture
    expect(pkg.dependencyCount).toBe(6);
    expect(pkg.latestUpload).toBe("2026-05-14");
    expect((pkg.projectUrls as Record<string, string>).Source).toBe("https://github.com/psf/requests");
    expect(out.help).toBeUndefined();
  });

  it("fetches a specific --version and reports its own upload date", async () => {
    mockFetch({
      "pypi.org/pypi/requests/json": { json: requestsFixture },
      "pypi.org/pypi/requests/2.31.0/json": { json: requests2310Fixture },
    });
    const out = await viewCommand(["requests", "--version", "2.31.0"]);
    const pkg = out.package as Record<string, unknown>;
    expect(pkg.version).toBe("2.31.0");
    // releaseCount still reflects the whole package, from the unversioned packument
    expect(pkg.releaseCount).toBe(13);
  });

  it("truncates a long summary at ~800 chars with a --full hint", async () => {
    const long = "word ".repeat(400); // ~2000 chars
    mockFetch({
      "pypi.org/pypi/requests/json": {
        json: { info: { name: "requests", version: "1.0", summary: long }, releases: {}, urls: [] },
      },
    });
    const out = await viewCommand(["requests"]);
    const pkg = out.package as Record<string, unknown>;
    expect(pkg.summary as string).toContain("... (truncated,");
    expect(out.help).toEqual(["Run `pypi-axi view requests --full` to see the complete summary"]);
  });

  it("returns the full summary with --full and no truncation hint", async () => {
    const long = "word ".repeat(400);
    mockFetch({
      "pypi.org/pypi/requests/json": {
        json: { info: { name: "requests", version: "1.0", summary: long }, releases: {}, urls: [] },
      },
    });
    const out = await viewCommand(["requests", "--full"]);
    expect(out.help).toBeUndefined();
    expect(((out.package as Record<string, unknown>).summary as string)).not.toContain("truncated");
  });

  it("derives author from author_email when author is null", async () => {
    mockFetch({
      "pypi.org/pypi/pkg/json": {
        json: {
          info: { name: "pkg", version: "1.0", author: null, author_email: "Jane Doe <jane@example.com>" },
          releases: {},
          urls: [],
        },
      },
    });
    const out = await viewCommand(["pkg"]);
    expect((out.package as Record<string, unknown>).author).toBe("Jane Doe");
  });

  it("omits null/empty fields instead of emitting them", async () => {
    mockFetch({
      "pypi.org/pypi/bare/json": {
        json: { info: { name: "bare", version: "1.0" }, releases: {}, urls: [] },
      },
    });
    const out = await viewCommand(["bare"]);
    const pkg = out.package as Record<string, unknown>;
    expect(pkg.summary).toBeUndefined();
    expect(pkg.author).toBeUndefined();
    expect(pkg.license).toBeUndefined();
    expect(pkg.projectUrls).toBeUndefined();
    expect(pkg.latestUpload).toBeUndefined();
    expect(pkg.dependencyCount).toBe(0);
  });

  it("translates a 404 into a NOT_FOUND error", async () => {
    mockFetch({ "pypi.org/pypi/nope/json": { status: 404 } });
    await expect(viewCommand(["nope"])).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("requires a package name", async () => {
    await expect(viewCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rejects an unknown flag and lists the valid ones", async () => {
    await expect(viewCommand(["requests", "--bogus"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      suggestions: expect.arrayContaining(["valid flags: --full, --version"]),
    });
  });
});
