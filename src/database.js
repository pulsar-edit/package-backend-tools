const fs = require("fs");
const postgres = require("postgres");

module.exports =
class Database {
  constructor() {
    this.sql;
  }

  init() {
    // Get config data
    console.log("Initializing database connection...");
    const config = JSON.parse(fs.readFileSync("./data/db-conf.json", { encoding: "utf-8" }));
    this.sql = postgres({
      host: config.host,
      username: config.username,
      password: config.password,
      database: config.database,
      port: config.port,
      ssl: {
        rejectUnauthorizaed: true,
        ca: fs.readFileSync(config.ssl_cert).toString()
      }
    });
  }

  async exit() {
    console.log("Disconnecting from Database...");
    if (this.sql !== undefined) {
      await this.sql.end();
    }
    return;
  }

  async getPointer(packName) {
    const command = await this.sql`
      SELECT pointer FROM names
      WHERE name = ${packName};
    `;

    if (command.count === 0) {
      console.error(`Failed to get package pointer for '${packName}'`);
      return {
        ok: false,
        results: null
      };
    }

    return {
      ok: true,
      results: command[0].pointer
    };
  }

  async getPackage(pointer) {
    const command = await this.sql`
      SELECT * from packages
      WHERE pointer = ${pointer}
    `;

    if (command.count === 0) {
      return { ok: false, results: null };
    }
    return { ok: true, results: command[0] };
  }

  async deletePackage(pointer, name) {
    return await this.sql
      .begin(async (trans) => {
        // Remove package versions
        const vers = await trans`
          DELETE FROM versions
          WHERE package = ${pointer}
          RETURNING semver;
        `;

        if (vers.count === 0) {
          throw `Failed to delete any versions for: ${name}`;
        }

        // Remove stars
        await trans`
          DELETE FROM stars
          WHERE package = ${pointer}
          RETURNING userid;
        `;
        // A package may not contain stars so we don't check the return

        // Delete the package
        const pack = await trans`
          DELETE FROM packages
          WHERE pointer = ${pointer}
          RETURNING name;
        `;

        if (pack.count === 0) {
          throw `Failed to delete package for: ${name}`;
        }

        if (pack[0].name !== name) {
          throw `Attempted to delete ${pack[0].name} rather than ${name}`;
        }

        return {
          ok: true,
          results: ""
        };
      })
      .catch((err) => {
        return { ok: false, results: err };
      });
  }
}
