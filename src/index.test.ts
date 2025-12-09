import { describe, it, expect } from 'vitest'
import path from 'path'
import type { Manifest } from 'vite'

import { getFilesInManifest } from './index'
import { resolveOptions } from './options'

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
})
