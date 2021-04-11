import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { resolve } from "path";
import { Plugin, RollupOptions } from "rollup";
import sourceMaps from "rollup-plugin-sourcemaps";
import { terser } from "rollup-plugin-terser";
import * as lerna from "../lerna.json";
import { packages, packagesDir } from "./util";

const buildVars = (() => {
  const date = new Date();
  const month = "January,February,March,April,May,June,July,August,September,October,November,December".split(
    ","
  )[date.getMonth()];
  return {
    "%%build:version%%": lerna.version,
    "%%build:date%%": date.getDate() + " " + month + " " + date.getFullYear(),
    "%%build:year%%,": date.getFullYear() + ",",
  };
})();

const plugins: Plugin[] = [
  replace({
    exclude: "node_modules/**",
    values: buildVars,
    preventAssignment: true,
    // TODO: strip log4javascript (lost this when upgrading @rollup/plugin-replace)
    // patterns: [
    //   //remove logging
    //   {
    //     test: /(.*log4javascript.*)|(\s*(\/\/\s*)?log\.(trace|debug|info|warn|error|fatal|time|timeEnd|group|groupEnd).+)/g,

    //     replace: "",
    //   },
    // ],
  }),
  nodeResolve(),
  commonjs(),
  // Resolve source maps to the original source
  sourceMaps(),
  terser(),
];

function concatIf<T>(test: boolean, a: T[], b: () => T[]) {
  return test ? a.concat(b()) : a;
}

function outputFile(f: string, isProd: boolean) {
  return isProd ? f.replace(/\.js$/, ".min.js") : f;
}

function configsFor(module: string, isProd: boolean): RollupOptions[] {
  // const tsconfig = await import(`${srcDir}/${name}/tsconfig.json`);
  // const outDir = tsconfig.compilerOptions.outDir;
  const d = resolve(packagesDir, module, "lib");
  const isRangyModule = module !== "core";
  // Indicate here external modules you don't wanna include in your bundle
  const external = isRangyModule ? ["@rangy/core"] : [];
  return [
    {
      input: [`${d}/esm5/index.js`],
      output: {
        file: outputFile(`${d}/bundles/index.umd.js`, isProd),
        format: "umd",
        name: "rangy",
        sourcemap: true,
        extend: isRangyModule,
        globals: { "@rangy/core": "rangy" },
      },
      inlineDynamicImports: true,
      external,
      plugins: concatIf(isProd, plugins, () => [terser()]),
    },
    {
      input: [`${d}/esm2015/index.js`],
      output: {
        file: outputFile(`${d}/bundles/index.esm.js`, isProd),
        format: "es",
        sourcemap: true,
      },
      inlineDynamicImports: true,
      // only bundle tslib, core-js in umd file
      external: (id) =>
        [...external, "tslib", "core-js"].includes(id) ||
        id.startsWith("core-js/"),
      plugins: concatIf(isProd, plugins, () => [terser()]),
    },
  ];
}

const configs = packages.flatMap((m) => [
  ...configsFor(m, false),
  ...configsFor(m, true),
]);

export default configs;
