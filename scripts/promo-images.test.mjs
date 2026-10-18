import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { build, createServer, preview } from 'vite'
import { promoImagesPlugin } from './promo-images.mjs'

test('only dist/promo supplies images, builds preserve them, and local reloads detect changes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'spoko-promo-test-'))
  const output = path.join(root, 'dist')
  const promo = path.join(output, 'assets/promo')
  const svg = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><path fill="${color}" d="M0 0h1v1H0z"/></svg>`
  const options = () => ({ root, configFile: false, logLevel: 'silent', plugins: [promoImagesPlugin()] })
  async function compile() {
    await build(options())
    assert.equal(existsSync(path.join(output, 'assets/promo-display')), false)
    assert.equal(await readFile(path.join(output, 'assets/logo.svg'), 'utf8'), svg('black'))
    return JSON.parse(await readFile(path.join(promo, 'images.json'), 'utf8'))
  }
  try {
    await mkdir(path.join(root, 'public/assets/promo'), { recursive: true })
    await mkdir(path.join(output, 'assets/promo-display'), { recursive: true })
    await writeFile(path.join(root, 'public/assets/promo/ignored.svg'), svg('red'))
    await writeFile(path.join(root, 'public/assets/logo.svg'), svg('black'))
    await writeFile(path.join(output, 'assets/promo-display/ignored.svg'), svg('red'))
    await writeFile(path.join(root, 'index.html'), '<main>Promo test</main>')
    assert.deepEqual(await compile(), [], 'public and promo-display images must not enter the gallery')

    await mkdir(path.join(promo, 'nested'), { recursive: true })
    const filename = 'nested/New design #1 & caf\u00e9.SVG'
    await writeFile(path.join(promo, filename), svg('blue'))
    await writeFile(path.join(promo, 'notes.txt'), 'not an image')
    const first = await compile()
    assert.deepEqual(first.map(({ file }) => file), [filename])
    assert.equal(first[0].src, '/assets/promo/nested/New%20design%20%231%20%26%20caf%C3%A9.SVG')
    assert.equal(await readFile(path.join(promo, filename), 'utf8'), svg('blue'))
    assert.deepEqual(await compile(), first, 'repeated builds must retain dist-only images')

    // Exercise both local servers: each new page load sees additions, replacements, and removals.
    for (const mode of ['preview', 'dev']) {
      const server = mode === 'preview'
        ? await preview({ ...options(), preview: { port: 0 } })
        : await createServer({ ...options(), server: { port: 0 } })
      if (mode === 'dev') await server.listen()
      const origin = `http://localhost:${server.httpServer.address().port}`
      async function reload() {
        const response = await fetch(`${origin}/assets/promo/images.json`, { cache: 'no-store' })
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('cache-control'), 'no-store')
        return response.json()
      }
      try {
        assert.deepEqual(await reload(), first)
        await writeFile(path.join(promo, 'added.svg'), svg('green'))
        assert.deepEqual((await reload()).map(({ file }) => file), ['added.svg', filename])
        await writeFile(path.join(promo, filename), svg('purple'))
        const response = await fetch(`${origin}${first[0].src}`)
        assert.equal(response.status, 200)
        assert.equal(response.headers.get('cache-control'), 'no-store')
        assert.match(response.headers.get('content-type'), /image\/svg\+xml/)
        assert.equal(await response.text(), svg('purple'))
        await rm(path.join(promo, 'added.svg'))
        assert.deepEqual(await reload(), first)
      } finally {
        if (mode === 'dev') await server.close()
        else await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
      }
    }
    await rm(path.join(promo, filename))
    assert.deepEqual(await compile(), [], 'deleted images must not return from public')
    assert.equal(existsSync(path.join(promo, 'ignored.svg')), false)
  } finally {
    assert.equal(path.dirname(root), os.tmpdir())
    assert.ok(path.basename(root).startsWith('spoko-promo-test-'))
    await rm(root, { recursive: true, force: true })
  }
})
