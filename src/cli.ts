import { runAxiCli } from "axi-sdk-js";
import { depsCommand } from "./commands/deps.js";
import { downloadsCommand } from "./commands/downloads.js";
import { searchCommand } from "./commands/search.js";
import { setupCommand } from "./commands/setup.js";
import { versionsCommand } from "./commands/versions.js";
import { viewCommand } from "./commands/view.js";
import { COMMAND_HELP, TOP_LEVEL_HELP } from "./help.js";
import { homeCommand } from "./home.js";
import { VERSION } from "./version.js";

export const DESCRIPTION =
  "Inspect PyPI packages — versions, summaries, dependencies, downloads — with token-efficient output";

export async function main(): Promise<void> {
  await runAxiCli({
    commands: {
      deps: depsCommand,
      downloads: downloadsCommand,
      search: searchCommand,
      setup: setupCommand,
      versions: versionsCommand,
      view: viewCommand,
    },
    description: DESCRIPTION,
    getCommandHelp: (command) => COMMAND_HELP[command] ?? null,
    home: (args) => homeCommand(args),
    topLevelHelp: TOP_LEVEL_HELP,
    version: VERSION,
  });
}
