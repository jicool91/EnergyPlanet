#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Copy content files from repo root to dist/content
 * Runs during postinstall (after npm ci/install)
 *
 * Directory structure:
 * /app/
 *   ├── content/            <- Source (game content)
 *   ├── backend/            <- Current directory during npm install
 *   │   ├── package.json
 *   │   ├── src/
 *   │   └── dist/          <- Destination for content
 *   └── webapp/
 */

const sourceDir = path.join(__dirname, '../../content');
const destDir = path.join(__dirname, '../dist/content');

console.log(`[postinstall] Copying game content from ${sourceDir}`);

try {
  // Check if source exists
  if (!fs.existsSync(sourceDir)) {
    console.warn(`[postinstall] ⚠️  Content directory not found at ${sourceDir}`);
    console.warn(`[postinstall] Current working directory: ${process.cwd()}`);
    console.log(`[postinstall] This is OK for development - content will load from repo root`);
    process.exit(0);
  }

  // Ensure dest dir exists (dist/ might not exist yet)
  const distDir = path.dirname(destDir);
  if (!fs.existsSync(distDir)) {
    console.log(`[postinstall] Creating dist directory...`);
    fs.mkdirSync(distDir, { recursive: true });
  }

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copy recursively
  function copyDirRecursive(src, dest) {
    const files = fs.readdirSync(src);

    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  }

  copyDirRecursive(sourceDir, destDir);
  console.log(`[postinstall] ✅ Content copied successfully to ${destDir}`);
} catch (error) {
  console.error(`[postinstall] ❌ Error:`, error.message);
  console.error(error.stack);
  // Don't fail - content might not be available at build time but will be at runtime
  process.exit(0);
}
