'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Box,ChevronLeft,ChevronRight,RotateCcw,Volume2,VolumeX,Plus,Minus} from 'lucide-react';
import {Toggle} from '@/components/ui/toggle';
import {AboutDakiniCode} from '@/app/about';
import {HarmonicLab} from '@/components/harmonic-lab';
import {useHarmonicLab} from '@/components/use-harmonic-lab';
import {ObserverLab} from '@/components/observer-lab';
import type {Space} from '@/lib/space';

export default function Home(){
  const host=useRef<HTMLDivElement>(null),space=useRef<Space|null>(null),openRef=useRef(false),characterRef=useRef(4);
  const [open,setOpen]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const [character,setCharacter]=useState(4),[cube,setCube]=useState(true),[sound,setSound]=useState(false),[audioBusy,setAudioBusy]=useState(false),[audioError,setAudioError]=useState(false);
  const [mode,setMode]=useState<'ambient'|'lab'|'observer'>('ambient');
  const modeRef=useRef(mode),request=useRef(0),mounted=useRef(true),busyRef=useRef(false);
  const toggle=useCallback(()=>{const next=!openRef.current;openRef.current=next;setOpen(next);space.current?.setUnfolded(next);},[]);
  const reset=useCallback(()=>{openRef.current=false;setOpen(false);space.current?.reset();},[]);
  const select=useCallback((id:number)=>{characterRef.current=id;setCharacter(id);space.current?.select(id);},[]);
  const lab=useHarmonicLab(4,select,()=>{if(modeRef.current==='lab')setSound(false);});
  const choose=(direction:number)=>{
    const next=(characterRef.current+direction+27)%27;
    if(modeRef.current==='lab')lab.choose(next);else select(next);
  };
  useEffect(()=>{
    let disposed=false;mounted.current=true;
    const invalidateAudio=()=>{++request.current;};
    import('@/lib/space').then(({createSpace})=>{
      if(disposed||!host.current)return;
      space.current=createSpace(host.current,toggle);space.current.select(characterRef.current);space.current.setUnfolded(openRef.current);setReady(true);
    }).catch(error=>{console.error('Glyph rendering failed',error);setFailed(true);});
    return()=>{disposed=true;mounted.current=false;invalidateAudio();space.current?.dispose();space.current=null;};
  },[toggle]);
  const audio=async(next:boolean)=>{
    if(busyRef.current)return;
    const token=++request.current;busyRef.current=true;setAudioBusy(true);setAudioError(false);
    try{
      const active=modeRef.current==='lab'?await lab.setSound(next):await space.current?.setSound(next)??false;
      if(mounted.current&&token===request.current){setSound(active);setAudioError(next&&!active);}
    }catch{if(mounted.current){setSound(false);setAudioError(true);}}
    finally{busyRef.current=false;if(mounted.current)setAudioBusy(false);}
  };
  const changeMode=async(next:'ambient'|'lab'|'observer')=>{
    if(next===modeRef.current||busyRef.current)return;
    const token=++request.current,wasOn=sound;
    busyRef.current=true;setAudioBusy(true);setSound(false);setAudioError(false);
    try{
      if(modeRef.current==='ambient'){
        await space.current?.setSound(false);
        // Ambient's existing exponential fade suspends at 250 ms.
        await new Promise(resolve=>setTimeout(resolve,280));
      }else await lab.setSound(false);
      if(!mounted.current||token!==request.current)return;
      modeRef.current=next;setMode(next);
      if(next==='lab')lab.choose(characterRef.current);
      if(wasOn&&next!=='observer'&&!document.hidden&&document.documentElement.dataset.surfaceActive!=='false'){
        const active=next==='lab'?await lab.setSound(true):await space.current?.setSound(true)??false;
        if(mounted.current&&token===request.current){setSound(active);setAudioError(!active);}
      }
    }catch{if(mounted.current)setAudioError(true);}
    finally{busyRef.current=false;if(mounted.current)setAudioBusy(false);}
  };
  return <main className={'space-study'+(mode==='lab'?' lab-enabled':'')+(mode==='observer'?' observer-enabled':'')} data-sound-mode={mode}>
    <header>DAKINI CODE</header>
    <AboutDakiniCode/>
    <button className="reset" disabled={!ready} onClick={reset} aria-label="Reset view and cube" title="Reset view and cube"><RotateCcw size={18}/></button>
    <div className="mode-switch" aria-label="Explore Dakini">
      <button aria-pressed={mode==='ambient'} disabled={audioBusy} onClick={()=>void changeMode('ambient')}>Ambient</button>
      <button aria-pressed={mode==='lab'} disabled={audioBusy} onClick={()=>void changeMode('lab')}>Harmonic Lab</button>
      <button aria-pressed={mode==='observer'} disabled={audioBusy} onClick={()=>void changeMode('observer')}>Observer</button>
    </div>
    <div className="glyph-space" ref={host} data-testid="glyph-space" aria-hidden={mode==='observer'} inert={mode==='observer'}/>
    {failed&&<div className="render-error" role="alert"><p>The 3D view could not start.</p><button onClick={()=>location.reload()}>Try again</button><span>Hardware acceleration needs to be enabled in your browser.</span></div>}
    <div className="simple-controls">
      <div className="character-picker" aria-label="Choose a character">
        <button disabled={!ready} onClick={()=>choose(-1)} aria-label="Previous character"><ChevronLeft size={20}/></button>
        <span aria-live={lab.transport.state==='playing'?'off':'polite'} aria-atomic="true"><b>{String(character+1).padStart(2,'0')}</b><span aria-hidden="true"> / </span><span className="sr-only">of </span>27</span>
        <button disabled={!ready} onClick={()=>choose(1)} aria-label="Next character"><ChevronRight size={20}/></button>
      </div>
      <div className="action-row">
        <button className="unfold" disabled={!ready} onClick={toggle} aria-label={open?'Fold glyphs':'Unfold glyphs'}>{open?'Fold':'Unfold'}{open?<Minus size={18}/>:<Plus size={18}/>}</button>
        <Toggle className="quiet-toggle" disabled={!ready} pressed={cube} onPressedChange={next=>{setCube(next);space.current?.setCube(next);}} aria-label="Cube overlay"><Box size={17}/><span>Cube</span></Toggle>
        <Toggle className="quiet-toggle sound-toggle" disabled={!ready||audioBusy} pressed={sound} onPressedChange={audio} aria-label={sound?'Mute sound':'Start sound'}><span className={sound?'sound-live':''}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</span><span>{sound?'Mute':'Start sound'}</span></Toggle>
      </div>
      <p className="interaction-hint">{failed?'':!ready?'Opening…':open&&cube?'Drag to rotate · Click a face to turn':`Drag to rotate · Click to ${open?'fold':'unfold'}`}</p>
      {audioError&&<output>Sound could not start. Tap Start sound to retry.</output>}
    </div>
    {mode==='lab'&&<HarmonicLab lab={lab} id={character}/>}
    <ObserverLab active={mode==='observer'} onSymbol={select}/>
  </main>;
}
