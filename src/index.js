const { Command } = require("commander");
const packJson = require("../package.json");
const deleteCmd = require("./delete.js");
const badgeCmd = require("./badge.js");
const program = new Command();

program
  .name(packJson.name)
  .description(packJson.description)
  .version(packJson.version);

program.command("delete")
  .description("Delete a community package from the registry. Deletes the package, all versions, and all user stars.")
  .argument("<package-name>", "Name of the package to delete.")
  .option("-a, --array-path <path-to-file>", "Path to a JSON array of package names.")
  .option("-t, --track", "After all actions have been taken, report a summary output of all packages deleted.")
  .option("--only-missing-repo", "Only delete the package if it's GitHub repository has been deleted.")
  .action(deleteCmd);

program.command("badge")
  .description("Add a badge to a community package.")
  .argument("<package-name>", "Name of the package to add the badge to.")
  .action(badgeCmd);

program.parseAsync();
