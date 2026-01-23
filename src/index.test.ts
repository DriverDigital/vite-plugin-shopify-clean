import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import { existsSync, promises as fs } from 'fs'
import { tmpdir } from 'os'
import type { Manifest, Rollup } from 'vite'

import shopifyClean, { getFilesInManifest } from './index'

// TODO: Add test for custom manifestFileName option
// TODO: Add test for missing assets directory warning in buildStart
// TODO: Add test for safeUnlink error handling (non-ENOENT errors should warn but not throw)

// Helper to create a mock plugin context
function createMockPluginContext(watchMode = false) {
  return {
    meta: { watchMode, rollupVersion: '4.0.0' },
  }
}

// Helper to create a mock output bundle with manifest
function createMockBundle(manifest: Manifest): Rollup.OutputBundle {
  return {
    '.vite/manifest.json': {
      type: 'asset',
      fileName: '.vite/manifest.json',
      name: 'manifest.json',
      names: ['manifest.json'],
      originalFileName: '',
      originalFileNames: [],
      needsCodeReference: false,
      source: JSON.stringify(manifest),
    } as Rollup.OutputAsset,
  }
}

describe('getFilesInManifest', () => {
  it('extracts JS, CSS, and asset files from manifest entries', () => {
    const manifest: Manifest = {
      'src/app.ts': {
        file: 'app-abc123.js',
        src: 'src/app.ts',
        isEntry: true,
        css: ['app-def456.css', 'vendor-ghi789.css'],
        assets: ['logo-jkl012.png', 'font-mno345.woff2'],
      },
      'src/product.ts': {
        file: 'product-pqr678.js',
        src: 'src/product.ts',
        isEntry: true,
      },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toContain('app-abc123.js')
    expect(files).toContain('app-def456.css')
    expect(files).toContain('vendor-ghi789.css')
    expect(files).toContain('logo-jkl012.png')
    expect(files).toContain('font-mno345.woff2')
    expect(files).toContain('product-pqr678.js')
    expect(files).toHaveLength(6)
  })

  it('excludes underscore-prefixed chunks unless imported', () => {
    const manifest: Manifest = {
      'src/app.ts': {
        file: 'app-abc123.js',
        src: 'src/app.ts',
        isEntry: true,
        imports: ['_shared.ts'],
      },
      '_shared.ts': {
        file: '_shared-def456.js',
        src: '_shared.ts',
        css: ['shared-styles.css'],
      },
      '_orphan.ts': {
        file: '_orphan-ghi789.js',
        src: '_orphan.ts',
        css: ['orphan-styles.css'],
      },
    }

    const files = getFilesInManifest(manifest)

    // Imported chunk and its CSS should be included
    expect(files).toContain('app-abc123.js')
    expect(files).toContain('_shared-def456.js')
    expect(files).toContain('shared-styles.css')
    // Orphaned chunk and its CSS should be excluded
    expect(files).not.toContain('_orphan-ghi789.js')
    expect(files).not.toContain('orphan-styles.css')
    expect(files).toHaveLength(3)
  })

  it('handles empty manifest', () => {
    expect(getFilesInManifest({})).toEqual([])
  })
})

describe('shopifyClean plugin', () => {
  let tempDir: string
  let assetsDir: string
  let manifestDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'shopify-clean-test-'))
    assetsDir = path.join(tempDir, 'assets')
    manifestDir = path.join(assetsDir, '.vite')
    await fs.mkdir(manifestDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('buildStart', () => {
    it('deletes files from existing manifest on first run', async () => {
      const manifest: Manifest = {
        'src/app.ts': {
          file: 'app-old123.js',
          src: 'src/app.ts',
          isEntry: true,
          css: ['app-old123.css'],
        },
      }
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(manifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old js')
      await fs.writeFile(path.join(assetsDir, 'app-old123.css'), 'old css')

      const plugin = shopifyClean({ themeRoot: tempDir })
      await (plugin.buildStart as Function).call(createMockPluginContext(false))

      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(false)
      expect(existsSync(path.join(assetsDir, 'app-old123.css'))).toBe(false)
    })

    it('skips deletion on subsequent runs in watch mode', async () => {
      const manifest: Manifest = {
        'src/app.ts': { file: 'app-old123.js', src: 'src/app.ts', isEntry: true },
      }
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(manifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old content')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(true)

      // First run deletes files
      await (plugin.buildStart as Function).call(ctx)
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(false)

      // Recreate file, second run should skip
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'recreated')
      await (plugin.buildStart as Function).call(ctx)
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(true)
    })

    it('warns when manifest does not exist', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const plugin = shopifyClean({ themeRoot: tempDir })
      await (plugin.buildStart as Function).call(createMockPluginContext(false))

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No .vite/manifest.json'))
      warnSpy.mockRestore()
    })
  })

  describe('writeBundle', () => {
    it('deletes files removed from manifest between builds', async () => {
      // Initial manifest with two entries
      const initialManifest: Manifest = {
        'src/app.ts': { file: 'app-old123.js', src: 'src/app.ts', isEntry: true },
        'src/utils.ts': { file: 'utils-old456.js', src: 'src/utils.ts', isEntry: true },
      }
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(initialManifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old app')
      await fs.writeFile(path.join(assetsDir, 'utils-old456.js'), 'old utils')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(false)

      // buildStart populates previousManifestFiles
      await (plugin.buildStart as Function).call(ctx)

      // New manifest removes utils.ts, changes app hash
      const newManifest: Manifest = {
        'src/app.ts': { file: 'app-new789.js', src: 'src/app.ts', isEntry: true },
      }
      await fs.writeFile(path.join(assetsDir, 'app-new789.js'), 'new app')

      await (plugin.writeBundle as Function).call(
        ctx,
        {} as Rollup.NormalizedOutputOptions,
        createMockBundle(newManifest),
      )

      // Old files deleted, new file remains
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(false)
      expect(existsSync(path.join(assetsDir, 'utils-old456.js'))).toBe(false)
      expect(existsSync(path.join(assetsDir, 'app-new789.js'))).toBe(true)
    })

    it('skips deletion on first writeBundle in watch mode', async () => {
      const manifest: Manifest = {
        'src/app.ts': { file: 'app-old123.js', src: 'src/app.ts', isEntry: true },
      }
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(manifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old app')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(true)

      await (plugin.buildStart as Function).call(ctx)
      // Recreate file that buildStart deleted
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'recreated')

      const newManifest: Manifest = {
        'src/app.ts': { file: 'app-new789.js', src: 'src/app.ts', isEntry: true },
      }

      // First writeBundle in watch mode skips deletion
      await (plugin.writeBundle as Function).call(
        ctx,
        {} as Rollup.NormalizedOutputOptions,
        createMockBundle(newManifest),
      )
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(true)
    })
  })
})
