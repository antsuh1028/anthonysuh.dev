# PocketZot — portfolio demo

A **backend-free, no-install** live demo of PocketZot for embedding on a portfolio
or any plain HTML site. It runs the *real* mascot engine (`dist/anteaterchar/*.js`)
unchanged and swaps the fine-tuned LLM classifier for a local, offline keyword
classifier over the same taxonomy — so it costs **nothing** and can't break.

## What's here

- `index.html` — a standalone demo page (hero + interactive panel). Open this to see it.
- `pocketzot-demo.js` — the glue: a tiny `chrome.runtime.getURL` shim, the canned
  classifier, the ants/health economy, and the control panel UI.

## Run it locally

The mascot loads image assets, so open it over HTTP (not `file://`):

```bash
# from the repo root
python -m http.server 8099
# then visit http://localhost:8099/demo/index.html
```

## Embed it on your portfolio

1. **Copy two things** to your site:
   - the whole `dist/` folder (mascot scripts + PNG assets)
   - `demo/pocketzot-demo.js`

2. **Add this** where you want the panel (the anteater roams the whole page):

   ```html
   <!-- point base at wherever you put the dist/ folder, relative to the page -->
   <script>
     window.PocketZotConfig = { base: "/pocketzot/", autoSpawn: true, mount: "#pocketzot-demo" };
   </script>

   <div id="pocketzot-demo"></div>

   <script src="/pocketzot/dist/anteaterchar/physics.js"></script>
   <script src="/pocketzot/dist/anteaterchar/stateMachine.js"></script>
   <script src="/pocketzot/dist/anteaterchar/sprite.js"></script>
   <script src="/pocketzot/dist/anteaterchar/dragController.js"></script>
   <script src="/pocketzot/dist/anteaterchar/anteater.js"></script>
   <script src="/pocketzot/pocketzot-demo.js"></script>
   ```

   Adjust the paths + `base` to match where you copied `dist/`. `base` must end
   with a slash and is prefixed to every asset path (e.g. `base + "dist/Idle State.png"`).

3. If you omit `mount`, the panel floats in the bottom-left corner instead of
   being placed inside an element you control.

## Config options (`window.PocketZotConfig`)

| Key | Default | Meaning |
|-----|---------|---------|
| `base` | `"../"` | URL prefix where `dist/` lives, relative to the page. Must end with `/`. |
| `autoSpawn` | `true` | Spawn the anteater on load. |
| `mount` | *(none)* | CSS selector to inject the panel into. Omit → floating panel. |

## Public API

`window.PocketZotDemo` exposes `{ classify(prompt), spawn(), despawn(), equipHat(hat) }`
if you want to wire the demo into your own UI instead of the built-in panel.

## Notes

- This demo deliberately does **not** load `messageListener.js` (the extension's
  chat-site monitor) — it isn't needed off the AI sites, and it's the only file
  that requires real Chrome extension APIs.
- Ants/health are stored in `localStorage` under `pocketzot_demo_*`.
