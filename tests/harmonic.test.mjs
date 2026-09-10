import test from 'node:test';
import assert from 'node:assert/strict';
import {coefficients,levelsOf,idOf,frequencies,NORMALIZATION,Envelope} from '../lib/harmonic-model.ts';
import {STATES,turnCell} from '../lib/ternary.ts';
import {ScoreTransport,parseScore,exportScore,validateScore,stateAt} from '../lib/resonance-score.ts';

const fixture=()=>({format:'dakini.resonance-score.v1',mapping:'luminara-harmonic-1',baseFrequencyHz:140,transitionMs:50,phasePolicy:'reset-on-play',durationMs:3000,frames:[{tMs:0,stateId:0},{tMs:1000,stateId:3},{tMs:2000,stateId:4}],grantsAuthority:false});
test('all existing identities round-trip with canonical X relation, Y field, Z core',()=>{
  for(const state of STATES){assert.deepEqual(levelsOf(state.id),state.position);assert.equal(idOf(levelsOf(state.id)),state.id);}
  assert.equal(new Set(STATES.map(s=>coefficients(s.id).join(','))).size,27);
  assert.deepEqual(levelsOf(4),[1,0,1]);
  assert.deepEqual([3,5,7].map(k=>coefficients(0)[k]),[.3,.3,.3]);
  assert.equal(STATES[0].q,0);
  for(const id of [-1,27,1.5,NaN,Infinity])assert.throws(()=>levelsOf(id));
  for(const levels of [[0,0],[0,0,0,0],[.5,0,0],[2,0,0],[NaN,0,0]])assert.throws(()=>idOf(levels));
});
test('each coordinate controls only its declared partial; frequency targets never depend on glyph or view',()=>{
  const base=coefficients(0);
  for(let axis=0;axis<3;axis++){
    const levels=[0,0,0];levels[axis]=1;
    const changed=coefficients(idOf(levels));
    assert.deepEqual(changed.flatMap((v,i)=>v!==base[i]?[i+1]:[]),[[4,6,8][axis]]);
  }
  assert.deepEqual(frequencies(),Array.from({length:12},(_,i)=>(i+1)*140));
  for(const state of STATES){const before=coefficients(state.id);turnCell(state.position,0,1);assert.deepEqual(coefficients(state.id),before);assert.ok(before.reduce((a,b)=>a+b,0)<=NORMALIZATION+1e-12);}
  for(const f of [79,241,NaN,Infinity])assert.throws(()=>frequencies(f));
});
test('interrupted 50 ms ramps hold their instantaneous value and retain the fixed peak bound',()=>{
  const e=new Envelope(.1);e.ramp(0,.6);assert.ok(Math.abs(e.at(.025)-.35)<1e-12);
  assert.ok(Math.abs(e.ramp(.025,.1)-.35)<1e-12);assert.ok(Math.abs(e.at(.05)-.225)<1e-12);
  assert.equal(e.at(.1),.1);
  const env=coefficients(0).map(a=>new Envelope(a));
  for(let n=0;n<27;n++)coefficients(n).forEach((a,k)=>env[k].ramp(n*.021,a));
  for(let t=0;t<1;t+=.001)assert.ok(.5*env.reduce((a,e)=>a+e.at(t),0)/NORMALIZATION<=.5+1e-12);
});
test('score canonical round-trip and repeated visits retain timing',()=>{
  const score=fixture();score.frames.push({tMs:2500,stateId:0});
  assert.deepEqual(parseScore(exportScore(score)),score);
  assert.equal(stateAt(score,1800),3);assert.equal(stateAt(score,2900),0);
});
test('closed score schema rejects malformed, surplus, and boundary values',()=>{
  const mutations=[
    s=>{s.extra=true;},s=>{delete s.mapping;},s=>{s.mapping='remote';},s=>{s.format='v2';},
    s=>{s.phasePolicy='keep';},s=>{s.grantsAuthority=true;},s=>{s.transitionMs=51;},
    ...[79,241,NaN,Infinity,'140'].map(v=>s=>{s.baseFrequencyHz=v;}),
    ...[0,49,51,60050,2.5,'3000'].map(v=>s=>{s.durationMs=v;}),
    s=>{s.frames=[];},s=>{s.frames=Array.from({length:1201},(_,i)=>({tMs:i*50,stateId:i%2}));},
    s=>{s.frames[0].tMs=50;},s=>{s.frames[1].tMs=999;},s=>{s.frames[1].tMs=0;},
    s=>{s.frames[1].tMs=3000;},s=>{s.frames[1].stateId=0;},s=>{s.frames[0].extra=1;},
    ...[-1,27,.5,NaN,Infinity,'0'].map(v=>s=>{s.frames[0].stateId=v;}),
  ];
  for(const mutate of mutations){const s=fixture();mutate(s);assert.throws(()=>validateScore(s));}
  assert.throws(()=>parseScore('{invalid'));assert.throws(()=>parseScore(' '.repeat(256*1024+1)));
});
test('recording keeps time-zero, coalesces a grid interval, and handles delayed sampling',()=>{
  let now=0;const t=new ScoreTransport();t.record(0,140,()=>now);
  now=.01;t.change(3);now=.03;t.change(4);now=.061;t.change(6);
  now=.2;t.stop();
  assert.deepEqual(t.score.frames,[{tMs:0,stateId:0},{tMs:50,stateId:4},{tMs:100,stateId:6}]);
  assert.equal(t.score.durationMs,200);
  assert.throws(()=>t.record(1,140,()=>now));
});
test('pause excludes time away; clear and maximum recording duration are deterministic',()=>{
  let now=0;const t=new ScoreTransport();t.record(0,140,()=>now);
  now=.125;t.pause();now=5;t.resumeRecording();now=5.075;t.stop();assert.equal(t.score.durationMs,200);
  t.clear();assert.equal(t.score,null);t.record(0,140,()=>now);t.stop();assert.equal(t.score.durationMs,50);
  t.clear();now=0;t.record(0,140,()=>now);
  for(let i=1;i<1200;i++){now=i*.05-.001;t.change(i%2);}
  now=60;t.tick();assert.equal(t.state,'idle');assert.equal(t.score.durationMs,60000);assert.equal(t.score.frames.length,1200);
  assert.doesNotThrow(()=>validateScore(t.score));
});
test('replay cursor follows audio clock even when rendering skips frames; import refusal is atomic',()=>{
  let audio=10;const t=new ScoreTransport();t.load(fixture());t.play(()=>audio,10);
  audio=11.5;assert.equal(t.tick(),3);assert.equal(t.cursorMs,1500);
  t.pause();audio=30;assert.equal(t.cursorMs,1500);
  t.play(()=>audio,30,t.cursorMs);audio=30.6;assert.equal(t.tick(),4);
  const before=exportScore(t.score);assert.throws(()=>t.load({...fixture(),extra:true}));assert.equal(exportScore(t.score),before);
  t.seek(1000);assert.equal(t.state,'paused');assert.equal(t.cursorMs,1000);
  audio=40;t.play(()=>audio,40.065,1000);audio=40.02;
  assert.equal(t.tick(),3);assert.equal(t.cursorMs,1000);
});
