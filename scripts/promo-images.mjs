import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const imageExtension = /\.(avif|apng|bmp|gif|ico|jfif|jpe?g|png|svg|webp)$/i
const mimeTypes = {
  avif: 'image/avif',
  apng: 'image/apng',
  bmp: 'image/bmp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  jfif: 'image/jpeg',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
}

function readFiles(directory, prefix = '') {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = prefix + entry.name
    const absolutePath = path.join(directory, entry.name)

    if (entry.isDirectory()) return readFiles(absolutePath, `${file}/`)
    return entry.isFile() ? [{ file, source: readFileSync(absolutePath) }] : []
  })
}

function readableAlt(file) {
  return path.posix.basename(file)
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function promoImagesPlugin() {
  let config

  const promoDirectory = () => path.resolve(config.publicDir, 'assets/promo')
  const images = () => readFiles(promoDirectory())
    .filter(({ file }) => imageExtension.test(file))
    .sort((a, b) => a.file < b.file ? -1 : a.file > b.file ? 1 : 0)
  const imageList = (files) => files.map(({ file }) => ({
    file,
    src: `${config.base}assets/promo/${file.split('/').map(encodeURIComponent).join('/')}`,
    alt: readableAlt(file),
  }))

  function servePromo(server) {
    server.middlewares.use((req, res, next) => {
      const pathname = new URL(req.url || '/', 'http://vite.local').pathname
      const promoPrefix = `${config.base}assets/promo/`
      if (!pathname.startsWith(promoPrefix)) return next()

      const promoFiles = images()
      res.setHeader('Cache-Control', 'no-store')

      if (pathname === `${promoPrefix}images.json`) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        return res.end(JSON.stringify(imageList(promoFiles)))
      }

      let requestedFile
      try {
        requestedFile = decodeURIComponent(pathname.slice(promoPrefix.length))
      } catch {
        res.statusCode = 400
        return res.end('Invalid image path')
      }

      const image = promoFiles.find(({ file }) => file === requestedFile)
      if (!image) {
        res.statusCode = 404
        return res.end()
      }

      const extension = path.extname(image.file).slice(1).toLowerCase()
      res.setHeader('Content-Type', mimeTypes[extension] || 'application/octet-stream')
      return res.end(image.source)
    })
  }

  return {
    name: 'spoko-promo-images',
    config() {
      return { build: { copyPublicDir: false } }
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    buildStart() {
      if (config.command !== 'build') return

      const promoFiles = images()
      for (const image of promoFiles) {
        this.emitFile({
          type: 'asset',
          fileName: `assets/promo/${image.file}`,
          source: image.source,
        })
      }
      this.emitFile({
        type: 'asset',
        fileName: 'assets/promo/images.json',
        source: JSON.stringify(imageList(promoFiles)),
      })

      for (const asset of readFiles(config.publicDir)) {
        if (asset.file.startsWith('assets/promo/')) continue
        this.emitFile({ type: 'asset', fileName: asset.file, source: asset.source })
      }

      config.logger.info(`Promo gallery: discovered ${promoFiles.length} image(s).`)
    },
    configureServer: servePromo,
    configurePreviewServer: servePromo,
  }
}
