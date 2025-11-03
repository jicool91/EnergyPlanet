#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.resolve(scriptDir, '../src/styles/tokens.css');

const tokensCss = fs.readFileSync(TOKENS_PATH, 'utf8');
const indexCss = fs.readFileSync(path.resolve(scriptDir, '../src/index.css'), 'utf8');

function extractBlock(cssSource, regex) {
  const match = cssSource.match(regex);
  if (!match) {
    return new Map();
  }

  const entries = [];
  const tokenPattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let tokenMatch;
  while ((tokenMatch = tokenPattern.exec(match[1])) !== null) {
    const [, token, value] = tokenMatch;
    entries.push([token.trim(), value.trim()]);
  }
  return entries;
}

const darkTokens = new Map(extractBlock(tokensCss, /:root\s*{([\s\S]*?)}/));
const lightTokens = new Map(
  extractBlock(tokensCss, /:root\s*\[data-color-scheme=['"]light['"]]\s*{([\s\S]*?)}/)
);
const indexDarkTokens = new Map(extractBlock(indexCss, /:root\s*{([\s\S]*?)}/));
const indexLightTokens = new Map(
  extractBlock(
    indexCss,
    /@media\s*\(prefers-color-scheme:\s*light\)\s*{\s*:root\s*{([\s\S]*?)}/
  )
);

const COLOR_REGEX = /^#([0-9a-f]{3,8})$/i;
const RGBA_REGEX = /^rgba?\(([^)]+)\)$/i;

function isColorLiteral(value) {
  return COLOR_REGEX.test(value) || RGBA_REGEX.test(value);
}

function parseColorToRgb(color) {
  if (COLOR_REGEX.test(color)) {
    const hex = color.slice(1);
    const value = hex.length === 3
      ? hex.split('').map(ch => parseInt(ch.repeat(2), 16))
      : hex.length === 6
        ? [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
        : [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    return { r: value[0], g: value[1], b: value[2] };
  }

  const rgbaMatch = color.match(RGBA_REGEX);
  if (rgbaMatch) {
    const [r, g, b] = rgbaMatch[1]
      .split(',')
      .map(part => part.trim())
      .slice(0, 3)
      .map(Number);
    return { r, g, b };
  }

  throw new Error(`Unsupported color format: ${color}`);
}

function relativeLuminance({ r, g, b }) {
  const normalize = channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  const [sr, sg, sb] = [normalize(r), normalize(g), normalize(b)];
  return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
}

function contrastRatio(foreground, background) {
  const L1 = relativeLuminance(parseColorToRgb(foreground));
  const L2 = relativeLuminance(parseColorToRgb(background));
  const [bright, dark] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (bright + 0.05) / (dark + 0.05);
}

function resolveToken(token, theme, stack = []) {
  if (stack.includes(token)) {
    throw new Error(`Circular token reference detected: ${[...stack, token].join(' -> ')}`);
  }

  const themeMaps =
    theme === 'light'
      ? [lightTokens, indexLightTokens, darkTokens, indexDarkTokens]
      : [darkTokens, indexDarkTokens, lightTokens, indexLightTokens];

  const raw = themeMaps.reduce((value, map) => value ?? map.get(token), undefined);
  if (!raw) {
    throw new Error(`Token ${token} not found in ${theme} theme`);
  }

  const value = raw.replace(/!important/g, '').trim();
  if (isColorLiteral(value)) {
    return value;
  }

  const varMatch = value.match(/var\((--[\w-]+)(?:,\s*([^\)]+))?\)/);
  if (varMatch) {
    const [, refToken, fallbackValue] = varMatch;
    try {
      return resolveToken(refToken, theme, [...stack, token]);
    } catch (error) {
      if (fallbackValue && isColorLiteral(fallbackValue.trim())) {
        return fallbackValue.trim();
      }
      throw error;
    }
  }

  if (isColorLiteral(value)) {
    return value;
  }

  throw new Error(`Unable to resolve ${token} (${theme}) to a color literal. Value: ${value}`);
}

const checks = [
  { theme: 'dark', text: '--color-text-primary', bg: '--color-bg-primary', min: 4.5, label: 'Primary text on primary background (dark)' },
  { theme: 'dark', text: '--color-text-secondary-fallback', bg: '--color-bg-primary', min: 4.5, label: 'Secondary text on primary background (dark)' },
  { theme: 'dark', text: '--color-text-inverse', bg: '--color-accent-gold', min: 4.5, label: 'Inverse text on gold accent (dark)' },
  { theme: 'dark', text: '--color-text-primary', bg: '--color-surface-secondary', min: 4.5, label: 'Primary text on secondary surface (dark)' },
  { theme: 'light', text: '--color-text-primary', bg: '--color-bg-primary', min: 4.5, label: 'Primary text on primary background (light)' },
  { theme: 'light', text: '--color-text-secondary', bg: '--color-bg-primary', min: 4.5, label: 'Secondary text on primary background (light)' },
  { theme: 'light', text: '--color-text-inverse', bg: '--color-accent-gold', min: 4.5, label: 'Inverse text on gold accent (light)' },
  { theme: 'light', text: '--color-text-primary', bg: '--color-surface-secondary', min: 4.5, label: 'Primary text on secondary surface (light)' },
];

let failures = 0;

for (const check of checks) {
  try {
    const foreground = resolveToken(check.text, check.theme);
    const background = resolveToken(check.bg, check.theme);
    const ratio = contrastRatio(foreground, background);
    if (ratio < check.min) {
      console.error(`✗ ${check.label}: ${ratio.toFixed(2)} (min ${check.min})`);
      failures += 1;
    } else {
      console.log(`✓ ${check.label}: ${ratio.toFixed(2)}`);
    }
  } catch (error) {
    console.error(`! ${check.label}: ${error.message}`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`Contrast check failed for ${failures} combinations.`);
  process.exitCode = 1;
  process.exit(failures);
}

console.log('All contrast checks passed.');
