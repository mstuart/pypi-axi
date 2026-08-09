import { afterEach, describe, expect, it, vi } from "vitest";
import { depsCommand } from "../../src/commands/deps.js";
import { mockFetch } from "../helpers.js";

afterEach(() => vi.unstubAllGlobals());

describe("depsCommand", () => {
  it("parses requires_dist into dep/spec/marker rows with a count", async () => {
    mockFetch({
      "pypi.org/pypi/flask/json": {
        json: {
          info: {
            name: "Flask",
            version: "3.1.3",
            requires_dist: [
              "blinker>=1.9.0",
              'importlib-metadata>=3.6.0; python_version < "3.10"',
              'asgiref>=3.2; extra == "async"',
            ],
          },
        },
      },
    });
    const out = await depsCommand(["flask"]);
    expect(out.package).toBe("Flask");
    expect(out.count).toBe(3);
    expect(out.deps).toEqual([
      { dep: "blinker", spec: ">=1.9.0" },
      { dep: "importlib-metadata", spec: ">=3.6.0", marker: 'python_version < "3.10"' },
      { dep: "asgiref", spec: ">=3.2", marker: 'extra == "async"' },
    ]);
  });

  it("returns a definitive empty state when there are no dependencies", async () => {
    mockFetch({
      "pypi.org/pypi/leaf/json": { json: { info: { name: "leaf", version: "1.0", requires_dist: [] } } },
    });
    const out = await depsCommand(["leaf"]);
    expect(out.deps).toBe("0 dependencies for leaf 1.0");
    expect(out.count).toBeUndefined();
  });

  it("treats a missing requires_dist the same as an empty one", async () => {
    mockFetch({ "pypi.org/pypi/leaf/json": { json: { info: { name: "leaf", version: "1.0" } } } });
    const out = await depsCommand(["leaf"]);
    expect(out.deps).toBe("0 dependencies for leaf 1.0");
  });

  it("fetches a specific --version", async () => {
    mockFetch({
      "pypi.org/pypi/flask/2.0.0/json": {
        json: { info: { name: "Flask", version: "2.0.0", requires_dist: ["click>=7.0"] } },
      },
    });
    const out = await depsCommand(["flask", "--version", "2.0.0"]);
    expect(out.version).toBe("2.0.0");
    expect(out.deps).toEqual([{ dep: "click", spec: ">=7.0" }]);
  });

  it("requires a package name", async () => {
    await expect(depsCommand([])).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
