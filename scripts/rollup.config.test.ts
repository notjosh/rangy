/**
 * This rollup config is used to generate test/*.test.iife.js from test/*.test.ts files
 * The iife file is then used to verify that rangy2 & rangy modules (ie, rangy-classapplier)
 * can be used by referencing directly in `script` tag in html files
 */
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import fs from "fs";
import * as glob from "glob";
import { join, resolve } from "path";
import { ModuleFormat, Plugin, RollupOptions } from "rollup";
import sourceMaps from "rollup-plugin-sourcemaps";
import { packages, packagesDir } from "./util";

const plugins: Plugin[] = [nodeResolve(), commonjs(), sourceMaps()];

//all rangy modules are external dependencies to test code
const external = packages.map((n) => "@rangy/" + n);

//map all external dependencies to global name 'rangy'
const globals = {};
external.forEach((n) => Object.assign(globals, { [n]: "rangy" }));

function config(
  cwd: string,
  f: string,
  format: ModuleFormat = "iife"
): RollupOptions {
  f = join(cwd, f);
  return {
    input: [f],
    output: {
      format,
      file: f.replace(/\.js$/, `.${format}.js`),
      name: "unnamed",
      globals,
      sourcemap: true,
    },
    external,
    plugins,
  };
}

function configsFor(module: string): RollupOptions[] {
  const cwd = resolve(packagesDir, module, "test");
  const tsconfig = resolve(cwd, "tsconfig.json");

  if (!fs.existsSync(tsconfig)) {
    return [];
  }

  const inputs = glob.sync("**/*.test.js", { cwd });
  const configs = inputs.map((f) => config(cwd, f));

  if (module == "classapplier") {
    // push amdTestExampleConfig
    configs.push(config(cwd, "index.test.js", "amd"));
  }
  return configs;
}

// handle special case for test-utils
// TODO: this should probably export qunit-ex separately, as testutils needs to be available earlier in some cases
const path = resolve(packagesDir, "test-util/lib");
const testUtilOptions: RollupOptions = {
  input: [`${join(path, "esm5", "index.js")}/esm5/index.js`],
  output: {
    file: `${path}/bundles/index.umd.js`,
    format: "umd",
    name: "rangy",
    sourcemap: true,
    extend: true,
    globals: { "@rangy/core": "rangy" },
  },
  inlineDynamicImports: true,
  external,
  plugins,
};

export default [...packages.flatMap(configsFor), testUtilOptions];
