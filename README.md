# Spoko

## Promo portfolio images

Add or remove supported image files in `public/assets/promo`. The portfolio and
the three flyer images in the header are discovered automatically during local
development and production builds. Images are sorted by filename.

Supported formats include PNG, APNG, JPG/JPEG/JFIF, WebP, AVIF, GIF, SVG, BMP,
and ICO. Subfolders are supported.

```sh
npm run dev
npm run build
npm run preview
```

The build writes the image list and copies the discovered files into `dist`.
Deploy the built `dist` directory to publish changes.
