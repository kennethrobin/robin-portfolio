# Kenneth Robin — Portfolio

Three working prototypes of the same site, built to be compared live.
Open the dev server and pick a direction; the winner gets developed
to completion.

## Run it

```
dev.cmd          (double-click, or run from a terminal)
```

then open **http://localhost:5180** — you'll land on a chooser:

| Page | Direction | Feel |
|---|---|---|
| `/a.html` | **A — Editorial** | visible masthead + labeled index table, cursor-following preview, quick-view per project |
| `/b.html` | **B — Dimensional** | work planes floating in depth, scroll = camera travel, quiet fading UI |
| `/c.html` | **C — Hybrid** | editorial index whose thumbnails lift off the page into a full-bleed spatial detail |
| `/d.html` | **D — Rōbin** | fullscreen video collage: random ~3s cuts across all films, glitch transitions, huge MNKY Albert moniker, filmstrip scroller (xk.studio energy) |

## Edit the content

Everything lives in **`src/data/projects.ts`** — titles, clients,
years (currently best guesses — please fix), roles, blurbs, media.
Reorder the array to reorder the site.

Images sit in **`public/media/<slug>/01.jpg…`** (pulled from your
current site by `scripts/fetch-media.ps1`). To give a project motion,
drop a muted loop next to them and set `video: "/media/<slug>/loop.mp4"`
— or keep a Vimeo player URL for the detail view.

## Change the look

All spacing, type sizes, colors and easings are tokens in
**`src/styles/tokens.css`**. The 8pt spacing scale, the type scale,
the palette (one accent: `--accent`), and the house easing all live
there — change a token, the whole site follows.

Per-direction styling: `src/a/a.css`, `src/b/b.css`, `src/c/c.css`.
Direction B's spatial feel (plane sizes, camera weight, travel
distance) is the `CONFIG` block at the top of `src/b/main.ts`.

## Direction D specifics

- **This is the main landing page.** It's a scrollable sales page:
  video hero → §01 Profile → §02 Capabilities → §03 Clients → footer.
- **Editing the copy:** all section text lives directly in `d.html`,
  clearly commented (`§01 PROFILE`, etc.). The hero statement, the
  capability list, and the client names are all plain HTML you can
  edit in place — no code needed.
- Fonts: titles use **MNKY Albert**, body copy uses **MNKY Wilson**
  (both in `public/fonts/`, declared at the top of `src/d/d.css`).
- ⚠️ The §01 line "for over a decade" and the footer social links
  (Instagram / Vimeo / LinkedIn → `#`) are placeholders — swap in
  the real numbers and URLs.
- The films live in `public/media/clips/` (bbc2 / reel / aiga /
  quickies). Add another: drop an .mp4 there and add one line to
  `SOURCES` in `src/d/main.ts`.
- Cut rhythm, crossfade length, glitch intensity, grain: the `CLIP`
  block at the top of `src/d/main.ts`.
- Strip drift speed / wheel feel: the `STRIP` block, same file.
- The moniker size/tracking: `.moniker` in `src/d/d.css`.
- MNKY Albert weights are in `public/fonts/` (Black drives the
  moniker; Medium/Regular do the UI).
- For deploy, re-encode the films smaller (they're straight copies,
  ~90 MB total — fine locally, heavy on the wire).

## Notes

- Node is installed portably at `%LOCALAPPDATA%\node-portable` and on
  your user PATH; `dev.cmd` works regardless.
- Vite's cache is kept outside Dropbox (`vite.config.ts → cacheDir`)
  because Dropbox file-locking breaks it. Don't move it back.
- `prefers-reduced-motion` gets a calm fallback on every direction.
- Build for deploy with `npm run build` → `dist/` (drag-and-drop onto
  Netlify, same as your other projects).
