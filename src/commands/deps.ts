import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";
import { parseRequirement } from "../pep508.js";
import { fetchPackument, fetchVersion } from "../pypi.js";

const USAGE = "pypi-axi deps <pkg> [--version X]";

export async function depsCommand(args: string[]): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, ["version"], USAGE);
  const pkg = positionals[0];
  if (!pkg) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [USAGE]);
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
    help: [`Run \`pypi-axi view ${name}\` for package details`],
  };
}
