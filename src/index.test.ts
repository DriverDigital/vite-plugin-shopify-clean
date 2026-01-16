import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import path from 'path'
import { existsSync, promises as fs } from 'fs'
import { tmpdir } from 'os'
import type { Manifest, OutputBundle, OutputAsset, PluginContext, NormalizedOutputOptions } from 'vite'

import shopifyClean, { getFilesInManifest } from './index'
import { resolveOptions } from './options'

// Helper to create a mock plugin context
function createMockPluginContext(watchMode = false): PluginContext {
  return {
    meta: { watchMode, rollupVersion: '4.0.0' },
  } as unknown as PluginContext
}

describe('resolveOptions', () => {
  it('returns defaults when no options provided', () => {
    const result = resolveOptions({})

    expect(result.manifestFileName).toBe('.vite/manifest.json')
    expect(result.themeRoot).toBe('./')
  })

  it('uses provided manifestFileName', () => {
    const result = resolveOptions({ manifestFileName: 'custom/manifest.json' })

    expect(result.manifestFileName).toBe('custom/manifest.json')
    expect(result.themeRoot).toBe('./')
  })

  it('uses provided themeRoot and normalizes it', () => {
    const result = resolveOptions({ themeRoot: 'themes/dawn/' })

    expect(result.manifestFileName).toBe('.vite/manifest.json')
    expect(result.themeRoot).toBe(path.normalize('themes/dawn/'))
  })

  it('uses both options when provided', () => {
    const result = resolveOptions({
      manifestFileName: '.vite/custom.json',
      themeRoot: 'my-theme',
    })

    expect(result.manifestFileName).toBe('.vite/custom.json')
    expect(result.themeRoot).toBe(path.normalize('my-theme'))
  })
})

describe('getFilesInManifest', () => {
  it('extracts files from a simple manifest', () => {
    const manifest: Manifest = {
      'src/app.ts': { file: 'app-abc123.js', src: 'src/app.ts', isEntry: true },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toEqual(['app-abc123.js'])
  })

  it('extracts multiple files from manifest', () => {
    const manifest: Manifest = {
      'src/app.ts': { file: 'app-abc123.js', src: 'src/app.ts', isEntry: true },
      'src/styles.css': { file: 'styles-def456.css', src: 'src/styles.css', isEntry: true },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toContain('app-abc123.js')
    expect(files).toContain('styles-def456.css')
    expect(files).toHaveLength(2)
  })

  it('includes underscore-prefixed files that are imported', () => {
    const manifest: Manifest = {
      'src/app.ts': {
        file: 'app-abc123.js',
        src: 'src/app.ts',
        isEntry: true,
        imports: ['_shared.ts'],
      },
      '_shared.ts': { file: '_shared-xyz789.js', src: '_shared.ts' },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toContain('app-abc123.js')
    expect(files).toContain('_shared-xyz789.js')
    expect(files).toHaveLength(2)
  })

  it('excludes underscore-prefixed files that are NOT imported', () => {
    const manifest: Manifest = {
      'src/app.ts': { file: 'app-abc123.js', src: 'src/app.ts', isEntry: true },
      '_orphan.ts': { file: '_orphan-xyz789.js', src: '_orphan.ts' },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toContain('app-abc123.js')
    expect(files).not.toContain('_orphan-xyz789.js')
    expect(files).toHaveLength(1)
  })

  it('handles manifest with nested imports array', () => {
    const manifest: Manifest = {
      'src/main.ts': {
        file: 'main-111.js',
        src: 'src/main.ts',
        isEntry: true,
        imports: ['_vendor.ts', '_utils.ts'],
      },
      '_vendor.ts': { file: '_vendor-222.js', src: '_vendor.ts' },
      '_utils.ts': { file: '_utils-333.js', src: '_utils.ts' },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toHaveLength(3)
    expect(files).toContain('main-111.js')
    expect(files).toContain('_vendor-222.js')
    expect(files).toContain('_utils-333.js')
  })

  it('handles empty manifest', () => {
    const manifest: Manifest = {}

    const files = getFilesInManifest(manifest)

    expect(files).toEqual([])
  })

  it('handles files in subdirectories', () => {
    const manifest: Manifest = {
      'src/app.ts': { file: 'assets/app-abc123.js', src: 'src/app.ts', isEntry: true },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toEqual(['assets/app-abc123.js'])
  })

  describe('CSS extraction (Issue #14)', () => {
    it.each([
      {
        scenario: 'single CSS file from single entry',
        manifest: {
          'src/entries/main.js': {
            file: 'main-BsuslCtz.js',
            name: 'main',
            src: 'src/entries/main.js',
            isEntry: true,
            css: ['main-B-h0qzzI.css'],
          },
        } as Manifest,
        expectedFiles: ['main-BsuslCtz.js', 'main-B-h0qzzI.css'],
      },
      {
        scenario: 'multiple CSS files from single entry',
        manifest: {
          'src/app.ts': {
            file: 'app-abc123.js',
            src: 'src/app.ts',
            isEntry: true,
            css: ['app-def456.css', 'vendor-ghi789.css'],
          },
        } as Manifest,
        expectedFiles: ['app-abc123.js', 'app-def456.css', 'vendor-ghi789.css'],
      },
      {
        scenario: 'CSS files from multiple entries',
        manifest: {
          'src/entries/main.js': {
            file: 'main-BsuslCtz.js',
            src: 'src/entries/main.js',
            isEntry: true,
            css: ['main-B-h0qzzI.css'],
          },
          'src/entries/two.js': {
            file: 'two-BKsaVOyl.js',
            src: 'src/entries/two.js',
            isEntry: true,
            css: ['two-ClAXSmEv.css'],
          },
        } as Manifest,
        expectedFiles: ['main-BsuslCtz.js', 'main-B-h0qzzI.css', 'two-BKsaVOyl.js', 'two-ClAXSmEv.css'],
      },
      {
        scenario: 'empty css array',
        manifest: {
          'src/app.ts': {
            file: 'app-abc123.js',
            src: 'src/app.ts',
            isEntry: true,
            css: [],
          },
        } as Manifest,
        expectedFiles: ['app-abc123.js'],
      },
    ])('extracts $scenario', ({ manifest, expectedFiles }) => {
      const files = getFilesInManifest(manifest)

      expect(files).toHaveLength(expectedFiles.length)
      expectedFiles.forEach(f => expect(files).toContain(f))
    })
  })

  it('excludes CSS from underscore-prefixed files that are not imported', () => {
    const manifest: Manifest = {
      'src/app.ts': { file: 'app-abc123.js', src: 'src/app.ts', isEntry: true },
      '_orphan.ts': {
        file: '_orphan-xyz789.js',
        src: '_orphan.ts',
        css: ['orphan-styles.css'],
      },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toContain('app-abc123.js')
    expect(files).not.toContain('_orphan-xyz789.js')
    expect(files).not.toContain('orphan-styles.css')
    expect(files).toHaveLength(1)
  })

  it('includes CSS from underscore-prefixed files that ARE imported', () => {
    const manifest: Manifest = {
      'src/app.ts': {
        file: 'app-abc123.js',
        src: 'src/app.ts',
        isEntry: true,
        imports: ['_shared.ts'],
      },
      '_shared.ts': {
        file: '_shared-xyz789.js',
        src: '_shared.ts',
        css: ['shared-styles.css'],
      },
    }

    const files = getFilesInManifest(manifest)

    expect(files).toContain('app-abc123.js')
    expect(files).toContain('_shared-xyz789.js')
    expect(files).toContain('shared-styles.css')
    expect(files).toHaveLength(3)
  })
})

describe('shopifyClean plugin hooks', () => {
  let tempDir: string
  let assetsDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'shopify-clean-test-'))
    assetsDir = path.join(tempDir, 'assets')
    await fs.mkdir(assetsDir, { recursive: true })
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  describe('buildStart', () => {
    it('deletes files listed in existing manifest on first run', async () => {
      const manifest: Manifest = {
        'src/app.ts': { file: 'app-old123.js', src: 'src/app.ts', isEntry: true },
      }
      const manifestDir = path.join(assetsDir, '.vite')
      await fs.mkdir(manifestDir, { recursive: true })
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(manifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old content')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(false)
      await (plugin.buildStart as Function).call(ctx)

      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(false)
    })

    it.each([
      { scenario: 'assets folder does not exist', removeAssets: true, expectedWarning: 'No assets folder' },
      { scenario: 'manifest file does not exist', removeAssets: false, expectedWarning: 'No .vite/manifest.json' },
    ])('warns when $scenario', async ({ removeAssets, expectedWarning }) => {
      if (removeAssets) {
        await fs.rm(assetsDir, { recursive: true, force: true })
      }
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(false)
      await (plugin.buildStart as Function).call(ctx)

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(expectedWarning))
      warnSpy.mockRestore()
    })

    it('skips deletion on subsequent runs in watch mode', async () => {
      const manifest: Manifest = {
        'src/app.ts': { file: 'app-old123.js', src: 'src/app.ts', isEntry: true },
      }
      const manifestDir = path.join(assetsDir, '.vite')
      await fs.mkdir(manifestDir, { recursive: true })
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(manifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old content')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(true)

      // First run deletes files
      await (plugin.buildStart as Function).call(ctx)
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(false)

      // Recreate file for second run test
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'recreated content')

      // Second run should skip deletion
      await (plugin.buildStart as Function).call(ctx)
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(true)
    })

    it('handles files that no longer exist gracefully', async () => {
      const manifest: Manifest = {
        'src/app.ts': { file: 'already-deleted.js', src: 'src/app.ts', isEntry: true },
      }
      const manifestDir = path.join(assetsDir, '.vite')
      await fs.mkdir(manifestDir, { recursive: true })
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(manifest))
      // Note: we don't create the file, simulating it was already deleted

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(false)

      // Should not throw
      await expect((plugin.buildStart as Function).call(ctx)).resolves.not.toThrow()
    })
  })

  describe('writeBundle', () => {
    it('deletes files removed from manifest between builds', async () => {
      // Setup: create initial manifest and files
      const initialManifest: Manifest = {
        'src/app.ts': { file: 'app-old123.js', src: 'src/app.ts', isEntry: true },
        'src/utils.ts': { file: 'utils-old456.js', src: 'src/utils.ts', isEntry: true },
      }
      const manifestDir = path.join(assetsDir, '.vite')
      await fs.mkdir(manifestDir, { recursive: true })
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(initialManifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old app')
      await fs.writeFile(path.join(assetsDir, 'utils-old456.js'), 'old utils')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(false)

      // Run buildStart to populate previousManifestFiles
      await (plugin.buildStart as Function).call(ctx)

      // New manifest removes utils.ts
      const newManifest: Manifest = {
        'src/app.ts': { file: 'app-new789.js', src: 'src/app.ts', isEntry: true },
      }
      await fs.writeFile(path.join(assetsDir, 'app-new789.js'), 'new app')

      const bundle: OutputBundle = {
        '.vite/manifest.json': {
          type: 'asset',
          fileName: '.vite/manifest.json',
          name: 'manifest.json',
          names: ['manifest.json'],
          originalFileNames: [],
          needsCodeReference: false,
          source: JSON.stringify(newManifest),
        } as OutputAsset,
      }

      await (plugin.writeBundle as Function).call(ctx, {} as NormalizedOutputOptions, bundle)

      // Old files should be deleted (they were in previous manifest but not current)
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(false)
      expect(existsSync(path.join(assetsDir, 'utils-old456.js'))).toBe(false)
      // New file should still exist
      expect(existsSync(path.join(assetsDir, 'app-new789.js'))).toBe(true)
    })

    it('skips deletion on first run in watch mode', async () => {
      const initialManifest: Manifest = {
        'src/app.ts': { file: 'app-old123.js', src: 'src/app.ts', isEntry: true },
      }
      const manifestDir = path.join(assetsDir, '.vite')
      await fs.mkdir(manifestDir, { recursive: true })
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(initialManifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old app')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(true)

      // Run buildStart first
      await (plugin.buildStart as Function).call(ctx)

      // Recreate file that buildStart deleted
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'recreated')

      const newManifest: Manifest = {
        'src/app.ts': { file: 'app-new789.js', src: 'src/app.ts', isEntry: true },
      }

      const bundle: OutputBundle = {
        '.vite/manifest.json': {
          type: 'asset',
          fileName: '.vite/manifest.json',
          name: 'manifest.json',
          names: ['manifest.json'],
          originalFileNames: [],
          needsCodeReference: false,
          source: JSON.stringify(newManifest),
        } as OutputAsset,
      }

      // First writeBundle in watch mode should skip deletion
      await (plugin.writeBundle as Function).call(ctx, {} as NormalizedOutputOptions, bundle)
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(true)
    })

    it('returns early if manifest not in bundle', async () => {
      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(false)

      const bundle: OutputBundle = {}

      // Should not throw and should return early
      await expect((plugin.writeBundle as Function).call(ctx, {} as NormalizedOutputOptions, bundle)).resolves.not.toThrow()
    })

    it('handles CSS files correctly', async () => {
      const initialManifest: Manifest = {
        'src/app.ts': {
          file: 'app-old123.js',
          src: 'src/app.ts',
          isEntry: true,
          css: ['app-old123.css'],
        },
      }
      const manifestDir = path.join(assetsDir, '.vite')
      await fs.mkdir(manifestDir, { recursive: true })
      await fs.writeFile(path.join(manifestDir, 'manifest.json'), JSON.stringify(initialManifest))
      await fs.writeFile(path.join(assetsDir, 'app-old123.js'), 'old js')
      await fs.writeFile(path.join(assetsDir, 'app-old123.css'), 'old css')

      const plugin = shopifyClean({ themeRoot: tempDir })
      const ctx = createMockPluginContext(false)

      await (plugin.buildStart as Function).call(ctx)

      const newManifest: Manifest = {
        'src/app.ts': {
          file: 'app-new789.js',
          src: 'src/app.ts',
          isEntry: true,
          css: ['app-new789.css'],
        },
      }
      await fs.writeFile(path.join(assetsDir, 'app-new789.js'), 'new js')
      await fs.writeFile(path.join(assetsDir, 'app-new789.css'), 'new css')

      const bundle: OutputBundle = {
        '.vite/manifest.json': {
          type: 'asset',
          fileName: '.vite/manifest.json',
          name: 'manifest.json',
          names: ['manifest.json'],
          originalFileNames: [],
          needsCodeReference: false,
          source: JSON.stringify(newManifest),
        } as OutputAsset,
      }

      await (plugin.writeBundle as Function).call(ctx, {} as NormalizedOutputOptions, bundle)

      // Old JS and CSS should be deleted
      expect(existsSync(path.join(assetsDir, 'app-old123.js'))).toBe(false)
      expect(existsSync(path.join(assetsDir, 'app-old123.css'))).toBe(false)
      // New files should exist
      expect(existsSync(path.join(assetsDir, 'app-new789.js'))).toBe(true)
      expect(existsSync(path.join(assetsDir, 'app-new789.css'))).toBe(true)
    })
  })
})
