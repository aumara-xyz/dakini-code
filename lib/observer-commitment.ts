import {assertTrits,type Trit} from './observer-code.ts';
export const DIGEST_DIGITS=92, DIGEST_SLOTS=108, PADDING=16;
const SEVEN=BigInt(7),ZERO=BigInt(0),LIMIT=BigInt(2)**BigInt(256);
/** Fixed domain separator, followed by 54 bytes: −1→2, 0→0, +1→1. */
export function canonicalBytes(word:readonly Trit[]):Uint8Array<ArrayBuffer> {
  assertTrits(word,54);const prefix=new TextEncoder().encode('dakini.observer.v1\0');
  const bytes=new Uint8Array(prefix.length+54);bytes.set(prefix);bytes.set(word.map(v=>v===-1?2:v),prefix.length);return bytes;
}
export function hex(bytes:Uint8Array):string {return Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');}
export function digestToCells(bytes:Uint8Array):number[] {
  if(!(bytes instanceof Uint8Array)||bytes.length!==32)throw new Error('A digest must contain exactly 32 bytes.');
  let n=BigInt('0x'+hex(bytes));const digits:number[]=Array(108).fill(0);
  for(let i=107;i>=16;i--){digits[i]=Number(n%SEVEN);n/=SEVEN;}return digits;
}
export function cellsToDigest(digits:readonly number[]):Uint8Array<ArrayBuffer> {
  if(!Array.isArray(digits)||digits.length!==108||Array.from(digits).some(n=>!Number.isInteger(n)||n<0||n>6)||digits.slice(0,16).some(n=>n!==0))throw new Error('Expected 108 base-seven cells with 16 leading padding zeros.');
  const n=digits.reduce((value,digit)=>value*SEVEN+BigInt(digit),ZERO);
  if(n>=LIMIT)throw new Error('Digest value exceeds 256 bits.');
  const encoded=n.toString(16).padStart(64,'0');return Uint8Array.from({length:32},(_,i)=>parseInt(encoded.slice(i*2,i*2+2),16));
}
export async function hashWord(word:readonly Trit[]):Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256',canonicalBytes(word)));
}
export type Reference={digest:string;signature:Uint8Array<ArrayBuffer>;publicKey:CryptoKey};
/** Ephemeral demonstration signer. Only the public verifier key leaves this function. */
export async function sealReference(word:readonly Trit[]):Promise<Reference> {
  const bytes=canonicalBytes(word);
  const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
  const signature=new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},keys.privateKey,bytes));
  return {digest:hex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))),signature,publicKey:keys.publicKey};
}
export async function verifyReference(word:readonly Trit[],reference:Reference) {
  const bytes=canonicalBytes(word);
  const [digest,signatureValid]=await Promise.all([
    crypto.subtle.digest('SHA-256',bytes),
    crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},reference.publicKey,reference.signature,bytes),
  ]);
  const actual=new Uint8Array(digest);return {digest:actual,matches:hex(actual)===reference.digest,signatureValid};
}
