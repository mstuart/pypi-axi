import { readLocalProject } from "./localProject.js";
import { fetchPackument } from "./pypi.js";

const HELP = [
  "Run `pypi-axi view <pkg>` for package details",
  "Run `pypi-axi versions <pkg>` to list recent versions",
  "Run `pypi-axi deps <pkg>` to see a package's dependencies",
  "Run `pypi-axi downloads <pkg>` for download stats",
];

const MAX_LISTED_DEPS = 20;

/** Resolve the latest published version, degrading a single row to "unknown" rather than failing the whole view. */
async function latestVersionSafe(name: string): Promise<string | undefined> {
  try {
    const packument = await fetchPackument(name);
    return packument.info.version;
  } catch {
    return undefined;
  }
}

export async function homeCommand(
  _args: string[] = [],
  _context?: unknown,
  dir: string = process.cwd(),
): Promise<Record<string, unknown>> {
  const project = readLocalProject(dir);
  if (!project || project.dependencies.length === 0) {
    return { help: HELP };
  }

  const listed = project.dependencies.slice(0, MAX_LISTED_DEPS);
  const latestVersions = await Promise.all(listed.map((dep) => latestVersionSafe(dep.name)));

  const dependencies = listed.map((dep, index) => ({
    name: dep.name,
    declaredSpec: dep.spec ?? "any",
    latestAvailable: latestVersions[index] ?? "unknown",
  }));

  const help = [...HELP];
  if (project.dependencies.length > listed.length) {
    help.unshift(
      `Showing ${listed.length} of ${project.dependencies.length} dependencies from ./${project.source}`,
    );
  }

  return {
    project: {
      source: project.source,
      dependencyCount: project.dependencies.length,
      dependencies,
    },
    help,
  };
}
