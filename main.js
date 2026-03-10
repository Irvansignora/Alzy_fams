/* ════════════════════════════════════════
   ALZY FAMILY v3 — main.js
   Loader → Three.js WebGL → GSAP Fullpage Snap
   ════════════════════════════════════════ */

/* ══════════════════════════════════
   CLOUDINARY CONFIG
   Isi CDN_BASE dengan cloud name lo:
   'https://res.cloudinary.com/dyhvx9wit/image/upload/'
   Lalu update tiap data-cdn ke nama file cloudinary (termasuk suffix)
══════════════════════════════════ */
const CDN_BASE = 'https://res.cloudinary.com/dyhvx9wit/image/upload/';

if (CDN_BASE) {
  document.querySelectorAll('[data-cdn]').forEach(el => {
    el.src = CDN_BASE + el.getAttribute('data-cdn');
  });
}

/* ══════════════════════════════════
   GSAP SETUP
══════════════════════════════════ */
const { gsap } = window;
const EASE_OUT = 'power3.out';
const EASE_IN  = 'power3.in';

/* ══════════════════════════════════
   THREE.JS WEBGL BACKGROUND
══════════════════════════════════ */
function initThree() {
  const canvas   = document.getElementById('webgl-bg');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Particle field
  const N = 2000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const palette = [
    new THREE.Color('#FF5C5C'), new THREE.Color('#FFD93D'),
    new THREE.Color('#6EFFA8'), new THREE.Color('#5CE1FF'),
    new THREE.Color('#C97EFF'), new THREE.Color('#FF7EC7'),
    new THREE.Color('#FF8C42'),
  ];
  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random()-.5)*30;
    pos[i*3+1] = (Math.random()-.5)*20;
    pos[i*3+2] = (Math.random()-.5)*12;
    const c = palette[Math.floor(Math.random()*palette.length)];
    col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size:.04, vertexColors:true, transparent:true, opacity:.5, sizeAttenuation:true });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // Orbs
  [[0xFF5C5C,3.5,1.5,-2,1.8],[0xC97EFF,-3.2,-1.2,-1,1.4],
   [0x6EFFA8,.5,-2.5,-3,1.2],[0x5CE1FF,-1,2,-4,1]].forEach(([col,x,y,z,r]) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r,32,32),
      new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.1 })
    );
    m.position.set(x,y,z); scene.add(m);
    // drift
    gsap.to(m.position, { y:y+.8, duration:3+Math.random()*2, yoyo:true, repeat:-1, ease:'sine.inOut', delay:Math.random()*2 });
  });

  let mx=0, my=0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX/window.innerWidth-.5)*2;
    my = (e.clientY/window.innerHeight-.5)*2;
  });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    pts.rotation.y = t*.035;
    pts.rotation.x = t*.012;
    camera.position.x += (mx*.35 - camera.position.x)*.03;
    camera.position.y += (-my*.22 - camera.position.y)*.03;
    renderer.render(scene, camera);
  })();
}
initThree();

/* ══════════════════════════════════
   LOADER
══════════════════════════════════ */
function runLoader(onComplete) {
  const tl = gsap.timeline();
  const chars = document.querySelectorAll('.lt-char');

  // 1. Logo pop in
  tl.to('#loader-logo', { opacity:1, scale:1, duration:.7, ease:'back.out(2)' }, .3)
  // 2. Chars stagger in
    .to(chars, { opacity:1, y:0, duration:.6, stagger:.05, ease:EASE_OUT }, .5)
  // 3. Sub + pct
    .to('.loader-sub',  { opacity:1, duration:.5, ease:EASE_OUT }, 1.0)
    .to('.loader-pct',  { opacity:1, duration:.5, ease:EASE_OUT }, 1.0)
  // 4. Fake progress bar
    .to('#loaderBar', { width:'100%', duration:2.2, ease:'power1.inOut',
      onUpdate() {
        const w = parseFloat(document.getElementById('loaderBar').style.width) || 0;
        document.getElementById('loaderPct').textContent = Math.round(w) + '%';
      }
    }, 1.0)
  // 5. Hold, then slice out
    .to({}, { duration:.3 })
    .to(['.loader-slice-l', '.loader-slice-r'], {
      x: (i) => i===0 ? '-100%' : '100%',
      duration:.9, ease:'power4.inOut', stagger:0
    })
    .to('#loader', { opacity:0, duration:.3, onComplete: () => {
      document.getElementById('loader').style.display = 'none';
      onComplete();
    }}, '-=.15');
}

/* ══════════════════════════════════
   FULLPAGE SNAP ENGINE
══════════════════════════════════ */
const SLIDES      = document.querySelectorAll('.slide');
const TOTAL       = SLIDES.length;
const NAV_LABELS  = ['Home','Cerita','Anggota','Galeri','Perjalanan','Pesan','Penutup'];

let current    = 0;
let animating  = false;

// Build progress dots
const dotWrap = document.getElementById('progress-dots');
SLIDES.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'pdot' + (i===0 ? ' active' : '');
  d.title = NAV_LABELS[i];
  d.onclick = () => goTo(i);
  dotWrap.appendChild(d);
});

/* ── In/Out animation definitions per direction ── */
function getInProps(dir) {
  // dir: 1 = scrolling down (new slide enters from bottom), -1 = from top
  return { y: dir > 0 ? '8vh' : '-8vh', opacity:0 };
}
function getOutProps(dir) {
  return { y: dir > 0 ? '-8vh' : '8vh', opacity:0 };
}

/* ── Animate elements OUT of a slide ── */
function slideOut(slide, dir, duration=.7) {
  const els     = slide.querySelectorAll('.anim-el');
  const words   = slide.querySelectorAll('.anim-word');
  const outProps = getOutProps(dir);
  const tl = gsap.timeline();
  tl.to(words, { y: dir > 0 ? '-100%' : '100%', opacity:0, duration:.45, stagger:.04, ease:EASE_IN }, 0)
    .to(els,   { ...outProps, duration:.5, stagger:.03, ease:EASE_IN }, 0);
  return tl;
}

/* ── Animate elements IN to a slide ── */
function slideIn(slide, dir) {
  const els   = slide.querySelectorAll('.anim-el');
  const words = slide.querySelectorAll('.anim-word');
  const tl = gsap.timeline();
  // Set initial state first
  gsap.set(els,   { ...getInProps(dir) });
  gsap.set(words, { y: dir > 0 ? '100%' : '-100%', opacity:0 });
  // Animate in with stagger by data-delay if set
  els.forEach((el, i) => {
    const delay = parseFloat(el.getAttribute('data-delay') || 0) / 1000;
    tl.to(el, { y:0, opacity:1, duration:.85, ease:EASE_OUT }, delay);
  });
  tl.to(words, { y:'0%', opacity:1, duration:.9, stagger:.1, ease:EASE_OUT }, 0);
  return tl;
}

/* ── GOTO function ── */
function goTo(idx) {
  if (idx === current || animating || idx < 0 || idx >= TOTAL) return;
  animating = true;

  const dir    = idx > current ? 1 : -1;
  const prev   = SLIDES[current];
  const next   = SLIDES[idx];

  // Update dots + counter
  document.querySelectorAll('.pdot').forEach((d,i) => d.classList.toggle('active', i===idx));
  document.getElementById('sc-cur').textContent = String(idx+1).padStart(2,'0');

  // Scroll hint: only on first slide
  gsap.to('#scroll-hint', { opacity: idx===0 ? 1 : 0, duration:.4 });

  current = idx;

  // Master timeline
  const master = gsap.timeline({
    onComplete: () => { animating = false; prev.classList.remove('is-active'); }
  });
  prev.classList.add('is-active');
  next.classList.add('is-active');

  master
    .add(slideOut(prev, dir), 0)
    .add(slideIn(next, dir), .15);
}

/* ══════════════════════════════════
   WHEEL / KEYBOARD / TOUCH
══════════════════════════════════ */
let wheelLock = false;
window.addEventListener('wheel', e => {
  if (wheelLock || animating) return;
  wheelLock = true;
  setTimeout(() => { wheelLock = false; }, 1000);
  if (e.deltaY > 30)  goTo(current + 1);
  if (e.deltaY < -30) goTo(current - 1);
}, { passive:true });

window.addEventListener('keydown', e => {
  if (e.key==='ArrowDown'||e.key==='PageDown') goTo(current+1);
  if (e.key==='ArrowUp'  ||e.key==='PageUp')   goTo(current-1);
});

let touchY0 = 0;
window.addEventListener('touchstart', e => { touchY0 = e.touches[0].clientY; }, { passive:true });
window.addEventListener('touchend', e => {
  const dy = touchY0 - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) goTo(dy > 0 ? current+1 : current-1);
}, { passive:true });

/* ══════════════════════════════════
   CURSOR
══════════════════════════════════ */
const curDot  = document.getElementById('cur-dot');
const curRing = document.getElementById('cur-ring');
let mx=0, my=0, rx=0, ry=0;
document.addEventListener('mousemove', e => {
  mx=e.clientX; my=e.clientY;
  gsap.set(curDot, { x:mx, y:my });
});
gsap.ticker.add(() => {
  rx += (mx-rx)*.12; ry += (my-ry)*.12;
  gsap.set(curRing, { x:rx, y:ry });
});
document.querySelectorAll('a,button,.member-card,.gp,.val-card,.tl-btn,.msg-card,.pdot').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hov'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hov'));
});

/* ══════════════════════════════════
   MOBILE MENU
══════════════════════════════════ */
const burger = document.getElementById('burgerBtn');
const mmenu  = document.getElementById('mobile-menu');
burger.addEventListener('click', () => {
  const open = mmenu.classList.toggle('open');
  burger.classList.toggle('open', open);
});
function closeMM() {
  mmenu.classList.remove('open');
  burger.classList.remove('open');
}

/* ══════════════════════════════════
   TIMELINE DRAG
══════════════════════════════════ */
let tlPos=0, tlDrag=false, tlSX=0, tlSP=0;
const tlTrack = document.getElementById('tlTrack');
if (tlTrack) {
  tlTrack.addEventListener('mousedown', e => { tlDrag=true; tlSX=e.clientX; tlSP=tlPos; tlTrack.style.transition='none'; });
  window.addEventListener('mousemove', e => {
    if (!tlDrag) return;
    const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP + (e.clientX-tlSX), 0), min);
    tlTrack.style.transform = `translateX(${tlPos}px)`;
  });
  window.addEventListener('mouseup', () => { if(tlDrag){ tlDrag=false; tlTrack.style.transition=''; }});
  let tlTY=0;
  tlTrack.addEventListener('touchstart', e=>{tlTY=e.touches[0].clientX;tlSP=tlPos;},{passive:true});
  tlTrack.addEventListener('touchmove', e=>{
    const min=-(tlTrack.scrollWidth-tlTrack.parentElement.offsetWidth);
    tlPos=Math.max(Math.min(tlSP+(e.touches[0].clientX-tlTY),0),min);
    tlTrack.style.transform=`translateX(${tlPos}px)`;
  },{passive:true});
}
function tlMove(dir) {
  if (!tlTrack) return;
  const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth + 100);
  tlPos = Math.max(Math.min(tlPos - dir*280, 0), min);
  gsap.to(tlTrack, { x:tlPos, duration:.6, ease:EASE_OUT });
}
document.getElementById('tlPrev').onclick = () => tlMove(-1);
document.getElementById('tlNext').onclick = () => tlMove(1);

/* ══════════════════════════════════
   LIGHTBOX
══════════════════════════════════ */
function openLb(src) {
  document.getElementById('lb-img').src = CDN_BASE ? CDN_BASE+src : src;
  document.getElementById('lb').classList.add('open');
}
function closeLb() { document.getElementById('lb').classList.remove('open'); }
document.addEventListener('keydown', e => { if(e.key==='Escape') closeLb(); });
document.getElementById('lb').addEventListener('click', e => { if(e.target.id==='lb') closeLb(); });

/* ══════════════════════════════════
   GUESTBOOK
══════════════════════════════════ */
const AVC = ['var(--c-coral)','var(--c-mint)','var(--c-sky)','var(--c-lav)','var(--c-yellow)','var(--c-pink)','var(--c-orange)'];
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function addMsg() {
  const name=document.getElementById('gbName').value.trim();
  const rel =document.getElementById('gbRel').value;
  const msg =document.getElementById('gbMsg').value.trim();
  if(!name||!msg){
    ['gbName','gbMsg'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el.value.trim()){ el.style.borderColor='var(--c-coral)'; gsap.fromTo(el,{x:0},{x:7,yoyo:true,repeat:5,duration:.06,ease:'none',onComplete:()=>el.style.borderColor=''}); }
    }); return;
  }
  const color=AVC[Math.floor(Math.random()*AVC.length)];
  const time=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
  const div=document.createElement('div');
  div.className='msg-card'; div.style.cssText=`border-left-color:${color};opacity:0;transform:translateX(-20px)`;
  div.innerHTML=`<div class="msg-top"><div class="msg-av" style="background:${color}">${esc(name)[0].toUpperCase()}</div><div><span class="msg-name">${esc(name)}</span><span class="msg-rel">${esc(rel)}</span></div><span class="msg-time">${time}</span></div><p class="msg-txt">"${esc(msg)}"</p>`;
  document.getElementById('msgList').insertBefore(div, document.getElementById('msgList').firstChild);
  gsap.to(div,{opacity:1,x:0,duration:.5,ease:EASE_OUT});
  document.getElementById('gbName').value='';
  document.getElementById('gbMsg').value='';
  celebrate();
}

/* ══════════════════════════════════
   CONFETTI
══════════════════════════════════ */
function celebrate() {
  if(!window.confetti) return;
  const end=Date.now()+3200;
  const colors=['#FF5C5C','#FFD93D','#6EFFA8','#5CE1FF','#C97EFF','#FF7EC7','#FF8C42'];
  const iv=setInterval(()=>{
    const t=end-Date.now(); if(t<=0) return clearInterval(iv);
    const n=50*(t/3200);
    confetti({startVelocity:32,spread:360,ticks:65,zIndex:99999,particleCount:n,colors,origin:{x:Math.random()*.4,y:Math.random()-.2}});
    confetti({startVelocity:32,spread:360,ticks:65,zIndex:99999,particleCount:n,colors,origin:{x:.6+Math.random()*.4,y:Math.random()-.2}});
  },250);
}
document.getElementById('navCelebrate').onclick = celebrate;

/* ══════════════════════════════════
   COUNTER TEXT
══════════════════════════════════ */
document.getElementById('sc-tot').textContent = String(TOTAL).padStart(2,'0');

/* ══════════════════════════════════
   START: RUN LOADER → INIT FIRST SLIDE
══════════════════════════════════ */
runLoader(() => {
  // Show nav, dots, counter
  gsap.to(['.nav-logo','#navLinks','.nav-burger','#progress-dots','#slide-counter'], {
    opacity:1, duration:.6, stagger:.08, ease:EASE_OUT
  });

  // Init slide 0
  SLIDES[0].classList.add('is-active');
  gsap.set(SLIDES[0].querySelectorAll('.anim-el'), { y:0, opacity:1 });
  gsap.set(SLIDES[0].querySelectorAll('.anim-word'), { y:'0%', opacity:1 });

  // Show scroll hint
  gsap.to('#scroll-hint', { opacity:1, duration:.8, delay:.5 });
});
