#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Copy content files from repo root to dist/content
 * This ensures content is available in production builds (Railway, Docker, etc)
 */

const sourceDir = path.join(__dirname, '../../content');
const destDir = path.join(__dirname, '../dist/content');

console.log(`[Build] Copying content from ${sourceDir} to ${destDir}`);

try {
  // Check if source exists
  if (!fs.existsSync(sourceDir)) {
    console.warn(`[Build] ⚠️  Content directory not found at ${sourceDir}, skipping`);
    process.exit(0);
  }

  // Ensure dest dir exists
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
  console.log(`[Build] ✅ Content copied successfully`);
} catch (error) {
  console.error(`[Build] ❌ Failed to copy content:`, error.message);
  process.exit(1);
}
