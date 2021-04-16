import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import path from 'path';
import { ModuleFormat, RollupOptions } from 'rollup';
import copy from 'rollup-plugin-copy';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import { packages } from './util';
import del from 'rollup-plugin-delete';

const { LERNA_PACKAGE_NAME, LERNA_ROOT_PATH } = process.env;
const PACKAGE_ROOT_PATH = process.cwd();
const INPUT_FILE = path.join(PACKAGE_ROOT_PATH, 'build', 'index.js');
// const INPUT_TEST_FILE = path.join(PACKAGE_ROOT_PATH, 'index.ts');
const OUTPUT_DIR = path.join(PACKAGE_ROOT_PATH, 'dist');
const PKG_JSON = require(path.join(PACKAGE_ROOT_PATH, 'package.json'));
// const UNNAMESPACED_PACKAGE_NAME = LERNA_PACKAGE_NAME.split('/').pop();

const ALL_MODULES = packages;

console.log('ALL_MODULES', ALL_MODULES);
console.log({ LERNA_PACKAGE_NAME });
console.log({ LERNA_ROOT_PATH });

const isTestUtil = LERNA_PACKAGE_NAME === '@rangy/test-util';

const LOCAL_GLOBALS = {
  '@rangy/core': 'rangy',
};

const LOCAL_EXTERNALS = [...Object.keys(LOCAL_GLOBALS)];

console.log({ LOCAL_GLOBALS, LOCAL_EXTERNALS });

// const input = isTestUtil ? INPUT_TEST_FILE : INPUT_FILE;
const input = INPUT_FILE;
const globals = LOCAL_GLOBALS;

console.log({ globals });

const buildVars = (() => {
  const date = new Date();
  const month = 'January,February,March,April,May,June,July,August,September,October,November,December'.split(
    ','
  )[date.getMonth()];
  return {
    '%%build:version%%': PKG_JSON.version,
    '%%build:date%%': date.getDate() + ' ' + month + ' ' + date.getFullYear(),
    '%%build:year%%,': date.getFullYear() + ',',
  };
})();

const outputFile = (f: string, isProduction: boolean) => {
  return isProduction ? f.replace(/\.js$/, '.min.js') : f;
};

const make = (
  isBrowserBundle: boolean,
  needsMinify: boolean
): RollupOptions => {
  const formats: ModuleFormat[] = isBrowserBundle ? ['umd'] : ['es', 'cjs'];

  const options = {
    plugins: [
      replace({
        exclude: 'node_modules/**',
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
      // TODO: replace log4javascript at build time
      // typescript({
      //   clean: true,
      //   useTsconfigDeclarationDir: true,
      //   // check: true,
      //   // tsconfigOverride: {
      //   //   compilerOptions: {
      //   //     rootDir: TYPESCRIPT_ROOT_DIR,
      //   //   },
      //   // },
      //   verbosity: 3,
      // }),

      // // Because `rootDir` needs to include _all_ packages in Rollup, we have to do a dance here to get the
      // // types in the correct place, and then remove the other referenced packages here
      // !isBrowserBundle &&
      //   copy({
      //     flatten: false,
      //     targets: [
      //       {
      //         src: `dist/${UNNAMESPACED_PACKAGE_NAME}/src/**/*.d(.ts|.ts.map)`,
      //         dest: 'dist/types',
      //         rename: (name: string, extension: string, fullPath: string) => {
      //           // HACK: we use `flatten: false`, but this means we need to manually drop the "package-name/src"
      //           // and the only way to do that is, well, this
      //           const base = fullPath.split('/').slice(3).join('/');
      //           const dots = Array(fullPath.split('/').length - 2)
      //             .fill('..')
      //             .join('/');
      //           return path.join(dots, base);
      //         },
      //         transform: (contents) => {
      //           // technically not correct, if the mappings matches the string, but in reality not an issue?
      //           return contents.toString().replace('../../../src', '../../src');
      //         },
      //       },
      //     ],
      //   }),

      // !isBrowserBundle &&
      //   del({
      //     hook: 'writeBundle',
      //     targets: distDependencyPaths,
      //   }),

      resolve(),
      needsMinify ? terser() : undefined,
    ],

    input,

    external: isBrowserBundle ? LOCAL_EXTERNALS : ALL_MODULES,

    output: formats.map((format) => ({
      file: outputFile(
        path.join(OUTPUT_DIR, `index.${format}.js`),
        needsMinify
      ),
      format,
      sourcemap: true,
      name: LERNA_PACKAGE_NAME,
      globals,
      amd: {
        id: LERNA_PACKAGE_NAME,
      },
    })),
  };

  return options;
};

const configs: RollupOptions[] = [
  make(true, false),
  make(true, true),
  make(false, false),
];

export default configs;
