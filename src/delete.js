const fs = require("fs");
const prompt = require("prompt-sync")();
const parsegh = require("parse-github-url");
const Database = require("./database.js");
const GitHub = require("./github.js");
const utils = require("./utils.js");

module.exports =
async function deleteCmd(packName, opts) {
  let packagesToDelete = [];

  if (utils.isLengthyString(packName)) {
    packagesToDelete.push(packName);
  }

  if (utils.isLengthyString(opts.arrayPath)) {
    const arr = JSON.parse(fs.readFileSync(opts.arrayPath, { encoding: "utf-8" }));
    if (Array.isArray(arr)) {
      for (let i = 0; i < arr.length; i++) {
        packagesToDelete.push(arr[i]);
      }
    } else {
      console.error(`The file at '${opts.arrayPath}' is not an array!`);
    }
  }

  if (packagesToDelete.length === 0) {
    console.error("No packages to delete have been supplied.");
    return;
  }

  // Now that we have collecting all the package names to delete, lets go ahead
  // and find their pointers.
  const confirmStart = prompt(`Are you sure you want to attempt to delete: '${packagesToDelete.join(", ")}'? [Y/N] `);

  if (!utils.isYesInput(confirmStart)) {
    console.error("Aborted package deletion due to user input.");
    return;
  }

  const db = new Database();
  db.init();
  const gh = new GitHub();
  gh.init();

  for (packName of packagesToDelete) {
    const pointer = await db.getPointer(packName);

    if (!pointer.ok) {
      console.error(`Failed to collect the pointer of '${packName}'; Skipping...`);
      continue;
    }

    const identifier = `${packName}::${pointer.results}`;
    console.log(`Operating on package: '${identifier}'`);

    let canDelete = false;
    if (opts.onlyMissingRepo) {
      // We must verify the package doesn't have a valid GitHub repository prior to deleting
      const pack = await db.getPackage(pointer.results);
      const parsedRepoUrl = parsegh(pack.results?.data?.repository?.url);
      const repo = await gh.getRepository(parsedRepoUrl.owner, parsedRepoUrl.name);

      if (repo.ok) {
        // We attempted to get data about the repository and we could. Meaning we found it
        // and the repository is not missing.
        console.log(`The GitHub Repository for '${identifier}' is not missing.`);
      } else {
        // We failed to get the repository, lets make sure it's because it's missing
        if (repo.results.status === 404) {
          console.log(`Got a 404 when attempting to contact the GitHub Repository for '${identifier}', it is indeed missing.`);
          canDelete = true;
        }
      }
    } else {
      // We can just delete the package
      canDelete = true;
    }

    if (!canDelete) {
      console.log(`The package '${identifier}' didn't meet the specified criteria for deletion. Skipping...`);
      continue;
    }

    console.log(`Package Link: 'https://packages.pulsar-edit.dev/packages/${packName}'`);
    const confirmDeletion = prompt(`Are you sure you want to permanently delete the community package '${identifier}'; this will delete the package, all versions, and all user stars.\nType 'yes-i-want-to-delete' to confirm. `);

    if (confirmDeletion !== "yes-i-want-to-delete") {
      console.error("Aborted package deletion due to user input.");
      continue;
    }

    const del = await db.deletePackage(pointer.results, packName);

    if (!del.ok) {
      console.error("Unable to delete package");
      console.error(del.results);
      continue;
    }

    console.log(`Deleted '${identifier}'`);
  }

  await db.exit();
  console.log("Handled all packages.");
  return;
}
