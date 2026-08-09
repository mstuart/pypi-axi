import { AxiError } from "axi-sdk-js";
import { parseFlags } from "../args.js";
import { parseRequirement } from "../pep508.js";
import { fetchPackument, fetchVersion } from "../pypi.js";

export async function depsCommand(args: string[]): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  const pkg = positionals[0];
  if (!pkg) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [
      "pypi-axi deps <pkg> [--version X]",
    ]);
  }

  const version = typeof flags.version === "string" ? flags.version : undefined;
  const doc = version ? await fetchVersion(pkg, version) : await fetchPackument(pkg);
  const info = doc.info;
  const name = info.name ?? pkg;
  const requiresDist = info.requires_dist ?? [];

  if (requiresDist.length === 0) {
    return {
      package: name,
      version: info.version,
      deps: `0 dependencies for ${name} ${info.version ?? ""}`.trim(),
    };
  }

  const deps = requiresDist.map((entry) => {
    const parsed = parseRequirement(entry);
    const row: Record<string, unknown> = { dep: parsed.name };
    if (parsed.specifier) row.spec = parsed.specifier;
    if (parsed.marker) row.marker = parsed.marker;
    return row;
  });

  return {
    package: name,
    version: info.version,
    count: deps.length,
    deps,
  };
}
