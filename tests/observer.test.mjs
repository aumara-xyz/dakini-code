import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {encode,syndrome,parity,changeSymbol,balanced,readFace,reconstructFace,sampleCube,FACES,checksFor,assertTrits} from '../lib/observer-code.ts';
import {canonicalBytes,hashWord,digestToCells,cellsToDigest,hex} from '../lib/observer-commitment.ts';
import {runObserverChecks} from '../lib/observer-experiment.ts';

test('observer: exhaustive distance, counterexamples, face reconstruction, digest capacity and signature checks',async()=>{
  const results=await runObserverChecks();
  for(const row of results)assert.equal(row.passed,true,row.name+': '+row.detail);
  assert.equal(results.length,5);
});
test('observer: each independent source change has four encoded differences and three stale checks',()=>{
  const source=sampleCube(),word=encode(source);
  for(let i=0;i<27;i++)for(const delta of [-1,1]){
    const changed=changeSymbol(word,i,delta);
    assert.equal(syndrome(changed).filter(Boolean).length,3);
    const recoded=encode(changed.slice(0,27));
    assert.deepEqual(recoded.flatMap((v,j)=>v!==word[j]?[j]:[]),[i,...checksFor(i).map(n=>n+27)].sort((a,b)=>a-b));
  }
});
test('observer: GF(3) linearity and canonical source ordering',()=>{
  const a=sampleCube(1),b=sampleCube(2),sum=a.map((v,i)=>balanced(v+b[i]));
  assert.deepEqual(parity(sum),parity(a).map((v,i)=>balanced(v+parity(b)[i])));
  const source=Array(27).fill(0);source[0]=1;
  assert.deepEqual(parity(source),Array.from({length:27},(_,i)=>[0,9,18].includes(i)?1:0));
  for(const face of FACES)assert.deepEqual(reconstructFace(readFace(source,face),face),source);
});
test('observer: canonical commitment agrees with independent Node SHA-256',async()=>{
  const word=encode(sampleCube());
  const independent=Buffer.concat([Buffer.from('dakini.observer.v1\0'),Buffer.from(word.map(v=>(v+3)%3))]);
  assert.deepEqual(Buffer.from(canonicalBytes(word)),independent);
  assert.equal(hex(await hashWord(word)),createHash('sha256').update(independent).digest('hex'));
});
test('observer: malformed trits, faces, and digest representations refuse before interpretation',()=>{
  for(const values of [[],Array(26).fill(0),Array(28).fill(0),Array(27),Array(27).fill(2),Array(27).fill(NaN)])assert.throws(()=>assertTrits(values,27));
  assert.throws(()=>changeSymbol(Array(54).fill(0),54));
  assert.throws(()=>changeSymbol(Array(54).fill(0),0,0));
  assert.throws(()=>readFace(Array(27).fill(0),'W'));
  for(const input of [Array(9),Array(9).fill(27),Array(8).fill(0),Array(9).fill(.5)])assert.throws(()=>reconstructFace(input,'+X'));
  for(const input of [Array(108),Array(107).fill(0),Array(108).fill(7),Array(108).fill(-1),Array(108).fill(.5),[1,...Array(107).fill(0)],[...Array(16).fill(0),...Array(92).fill(6)]])assert.throws(()=>cellsToDigest(input));
  assert.throws(()=>digestToCells(new Uint8Array(31)));
  assert.throws(()=>digestToCells(new Uint8Array(33)));
});
