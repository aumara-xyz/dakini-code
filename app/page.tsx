'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Box,ChevronLeft,ChevronRight,RotateCcw,Volume2,VolumeX,Plus,Minus} from 'lucide-react';
import {Toggle} from '@/components/ui/toggle';
import type {Space} from '@/lib/space';

export default function Home(){
  const host=useRef<HTMLDivElement>(null),space=useRef<Space|null>(null),openRef=useRef(false),characterRef=useRef(4);
  const [open,setOpen]=useState(false),[ready,setReady]=useState(false),[failed,setFailed]=useState(false);
  const [character,setCharacter]=useState(4),[cube,setCube]=useState(true),[sound,setSound]=useState(false),[audioBusy,setAudioBusy]=useState(false),[audioError,setAudioError]=useState(false);
  const toggle=useCallback(()=>{const next=!openRef.current;openRef.current=next;setOpen(next);space.current?.setUnfolded(next);},[]);
  const reset=useCallback(()=>{openRef.current=false;setOpen(false);space.current?.reset();},[]);
  const choose=useCallback((direction:number)=>{
    const next=(characterRef.current+direction+27)%27;characterRef.current=next;setCharacter(next);space.current?.select(next);
  },[]);
  useEffect(()=>{
    let disposed=false;
    import('@/lib/space').then(({createSpace})=>{
      if(disposed||!host.current)return;space.current=createSpace(host.current,toggle);space.current.select(characterRef.current);space.current.setUnfolded(openRef.current);setReady(true);
    }).catch(error=>{console.error('Glyph rendering failed',error);setFailed(true);});
    return()=>{disposed=true;space.current?.dispose();space.current=null;};
  },[toggle]);
  const audio=async(next:boolean)=>{
    setAudioBusy(true);setAudioError(false);
    try{setSound(await space.current?.setSound(next)??false);}
    catch{setSound(false);setAudioError(true);}
    finally{setAudioBusy(false);}
  };
  return <main className="space-study">
    <header>DAKINI CODE</header>
    <button className="reset" disabled={!ready} onClick={reset} aria-label="Reset view and cube" title="Reset view and cube"><RotateCcw size={18}/></button>
    <div className="glyph-space" ref={host} data-testid="glyph-space"/>
    {failed&&<div className="render-error" role="alert"><p>The 3D view couldn't start.</p><button onClick={()=>location.reload()}>Try again</button><span>Hardware acceleration needs to be enabled in your browser.</span></div>}
    <div className="simple-controls">
      <div className="character-picker" aria-label="Choose a character">
        <button disabled={!ready} onClick={()=>choose(-1)} aria-label="Previous character"><ChevronLeft size={20}/></button>
        <span aria-live="polite" aria-atomic="true"><b>{String(character+1).padStart(2,'0')}</b><span aria-hidden="true"> / </span><span className="sr-only">of </span>27</span>
        <button disabled={!ready} onClick={()=>choose(1)} aria-label="Next character"><ChevronRight size={20}/></button>
      </div>
      <div className="action-row">
        <button className="unfold" disabled={!ready} onClick={toggle} aria-label={open?'Fold glyphs':'Unfold glyphs'}>{open?'Fold':'Unfold'}{open?<Minus size={18}/>:<Plus size={18}/>}</button>
        <Toggle className="quiet-toggle" disabled={!ready} pressed={cube} onPressedChange={next=>{setCube(next);space.current?.setCube(next);}} aria-label="Cube overlay"><Box size={17}/><span>Cube</span></Toggle>
        <Toggle className="quiet-toggle" disabled={!ready||audioBusy} pressed={sound} onPressedChange={audio} aria-label="Sound"><span className={sound?'sound-live':''}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>}</span><span>Sound</span></Toggle>
      </div>
      <p className="interaction-hint">{failed?'':!ready?'Opening…':open&&cube?'Drag to rotate · Click a face to turn':`Drag to rotate · Click to ${open?'fold':'unfold'}`}</p>
      {audioError&&<p role="status">Sound couldn't start. Tap Sound to retry.</p>}
    </div>
  </main>;
}
