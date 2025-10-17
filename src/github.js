const fs = require("node:fs");

module.exports =
class GitHub {
  constructor() {
    this.octokit;
  }

  async init() {
    console.log("Initializing GitHub connection...");
    const Octokit = await import("@octokit/rest").then(octo => octo.Octokit); // ESM export only

    const config = JSON.parse(fs.readFileSync("./data/gh-conf.json", { encoding: "utf-8" }));
    this.octokit = new Octokit({
      auth: config.token
    });
  }

  async getRepository(owner, repo) {
    try {
      const repository = await this.octokit.rest.repos.get({
        owner: owner,
        repo: repo
      });

      return {
        ok: true,
        results: repository
      };
    } catch(err) {
      return {
        ok: false,
        results: err
      };
    }
  }
}
