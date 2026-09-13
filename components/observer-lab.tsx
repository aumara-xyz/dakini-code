'use client';
import {useEffect,useRef,useState} from 'react';
import {RotateCcw,Check,ArrowRight,ShieldCheck,FlaskConical} from 'lucide-react';
import {balanced,checksFor,coordinates,encode,syndrome,changeSymbol,singleErrorCandidate,sampleCube,cornerCollision,readFace,reconstructFace,FACES,type Face,type Trit} from '@/lib/observer-code';
import {sealReference,verifyReference,digestToCells,cellsToDigest,hex,type Reference} from '@/lib/observer-commitment';
import {glyphStrokes} from '@/lib/glyph';
const COLORS=['#75e5dc','#ffc879','#d6b4ff'];
const show=(v:number)=>v>0?'+1':v<0?'−1':'0';
function Glyph({id}:{id:number}) {
  return <svg viewBox="-2 -2.7 4 5" aria-hidden="true">{glyphStrokes(id).map((s,i)=>{
    const p=s.points;let d=`M ${p[0][0]},${-p[0][1]}`;
    for(let j=1;j<p.length-1;j++)d+=` Q ${p[j][0]},${-p[j][1]} ${(p[j][0]+p[j+1][0])/2},${-(p[j][1]+p[j+1][1])/2}`;
    return <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={s.width} strokeLinecap="round"/>;
  })}</svg>;
}
function Cube({source,selected,changed,onSelect}:{source:Trit[];selected:number;changed:number[];onSelect:(i:number)=>void}) {
  return <svg className="observer-cube" viewBox="0 0 460 450" role="group" aria-label="27 source cells, arranged as three floating layers">
    {[2,1,0].map(z=><g key={z}>
      <text x="18" y={83+(2-z)*121} className="cube-layer-label">Z {z-1}</text>
      {Array.from({length:9},(_,j)=>{
        const x=j%3,y=Math.floor(j/3),i=x+3*y+9*z,cx=230+(x-y)*56,cy=35+(2-z)*121+(x+y)*23,value=source[i];
        return <g key={i} role="button" tabIndex={0} aria-label={`Source cell ${i+1}, ${show(value)}`} aria-pressed={selected===i}
          className={'observer-cell'+(selected===i?' selected':'')+(changed.includes(i)?' changed':'')}
          style={{color:COLORS[value+1]}} onClick={()=>onSelect(i)} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&!e.repeat){e.preventDefault();onSelect(i);}}}>
          <path d={`M${cx},${cy}l51,21 -51,21 -51,-21z`} className="cell-top"/>
          <path d={`M${cx-51},${cy+21}l51,21 51,-21v12l-51,21 -51,-21z`} className="cell-depth"/>
          <text x={cx} y={cy+26} textAnchor="middle">{show(value)}</text>
        </g>;
      })}
    </g>)}
  </svg>;
}
export function ObserverLab({active,onSymbol}:{active:boolean;onSymbol:(id:number)=>void}) {
  const [word,setWord]=useState<Trit[]>(()=>encode(sampleCube()));
  const [referenceWord,setReferenceWord]=useState<Trit[]>(()=>encode(sampleCube()));
  const [reference,setReference]=useState<Reference|null>(null),[selected,setSelected]=useState(13),[face,setFace]=useState<Face>('+Z');
  const [message,setMessage]=useState('Choose a cell, then change it. Watch which checks respond.');
  const [verification,setVerification]=useState<{digest:Uint8Array<ArrayBuffer>;matches:boolean;signatureValid:boolean}|null>(null);
  const [error,setError]=useState(''),[sealing,setSealing]=useState(false);
  const [report,setReport]=useState<{name:string;detail:string;passed:boolean}[]|null>(null),[testing,setTesting]=useState(false);
  const worker=useRef<Worker|null>(null),sealGeneration=useRef(0),alive=useRef(true);
  const source=word.slice(0,27),checks=syndrome(word),failed=checks.filter(Boolean).length;
  const changed=word.flatMap((v,i)=>v!==referenceWord[i]?[i]:[]),candidate=singleErrorCandidate(word);
  const screen=readFace(source,face),roundTrip=reconstructFace(screen,face).every((v,i)=>v===source[i]);
  const digits=verification?digestToCells(verification.digest):null;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;++sealGeneration.current;worker.current?.terminate();};},[]);
  useEffect(()=>{
    if(!reference)return;let cancelled=false;
    verifyReference(word,reference).then(result=>{if(!cancelled)setVerification(result);}).catch(()=>{if(!cancelled){setVerification(null);setError('Verification unavailable in this browser.');}});
    return()=>{cancelled=true;};
  },[word,reference]);
  useEffect(()=>{if(!active){worker.current?.terminate();worker.current=null;setTesting(false);}},[active]);
  async function seal() {
    const captured=[...word],generation=++sealGeneration.current;setSealing(true);setError('');
    try{const ref=await sealReference(captured);if(alive.current&&generation===sealGeneration.current){setReference(ref);setReferenceWord(captured);setVerification(null);setMessage('Reference signed with a fresh local demonstration key. Now try changing the cube.');}}
    catch{if(alive.current)setError('Signing requires Web Crypto on HTTPS or localhost.');}
    finally{if(alive.current&&generation===sealGeneration.current)setSealing(false);}
  }
  function change(next:Trit[],text:string){setWord(next);setVerification(null);setMessage(text);}
  function experiment(kind:'single'|'recode'|'collision'|'ambiguous') {
    let next=[...referenceWord];
    if(kind==='single'){next=changeSymbol(next,selected);change(next,'One source symbol changed. Its three axis checks now disagree.');}
    if(kind==='recode'){const s=next.slice(0,27);s[selected]=balanced(s[selected]+1);change(encode(s),'Source and parity changed together. Consistency passes. '+(reference?'Compare the saved digest and signature below.':'Restore, then keep a reference to test a signed comparison.'));}
    if(kind==='collision')change([...cornerCollision(next.slice(0,27)),...next.slice(27)],'Eight source cells changed, but every line sum stayed the same. '+(reference?'Compare the saved digest and signature below.':'Restore, then keep a reference to test a signed comparison.'));
    if(kind==='ambiguous'){checksFor(selected).forEach(i=>{next=changeSymbol(next,i+27,-1);});change(next,'Only three parity symbols changed. They imitate a single source error, so automatic repair could damage intact data.');}
  }
  function runTests(){
    if(worker.current)return;setTesting(true);setReport(null);setError('');
    try{
      const w=new Worker(new URL('../lib/observer-worker.ts',import.meta.url),{type:'module'});worker.current=w;
      w.onmessage=e=>{setReport(e.data);setTesting(false);w.terminate();worker.current=null;};
      w.onerror=()=>{setError('The checks could not finish. Try again.');setTesting(false);w.terminate();worker.current=null;};w.postMessage('run');
    }catch{worker.current?.terminate();worker.current=null;setTesting(false);setError('The checks could not start. Try again in a browser that allows workers.');}
  }
  function downloadReport(){
    if(!report)return;const blob=new Blob([JSON.stringify({experiment:'dakini.observer.v1',results:report},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dakini-observer-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return <section className="observer-lab" hidden={!active} aria-label="Observer Lab">
    <div className="observer-world">
      <div className="observer-title"><p className="about-kicker">FORM · INFORMATION · EVIDENCE</p><h2>What changed?</h2><p>27 source cells. Three directions of checks.</p></div>
      <div className="observer-geometry">
        <div className="source-field"><Cube source={source} selected={selected} changed={changed} onSelect={setSelected}/>
          <div className="cell-editor"><span>Cell {selected+1} <small>{coordinates(selected).map(v=>v-1).join(' · ')}</small></span><button onClick={()=>change(changeSymbol(word,selected),'Changed one source symbol. Stored parity remains as it was.')}>Change {show(source[selected])} <ArrowRight size={15}/></button></div>
        </div>
        <div className="parity-field" aria-label="27 stored parity checks">
          {['X','Y','Z'].map((axis,a)=><div className="parity-plane" key={axis} style={{'--plane-color':COLORS[a]} as React.CSSProperties}>
            <h3>{axis}<span>{a===0?'Across':a===1?'Through':'Between'} the layers</span></h3>
            <div>{word.slice(27+a*9,36+a*9).map((v,i)=>{const p=a*9+i;return <button key={i} aria-label={`${axis} parity ${i+1}, ${show(v)}, ${checks[p]?'mismatch':'matches'}`} title="Change this stored parity symbol"
              className={(checks[p]?'mismatch ':'')+(checksFor(selected).includes(p)?'connected':'')} onClick={()=>change(changeSymbol(word,p+27),'Changed one stored parity symbol. The source cells remain untouched.')}>{show(v)}{checks[p]!==0&&<span className="mismatch-dot"/>}</button>;})}</div>
          </div>)}
        </div>
      </div>
      <div className="observer-readout" aria-live="polite"><span className={failed?'check-failed':'check-passed'}>{failed?`${failed} checks disagree`:'All checks agree'}</span><span>{changed.length} / 54 symbols changed</span></div>
      <p className="observer-message" role="status">{message}</p>
      <div className="observer-actions"><button className="observer-primary" onClick={seal} disabled={sealing||failed>0}><ShieldCheck size={16}/>{sealing?'Signing…':reference?'Keep as new reference':'Keep as reference'}</button><button onClick={()=>change([...referenceWord],'Restored the reference cube.')}><RotateCcw size={15}/>Restore</button></div>
      <details className="observer-views"><summary>Read it from any face <span>9 glyphs → 27 trits</span></summary>
        <div className="face-switch" aria-label="Reading face">{FACES.map(f=><button key={f} aria-pressed={face===f} onClick={()=>setFace(f)}>{f}</button>)}</div>
        <div className="ray-glyphs">{screen.map((id,i)=><button key={i} onClick={()=>onSymbol(id)} aria-label={`Ray ${i+1}, glyph ${id+1}`}><Glyph id={id}/><span>{String(id+1).padStart(2,'0')}</span></button>)}</div>
        <p>{roundTrip?'All 27 cells reconstructed exactly.':'Reconstruction failed.'} Each glyph carries three ordered trits, preserving depth.</p>
      </details>
    </div>
    <aside className="observer-inspector">
      <div className="observer-inspector-title"><FlaskConical size={18}/><h3>Try the limits</h3></div>
      <p>Each experiment starts from the reference cube.</p>
      <div className="observer-cases">
        <button onClick={()=>experiment('single')}><b>01</b><span>Change one cell<small>Three checks respond.</small></span><ArrowRight size={16}/></button>
        <button onClick={()=>experiment('recode')}><b>02</b><span>Change it with its checks<small>Four changes. Consistency passes.</small></span><ArrowRight size={16}/></button>
        <button onClick={()=>experiment('collision')}><b>03</b><span>Hide eight changes<small>Different cube. Identical parity.</small></span><ArrowRight size={16}/></button>
        <button onClick={()=>experiment('ambiguous')}><b>04</b><span>Mislead a repair guess<small>Three check errors imitate one cell.</small></span><ArrowRight size={16}/></button>
      </div>
      <div className="observer-verdict">
        <div><span>Consistency</span><b className={failed?'check-failed':'check-passed'}>{failed?'Mismatch':'Pass'}</b></div>
        <div><span>Reference digest</span><b>{!reference?'Not set':!verification?'Checking…':verification.matches?'Match':'Different'}</b></div>
        <div><span>Reference signature</span><b>{!reference?'Not set':!verification?'Checking…':verification.signatureValid?'Valid':'Invalid'}</b></div>
        {candidate&&<p className="candidate-note">Single-error hypothesis: {candidate.index<27?'source cell '+(candidate.index+1):'parity cell '+(candidate.index-26)}. This is a candidate, not an instruction to repair.</p>}
        <p className="observer-trust-note">“Keep as reference” creates a local demonstration signature. Its verification key stays fixed while you edit. This does not establish a person’s identity or authorize an Aukora action.</p>
      </div>
      <details className="digest-detail"><summary>One digest, four cubes <span>92 symbols + 16 padding</span></summary>
        {digits?<><div className="digest-cubes" aria-label="108 base-seven digest cells">{[0,1,2,3].map(c=><div key={c}>{digits.slice(c*27,c*27+27).map((d,i)=><span key={i} title={`${c*27+i<16?'Padding':'Digit'} ${c*27+i+1}: ${d}`} className={c*27+i<16?'padding':''} style={{'--digit-color':['#1d3441','#679fbc','#75e5dc','#bddf9e','#ffc879','#efa398','#d6b4ff'][d]} as React.CSSProperties}>{d}</span>)}</div>)}</div><code>{hex(verification!.digest)}</code><p><Check size={13}/>{hex(cellsToDigest(digits))===hex(verification!.digest)?'32 original bytes recovered exactly.':'Round-trip failed.'}</p></>:<p>Keep a reference to generate a digest.</p>}
        <p>Seven-state cells are used here. The cube above uses three-state cells. This is a lossless display, with extra space for the cube layout.</p>
      </details>
      <div className="observer-test-panel"><button onClick={runTests} disabled={testing}><FlaskConical size={15}/>{testing?'Running exhaustive checks…':'Run the checks'}</button>
        {report&&<><ul>{report.map(row=><li key={row.name} className={row.passed?'check-passed':'check-failed'}><b>{row.passed?'PASS':'FAIL'} · {row.name}</b><span>{row.detail}</span></li>)}</ul><button onClick={downloadReport}>Export test results</button></>}
        <p>Runs locally, including every one-, two-, and three-symbol error pattern. No model calls.</p>
      </div>
      {error&&<p role="alert" className="check-failed">{error}</p>}
    </aside>
  </section>;
}
