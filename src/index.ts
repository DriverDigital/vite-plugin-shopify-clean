import { existsSync, promises as fs } from 'fs'
import path from 'path'

import { Manifest, Plugin } from 'vite'

import { resolveOptions, VitePluginShopifyCleanOptions } from './options'

 
export default function shopifyClean (options: VitePluginShopifyCleanOptions = {}): Plugin {
  const resolvedOptions = resolveOptions(options)

  // First-run flags scoped per plugin instance
  let buildStartFirstRun = true
  let writeBundleFirstRun = true

  const getAssetsDir = (): string => {
    const rootPath = path.resolve(resolvedOptions.themeRoot)
    return path.resolve(rootPath, './assets')
  }

  const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

      if (this.meta.watchMode && !buildStartFirstRun) {
        return
      }

      buildStartFirstRun = false

      await Promise.all(filesInManifest.map(async file => {
        const base = path.basename(file)
        const location = path.join(assetsDir, base)

        if (existsSync(location)) {
          try {
            await fs.unlink(location)
          } catch (err: any) {
            // Ignore files that no longer exist; they may have been removed by another process
            if (err && err.code !== 'ENOENT') {
              console.warn(`WARNING: Failed to delete asset ${location}: ${err.message ?? err}`)
            }
          }
          return
        }

        return Promise.resolve()
      }))
    },

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
      const filesInManifest = getFilesInManifest(manifest)
      const filesInManifestBase = filesInManifest.map(f => path.basename(f))
      const filesInAssets = await fs.readdir(assetsDir)
      const filesToDelete = [...new Set(filesInManifest.map(file => {
        const base = path.basename(file)
        const fileStartsWith = base
          .split('-')
          .slice(0, base.split('-').length - 1)
          .join('-')
        const fileExtension = base.split('.')[base.split('.').length - 1]
        const toLookFor = new RegExp(`^${escapeRegExp(fileStartsWith)}-[^.]+\\.${escapeRegExp(fileExtension)}$`, 'i')

        return filesInAssets
          .filter(assetFile => {
            const matches = assetFile.match(toLookFor)
            const fileIsInManifest = filesInManifestBase.includes(assetFile)

            return matches && !fileIsInManifest
          })
      }).flat())]

      await Promise.all(filesToDelete.map(async file => {
        const location = path.join(assetsDir, file)

        if (existsSync(location)) {
          try {
            await fs.unlink(location)
          } catch (err: any) {
            // Ignore files that no longer exist; they may have been removed by another process
            if (err && err.code !== 'ENOENT') {
              console.warn(`WARNING: Failed to delete asset ${location}: ${err.message ?? err}`)
            }
          }
          return
        }

        return Promise.resolve()
      }))
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
    .map(([key, block]) => {
      const file = block.file

      // We're experiencing a manifest which is listing a file that isn't output so we'll check the imports to make sure all files are actually used. This typically only seems to be for imports which start with an _
      if (path.posix.basename(key).startsWith('_')) {
        if (filesListedInImports.has(key)) {
          return [file]
        }

        return []
      }

      return [file]
    })
    .flat()
}
