import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const imageExtension = /\.(avif|apng|bmp|gif|ico|jfif|jpe?g|png|svg|webp)$/i
const mimeTypes = { avif: 'image/avif', apng: 'image/apng', bmp: 'image/bmp', gif: 'image/gif', ico: 'image/x-icon', jfif: 'image/jpeg', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp' }

function readFiles(directory, prefix = '') {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = prefix + entry.name
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) return readFiles(absolutePath, `${file}/`)
    return entry.isFile() ? [{ file, source: readFileSync(absolutePath) }] : []
  })
}

export function promoImagesPlugin() {
  let config
  const promoDirectory = () => path.resolve(config.root, 'public/assets/promo')
  const images = () => readFiles(promoDirectory())
    .filter(({ file }) => imageExtension.test(file))
    .sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0)
  const imageList = (files) => files.map(({ file }) => ({
    file,
    src: `${config.base}assets/promo/${file.split('/').map(encodeURIComponent).join('/')}`,
    alt: path.posix.basename(file).replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '),
  }))

  // Local reloads read the folder directly; deployed pages read the build's JSON list.
  function servePromo(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url?.split('?')[0]
      if (!url?.startsWith(`${config.base}assets/promo/`)) return next()
      const files = images()
      res.setHeader('Cache-Control', 'no-store')
      if (url === `${config.base}assets/promo/images.json`) {
        res.setHeader('Content-Type', 'application/json')
        return res.end(JSON.stringify(imageList(files)))
      }
      const index = imageList(files).findIndex(({ src }) => src === url)
      if (index < 0) { res.statusCode = 404; return res.end() }
      const image = files[index]
      res.setHeader('Content-Type', mimeTypes[path.extname(image.file).slice(1).toLowerCase()])
      res.end(image.source)
    })
  }

  return {
    name: 'spoko-promo-images',
    // Copy other public assets ourselves so public/promo cannot restore deleted images.
    config() { return { build: { copyPublicDir: false } } },
    configResolved(resolvedConfig) { config = resolvedConfig },
    buildStart() {
      if (config.command !== 'build') return
      // Read originals before Vite clears dist, and write them back with the build.
      const files = images()
      for (const image of files) {
        this.emitFile({ type: 'asset', fileName: `assets/promo/${image.file}`, source: image.source })
      }
      this.emitFile({ type: 'asset', fileName: 'assets/promo/images.json', source: JSON.stringify(imageList(files)) })
      for (const asset of config.publicDir ? readFiles(config.publicDir) : []) {
        if (asset.file.startsWith('assets/promo/') || asset.file.startsWith('assets/promo-display/')) continue
        this.emitFile({ type: 'asset', fileName: asset.file, source: asset.source })
      }
      config.logger.info(`Promo gallery: discovered ${files.length} image(s).`)
    },
    configureServer: servePromo,
    configurePreviewServer: servePromo,
  }
}
