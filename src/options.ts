import path from 'path'

export interface VitePluginShopifyCleanOptions {
  manifestFileName?: string
  themeRoot?: string
}

export interface ResolvedVitePluginShopifyCleanOptions {
  manifestFileName: string
  themeRoot: string
}

export const resolveOptions = (
  options: VitePluginShopifyCleanOptions,
): ResolvedVitePluginShopifyCleanOptions => ({
  manifestFileName: options.manifestFileName ?? '.vite/manifest.json',
  themeRoot: path.normalize(options.themeRoot ?? './'),
})
