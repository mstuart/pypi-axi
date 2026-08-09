import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { homeCommand } from "../src/home.js";
import { mockFetch } from "./helpers.js";

afterEach(() => vi.unstubAllGlobals());

function tempProject(requirements: string | null): string {
  const dir = mkdtempSync(join(tmpdir(), "pypi-axi-home-"));
  if (requirements !== null) writeFileSync(join(dir, "requirements.txt"), requirements);
  return dir;
}

describe("homeCommand", () => {
  it("shows only command hints with no local project", async () => {
    const out = await homeCommand([], undefined, tempProject(null));
    expect(out.project).toBeUndefined();
    expect((out.help as string[])[0]).toContain("pypi-axi view");
  });

  it("builds a name/declaredSpec/latestAvailable table for declared deps", async () => {
    mockFetch({
      "pypi.org/pypi/requests/json": { json: { info: { name: "requests", version: "2.34.2" } } },
      "pypi.org/pypi/flask/json": { json: { info: { name: "flask", version: "3.1.3" } } },
    });
    const dir = tempProject("requests==2.31.0\nflask\n");
    const out = await homeCommand([], undefined, dir);
    const project = out.project as Record<string, unknown>;
    expect(project.source).toBe("requirements.txt");
    expect(project.dependencyCount).toBe(2);
    expect(project.dependencies).toEqual([
      { name: "requests", declaredSpec: "==2.31.0", latestAvailable: "2.34.2" },
      { name: "flask", declaredSpec: "any", latestAvailable: "3.1.3" },
    ]);
  });

  it("degrades a single row to 'unknown' when its lookup fails, without failing the whole view", async () => {
    mockFetch({ "pypi.org/pypi/doesnotexist/json": { status: 404 } });
    const dir = tempProject("doesnotexist==1.0\n");
    const out = await homeCommand([], undefined, dir);
    const project = out.project as Record<string, unknown>;
    const deps = project.dependencies as Array<Record<string, unknown>>;
    expect(deps[0].latestAvailable).toBe("unknown");
  });
});
