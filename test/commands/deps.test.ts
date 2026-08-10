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
            requires_dist: [
              "blinker>=1.9.0",
              'importlib-metadata>=3.6.0; python_version < "3.10"',
              'asgiref>=3.2; extra == "async"',
            ],
            version: "3.1.3",
          },
        },
      },
    });
    const out = await depsCommand(["flask"]);
    expect(out.package).toBe("Flask");
    expect(out.count).toBe(3);
    expect(out.deps).toEqual([
      { dep: "blinker", spec: ">=1.9.0" },
      {
        dep: "importlib-metadata",
        marker: 'python_version < "3.10"',
        spec: ">=3.6.0",
      },
      { dep: "asgiref", marker: 'extra == "async"', spec: ">=3.2" },
    ]);
    expect(out.help).toEqual(["Run `pypi-axi view Flask` for package details"]);
  });

  it("returns a definitive empty state when there are no dependencies", async () => {
    mockFetch({
      "pypi.org/pypi/leaf/json": {
        json: { info: { name: "leaf", requires_dist: [], version: "1.0" } },
      },
    });
    const out = await depsCommand(["leaf"]);
    expect(out.deps).toBe("0 dependencies for leaf 1.0");
    expect(out.count).toBeUndefined();
    expect(out.help).toBeUndefined();
  });

  it("treats a missing requires_dist the same as an empty one", async () => {
    mockFetch({
      "pypi.org/pypi/leaf/json": {
        json: { info: { name: "leaf", version: "1.0" } },
      },
    });
    const out = await depsCommand(["leaf"]);
    expect(out.deps).toBe("0 dependencies for leaf 1.0");
  });

  it("fetches a specific --version", async () => {
    mockFetch({
      "pypi.org/pypi/flask/2.0.0/json": {
        json: {
          info: {
            name: "Flask",
            requires_dist: ["click>=7.0"],
            version: "2.0.0",
          },
        },
      },
    });
    const out = await depsCommand(["flask", "--version", "2.0.0"]);
    expect(out.version).toBe("2.0.0");
    expect(out.deps).toEqual([{ dep: "click", spec: ">=7.0" }]);
  });

  it("requires a package name", async () => {
    await expect(depsCommand([])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects an unknown flag", async () => {
    await expect(depsCommand(["flask", "--bogus"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      suggestions: expect.arrayContaining(["valid flags: --version"]),
    });
  });
});
