<<<<<<< HEAD
# Spoko

Add or remove images in `dist/assets/promo`, then run:

```sh
npm run build
firebase deploy
```

Reload the page to see the latest deployed images. The gallery reads a fresh
`assets/promo/images.json` list and uses the original images in that same folder.
The build generates the list automatically and preserves the images. There is
no `promo-display` folder and no image list to edit.

Only `dist/assets/promo` supplies gallery images. `public/assets/promo` is ignored,
so deleted images stay deleted. Local `npm run dev` and `npm run preview` scan
the folder on reload, without another build. The live Firebase site needs a
build and deploy before local folder changes can appear on reload.

Subfolders and PNG/APNG, JPG/JPEG/JFIF, WebP, AVIF, GIF, SVG, BMP, and ICO files
are supported. Images are sorted by filename. Keep a backup: `dist` is ignored
by Git.

Run `npm test` to verify folder discovery, repeated builds, removals, and reloads.
=======
# Spoko.Site 

---- 

Spoko Freelance website

2026
>>>>>>> 53d90b3d27c39197c3bbb5a67772c99f1164894d
