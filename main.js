/* ════════════════════════════════════════
   ALZY FAMILY — main.js
   ════════════════════════════════════════ */

/* ══════════════════════════════════
   CLOUDINARY CONFIG
   Ganti CDN_BASE dengan URL cloudinary kamu:
   'https://res.cloudinary.com/NAMA_CLOUD/image/upload/'
   Kosongkan kalau pakai local/Vercel static
══════════════════════════════════ */
const CDN_BASE = 'https://res.cloudinary.com/dyhvx9wit/image/upload/';

function cdnSrc(file) {
  return CDN_BASE ? CDN_BASE + file : file;
}

// Auto-replace all img src with CDN path
if (CDN_BASE) {
  document.querySelectorAll('img[data-src]').forEach(img => {
    const s = img.getAttribute('data-src');
    if (s) img.src = cdnSrc(s);
  });
}

/* ══════════════════════════════════
   SLIDES SETUP
══════════════════════════════════ */
const SLIDES = ['s0','s1','s2','s3','s4','s5','s6'];
const NAV_TITLES = ['Home','Cerita Kami','Anggota','Galeri','Perjalanan','Buku Tamu','Penutup'];

let curSlide = 0, isAnimating = false;
const wrapper = document.getElementById('wrapper');
const TOTAL = SLIDES.length;

// Build progress dots
const progEl = document.getElementById('progress');
SLIDES.forEach((_, i) => {
  const d = document.createElement('div');
  d.className = 'prog-dot' + (i === 0 ? ' active' : '');
  d.onclick = () => goTo(i);
  d.title = NAV_TITLES[i];
  progEl.appendChild(d);
});

function goTo(idx) {
  if (idx === curSlide || isAnimating) return;
  idx = Math.max(0, Math.min(idx, TOTAL - 1));
  isAnimating = true;

  document.getElementById(SLIDES[curSlide]).classList.remove('slide-active');
  curSlide = idx;
  wrapper.style.transform = `translateY(-${curSlide * 100}vh)`;

  // Update progress dots
  document.querySelectorAll('.prog-dot').forEach((d, i) => {
    d.classList.toggle('active', i === curSlide);
  });

  // Update counter
  document.getElementById('sc-cur').textContent = String(curSlide + 1).padStart(2, '0');

  // Scroll hint visible only on first slide
  document.getElementById('scroll-hint').style.opacity = curSlide === 0 ? '1' : '0';

  // Activate new slide animations
  setTimeout(() => {
    const slide = document.getElementById(SLIDES[curSlide]);
    slide.classList.add('slide-active');

    // Reset animations so they replay
    slide.querySelectorAll('.si-up,.si-left,.si-fade').forEach(el => {
      el.style.animation = 'none';
      void el.offsetHeight; // reflow trigger
      el.style.animation = '';
    });

    isAnimating = false;
  }, 100);
}

// Init first slide
setTimeout(() => {
  document.getElementById('s0').classList.add('slide-active');
}, 50);

/* ══════════════════════════════════
   SCROLL / WHEEL / KEYBOARD / TOUCH
══════════════════════════════════ */
let wheelLock = false;
window.addEventListener('wheel', e => {
  if (wheelLock || isAnimating) return;
  wheelLock = true;
  setTimeout(() => { wheelLock = false; }, 900);
  if (e.deltaY > 30) goTo(curSlide + 1);
  else if (e.deltaY < -30) goTo(curSlide - 1);
}, { passive: true });

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown') goTo(curSlide + 1);
  if (e.key === 'ArrowUp'   || e.key === 'PageUp')   goTo(curSlide - 1);
});

let touchStartY = 0;
window.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
window.addEventListener('touchend', e => {
  const dy = touchStartY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 50) goTo(dy > 0 ? curSlide + 1 : curSlide - 1);
}, { passive: true });

/* ══════════════════════════════════
   CURSOR
══════════════════════════════════ */
const curEl  = document.getElementById('cur');
const curEl2 = document.getElementById('cur2');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  curEl.style.transform = `translate(${mx}px,${my}px)`;
});

(function rafLoop() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  curEl2.style.transform = `translate(${rx}px,${ry}px)`;
  requestAnimationFrame(rafLoop);
})();

document.querySelectorAll('a,button,.s2-card,.g-ph,.s1-val,.s5-msg,.s4-btn,.btn-main').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});

/* ══════════════════════════════════
   TIMELINE DRAG
══════════════════════════════════ */
let tlPos = 0, tlDragging = false, tlStartX = 0, tlStartPos = 0;
const track = document.getElementById('s4track');
if (track) {
  track.addEventListener('mousedown', e => {
    tlDragging = true; tlStartX = e.clientX; tlStartPos = tlPos;
    track.style.transition = 'none';
  });
  window.addEventListener('mousemove', e => {
    if (!tlDragging) return;
    const dx = e.clientX - tlStartX;
    const min = -(track.scrollWidth - track.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlStartPos + dx, 0), min);
    track.style.transform = `translateX(${tlPos}px)`;
  });
  window.addEventListener('mouseup', () => {
    if (tlDragging) { tlDragging = false; track.style.transition = ''; }
  });
}

function tlMove(dir) {
  if (!track) return;
  const min = -(track.scrollWidth - track.parentElement.offsetWidth + 120);
  tlPos = Math.max(Math.min(tlPos - dir * 260, 0), min);
  track.style.transform = `translateX(${tlPos}px)`;
}

/* ══════════════════════════════════
   LIGHTBOX
══════════════════════════════════ */
function openLb(src) {
  document.getElementById('lb-img').src = cdnSrc(src);
  document.getElementById('lb').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLb() {
  document.getElementById('lb').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });

/* ══════════════════════════════════
   GUESTBOOK
══════════════════════════════════ */
const avatarColors = [
  'var(--c-coral)','var(--c-mint)','var(--c-sky)',
  'var(--c-lav)','var(--c-yellow)','var(--c-pink)','var(--c-orange)'
];

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function addMsg() {
  const name  = document.getElementById('gbName').value.trim();
  const rel   = document.getElementById('gbRel').value;
  const msg   = document.getElementById('gbMsg').value.trim();
  if (!name || !msg) {
    // Shake the empty fields
    ['gbName','gbMsg'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.style.borderColor='var(--c-coral)'; setTimeout(()=>el.style.borderColor='',2000); }
    });
    return;
  }
  const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  const time  = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  const html  = `
    <div class="s5-msg" style="animation:msgIn .5s ease forwards;border-left-color:${color};">
      <div class="s5-msg-top">
        <div style="display:flex;align-items:center;">
          <div class="s5-ava" style="background:${color};">${esc(name)[0].toUpperCase()}</div>
          <span class="s5-name">${esc(name)}</span><span class="s5-rel">${esc(rel)}</span>
        </div>
        <span class="s5-time">${time}</span>
      </div>
      <p class="s5-text">"${esc(msg)}"</p>
    </div>`;
  document.getElementById('msgList').insertAdjacentHTML('afterbegin', html);
  document.getElementById('gbName').value = '';
  document.getElementById('gbMsg').value  = '';
  celebrate();
}

/* ══════════════════════════════════
   CONFETTI CELEBRATE
══════════════════════════════════ */
function celebrate() {
  if (typeof confetti === 'undefined') return;
  const end = Date.now() + 3000;
  const colors = [
    '#FF5C5C','#FFD93D','#6EFFA8','#5CE1FF',
    '#C97EFF','#FF7EC7','#FF8C42'
  ];
  const iv = setInterval(() => {
    const t = end - Date.now();
    if (t <= 0) return clearInterval(iv);
    const n = 50 * (t / 3000);
    confetti({ startVelocity:30, spread:360, ticks:60, zIndex:99999, particleCount:n, colors, origin:{ x:Math.random()*.4, y:Math.random()-.2 } });
    confetti({ startVelocity:30, spread:360, ticks:60, zIndex:99999, particleCount:n, colors, origin:{ x:.6+Math.random()*.4, y:Math.random()-.2 } });
  }, 250);
}

/* ══════════════════════════════════
   MOBILE MENU
══════════════════════════════════ */
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

/* ══════════════════════════════════
   SLIDE COUNTER TOTAL
══════════════════════════════════ */
document.getElementById('sc-tot').textContent = String(TOTAL).padStart(2, '0');

/* ══════════════════════════════════
   PARALLAX ORBS on mousemove
══════════════════════════════════ */
document.addEventListener('mousemove', e => {
  const xPct = (e.clientX / window.innerWidth - 0.5);
  const yPct = (e.clientY / window.innerHeight - 0.5);
  document.querySelectorAll('.orb,.s1-orb1,.s1-orb2,.s2-orb1,.s4-orb1,.s4-orb2,.s5-orb1,.s6-orb1,.s6-orb2,.s6-orb3').forEach((orb, i) => {
    const factor = (i % 3 + 1) * 12;
    orb.style.transform = `translate(${xPct * factor}px, ${yPct * factor}px)`;
  });
});
