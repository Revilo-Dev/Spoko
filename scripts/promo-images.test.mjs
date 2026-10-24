import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { build, createServer, preview } from 'vite'
import { promoImagesPlugin } from './promo-images.mjs'

test('public/assets/promo is dynamic in dev, production builds, and preview', async () => {
  // Keep the fixture under the current project: Vite emits paths relative to its root.
  const root = await mkdtemp(path.join(process.cwd(), '.promo-image-test-'))
  const output = path.join(root, 'dist')
  const promo = path.join(root, 'public/assets/promo')
  const svg = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><path fill="${color}" d="M0 0h1v1H0z"/></svg>`
  const options = () => ({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [promoImagesPlugin()],
    build: { outDir: 'dist', emptyOutDir: true },
  })

  async function imageList(directory) {
    return JSON.parse(await readFile(path.join(directory, 'assets/promo/images.json'), 'utf8'))
  }

  try {
    await mkdir(promo, { recursive: true })
    await mkdir(path.join(root, 'public/assets'), { recursive: true })
    await writeFile(path.join(root, 'public/assets/logo.svg'), svg('black'))
    await writeFile(path.join(root, 'index.html'), '<main>Promo test</main>')
    await writeFile(path.join(promo, '2-first.svg'), svg('blue'))
    await writeFile(path.join(promo, 'notes.txt'), 'not an image')

    await build(options())
    const first = await imageList(output)
    assert.deepEqual(first.map(({ file }) => file), ['2-first.svg'])
    assert.equal(first[0].src, '/assets/promo/2-first.svg')
    assert.equal(await readFile(path.join(output, first[0].src.slice(1)), 'utf8'), svg('blue'))
    assert.equal(await readFile(path.join(output, 'assets/logo.svg'), 'utf8'), svg('black'))

    // Both local servers must discover edits from the source folder without a rebuild.
    for (const mode of ['dev', 'preview']) {
      const server = mode === 'preview'
        ? await preview({ ...options(), preview: { host: '127.0.0.1', port: 4174, strictPort: true } })
        : await createServer({ ...options(), server: { host: '127.0.0.1', port: 5174, strictPort: true } })
      if (mode === 'dev') await server.listen()
      const origin = `http://127.0.0.1:${server.httpServer.address().port}`

      async function reload() {
        const response = await fetch(`${origin}/assets/promo/images.json`, { cache: 'no-store' })
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('cache-control'), 'no-store')
        return response.json()
      }

      try {
        assert.deepEqual(await reload(), first)
        await writeFile(path.join(promo, 'added.svg'), svg('green'))
        assert.deepEqual((await reload()).map(({ file }) => file), ['2-first.svg', 'added.svg'])

        await writeFile(path.join(promo, '2-first.svg'), svg('purple'))
        const imageResponse = await fetch(`${origin}${first[0].src}`)
        assert.equal(imageResponse.status, 200)
        assert.match(imageResponse.headers.get('content-type'), /image\/svg\+xml/)
        assert.equal(await imageResponse.text(), svg('purple'))

        await rm(path.join(promo, 'added.svg'))
        assert.deepEqual(await reload(), first)
      } finally {
        if (mode === 'dev') await server.close()
        else await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
      }
    }

    await rm(path.join(promo, '2-first.svg'))
    await build(options())
    assert.deepEqual(await imageList(output), [], 'removed source images must disappear from the next build')
    assert.equal(existsSync(path.join(output, 'assets/promo/2-first.svg')), false)
  } finally {
    assert.ok(path.basename(root).startsWith('.promo-image-test-'))
    await rm(root, { recursive: true, force: true })
  }
})
