import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchDownloadsRecent,
  fetchPackument,
  fetchVersion,
} from "../src/pypi.js";
import { mockFetch } from "./helpers.js";

afterEach(() => vi.unstubAllGlobals());

describe("fetchPackument", () => {
  it("fetches and returns the packument", async () => {
    mockFetch({
      "pypi.org/pypi/requests/json": { json: { info: { name: "requests" } } },
    });
    const doc = await fetchPackument("requests");
    expect(doc.info.name).toBe("requests");
  });

  it("normalizes the package name (PEP 503) before building the URL", async () => {
    mockFetch({
      "pypi.org/pypi/flask-cors/json": {
        json: { info: { name: "Flask-Cors" } },
      },
    });
    const doc = await fetchPackument("Flask_Cors");
    expect(doc.info.name).toBe("Flask-Cors");
  });

  it("translates a 404 into a NOT_FOUND AxiError", async () => {
    mockFetch({ "pypi.org/pypi/nope/json": { status: 404 } });
    await expect(fetchPackument("nope")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("translates a network failure into a NETWORK AxiError", async () => {
    mockFetch({ "pypi.org/pypi/requests/json": { reject: true } });
    await expect(fetchPackument("requests")).rejects.toMatchObject({
      code: "NETWORK",
    });
  });

  it("translates a malformed JSON body into a REGISTRY AxiError", async () => {
    mockFetch({ "pypi.org/pypi/requests/json": { badJson: true } });
    await expect(fetchPackument("requests")).rejects.toMatchObject({
      code: "REGISTRY",
    });
  });

  it("translates a non-404 error status into a REGISTRY AxiError", async () => {
    mockFetch({ "pypi.org/pypi/requests/json": { status: 500 } });
    await expect(fetchPackument("requests")).rejects.toMatchObject({
      code: "REGISTRY",
    });
  });
});

describe("fetchVersion", () => {
  it("fetches a specific version document", async () => {
    mockFetch({
      "pypi.org/pypi/requests/2.31.0/json": {
        json: { info: { name: "requests", version: "2.31.0" } },
      },
    });
    const doc = await fetchVersion("requests", "2.31.0");
    expect(doc.info.version).toBe("2.31.0");
  });

  it("translates a 404 into a NOT_FOUND AxiError naming the version", async () => {
    mockFetch({ "pypi.org/pypi/requests/9.9.9/json": { status: 404 } });
    await expect(fetchVersion("requests", "9.9.9")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("fetchDownloadsRecent", () => {
  it("returns the recent downloads data", async () => {
    mockFetch({
      "pypistats.org/api/packages/requests/recent": {
        json: { data: { last_day: 1, last_month: 3, last_week: 2 } },
      },
    });
    const recent = await fetchDownloadsRecent("requests");
    expect(recent).toEqual({ last_day: 1, last_month: 3, last_week: 2 });
  });

  it("returns null (not an error) on a 404", async () => {
    mockFetch({ "pypistats.org/api/packages/nope/recent": { status: 404 } });
    await expect(fetchDownloadsRecent("nope")).resolves.toBeNull();
  });

  it("still throws for a non-404 error status", async () => {
    mockFetch({
      "pypistats.org/api/packages/requests/recent": { status: 500 },
    });
    await expect(fetchDownloadsRecent("requests")).rejects.toMatchObject({
      code: "REGISTRY",
    });
  });
});
