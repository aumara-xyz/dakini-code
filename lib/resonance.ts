import type {stateOf} from './ternary';

/** A quiet synthesized voice. Created only by the Sound button's user gesture. */
export function createResonance(onStateChange: (state: AudioContextState) => void) {
  const context = new AudioContext();
  context.onstatechange = () => onStateChange(context.state);
  const master = context.createGain(); master.gain.value = 0;
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -18; limiter.knee.value = 12; limiter.ratio.value = 8;
  const pan = context.createStereoPanner();
  master.connect(limiter); limiter.connect(pan); pan.connect(context.destination);
  const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = .6; filter.connect(master);
  const partials = Array.from({length: 6}, (_, i) => {
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = 'sine'; gain.gain.value = .24 / (1 + Math.floor(i / 2));
    oscillator.connect(gain); gain.connect(filter); oscillator.start();
    return oscillator;
  });
  const noise = context.createBufferSource(), noiseGain = context.createGain();
  const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const data = buffer.getChannelData(0); let brown = 0, seed = 27027;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    brown = (brown + (seed / 4294967296 * 2 - 1) * .025) / 1.025;
    data[i] = brown * 3;
  }
  noise.buffer = buffer; noise.loop = true; noiseGain.gain.value = 0;
  noise.connect(noiseGain); noiseGain.connect(filter); noise.start();
  let enabled = false, current = -1, last = -1, stopTimer: ReturnType<typeof setTimeout> | undefined;
  const smooth = (param: AudioParam, value: number, seconds = .12) => {
    param.cancelScheduledValues(context.currentTime);
    param.setTargetAtTime(value, context.currentTime, seconds);
  };
  async function setEnabled(next: boolean) {
    clearTimeout(stopTimer); enabled = next;
    if (next) await context.resume();
    else {
      smooth(master.gain, 0, .04);
      stopTimer = setTimeout(() => { if (!enabled && context.state !== 'closed') void context.suspend().catch(() => {}); }, 250);
    }
    return enabled && context.state === 'running';
  }
  function update(state: ReturnType<typeof stateOf>, amount: number, wave: number) {
    if (!enabled || context.state !== 'running' || context.currentTime - last < .07) return;
    last = context.currentTime;
    if (current !== state.id) {
      current = state.id;
      partials.forEach((oscillator, i) => {
        const radial = 1 + Math.floor(i / 2);
        smooth(oscillator.frequency, state.frequency * radial * (i % 2 ? 1 + Math.sign(state.q) * .0045 : 1), .3);
      });
    }
    smooth(master.gain, state.q === 0 ? 0 : .105 + amount * .025 + wave * .008);
    smooth(filter.frequency, 450 + state.clarity * 1100 + amount * 650 + wave * 140);
    smooth(pan.pan, state.q / 20 + wave * .12);
    smooth(noiseGain.gain, amount * (.014 + (1 - state.clarity) * .02));
  }
  function visibility(hidden: boolean) {
    if (hidden) void context.suspend().catch(() => {});
    else if (enabled) void context.resume().catch(() => {});
  }
  return {setEnabled, update, visibility, dispose() {
    clearTimeout(stopTimer); enabled = false;
    partials.forEach(osc => osc.stop()); noise.stop();
    void context.close().catch(() => {});
  }};
}
