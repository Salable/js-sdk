# @salable/js-sdk

## Packages Included

- [@salable/pricing-table](https://github.com/Salable/js-sdk/tree/main/packages/pricing-table)

## Development

### Initial Setup

To set up the JS SDK on your local machine for development, perform the following steps.

1. Clone the repo to your local machine
2. Run `npm i` at the root of the project

_Note: You don't need to run `npm i` per package. Because this project uses NPM workspaces, you only ever need to run it at root._

### Adding Packages

If you want to add a new package, perform the following steps.

1. Create a new folder inside the `packages` directory named as the name of the package. (e.g. pricing-table)
2. Inside the new package folder, create `package.json` and `README.md` files.
   - Use the template for `package.json` below, replacing information where required.
3. Create a `src` folder in the root of your new package folder and inside it put a `index.ts` or `index.js` file depending on if you're using TS or not.
   - From the `index.{js|ts}` file, export your package's files. This file is the entry point for Rollup to build from.
4. Update `./packages/index.ts` to include your new package index file to ensure it is included in the output build.
   - Export your new package from `./packages/index.ts` with a name based on your package name.
5. Update this `README.md` file to include your new package in the list of packages at the top fo this file.
6. To install/uninstall NPM packages to your new package, use the following commands and replace information where required. _NOTE: For your package name, use the directory name inside `./packages`_
   - **Install:** `npm install <NPM_PACKAGE_NAME> -w <YOUR_PACKAGE_NAME>`
   - **Uninstall:** `npm uninstall <NPM_PACKAGE_NAME> -w <YOUR_PACKAGE_NAME>`

#### `package.json` example

```json
{
  "name": "@salable/<YOUR_PACKAGE_NAME>",
  "version": "1.0.0",
  "description": "",
  "type": "module",
  "main": "src/index.{js|ts}",
  "scripts": {
    // Your scripts here
  },
  "author": "Salable",
  "license": "MIT"
}
```

#### Example

For an example package, see the `pricing-table` package/directory inside `./packages`.
