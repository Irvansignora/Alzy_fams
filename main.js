/* ════════════════════════════════════════════
   ALZY FAMILY — main.js v2.0 (FULL UPGRADE)
   6 Features: Particle Cursor · Countdown ·
   Storytelling · Mood Board · Film Strip · Time Capsule
════════════════════════════════════════════ */

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

/* ══════════════════════════════════════════
   1. CUSTOM CURSOR + PARTICLE TRAIL
══════════════════════════════════════════ */
var cursorParticles = [];
var cursorCX = 0, cursorCY = 0;
var cursorRX = 0, cursorRY = 0;

function initCursor() {
  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  var canvas = document.getElementById('cursor-canvas');
  if (!canvas) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  var ctx = canvas.getContext('2d');

  window.addEventListener('resize', function() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  var COLORS = ['#FF6B8A','#FFB347','#26C6DA','#66BB6A','#5C9EFF','#CE93D8','#FFD54F'];

  document.addEventListener('mousemove', function(e) {
    cursorCX = e.clientX; cursorCY = e.clientY;
    if (dot) dot.style.transform = 'translate(' + cursorCX + 'px,' + cursorCY + 'px)';

    // Spawn particles
    for (var i = 0; i < 2; i++) {
      cursorParticles.push({
        x: cursorCX, y: cursorCY,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 1,
        r: Math.random() * 5 + 2,
        alpha: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        char: Math.random() > 0.6 ? ['✦','★','♥','✿','⭐'][Math.floor(Math.random()*5)] : null
      });
    }
  });

  (function cursorLoop() {
    // Move ring
    cursorRX += (cursorCX - cursorRX) * 0.1;
    cursorRY += (cursorCY - cursorRY) * 0.1;
    if (ring) ring.style.transform = 'translate(' + cursorRX + 'px,' + cursorRY + 'px)';

    // Draw particles
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cursorParticles = cursorParticles.filter(function(p) { return p.alpha > 0.02; });
    cursorParticles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy;
      p.alpha -= 0.035;
      p.vy += 0.08; // gravity
      ctx.globalAlpha = Math.max(0, p.alpha);
      if (p.char) {
        ctx.font = (p.r * 3) + 'px serif';
        ctx.fillStyle = p.color;
        ctx.fillText(p.char, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    requestAnimationFrame(cursorLoop);
  })();

  document.querySelectorAll('a, button, .member-card, .gp, .val-card, .tl-btn, .msg-card, .nav-link, .film-frame, .polaroid, .mood-card').forEach(function(el) {
    el.addEventListener('mouseenter', function() { document.body.classList.add('hov'); });
    el.addEventListener('mouseleave', function() { document.body.classList.remove('hov'); });
  });
}

/* ══════════════════════════════════════════
   2. ANNIVERSARY COUNTDOWN
══════════════════════════════════════════ */
function initCountdown() {
  function tick() {
    var now = new Date();
    var year = now.getFullYear();
    var anniv = new Date(year, 8, 6); // September 6 (month is 0-indexed)
    if (anniv <= now) anniv = new Date(year + 1, 8, 6);

    var diff = anniv - now;
    var days  = Math.floor(diff / 86400000);
    var hours = Math.floor((diff % 86400000) / 3600000);
    var mins  = Math.floor((diff % 3600000) / 60000);
    var secs  = Math.floor((diff % 60000) / 1000);

    var anniversaryNumber = anniv.getFullYear() - 2020;

    var dEl = document.getElementById('cd-d');
    var hEl = document.getElementById('cd-h');
    var mEl = document.getElementById('cd-m');
    var sEl = document.getElementById('cd-s');
    var yEl = document.getElementById('cd-year');

    if (yEl) yEl.textContent = anniversaryNumber;

    function updateEl(el, val) {
      var v = String(val).padStart(2, '0');
      if (el && el.textContent !== v) {
        el.textContent = v;
        el.classList.add('tick');
        setTimeout(function() { el.classList.remove('tick'); }, 200);
      }
    }
    updateEl(dEl, days);
    updateEl(hEl, hours);
    updateEl(mEl, mins);
    updateEl(sEl, secs);
  }
  tick();
  setInterval(tick, 1000);
}

/* ══════════════════════════════════════════
   3. SCROLL STORYTELLING — Chapter System
══════════════════════════════════════════ */
var currentChapter = 0;
var totalChapters = 4;

window.showChapter = function(idx) {
  if (idx < 0 || idx >= totalChapters || idx === currentChapter) return;

  var oldCh = document.getElementById('ch' + currentChapter);
  var newCh = document.getElementById('ch' + idx);
  if (!oldCh || !newCh) return;

  // Exit current
  oldCh.classList.add('exiting');
  oldCh.classList.remove('active');
  setTimeout(function() { oldCh.classList.remove('exiting'); }, 750);

  // Enter new
  newCh.classList.add('active');
  currentChapter = idx;

  // Update dots
  document.querySelectorAll('.sc-dot').forEach(function(d, i) {
    d.classList.toggle('active', i === idx);
  });
};

window.nextChapter = function() {
  showChapter(currentChapter + 1);
};

/* ══════════════════════════════════════════
   4. FAMILY MOOD BOARD
══════════════════════════════════════════ */
var moodActive = false;

window.activateMood = function(card) {
  var bg   = card.dataset.moodBg;
  var b1   = card.dataset.moodB1;
  var b2   = card.dataset.moodB2;
  var b3   = card.dataset.moodB3;
  var name = card.dataset.moodName;
  var emojis = (card.dataset.moodEmoji || '✨💕⭐').split('');

  // If same card, toggle off
  if (card.classList.contains('mood-active')) {
    resetMood();
    return;
  }

  // Deactivate all cards
  document.querySelectorAll('.mood-card').forEach(function(c) {
    c.classList.remove('mood-active');
  });

  // Activate this card
  card.classList.add('mood-active');
  moodActive = true;

  // Theme the bg overlay
  var overlay = document.getElementById('mood-overlay');
  if (overlay) {
    overlay.style.background = bg;
    overlay.style.opacity = '0.55';
  }

  // Animate blobs to match mood
  var blobs = document.querySelectorAll('.mesh-blob');
  var blobColors = [b1, b2, b3];
  blobs.forEach(function(b, i) {
    var c = blobColors[i % blobColors.length] || b1;
    b.style.background = 'radial-gradient(circle,' + c + ',' + lightenHex(c) + ')';
    b.style.transition = 'background 1s ease';
  });

  // Float emojis
  var floatContainer = document.getElementById('mood-float-emojis');
  if (floatContainer) {
    floatContainer.innerHTML = '';
    for (var i = 0; i < 18; i++) {
      (function(idx) {
        setTimeout(function() {
          var em = document.createElement('div');
          em.className = 'mood-float-em';
          em.textContent = emojis[idx % emojis.length] || '✨';
          em.style.left = (Math.random() * 100) + '%';
          em.style.animationDuration = (2.5 + Math.random() * 2) + 's';
          em.style.animationDelay = '0s';
          em.style.fontSize = (1.2 + Math.random() * 1.5) + 'rem';
          floatContainer.appendChild(em);
          setTimeout(function() { em.remove(); }, 5000);
        }, idx * 150);
      })(i);
    }
  }

  // Show banner
  var banner = document.getElementById('mood-banner');
  var moodEm = document.getElementById('moodEmoji');
  var moodNm = document.getElementById('moodName');
  if (banner) {
    banner.classList.remove('hidden');
    if (moodEm) moodEm.textContent = emojis[0] || '✨';
    if (moodNm) moodNm.textContent = name || '-';
  }
};

window.resetMood = function() {
  moodActive = false;
  document.querySelectorAll('.mood-card').forEach(function(c) { c.classList.remove('mood-active'); });

  var overlay = document.getElementById('mood-overlay');
  if (overlay) { overlay.style.background = 'transparent'; overlay.style.opacity = '0'; }

  // Reset blobs
  var blobData = [
    'radial-gradient(circle,#FFD54F,#FF8A65)',
    'radial-gradient(circle,#FF9EC4,#CE93D8)',
    'radial-gradient(circle,#80DEEA,#81D4FA)',
    'radial-gradient(circle,#C5E1A5,#80CBC4)',
    'radial-gradient(circle,#FFE082,#FFAB91)'
  ];
  document.querySelectorAll('.mesh-blob').forEach(function(b, i) {
    b.style.background = blobData[i] || blobData[0];
  });

  var banner = document.getElementById('mood-banner');
  if (banner) banner.classList.add('hidden');

  var floatContainer = document.getElementById('mood-float-emojis');
  if (floatContainer) floatContainer.innerHTML = '';
};

function lightenHex(hex) {
  // Returns a lighter version of hex for gradient
  try {
    hex = hex.replace('#','');
    var r = Math.min(255, parseInt(hex.substr(0,2),16) + 80);
    var g = Math.min(255, parseInt(hex.substr(2,2),16) + 80);
    var b = Math.min(255, parseInt(hex.substr(4,2),16) + 80);
    return 'rgb('+r+','+g+','+b+')';
  } catch(e) { return '#fff'; }
}

/* ══════════════════════════════════════════
   5. FILM STRIP — pause on hover (CSS handles auto-scroll)
      Also drag support
══════════════════════════════════════════ */
function initFilmStrip() {
  var track = document.getElementById('filmTrack');
  if (!track) return;
  var isDragging = false, startX = 0, scrollLeft = 0;

  track.addEventListener('mousedown', function(e) {
    isDragging = true; startX = e.pageX; scrollLeft = track.scrollLeft;
    track.style.animationPlayState = 'paused';
    track.style.cursor = 'grabbing';
  });
  window.addEventListener('mouseup', function() {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = 'grab';
    setTimeout(function() {
      if (!track.matches(':hover')) track.style.animationPlayState = 'running';
    }, 500);
  });
  window.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    e.preventDefault();
    track.scrollLeft = scrollLeft - (e.pageX - startX);
  });
}

/* ══════════════════════════════════════════
   6. TIME CAPSULE
══════════════════════════════════════════ */
var capsules = [];

window.sealCapsule = function() {
  var from = document.getElementById('capFrom').value.trim();
  var to   = document.getElementById('capTo').value.trim();
  var msg  = document.getElementById('capMsg').value.trim();
  var date = document.getElementById('capDate').value;

  if (!from || !to || !msg || !date) {
    ['capFrom','capTo','capMsg','capDate'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && !el.value.trim()) {
        el.style.borderColor = 'var(--c-rose)';
        el.style.animation = 'shake .3s ease';
        setTimeout(function() { el.style.borderColor = ''; el.style.animation = ''; }, 1000);
      }
    });
    return;
  }

  var capsule = { from: from, to: to, msg: msg, date: date, id: Date.now() };
  capsules.push(capsule);
  renderVault();

  // Reset form
  document.getElementById('capFrom').value = '';
  document.getElementById('capTo').value = '';
  document.getElementById('capMsg').value = '';
  document.getElementById('capDate').value = '';

  // Animate seal
  celebrate();
};

function renderVault() {
  var list = document.getElementById('vaultList');
  if (!list) return;
  if (capsules.length === 0) {
    list.innerHTML = '<div class="vault-empty">Belum ada kapsul. Tulis pesanmu! ✨</div>';
    return;
  }
  list.innerHTML = capsules.map(function(c) {
    var openDate = new Date(c.date);
    var now = new Date();
    var canOpen = now >= openDate;
    var dateStr = openDate.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    return '<div class="vault-item ' + (canOpen ? 'unlocked' : 'locked') + '" onclick="openCapsule(' + c.id + ')">' +
      '<div class="vault-item-header">' +
        '<div class="vault-item-icon">' + (canOpen ? '📬' : '🔒') + '</div>' +
        '<div><div class="vault-item-to">Untuk: ' + escHtml(c.to) + '</div><div class="vault-item-from">Dari: ' + escHtml(c.from) + '</div></div>' +
        '<div class="vault-item-date">' + (canOpen ? '✅ Buka' : dateStr) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

window.openCapsule = function(id) {
  var capsule = capsules.find(function(c) { return c.id === id; });
  if (!capsule) return;

  var openDate = new Date(capsule.date);
  var now = new Date();

  if (now < openDate) {
    var remaining = openDate.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
    // Show locked message
    var modal = document.getElementById('capsule-modal');
    document.getElementById('cmTitle').textContent = '🔒 Belum Waktunya!';
    document.getElementById('cmFrom').textContent = 'Kapsul ini bisa dibuka pada: ' + remaining;
    document.getElementById('cmMsg').textContent = 'Bersabarlah... pesan spesial menunggumu di tanggal tersebut. 💌';
    modal.classList.remove('hidden');
    return;
  }

  // Open!
  var modal = document.getElementById('capsule-modal');
  document.getElementById('cmTitle').textContent = '📬 Kapsul Terbuka!';
  document.getElementById('cmFrom').textContent = 'Dari ' + capsule.from + ' · Untuk ' + capsule.to;
  document.getElementById('cmMsg').textContent = '"' + capsule.msg + '"';
  modal.classList.remove('hidden');
  celebrate();
};

window.closeCapsuleModal = function() {
  document.getElementById('capsule-modal').classList.add('hidden');
};

function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════════
   LOADER
══════════════════════════════════════════ */
function startLoader(onDone) {
  var bar  = document.getElementById('loaderBar');
  var pct  = document.getElementById('loaderPct');
  var logo = document.getElementById('loader-logo');

  if (logo) { logo.style.opacity = '1'; logo.style.transform = 'scale(1)'; }

  setTimeout(function() {
    var sub = document.querySelector('.loader-sub');
    if (sub) sub.style.opacity = '1';
    if (pct) pct.style.opacity = '1';
  }, 600);

  var progress = 0;
  var interval = setInterval(function() {
    progress += Math.random() * 16 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent = '100%';
      setTimeout(function() {
        var loader = document.getElementById('loader');
        if (loader) {
          loader.style.transition = 'opacity 0.6s ease';
          loader.style.opacity = '0';
          setTimeout(function() { loader.style.display = 'none'; onDone(); }, 650);
        } else { onDone(); }
      }, 350);
    } else {
      if (bar) bar.style.width = progress + '%';
      if (pct) pct.textContent = Math.round(progress) + '%';
    }
  }, 110);
}

/* ══════════════════════════════════════════
   SLIDE CONTROLLER
══════════════════════════════════════════ */
let currentSlide = 0;
const slides = document.querySelectorAll('.sec');
let isAnimating = false;

function initSlides() {
  if (slides.length > 0) {
    gsap.set(slides[0], { visibility: 'visible', opacity: 1, zIndex: 2 });
    slides[0].classList.add('active');
    animateSlideContent(slides[0]);
  }

  function isSlideAtBottom(slide) { return slide.scrollHeight - slide.scrollTop - slide.clientHeight < 5; }
  function isSlideAtTop(slide) { return slide.scrollTop < 5; }

  let wheelTimeout = null, wheelAccum = 0;
  const WHEEL_THRESHOLD = 160;

  window.addEventListener('wheel', function(e) {
    if (isAnimating) return;
    const activeSlide = slides[currentSlide];
    if (e.deltaY > 0 && !isSlideAtBottom(activeSlide)) return;
    if (e.deltaY < 0 && !isSlideAtTop(activeSlide)) return;
    wheelAccum += e.deltaY;
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => { wheelAccum = 0; }, 300);
    if (wheelAccum > WHEEL_THRESHOLD) { wheelAccum = 0; goToSlide(currentSlide + 1); }
    else if (wheelAccum < -WHEEL_THRESHOLD) { wheelAccum = 0; goToSlide(currentSlide - 1); }
  }, { passive: true });

  window.addEventListener('keydown', function(e) {
    if (isAnimating) return;
    const active = slides[currentSlide];
    if ((e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') && isSlideAtBottom(active)) goToSlide(currentSlide + 1);
    if ((e.key === 'ArrowUp' || e.key === 'PageUp') && isSlideAtTop(active)) goToSlide(currentSlide - 1);
  });

  let touchStartY = 0;
  window.addEventListener('touchstart', e => touchStartY = e.touches[0].clientY, { passive: true });
  window.addEventListener('touchend', e => {
    if (isAnimating) return;
    const active = slides[currentSlide];
    let diff = touchStartY - e.changedTouches[0].clientY;
    if (diff > 80 && isSlideAtBottom(active)) goToSlide(currentSlide + 1);
    else if (diff < -80 && isSlideAtTop(active)) goToSlide(currentSlide - 1);
  }, { passive: true });
}

window.goToSlide = function(index) {
  if (isAnimating || index < 0 || index >= slides.length || index === currentSlide) return;
  isAnimating = true;

  const nextSlide = slides[index];
  const prevSlide = slides[currentSlide];
  const direction = index > currentSlide ? 1 : -1;

  gsap.set(nextSlide, { visibility: 'visible', zIndex: 3 });
  gsap.set(prevSlide, { zIndex: 2 });

  const nextReveals = nextSlide.querySelectorAll('.reveal, .reveal-word, .member-card, .val-card');
  gsap.set(nextReveals, { opacity: 0, y: 50, scale: 0.95 });

  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(prevSlide, { visibility: 'hidden', zIndex: 1 });
      prevSlide.classList.remove('active');
      nextSlide.classList.add('active');
      currentSlide = index;
      isAnimating = false;
    }
  });

  tl.fromTo(nextSlide,
    { y: direction * window.innerHeight, opacity: 0.3 },
    { y: 0, opacity: 1, duration: 1.2, ease: "power4.inOut" }, 0
  ).to(prevSlide,
    { y: -direction * (window.innerHeight * 0.5), opacity: 0, scale: 0.9, duration: 1.2, ease: "power4.inOut" }, 0
  );

  animateSlideContent(nextSlide, 0.6);
};

function animateSlideContent(slide, delayAmount = 0) {
  const reveals = slide.querySelectorAll('.reveal, .reveal-word');
  const cards   = slide.querySelectorAll('.member-card, .val-card');
  if (reveals.length) gsap.to(reveals, { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.05, ease: "back.out(1.5)", delay: delayAmount });
  if (cards.length)   gsap.to(cards,   { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.1,  ease: "power3.out",    delay: delayAmount + 0.3 });
}

/* ══════════════════════════════════════════
   CONFETTI
══════════════════════════════════════════ */
window.celebrate = function() {
  if (!window.confetti) return;
  var colors = ['#FF6B8A','#FFB347','#26C6DA','#66BB6A','#5C9EFF','#CE93D8'];
  var end = Date.now() + 3000;
  (function fire() {
    if (Date.now() > end) return;
    confetti({ startVelocity:30, spread:360, ticks:60, zIndex:99999, particleCount:28, colors:colors, origin:{ x:Math.random()*0.4, y:Math.random()-0.2 }});
    confetti({ startVelocity:30, spread:360, ticks:60, zIndex:99999, particleCount:28, colors:colors, origin:{ x:0.6+Math.random()*0.4, y:Math.random()-0.2 }});
    setTimeout(fire, 250);
  })();
};

/* ══════════════════════════════════════════
   NAV + MOBILE MENU
══════════════════════════════════════════ */
function initNav() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

ready(function() {
  var burger = document.getElementById('burgerBtn');
  var mmenu  = document.getElementById('mobile-menu');
  if (burger && mmenu) {
    burger.addEventListener('click', function() {
      var open = mmenu.classList.toggle('open');
      burger.classList.toggle('open', open);
    });
  }
  var navCelebrate = document.getElementById('navCelebrate');
  if (navCelebrate) navCelebrate.addEventListener('click', window.celebrate);
});

window.closeMM = function() {
  var burger = document.getElementById('burgerBtn');
  var mmenu  = document.getElementById('mobile-menu');
  if (mmenu) mmenu.classList.remove('open');
  if (burger) burger.classList.remove('open');
};

/* ══════════════════════════════════════════
   TIMELINE DRAG
══════════════════════════════════════════ */
ready(function() {
  var tlPos = 0, tlDrag = false, tlSX = 0, tlSP = 0;
  var tlTrack = document.getElementById('tlTrack');
  if (!tlTrack) return;

  tlTrack.addEventListener('mousedown', function(e) { tlDrag = true; tlSX = e.clientX; tlSP = tlPos; tlTrack.style.transition = 'none'; });
  window.addEventListener('mousemove', function(e) {
    if (!tlDrag) return;
    var min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP + (e.clientX - tlSX), 0), min);
    tlTrack.style.transform = 'translateX(' + tlPos + 'px)';
  });
  window.addEventListener('mouseup', function() { if (tlDrag) { tlDrag = false; tlTrack.style.transition = ''; } });

  var tlTY = 0;
  tlTrack.addEventListener('touchstart', function(e) { tlTY = e.touches[0].clientX; tlSP = tlPos; }, { passive: true });
  tlTrack.addEventListener('touchmove', function(e) {
    var min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP + (e.touches[0].clientX - tlTY), 0), min);
    tlTrack.style.transform = 'translateX(' + tlPos + 'px)';
  }, { passive: true });

  function tlMove(dir) {
    var min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth + 100);
    tlPos = Math.max(Math.min(tlPos - dir * 280, 0), min);
    tlTrack.style.transition = 'transform 0.5s cubic-bezier(.16,1,.3,1)';
    tlTrack.style.transform = 'translateX(' + tlPos + 'px)';
  }
  var tlPrev = document.getElementById('tlPrev');
  var tlNext = document.getElementById('tlNext');
  if (tlPrev) tlPrev.addEventListener('click', function() { tlMove(-1); });
  if (tlNext) tlNext.addEventListener('click', function() { tlMove(1); });
});

/* ══════════════════════════════════════════
   LIGHTBOX
══════════════════════════════════════════ */
window.openLb = function(src) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb').classList.add('open');
};
window.closeLb = function() {
  document.getElementById('lb').classList.remove('open');
};
ready(function() {
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { window.closeLb(); closeCapsuleModal(); } });
  var lb = document.getElementById('lb');
  if (lb) lb.addEventListener('click', function(e) { if (e.target.id === 'lb') window.closeLb(); });
  var modal = document.getElementById('capsule-modal');
  if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) closeCapsuleModal(); });
});

/* ══════════════════════════════════════════
   GUESTBOOK
══════════════════════════════════════════ */
var MSG_COLORS = ['var(--c-rose)','var(--c-amber)','var(--c-teal)','var(--c-blue)','var(--c-green)'];
window.addMsg = function() {
  var name = document.getElementById('gbName').value.trim();
  var rel  = document.getElementById('gbRel').value;
  var msg  = document.getElementById('gbMsg').value.trim();
  if (!name || !msg) {
    ['gbName','gbMsg'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && !el.value.trim()) { el.style.borderColor = 'var(--c-rose)'; setTimeout(function() { el.style.borderColor = ''; }, 1500); }
    });
    return;
  }
  var color = MSG_COLORS[Math.floor(Math.random() * MSG_COLORS.length)];
  var time  = new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  var div   = document.createElement('div');
  div.className = 'msg-card';
  div.style.borderLeftColor = color;
  div.style.opacity = '0'; div.style.transform = 'translateX(-20px)';
  div.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  div.innerHTML =
    '<div class="msg-top">' +
      '<div class="msg-av" style="background:' + color + '">' + escHtml(name)[0].toUpperCase() + '</div>' +
      '<div><span class="msg-name">' + escHtml(name) + '</span><span class="msg-rel">' + escHtml(rel) + '</span></div>' +
      '<span class="msg-time">' + time + '</span>' +
    '</div><p class="msg-txt">"' + escHtml(msg) + '"</p>';
  var list = document.getElementById('msgList');
  list.insertBefore(div, list.firstChild);
  setTimeout(function() { div.style.opacity = '1'; div.style.transform = 'translateX(0)'; }, 10);
  document.getElementById('gbName').value = '';
  document.getElementById('gbMsg').value = '';
  window.celebrate();
};

/* ══════════════════════════════════════════
   THREE.JS BG (kept from original)
══════════════════════════════════════════ */
function initThree() {
  if (!window.THREE) return;
  var canvas = document.getElementById('webgl-bg');
  if (!canvas) return;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  var N = 1500, positions = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) { positions[i*3]=(Math.random()-.5)*30; positions[i*3+1]=(Math.random()-.5)*20; positions[i*3+2]=(Math.random()-.5)*12; }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var pMat = new THREE.PointsMaterial({ color:0xE8972A, size:0.06, transparent:true, opacity:0.35, sizeAttenuation:true });
  var pts = new THREE.Points(pGeo, pMat);
  scene.add(pts);
  var clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    var t = clock.getElapsedTime();
    pts.rotation.y = t * 0.012; pts.rotation.x = t * 0.004;
    renderer.render(scene, camera);
  })();
}

/* ══════════════════════════════════════════
   BOOT
══════════════════════════════════════════ */
ready(function() {
  initThree();
  startLoader(function() {
    var navEls = document.querySelectorAll('.nav-logo, #navLinks, .nav-burger');
    navEls.forEach(function(el) { el.style.opacity = '1'; });
    initSlides();
    initNav();
    initCursor();
    initCountdown();
    initFilmStrip();
  });
});
