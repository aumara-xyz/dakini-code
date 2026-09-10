'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {DEFAULT_VOLUME} from '@/lib/harmonic-model';
import {createHarmonicVoice,type HarmonicVoice} from '@/lib/harmonic-voice';
import {ScoreTransport,parseScore,exportScore,MAX_BYTES,stateAt} from '@/lib/resonance-score';

export function useHarmonicLab(initialId:number,onSelect:(id:number)=>void,onMuted:()=>void) {
  const [transport]=useState(()=>new ScoreTransport());
  const voice=useRef<HarmonicVoice|null>(null), selected=useRef(initialId), alive=useRef(true);
  const selectCallback=useRef(onSelect), mutedCallback=useRef(onMuted);
  useEffect(()=>{selectCallback.current=onSelect;mutedCallback.current=onMuted;},[onSelect,onMuted]);
  const [revision,refresh]=useState(0),[volume,setVolume]=useState(DEFAULT_VOLUME),[message,setMessage]=useState('');
  const [base,setBase]=useState(140),[running,setRunning]=useState(false);
  const volumeRef=useRef(DEFAULT_VOLUME);
  const update=useCallback(()=>{if(alive.current)refresh(n=>n+1);},[]);
  const commit=useCallback((id:number)=>{selected.current=id;selectCallback.current(id);},[]);
  const stopAudio=useCallback(()=>{voice.current?.cancel(selected.current);void voice.current?.mute();setRunning(false);mutedCallback.current();},[]);
  function pause(){
    transport.pause();stopAudio();setMessage(transport.state==='paused'?'Paused. Start sound, then resume when ready.':'');update();
  }
  useEffect(()=>{
    alive.current=true;
    const hidden=()=>document.hidden||document.documentElement.dataset.surfaceActive==='false';
    const visibility=()=>{
      if(!hidden())return;
      transport.pause();voice.current?.cancel(selected.current);voice.current?.hide();
      setRunning(false);mutedCallback.current();
      if(transport.state==='paused')setMessage('Paused while away. Resume when ready.');
      update();
    };
    const timer=setInterval(()=>{
      const was=transport.state, id=transport.tick();
      if(was==='playing'&&id!==null&&id!==selected.current)commit(id);
      if(was==='playing'&&transport.state==='idle'){stopAudio();setMessage('Score complete. Replay it or explore another form.');}
      if(was==='recording'&&transport.state==='idle')setMessage('One minute captured. Your score is ready.');
      if(was==='recording'||was==='playing')update();
    },50);
    document.addEventListener('visibilitychange',visibility);
    document.addEventListener('dakini-surface-visibility',visibility);
    return()=>{alive.current=false;clearInterval(timer);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('dakini-surface-visibility',visibility);voice.current?.dispose();voice.current=null;};
  },[transport,update,commit,stopAudio]);
  async function setSound(next:boolean) {
    if(!next){
      transport.pause();voice.current?.cancel(selected.current);setRunning(false);
      await voice.current?.mute();update();return false;
    }
    if(document.hidden||document.documentElement.dataset.surfaceActive==='false')return false;
    if(!voice.current)voice.current=createHarmonicVoice(base,selected.current,state=>{
      if(state!=='running'&&alive.current){
        transport.pause();voice.current?.cancel(selected.current);setRunning(false);mutedCallback.current();update();
      }
    });
    try{
      const active=await voice.current.enable(volumeRef.current);
      if(!alive.current)return false;
      if(document.hidden||document.documentElement.dataset.surfaceActive==='false'){voice.current.hide();return false;}
      setRunning(active);setMessage(active?'':'Sound could not start. Try again.');return active;
    }catch(error){voice.current?.hide();setRunning(false);setMessage(error instanceof Error?error.message:'Sound could not start. Try again.');return false;}
  }
  function choose(id:number) {
    if(transport.state==='playing'||(transport.state==='paused'&&transport.pausedKind==='playing')){
      transport.stop();voice.current?.cancel(id);
      if(running)voice.current?.volume(volumeRef.current);
      setMessage('Playback stopped. Your score is unchanged.');
    }
    commit(id);transport.change(id);voice.current?.select(id);update();
  }
  function record() {
    try{transport.record(selected.current,base,()=>performance.now()/1000);setMessage('Recording settings in 50 ms steps.');update();}
    catch(error){setMessage((error as Error).message);}
  }
  function replay(resume=false) {
    if(!voice.current?.running){setMessage('Start sound to replay your score.');return;}
    if(!transport.score){setMessage('Record or import a score first.');return;}
    if(transport.state==='recording'||transport.pausedKind==='recording'){setMessage('Stop recording before replaying.');return;}
    const offset=resume?transport.cursorMs:0;
    if(offset>=transport.score.durationMs){setMessage('At the end of the score. Choose Replay to start again.');return;}
    const origin=voice.current.play(transport.score,offset,volumeRef.current);
    commit(stateAt(transport.score,offset));transport.play(()=>voice.current?.time??0,origin,offset);
    setMessage('Playing your settings.');update();
  }
  function resume(){
    if(transport.pausedKind==='recording'){transport.resumeRecording();transport.change(selected.current);setMessage('Recording settings.');update();}
    else replay(true);
  }
  function stop(){transport.stop();stopAudio();setMessage('Score retained. Start sound to replay.');update();}
  function clear(){transport.clear();stopAudio();setMessage('Score cleared. Ready to record.');update();}
  function scrub(ms:number){try{stopAudio();commit(transport.seek(ms));setMessage('Silent preview. Start sound and Resume to play from here.');update();}catch(error){setMessage((error as Error).message);}}
  async function importFile(file:File) {
    try{
      if(file.size>MAX_BYTES)throw new Error('Score files must be smaller than 256 KiB.');
      const score=parseScore(await file.text());
      // Validate before changing view, transport, or any audio object.
      transport.load(score);
      stopAudio();voice.current?.dispose();voice.current=null;
      setBase(score.baseFrequencyHz);commit(score.frames[0].stateId);setMessage('Score imported. Start sound to play.');update();
    }catch(error){setMessage((error as Error).message);}
  }
  function download(){
    if(!transport.score)return;
    const url=URL.createObjectURL(new Blob([exportScore(transport.score)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='dakini-score.json';link.click();URL.revokeObjectURL(url);
  }
  return {transport,voice,revision,volume,base,running,message,setSound,choose,record,replay,resume,pause,stop,clear,scrub,importFile,download,
    setVolume(value:number){if(!Number.isFinite(value)||value<0||value>.5)return;setVolume(value);volumeRef.current=value;voice.current?.volume(value);},
  };
}
