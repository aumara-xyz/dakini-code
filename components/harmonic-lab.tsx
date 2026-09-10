'use client';
import {useEffect,useRef} from 'react';
import {Circle,Square,Play,Pause,Download,Upload,Trash2} from 'lucide-react';
import {coefficients,levelsOf,idOf,HARMONICS,type Trit} from '@/lib/harmonic-model';
import type {useHarmonicLab} from './use-harmonic-lab';
type Lab=ReturnType<typeof useHarmonicLab>;
const COLORS=['#ffc879','#75e5dc','#d6b4ff'];
function Spectrum({lab,id}:{lab:Lab;id:number}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    let frame=0,last=0;const el=canvas.current!;const ctx=el.getContext('2d');if(!ctx)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw=(now:number)=>{
      if(now-last<100){frame=requestAnimationFrame(draw);return;}last=now;
      const width=600,height=160;ctx.clearRect(0,0,width,height);
      ctx.strokeStyle='#b4cff529';ctx.lineWidth=1;
      [40,80,120].forEach(y=>{ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(590,y);ctx.stroke();});
      const predicted=coefficients(id),voice=lab.voice.current;
      const measured=lab.running&&voice?.running;
      const bins=measured?new Float32Array(voice.analyser.frequencyBinCount):null;
      if(bins)voice!.analyser.getFloatFrequencyData(bins);
      for(let k=1;k<=12;k++){
        const axis=HARMONICS.indexOf(k as 4|6|8),x=20+(k-1)*49;
        let magnitude=predicted[k-1]/.6;
        if(bins){
          const center=Math.round(k*lab.base/voice!.context.sampleRate*voice!.analyser.fftSize);
          let peak=-100;for(let i=center-2;i<=center+2;i++)peak=Math.max(peak,bins[i]??-100);
          // Fixed dB scale: no per-frame auto-normalization.
          magnitude=Math.max(0,Math.min(1,(peak+80)/60));
        }
        const h=Math.max(2,magnitude*110);
        ctx.fillStyle=k===1?'#eff4ff':axis>=0?COLORS[axis]:'#bac9e355';
        ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=axis>=0?12:0;
        ctx.fillRect(x,130-h,axis>=0?9:4,h);ctx.shadowBlur=0;
        ctx.fillStyle='#bed0df';ctx.font='20px Arial';ctx.textAlign='center';ctx.fillText(String(k),x+3,155);
      }
      if(measured&&!reduced)frame=requestAnimationFrame(draw);
    };
    let snapshot:ReturnType<typeof setTimeout>|undefined;
    if(reduced&&lab.running)snapshot=setTimeout(()=>draw(1000),350);
    else draw(1000);
    return()=>{cancelAnimationFrame(frame);clearTimeout(snapshot);};
  },[id,lab.base,lab.running,lab.voice,lab.volume]);
  return <figure className="spectrum">
    <figcaption><span>SYNTHESIZED SOUND</span><b>{lab.running?'Live analysis':'Predicted · muted'}</b></figcaption>
    <canvas ref={canvas} width={600} height={160} aria-label={lab.running?'Live frequency spectrum of synthesized sound':'Predicted harmonic spectrum while muted'}/>
    <div className="spectrum-key"><span>Harmonic number</span><span>Base stays at {lab.base} Hz</span></div>
  </figure>;
}
export function HarmonicLab({lab,id}:{lab:Lab;id:number}) {
  const file=useRef<HTMLInputElement>(null),levels=levelsOf(id),t=lab.transport;
  const retained=!!t.score, busy=t.state==='recording'||t.state==='playing'||t.state==='paused';
  return <aside className="lab-panel" aria-label="Harmonic Lab">
    <div className="lab-heading"><p className="about-kicker">A SMALL INSTRUMENT</p><h2>Harmonic Lab</h2><p>Keep the tone. Shape the overtones.</p></div>
    <Spectrum lab={lab} id={id}/>
    <div className="harmonic-levels">
      {HARMONICS.map((harmonic,axis)=><fieldset key={harmonic} style={{'--axis-color':COLORS[axis]} as React.CSSProperties}>
        <legend><b>{['X','Y','Z'][axis]}</b><span>Harmonic {harmonic}</span><em>{harmonic*lab.base} Hz</em></legend>
        <div className="level-options">{([-1,0,1] as Trit[]).map((value,index)=><label key={value} className={levels[axis]===value?'chosen':''}>
          <input type="radio" name={'harmonic-'+harmonic} value={value} checked={levels[axis]===value} onChange={()=>{const next=[...levels];next[axis]=value;lab.choose(idOf(next));}}/>
          {['Soft','Medium','Strong'][index]}
        </label>)}</div>
      </fieldset>)}
    </div>
    <p className="canonical">Canonical X, Y, Z <span>{levels.map(n=>n>0?'+1':String(n)).join(' · ')}</span></p>
    <label className="volume-control"><span>Output</span><input aria-label="Lab output volume" type="range" min="0" max=".5" step=".01" value={lab.volume} onChange={e=>lab.setVolume(Number(e.target.value))}/><output>{Math.round(lab.volume*100)}%</output></label>
    <div className="score-panel">
      <div className="score-heading"><h3>Your score</h3><span>{(t.cursorMs/1000).toFixed(1)} s {t.score?'/ '+(t.score.durationMs/1000).toFixed(1)+' s':'/ 60 s'}</span></div>
      {retained?<><div className="score-strip" aria-label={'Score with '+t.score!.frames.length+' settings'}>
        {t.score!.frames.map((f,i)=><span key={f.tMs} title={'Character '+(f.stateId+1)+' at '+f.tMs/1000+' s'} style={{flex:(t.score!.frames[i+1]?.tMs??t.score!.durationMs)-f.tMs,background:COLORS[Math.floor(f.stateId/9)%3],opacity:.35+(f.stateId%3)*.25}}/>)}
      </div><input className="score-seek" aria-label="Silent score position" type="range" min="0" max={t.score!.durationMs} step="50" value={t.cursorMs} onChange={e=>lab.scrub(Number(e.target.value))}/></>:<p className="score-empty">Give your changes a rhythm.<br/>Record up to one minute of settings.</p>}
      <div className="score-transport">
        {!busy&&<button className="record-button" disabled={retained} onClick={lab.record}><Circle size={14}/>Record settings</button>}
        {(t.state==='recording'||t.state==='playing')&&<button onClick={lab.pause}><Pause size={15}/>Pause</button>}
        {t.state==='paused'&&<button onClick={lab.resume}><Play size={15}/>Resume</button>}
        {busy&&<button onClick={lab.stop}><Square size={14}/>Stop</button>}
        {retained&&t.state==='idle'&&<button className="replay-button" onClick={()=>lab.replay()}><Play size={15}/>Replay</button>}
      </div>
      <div className="score-files">
        <button disabled={!retained||busy} onClick={lab.download}><Download size={14}/>Export</button>
        <button disabled={retained||busy} onClick={()=>file.current?.click()}><Upload size={14}/>Import</button>
        <button disabled={!retained&&!busy} onClick={lab.clear}><Trash2 size={14}/>Clear</button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={e=>{const chosen=e.target.files?.[0];if(chosen)void lab.importFile(chosen);e.target.value='';}}/>
      </div>
      <output className="lab-status">{lab.message||'50 ms steps · settings only · saved on export'}</output>
    </div>
  </aside>;
}
