# Research behind the new form

The previous version's right-angle branching grammar had no basis in Dakini-script calligraphy. It has been removed along with the puzzle and its claim of learning to read.

## Visual reference

The principal reference is Aro Encyclopaedia's [Dakini cypher calligraphy](https://www.aroencyclopaedia.org/shared/text/k/khandro_script_ca_01_01_eng.php), whose [image](https://www.aroencyclopaedia.org/shared/image/d/dakini_script_350_424.jpg) was visually inspected. Its lettering combines rounded bowls, inward hooks, narrow hanging strokes, horizontal roofs, and detached round marks. Width changes along each stroke. The enclosing brush circle is part of the presentation; it was not copied into the scene.

The implementation uses an original asymmetrical combination of these formal features: five curved strokes and a suspended round mark. It is a calligraphic study, not a traced sacred inscription. The source image is not bundled, and its copyright is not presented as an open license.

## What the sources actually say

Aro's [Khandro script explanation](https://www.aroencyclopaedia.org/shared/text/k/khandro_script_th_01_eng.php) describes script associated with terma and compares some syllables to seeds for a much larger teaching. It describes recognition by the treasure revealer within that tradition, rather than a generally readable language. This is a traditional religious account, not a mechanism implemented by the application.

Adele Tomlin's [Dakini-script research article](https://dakinitranslations.com/2021/05/12/dakini-script-khandro-da-yig-mysterious-symbolic-key-to-hidden-treasures/) brings together Kunga Wangmo's research and Georg Fischer's collection. It documents varied forms and calligraphic styles; some collected charts correspond to Tibetan alphabets. Its golden example, attributed cautiously to Mingyur Dorje, includes curved bowls and long connectors. There is no single visual alphabet represented by every example.

[Rangjung Yeshe Publishing](https://www.rangjung.com/book_title/dakini-teachings-2/) situates Dakini script in the tradition of teachings attributed to Padmasambhava, recorded by Yeshe Tsogyal, and concealed as terma.

## What this application does

The Unfold button extends the original curves into depth. Fold reverses that same geometric deformation. The program does not decode, translate, confer a teaching, or assign spiritual meaning to these transformations. This distinction is documented here so the actual interface can remain quiet and simple.

## September 2026: the 27-character cube

The additional visual reference is the user's supplied manuscript photograph: loose horizontal arches, small hanging loops, separated curls, and long descending swashes. The red seal is not interpreted. `glyphStrokes()` composes three roofs, three bowls, and three tails into 27 original forms, with a small detached mark. It retains the original concept's reversible seed-to-unfolding idea while omitting its earlier instruction-heavy puzzle interface.

The two user-supplied GitHub URLs were consulted. Their web views did not resolve in this session, so the existing local repository was read directly, without checkout or modification.

### Seed and the actual Luminara artwork

The linked `demos/aukora-seed/README.md` describes a governed-effect Wasm teaching artifact; lines 43–44 explicitly distinguish its balanced-ternary numeric fold from a tesseract mechanism. It is not the visual Seed27 implementation.

The relevant artwork was found in `packages/client/ui-stock-apps/vendor/luminara-portal/spatial/app/` in the local `aukora-deep` checkout (HEAD `20ee8b10ca6adf239b34583b45066964ca2ea312`). These working-tree files were inspected directly:

- `luminara-canon.js:104–106`: base-3 digits `[field, relation, core]`, each ordered 0, +1, −1.
- `luminara-cube.js:30–82`: positions `[relation, field, core]`; 27 cells; six outer faces and two quarter-turn directions. A face turn rotates nine selected coordinates, with its center staying at the same position.
- `luminara-canon.js:151–178`: signed identity `q = 9·field + 3·relation + core`, spanning −13…13; `p = 1 + movingCount`, except all three moving gives 7.
- `luminara-canon.js:228–239`: harmonics 3, 6, 9 and clarity from the reduced absolute winding ratio.
- `coherence-glyph.js:158–210`: radial sine × angular cosine standing waves, gold nodal lines, and opposite cyan/purple phases. Our three pane shader and glyph deflection adapt this field; they are not a measured aura.
- `luminara-sound.js:108–145`: the twentyseven pitch is `196·2^(q/13.5)` times radial mode; moving modes have signed detuned twins. Our voice uses three continuous sine partials, 0.45% signed detuning, gentle stereo placement, and low filtered noise. Its envelope and timbre are an artistic adaptation, not an exact reproduction of the struck original.

All 27 identities and their wave inputs are retained. Glyphs are newly authored; this does not claim that the Luminara identities supply a traditional Dakini alphabet. The large central focus seat swaps its small representation with the Seed. Turns track cell positions, not sticker orientations.

### Lotus / ternary observer code

The linked branch was available locally as `codex/ternary-observer-code`, commit `adc6695fe84e7d55581fde766f608b22c720c806`. Files were read with `git show`, without switching the user's checkout.

- [observer-code.mjs](https://github.com/aumara-xyz/aukora-deep/blob/adc6695fe84e7d55581fde766f608b22c720c806/experiments/ternary-tesseract/observer-code.mjs#L3) defines the same 27 coordinate triples in lexicographic −1, 0, +1 order. The UI retains Luminara's different identity ordering, explicitly avoiding an index conflation.
- Its lines 248–262 define 13 modular center planes. Diagonal modular planes may wrap across Euclidean layers. This scene draws the three literal XY/XZ/YZ sheets; it does not depict all 13 sets as flat sheets.
- Its lines 288–314 enumerate 24 whole-cube rotations. The interactive face turns here follow the separate Luminara cube implementation.
- [OBSERVER-CODE.md](https://github.com/aumara-xyz/aukora-deep/blob/adc6695fe84e7d55581fde766f608b22c720c806/experiments/ternary-tesseract/OBSERVER-CODE.md#L172) develops a source × harmonic-filter analogy. This informed linking the rendered wave to the sound filter.
- The branch distinguishes a 27-cell 3D observer cube, an 81-cell 4D diagnostic grid, and a tesseract's 81 mixed-dimensional faces. Our separate 16-vertex/32-edge tesseract projection and finite 702 echoes are new visual extensions; they are not represented as implementations of the diagnostic coherence metric or as the branch's existing renderer.

The visual oscillation, calligraphic transformation, and audio are intentionally described as an interactive artwork. There are no frequency-healing, decoding, or biometric claims.
