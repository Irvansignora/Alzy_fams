/* ════════════════════════════════════════
   ALZY FAMILY — main.js
   Warm Light Theme · Three.js · GSAP
   ════════════════════════════════════════ */

/* ══ WAIT FOR DOM ══ */
document.addEventListener('DOMContentLoaded', function() {

const EASE_OUT = 'power3.out';
const EASE_IN  = 'power3.in';

/* ══ GSAP CHECK ══ */
if (!window.gsap) {
  console.error('GSAP not loaded');
  document.getElementById('loader').style.display = 'none';
  return;
}
const { gsap } = window;

/* ══ THREE.JS WARM PARTICLE BG ══ */
function initThree() {
  const canvas = document.getElementById('webgl-bg');
  if (!canvas || !window.THREE) return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0xFDF6EE, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Warm palette particles
  const PART_VERT = `
    attribute float aSize; attribute float aAlpha; varying float vAlpha;
    void main() {
      vAlpha = aAlpha;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (300.0 / -mv.z);
      gl_Position = projectionMatrix * mv;
    }
  `;
  const PART_FRAG = `
    varying float vAlpha;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv); if(d > 0.5) discard;
      float a = smoothstep(0.5, 0.1, d) * vAlpha;
      gl_FragColor = vec4(0.88, 0.55, 0.35, a * 0.35);
    }
  `;

  const N = 1800;
  const pos = new Float32Array(N*3), size = new Float32Array(N), alpha = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random()-.5)*32;
    pos[i*3+1] = (Math.random()-.5)*22;
    pos[i*3+2] = (Math.random()-.5)*14;
    size[i]  = Math.random()*2.5+0.5;
    alpha[i] = Math.random()*0.4+0.05;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSize',    new THREE.BufferAttribute(size, 1));
  pGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(alpha, 1));
  const pMat = new THREE.ShaderMaterial({
    vertexShader: PART_VERT, fragmentShader: PART_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(pGeo, pMat);
  scene.add(pts);

  // Warm glowing orbs
  const ORB_VERT = `
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPosition;
    uniform float uTime;
    void main() {
      vUv = uv; vNormal = normalize(normalMatrix * normal); vPosition = position;
      vec3 p = position;
      float d = sin(p.x*3.+uTime)*cos(p.y*2.5+uTime*.7)*.07;
      p += normal*d;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.);
    }
  `;
  const ORB_FRAG = `
    varying vec2 vUv; varying vec3 vNormal; varying vec3 vPosition;
    uniform float uTime; uniform vec3 uColor; uniform float uOpacity;
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.-dot(vNormal,viewDir),2.5);
      float pulse = sin(uTime*1.4)*.5+.5;
      float core  = smoothstep(.6,.0,length(vUv-.5));
      float alpha = (fresnel*.7+core*.2*pulse)*uOpacity;
      gl_FragColor = vec4(uColor,alpha);
    }
  `;

  const orbDefs = [
    { color:'#E05252', x: 3.2, y: 1.5, z:-2,   r:1.8 },
    { color:'#E8972A', x:-3.0, y:-1.2, z:-1.5, r:1.4 },
    { color:'#009688', x: 0.5, y:-2.5, z:-3,   r:1.1 },
    { color:'#E05252', x:-1.5, y: 2.2, z:-4,   r:0.9 },
    { color:'#E8972A', x: 2.2, y:-3.5, z:-5,   r:0.8 },
  ];
  const orbs = orbDefs.map(def => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: ORB_VERT, fragmentShader: ORB_FRAG,
      uniforms: { uTime:{value:0}, uColor:{value:new THREE.Color(def.color)}, uOpacity:{value:0.18} },
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(def.r,48,48), mat);
    m.position.set(def.x,def.y,def.z);
    scene.add(m);
    gsap.to(m.position, { y:def.y+.7+Math.random()*.5, duration:3+Math.random()*3, yoyo:true, repeat:-1, ease:'sine.inOut', delay:Math.random()*2 });
    return m;
  });

  // Mouse trail
  const TM = 120;
  const tPos = new Float32Array(TM*3), tAlpha = new Float32Array(TM), tSize = new Float32Array(TM);
  for (let i=0;i<TM;i++) { tPos[i*3]=9999; tSize[i]=Math.random()*5+2; }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos,3));
  tGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(tAlpha,1));
  tGeo.setAttribute('aSize',    new THREE.BufferAttribute(tSize,1));
  const TRAIL_FRAG = `
    varying float vAlpha;
    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      if(length(uv)>.5) discard;
      float g = exp(-length(uv)*6.);
      gl_FragColor = vec4(0.9, 0.45, 0.2, g*vAlpha);
    }
  `;
  const tMat = new THREE.ShaderMaterial({
    vertexShader: PART_VERT, fragmentShader: TRAIL_FRAG,
    transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
  });
  scene.add(new THREE.Points(tGeo,tMat));

  let tHead=0, mx3=0, my3=0, lx=0, ly=0, mx=0, my=0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX/innerWidth-.5)*2;
    my = (e.clientY/innerHeight-.5)*2;
    mx3 = mx*6; my3 = -my*4;
    const dx=mx3-lx, dy=my3-ly, spd=Math.sqrt(dx*dx+dy*dy);
    if (spd>.02) {
      const i=tHead%TM;
      tPos[i*3]=mx3+(Math.random()-.5)*.3; tPos[i*3+1]=my3+(Math.random()-.5)*.3; tPos[i*3+2]=(Math.random()-.5)*.5;
      tAlpha[i]=0.7; tSize[i]=Math.min(spd*15+2,8); tHead++;
      tGeo.attributes.position.needsUpdate=true; tGeo.attributes.aAlpha.needsUpdate=true; tGeo.attributes.aSize.needsUpdate=true;
    }
    lx=mx3; ly=my3;
  });

  window.addEventListener('resize', () => {
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    orbs.forEach(o => { o.material.uniforms.uTime.value=t; o.rotation.y=t*.08; o.rotation.x=t*.05; });
    for (let i=0;i<TM;i++) if(tAlpha[i]>.001) { tAlpha[i]*=.93; }
    tGeo.attributes.aAlpha.needsUpdate=true;
    pts.rotation.y=t*.015; pts.rotation.x=t*.005;
    camera.position.x += (mx*.3-camera.position.x)*.03;
    camera.position.y += (-my*.2-camera.position.y)*.03;
    renderer.render(scene,camera);
  })();
}
initThree();

/* ══ LOADER ══ */
function runLoader(onComplete) {
  const tl = gsap.timeline();
  const chars = document.querySelectorAll('.lt-char');
  const logoImg = document.getElementById('loader-logo');
  const loaderBar = document.getElementById('loaderBar');
  const loaderPct = document.getElementById('loaderPct');

  tl.to(logoImg, { opacity:1, scale:1, duration:.7, ease:'back.out(2)' }, .3)
    .to(chars, { opacity:1, y:0, duration:.6, stagger:.05, ease:EASE_OUT }, .5)
    .to('.loader-sub', { opacity:1, duration:.5 }, 1.0)
    .to(loaderPct, { opacity:1, duration:.5 }, 1.0)
    .to(loaderBar, {
      width:'100%', duration:2.2, ease:'power1.inOut',
      onUpdate() {
        const w = parseFloat(loaderBar.style.width)||0;
        if (loaderPct) loaderPct.textContent = Math.round(w)+'%';
      }
    }, 1.0)
    .to({}, { duration:.4 })
    .to('#loader', {
      opacity:0, y:-30, duration:.7, ease:'power3.in',
      onComplete:() => {
        const l = document.getElementById('loader');
        if (l) l.style.display='none';
        onComplete();
      }
    });
}

/* ══ SCROLL REVEAL ══ */
function initReveal() {
  const allReveals = document.querySelectorAll('.reveal');
  const allWords   = document.querySelectorAll('.reveal-word');

  document.querySelectorAll('.hero-h1, .section-h2, .penutup-h2').forEach(h => {
    h.querySelectorAll('.reveal-word').forEach((w,i) => {
      w.style.transitionDelay = (i * 90) + 'ms';
    });
  });

  document.querySelectorAll('.member-card.reveal').forEach((el) => {
    el.style.transitionDelay = (el.getAttribute('data-delay') || 0) + 'ms';
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.remove('out');
        el.classList.add('in');
      } else {
        const rect = entry.boundingClientRect;
        el.classList.remove('in');
        if (rect.top < 0) el.classList.add('out');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  allReveals.forEach(el => obs.observe(el));
  allWords.forEach(el => obs.observe(el));
}

/* ══ NAV ══ */
function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive:true });
}

/* ══ CURSOR ══ */
function initCursor() {
  const dot  = document.getElementById('cur-dot');
  const ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;
  let cx=0,cy=0,rx=0,ry=0;
  document.addEventListener('mousemove', e => {
    cx=e.clientX; cy=e.clientY;
    gsap.set(dot, { x:cx, y:cy });
  });
  gsap.ticker.add(() => {
    rx+=(cx-rx)*.1; ry+=(cy-ry)*.1;
    gsap.set(ring, { x:rx, y:ry });
  });
  document.querySelectorAll('a,button,.member-card,.gp,.val-card,.tl-btn,.msg-card,.nav-link').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
  });
}

/* ══ MOBILE MENU ══ */
const burger = document.getElementById('burgerBtn');
const mmenu  = document.getElementById('mobile-menu');
if (burger && mmenu) {
  burger.addEventListener('click', () => {
    const open = mmenu.classList.toggle('open');
    burger.classList.toggle('open', open);
  });
}
window.closeMM = function() {
  if (mmenu) mmenu.classList.remove('open');
  if (burger) burger.classList.remove('open');
};

/* ══ SCROLL TO SECTION ══ */
window.scrollToSection = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = 72;
  const top = el.getBoundingClientRect().top + window.scrollY - navH;
  window.scrollTo({ top, behavior:'smooth' });
};

/* ══ TIMELINE DRAG ══ */
let tlPos=0, tlDrag=false, tlSX=0, tlSP=0;
const tlTrack = document.getElementById('tlTrack');
if (tlTrack) {
  tlTrack.addEventListener('mousedown', e => { tlDrag=true; tlSX=e.clientX; tlSP=tlPos; tlTrack.style.transition='none'; });
  window.addEventListener('mousemove', e => {
    if (!tlDrag) return;
    const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP+(e.clientX-tlSX),0), min);
    tlTrack.style.transform = `translateX(${tlPos}px)`;
  });
  window.addEventListener('mouseup', () => { if(tlDrag){tlDrag=false;tlTrack.style.transition='';} });
  let tlTY=0;
  tlTrack.addEventListener('touchstart', e => { tlTY=e.touches[0].clientX; tlSP=tlPos; }, {passive:true});
  tlTrack.addEventListener('touchmove', e => {
    const min = -(tlTrack.scrollWidth-tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP+(e.touches[0].clientX-tlTY),0),min);
    tlTrack.style.transform = `translateX(${tlPos}px)`;
  }, {passive:true});
}

function tlMove(dir) {
  if (!tlTrack) return;
  const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth + 100);
  tlPos = Math.max(Math.min(tlPos-dir*280, 0), min);
  gsap.to(tlTrack, { x:tlPos, duration:.6, ease:EASE_OUT });
}
const tlPrev = document.getElementById('tlPrev');
const tlNext = document.getElementById('tlNext');
if (tlPrev) tlPrev.onclick = () => tlMove(-1);
if (tlNext) tlNext.onclick = () => tlMove(1);

/* ══ LIGHTBOX ══ */
window.openLb = function(src) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb').classList.add('open');
};
window.closeLb = function() { document.getElementById('lb').classList.remove('open'); };
document.addEventListener('keydown', e => { if(e.key==='Escape') window.closeLb(); });
const lb = document.getElementById('lb');
if (lb) lb.addEventListener('click', e => { if(e.target.id==='lb') window.closeLb(); });

/* ══ GUESTBOOK ══ */
const AVC = ['var(--c-rose)','var(--c-amber)','var(--c-teal)','var(--c-blue)','var(--c-green)','var(--c-purple)'];
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
window.addMsg = function() {
  const name = document.getElementById('gbName').value.trim();
  const rel  = document.getElementById('gbRel').value;
  const msg  = document.getElementById('gbMsg').value.trim();
  if (!name||!msg) {
    ['gbName','gbMsg'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor='var(--c-rose)';
        gsap.fromTo(el,{x:0},{x:7,yoyo:true,repeat:5,duration:.06,ease:'none',onComplete:()=>el.style.borderColor=''});
      }
    }); return;
  }
  const color = AVC[Math.floor(Math.random()*AVC.length)];
  const time  = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  const div   = document.createElement('div');
  div.className='msg-card'; div.style.cssText=`border-left-color:${color};opacity:0;transform:translateX(-20px)`;
  div.innerHTML=`<div class="msg-top"><div class="msg-av" style="background:${color}">${esc(name)[0].toUpperCase()}</div><div><span class="msg-name">${esc(name)}</span><span class="msg-rel">${esc(rel)}</span></div><span class="msg-time">${time}</span></div><p class="msg-txt">"${esc(msg)}"</p>`;
  document.getElementById('msgList').insertBefore(div, document.getElementById('msgList').firstChild);
  gsap.to(div,{opacity:1,x:0,duration:.5,ease:EASE_OUT});
  document.getElementById('gbName').value=''; document.getElementById('gbMsg').value='';
  window.celebrate();
};

/* ══ CONFETTI ══ */
window.celebrate = function() {
  if (!window.confetti) return;
  const end = Date.now()+3000;
  const colors = ['#E05252','#E8972A','#009688','#4285F4','#4CAF50','#9C6FD6'];
  const iv = setInterval(()=>{
    const t = end-Date.now(); if(t<=0) return clearInterval(iv);
    const n = 40*(t/3000);
    confetti({startVelocity:32,spread:360,ticks:65,zIndex:99999,particleCount:n,colors,origin:{x:Math.random()*.4,y:Math.random()-.2}});
    confetti({startVelocity:32,spread:360,ticks:65,zIndex:99999,particleCount:n,colors,origin:{x:.6+Math.random()*.4,y:Math.random()-.2}});
  },250);
};

const navCelebrate = document.getElementById('navCelebrate');
if (navCelebrate) navCelebrate.onclick = window.celebrate;

/* ══ BOOT ══ */
runLoader(() => {
  gsap.to(['.nav-logo','#navLinks','.nav-burger'], { opacity:1, duration:.6, stagger:.08, ease:EASE_OUT });

  setTimeout(() => {
    document.querySelectorAll('#s0 .reveal, #s0 .reveal-word').forEach((el,i) => {
      setTimeout(() => el.classList.add('in'), i * 60);
    });
  }, 100);

  initReveal();
  initNav();
  initCursor();
});

}); // end DOMContentLoaded
