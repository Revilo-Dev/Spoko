import { defineConfig } from 'vite'
import { promoImagesPlugin } from './scripts/promo-images.mjs'

export default defineConfig({
  plugins: [promoImagesPlugin()],
})
