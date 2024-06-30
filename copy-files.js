import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { cruise } from 'dependency-cruiser';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'pokerogue/src');
const destDir = path.join(__dirname, 'src');
const configPath = path.join(__dirname, 'pokerogue/.dependency-cruiser.cjs');
const dependencyCruiserConfig = import(configPath);
const relevantDirs = ['data'];

const getAllFilesInDirs = (dirs) => {
  return dirs.flatMap(dir => glob.sync(`${sourceDir}/${dir}/**/*.ts`));
};

const getDependencies = async (file) => {
  const result = await cruise([file], {
    //...dependencyCruiserConfig,
    exclude: 'node_modules',
    progress: {
      "type": "cli-feedback"
    },
    tsConfig: {
      fileName: path.join(__dirname, 'pokerogue/tsconfig.json')
    }
  });
  return result.output.modules.map(mod => mod.source);
};

const copyFileWithDependencies = async (file) => {
  const dependencies = await getDependencies(file);
  const filesToCopy = new Set([file, ...dependencies]);

  for (const filePath of filesToCopy) {
    const relativePath = path.relative(sourceDir, filePath);
    const destPath = path.join(destDir, relativePath);
    await fs.copy(filePath, destPath);
    console.log(`Copied ${relativePath}`);
  }
};

const copyFiles = async () => {
  await fs.ensureDir(destDir);
  const files = getAllFilesInDirs(relevantDirs);

  for (const file of files) {
    await copyFileWithDependencies(file);
  }
  await fs.copy(path.join(__dirname, 'pokerogue/tsconfig.json'), path.join(__dirname, 'tsconfig.json'));
  console.log('\nAll files copied successfully!');
};

copyFiles().catch(console.error);