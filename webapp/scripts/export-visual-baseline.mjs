#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const visualTestsDir = path.join(projectRoot, 'tests', 'visual');
const docsBaselineDir = path.join(projectRoot, '..', 'docs', 'qa', 'baseline', '2025-11-06');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copySnapshots() {
  ensureDir(docsBaselineDir);

  const entries = fs.readdirSync(visualTestsDir, { withFileTypes: true });
  const snapshotDirs = entries
    .filter(entry => entry.isDirectory() && entry.name.endsWith('.spec.ts-snapshots'))
    .map(entry => entry.name);

  if (snapshotDirs.length === 0) {
    console.warn('[baseline] No snapshot directories found under tests/visual.');
    return;
  }

  for (const dirName of snapshotDirs) {
    const sourceDir = path.join(visualTestsDir, dirName);
    const targetDir = path.join(docsBaselineDir, dirName);

    fs.rmSync(targetDir, { recursive: true, force: true });
    ensureDir(targetDir);

    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      const sourceFile = path.join(sourceDir, file);
      const targetFile = path.join(targetDir, file);
      fs.copyFileSync(sourceFile, targetFile);
    }
  }

  console.log(
    `[baseline] Exported ${snapshotDirs.length} snapshot folders to ${path.relative(
      projectRoot,
      docsBaselineDir
    )}`
  );
}

copySnapshots();
