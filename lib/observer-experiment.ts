import {encode,syndrome,changeSymbol,cornerCollision,sampleCube,singleErrorCandidate,FACES,readFace,reconstructFace,balanced,type Trit} from './observer-code.ts';
import {digestToCells,cellsToDigest,sealReference,verifyReference,hex,hashWord} from './observer-commitment.ts';
export type CheckResult={name:string;detail:string;passed:boolean};
function insist(value:unknown,message:string):asserts value {if(!value)throw new Error(message);}
const same=(a:readonly number[]|Uint8Array,b:readonly number[]|Uint8Array)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
/** Bounded, deterministic experiment; reusable in Node and a browser worker. */
export async function runObserverChecks():Promise<CheckResult[]> {
  const results:CheckResult[]=[];
  async function check(name:string,fn:()=>string|Promise<string>){try{results.push({name,detail:await fn(),passed:true});}catch(e){results.push({name,detail:e instanceof Error?e.message:String(e),passed:false});}}
  await check('204,264 error patterns',()=>{
    // Independent parity-check columns, using direct coordinate arithmetic.
    const columns=Array.from({length:54},(_,i)=>{
      const c:number[]=Array(27).fill(0);
      if(i>=27)c[i-27]=-1;else{const x=i%3,y=Math.floor(i/3)%3,z=Math.floor(i/9);c[y+3*z]=1;c[9+x+3*z]=1;c[18+x+3*y]=1;}return c;
    });
    const zero:Trit[]=Array(54).fill(0),single=new Set<string>();
    for(let i=0;i<54;i++)for(const d of [-1,1] as Trit[]){
      const expected=columns[i].map(v=>balanced(v*d));
      insist(same(expected,syndrome(changeSymbol(zero,i,d))),'Implementation differs from independent check matrix.');single.add(expected.join(','));
    }
    insist(single.size===108,'Single-error syndromes must be distinct.');
    let doubles=0,triples=0,mimics=0;
    for(let i=0;i<54;i++)for(let j=i+1;j<54;j++)for(const a of [-1,1])for(const b of [-1,1]){
      const pair=columns[i].map((v,k)=>balanced(v*a+columns[j][k]*b));
      insist(pair.some(Boolean),'Undetected double error.');insist(!single.has(pair.join(',')),'Double error mimics a single error.');doubles++;
      for(let k=j+1;k<54;k++)for(const c of [-1,1]){
        const triple=pair.map((v,l)=>balanced(v+columns[k][l]*c));
        insist(triple.some(Boolean),'Undetected triple error.');if(single.has(triple.join(',')))mimics++;triples++;
      }
    }
    insist(doubles===5724&&triples===198432&&mimics===216,'Unexpected exhaustive totals.');
    return '108 single + 5,724 double + 198,432 triple errors detected. 216 triple errors imitate a single error.';
  });
  await check('Parity limits reproduced',()=>{
    const original=encode(Array(27).fill(0));let coordinated=changeSymbol(original,0);
    [27,36,45].forEach(i=>{coordinated=changeSymbol(coordinated,i);});
    insist(syndrome(coordinated).every(v=>v===0),'Four-change counterexample did not pass parity.');
    const collision=[...cornerCollision(original.slice(0,27)),...original.slice(27)];
    insist(collision.filter(Boolean).length===8&&syndrome(collision).every(v=>v===0),'Eight-corner collision did not reproduce.');
    let ambiguous=original;[27,36,45].forEach(i=>{ambiguous=changeSymbol(ambiguous,i,-1);});
    const guess=singleErrorCandidate(ambiguous);insist(guess?.index===0&&guess.delta===1,'Ambiguous diagnosis did not reproduce.');
    const mistakenRepair=changeSymbol(ambiguous,guess.index,-guess.delta as Trit);
    insist(syndrome(mistakenRepair).every(v=>v===0)&&!same(mistakenRepair,original),'Mistaken repair should produce a different valid codeword.');
    return 'Four coordinated changes and an eight-cell source collision pass parity. A repair guess can produce the wrong valid cube.';
  });
  await check('All six faces reconstruct',()=>{
    let seed=0xdecafbad,count=0;
    for(let n=0;n<256;n++){
      const source=Array.from({length:27},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return balanced(seed%3);});
      for(const face of FACES){insist(same(source,reconstructFace(readFace(source,face),face)),'Face round-trip lost source information.');count++;}
      insist(syndrome(encode(source)).every(v=>v===0),'Encoded cube failed its own parity.');
    }
    return `${count.toLocaleString('en-US')} exact round-trips over 256 deterministic source cubes. Depth is explicitly encoded.`;
  });
  await check('Digest capacity and round-trip',()=>{
    insist(BigInt(7)**BigInt(91)<BigInt(2)**BigInt(256)&&BigInt(7)**BigInt(92)>=BigInt(2)**BigInt(256),'Incorrect digit capacity.');
    const vectors=[new Uint8Array(32),new Uint8Array(32).fill(255)];
    for(let i=0;i<256;i++){const b=new Uint8Array(32);b[Math.floor(i/8)]=1<<(i%8);vectors.push(b);}
    for(const bytes of vectors){const cells=digestToCells(bytes);insist(cells.slice(0,16).every(v=>v===0),'Nonzero padding.');insist(same(cellsToDigest(cells),bytes),'Digest round-trip lost bytes.');}
    return '258 exact 32-byte round-trips, including every single-bit digest. 92 digits required; four cubes supply 108 slots.';
  });
  await check('Signature checks actual bytes',async()=>{
    const word=encode(sampleCube()),ref=await sealReference(word),valid=await verifyReference(word,ref);
    insist(valid.matches&&valid.signatureValid,'Original signed reference did not verify.');
    const changedSource=[...word.slice(0,27)];changedSource[0]=balanced(changedSource[0]+1);const replacement=encode(changedSource);
    insist(syndrome(replacement).every(v=>v===0),'Replacement should be a valid parity codeword.');
    const replaced=await verifyReference(replacement,ref);insist(!replaced.matches&&!replaced.signatureValid,'Changed codeword incorrectly matched reference.');
    const newHash=hex(await hashWord(replacement));const substituted=await verifyReference(replacement,{...ref,digest:newHash});
    insist(substituted.matches&&!substituted.signatureValid,'Recomputed digest must not forge a signature.');
    const other=await sealReference(word),wrongKey=await verifyReference(word,{...ref,publicKey:other.publicKey});
    insist(!wrongKey.signatureValid,'Unrelated verifier key accepted signature.');
    const damaged=new Uint8Array(ref.signature);damaged[0]^=1;
    insist(!(await verifyReference(word,{...ref,signature:damaged})).signatureValid,'Damaged signature accepted.');
    return 'Original accepted; replacement, recomputed-hash substitution, wrong key, and damaged signature rejected by the held verifier key.';
  });
  return results;
}
