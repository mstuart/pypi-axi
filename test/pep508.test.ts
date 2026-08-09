import { describe, expect, it } from "vitest";
import { parseRequirement } from "../src/pep508.js";

describe("parseRequirement", () => {
  it("parses a bare name", () => {
    expect(parseRequirement("flask")).toEqual({ name: "flask" });
  });

  it("parses a name with a comma-separated specifier", () => {
    expect(parseRequirement("charset_normalizer<4,>=2")).toEqual({
      name: "charset_normalizer",
      specifier: "<4,>=2",
    });
  });

  it("parses a marker after a semicolon", () => {
    expect(parseRequirement('PySocks!=1.5.7,>=1.5.6; extra == "socks"')).toEqual({
      name: "PySocks",
      specifier: "!=1.5.7,>=1.5.6",
      marker: 'extra == "socks"',
    });
  });

  it("parses a python_version marker", () => {
    expect(
      parseRequirement('importlib-metadata>=3.6.0; python_version < "3.10"'),
    ).toEqual({
      name: "importlib-metadata",
      specifier: ">=3.6.0",
      marker: 'python_version < "3.10"',
    });
  });

  it("unwraps the legacy parenthesized specifier form", () => {
    expect(parseRequirement("charset-normalizer (<4,>=2)")).toEqual({
      name: "charset-normalizer",
      specifier: "<4,>=2",
    });
  });

  it("strips an extras marker like [security] from the name", () => {
    expect(parseRequirement("requests[security]>=2.0")).toEqual({
      name: "requests",
      specifier: ">=2.0",
    });
  });

  it("omits marker and specifier keys when absent", () => {
    const result = parseRequirement("numpy");
    expect(result.specifier).toBeUndefined();
    expect(result.marker).toBeUndefined();
  });
});
