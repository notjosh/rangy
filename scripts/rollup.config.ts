import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
// import lernaGetPackages from 'lerna-get-packages';
import path from 'path';
import { ModuleFormat, RollupOptions } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import { packages } from './util';

const { LERNA_PACKAGE_NAME, LERNA_ROOT_PATH } = process.env;
const PACKAGE_ROOT_PATH = process.cwd();
const INPUT_FILE = path.join(PACKAGE_ROOT_PATH, 'src/index.ts');
const INPUT_TEST_FILE = path.join(PACKAGE_ROOT_PATH, 'index.ts');
const OUTPUT_DIR = path.join(PACKAGE_ROOT_PATH, 'dist');
const PKG_JSON = require(path.join(PACKAGE_ROOT_PATH, 'package.json'));
const IS_BROWSER_BUNDLE = !true; //!!PKG_JSON.browser;

const ALL_MODULES = packages;

console.log('ALL_MODULES', ALL_MODULES);
console.log({ LERNA_PACKAGE_NAME });
console.log({ LERNA_ROOT_PATH });
console.log({ IS_BROWSER_BUNDLE });

const isTestUtil = LERNA_PACKAGE_NAME === '@rangy/test-util';

const LOCAL_GLOBALS = {
  '@rangy/core': 'rangy',
};

const LOCAL_EXTERNALS = [...Object.keys(LOCAL_GLOBALS)];

console.log({ LOCAL_GLOBALS, LOCAL_EXTERNALS });

const input = isTestUtil ? INPUT_TEST_FILE : INPUT_FILE;
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
  isProduction: boolean
): RollupOptions[] => {
  const formats: ModuleFormat[] = isBrowserBundle ? ['umd'] : ['es', 'cjs'];

  return formats.map((format) => ({
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
      typescript({
        // TODO: write types.d.ts ?
        exclude: 'test/**/*.ts',
      }),
      isProduction ? terser() : undefined,
    ],

    input,

    external: IS_BROWSER_BUNDLE ? LOCAL_EXTERNALS : ALL_MODULES,

    output: {
      file: outputFile(
        path.join(OUTPUT_DIR, `index.${format}.js`),
        isProduction
      ),
      format,
      sourcemap: true,
      name: LERNA_PACKAGE_NAME,
      globals,
      amd: {
        id: LERNA_PACKAGE_NAME,
      },
    },
  }));
};

const configs: RollupOptions[] = [
  ...make(true, false),
  ...make(false, false),
  ...make(true, true),
  ...make(false, true),
];

export default configs;
