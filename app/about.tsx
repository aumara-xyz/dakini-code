'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { CircleHelp, X } from 'lucide-react';

/** A readable in-world note that keeps the glyph study visible behind it. */
export function AboutDakiniCode() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        className="about-trigger"
        aria-label="About Dakini Code Lab"
        title="About Dakini Code Lab"
      >
        <CircleHelp size={19} strokeWidth={1.65} />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="about-backdrop" />
        <DialogPrimitive.Popup className="about-dialog">
          <div className="about-dialog-header">
            <div>
              <p className="about-eyebrow">THE UNFOLDING</p>
              <DialogPrimitive.Title>Dakini Code · 27</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                An interactive study in gesture, form, and spatial memory.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="about-close" aria-label="Close about Dakini Code">
              <X size={20} strokeWidth={1.7} />
            </DialogPrimitive.Close>
          </div>

          <div className="about-scroll">
            <p className="about-lede">One mark can become a place you can return to.</p>

            <section>
              <h3>Begin with a mark</h3>
              <p>
                Dakini Code is an interactive artwork: 27 original calligraphic forms float in a small
                ternary field. Choose a character, unfold it, rotate it, and follow its changing harmonic
                voice. The point is not to solve a code. It is to ask what happens when a symbol becomes
                something you can explore from within.
              </p>
              <p>
                The curved forms are newly drawn studies, informed by visual features observed in
                ḍākinī-script calligraphy and a supplied manuscript photograph: hooks, bowls, horizontal
                roofs, trailing lines, and detached marks. They are not translations, replications, or a
                historical alphabet.
              </p>
            </section>

            <section>
              <h3>Twenty-seven places</h3>
              <p>
                Three positions across each of three axes — −1, 0, and +1 — make 27 cells. Each form
                combines one of three roofs, bowls, and tails, then takes a place in that small spatial
                field. When you unfold the form, every character appears around the focus seat.
              </p>
            </section>

            <section>
              <h3>What opens</h3>
              <p>
                Unfolding carries the form into depth. The cube reveals a 3 × 3 × 3 lattice that you can
                turn face by face. The translucent panes visualize an artistic standing-wave field. The
                wire shape is a separate moving projection of a four-dimensional tesseract: a companion
                geometry, not a claim that the cube itself is a tesseract.
              </p>
            </section>

            <section>
              <h3>A quiet voice</h3>
              <p>
                Sound is made locally only after you turn it on. The selected location steers harmonic
                intervals, pitch, stereo movement, and soft filtered noise. It is a musical interpretation
                of the field — not a measurement of an aura, and not a healing, decoding, or biometric
                system.
              </p>
            </section>

            <section>
              <h3>A respectful boundary</h3>
              <p>
                Ḍākinī script belongs to living Tibetan Buddhist treasure traditions. This work takes
                inspiration from visual and conceptual questions around seed, recall, and unfolding, while
                keeping its own inventions clearly separate. It makes no claim to religious authority,
                prophecy, hidden translation, or special access.
              </p>
            </section>

            <section>
              <h3>Move through it</h3>
              <p>
                Choose a character with the arrows. Drag the space. Unfold the form. Turn the cube. Bring
                in sound if you want it. Keep only the meanings that remain visible to you.
              </p>
            </section>

            <blockquote>
              The treasure here is not proof that we were right. It is a clearer way of seeing.
            </blockquote>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
