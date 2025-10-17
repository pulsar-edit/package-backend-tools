const prompt = require("prompt-sync")();
const utils = require("./utils.js");
const Database = require("./database.js");

const DEFAULTS = {
  types: {
    "Deprecated": "warn",
    "Broken": "warn",
    "Archived": "info",
    "Outdated": "warn"
  },
  texts: {
    "Deprecated": "Installation of fork recommended",
    "Broken": "Known to be non-functional",
    "Archived": "Source Code has been archived",
    "Outdated": "GitHub Installation recommended"
  }
};

module.exports =
async function badgeCmd(packName, opts) {
  if (!utils.isLengthyString(packName)) {
    console.error("No package was supplied to badge. Aborting...");
    return;
  }

  const badge = {};

  const badgeTitle = prompt(
`Please select the title of badge to apply:
  [1]: Deprecated - When there's a more functional fork that should be installed.
  [2]: Broken - When the package doesn't work at all.
  [3]: Archived - When the attached GitHub Repository is archived.
  [4]: Outdated - When the version on the registry is outdated compared to it's source.
`
  );

  switch(badgeTitle) {
    case "1":
      badge.title = "Deprecated";
      break;
    case "2":
      badge.title = "Broken";
      break;
    case "3":
      badge.title = "Archived";
      break;
    case "4":
      badge.title = "Outdated";
      break;
    default:
      console.error(`Invalid badge title selected '${badgeTitle}'. Aborting...`);
  }

  if (!utils.isLengthyString(badge.title)) {
    return;
  }

  const overrideType = prompt(`Would you like to override the default badge type for '${badge.title}'? The default is: '${DEFAULTS.types[badge.title]}'. [Y/N]`);

  if (utils.isYesInput(overrideType)) {
    const whatType = prompt(
`Select the type of this badge:
  [1]: warn - When a user should be quickly aware of an issue.
  [2]: info - When something is good to know, but not urgent.
  [3]: success - When something is good news to the user.
`
    );

    switch(whatType) {
      case "1":
        badge.type = "warn";
        break;
      case "2":
        badge.type = "info";
        break;
      case "3":
        badge.type = "success";
        break;
      default:
        console.error(`Invalid badge type selected '${whatType}'. Aborting...`);
    }
  } else {
    badge.type = DEFAULTS.types[badge.title];
  }

  if (!utils.isLengthyString(badge.title)) {
    return;
  }

  const overrideText = prompt(`Would you like to override the default badge text for '${badge.title}'? The default is: '${DEFAULTS.texts[badge.title]}'. [Y/N]`);

  if (utils.isYesInput(overrideText)) {
    const whatText = prompt("Please enter the text you'd like to appear on the badge: ");
    badge.text = whatText;
  } else {
    badge.text = DEFAULTS.texts[badge.title];
  }

  const adminActionsHeader = prompt("Please enter the exact Admin Actions Header used to document this action. (Example: '2025 - October 12'): ");

  badge.link = `https://github.com/pulsar-edit/package-backend/blob/main/docs/reference/Admin_Actions.md#${adminActionsHeader.toLowerCase().replace(/\s/g, "-")}`;

  const altPack = prompt("If you would like to propose an alternate package for installation, type the package's name here, otherwise hit enter: ");

  if (utils.isLengthyString(altPack)) {
    badge.alt = altPack;
  }

  console.log(badge);
  const confirmBadge = prompt(`Are you sure you want to add this badge to the package '${packName}'? [Y/N] `);

  if (!utils.isYesInput(confirmBadge)) {
    console.log("Aborting badge addition due to user input.");
    return;
  }

  const db = new Database();
  db.init();

  const pointer = await db.getPointer(packName);
  if (!pointer.ok) {
    console.error("Failed to get the package pointer!");
    console.error(pointer);
    await db.exit();
    return;
  }

  const pack = await db.getPackage(pointer.results);
  if (!pack.ok) {
    console.error("Failed to get the package data!");
    console.error(pack);
    await db.exit();
    return;
  }

  if (!Array.isArray(pack.results.data.badges)) {
    pack.results.data.badges = [];
  }

  pack.results.data.badges.push(badge);

  // While normally we should have all SQL commands in the DB class, this is really a one-off
  // script, so we will leave it here
  try {
    const updatePack = await db.sql`
      UPDATE packages
      SET data = ${pack.results.data}
      WHERE pointer = ${pointer.results}
      RETURNING name;
    `;

    if (updatePack.count === 0) {
      console.error("Failed to update package data!");
      console.error(updatePack);
    } else {
      console.log(`Successfully added the specified badge to '${packName}'`);
    }
    await db.exit();

  } catch(err) {
    console.error("Errored out attempting to update package data!");
    console.error(err);
    await db.exit();
  }
}
