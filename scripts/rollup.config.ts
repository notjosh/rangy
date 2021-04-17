import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import strip from '@rollup/plugin-strip';
import path from 'path';
import { ModuleFormat, RollupOptions } from 'rollup';
import replace from 'rollup-plugin-re';
import { terser } from 'rollup-plugin-terser';
import { packages } from './util';

const { LERNA_PACKAGE_NAME, LERNA_ROOT_PATH } = process.env;
const PACKAGE_ROOT_PATH = process.cwd();
const INPUT_FILE = path.join(PACKAGE_ROOT_PATH, 'dist', 'build', 'index.js');
const OUTPUT_DIR = path.join(PACKAGE_ROOT_PATH, 'dist');
const PKG_JSON = require(path.join(PACKAGE_ROOT_PATH, 'package.json'));

const isTestUtil = LERNA_PACKAGE_NAME === '@rangy/test-util';

const ALL_MODULES = packages;

const LOCAL_GLOBALS = {
  '@rangy/core': 'rangy',
  ...(isTestUtil ? { qunit: 'qunit' } : {}),
};

const LOCAL_EXTERNALS = Object.keys(LOCAL_GLOBALS);

const input = INPUT_FILE;
const globals = LOCAL_GLOBALS;

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

const browserExternals = [...ALL_MODULES, ...(isTestUtil ? ['qunit'] : [])];

const make = (
  isBrowserBundle: boolean,
  needsMinify: boolean
): RollupOptions => {
  const formats: ModuleFormat[] = isBrowserBundle ? ['umd'] : ['es', 'cjs'];

  const options: RollupOptions = {
    plugins: [
      strip({
        functions: ['console.*', 'assert.*', 'log.*', 'log4javascript.*'],
      }),
      replace({
        exclude: 'node_modules/**',
        replaces: buildVars,
        defines: {
          IS_DEVELOPMENT: false,
        },
        patterns: [
          //remove logging
          {
            test: /(.*log4javascript.*)/g,
            replace: '',
          },
        ],
      }),
      resolve({
        browser: isBrowserBundle,
        preferBuiltins: false,
      }),
      commonjs(),
      needsMinify ? terser() : undefined,
    ],

    input,
    context: 'window',

    // only bundle tslib, core-js in umd file
    external: isBrowserBundle
      ? browserExternals
      : (id) => {
          return (
            [...LOCAL_EXTERNALS, 'tslib', 'core-js'].includes(id) ||
            id.startsWith('core-js/')
          );
        },

    inlineDynamicImports: true,

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
