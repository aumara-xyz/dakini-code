import {assertId, frequencies} from './harmonic-model.ts';

export type Frame = {tMs:number; stateId:number};
export type Score = {
  format:'dakini.resonance-score.v1'; mapping:'luminara-harmonic-1';
  baseFrequencyHz:number; transitionMs:50; phasePolicy:'reset-on-play';
  durationMs:number; frames:Frame[]; grantsAuthority:false;
};
export const MAX_BYTES=256*1024;
export const MAX_DURATION=60000;
export type TransportState='idle'|'recording'|'playing'|'paused';
const keys=['format','mapping','baseFrequencyHz','transitionMs','phasePolicy','durationMs','frames','grantsAuthority'];
function exactKeys(value:unknown, expected:string[]): value is Record<string,unknown> {
  return !!value && typeof value==='object' && !Array.isArray(value)
    && Object.keys(value).length===expected.length && expected.every(k=>Object.hasOwn(value,k));
}
export function validateScore(value:unknown): Score {
  if(!exactKeys(value,keys))throw new Error('This file does not contain a supported Dakini score.');
  if(value.format!=='dakini.resonance-score.v1'||value.mapping!=='luminara-harmonic-1'||value.transitionMs!==50||value.phasePolicy!=='reset-on-play'||value.grantsAuthority!==false)throw new Error('Unsupported score version or mapping.');
  if(typeof value.baseFrequencyHz!=='number')throw new Error('Invalid base tone.');
  frequencies(value.baseFrequencyHz);
  const duration=value.durationMs;
  if(typeof duration!=='number'||!Number.isInteger(duration)||duration<50||duration>MAX_DURATION||duration%50!==0)throw new Error('Score duration must be 50 ms to 60 seconds, in 50 ms steps.');
  if(!Array.isArray(value.frames)||value.frames.length<1||value.frames.length>1200)throw new Error('A score needs 1 to 1,200 frames.');
  let previous=-50, previousId=-1;
  const frames=value.frames.map((frame:unknown,index:number)=>{
    if(!exactKeys(frame,['tMs','stateId']))throw new Error('Unrecognized score frame.');
    const {tMs,stateId}=frame;
    if(typeof tMs!=='number'||!Number.isInteger(tMs)||tMs%50||tMs<=previous||tMs>=duration||(index===0&&tMs!==0))throw new Error('Frame times must start at zero and increase in 50 ms steps.');
    if(typeof stateId!=='number')throw new Error('Invalid character in score.');
    assertId(stateId);
    if(stateId===previousId)throw new Error('Consecutive duplicate frames are not supported.');
    previous=tMs;previousId=stateId;
    return {tMs,stateId};
  });
  return makeScore(value.baseFrequencyHz,duration,frames);
}
function makeScore(base:number,duration:number,frames:Frame[]):Score {
  return {format:'dakini.resonance-score.v1',mapping:'luminara-harmonic-1',baseFrequencyHz:base,transitionMs:50,phasePolicy:'reset-on-play',durationMs:duration,frames:frames.map(f=>({...f})),grantsAuthority:false};
}
export function parseScore(text:string):Score {
  if(new TextEncoder().encode(text).byteLength>MAX_BYTES)throw new Error('Score files must be smaller than 256 KiB.');
  let value:unknown;
  try{value=JSON.parse(text);}catch{throw new Error('This file is not valid JSON.');}
  return validateScore(value);
}
export function exportScore(score:Score) { return JSON.stringify(validateScore(score),null,2)+'\n'; }
export function stateAt(score:Score,timeMs:number) {
  let id=score.frames[0].stateId;
  for(const frame of score.frames){if(frame.tMs>timeMs)break;id=frame.stateId;}
  return id;
}
/** Capture uses an injected monotonic clock; replay uses the audio clock. */
export class ScoreTransport {
  state:TransportState='idle';
  score:Score|null=null;
  cursorMs=0;
  pausedKind:'recording'|'playing'|null=null;
  private clock:()=>number=()=>0;
  private origin=0;
  private base=140;
  private frames:Frame[]=[];
  private pending=0;
  private nextGrid=50;
  private playbackOffset=0;
  private elapsed(){return Math.max(0,Math.round((this.clock()-this.origin)*1e9)/1e6);}
  record(id:number,base:number,clock:()=>number) {
    if(this.state!=='idle'||this.score)throw new Error('Clear the retained score before recording a new one.');
    assertId(id);frequencies(base);
    this.clock=clock;this.origin=clock();this.base=base;
    this.frames=[{tMs:0,stateId:id}];this.pending=id;this.nextGrid=50;
    this.cursorMs=0;this.state='recording';this.pausedKind=null;
  }
  private flush(until:number) {
    while(this.nextGrid<=until&&this.nextGrid<MAX_DURATION){
      if(this.frames[this.frames.length-1].stateId!==this.pending)this.frames.push({tMs:this.nextGrid,stateId:this.pending});
      this.nextGrid+=50;
    }
  }
  change(id:number) {
    assertId(id);
    if(this.state==='recording'){this.flush(this.elapsed());this.pending=id;}
  }
  tick() {
    if(this.state==='recording'){
      this.cursorMs=Math.min(MAX_DURATION,this.elapsed());this.flush(this.cursorMs);
      if(this.cursorMs>=MAX_DURATION)this.stop();
    }else if(this.state==='playing'&&this.score){
      this.cursorMs=Math.min(this.score.durationMs,Math.max(this.playbackOffset,this.elapsed()));
      if(this.cursorMs>=this.score.durationMs){this.state='idle';this.pausedKind=null;}
    }
    return this.score?stateAt(this.score,this.cursorMs):null;
  }
  pause() {
    if(this.state!=='recording'&&this.state!=='playing')return;
    const kind=this.state;this.tick();
    if((this.state as TransportState)==='idle')return;
    this.pausedKind=kind;this.state='paused';
  }
  resumeRecording() {
    if(this.state!=='paused'||this.pausedKind!=='recording')throw new Error('There is no paused recording.');
    this.origin=this.clock()-this.cursorMs/1000;this.state='recording';
  }
  play(clock:()=>number,origin:number,offset=0) {
    if(!this.score||this.state==='recording')throw new Error('Stop recording before replaying a score.');
    this.clock=clock;this.origin=origin-offset/1000;this.cursorMs=offset;this.playbackOffset=offset;
    this.state='playing';this.pausedKind=null;
  }
  stop() {
    if(this.state==='recording'||(this.state==='paused'&&this.pausedKind==='recording')){
      const elapsed=this.state==='recording'?Math.min(MAX_DURATION,this.elapsed()):this.cursorMs;
      this.flush(elapsed);
      const duration=Math.min(MAX_DURATION,Math.max(50,Math.ceil(elapsed/50)*50));
      this.score=makeScore(this.base,duration,this.frames.filter(f=>f.tMs<duration));this.cursorMs=duration;
    }else if(this.state==='playing')this.cursorMs=Math.min(this.score!.durationMs,this.elapsed());
    this.state='idle';this.pausedKind=null;
  }
  load(score:Score) {
    if(this.state!=='idle'||this.score)throw new Error('Clear the retained score before importing another.');
    const checked=validateScore(score);this.score=checked;this.cursorMs=0;
  }
  clear(){this.state='idle';this.score=null;this.frames=[];this.cursorMs=0;this.pausedKind=null;}
  seek(timeMs:number) {
    if(!this.score||this.state==='recording')throw new Error('Stop recording before choosing a score position.');
    if(!Number.isFinite(timeMs))throw new Error('Invalid score position.');
    this.cursorMs=Math.max(0,Math.min(this.score.durationMs,timeMs));this.state='paused';this.pausedKind='playing';
    return stateAt(this.score,this.cursorMs);
  }
}
