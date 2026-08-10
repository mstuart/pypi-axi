import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags, parseLimit } from "../args.js";
import { isoDate } from "../format.js";
import { fetchPackument, type PypiFile } from "../pypi.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const USAGE = "pypi-axi versions <pkg> [--limit 20]";

function latestUpload(files: PypiFile[]): string | undefined {
  const dates = files
    .map((f) => f.upload_time_iso_8601)
    .filter((d): d is string => Boolean(d));
  return dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : undefined;
}

export async function versionsCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, ["limit"], USAGE);
  const [pkg] = positionals;
  if (!pkg) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [
      USAGE,
    ]);
  }

  const limit = parseLimit(flags.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const packument = await fetchPackument(pkg);

  const entries = Object.entries(packument.releases)
    .map(([version, files]) => ({
      upload: latestUpload(files),
      version,
      yanked: files.length > 0 && files.every((f) => f.yanked),
    }))
    .filter(
      (entry): entry is { version: string; upload: string; yanked: boolean } =>
        Boolean(entry.upload)
    )
    .sort((a, b) => b.upload.localeCompare(a.upload));

  const versions = entries.slice(0, limit).map((entry) => ({
    uploadDate: isoDate(entry.upload),
    version: entry.version,
    yanked: entry.yanked ? "yes" : "no",
  }));

  const out: Record<string, unknown> = {
    count: `${versions.length} of ${entries.length} total`,
    versions,
  };
  if (versions.length < entries.length) {
    out.help = [
      `Run \`pypi-axi versions ${pkg} --limit ${Math.min(limit * 2, MAX_LIMIT)}\` to see more`,
      `Run \`pypi-axi view ${pkg}\` for package details`,
    ];
  }
  return out;
}
