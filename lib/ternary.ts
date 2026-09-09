/** Luminara's ordering: field, relation, core; 0 → 0, 1 → +1, 2 → −1.
 * The observer-code cube uses the same set of coordinates in a different order.
 * See RESEARCH.md for the reference paths and the artistic extensions.
 */
export type Cell = [number, number, number];
export type Axis = 0 | 1 | 2;
const signs = [0, 1, -1];
const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
export function stateOf(index: number) {
  const id = ((Math.trunc(index) % 27) + 27) % 27;
  const digits: Cell = [Math.floor(id / 9), Math.floor(id / 3) % 3, id % 3];
  const [field, relation, core] = digits.map(d => signs[d]);
  const q = 9 * field + 3 * relation + core;
  const moving = [field, relation, core].filter(Boolean).length;
  const p = moving === 3 ? 7 : 1 + moving;
  const divisor = q === 0 ? 1 : gcd(Math.abs(q), p);
  return {
    id, digits, position: [relation, field, core] as Cell, q, p,
    harmonics: digits.map(d => 3 * (d + 1)) as Cell,
    clarity: q === 0 ? 1 : Math.min(1, 2 / ((Math.abs(q) + p) / divisor)),
    frequency: 196 * 2 ** (q / 13.5),
  };
}
export const STATES = Array.from({length: 27}, (_, i) => stateOf(i));
export function turnCell(cell: Cell, axis: Axis, layer: number, direction = 1): Cell {
  const result: Cell = [...cell];
  if (cell[axis] !== layer) return result;
  const a = ((axis + 1) % 3) as Axis, b = ((axis + 2) % 3) as Axis;
  result[a] = -direction * cell[b] || 0;
  result[b] = direction * cell[a] || 0;
  return result;
}
export function waveSample(u: number, v: number, harmonic: number, time: number, clarity: number, phase = 0) {
  const r = Math.hypot(u, v), angle = Math.atan2(v, u);
  return Math.sin(harmonic * Math.PI * r * (1 + (1 - clarity) * .12 * Math.sin(3 * angle + phase)))
    * Math.cos(harmonic * angle + time * .35 + phase);
}
/** Two finite IFS levels: the 27 parents each have 26 small noncentral echoes. */
export function fractalOffsets() {
  return STATES.flatMap(parent => STATES.filter(child => child.id !== 0).map(child => ({
    parent: parent.id,
    offset: child.position.map(n => n * .24) as Cell,
  })));
}
/** Standard perspective projection of the 16 vertices of a 4D hypercube. */
export function tesseractVertices(phase: number): Cell[] {
  return Array.from({length: 16}, (_, i) => {
    let x = i & 1 ? 1 : -1, y = i & 2 ? 1 : -1;
    let z = i & 4 ? 1 : -1, w = i & 8 ? 1 : -1;
    const a = .4 + phase * .11, b = .2 + phase * .07;
    [x, w] = [x * Math.cos(a) - w * Math.sin(a), x * Math.sin(a) + w * Math.cos(a)];
    [z, w] = [z * Math.cos(b) - w * Math.sin(b), z * Math.sin(b) + w * Math.cos(b)];
    const perspective = 2.8 / (2.8 - w * .6);
    return [x * perspective, y * perspective, z * perspective];
  });
}
export const TESSERACT_EDGES = Array.from({length: 16}, (_, i) =>
  [1, 2, 4, 8].filter(bit => !(i & bit)).map(bit => [i, i | bit] as const)).flat();
