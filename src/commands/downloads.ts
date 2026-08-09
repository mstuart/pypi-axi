import { AxiError } from "axi-sdk-js";
import { parseFlags } from "../args.js";
import { fetchDownloadsRecent } from "../pypi.js";

export async function downloadsCommand(args: string[]): Promise<Record<string, unknown>> {
  const { positionals } = parseFlags(args);
  const pkg = positionals[0];
  if (!pkg) {
    throw new AxiError("a package name is required", "VALIDATION_ERROR", [
      "pypi-axi downloads <pkg>",
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
      package: pkg,
      lastDay: recent.last_day,
      lastWeek: recent.last_week,
      lastMonth: recent.last_month,
    },
  };
}
