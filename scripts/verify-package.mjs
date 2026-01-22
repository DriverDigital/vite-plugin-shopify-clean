#!/usr/bin/env node

/**
 * Pre-publish verification script
 *
 * Verifies that the built package is correctly configured before publishing.
 * Run with: npm run verify-package
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { execSync } from 'child_process'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
process.chdir(rootDir)

const require = createRequire(path.join(rootDir, 'package.json'))
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

let failures = 0
let passes = 0

function pass(msg) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`)
  passes++
}

function fail(msg) {
  console.log(`  \x1b[31m✗\x1b[0m ${msg}`)
  failures++
}

function section(name) {
  console.log(`\n\x1b[1m${name}\x1b[0m`)
}

// ----------------------------------------------------------------------------
section('Build')
// ----------------------------------------------------------------------------

try {
  execSync('npm run build', { stdio: 'pipe' })
  pass('Build succeeds')
} catch (e) {
  fail('Build failed: ' + e.message)
  process.exit(1)
}

// ----------------------------------------------------------------------------
section('Package.json exports')
// ----------------------------------------------------------------------------

const checkPath = (p, desc) => {
  if (existsSync(p)) {
    pass(`${desc} exists: ${p}`)
  } else {
    fail(`${desc} missing: ${p}`)
  }
}

checkPath(pkg.main, 'main')
checkPath(pkg.module, 'module')
checkPath(pkg.types, 'types')

if (pkg.exports?.['.']) {
  const exp = pkg.exports['.']
  if (exp.types) checkPath(exp.types, 'exports.types')
  if (exp.require) checkPath(exp.require, 'exports.require')
  if (exp.import) checkPath(exp.import, 'exports.import')
}

// ----------------------------------------------------------------------------
section('CJS exports')
// ----------------------------------------------------------------------------

try {
  const cjs = require('./dist/index.cjs')

  if (typeof cjs.default === 'function') {
    pass('default export is a function')
  } else {
    fail('default export is not a function')
  }

  if (typeof cjs.getFilesInManifest === 'function') {
    pass('getFilesInManifest is exported')
  } else {
    fail('getFilesInManifest is not exported')
  }

  // Verify plugin instantiation
  const plugin = cjs.default()
  if (plugin.name === 'vite-plugin-shopify-clean') {
    pass('Plugin instantiates with correct name')
  } else {
    fail(`Plugin name mismatch: ${plugin.name}`)
  }
} catch (e) {
  fail('CJS import failed: ' + e.message)
}

// ----------------------------------------------------------------------------
section('ESM exports')
// ----------------------------------------------------------------------------

try {
  const esm = await import(path.join(rootDir, 'dist/index.js'))

  if (typeof esm.default === 'function') {
    pass('default export is a function')
  } else {
    fail('default export is not a function')
  }

  if (typeof esm.getFilesInManifest === 'function') {
    pass('getFilesInManifest is exported')
  } else {
    fail('getFilesInManifest is not exported')
  }

  // Verify plugin instantiation
  const plugin = esm.default()
  if (plugin.name === 'vite-plugin-shopify-clean') {
    pass('Plugin instantiates with correct name')
  } else {
    fail(`Plugin name mismatch: ${plugin.name}`)
  }

  // Verify getFilesInManifest works
  const files = esm.getFilesInManifest({
    'src/app.ts': { file: 'app.js', src: 'src/app.ts', isEntry: true, css: ['app.css'] }
  })
  if (files.includes('app.js') && files.includes('app.css')) {
    pass('getFilesInManifest extracts JS and CSS')
  } else {
    fail('getFilesInManifest not working correctly')
  }
} catch (e) {
  fail('ESM import failed: ' + e.message)
}

// ----------------------------------------------------------------------------
section('TypeScript types')
// ----------------------------------------------------------------------------

const testTypesFile = 'test-types-temp.ts'
const testTypesContent = `
import shopifyClean, { getFilesInManifest } from './dist/index.js';
import type { Manifest } from 'vite';

const plugin = shopifyClean({ themeRoot: './', manifestFileName: '.vite/manifest.json' });
const manifest: Manifest = { 'src/app.ts': { file: 'app.js', src: 'src/app.ts', isEntry: true } };
const files: string[] = getFilesInManifest(manifest);
const plugin2 = shopifyClean();
`

try {
  writeFileSync(testTypesFile, testTypesContent)
  execSync(`npx tsc --noEmit --strict --skipLibCheck ${testTypesFile}`, { stdio: 'pipe' })
  pass('TypeScript types compile correctly')
} catch (e) {
  fail('TypeScript types failed to compile')
} finally {
  if (existsSync(testTypesFile)) unlinkSync(testTypesFile)
}

// ----------------------------------------------------------------------------
section('Package contents (npm pack)')
// ----------------------------------------------------------------------------

try {
  const packOutput = execSync('npm pack --dry-run 2>&1', { encoding: 'utf-8' })

  const requiredFiles = ['dist/index.js', 'dist/index.cjs', 'dist/index.d.ts', 'package.json', 'README.md']
  const missingFiles = requiredFiles.filter(f => !packOutput.includes(f))

  if (missingFiles.length === 0) {
    pass('All required files included in package')
  } else {
    fail(`Missing files in package: ${missingFiles.join(', ')}`)
  }

  // Check for files that shouldn't be published
  const forbiddenPatterns = ['.env', 'node_modules', '.git']
  const foundForbidden = forbiddenPatterns.filter(p => packOutput.includes(p))

  if (foundForbidden.length === 0) {
    pass('No forbidden files in package')
  } else {
    fail(`Forbidden files found: ${foundForbidden.join(', ')}`)
  }
} catch (e) {
  fail('npm pack failed: ' + e.message)
}

// ----------------------------------------------------------------------------
section('Configuration consistency')
// ----------------------------------------------------------------------------

// Check engines.node matches build target
const nodeEngine = pkg.engines?.node
if (nodeEngine) {
  const minNode = parseInt(nodeEngine.match(/\d+/)?.[0] || '0')
  // tsup build script uses --target node18
  if (minNode === 18) {
    pass('engines.node (>=18) matches build target (node18)')
  } else {
    fail(`engines.node mismatch: ${nodeEngine} vs build target node18`)
  }
}

// Check type: module consistency
if (pkg.type === 'module') {
  if (pkg.module?.endsWith('.js') && pkg.main?.endsWith('.cjs')) {
    pass('ESM package with correct extensions (.js for ESM, .cjs for CJS)')
  } else {
    fail('Extension mismatch for "type": "module" package')
  }
}

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------

console.log('\n' + '─'.repeat(50))
if (failures === 0) {
  console.log(`\x1b[32m\x1b[1mAll ${passes} checks passed!\x1b[0m Package is ready to publish.`)
  process.exit(0)
} else {
  console.log(`\x1b[31m\x1b[1m${failures} check(s) failed, ${passes} passed.\x1b[0m`)
  console.log('Fix the issues above before publishing.')
  process.exit(1)
}
