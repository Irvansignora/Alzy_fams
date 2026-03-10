/* ════════════════════════════════════════
   ALZY FAMILY v2 — main.js
   Three.js WebGL · GSAP ScrollTrigger · Lenis
   ════════════════════════════════════════ */

/* ══════════════════════════════════
   CLOUDINARY CONFIG
   Isi CDN_BASE dengan URL cloudinary kamu:
   'https://res.cloudinary.com/dyhvx9wit/image/upload/'
   Ganti tiap src foto jadi nama file di cloudinary
══════════════════════════════════ */
const CDN_BASE = '';
// Contoh pakai cloudinary:
// const CDN_BASE = 'https://res.cloudinary.com/dyhvx9wit/image/upload/';

if (CDN_BASE) {
  document.querySelectorAll('img[data-cdn]').forEach(img => {
    img.src = CDN_BASE + img.getAttribute('data-cdn');
  });
}

/* ══════════════════════════════════
   LENIS SMOOTH SCROLL
══════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.3,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

function rafLoop(time) {
  lenis.raf(time);
  requestAnimationFrame(rafLoop);
}
requestAnimationFrame(rafLoop);

// Connect Lenis to GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* ══════════════════════════════════
   THREE.JS — WEBGL BACKGROUND
   Animated particle field with colored orbs
══════════════════════════════════ */
(function initThree() {
  const canvas = document.getElementById('webgl-bg');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // ─── Particle field ───
  const PARTICLE_COUNT = 1800;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors    = new Float32Array(PARTICLE_COUNT * 3);

  const palette = [
    new THREE.Color('#FF5C5C'),
    new THREE.Color('#FFD93D'),
    new THREE.Color('#6EFFA8'),
    new THREE.Color('#5CE1FF'),
    new THREE.Color('#C97EFF'),
    new THREE.Color('#FF7EC7'),
    new THREE.Color('#FF8C42'),
  ];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 28;
    positions[i*3+1] = (Math.random() - 0.5) * 18;
    positions[i*3+2] = (Math.random() - 0.5) * 10;

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i*3]   = c.r;
    colors[i*3+1] = c.g;
    colors[i*3+2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // ─── Floating orb meshes ───
  function makeOrb(color, x, y, z, radius) {
    const g = new THREE.SphereGeometry(radius, 32, 32);
    const m = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.12 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }

  const orbs = [
    makeOrb(0xFF5C5C,  3.5,  1.5, -2, 1.8),
    makeOrb(0xC97EFF, -3.2, -1.2, -1, 1.4),
    makeOrb(0x6EFFA8,  0.5, -2.5, -3, 1.2),
    makeOrb(0x5CE1FF, -1.0,  2.0, -4, 1.0),
    makeOrb(0xFFD93D,  4.0, -2.0, -5, 0.9),
  ];

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Scroll-driven camera shift
  let scrollY = 0;
  lenis.on('scroll', ({ scroll }) => { scrollY = scroll; });

  // Animate
  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Rotate particle field slowly
    particles.rotation.y = t * 0.04;
    particles.rotation.x = t * 0.015;

    // Parallax camera tilt with mouse
    camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 0.25 - camera.position.y) * 0.03;

    // Scroll drift
    camera.position.z = 5 - scrollY * 0.0008;

    // Breathe orbs
    orbs.forEach((orb, i) => {
      orb.position.y += Math.sin(t * 0.4 + i * 1.3) * 0.003;
      orb.position.x += Math.cos(t * 0.35 + i * 0.9) * 0.002;
      orb.material.opacity = 0.08 + Math.sin(t * 0.5 + i) * 0.04;
    });

    renderer.render(scene, camera);
  })();
})();

/* ══════════════════════════════════
   CUSTOM CURSOR
══════════════════════════════════ */
const curDot  = document.getElementById('cur-dot');
const curRing = document.getElementById('cur-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  gsap.set(curDot, { x: mx, y: my });
});

gsap.ticker.add(() => {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  gsap.set(curRing, { x: rx, y: ry });
});

document.querySelectorAll('a,button,.member-card,.gp,.val-card,.tl-btn,.msg-card').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

/* ══════════════════════════════════
   NAVBAR SCROLL STATE
══════════════════════════════════ */
lenis.on('scroll', ({ scroll }) => {
  document.getElementById('nav').classList.toggle('scrolled', scroll > 60);
});

/* ══════════════════════════════════
   MOBILE MENU
══════════════════════════════════ */
const burgerBtn  = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobile-menu');

burgerBtn.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burgerBtn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.querySelectorAll('.mm-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    burgerBtn.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ══════════════════════════════════
   GSAP SCROLL ANIMATIONS
══════════════════════════════════ */

// ─── Hero reveal (immediate on load) ───
gsap.timeline({ delay: 0.1 })
  .to('[data-reveal]', { opacity:1, y:0, duration:.9, ease:'power3.out', stagger:.12 }, 0)
  .to('.h1-line span', { opacity:1, y:0, duration:1, ease:'power3.out', stagger:.12 }, 0.05);

// ─── Count-up numbers ───
document.querySelectorAll('[data-count]').forEach(el => {
  const target = parseInt(el.getAttribute('data-count'));
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    once: true,
    onEnter: () => {
      gsap.fromTo({ val: 0 }, { val: target }, {
        duration: 1.5, ease: 'power2.out',
        onUpdate() { el.textContent = Math.round(this.targets()[0].val); }
      });
    }
  });
});

// ─── Generic reveal on scroll ───
gsap.utils.toArray('[data-reveal]').forEach(el => {
  // Skip hero elements (already animated)
  if (el.closest('#hero')) return;
  const delay = parseFloat(el.getAttribute('data-delay') || 0) / 1000;

  gsap.fromTo(el,
    { opacity:0, y:36 },
    {
      opacity:1, y:0, duration:.95, delay, ease:'power3.out',
      scrollTrigger: { trigger:el, start:'top 88%', once:true }
    }
  );
});

// ─── Reveal-lines (word by word line reveal) ───
gsap.utils.toArray('[data-reveal-lines]').forEach(wrap => {
  if (wrap.closest('#hero')) return;
  wrap.querySelectorAll('.rl span').forEach((span, i) => {
    gsap.fromTo(span,
      { opacity:0, y:'100%' },
      {
        opacity:1, y:'0%', duration:1, delay: i * 0.12, ease:'power3.out',
        scrollTrigger: { trigger:wrap, start:'top 88%', once:true }
      }
    );
  });
});

// ─── Member cards staggered ───
gsap.utils.toArray('.member-card').forEach((card, i) => {
  gsap.fromTo(card,
    { opacity:0, y:50 },
    {
      opacity:1, y:0, duration:1, delay: i * 0.12, ease:'power3.out',
      scrollTrigger: { trigger:'.members-grid', start:'top 80%', once:true }
    }
  );
});

// ─── Gallery grid reveal ───
gsap.fromTo('.galeri-grid',
  { opacity:0, y:40 },
  { opacity:1, y:0, duration:1.1, ease:'power3.out',
    scrollTrigger: { trigger:'.galeri-grid', start:'top 85%', once:true }
  }
);

// ─── Timeline horizontal scroll hint ───
gsap.fromTo('.timeline-scroll-wrap',
  { opacity:0, x:-40 },
  { opacity:1, x:0, duration:1.1, ease:'power3.out',
    scrollTrigger: { trigger:'.timeline-scroll-wrap', start:'top 85%', once:true }
  }
);

// ─── Penutup big text parallax ───
gsap.utils.toArray('.penutup-h2 .rl').forEach((line, i) => {
  gsap.fromTo(line.querySelector('span'),
    { opacity:0, y:'100%' },
    {
      opacity:1, y:'0%', duration:1.2, delay:i*0.15, ease:'power3.out',
      scrollTrigger: { trigger:'.penutup-h2', start:'top 88%', once:true }
    }
  );
});

/* ══════════════════════════════════
   TIMELINE DRAG
══════════════════════════════════ */
let tlPos = 0, tlDrag = false, tlStartX = 0, tlStartPos = 0;
const tlTrack = document.getElementById('tlTrack');

tlTrack.addEventListener('mousedown', e => {
  tlDrag = true; tlStartX = e.clientX; tlStartPos = tlPos;
  tlTrack.style.transition = 'none';
});
window.addEventListener('mousemove', e => {
  if (!tlDrag) return;
  const dx = e.clientX - tlStartX;
  const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
  tlPos = Math.max(Math.min(tlStartPos + dx, 0), min);
  tlTrack.style.transform = `translateX(${tlPos}px)`;
});
window.addEventListener('mouseup', () => {
  if (tlDrag) { tlDrag = false; tlTrack.style.transition = ''; }
});

// Touch drag
let tlTouchX = 0;
tlTrack.addEventListener('touchstart', e => { tlTouchX = e.touches[0].clientX; tlStartPos = tlPos; }, { passive:true });
tlTrack.addEventListener('touchmove', e => {
  const dx = e.touches[0].clientX - tlTouchX;
  const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
  tlPos = Math.max(Math.min(tlStartPos + dx, 0), min);
  tlTrack.style.transform = `translateX(${tlPos}px)`;
}, { passive:true });

document.getElementById('tlPrev').addEventListener('click', () => tlMove(-1));
document.getElementById('tlNext').addEventListener('click', () => tlMove(1));

function tlMove(dir) {
  const min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth + 120);
  tlPos = Math.max(Math.min(tlPos - dir * 280, 0), min);
  gsap.to(tlTrack, { x: tlPos, duration:.6, ease:'power3.out' });
}

/* ══════════════════════════════════
   LIGHTBOX
══════════════════════════════════ */
function openLb(src) {
  const imgSrc = CDN_BASE ? CDN_BASE + src : src;
  const lbImg = document.getElementById('lb-img');
  lbImg.src = imgSrc;
  document.getElementById('lb').classList.add('open');
}
function closeLb() {
  document.getElementById('lb').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
document.getElementById('lb').addEventListener('click', e => {
  if (e.target === document.getElementById('lb')) closeLb();
});

/* ══════════════════════════════════
   GUESTBOOK
══════════════════════════════════ */
const AV_COLORS = [
  'var(--c-coral)','var(--c-mint)','var(--c-sky)',
  'var(--c-lav)','var(--c-yellow)','var(--c-pink)','var(--c-orange)'
];

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function addMsg() {
  const name = document.getElementById('gbName').value.trim();
  const rel  = document.getElementById('gbRel').value;
  const msg  = document.getElementById('gbMsg').value.trim();

  if (!name || !msg) {
    ['gbName','gbMsg'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) {
        gsap.fromTo(el, { x:0 }, { x:6, duration:.06, yoyo:true, repeat:5, ease:'none',
          onComplete:()=>{ el.style.borderColor=''; } });
        el.style.borderColor = 'var(--c-coral)';
      }
    });
    return;
  }

  const color = AV_COLORS[Math.floor(Math.random() * AV_COLORS.length)];
  const time  = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  const div = document.createElement('div');
  div.className = 'msg-card';
  div.style.cssText = `border-left-color:${color};opacity:0;transform:translateX(-20px)`;
  div.innerHTML = `
    <div class="msg-top">
      <div class="msg-avatar" style="background:${color}">${esc(name)[0].toUpperCase()}</div>
      <div><span class="msg-name">${esc(name)}</span><span class="msg-rel">${esc(rel)}</span></div>
      <span class="msg-time">${time}</span>
    </div>
    <p class="msg-text">"${esc(msg)}"</p>`;

  const list = document.getElementById('msgList');
  list.insertBefore(div, list.firstChild);
  gsap.to(div, { opacity:1, x:0, duration:.5, ease:'power3.out' });

  document.getElementById('gbName').value = '';
  document.getElementById('gbMsg').value  = '';
  celebrate();
}

/* ══════════════════════════════════
   CONFETTI
══════════════════════════════════ */
function celebrate() {
  if (typeof confetti === 'undefined') return;
  const end = Date.now() + 3200;
  const colors = ['#FF5C5C','#FFD93D','#6EFFA8','#5CE1FF','#C97EFF','#FF7EC7','#FF8C42'];
  const iv = setInterval(() => {
    const t = end - Date.now();
    if (t <= 0) return clearInterval(iv);
    const n = 50 * (t / 3200);
    confetti({ startVelocity:32, spread:360, ticks:65, zIndex:99999, particleCount:n, colors, origin:{ x:Math.random()*.4,   y:Math.random()-.2 } });
    confetti({ startVelocity:32, spread:360, ticks:65, zIndex:99999, particleCount:n, colors, origin:{ x:.6+Math.random()*.4, y:Math.random()-.2 } });
  }, 250);
}

// Wire up celebrate buttons
document.getElementById('celebrateBtn').addEventListener('click', celebrate);
document.getElementById('hero-celebrate').addEventListener('click', celebrate);
document.getElementById('footerCelebrate').addEventListener('click', celebrate);
