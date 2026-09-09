# Dakini Code · 27

A local calligraphic world: 27 curved characters, a ternary cube, a projected tesseract, and a quiet synthesized voice.

## Open locally

The running development server is at **http://localhost:3000/**. Open that address in Safari, Chrome, or another regular browser; Codex is not required to view it while the server is running.

To start it again from this folder:

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

Nothing is published. The scene, stars, reflections, geometry, wave patterns, and sound are generated locally. There are no runtime API calls, recordings, microphone access, or paid model calls.

## Controls

- **‹ / ›** choose among the 27 characters.
- **Unfold / Fold** opens the glyph into a lattice of characters and 702 smaller echoes, then reverses it.
- **Drag** rotates the whole object; scroll or pinch changes viewing distance.
- **Cube** shows or hides the lattice, tesseract, and wave panes.
- **Click a cube face** while unfolded to turn its nine cells. Shift-click reverses the turn.
- **Sound** enables a soft harmonic drone and filtered noise. It starts muted. Character 01, the Seed, is silent.
- The upper-right circular arrow resets the view and cube turns, keeping the chosen character and sound preference.

Keyboard: focus the scene and use arrows to rotate, Space/Enter to fold, or X/Y/Z to turn a positive-axis face. Shift reverses a turn. Character arrows and all other controls are keyboard accessible. OS reduced-motion preferences are honored automatically. Motion and audio suspend when the page is hidden.

## What is connected

Luminara's three trits determine the character's roof, bowl, and tail; its lattice cell; three wave harmonics; interval clarity; and base pitch. The same standing-wave function bends the main unfolded glyph, draws the three orthogonal panes, and modulates the audio filter. Sound is a continuous artistic adaptation of the repository's struck voice.

The selected character occupies the large central focus seat. Its smaller lattice copy swaps with the Seed so that all 27 distinct characters remain represented. Face turns preserve the positions as an exact 27-cell permutation. This is an interactive geometric study, not a sticker-based Rubik solving game.

The four-dimensional wire shape is a perspective projection of a tesseract (16 vertices, 32 edges), separate from the 3D ternary lattice. The fractal is bounded to two levels: 27 parent positions, each with 26 small copies of the focused form.

These are original calligraphic studies informed by inspected Dakini-script examples and the supplied manuscript photograph. No historical alphabet, translation, spiritual diagnosis, or measured physical coherence is claimed. Source details are in [RESEARCH.md](RESEARCH.md).

## Implementation and validation

- `lib/glyph.ts`: original curved character family and reversible deformation.
- `lib/ternary.ts`: reference-derived ternary identities, face turns, wave sampling, finite fractal positions, and 4D projection.
- `lib/space.ts`: Three.js rendering, pane shaders, pointer interaction, and shared animation state.
- `lib/resonance.ts`: gesture-initiated Web Audio synthesis and suspension/cleanup.
- `app/page.tsx`: the compact controls.

```sh
npm test
npm run check
npm run build
```

Ten automated tests cover all 27 character identities, finite curves, ternary bijection, every face turn and inverse, four-turn identity, the bounded echo count, projection topology, wave bounds, and reversible folding. Production build and TypeScript checks pass. Three.js produces the expected large-chunk build notice.

Browser verification also covered cycling through all 27 forms, Unfold/Fold, actual pointer dragging, keyboard and pointer face turns, cube visibility, sound activation/muting, and Reset. The final diagnostic browser run reported no console errors. The standalone Safari view was visually checked in both folded and expanded states; explicit interactions repaint even when its window is occluded. Audio playback was activated and muted through the UI; the synthesized timbre was not assessed by listening.

## Standalone repository and Aukora User Apps

Source repository: https://github.com/aumara-xyz/dakini-code.

Build a complete static app with relative asset URLs:

```sh
npm ci
npm run build:app
npm run preview:app
```

`dist-app/` contains the entire runnable app. It needs a static HTTP server, with no Vinext, Cloudflare, AI service, or separate backend at runtime. The original local development and build commands remain available.

Aukora mounts a pinned build at `/stock-apps/dakini-code/index.html`, opened from the circle menu's **User Apps → Dakini Code** entry. Updating that copy means building this repository at the desired commit, copying `dist-app/` into the host's `ui-stock-apps/vendor/dakini-code/`, and refreshing its provenance manifest. No second server on port 3000 is needed for the embedded app.

The embedded entry accepts only the same-origin parent's `aukora-shell` / `surface-active` message for `dakini-code`. Hiding its shell surface suspends animation and audio; returning restores the chosen form and sound preference. The standalone page continues to use normal browser visibility.
