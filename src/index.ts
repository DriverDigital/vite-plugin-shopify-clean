import { existsSync, promises as fs } from 'fs'
import path from 'path'

import { Manifest, Plugin } from 'vite'

import { resolveOptions, VitePluginShopifyCleanOptions } from './options'

function isNodeError (err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err
}

async function safeUnlink (location: string): Promise<void> {
  try {
    await fs.unlink(location)
  } catch (err: unknown) {
    // Ignore files that no longer exist; they may have been removed by another process
    if (!isNodeError(err) || err.code !== 'ENOENT') {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`WARNING: Failed to delete asset ${location}: ${message}`)
    }
  }
}

export default function shopifyClean (options: VitePluginShopifyCleanOptions = {}): Plugin {
  const resolvedOptions = resolveOptions(options)

  // First-run flags scoped per plugin instance
  let buildStartFirstRun = true
  let writeBundleFirstRun = true

  // Track previous manifest files for comparison in writeBundle
  let previousManifestFiles: Set<string> = new Set()

  const getAssetsDir = (): string => {
    const rootPath = path.resolve(resolvedOptions.themeRoot)
    return path.resolve(rootPath, './assets')
  }

  return {
    name: 'vite-plugin-shopify-clean',
    buildStart: async function () {
      const assetsDir = getAssetsDir()

      if (!existsSync(assetsDir)) {
        console.warn(`WARNING: No assets folder located at ${assetsDir}. No clean attempted.`)
        return
      }

      const manifestFile = path.join(assetsDir, resolvedOptions.manifestFileName)

      if (!existsSync(manifestFile)) {
        console.warn(`WARNING: No ${resolvedOptions.manifestFileName} in ${assetsDir}. No clean attempted.`)
        return
      }

      const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf-8')) as Manifest
      const filesInManifest = getFilesInManifest(manifest)

      // Store previous manifest files for writeBundle comparison
      previousManifestFiles = new Set(filesInManifest.map(f => path.basename(f)))

      if (this.meta.watchMode && !buildStartFirstRun) {
        return
      }

      buildStartFirstRun = false

      await Promise.all(filesInManifest.map(async file => {
        const base = path.basename(file)
        const location = path.join(assetsDir, base)
        await safeUnlink(location)
      }))
    },

    // writeBundle handles incremental cleanup in watch mode: when files are removed
    // from the manifest between rebuilds, this hook deletes the stale assets
    writeBundle: async function (_, bundle) {
      if (!(resolvedOptions.manifestFileName in bundle)) return
      if (this.meta.watchMode && writeBundleFirstRun) {
        writeBundleFirstRun = false
        return
      }

      const assetsDir = getAssetsDir()

      if (!existsSync(assetsDir)) {
        console.warn(`WARNING: No assets folder located at ${assetsDir}. No clean attempted.`)
        return
      }

      const manifestAsset = bundle[resolvedOptions.manifestFileName]
      if (!('source' in manifestAsset)) return

      const manifest = JSON.parse(manifestAsset.source.toString()) as Manifest
      const currentManifestFiles = new Set(getFilesInManifest(manifest).map(f => path.basename(f)))

      // Delete files that were in the previous manifest but not in the current one
      const filesToDelete = [...previousManifestFiles].filter(f => !currentManifestFiles.has(f))

      await Promise.all(filesToDelete.map(async file => {
        const location = path.join(assetsDir, file)
        await safeUnlink(location)
      }))

      // Update previous manifest files for next comparison
      previousManifestFiles = currentManifestFiles
    },
  }
}

export function getFilesInManifest (manifest: Manifest): string[] {
  const filesListedInImports = new Set(
    Object.values(manifest)
      .map(block => {
        if ('imports' in block) {
          return block.imports
        }

        return []
      })
      .flat(),
  )

  return Object.entries(manifest)
    .flatMap(([key, block]) => {
      const files: string[] = []

      // Check if this entry should be included (handles underscore-prefixed files that aren't imported)
      const shouldInclude = !path.posix.basename(key).startsWith('_') || filesListedInImports.has(key)

      if (shouldInclude) {
        // Add main JS file
        files.push(block.file)

        // Add associated CSS files (fixes Issue #14)
        if ('css' in block && Array.isArray(block.css)) {
          files.push(...block.css)
        }
      }

      return files
    })
}
