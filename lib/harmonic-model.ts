/** The instrument mapping is independent of rendered geometry and ambient time. */
export type Trit = -1 | 0 | 1;
export type Levels = [Trit, Trit, Trit];
export const HARMONICS = [4, 6, 8] as const;
export const TRANSITION = .05;
export const DEFAULT_BASE = 140;
export const DEFAULT_VOLUME = .15;
export const MAX_VOLUME = .5;
export const NORMALIZATION = .5 + 3 * .6 + [2,3,5,7,9,10,11,12].reduce((n,k)=>n+.02/k,0);
const signs: Trit[] = [0,1,-1];
export function assertId(id: number) {
  if (!Number.isInteger(id) || id < 0 || id > 26) throw new Error('Character must be an integer from 0 to 26.');
}
export function levelsOf(id: number): Levels {
  assertId(id);
  return [signs[Math.floor(id/3)%3], signs[Math.floor(id/9)], signs[id%3]];
}
export function idOf(levels: readonly number[]) {
  if (levels.length!==3 || levels.some(n=>!Number.isInteger(n)||!signs.includes(n as Trit))) throw new Error('Each level must be −1, 0, or +1.');
  return 9*signs.indexOf(levels[1] as Trit)+3*signs.indexOf(levels[0] as Trit)+signs.indexOf(levels[2] as Trit);
}
export function amplitude(level: Trit) { return level===-1?.1:level===0?.3:.6; }
export function coefficients(id: number) {
  const levels = levelsOf(id);
  return Array.from({length:12},(_,i)=>{
    const k=i+1, axis=HARMONICS.indexOf(k as 4|6|8);
    return k===1?.5:axis>=0?amplitude(levels[axis]):.02/k;
  });
}
export function frequencies(base=DEFAULT_BASE) {
  if(!Number.isFinite(base)||base<80||base>240) throw new Error('Base tone must be between 80 and 240 Hz.');
  return Array.from({length:12},(_,i)=>base*(i+1));
}
/** Explicit linear envelopes also support browsers without cancelAndHoldAtTime. */
export class Envelope {
  private segments: {start:number; end:number; from:number; to:number}[]=[];
  private initial: number;
  constructor(initial:number) { this.initial=initial; }
  at(time:number) {
    let value=this.initial;
    for(const s of this.segments){if(time<s.start)break;if(time<s.end)return s.from+(s.to-s.from)*(time-s.start)/(s.end-s.start);value=s.to;}
    return value;
  }
  ramp(time:number,target:number,seconds=TRANSITION) {
    const from=this.at(time);
    this.segments=this.segments.filter(s=>s.start<time).map(s=>s.end>time?{...s,end:time,to:from}:s);
    this.segments.push({start:time,end:time+seconds,from,to:target});
    return from;
  }
}
