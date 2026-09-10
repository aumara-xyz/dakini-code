import {coefficients,frequencies,Envelope,NORMALIZATION,TRANSITION,MAX_VOLUME} from './harmonic-model.ts';
import {stateAt,type Score} from './resonance-score.ts';

function ramp(param:AudioParam,envelope:Envelope,target:number,time:number) {
  const held=envelope.ramp(time,target);
  param.cancelScheduledValues(time);param.setValueAtTime(held,time);
  param.linearRampToValueAtTime(target,time+TRANSITION);
}
/** Shared by the live adapter and browser OfflineAudioContext verification. */
export function createHarmonicGraph(context:BaseAudioContext,base:number,id:number,start:number,destination:AudioNode) {
  const initial=coefficients(id), master=context.createGain(), masterEnvelope=new Envelope(0);
  master.gain.value=0;master.connect(destination);
  const partials=frequencies(base).map((frequency,i)=>{
    const oscillator=context.createOscillator(), gain=context.createGain();
    oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,start);
    gain.gain.value=initial[i];oscillator.connect(gain);gain.connect(master);oscillator.start(start);
    return {oscillator,gain,envelope:new Envelope(initial[i])};
  });
  let stopped=false;
  return {
    select(next:number,time:number){coefficients(next).forEach((value,i)=>ramp(partials[i].gain.gain,partials[i].envelope,value,time));},
    volume(value:number,time:number){if(!Number.isFinite(value)||value<0||value>MAX_VOLUME)throw new Error('Volume must be between 0 and 0.5.');ramp(master.gain,masterEnvelope,value/NORMALIZATION,time);},
    stop(time:number){if(!stopped){partials.forEach(p=>p.oscillator.stop(time));stopped=true;}},
    disconnect(){partials.forEach(p=>{p.oscillator.disconnect();p.gain.disconnect();});master.disconnect();},
  };
}
export type HarmonicVoice=ReturnType<typeof createHarmonicVoice>;
/** Allocated only from an explicit Sound interaction. */
export function createHarmonicVoice(base:number,id:number,onState:(state:AudioContextState)=>void) {
  const context=new AudioContext();
  const analyser=context.createAnalyser();analyser.fftSize=8192;analyser.smoothingTimeConstant=.35;
  analyser.minDecibels=-100;analyser.maxDecibels=-10;analyser.connect(context.destination);
  let graph=createHarmonicGraph(context,base,id,context.currentTime,analyser);
  let generation=0,disposed=false,enabled=false;
  let endAt:number|null=null;
  const retired=new Set<ReturnType<typeof createHarmonicGraph>>();
  const timers=new Set<ReturnType<typeof setTimeout>>();
  const waiting=new Set<()=>void>();
  context.onstatechange=()=>onState(context.state);
  function retire(old:typeof graph,time:number) {
    old.volume(0,time);old.stop(time+TRANSITION);retired.add(old);
    const timer=setTimeout(()=>{old.disconnect();retired.delete(old);timers.delete(timer);},100);timers.add(timer);
  }
  return {
    context,analyser,
    get time(){return context.currentTime;},
    get running(){return enabled&&context.state==='running'&&!disposed;},
    async enable(volume:number) {
      const request=++generation;await context.resume();
      if(disposed||request!==generation)return false;
      if(context.state!=='running')throw new Error('Sound could not start. Try Start sound again.');
      enabled=true;graph.volume(volume,context.currentTime);return true;
    },
    select(next:number){graph.select(next,context.currentTime);},
    volume(value:number){
      if(enabled){
        graph.volume(value,context.currentTime);
        if(endAt!==null)graph.volume(0,Math.max(endAt,context.currentTime));
      }
    },
    play(score:Score,offset:number,volume:number) {
      const now=context.currentTime;retire(graph,now);
      const origin=now+TRANSITION+.015;
      graph=createHarmonicGraph(context,score.baseFrequencyHz,stateAt(score,offset),origin,analyser);
      graph.volume(volume,origin);
      for(const frame of score.frames)if(frame.tMs>offset)graph.select(frame.stateId,origin+(frame.tMs-offset)/1000);
      endAt=origin+(score.durationMs-offset)/1000;graph.volume(0,endAt);
      return origin;
    },
    cancel(next:number) {endAt=null;graph.select(next,context.currentTime);graph.volume(0,context.currentTime);},
    async mute() {
      const request=++generation;enabled=false;graph.volume(0,context.currentTime);
      await new Promise<void>(resolve=>{
        waiting.add(resolve);
        const timer=setTimeout(()=>{timers.delete(timer);waiting.delete(resolve);resolve();},60);timers.add(timer);
      });
      if(!disposed&&request===generation&&context.state!=='closed')await context.suspend();
    },
    hide(){++generation;enabled=false;graph.volume(0,context.currentTime);void context.suspend().catch(()=>{});},
    dispose(){
      ++generation;disposed=true;enabled=false;context.onstatechange=null;
      graph.stop(context.currentTime);graph.disconnect();retired.forEach(g=>g.disconnect());retired.clear();
      timers.forEach(clearTimeout);timers.clear();waiting.forEach(resolve=>resolve());waiting.clear();
      analyser.disconnect();void context.close().catch(()=>{});
    },
  };
}
