# KAGE — Original Experience

An independent, clean-room interactive web experience. This project is inspired only by broad themes such as contemplative pacing, environmental storytelling and scroll-driven exploration. It does not include the original KAGE website's source code, artwork, textures, written content or scene assets.

## Stack
- Vite
- Three.js (MIT-licensed; see the package and its license)
- Original procedural geometry and authored interface/content

## Run locally
```bash
cd experiences/kage-original
npm install
npm run dev
```

## Production build
```bash
npm run build
npm run preview
```

The production output is written to `dist/`.

## Experience notes
- Five scroll chapters with camera movement tied to reading progress.
- Procedural garden architecture, stone path, trees, basin, lights and atmospheric particles.
- Responsive camera and renderer pixel-ratio limits for mobile devices.
- Pause/resume motion control and reduced-motion preference support.
- A readable content-first fallback if WebGL cannot initialize.

## Integration boundary
This is intentionally isolated from the existing THE SM STUDIOS Next.js application. Do not import these files into the storefront or change the root package scripts as part of this prototype. Integration should be a separate, reviewed phase after standalone testing.
