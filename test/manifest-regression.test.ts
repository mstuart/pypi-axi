import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { readLocalProject } from "../src/local-project.js";

const dirs: string[] = [];
function readManifest(file: string, contents: string) {
  const dir = mkdtempSync(join(tmpdir(), "pypi-manifest-"));
  dirs.push(dir);
  writeFileSync(join(dir, file), contents);
  return readLocalProject(dir)?.dependencies;
}
afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

it("keeps complete TOML dependency arrays containing extras", () => {
  expect(
    readManifest(
      "pyproject.toml",
      '[project]\ndependencies = ["requests[security]>=2", "rich"]'
    )
  ).toEqual([{ name: "requests", spec: ">=2" }, { name: "rich" }]);
});
it("keeps complete setup.py dependency arrays containing extras", () => {
  expect(
    readManifest(
      "setup.py",
      "setup(install_requires=['requests[security]>=2', 'rich'])"
    )
  ).toEqual([{ name: "requests", spec: ">=2" }, { name: "rich" }]);
});
it("reads PEP 621 dependencies from the project table only", () => {
  expect(
    readManifest(
      "pyproject.toml",
      '[tool.example]\ndependencies = ["dev-tool"]\n[project]\nname = "app"\ndependencies = ["requests"]\n[tool.other]\ndependencies = ["other-tool"]'
    )
  ).toEqual([{ name: "requests" }]);
  expect(
    readManifest(
      "pyproject.toml",
      '[tool.example]\ndependencies = ["dev-tool"]'
    )
  ).toEqual([]);
});
it("preserves requirement URL fragments while removing actual comments", () => {
  expect(
    readManifest(
      "requirements.txt",
      "# ignored\nfoo @ https://example.com/foo.whl#sha256=abc123  # note\nbar>=1 # note"
    )
  ).toEqual([
    { name: "foo", spec: "@ https://example.com/foo.whl#sha256=abc123" },
    { name: "bar", spec: ">=1" },
  ]);
});

it("accepts equivalent project table spellings", () => {
  for (const header of ["[ project ]", '["project"]', "['project']"]) {
    expect(
      readManifest("pyproject.toml", `${header}\ndependencies = ["requests"]`)
    ).toEqual([{ name: "requests" }]);
  }
});
it("ignores unmatched quotes in dependency array comments", () => {
  expect(
    readManifest(
      "pyproject.toml",
      '[project]\ndependencies = [\n  "requests", # project\'s HTTP client\n  "rich"\n]'
    )
  ).toEqual([{ name: "requests" }, { name: "rich" }]);
  expect(
    readManifest(
      "setup.py",
      "setup(install_requires=[\n  'requests', # project's HTTP client\n  'rich'\n])"
    )
  ).toEqual([{ name: "requests" }, { name: "rich" }]);
});
it("ignores fake project headers within multiline strings", () => {
  const content =
    '[tool.example]\ntemplate = """\n[project]\nexample = "text"\n"""\n[project]\ndependencies = ["requests"]';
  expect(readManifest("pyproject.toml", content)).toEqual([
    { name: "requests" },
  ]);
});
