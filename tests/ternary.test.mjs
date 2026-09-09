import test from 'node:test';
import assert from 'node:assert/strict';
import {STATES,stateOf,turnCell,fractalOffsets,waveSample,tesseractVertices,TESSERACT_EDGES} from '../lib/ternary.ts';
import {glyphStrokes,deform} from '../lib/glyph.ts';

test('Luminara ordering is bijective across the 27 cells and signed weights',()=>{
  assert.equal(new Set(STATES.map(s=>s.position.join(','))).size,27);
  assert.deepEqual(STATES.map(s=>s.q).sort((a,b)=>a-b),Array.from({length:27},(_,i)=>i-13));
  assert.deepEqual(stateOf(4).digits,[0,1,1]);
  assert.deepEqual(stateOf(4).position,[1,0,1]);
  assert.equal(stateOf(4).q,4);assert.equal(stateOf(4).p,3);
  assert.equal(stateOf(13).q,13);assert.equal(stateOf(13).p,7);
  assert.equal(stateOf(26).q,-13);assert.equal(stateOf(-1).id,26);
});
test('every outer face turn and inverse preserve all 27 distinct cells',()=>{
  const initial=STATES.map(s=>s.position);
  assert.deepEqual(turnCell([1,1,0],0,1),[1,0,1]);
  for(const axis of [0,1,2])for(const layer of [-1,1]){
    const turned=initial.map(c=>turnCell(c,axis,layer));
    assert.equal(new Set(turned.map(c=>c.join(','))).size,27);
    assert.deepEqual(turned.map(c=>turnCell(c,axis,layer,-1)),initial);
    assert.deepEqual(initial.map(c=>Array.from({length:4}).reduce(c=>turnCell(c,axis,layer),c)),initial);
    initial.forEach((c,i)=>{if(c[axis]!==layer)assert.deepEqual(turned[i],c);});
  }
});
test('all 27 calligraphic forms differ and unfold to bounded finite curves',()=>{
  const forms=STATES.map(s=>glyphStrokes(s.id));
  assert.equal(new Set(forms.map(f=>JSON.stringify(f))).size,27);
  forms.forEach(form=>form.forEach(stroke=>stroke.points.forEach((point,i)=>{
    assert.deepEqual(deform(point,i/(stroke.points.length-1),stroke,0),point);
    for(const amount of [.25,.5,1])assert.ok(deform(point,i/(stroke.points.length-1),stroke,amount).every(n=>Number.isFinite(n)&&Math.abs(n)<4));
  })));
});
test('fractal expansion has exactly 26 finite echoes at each of 27 parents',()=>{
  const echoes=fractalOffsets();assert.equal(echoes.length,702);
  STATES.forEach(s=>assert.equal(echoes.filter(e=>e.parent===s.id).length,26));
  assert.ok(echoes.every(e=>e.offset.every(n=>Number.isFinite(n)&&Math.abs(n)<=.24)));
});
test('tesseract projection retains 16 vertices, 32 edges, and remains bounded',()=>{
  assert.equal(TESSERACT_EDGES.length,32);
  for(let i=0;i<16;i++)assert.equal(TESSERACT_EDGES.filter(e=>e.includes(i)).length,4);
  for(let t=0;t<300;t+=.5){const v=tesseractVertices(t);assert.equal(v.length,16);assert.ok(v.flat().every(n=>Number.isFinite(n)&&Math.abs(n)<3));}
});
test('shared standing wave and musical mapping remain finite and bounded',()=>{
  for(const state of STATES){
    assert.ok(state.frequency>90&&state.frequency<400);assert.ok(state.clarity>0&&state.clarity<=1);
    for(const harmonic of state.harmonics)for(let time=0;time<30;time+=.3){
      const wave=waveSample(.23,.31,harmonic,time,state.clarity);
      assert.ok(Number.isFinite(wave)&&Math.abs(wave)<=1);
    }
  }
  assert.equal(stateOf(0).q,0);assert.equal(stateOf(0).clarity,1);
});
