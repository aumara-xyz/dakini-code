import test from 'node:test';
import assert from 'node:assert/strict';
import {STROKES,deform,strokeWidth,approach} from '../lib/glyph.ts';

test('folded state preserves every original calligraphic control point',()=>{
  for(const stroke of STROKES) for(const [i,p] of stroke.points.entries()) assert.deepEqual(deform(p,i/(stroke.points.length-1),stroke,0),p);
});
test('unfolding adds depth deterministically without changing source geometry',()=>{
  const original=JSON.stringify(STROKES);
  const one=STROKES.map(s=>s.points.map((p,i)=>deform(p,i/(s.points.length-1),s,1)));
  const two=STROKES.map(s=>s.points.map((p,i)=>deform(p,i/(s.points.length-1),s,1)));
  assert.deepEqual(one,two);assert.equal(JSON.stringify(STROKES),original);
  assert.ok(one.flat().some(p=>Math.abs(p[2])>.5));
  assert.ok(one.flat().flat().every(n=>Number.isFinite(n)&&Math.abs(n)<5));
});
test('calligraphic strokes taper at both ends with finite nonzero thickness',()=>{
  for(const s of STROKES){assert.ok(strokeWidth(.5,s.width)>strokeWidth(0,s.width)*10);assert.ok(strokeWidth(.5,s.width)>strokeWidth(1,s.width)*10);for(let i=0;i<=100;i++)assert.ok(strokeWidth(i/100,s.width)>0);}
});
test('motion can reverse partway and settles exactly at either endpoint',()=>{
  let p=0;for(let i=0;i<20;i++)p=approach(p,1,1/60);assert.ok(p>0&&p<1);
  for(let i=0;i<200;i++){const previous=p;p=approach(p,0,1/60);assert.ok(p<=previous&&p>=0);}assert.equal(p,0);
  for(let i=0;i<200;i++){const previous=p;p=approach(p,1,1/60);assert.ok(p>=previous&&p<=1);}assert.equal(p,1);
});
