import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseRequirement } from "./pep508.js";
import { normalizeName } from "./format.js";

export interface DeclaredDependency {
  name: string;
  spec?: string;
}

export interface LocalProject {
  source: "requirements.txt" | "pyproject.toml" | "setup.py";
  dependencies: DeclaredDependency[];
}

/**
 * Detect and parse the current directory's Python dependency manifest.
 * Checks requirements.txt, pyproject.toml, and setup.py, in that order.
 * These are hand-rolled, best-effort extractions (regex over the raw text),
 * not full TOML/AST parsers — good enough to answer "what does this project
 * declare" without adding a parsing dependency.
 */
export function readLocalProject(dir: string = process.cwd()): LocalProject | null {
  const requirementsPath = join(dir, "requirements.txt");
  if (existsSync(requirementsPath)) {
    return {
      source: "requirements.txt",
      dependencies: parseRequirementsTxt(readFileSync(requirementsPath, "utf8")),
    };
  }

  const pyprojectPath = join(dir, "pyproject.toml");
  if (existsSync(pyprojectPath)) {
    return {
      source: "pyproject.toml",
      dependencies: parsePyprojectToml(readFileSync(pyprojectPath, "utf8")),
    };
  }

  const setupPath = join(dir, "setup.py");
  if (existsSync(setupPath)) {
    return {
      source: "setup.py",
      dependencies: parseSetupPy(readFileSync(setupPath, "utf8")),
    };
  }

  return null;
}

function toDeclared(entry: string): DeclaredDependency {
  const parsed = parseRequirement(entry);
  return parsed.specifier ? { name: parsed.name, spec: parsed.specifier } : { name: parsed.name };
}

function parseRequirementsTxt(text: string): DeclaredDependency[] {
  const deps: DeclaredDependency[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line || line.startsWith("-")) continue; // skip -r/-e/--flag lines
    deps.push(toDeclared(line));
  }
  return dedupe(deps);
}

function parsePyprojectToml(text: string): DeclaredDependency[] {
  const deps: DeclaredDependency[] = [];

  // PEP 621: [project] dependencies = ["foo>=1.0", "bar"]
  for (const entry of extractTomlStringArray(text, "dependencies")) {
    deps.push(toDeclared(entry));
  }

  // Poetry: [tool.poetry.dependencies]\nfoo = "^1.0"
  for (const dep of extractPoetryDependencies(text)) {
    deps.push(dep);
  }

  return dedupe(deps);
}

function extractTomlStringArray(text: string, key: string): string[] {
  const match = text.match(new RegExp(`^\\s*${key}\\s*=\\s*\\[([\\s\\S]*?)\\]`, "m"));
  if (!match) return [];
  return extractQuotedStrings(match[1]);
}

function extractPoetryDependencies(text: string): DeclaredDependency[] {
  const match = text.match(/\[tool\.poetry\.dependencies\]([\s\S]*?)(?:\n\[|$)/);
  if (!match) return [];

  const deps: DeclaredDependency[] = [];
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const kv = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)\s*=\s*(.+)$/);
    if (!kv) continue;
    const name = kv[1];
    if (name.toLowerCase() === "python") continue; // interpreter constraint, not a dependency

    const stringMatch = kv[2].trim().match(/^"([^"]*)"|^'([^']*)'/);
    const spec = stringMatch ? stringMatch[1] ?? stringMatch[2] : undefined;
    deps.push(spec ? { name, spec } : { name });
  }
  return deps;
}

function parseSetupPy(text: string): DeclaredDependency[] {
  const match = text.match(/install_requires\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return [];
  return dedupe(extractQuotedStrings(match[1]).map(toDeclared));
}

function extractQuotedStrings(body: string): string[] {
  const items: string[] = [];
  const stringRegex = /"([^"]*)"|'([^']*)'/g;
  let match: RegExpExecArray | null;
  while ((match = stringRegex.exec(body))) {
    items.push(match[1] ?? match[2] ?? "");
  }
  return items.filter((item) => item.length > 0);
}

function dedupe(deps: DeclaredDependency[]): DeclaredDependency[] {
  const seen = new Map<string, DeclaredDependency>();
  for (const dep of deps) {
    const key = normalizeName(dep.name);
    if (!seen.has(key)) seen.set(key, dep);
  }
  return [...seen.values()];
}
