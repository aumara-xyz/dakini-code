import type {Trit} from './harmonic-model.ts';
export type {Trit};
export type Face = '+X'|'-X'|'+Y'|'-Y'|'+Z'|'-Z';
export const FACES: Face[] = ['+X','-X','+Y','-Y','+Z','-Z'];
export const CELL_COUNT = 27;
export const WORD_COUNT = 54;
export function balanced(n:number):Trit {const r=((n%3)+3)%3;return (r===2?-1:r) as Trit;}
export function assertTrits(values:readonly number[],length:number) {
  if(!Array.isArray(values)||values.length!==length||Array.from(values).some(v=>v!==-1&&v!==0&&v!==1))throw new Error(`Expected ${length} ternary values.`);
}
export function coordinates(i:number):[number,number,number] {
  if(!Number.isInteger(i)||i<0||i>=27)throw new Error('Cell must be from 0 to 26.');
  return [i%3,Math.floor(i/3)%3,Math.floor(i/9)];
}
export function checksFor(i:number):number[] {const [x,y,z]=coordinates(i);return [y+3*z,9+x+3*z,18+x+3*y];}
export function parity(source:readonly Trit[]):Trit[] {
  assertTrits(source,27);const sums:number[]=Array(27).fill(0);
  source.forEach((value,i)=>checksFor(i).forEach(line=>{sums[line]+=value;}));
  return sums.map(balanced);
}
export function encode(source:readonly Trit[]):Trit[] {return [...source,...parity(source)];}
export function syndrome(word:readonly Trit[]):Trit[] {
  assertTrits(word,54);return parity(word.slice(0,27)).map((v,i)=>balanced(v-word[i+27]));
}
export function changeSymbol(word:readonly Trit[],index:number,delta:Trit=1):Trit[] {
  assertTrits(word,54);if(!Number.isInteger(index)||index<0||index>=54||![-1,1].includes(delta))throw new Error('Invalid symbol change.');
  return word.map((v,i)=>i===index?balanced(v+delta):v);
}
export function singleErrorCandidate(word:readonly Trit[]):{index:number;delta:Trit}|null {
  const actual=syndrome(word);if(actual.every(v=>v===0))return null;
  for(let i=0;i<54;i++)for(const delta of [-1,1] as Trit[]){
    const expected=syndrome(changeSymbol(Array(54).fill(0),i,delta));
    if(expected.every((v,j)=>v===actual[j]))return {index:i,delta};
  }
  return null;
}
export function sampleCube(seed=4):Trit[] {
  return Array.from({length:27},(_,i)=>{const[x,y,z]=coordinates(i);return balanced(x*y+y*z+z*x+seed+x);});
}
/** Depth is retained as three ordered base-three digits in each ray. */
export function rays(face:Face):number[][] {
  if(!FACES.includes(face))throw new Error('Unknown face.');
  const axis='XYZ'.indexOf(face[1]),u=(axis+1)%3,v=(axis+2)%3,positive=face[0]==='+';
  return Array.from({length:9},(_,i)=>Array.from({length:3},(_,depth)=>{
    const c=[0,0,0];c[axis]=positive?2-depth:depth;c[u]=positive?i%3:2-i%3;c[v]=Math.floor(i/3);
    return c[0]+3*c[1]+9*c[2];
  }));
}
const DIGITS:Trit[]=[0,1,-1];
export function readFace(source:readonly Trit[],face:Face):number[] {
  assertTrits(source,27);return rays(face).map(ray=>ray.reduce((n,i)=>n*3+DIGITS.indexOf(source[i]),0));
}
export function reconstructFace(screen:readonly number[],face:Face):Trit[] {
  if(!Array.isArray(screen)||screen.length!==9||Array.from(screen).some(n=>!Number.isInteger(n)||n<0||n>26))throw new Error('Expected nine base-27 symbols.');
  const source:Trit[]=Array(27).fill(0);
  rays(face).forEach((ray,i)=>ray.forEach((cell,depth)=>{source[cell]=DIGITS[Math.floor(screen[i]/3**(2-depth))%3];}));return source;
}
/** A source-only collision: alternating signs on the eight corners of a 2×2×2 block. */
export function cornerCollision(source:readonly Trit[]):Trit[] {
  assertTrits(source,27);return source.map((v,i)=>{const[x,y,z]=coordinates(i);return x<2&&y<2&&z<2?balanced(v+((-1)**(x+y+z))):v;});
}
