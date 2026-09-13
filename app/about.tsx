'use client';
import {Dialog} from '@base-ui/react/dialog';
import {Info, X} from 'lucide-react';

export function AboutDakiniCode() {
  return <Dialog.Root>
    <Dialog.Trigger className="about-trigger" aria-label="About Dakini Code" title="About Dakini Code"><Info size={20}/></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="about-backdrop"/>
      <Dialog.Popup className="about-dialog">
        <div className="about-dialog-header">
          <p className="about-eyebrow">DAKINI CODE · THE UNFOLDING</p>
          <Dialog.Close className="about-close" aria-label="Close about Dakini Code"><X size={22}/></Dialog.Close>
        </div>
        <div className="about-scroll">
          <div className="about-intro">
            <div>
              <p className="about-kicker">FORM ↔ SOUND ↔ MEMORY</p>
              <Dialog.Title>A mark.<br/>A tone.<br/><em>A place to return.</em></Dialog.Title>
              <Dialog.Description>Twenty-seven forms. One field of possibility.</Dialog.Description>
            </div>
            <figure className="about-visual" aria-label="Three three-position controls combine into twenty-seven states">
              <svg viewBox="0 0 260 220" aria-hidden="true">
                {[0,1,2].map(row=><g key={row} style={{color:['#ffc879','#75e5dc','#d6b4ff'][row]}}>
                  <path d={Array.from({length:121},(_,i)=>`${i?'L':'M'}${10+i*2},${35+row*38+Math.sin(i/120*Math.PI*(4+row*2))*14}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.7"/>
                  {Array.from({length:9},(_,i)=><circle key={i} cx={26+i*26} cy={160+row*20} r={4} fill="currentColor" opacity={.45+(i%3)*.25}/>)}</g>)}
              </svg>
              <figcaption>3 × 3 × 3 · twenty-seven combinations</figcaption>
            </figure>
          </div>
          <p className="about-lede">What happens when a symbol becomes something you can hear, turn in your hands, and visit again?</p>
          <div className="about-sections">
            <section><span className="section-number">01 / ORIGIN</span><h3>An invitation to Bhutan</h3><p>Made to share with Bhutan, with respect for its living Buddhist traditions and the calligraphic imagination of ḍākinī script. These curved forms are newly authored studies, inspired by the hooks, bowls, roofs, and trailing strokes of a supplied manuscript image.</p><p>The 27 forms and their musical correspondences are original to this artwork. They are offered as an exploration, without claiming a historical alphabet or a translation.</p></section>
            <section><span className="section-number">02 / THE FIELD</span><h3>One form, many dimensions</h3><p>Three positions along each of three axes make a 3 × 3 × 3 field. Unfold the glyphs, turn a cube face, and follow their finite fractal echoes. A separate tesseract projection opens another way of looking at depth.</p><p>The translucent wave panes are an artistic mapping. Their movement gives the geometry a rhythm you can explore.</p></section>
            <section><span className="section-number">03 / THE INSTRUMENT</span><h3>Keep the tone. Change its color.</h3><p>Ambient keeps the original drifting soundscape. Harmonic Lab holds a base tone at 140 Hz while three controls shape its fourth, sixth, and eighth harmonics: 560, 840, and 1,120 Hz.</p><p>Soft, Medium, and Strong combine into 27 distinct settings. The sound and glyph share that setting. Rotating the scene changes your view; the lab’s frequencies stay fixed.</p><p>The spectrum shows a prediction when muted and an analysis of synthesized sound when running. Zero is the middle strength in the Lab. Silence has its own button.</p></section>
            <section><span className="section-number">04 / THE SCORE</span><h3>A sequence you can return to</h3><p>Record settings, move through combinations, and replay their order and timing. Each score samples your choices in 50 ms steps, for up to one minute. Export it as a small file or import it to play again.</p><p>Scores stay in memory until you export them. There is no microphone, voice recording, or interpretation of your thoughts. Hiding the Lab pauses the score; you choose when to resume.</p></section>
            <section className="about-observer"><span className="section-number">05 / THE OBSERVER</span><h3>Let the pattern answer to the evidence</h3><p>Observer gives each of 27 cells its own ternary value. Three planes hold 27 line-sum checks. Change the cells, reconstruct them from six readings, and discover both what the checks detect and what they miss.</p><p>Keep a locally signed reference to compare the actual bytes. A digest can also be displayed in four cubes: 92 seven-state symbols and 16 padding cells. This is a reversible display, not compression. The local signature demonstrates verification with a held key; it does not establish identity or grant authority. Run the checks to reproduce the experiment in your browser.</p></section>
          </div>
          <blockquote>Listen to what changes.<br/><em>Notice what stays.</em></blockquote>
          <p className="about-footnote">A local musical instrument and visual artwork. Keep sound comfortable and explore while stationary. No special breathing or vocal technique is required.</p>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}
