import glob from 'glob';
import util from 'util';
import { projectRoot } from './util';
import fs from 'fs';
import deleteEmpty from 'delete-empty';

const g = util.promisify(glob);
const unlink = util.promisify(fs.unlink);

async function main() {
  const files = await g('packages/*/dist/**', {
    cwd: projectRoot,
    nodir: true,
    ignore: 'packages/*/dist/types/types.d.ts',
  });
  await Promise.all(files.map((f) => unlink(f)));
  const files2 = await g('packages/*/tsconfig.tsbuildinfo');
  await Promise.all(files2.map((f) => unlink(f)));
  const files3 = await g('packages/*/.rollup.cache/**', { nodir: true });
  await Promise.all(files3.map((f) => unlink(f)));

  const dirs = await g('packages/*/dist/**/');
  await Promise.all(dirs.map((d) => deleteEmpty(d)));
  const dirs2 = await g('packages/*/dist/');
  await Promise.all(dirs2.map((d) => deleteEmpty(d)));
  const dirs3 = await g('packages/*/.rollup.cache/');
  await Promise.all(dirs3.map((d) => deleteEmpty(d)));
}

main();
