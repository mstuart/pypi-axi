import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readLocalProject } from "../src/localProject.js";

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), "pypi-axi-"));
}

describe("readLocalProject", () => {
  it("returns null when no manifest is present", () => {
    expect(readLocalProject(tempDir())).toBeNull();
  });

  it("parses requirements.txt, skipping comments and -flag lines", () => {
    const dir = tempDir();
    writeFileSync(
      join(dir, "requirements.txt"),
      ["# a comment", "requests==2.31.0", "flask>=2.0", "numpy", "-r other.txt", ""].join("\n"),
    );
    const project = readLocalProject(dir);
    expect(project?.source).toBe("requirements.txt");
    expect(project?.dependencies).toEqual([
      { name: "requests", spec: "==2.31.0" },
      { name: "flask", spec: ">=2.0" },
      { name: "numpy" },
    ]);
  });

  it("parses a PEP 621 dependencies array in pyproject.toml", () => {
    const dir = tempDir();
    writeFileSync(
      join(dir, "pyproject.toml"),
      [
        "[project]",
        'name = "myapp"',
        "dependencies = [",
        '  "requests>=2.0",',
        '  "click",',
        "]",
      ].join("\n"),
    );
    const project = readLocalProject(dir);
    expect(project?.source).toBe("pyproject.toml");
    expect(project?.dependencies).toEqual([
      { name: "requests", spec: ">=2.0" },
      { name: "click" },
    ]);
  });

  it("parses a Poetry [tool.poetry.dependencies] table, excluding python", () => {
    const dir = tempDir();
    writeFileSync(
      join(dir, "pyproject.toml"),
      [
        "[tool.poetry.dependencies]",
        'python = "^3.10"',
        'requests = "^2.31"',
        "click = { version = \"^8.0\" }",
        "",
        "[tool.poetry.dev-dependencies]",
        'pytest = "^8.0"',
      ].join("\n"),
    );
    const project = readLocalProject(dir);
    const names = project?.dependencies.map((d) => d.name);
    expect(names).toContain("requests");
    expect(names).not.toContain("python");
    expect(names).not.toContain("pytest");
  });

  it("parses install_requires from setup.py", () => {
    const dir = tempDir();
    writeFileSync(
      join(dir, "setup.py"),
      [
        "from setuptools import setup",
        "setup(",
        "  name='myapp',",
        "  install_requires=[",
        "    'requests>=2.0',",
        "    'click',",
        "  ],",
        ")",
      ].join("\n"),
    );
    const project = readLocalProject(dir);
    expect(project?.source).toBe("setup.py");
    expect(project?.dependencies).toEqual([
      { name: "requests", spec: ">=2.0" },
      { name: "click" },
    ]);
  });

  it("prefers requirements.txt over pyproject.toml when both are present", () => {
    const dir = tempDir();
    writeFileSync(join(dir, "requirements.txt"), "requests\n");
    writeFileSync(join(dir, "pyproject.toml"), 'dependencies = ["click"]\n');
    expect(readLocalProject(dir)?.source).toBe("requirements.txt");
  });

  it("deduplicates dependencies declared under equivalent PEP 503 names", () => {
    const dir = tempDir();
    writeFileSync(join(dir, "requirements.txt"), "Flask-Cors==1.0\nflask_cors==1.0\n");
    expect(readLocalProject(dir)?.dependencies).toHaveLength(1);
  });
});
