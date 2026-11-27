import { beforeEach, expect, it, vi } from "vitest";
import { assertKnownFlags, parseFlags } from "../src/args.js";
import { depsCommand } from "../src/commands/deps.js";
import { downloadsCommand } from "../src/commands/downloads.js";
import { versionsCommand } from "../src/commands/versions.js";
import { viewCommand } from "../src/commands/view.js";
import {
  fetchDownloadsRecent,
  fetchPackument,
  fetchVersion,
} from "../src/pypi.js";

vi.mock("../src/pypi.js", () => ({
  fetchDownloadsRecent: vi.fn(),
  fetchPackument: vi.fn(),
  fetchVersion: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(fetchPackument).mockResolvedValue({
    info: { name: "demo", version: "1.0" },
    releases: {},
    urls: [],
  });
  vi.mocked(fetchDownloadsRecent).mockResolvedValue({
    last_day: 1,
    last_month: 3,
    last_week: 2,
  });
});

it.each([["--__proto__=ignored"], ["--__proto__", "ignored"], ["--__proto__"]])(
  "retains prototype-named flags for validation: %s",
  (...args) => {
    const { flags } = parseFlags(args);
    expect(() => assertKnownFlags(flags, [], "usage")).toThrowError(
      expect.objectContaining({ code: "VALIDATION_ERROR" })
    );
  }
);

it("rejects an empty unknown flag name", () => {
  const { flags } = parseFlags(["--=ignored"]);
  expect(() => assertKnownFlags(flags, [], "usage")).toThrowError(
    expect.objectContaining({ code: "VALIDATION_ERROR" })
  );
});

it.each([
  ["view", viewCommand],
  ["deps", depsCommand],
  ["downloads", downloadsCommand],
  ["versions", versionsCommand],
] as const)(
  "rejects surplus package arguments in %s",
  async (_name, command) => {
    await expect(command(["demo", "different-package"])).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(fetchPackument).not.toHaveBeenCalled();
    expect(fetchVersion).not.toHaveBeenCalled();
    expect(fetchDownloadsRecent).not.toHaveBeenCalled();
  }
);

it.each([
  ["view", viewCommand],
  ["deps", depsCommand],
] as const)(
  "rejects a version flag without a version in %s",
  async (_name, command) => {
    await Promise.all(
      [
        ["demo", "--version"],
        ["demo", "--version="],
        ["demo", "--version", "  "],
      ].map((args) =>
        expect(command(args)).rejects.toMatchObject({
          code: "VALIDATION_ERROR",
        })
      )
    );
    expect(fetchPackument).not.toHaveBeenCalled();
    expect(fetchVersion).not.toHaveBeenCalled();
  }
);

it("preserves a prototype-named project URL label", async () => {
  vi.mocked(fetchPackument).mockResolvedValue({
    info: {
      name: "demo",
      project_urls: JSON.parse(
        '{"__proto__":"https://example.com/docs","constructor":"https://example.com/code"}'
      ),
    },
    releases: {},
    urls: [],
  });
  const result = await viewCommand(["demo"]);
  const projectUrls = (result.package as Record<string, unknown>)
    .projectUrls as Record<string, string>;
  expect(Object.hasOwn(projectUrls, "__proto__")).toBe(true);
  expect(Object.getOwnPropertyDescriptor(projectUrls, "__proto__")?.value).toBe(
    "https://example.com/docs"
  );
  expect(projectUrls.constructor).toBe("https://example.com/code");
});
