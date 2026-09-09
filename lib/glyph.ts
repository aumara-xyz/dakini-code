/** Original calligraphic study; references and historical boundaries in RESEARCH.md. */
export type Point = [number, number, number];
export type Stroke = { points: Point[]; width: number; tilt: number; depth: number };
export const STROKES: Stroke[] = [
  {width:.15, tilt:-.25, depth:.1, points:[[-1.55,1.25,0],[-1.3,1.4,0],[-.75,1.36,0],[-.12,1.38,0],[.5,1.46,0],[1.07,1.59,0],[1.32,1.83,0],[1.29,2.02,0]]},
  {width:.145, tilt:.7, depth:.65, points:[[-.05,1.36,0],[-.16,.94,0],[-.07,.38,0],[.07,-.12,0],[-.05,-.58,0],[-.42,-.86,0],[-.77,-.72,0],[-.8,-.39,0],[-.56,-.25,0],[-.2,-.5,0],[.14,-1.04,0],[.52,-1.58,0],[.96,-1.71,0],[1.34,-1.54,0]]},
  {width:.135, tilt:-1.05, depth:-.45, points:[[-1.25,1.35,0],[-1.38,.94,0],[-1.5,.42,0],[-1.42,.06,0],[-1.1,-.16,0],[-.72,-.06,0],[-.45,.3,0],[-.52,.55,0],[-.79,.53,0],[-.98,.33,0]]},
  {width:.12, tilt:.95, depth:-.15, points:[[.6,1.44,0],[.66,1.06,0],[.92,.83,0],[1.24,.66,0],[1.4,.32,0],[1.28,-.08,0],[.92,-.25,0],[.63,-.06,0],[.69,.2,0],[.98,.26,0],[1.17,.07,0]]},
  {width:.07, tilt:-.6, depth:.8, points:[[-.02,2,0],[.09,2.18,0],[.06,2.36,0],[-.1,2.46,0],[-.28,2.37,0],[-.33,2.18,0],[-.21,2.04,0],[-.02,2,0]]},
];

/** 3 roofs × 3 bowls × 3 tails: 27 original characters, not a translation table. */
export function glyphStrokes(index: number): Stroke[] {
  const n = ((Math.trunc(index) % 27) + 27) % 27;
  const field = Math.floor(n / 9), relation = Math.floor(n / 3) % 3, core = n % 3;
  const roofs: Point[][] = [
    [[-1.8,1.12,0],[-1.45,1.45,0],[-.6,1.51,0],[.24,1.42,0],[1.13,1.53,0],[1.58,1.9,0],[1.43,2.03,0],[.83,1.88,0]],
    [[-1.74,.97,0],[-1.7,1.66,0],[-1.13,2.03,0],[-.25,2.01,0],[.63,1.66,0],[1.31,1.29,0],[1.78,1.4,0]],
    [[-1.8,1.38,0],[-1.14,1.61,0],[-.24,1.47,0],[.62,1.52,0],[1.19,1.96,0],[.85,2.24,0],[.33,2.03,0],[.44,1.57,0],[1.12,1.06,0]],
  ];
  const bowls: Point[][] = [
    [[-1.24,1.39,0],[-1.37,.91,0],[-1.43,.36,0],[-1.24,.02,0],[-.78,.03,0],[-.43,.42,0],[-.6,.69,0],[-.98,.47,0],[-.95,.2,0]],
    [[-1.38,1.39,0],[-1.42,.68,0],[-1.08,.44,0],[-.87,.68,0],[-.79,1.11,0],[-.56,.72,0],[-.58,.24,0],[-.86,-.14,0],[-1.41,-.3,0]],
    [[-1.18,1.48,0],[-1.03,1.11,0],[-.84,.67,0],[-.86,.16,0],[-1.3,-.11,0],[-1.73,.15,0],[-1.79,.7,0],[-1.5,.85,0],[-1.41,.58,0]],
  ];
  const tails: Point[][] = [
    [[.09,1.43,0],[.2,.92,0],[.67,.71,0],[1.08,.84,0],[1.18,1.09,0],[1.39,.85,0],[1.25,.23,0],[.72,-.18,0],[.15,-.28,0],[-.1,-.61,0],[.3,-1.23,0],[1.22,-1.7,0],[1.71,-1.81,0]],
    [[.05,1.43,0],[-.13,.74,0],[.12,.17,0],[.02,-.39,0],[-.36,-.71,0],[-.68,-.48,0],[-.48,-.13,0],[-.05,-.45,0],[.32,-1.1,0],[.83,-1.61,0],[1.42,-1.38,0],[1.39,-.94,0],[1.03,-.87,0]],
    [[.18,1.4,0],[.15,.98,0],[.63,.67,0],[1.12,.44,0],[1.39,.05,0],[1.22,-.39,0],[.79,-.5,0],[.6,-.13,0],[.85,.07,0],[1.09,-.22,0],[.59,-.98,0],[-.14,-1.41,0],[-1.05,-1.78,0]],
  ];
  const s: Stroke[] = [
    {points: roofs[field], width: .105, tilt: -.3 + field * .22, depth: .2},
    {points: bowls[relation], width: .145, tilt: -.65 + relation * .65, depth: -.35},
    {points: tails[core], width: .145, tilt: .75 - core * .65, depth: .45},
  ];
  // A small rising curl and separated round mark echo the manuscript's pen rhythm.
  if (core === 1) s.push({width:.07,tilt:.4,depth:.7,points:[[.68,1.41,0],[.73,1.02,0],[1.06,.87,0],[1.28,.99,0]]});
  const cx = -.45 + relation * .26, cy = field === 2 ? 2.47 : 2.13;
  s.push({width:.035,tilt:.2,depth:.5,points:Array.from({length:13},(_,i)=>[cx+.085*Math.cos(i/12*Math.PI*2),cy+.085*Math.sin(i/12*Math.PI*2),0] as Point)});
  return s;
}
export function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max,value)); }
export function deform(point: Point, t: number, stroke: Stroke, amount: number): Point {
  const p = clamp(amount,0,1), angle = stroke.tilt * p;
  const [x,y,z] = point;
  return [
    x*Math.cos(angle)+z*Math.sin(angle)+p*x*.18,
    y + p*.25*Math.sin(t*Math.PI),
    -x*Math.sin(angle)+z*Math.cos(angle)+p*(stroke.depth+Math.sin(t*Math.PI*2)*.55),
  ];
}
export function strokeWidth(t: number, width: number) {return .004 + width * Math.pow(Math.sin(Math.PI*clamp(t,0,1)),.55) * (.8+.2*Math.sin(t*Math.PI*3));}
export function approach(current: number, target: number, seconds: number) {
  const next = current+(target-current)*(1-Math.exp(-Math.max(0,seconds)*5));
  return Math.abs(next-target)<.0005 ? target : next;
}
