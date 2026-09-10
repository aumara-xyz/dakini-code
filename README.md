# Dakini Code · 27

A calligraphic world and a small musical instrument: 27 curved characters, a ternary cube, a projected tesseract, Ambient sound, and a fixed-tone Harmonic Lab.

## Open locally

The commands below serve the app at **http://localhost:3000/**. Open that address in Safari, Chrome, or another regular browser; Codex is not required to view it while the server is running. The existing Aukora installation also opens its bundled copy through **http://localhost:5173/** → circle menu → User Apps → Dakini Code.

To start it again from this folder:

```sh
npm install
npm run dev:app -- --port 3000
```

The source repository is public. The scene and sound are generated locally, including when the static app is hosted. There are no app runtime API calls, microphone access, raw audio recordings, or paid model calls. Settings scores stay in memory until explicitly exported.

## Controls

- **‹ / ›** choose among the 27 characters.
- **Unfold / Fold** opens the glyph into a lattice of characters and 702 smaller echoes, then reverses it.
- **Drag** rotates the whole object; scroll or pinch changes viewing distance.
- **Cube** shows or hides the lattice, tesseract, and wave panes.
- **Click a cube face** while unfolded to turn its nine cells. Shift-click reverses the turn.
- **Ambient / Harmonic Lab** selects the sound model. Switching while muted stays silent. **Start sound / Mute** is a separate control.
- In **Ambient**, Sound enables the original harmonic drone and filtered noise. Character 01, the Seed, is silent.
- In **Harmonic Lab**, three Soft / Medium / Strong controls select an existing character while shaping its fourth, sixth, and eighth harmonics. Character 01 is Medium / Medium / Medium and is audible when enabled.
- The upper-right circular arrow resets the view and cube turns, keeping the chosen character and sound preference.
- The upper-left **About** icon opens a scrollable note about the artwork, its 27-cell coordinate study, and its relationship to ḍākinī-script inspiration. The scene remains visible behind the reading layer; Escape, clicking outside it, or its X button closes it.

Keyboard: focus the scene and use arrows to rotate, Space/Enter to fold, or X/Y/Z to turn a positive-axis face. Shift reverses a turn. Character arrows and all other controls are keyboard accessible. OS reduced-motion preferences are honored automatically. Motion and audio suspend when the page is hidden.

## What is connected

In Ambient, Luminara's three trits determine the character's roof, bowl, and tail; its lattice cell; three wave harmonics; interval clarity; and base pitch. The same standing-wave function bends the main unfolded glyph, draws the three orthogonal panes, and modulates the ambient audio filter.

The selected character occupies the large central focus seat. Its smaller lattice copy swaps with the Seed so that all 27 distinct characters remain represented. Face turns preserve the positions as an exact 27-cell permutation. This is an interactive geometric study, not a sticker-based Rubik solving game.

The four-dimensional wire shape is a perspective projection of a tesseract (16 vertices, 32 edges), separate from the 3D ternary lattice. The fractal is bounded to two levels: 27 parent positions, each with 26 small copies of the focused form.

These are original calligraphic studies informed by inspected Dakini-script examples and the supplied manuscript photograph. No historical alphabet, translation, spiritual diagnosis, or measured physical coherence is claimed. Source details are in [RESEARCH.md](RESEARCH.md).

## Harmonic Lab

The default base tone is 140 Hz. Twelve phase-aligned sine partials use exact integer multiples of that base. X shapes harmonic 4 (560 Hz), Y harmonic 6 (840 Hz), and Z harmonic 8 (1,120 Hz). Soft / Medium / Strong use coefficients 0.10 / 0.30 / 0.60. The fundamental remains 0.5; other partials remain 0.02/k. All gain changes ramp linearly for 50 ms with a fixed worst-case normalization. Output starts at 15% and is capped at 50%. This is a digital amplitude bound, not an acoustic loudness measurement.

Canonical coordinates preserve the existing ordering: X is relation, Y field, Z core; digits 0 / 1 / 2 map to trits 0 / +1 / −1. Camera rotation, folding, face permutations, and wave animation never alter Lab sound. The spectrum is labeled as predicted while muted and analyzed from synthesized output while enabled.

**Record settings** captures the initial selection and subsequent changes on a 50 ms grid for at most 60 seconds. It coalesces movements within a step. Stop retains the score; Clear is required before replacing it. Start sound and Replay to hear it. The scrubber previews silently; Start sound and Resume audition that position. A replay begins from a fresh audio phase and follows the audio clock.

**Export / Import** use the closed `dakini.resonance-score.v1` JSON format and local `luminara-harmonic-1` mapping. Imports reject surplus fields, unknown mappings, invalid identities, noncanonical timing, and files larger than 256 KiB before changing any state. Imported scores may specify a base tone from 80 to 240 Hz; it stays fixed for that score. Scores retain settings and timing, not a recording of a person's voice.

Hiding the browser or embedded surface pauses Lab recording/playback and suspends sound. Returning does not restart the score or Lab sound; resume explicitly. Ambient retains its original visibility behavior.

## Implementation and validation

- `lib/glyph.ts`: original curved character family and reversible deformation.
- `lib/ternary.ts`: reference-derived ternary identities, face turns, wave sampling, finite fractal positions, and 4D projection.
- `lib/space.ts`: Three.js rendering, pane shaders, pointer interaction, and shared animation state.
- `lib/resonance.ts`: gesture-initiated Web Audio synthesis and suspension/cleanup.
- `lib/harmonic-model.ts`: exact identity mapping, coefficients and gain envelopes.
- `lib/harmonic-voice.ts`: fixed-frequency Lab audio and offline-renderable graph.
- `lib/resonance-score.ts`: closed score schema and clock-driven transport.
- `components/harmonic-lab.tsx`: spectrum, discrete levels, score controls and local files.
- `app/page.tsx`: the compact controls.

```sh
npm test
npm run check
npm run build
```

The automated tests cover glyph geometry, existing identities, all 27 Lab mappings, gain bounds, strict score imports, capture coalescing, pause/resume, duration limits, and replay clock behavior. Three.js produces the expected large-chunk build notice.

For browser audio verification, start `dev:app` and open `/verify.html`. It renders all 27 states with OfflineAudioContext and checks 648 partial amplitudes at 48 kHz, using 100 ms integer-cycle windows after transitions with an absolute tolerance of 0.00001. It also supplies a 390-pixel embedded fixture to verify surface hiding. These fixture pages are excluded from production builds. Browser sound activation and rendered-signal tests do not imply a subjective listening assessment.

The implementation was checked with 18 passing unit tests, TypeScript, both production builds, and Chrome 152 on desktop and at 390 × 844. Browser checks covered sound activation and failed-resume recovery, recording/export/import, invalid-import preservation, replay, volume changes, mode switching, hidden-surface suspension, and the scrollable About overlay. The 648 offline comparisons had a maximum absolute error of 0.0000000376; peak output was 0.384435 at the 0.5 volume cap. Changed application modules pass the focused lint check; repository-wide lint still reports existing starter-component issues. Native Safari and subjective listening were not checked in this run.

## Standalone repository and Aukora User Apps

Source repository: https://github.com/aumara-xyz/dakini-code.

Build a complete static app with relative asset URLs:

```sh
npm ci
npm run build:app
npm run preview:app
```

`dist-app/` contains the entire runnable app. It needs a static HTTP server, with no Vinext, Cloudflare, AI service, or separate backend at runtime. The original local development and build commands remain available.

For the configured static Site deployment, run `npm run build:site`; it emits the same app to `dist/` for packaging.

Aukora mounts a pinned build at `/stock-apps/dakini-code/index.html`, opened from the circle menu's **User Apps → Dakini Code** entry. Updating that copy means building this repository at the desired commit, copying `dist-app/` into the host's `ui-stock-apps/vendor/dakini-code/`, and refreshing its provenance manifest. No second server on port 3000 is needed for the embedded app.

The embedded entry accepts only the same-origin parent's `aukora-shell` / `surface-active` message for `dakini-code`. Hiding its shell surface suspends animation and audio. The chosen form remains; Ambient may restore sound, while Harmonic Lab requires explicit continuation. The standalone page follows normal browser visibility.
