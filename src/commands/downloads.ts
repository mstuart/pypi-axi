import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";
import { fetchDownloadsRecent } from "../pypi.js";

const USAGE = "pypi-axi downloads <pkg>";

export async function downloadsCommand(
  args: string[]
): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, [], USAGE);
  const [pkg] = positionals;
  if (!pkg) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [
      USAGE,
    ]);
  }

  const recent = await fetchDownloadsRecent(pkg);
  if (!recent) {
    return {
      downloads: {
        package: pkg,
        status: "no download data available yet",
      },
    };
  }

  return {
    downloads: {
      lastDay: recent.last_day,
      lastMonth: recent.last_month,
      lastWeek: recent.last_week,
      package: pkg,
    },
    help: [`Run \`pypi-axi view ${pkg}\` for package details`],
  };
}
