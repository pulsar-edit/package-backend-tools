# Package Backend Tools

A collection of CLI tools for managing and maintaining the Pulsar Package Registry.

Use this CLI to help ease and automate actions that need to be taken on the Pulsar Package Registry.

## Setup

After cloning the repository locally, install all needed dependencies:

```shell
npm install .
```

Then setup your secrets and configuration files.

Depending on the utilities you need, there are two configuration files:

### Database Configuration

Create the file `./data/db-conf.json`, with the matching structure:

```json
{
  "host": "<DB_URL>",
  "username": "<DB_USER>",
  "password": "<DB_PASS>",
  "database": "<DB_DB>",
  "port": 25061,
  "ssl_cert": "./data/ca-certificate.crt"
}
```

Then create `./data/ca-certificate.crt` with a certificate to access the production database.

### GitHub Configuration

Create the file `./data/gh-conf.json`, with the matching structure:

```json
{
  "token": "<YOUR_TOKEN_HERE>"
}
```

For most actions the token needs zero permissions, it just is needed to grant you higher API limits in GitHub requests.

## Usage

To run the CLI application use:

```shell
node .
```

Append `--help` at any time to view more information on the command you are running and it's effects.

### delete

```shell
node . delete <package-name>
```

Used to permanently delete a community package from the Registry.
If a package name and array path are specified, all supplied packages will be processed.
During each package deletion you must confirm package deletion manually by typing the exact string shown on the screen, to help avoid any accidents. It's highly recommended to take a moment and confirm the exact package that's being deleted when you do.

The commands effects:
* Deletes the packages data
* Deletes all versions of the package
* Deletes all user stars of the package.
* Leaves the package name to avoid supply chain vulnerabilities.

Options:
* `--only-missing-repo`: If this option is supplied then the package will only be deleted if when accessing the attached repository we get a `404`, meaning the package is uninstallable, and unfixable.
* `--array-path (-a) <path-to-file>`: Allows supplying a path to a JSON file containing an array of package names to delete.

### badge

```shell
node . badge <package-name>
```

Used to add a badge to a community package in the Registry.
This badge will appear on the package until it is next updated by the author.
Once started you will be walked through selecting all options for the badge, defaults are always provided and encouraged, but if needed they can be overridden.
