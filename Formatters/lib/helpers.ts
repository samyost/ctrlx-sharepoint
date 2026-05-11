/**
 * helpers.ts — Compilation, Validation & Encoding Utilities
 *
 * Vibe Coding SharePoint Views
 * https://github.com/pnp/vibe-coded-list-views
 *
 * Usage:
 *   import { compile, validate, wrapForEach, sanitizeForCSOM } from './helpers';
 *   compile(myJsonObj, 'Demo_ProjectCard');
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SPElement } from './types';

// ─── Dist Directory ───────────────────────────────────────────────────────────

export const DIST_DIR = path.resolve(__dirname, '..', 'dist');

export function getMinTs(): string {
  const d = new Date();
  return String(d.getMonth() + 1).padStart(2, '0') +
         String(d.getDate()).padStart(2, '0') +
         '-' +
         String(d.getHours()).padStart(2, '0') +
         String(d.getMinutes()).padStart(2, '0');
}


// ─── Private Helpers ──────────────────────────────────────────────────────────

function sortKeys(_key: string, value: any): any {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value)
      .sort()
      .reduce((sorted: any, k: string) => {
        sorted[k] = value[k];
        return sorted;
      }, {});
  }
  return value;
}

function printWarnings(warnings: string[]): void {
  if (warnings.length === 0) return;
  console.warn('\n⚠️  Validation warnings:');
  warnings.forEach(w => console.warn(`   • ${w}`));
  console.warn('');
}

function injectDebugMeta(obj: Record<string, any>, name: string): void {
  const srcPath = path.resolve(__dirname, '..', 'src', `${name}.ts`);
  if (fs.existsSync(srcPath)) {
    const stats = fs.statSync(srcPath);
    obj._debug = {
      compiledFrom: srcPath,
      compiledAt: new Date().toLocaleString(),
      lastModified: stats.mtime.toLocaleString(),
    };
  }
}

function writeJsonToDist(obj: Record<string, any>, name: string): string {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  let jsonString = JSON.stringify(obj, sortKeys, 2);
  jsonString = sanitizeForCSOM(jsonString);

  const outputPath = path.join(DIST_DIR, `${name}.json`);

  let hasChanged = true;
  if (fs.existsSync(outputPath)) {
    const existing = fs.readFileSync(outputPath, 'utf8');
    if (existing === jsonString) hasChanged = false;
  }

  if (hasChanged) {
    fs.writeFileSync(outputPath, jsonString, 'utf8');
    console.log(`✅ Compiled → ${outputPath}`);
    console.log(`   Size: ${(Buffer.byteLength(jsonString) / 1024).toFixed(1)} KB`);
  } else {
    console.log(`⚡ Unchanged → ${outputPath}`);
  }

  return outputPath;
}


// ─── Compile ──────────────────────────────────────────────────────────────────

/**
 * Stringifies a SP JSON element and writes it to /dist/{name}.json.
 * Creates the dist directory if it doesn't exist.
 * @see .agent/knowledge/deployment.md — CSOM deployment constraints
 */
export function compile(jsonObj: SPElement, name: string): string {
  if (!jsonObj || typeof jsonObj !== 'object') {
    throw new Error('compile: first argument must be a non-null object');
  }
  if (!name || typeof name !== 'string') {
    throw new Error('compile: second argument must be a non-empty string');
  }

  printWarnings(validate(jsonObj));
  injectDebugMeta(jsonObj as Record<string, any>, name);
  return writeJsonToDist(jsonObj as Record<string, any>, name);
}


// ─── Compile Tile Formatter ───────────────────────────────────────────────────

/**
 * Compiles a tile/gallery formatter (SPTileFormatter) to JSON.
 * Handles the different root shape (width, height, formatter) vs column/row formatters.
 * @see .agent/knowledge/deployment.md — CSOM deployment constraints
 */
export function compileTile(tileObj: Record<string, any>, name: string): string {
  if (!tileObj || typeof tileObj !== 'object') {
    throw new Error('compileTile: first argument must be a non-null object');
  }
  if (!name || typeof name !== 'string') {
    throw new Error('compileTile: second argument must be a non-empty string');
  }

  if (tileObj.formatter) {
    printWarnings(validate(tileObj.formatter as SPElement));
  }

  injectDebugMeta(tileObj, name);
  return writeJsonToDist(tileObj, name);
}


// ─── Validate ─────────────────────────────────────────────────────────────────

/**
 * Checks a JSON formatter object for common deployment traps.
 * Returns an array of warning strings (empty = clean).
 */
export function validate(jsonObj: SPElement): string[] {
  const warnings: string[] = [];
  const jsonStr = JSON.stringify(jsonObj);

  // 1. Unicode characters that get garbled by CSOM
  const unicodeChars = jsonStr.match(/[^\x00-\x7F]/g);
  if (unicodeChars) {
    const unique = [...new Set(unicodeChars)];
    warnings.push(`Found Unicode characters: ${unique.join(' ')} — these may be garbled by CSOM. Use ASCII equivalents.`);
  }

  // 2. _comment outside of style objects (recursive check)
  checkCommentPlacement(jsonObj, '', warnings);

  // 3. Missing rev label
  if (!jsonStr.includes('rev-') && !jsonStr.match(/"v\d+-/)) {
    warnings.push('No rev label found. Use components.revLabel() or "vXX-YYYYMMDD" for cache-busting verification.');
  }

  // 4. Unsupported CSS properties (silently stripped by SP renderer)
  checkStrippedProperties(jsonObj, '', warnings);

  return warnings;
}


// ─── Internal Validators ──────────────────────────────────────────────────────

function checkCommentPlacement(obj: unknown, currentPath: string, warnings: string[]): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => checkCommentPlacement(item, `${currentPath}[${i}]`, warnings));
    return;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key === '_comment' && !currentPath.endsWith('.style')) {
      warnings.push(`'_comment' found at ${currentPath}.${key} — only safe inside 'style' objects.`);
    }
    if (typeof record[key] === 'object') {
      checkCommentPlacement(record[key], `${currentPath}.${key}`, warnings);
    }
  }
}

/** CSS properties silently stripped by SharePoint's renderer */
const STRIPPED_PROPS = new Set([
  'gap', 'row-gap', 'align-self', 'align-content', 'justify-items',
  'justify-self', 'place-items', 'place-content', 'place-self', 'order',
  'pointer-events', 'aspect-ratio', 'inset',
  'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
  'grid-area', 'grid-column', 'grid-row',
  'transition', 'animation', 'filter', 'backdrop-filter',
  'mix-blend-mode', 'clip-path', 'mask', 'will-change',
]);

function checkStrippedProperties(obj: unknown, currentPath: string, warnings: string[]): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => checkStrippedProperties(item, `${currentPath}[${i}]`, warnings));
    return;
  }

  const record = obj as Record<string, unknown>;

  // Check style objects for stripped properties
  if (record.style && typeof record.style === 'object' && !Array.isArray(record.style)) {
    const style = record.style as Record<string, unknown>;
    for (const prop of Object.keys(style)) {
      if (STRIPPED_PROPS.has(prop)) {
        warnings.push(`Stripped CSS '${prop}' at ${currentPath}.style.${prop} — unsupported by SP renderer, use margin/class workaround.`);
      }
      // Custom CSS variables (except --inline-editor-*) are stripped
      if (prop.startsWith('--') && !prop.startsWith('--inline-editor-')) {
        warnings.push(`Custom CSS var '${prop}' at ${currentPath}.style — only --inline-editor-* vars are supported.`);
      }
    }
  }

  // Recurse into children and other nested objects
  for (const key of Object.keys(record)) {
    if (typeof record[key] === 'object') {
      checkStrippedProperties(record[key], `${currentPath}.${key}`, warnings);
    }
  }
}



/**
 * Generates a safe forEach expression that wraps the field reference in
 *
 * @example
 *   wrapForEach('entry', '[$MembersText]', '|')
 *   // → "entry in split(toString([$MembersText]),'|')"
 */
export function wrapForEach(iteratorName: string, fieldRef: string, delimiter: string = ','): string {
  return `${iteratorName} in split(toString(${fieldRef}),'${delimiter}')`;
}


/**
 * Generates a forEach expression that iterates a fixed number of times using padEnd.
 * Useful for building static grids or repeating elements without a backing array.
 *
 * @param iteratorName Name of the iterator variable (should start with underscore, e.g. '_i')
 * @param steps Number of iterations
 * @returns A string like "_i in split(padEnd('', 3, 'X,'), ',')"
 */
export function loopRange(iteratorName: string, steps: number): string {
  if (steps <= 0) return `${iteratorName} in split('',',')`;
  // Length needed: if steps=3, we want "X,X,X" which is length 5.
  // Formula: (steps * 2) - 1
  const targetLength = Math.max(0, (steps * 2) - 1);
  return `${iteratorName} in split(padEnd('',${targetLength},'X,'),',')`;
}


/**
 * Sanitizes characters for CSOM/PnP deployment.
 * We also replace the Unicode × (U+00D7) with ASCII `x` because CSOM
 * can corrupt non-ASCII characters during XML round-tripping.
 * @see .agent/knowledge/sp-expressions.md — Zero Whitespace Rule
 */
export function sanitizeForCSOM(str: string): string {
  let result = str
    // Replace × with ASCII x to avoid CSOM Unicode garbling
    .replace(/×/g, 'x');

  // ─── Expression Whitespace Scrubber ──────────────────────────────────────
  // Strips ALL spaces from SP expression strings ("=...") EXCEPT spaces
  // that are inside single-quoted string literals.
  // This prevents the most common SharePoint rendering failure.
  //
  // Approach: process line-by-line. For JSON lines like:
  //   "display": "=if(startsWith(...) && ...,'flex','none')"
  // we extract the expression between "= and the final " on the line,
  // then scrub spaces outside of single-quoted literals.

  const lines = result.split('\n');
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    // Match JSON values that start with "= (an SP expression)
    // Pattern: "key": "=EXPRESSION"  or just "=EXPRESSION"
    const exprStart = line.indexOf('"=');
    if (exprStart === -1) continue;

    // Find the closing quote — walk forward handling \" escapes
    let pos = exprStart + 2; // skip the opening "=
    while (pos < line.length) {
      if (line[pos] === '\\' && pos + 1 < line.length) {
        pos += 2; // skip escaped char
        continue;
      }
      if (line[pos] === '"') break; // found closing quote
      pos++;
    }
    if (pos >= line.length) continue; // no closing quote found

    const expr = line.substring(exprStart + 2, pos); // content between "= and "

    // Scrub spaces outside single-quoted literals
    let scrubbed = '';
    let inLiteral = false;
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (ch === "'") {
        inLiteral = !inLiteral;
        scrubbed += ch;
      } else if (ch === ' ' && !inLiteral) {
        // skip non-literal space
      } else {
        scrubbed += ch;
      }
    }

    if (scrubbed !== expr) {
      lines[li] = line.substring(0, exprStart) + '"=' + scrubbed + line.substring(pos);
    }
  }
  result = lines.join('\n');

  return result;
}
