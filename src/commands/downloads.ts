import { AxiError } from "axi-sdk-js";
import { assertKnownFlags, parseFlags } from "../args.js";
import { fetchDownloadsRecent } from "../pypi.js";

const USAGE = "pypi-axi downloads <pkg>";

export async function downloadsCommand(args: string[]): Promise<Record<string, unknown>> {
  const { positionals, flags } = parseFlags(args);
  assertKnownFlags(flags, [], USAGE);
  const pkg = positionals[0];
  if (!pkg) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [USAGE]);
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
      package: pkg,
      lastDay: recent.last_day,
      lastWeek: recent.last_week,
      lastMonth: recent.last_month,
    },
    help: [`Run \`pypi-axi view ${pkg}\` for package details`],
  };
}
