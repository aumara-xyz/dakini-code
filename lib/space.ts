import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {glyphStrokes, deform, strokeWidth, approach, clamp, type Point} from './glyph';
import {STATES, stateOf, turnCell, fractalOffsets, waveSample, tesseractVertices, TESSERACT_EDGES, type Cell, type Axis} from './ternary';
import {createResonance} from './resonance';

export type Space = ReturnType<typeof createSpace>;
const WAVE = `
float field(vec2 p, float h, float phase) {
  float r=length(p), a=atan(p.y,p.x);
  return sin(h*3.141593*r*(1.+(1.-uClarity)*.12*sin(a*3.+phase)))
    *cos(h*a+uTime*.35+phase);
}`;

export function createSpace(host: HTMLElement, onToggle: () => void) {
  const isHidden=()=>document.hidden||document.documentElement.dataset.surfaceActive==='false';
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
  host.appendChild(renderer.domElement);
  const canvas=renderer.domElement; canvas.tabIndex=0;
  canvas.setAttribute('aria-label','27 floating glyphs. Drag or use arrow keys to rotate. Space unfolds. When unfolded, click a cube face to turn it; Shift-click reverses it.');
  const scene=new THREE.Scene(); scene.background=new THREE.Color('#04050d');
  const camera=new THREE.PerspectiveCamera(36,1,.1,140);camera.position.set(0,.35,13);camera.lookAt(0,.35,0);
  const pmrem=new THREE.PMREMGenerator(renderer), environment=new RoomEnvironment();
  const reflection=pmrem.fromScene(environment,.04);scene.environment=reflection.texture;environment.dispose();pmrem.dispose();
  scene.add(new THREE.AmbientLight('#9ca6ff',.8));
  for(const [color,intensity,x,y,z] of [['#c2edff',1.7,-3,3,4],['#a177ff',2.5,4,-1,2],['#ffffff',2,0,4,-2]] as const){
    const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);
  }
  const object=new THREE.Group(); object.position.y=.35;scene.add(object);
  const uniforms={uTime:{value:0},uAmount:{value:0},uHarmonics:{value:new THREE.Vector3(3,6,6)},uClarity:{value:.4}};
  const body=new THREE.MeshPhysicalMaterial({color:'#c0bfaa',envMapIntensity:.55,metalness:.78,roughness:.25,clearcoat:1,iridescence:.7,iridescenceIOR:1.3,iridescenceThicknessRange:[150,420],emissive:'#4d4c7b',emissiveIntensity:.12});
  const filament=new THREE.MeshBasicMaterial({color:'#d5e9ff'});
  const waveDeclarations='uniform float uTime; uniform float uAmount; uniform float uClarity; uniform vec3 uHarmonics;\n'+WAVE;
  for(const material of [body,filament]) material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=waveDeclarations+'\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <morphtarget_vertex>',`#include <morphtarget_vertex>
      vec3 fp=transformed*.22;
      transformed+=uAmount*.14*vec3(field(fp.yz,uHarmonics.x,0.),field(fp.zx,uHarmonics.y,2.1),field(fp.xy,uHarmonics.z,4.2));`);
  };
  function geometry(id:number, thin=false, steps=90, sides=8){
    const positions:number[]=[],opened:number[]=[],indices:number[]=[];
    for(const stroke of glyphStrokes(id)){
      const curve=new THREE.CatmullRomCurve3(stroke.points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
      const base=positions.length/3;
      for(let i=0;i<=steps;i++){
        const t=i/steps,center=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
        const normal=new THREE.Vector3(-tangent.y,tangent.x,0).normalize(),radius=thin?.007:strokeWidth(t,stroke.width);
        for(let j=0;j<sides;j++){
          const angle=j/sides*Math.PI*2;
          const p:Point=[center.x+normal.x*Math.cos(angle)*radius,center.y+normal.y*Math.cos(angle)*radius,Math.sin(angle)*radius*(thin?1:.45)+(thin?.052:0)];
          positions.push(...p);opened.push(...deform(p,t,stroke,1));
          if(i<steps){const a=base+i*sides+j,b=base+i*sides+(j+1)%sides,c=a+sides,d=b+sides;indices.push(a,b,c,b,d,c);}
        }
      }
    }
    const result=new THREE.BufferGeometry();result.setIndex(indices);result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.computeVertexNormals();
    const end=result.clone();end.setAttribute('position',new THREE.Float32BufferAttribute(opened,3));end.computeVertexNormals();
    result.morphAttributes.position=[end.getAttribute('position')];result.morphAttributes.normal=[end.getAttribute('normal')];end.dispose();
    return result;
  }
  // Cache all forms once so switching characters never causes shader or network loading.
  const forms=STATES.map(s=>({body:geometry(s.id),line:geometry(s.id,true,90,5)}));
  let selected=4;
  const hero=new THREE.Group(),heroBody=new THREE.Mesh(forms[selected].body,body),heroLine=new THREE.Mesh(forms[selected].line,filament);
  hero.add(heroBody,heroLine);object.add(hero);
  const satelliteMaterial=new THREE.MeshBasicMaterial({color:'#8bd5e3',transparent:true,opacity:.7});
  const satellites=STATES.map(s=>{
    const mesh=new THREE.Mesh(forms[s.id].body,satelliteMaterial);object.add(mesh);return mesh;
  });
  const echoMaterial=new THREE.MeshBasicMaterial({color:'#ad95df',transparent:true,opacity:.2,depthWrite:false});
  let echoGeometry=geometry(selected,false,20,3);
  echoGeometry.morphAttributes={};
  const offsets=fractalOffsets(),echoes=new THREE.InstancedMesh(echoGeometry,echoMaterial,offsets.length);
  echoes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);echoes.frustumCulled=false;object.add(echoes);
  const dummy=new THREE.Object3D(),positions:Cell[]=STATES.map(s=>[...s.position]);

  const cage=new THREE.Group();object.add(cage);
  const cageMaterial=new THREE.LineBasicMaterial({color:'#668bba',transparent:true,opacity:.18,depthWrite:false});
  const gridPoints:number[]=[];
  for(let axis=0;axis<3;axis++) for(const a of [-4.65,-1.55,1.55,4.65]) for(const b of [-4.65,-1.55,1.55,4.65]){
    const p=[0,0,0],q=[0,0,0];p[axis]=-4.65;q[axis]=4.65;p[(axis+1)%3]=q[(axis+1)%3]=a;p[(axis+2)%3]=q[(axis+2)%3]=b;gridPoints.push(...p,...q);
  }
  const gridGeometry=new THREE.BufferGeometry();gridGeometry.setAttribute('position',new THREE.Float32BufferAttribute(gridPoints,3));
  cage.add(new THREE.LineSegments(gridGeometry,cageMaterial));
  const tessGeometry=new THREE.BufferGeometry();tessGeometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(32*6),3));
  const tessMaterial=new THREE.LineBasicMaterial({color:'#b49bbd',transparent:true,opacity:.24,depthWrite:false});
  const tesseract=new THREE.LineSegments(tessGeometry,tessMaterial);cage.add(tesseract);
  const planeMaterials:THREE.ShaderMaterial[]=[];
  for(let i=0;i<3;i++){
    const material=new THREE.ShaderMaterial({uniforms:{...uniforms,uAxis:{value:i},uOpacity:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec2 vUv;uniform float uTime,uClarity,uAxis,uOpacity;uniform vec3 uHarmonics;${WAVE}
        void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float h=uAxis<.5?uHarmonics.x:uAxis<1.5?uHarmonics.y:uHarmonics.z;
        float f=field(p,h,uAxis*2.1);float node=pow(1.-min(1.,abs(f)/(.12+(1.-uClarity)*.15)),3.);
        vec3 flow=f>0.?vec3(.1,.55,.7):vec3(.4,.16,.65);vec3 color=flow*abs(f)*.25+vec3(.85,.64,.3)*node;
        float fade=pow(max(0.,1.-r*r),2.);gl_FragColor=vec4(color,fade*uOpacity);}`});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(8.8,8.8),material);
    if(i===0)plane.rotation.y=Math.PI/2;if(i===1)plane.rotation.x=Math.PI/2;
    cage.add(plane);planeMaterials.push(material);
  }
  // The six translucent outer faces are direct Rubik-layer turn targets.
  const faceMaterial=new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide});
  const faces:THREE.Mesh[]=[];
  for(let axis=0;axis<3;axis++) for(const layer of [-1,1]){
    const face=new THREE.Mesh(new THREE.PlaneGeometry(9.3,9.3),faceMaterial);
    face.position.setComponent(axis,layer*4.65);
    if(axis===0)face.rotation.y=Math.PI/2;if(axis===1)face.rotation.x=Math.PI/2;
    face.userData={axis,layer};cage.add(face);faces.push(face);
  }
  const hoverMaterial=new THREE.MeshBasicMaterial({color:'#79bfd7',transparent:true,opacity:.035,side:THREE.DoubleSide,depthWrite:false});
  const hoverFace=new THREE.Mesh(new THREE.PlaneGeometry(9.3,9.3),hoverMaterial);hoverFace.visible=false;cage.add(hoverFace);
  const hitMaterial=new THREE.MeshBasicMaterial({visible:false});
  const hitVolume=new THREE.Mesh(new THREE.SphereGeometry(2.5,16,12),hitMaterial);hitVolume.position.y=.2;object.add(hitVolume);

  let seed=3081;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const stars:number[]=[];for(let i=0;i<620;i++)stars.push((random()-.5)*110,(random()-.5)*90,-15-random()*85);
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  const starMaterial=new THREE.PointsMaterial({color:'#a5b1cd',size:.047,transparent:true,opacity:.55,sizeAttenuation:true});scene.add(new THREE.Points(starGeometry,starMaterial));
  const haloMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p*vec2(1.1,.85),p*vec2(1.1,.85))*4.5);vec3 c=mix(vec3(.035,.16,.28),vec3(.18,.055,.32),smoothstep(-.5,.6,p.x));gl_FragColor=vec4(c,a*.4);}'});
  const halo=new THREE.Mesh(new THREE.PlaneGeometry(30,30),haloMaterial);halo.position.set(0,.3,-8);scene.add(halo);
  const composer=new EffectComposer(renderer),bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.24,.35,1.1),output=new OutputPass();
  composer.addPass(new RenderPass(scene,camera));composer.addPass(bloom);composer.addPass(output);

  let amount=0,target=0,frame=0,last=0,phase=0,disposed=false,cube=true,zoom=1,sound=false;
  let rotationX=.025,rotationY=-.16,foldDistance=13,openDistance=22,turnCount=0;
  let voice:ReturnType<typeof createResonance>|null=null;
  let turn:{axis:Axis;layer:number;direction:number;progress:number;start:Cell[]}|null=null;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let reduced=motion.matches;
  function select(index:number){
    selected=stateOf(index).id;
    heroBody.geometry=forms[selected].body;heroBody.updateMorphTargets();
    heroLine.geometry=forms[selected].line;heroLine.updateMorphTargets();
    echoGeometry.dispose();echoGeometry=geometry(selected,false,20,3);echoGeometry.morphAttributes={};echoes.geometry=echoGeometry;
    // Move the focused form to the central seat, swapping its smaller copy with the Seed.
    satellites.forEach((mesh,i)=>{mesh.geometry=forms[i===selected?0:i].body;mesh.updateMorphTargets();});
    const state=stateOf(selected);uniforms.uHarmonics.value.set(state.harmonics[1],state.harmonics[0],state.harmonics[2]);uniforms.uClarity.value=state.clarity;
    host.dataset.character=String(selected+1);request();
  }
  function turnFace(axis:Axis,layer:number,direction=1){
    if(turn||amount<.95||!cube)return;
    turn={axis,layer,direction,progress:0,start:positions.map(p=>[...p])};
    hoverFace.visible=false;request();
  }
  const cellVectors=STATES.map(()=>new THREE.Vector3());
  function render(now:number,requested=false){
    frame=0;if(disposed||(isHidden()&&!requested))return;
    // Cap ambient drawing to 30 fps while allowing pointer gestures to render immediately.
    if(!requested&&last&&now-last<30&&pointers.size===0){frame=requestAnimationFrame(render);return;}
    const dt=last?Math.min((now-last)/1000,.07):1/30;last=now;
    amount=reduced||isHidden()?target:approach(amount,target,dt);
    if(!reduced&&!isHidden()&&amount>.001)phase+=dt;
    uniforms.uTime.value=phase;uniforms.uAmount.value=amount;
    heroBody.morphTargetInfluences![0]=amount;heroLine.morphTargetInfluences![0]=amount;
    hero.scale.setScalar(1-amount*.1);
    object.rotation.set(rotationX+amount*.16,rotationY-amount*.23,-.035);
    camera.position.z=(foldDistance+(openDistance-foldDistance)*amount)*zoom;
    const cageScale=.55+amount*.45;cage.scale.setScalar(cageScale);cage.visible=cube;
    cageMaterial.opacity=.075+amount*.085;tessMaterial.opacity=.14+amount*.04;
    planeMaterials.forEach(m=>m.uniforms.uOpacity.value=.055+amount*.12);
    const vertices=tesseractVertices(phase),tess=tessGeometry.getAttribute('position');
    TESSERACT_EDGES.forEach(([a,b],i)=>{tess.setXYZ(i*2,...vertices[a].map(n=>n*3.25) as Cell);tess.setXYZ(i*2+1,...vertices[b].map(n=>n*3.25) as Cell);});tess.needsUpdate=true;
    if(turn){
      turn.progress=reduced||isHidden()?1:Math.min(1,turn.progress+dt*1.8);
      if(turn.progress===1){for(let i=0;i<27;i++)positions[i]=turnCell(turn.start[i],turn.axis,turn.layer,turn.direction);turn=null;turnCount++;}
    }
    for(let i=0;i<27;i++){
      const pos=cellVectors[i].set(...positions[i]);
      if(turn&&turn.start[i][turn.axis]===turn.layer){
        pos.set(...turn.start[i]);const axis=new THREE.Vector3().setComponent(turn.axis,1),ease=turn.progress*turn.progress*(3-2*turn.progress);
        pos.applyAxisAngle(axis,ease*turn.direction*Math.PI/2);
      }
      pos.multiplyScalar(3.1*(.55+amount*.45));
      const mesh=satellites[i];mesh.position.copy(pos);mesh.scale.setScalar(.012+amount*.205);
      mesh.visible=amount>.01&&i!==0;mesh.rotation.set(amount*.1*Math.sin(phase*.25+i),0,0);
      if(mesh.morphTargetInfluences)mesh.morphTargetInfluences[0]=amount;
    }
    echoes.visible=amount>.1;echoMaterial.opacity=amount*.22;
    if(echoes.visible){
      offsets.forEach(({parent,offset},i)=>{
        dummy.position.copy(cellVectors[parent]);dummy.position.x+=offset[0]*3.1*amount;dummy.position.y+=offset[1]*3.1*amount;dummy.position.z+=offset[2]*3.1*amount;
        dummy.scale.setScalar(.035*amount);dummy.rotation.set(0,0,0);dummy.updateMatrix();echoes.setMatrixAt(i,dummy.matrix);
      });echoes.instanceMatrix.needsUpdate=true;
    }
    // The centre is the selected character; the Seed cell is its focus seat.
    const state=stateOf(selected),pressure=waveSample(.23,.31,state.harmonics[1],phase,state.clarity);
    if(sound)voice?.update(state,amount,pressure);
    composer.render();
    host.dataset.expansion=amount.toFixed(3);host.dataset.rotation=`${rotationX.toFixed(3)},${rotationY.toFixed(3)}`;
    host.dataset.cube=String(cube);host.dataset.turns=String(turnCount);host.dataset.echoes=echoes.visible?'702':'0';
    if(!isHidden()&&(amount!==target||turn||(!reduced&&amount>0)||sound))frame=requestAnimationFrame(render);
  }
  // Explicit actions still paint once in an occluded Safari window. Ambient animation stays suspended.
  function request(){if(!frame&&!disposed){last=0;if(isHidden())render(performance.now(),true);else frame=requestAnimationFrame(render);}}
  function setUnfolded(open:boolean){target=open?1:0;hoverFace.visible=false;request();}
  function setCube(visible:boolean){cube=visible;hoverFace.visible=false;request();}
  async function setSound(enabled:boolean){
    if(disposed)return false;
    if(!voice&&enabled)voice=createResonance(state=>{host.dataset.audioState=state;});
    sound=enabled;
    try{const active=await voice?.setEnabled(enabled);if(disposed)return false;host.dataset.sound=active?'on':'off';request();return!!active;}
    catch(error){sound=false;host.dataset.sound='off';throw error;}
  }
  function reset(){
    target=0;amount=0;phase=0;turn=null;turnCount=0;rotationX=.025;rotationY=-.16;zoom=1;
    STATES.forEach((s,i)=>positions[i]=[...s.position]);hoverFace.visible=false;request();
  }
  function fit(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    camera.aspect=w/h;foldDistance=Math.max(13,9/camera.aspect);openDistance=Math.max(22,17/camera.aspect);
    camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);request();
  }
  const observer=new ResizeObserver(fit);observer.observe(host);
  const changeMotion=()=>{reduced=motion.matches;request();};motion.addEventListener('change',changeMotion);
  const visibility=()=>{const hidden=isHidden();host.dataset.active=String(!hidden);voice?.visibility(hidden);if(hidden){cancelAnimationFrame(frame);frame=0;last=0;}else request();};
  document.addEventListener('visibilitychange',visibility);document.addEventListener('dakini-surface-visibility',visibility);
  const pointers=new Map<number,THREE.Vector2>();let downX=0,downY=0,moved=false,pinching=false;
  const raycaster=new THREE.Raycaster();
  function ray(e:PointerEvent){const b=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1),camera);}
  const down=(e:PointerEvent)=>{if(e.button!==0)return;canvas.setAttribute('data-pointerfocus','');canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,new THREE.Vector2(e.clientX,e.clientY));downX=e.clientX;downY=e.clientY;moved=false;pinching=pointers.size>1;hoverFace.visible=false;canvas.classList.add('dragging');};
  const move=(e:PointerEvent)=>{
    const previous=pointers.get(e.pointerId);
    if(!previous){
      if(target===1&&cube&&!turn){ray(e);const face=raycaster.intersectObjects(faces,false)[0]?.object;
        hoverFace.visible=!!face;if(face){hoverFace.position.copy(face.position);hoverFace.quaternion.copy(face.quaternion);}}
      else hoverFace.visible=false;return;
    }
    if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)![1];const old=previous.distanceTo(other),next=new THREE.Vector2(e.clientX,e.clientY).distanceTo(other);if(old>1&&next>1)zoom=clamp(zoom*old/next,.72,1.7);moved=true;}
    else{const dx=e.clientX-previous.x,dy=e.clientY-previous.y;if(Math.hypot(e.clientX-downX,e.clientY-downY)>4)moved=true;rotationY+=dx*.008;rotationX=clamp(rotationX+dy*.008,-Math.PI*.48,Math.PI*.48);}
    previous.set(e.clientX,e.clientY);request();
  };
  const up=(e:PointerEvent)=>{
    if(!pointers.has(e.pointerId))return;pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');if(moved||pinching)return;
    ray(e);
    if(target===1&&cube){const face=raycaster.intersectObjects(faces,false)[0]?.object;if(face)turnFace(face.userData.axis,face.userData.layer,(e.shiftKey?-1:1)*face.userData.layer);}
    else if(raycaster.intersectObject(hitVolume,false).length)onToggle();
  };
  const cancel=(e:PointerEvent)=>{pointers.delete(e.pointerId);if(!pointers.size)canvas.classList.remove('dragging');moved=true;};
  const leave=()=>{hoverFace.visible=false;request();};const blur=()=>canvas.removeAttribute('data-pointerfocus');
  const wheel=(e:WheelEvent)=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.0007,.72,1.7);request();};
  const key=(e:KeyboardEvent)=>{
    canvas.removeAttribute('data-pointerfocus');
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','x','y','z'].includes(e.key))e.preventDefault();else return;
    if(e.key===' '||e.key==='Enter'){if(!e.repeat)onToggle();}
    else if(['x','y','z'].includes(e.key)){if(!e.repeat)turnFace('xyz'.indexOf(e.key) as Axis,1,e.shiftKey?-1:1);}
    else{rotationY+=(e.key==='ArrowRight'?.15:0)-(e.key==='ArrowLeft'?.15:0);rotationX=clamp(rotationX+(e.key==='ArrowDown'?.15:0)-(e.key==='ArrowUp'?.15:0),-Math.PI*.48,Math.PI*.48);}request();
  };
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('keydown',key);canvas.addEventListener('blur',blur);
  select(selected);fit();visibility();
  return{select,setUnfolded,setCube,setSound,reset,dispose(){
    disposed=true;cancelAnimationFrame(frame);voice?.dispose();observer.disconnect();motion.removeEventListener('change',changeMotion);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('dakini-surface-visibility',visibility);
    canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('lostpointercapture',cancel);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('wheel',wheel);canvas.removeEventListener('keydown',key);canvas.removeEventListener('blur',blur);
    const geometries=new Set<THREE.BufferGeometry>();scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points||o instanceof THREE.LineSegments)geometries.add(o.geometry);});forms.forEach(f=>{geometries.add(f.body);geometries.add(f.line);});geometries.forEach(g=>g.dispose());
    [body,filament,satelliteMaterial,echoMaterial,cageMaterial,tessMaterial,faceMaterial,hoverMaterial,hitMaterial,starMaterial,haloMaterial,...planeMaterials].forEach(m=>m.dispose());reflection.dispose();bloom.dispose();output.dispose();composer.dispose();renderer.dispose();canvas.remove();
  }};
}
