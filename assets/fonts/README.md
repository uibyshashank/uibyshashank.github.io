# assets/fonts/

Place self-hosted font files here when you want to stop relying on Google Fonts
(e.g. `instrument-serif.woff2`, `inter-var.woff2`).

Current site status: fonts are loaded from Google Fonts in index.html's `<head>`.
Inter is loaded as a **variable font** (wght + opsz axes); the `opsz` axis is
what produces the "Inter Display" optical cut at large sizes:

```
family=Inter:opsz,wght@14..32,100..900
family=Instrument+Serif:ital@0;1
```

To self-host: download the WOFF2 files, place them here, and update the
`@font-face` rules at the top of `css/global.css` (the design tokens in
`:root` already point at `'Instrument Serif'` and `'Inter'` by name, so no
other file needs to change). Remember to keep the variable `opsz` axis when
self-hosting so the hero lockup still renders in the Display optical size.
