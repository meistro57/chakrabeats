# ChakraBeats

ChakraBeats is a small React-powered binaural beat generator that focuses on the seven classical chakras. The app uses the Web Audio API to render left/right oscillators, Tailwind CSS for styling, and a lightweight esbuild/Tailwind compilation step so you can ship the experience as static assets.

## Features
- **Guided chakra presets:** Quickly load carrier and beat frequencies tuned for Root through Crown chakras.
- **Real-time controls:** Adjust carrier and binaural beat frequencies with responsive sliders while audio is playing.
- **Web Audio playback:** Generates stereo oscillators in the browser with a play/stop gate and gentle output level.
- **Production-friendly tooling:** Tailwind CSS 4 and esbuild bundle the UI and styles into deployable files inside `assets/`.

## Project structure
| Path | Description |
| --- | --- |
| `index.html` | CDN/Babel powered demo shell that mounts the ChakraBeats component. |
| `src/chakrabeats.jsx` | Production-ready React component that drives the audio engine and UI. |
| `src/input.css` | Tailwind source that declares the files to scan for class usage. |
| `assets/` | Compiled CSS (`tailwind.css`) and bundled JavaScript (`chakrabeats.js`). |
| `tailwind.config.js` & `postcss.config.js` | Tailwind/PostCSS configuration used during the build pipeline. |

## Getting started
### Requirements
- Node.js 18+ (esbuild and React 19 rely on modern Node features).
- npm (comes with Node).

### Installation
```bash
npm install
```

### Option 1: quick prototype (CDN build)
1. Serve the repository root with any static file server (for example `npx serve .`).
2. Visit `http://localhost:3000/index.html` to load the Babel/CDN version that references `chakrabeats.jsx` in the project root.

This option is helpful for experimenting because edits to `chakrabeats.jsx` are transpiled in the browser.

### Option 2: production bundle
1. Compile Tailwind and JavaScript into the `assets/` folder:
   ```bash
   npm run build
   ```
   - `npm run build:css` and `npm run build:js` are available if you want to run each phase manually.
   - The default scripts call the Tailwind CLI from `/usr/local/bin/tailwindcss`; if you do not have the binary installed globally, install it or adjust `package.json` to run `npx tailwindcss` instead.
2. Serve `index.html` (or another HTML shell) that links the generated assets:
   ```html
   <link rel="stylesheet" href="./assets/tailwind.css" />
   <div id="root"></div>
   <script src="./assets/chakrabeats.js"></script>
   ```
3. Host the files with any static server or deploy them to your preferred hosting provider.

## Customisation tips
- Update chakra presets, defaults, or UI copy directly in `src/chakrabeats.jsx`.
- Tailwind utilities are compiled from `src/input.css`; include any additional glob patterns there if you add new files.
- If you need linting or type-checking, integrate your preferred tooling alongside the existing build scripts.

## Available npm scripts
- `npm run build:css` – Compiles Tailwind classes from `src/input.css` into `assets/tailwind.css`.
- `npm run build:js` – Bundles the React app from `src/chakrabeats.jsx` into `assets/chakrabeats.js`.
- `npm run build` – Runs both build steps in sequence.

## License
The project is distributed under the ISC license as declared in `package.json`.
