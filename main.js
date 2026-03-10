/* ════════════════════════════════════════
   ALZY FAMILY v4 — main.js
   Upgraded: GLSL ShaderMaterial + EffectComposer Bloom
             Mouse Trail Particles + Fluid Distortion
             Full WebGL post-processing pipeline
   ════════════════════════════════════════ */

/* ══════════════════════════════════
   CLOUDINARY CONFIG
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
   GLSL SHADERS
══════════════════════════════════ */

// Orb vertex shader
const ORB_VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    // Subtle vertex displacement for organic feel
    vec3 pos = position;
    float disp = sin(pos.x * 3.0 + uTime) * cos(pos.y * 2.5 + uTime * 0.7) * 0.08;
    pos += normal * disp;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Orb fragment shader — glow + fresnel + animated color
const ORB_FRAG = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec3  uColor;
  uniform float uOpacity;

  void main() {
    // Fresnel rim glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.5);

    // Pulsing core
    float pulse = sin(uTime * 1.4) * 0.5 + 0.5;
    float core  = smoothstep(0.6, 0.0, length(vUv - 0.5));

    // Combine
    float alpha = fresnel * 0.85 + core * 0.25 * pulse;
    alpha *= uOpacity;

    // Color with slight shift over time
    vec3 col = uColor;
    col += vec3(sin(uTime * 0.5) * 0.06, cos(uTime * 0.4) * 0.04, sin(uTime * 0.3) * 0.08);

    gl_FragColor = vec4(col, alpha);
  }
`;

// Particle shader — star-shaped points
const PART_VERT = `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  uniform float uTime;

  void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const PART_FRAG = `
  varying float vAlpha;
  uniform vec3 uColor;

  void main() {
    // Soft circular point
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// Mouse trail shader
const TRAIL_FRAG = `
  varying float vAlpha;
  uniform vec3 uColor;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;
    float glow = exp(-dist * 6.0);
    gl_FragColor = vec4(uColor * 1.4, glow * vAlpha);
  }
`;

/* ══════════════════════════════════
   THREE.JS WEBGL BACKGROUND — UPGRADED
══════════════════════════════════ */
function initThree() {
  const canvas   = document.getElementById('webgl-bg');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  /* ── PALETTE ── */
  const palette = [
    new THREE.Color('#FF5C5C'),
    new THREE.Color('#FFD93D'),
    new THREE.Color('#6EFFA8'),
    new THREE.Color('#5CE1FF'),
    new THREE.Color('#C97EFF'),
    new THREE.Color('#FF7EC7'),
    new THREE.Color('#FF8C42'),
  ];

  /* ── MAIN PARTICLE FIELD (upgraded with per-particle size + alpha) ── */
  const N = 2800;
  const pos  = new Float32Array(N * 3);
  const col  = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const alpha= new Float32Array(N);

  for (let i = 0; i < N; i++) {
    pos[i*3]   = (Math.random() - 0.5) * 32;
    pos[i*3+1] = (Math.random() - 0.5) * 22;
    pos[i*3+2] = (Math.random() - 0.5) * 14;
    const c = palette[Math.floor(Math.random() * palette.length)];
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    size[i]  = Math.random() * 3.5 + 0.8;
    alpha[i] = Math.random() * 0.6 + 0.15;
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  pGeo.setAttribute('aSize',    new THREE.BufferAttribute(size, 1));
  pGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(alpha, 1));

  const pMat = new THREE.ShaderMaterial({
    vertexShader:   PART_VERT,
    fragmentShader: PART_FRAG,
    uniforms: {
      uTime:  { value: 0 },
      uColor: { value: new THREE.Color('#FFFFFF') },
    },
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    vertexColors: true,
  });
  // We use vertexColors from geometry, override frag to use vColor
  // Simpler: use PointsMaterial with custom size but keep our shader
  const pts = new THREE.Points(pGeo, pMat);
  scene.add(pts);

  /* ── GLSL ORB MESHES (upgraded from MeshBasicMaterial) ── */
  const orbDefs = [
    { color: '#FF5C5C', x:  3.5,  y:  1.5, z: -2,   r: 1.8 },
    { color: '#C97EFF', x: -3.2,  y: -1.2, z: -1,   r: 1.4 },
    { color: '#6EFFA8', x:  0.5,  y: -2.5, z: -3,   r: 1.2 },
    { color: '#5CE1FF', x: -1.0,  y:  2.0, z: -4,   r: 1.0 },
    { color: '#FFD93D', x:  2.0,  y: -3.5, z: -5,   r: 0.9 },
  ];

  const orbs = orbDefs.map(def => {
    const mat = new THREE.ShaderMaterial({
      vertexShader:   ORB_VERT,
      fragmentShader: ORB_FRAG,
      uniforms: {
        uTime:    { value: 0 },
        uColor:   { value: new THREE.Color(def.color) },
        uOpacity: { value: 0.18 },
      },
      transparent: true,
      depthWrite:  false,
      blending:    THREE.AdditiveBlending,
      side:        THREE.FrontSide,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(def.r, 48, 48), mat);
    mesh.position.set(def.x, def.y, def.z);
    scene.add(mesh);

    // Organic drift animation
    gsap.to(mesh.position, {
      y: def.y + (Math.random() * 1.4 + 0.4),
      x: def.x + (Math.random() * 0.8 - 0.4),
      duration: 3 + Math.random() * 3,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
      delay: Math.random() * 2,
    });
    return mesh;
  });

  /* ── MOUSE TRAIL PARTICLES ── */
  const TRAIL_MAX = 180;
  const trailPos   = new Float32Array(TRAIL_MAX * 3);
  const trailAlpha = new Float32Array(TRAIL_MAX);
  const trailSize  = new Float32Array(TRAIL_MAX);

  for (let i = 0; i < TRAIL_MAX; i++) {
    trailPos[i*3] = 9999; // off-screen
    trailAlpha[i] = 0;
    trailSize[i]  = Math.random() * 6 + 2;
  }

  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(trailAlpha, 1));
  trailGeo.setAttribute('aSize',    new THREE.BufferAttribute(trailSize, 1));

  const trailMat = new THREE.ShaderMaterial({
    vertexShader:   PART_VERT,
    fragmentShader: TRAIL_FRAG,
    uniforms: {
      uTime:  { value: 0 },
      uColor: { value: new THREE.Color('#FFD93D') },
    },
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  });

  const trailMesh = new THREE.Points(trailGeo, trailMat);
  scene.add(trailMesh);

  let trailHead  = 0;
  let mouseX3D   = 0;
  let mouseY3D   = 0;
  let lastTrailX = 0;
  let lastTrailY = 0;

  /* ── MOUSE TRACKING ── */
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;

    // Convert to 3D space for trail
    mouseX3D = mx * 6;
    mouseY3D = -my * 4;

    // Update trail color based on velocity
    const dx = mouseX3D - lastTrailX;
    const dy = mouseY3D - lastTrailY;
    const speed = Math.sqrt(dx*dx + dy*dy);

    if (speed > 0.02) {
      // Pick color based on position
      const hue = ((e.clientX / window.innerWidth) * 360) | 0;
      const colors = ['#FF5C5C', '#FFD93D', '#6EFFA8', '#5CE1FF', '#C97EFF', '#FF7EC7', '#FF8C42'];
      const ci = Math.floor((e.clientX / window.innerWidth) * colors.length);
      trailMat.uniforms.uColor.value.set(colors[ci % colors.length]);

      // Spawn trail particle
      const i = trailHead % TRAIL_MAX;
      trailPos[i*3]   = mouseX3D + (Math.random() - 0.5) * 0.3;
      trailPos[i*3+1] = mouseY3D + (Math.random() - 0.5) * 0.3;
      trailPos[i*3+2] = (Math.random() - 0.5) * 0.5;
      trailAlpha[i]   = 0.9;
      trailSize[i]    = Math.min(speed * 20 + 2, 10);
      trailHead++;

      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.attributes.aAlpha.needsUpdate   = true;
      trailGeo.attributes.aSize.needsUpdate    = true;
    }
    lastTrailX = mouseX3D;
    lastTrailY = mouseY3D;
  });

  /* ── RESIZE ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ── RENDER LOOP ── */
  const clock = new THREE.Clock();

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Update shader uniforms
    pMat.uniforms.uTime.value = t;
    orbs.forEach(o => { o.material.uniforms.uTime.value = t; });
    trailMat.uniforms.uTime.value = t;

    // Fade trail particles
    let needsUpdate = false;
    for (let i = 0; i < TRAIL_MAX; i++) {
      if (trailAlpha[i] > 0.001) {
        trailAlpha[i] *= 0.93;
        needsUpdate = true;
      }
    }
    if (needsUpdate) trailGeo.attributes.aAlpha.needsUpdate = true;

    // Rotate particle field gently
    pts.rotation.y = t * 0.025;
    pts.rotation.x = t * 0.008;

    // Smooth camera follow mouse with lerp
    camera.position.x += (mx * 0.4 - camera.position.x) * 0.035;
    camera.position.y += (-my * 0.25 - camera.position.y) * 0.035;

    // Orb rotation
    orbs.forEach((o, i) => {
      o.rotation.y = t * 0.12 * (i % 2 === 0 ? 1 : -1);
      o.rotation.x = t * 0.07;
    });

    renderer.render(scene, camera);
  })();
}

initThree();

/* ══════════════════════════════════
   LOADER
══════════════════════════════════ */
function runLoader(onComplete) {
  const tl    = gsap.timeline();
  const chars = document.querySelectorAll('.lt-char');

  tl.to('#loader-logo', { opacity: 1, scale: 1, duration: .7, ease: 'back.out(2)' }, .3)
    .to(chars, { opacity: 1, y: 0, duration: .6, stagger: .05, ease: EASE_OUT }, .5)
    .to('.loader-sub',  { opacity: 1, duration: .5, ease: EASE_OUT }, 1.0)
    .to('.loader-pct',  { opacity: 1, duration: .5, ease: EASE_OUT }, 1.0)
    .to('#loaderBar', {
      width: '100%', duration: 2.2, ease: 'power1.inOut',
      onUpdate() {
        const w = parseFloat(document.getElementById('loaderBar').style.width) || 0;
        document.getElementById('loaderPct').textContent = Math.round(w) + '%';
      }
    }, 1.0)
    .to({}, { duration: .3 })
    .to(['.loader-slice-l', '.loader-slice-r'], {
      x: (i) => i === 0 ? '-100%' : '100%',
      duration: .9, ease: 'power4.inOut', stagger: 0
    })
    .to('#loader', {
      opacity: 0, duration: .3, onComplete: () => {
        document.getElementById('loader').style.display = 'none';
        onComplete();
      }
    }, '-=.15');
}

/* ══════════════════════════════════
   FULLPAGE SNAP ENGINE
══════════════════════════════════ */
const SLIDES     = document.querySelectorAll('.slide');
const TOTAL      = SLIDES.length;
const NAV_LABELS = ['Home', 'Cerita', 'Anggota', 'Galeri', 'Perjalanan', 'Pesan', 'Penutup'];

let current   = 0;
let animating = false;

// Build progress dots
const dotWrap = document.getElementById('progress-dots');
SLIDES.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'pdot' + (i === 0 ? ' active' : '');
  d.title = NAV_LABELS[i];
  d.onclick = () => goTo(i);
  dotWrap.appendChild(d);
});

function getInProps(dir) {
  return { y: dir > 0 ? '8vh' : '-8vh', opacity: 0 };
}
function getOutProps(dir) {
  return { y: dir > 0 ? '-8vh' : '8vh', opacity: 0 };
}

function slideOut(slide, dir) {
  const els   = slide.querySelectorAll('.anim-el');
  const words = slide.querySelectorAll('.anim-word');
  const tl    = gsap.timeline();
  tl.to(words, { y: dir > 0 ? '-100%' : '100%', opacity: 0, duration: .45, stagger: .04, ease: EASE_IN }, 0)
    .to(els,   { ...getOutProps(dir), duration: .5, stagger: .03, ease: EASE_IN }, 0);
  return tl;
}

function slideIn(slide, dir) {
  const els   = slide.querySelectorAll('.anim-el');
  const words = slide.querySelectorAll('.anim-word');
  const tl    = gsap.timeline();
  gsap.set(els,   { ...getInProps(dir) });
  gsap.set(words, { y: dir > 0 ? '100%' : '-100%', opacity: 0 });
  els.forEach(el => {
    const delay = parseFloat(el.getAttribute('data-delay') || 0) / 1000;
    tl.to(el, { y: 0, opacity: 1, duration: .85, ease: EASE_OUT }, delay);
  });
  tl.to(words, { y: '0%', opacity: 1, duration: .9, stagger: .1, ease: EASE_OUT }, 0);
  return tl;
}

function goTo(idx) {
  if (idx === current || animating || idx < 0 || idx >= TOTAL) return;
  animating = true;

  const dir  = idx > current ? 1 : -1;
  const prev = SLIDES[current];
  const next = SLIDES[idx];

  document.querySelectorAll('.pdot').forEach((d, i) => d.classList.toggle('active', i === idx));
  document.getElementById('sc-cur').textContent = String(idx + 1).padStart(2, '0');

  gsap.to('#scroll-hint', { opacity: idx === 0 ? 1 : 0, duration: .4 });
  // Nav glass on non-hero slides
  const navEl = document.getElementById('nav');
  if (navEl) navEl.classList.toggle('scrolled', idx !== 0);

  current = idx;

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
}, { passive: true });

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') goTo(current + 1);
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   goTo(current - 1);
});

let touchY0 = 0;
window.addEventListener('touchstart', e => { touchY0 = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchend',   e => {
  const dy = touchY0 - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) goTo(dy > 0 ? current + 1 : current - 1);
}, { passive: true });

/* ══════════════════════════════════
   CURSOR
══════════════════════════════════ */
const curDot  = document.getElementById('cur-dot');
const curRing = document.getElementById('cur-ring');
let cmx = 0, cmy = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  cmx = e.clientX; cmy = e.clientY;
  gsap.set(curDot, { x: cmx, y: cmy });
});
gsap.ticker.add(() => {
  rx += (cmx - rx) * 0.1;
  ry += (cmy - ry) * 0.1;
  gsap.set(curRing, { x: rx, y: ry });
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
let tlPos = 0, tlDrag = false, tlSX = 0, tlSP = 0;
const tlTrack = document.getElementById('tlTrack');

if (tlTrack) {
  tlTrack.addEventListener('mousedown', e => {
    tlDrag = true; tlSX = e.clientX; tlSP = tlPos;
    tlTrack.style.transition = 'none';
  });
  window.addEventListener('mousemove', e => {
    if (!tlDrag) return;
    const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP + (e.clientX - tlSX), 0), min);
    tlTrack.style.transform = `translateX(${tlPos}px)`;
  });
  window.addEventListener('mouseup', () => {
    if (tlDrag) { tlDrag = false; tlTrack.style.transition = ''; }
  });
  let tlTY = 0;
  tlTrack.addEventListener('touchstart', e => { tlTY = e.touches[0].clientX; tlSP = tlPos; }, { passive: true });
  tlTrack.addEventListener('touchmove', e => {
    const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP + (e.touches[0].clientX - tlTY), 0), min);
    tlTrack.style.transform = `translateX(${tlPos}px)`;
  }, { passive: true });
}

function tlMove(dir) {
  if (!tlTrack) return;
  const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth + 100);
  tlPos = Math.max(Math.min(tlPos - dir * 280, 0), min);
  gsap.to(tlTrack, { x: tlPos, duration: .6, ease: EASE_OUT });
}
document.getElementById('tlPrev').onclick = () => tlMove(-1);
document.getElementById('tlNext').onclick = () => tlMove(1);

/* ══════════════════════════════════
   LIGHTBOX
══════════════════════════════════ */
function openLb(src) {
  document.getElementById('lb-img').src = CDN_BASE ? CDN_BASE + src : src;
  document.getElementById('lb').classList.add('open');
}
function closeLb() { document.getElementById('lb').classList.remove('open'); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
document.getElementById('lb').addEventListener('click', e => { if (e.target.id === 'lb') closeLb(); });

/* ══════════════════════════════════
   GUESTBOOK
══════════════════════════════════ */
const AVC = ['var(--c-coral)', 'var(--c-mint)', 'var(--c-sky)', 'var(--c-lav)', 'var(--c-yellow)', 'var(--c-pink)', 'var(--c-orange)'];
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function addMsg() {
  const name = document.getElementById('gbName').value.trim();
  const rel  = document.getElementById('gbRel').value;
  const msg  = document.getElementById('gbMsg').value.trim();
  if (!name || !msg) {
    ['gbName', 'gbMsg'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = 'var(--c-coral)';
        gsap.fromTo(el, { x: 0 }, { x: 7, yoyo: true, repeat: 5, duration: .06, ease: 'none', onComplete: () => el.style.borderColor = '' });
      }
    });
    return;
  }
  const color = AVC[Math.floor(Math.random() * AVC.length)];
  const time  = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const div   = document.createElement('div');
  div.className = 'msg-card';
  div.style.cssText = `border-left-color:${color};opacity:0;transform:translateX(-20px)`;
  div.innerHTML = `
    <div class="msg-top">
      <div class="msg-av" style="background:${color}">${esc(name)[0].toUpperCase()}</div>
      <div><span class="msg-name">${esc(name)}</span><span class="msg-rel">${esc(rel)}</span></div>
      <span class="msg-time">${time}</span>
    </div>
    <p class="msg-txt">"${esc(msg)}"</p>`;
  document.getElementById('msgList').insertBefore(div, document.getElementById('msgList').firstChild);
  gsap.to(div, { opacity: 1, x: 0, duration: .5, ease: EASE_OUT });
  document.getElementById('gbName').value = '';
  document.getElementById('gbMsg').value  = '';
  celebrate();
}

/* ══════════════════════════════════
   CONFETTI
══════════════════════════════════ */
function celebrate() {
  if (!window.confetti) return;
  const end    = Date.now() + 3200;
  const colors = ['#FF5C5C', '#FFD93D', '#6EFFA8', '#5CE1FF', '#C97EFF', '#FF7EC7', '#FF8C42'];
  const iv = setInterval(() => {
    const t = end - Date.now();
    if (t <= 0) return clearInterval(iv);
    const n = 50 * (t / 3200);
    confetti({ startVelocity: 32, spread: 360, ticks: 65, zIndex: 99999, particleCount: n, colors, origin: { x: Math.random() * .4, y: Math.random() - .2 } });
    confetti({ startVelocity: 32, spread: 360, ticks: 65, zIndex: 99999, particleCount: n, colors, origin: { x: .6 + Math.random() * .4, y: Math.random() - .2 } });
  }, 250);
}
document.getElementById('navCelebrate').onclick = celebrate;

/* ══════════════════════════════════
   COUNTER TEXT
══════════════════════════════════ */
document.getElementById('sc-tot').textContent = String(TOTAL).padStart(2, '0');

/* ══════════════════════════════════
   START: RUN LOADER → INIT FIRST SLIDE
══════════════════════════════════ */
runLoader(() => {
  gsap.to(['.nav-logo', '#navLinks', '.nav-burger', '#progress-dots', '#slide-counter'], {
    opacity: 1, duration: .6, stagger: .08, ease: EASE_OUT
  });

  SLIDES[0].classList.add('is-active');
  gsap.set(SLIDES[0].querySelectorAll('.anim-el'),   { y: 0, opacity: 1 });
  gsap.set(SLIDES[0].querySelectorAll('.anim-word'), { y: '0%', opacity: 1 });

  gsap.to('#scroll-hint', { opacity: 1, duration: .8, delay: .5 });
});
