/* ════════════════════════════════════
   ALZY FAMILY — main.js (FIXED)
   No module, no defer, plain script
   ════════════════════════════════════ */

/* ── helper: run after DOM ready ── */
function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

/* ── LOADER: pure CSS animation + JS progress ── */
function startLoader(onDone) {
  var bar  = document.getElementById('loaderBar');
  var pct  = document.getElementById('loaderPct');
  var logo = document.getElementById('loader-logo');

  // Immediately show logo
  if (logo) { logo.style.opacity = '1'; logo.style.transform = 'scale(1)'; }

  // Animate chars
  var chars = document.querySelectorAll('.lt-char');
  chars.forEach(function(c, i) {
    setTimeout(function() {
      c.style.opacity = '1';
      c.style.transform = 'translateY(0)';
    }, 400 + i * 50);
  });

  // Show sub + pct
  setTimeout(function() {
    var sub = document.querySelector('.loader-sub');
    if (sub) sub.style.opacity = '1';
    if (pct) pct.style.opacity = '1';
  }, 800);

  // Animate progress bar
  var progress = 0;
  var interval = setInterval(function() {
    progress += Math.random() * 18 + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      if (bar) bar.style.width = '100%';
      if (pct) pct.textContent = '100%';
      // Hide loader after short delay
      setTimeout(function() {
        var loader = document.getElementById('loader');
        if (loader) {
          loader.style.transition = 'opacity 0.6s ease';
          loader.style.opacity = '0';
          setTimeout(function() {
            loader.style.display = 'none';
            onDone();
          }, 650);
        } else {
          onDone();
        }
      }, 400);
    } else {
      if (bar) bar.style.width = progress + '%';
      if (pct) pct.textContent = Math.round(progress) + '%';
    }
  }, 120);
}

/* ── SCROLL REVEAL ── */
function initReveal() {
  var all = document.querySelectorAll('.reveal, .reveal-word');

  // stagger delays for headings
  document.querySelectorAll('.hero-h1, .section-h2, .penutup-h2').forEach(function(h) {
    h.querySelectorAll('.reveal-word').forEach(function(w, i) {
      w.style.transitionDelay = (i * 90) + 'ms';
    });
  });

  // stagger for member cards
  document.querySelectorAll('.member-card.reveal').forEach(function(el) {
    el.style.transitionDelay = (el.getAttribute('data-delay') || 0) + 'ms';
  });

  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything
    all.forEach(function(el) { el.classList.add('in'); });
    return;
  }

  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var el = entry.target;
      if (entry.isIntersecting) {
        el.classList.remove('out');
        el.classList.add('in');
      } else {
        var rect = entry.boundingClientRect;
        el.classList.remove('in');
        if (rect.top < 0) el.classList.add('out');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  all.forEach(function(el) { obs.observe(el); });
}

/* ── NAV ── */
function initNav() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 20) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }, { passive: true });
}

/* ── CURSOR ── */
function initCursor() {
  var dot  = document.getElementById('cur-dot');
  var ring = document.getElementById('cur-ring');
  if (!dot || !ring) return;

  var cx = 0, cy = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', function(e) {
    cx = e.clientX; cy = e.clientY;
    dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
  });

  (function cursorLoop() {
    rx += (cx - rx) * 0.1;
    ry += (cy - ry) * 0.1;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
    requestAnimationFrame(cursorLoop);
  })();

  document.querySelectorAll('a, button, .member-card, .gp, .val-card, .tl-btn, .msg-card, .nav-link').forEach(function(el) {
    el.addEventListener('mouseenter', function() { document.body.classList.add('hov'); });
    el.addEventListener('mouseleave', function() { document.body.classList.remove('hov'); });
  });
}

/* ── THREE.JS BG ── */
function initThree() {
  if (!window.THREE) return;
  var canvas = document.getElementById('webgl-bg');
  if (!canvas) return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Simple warm particles
  var N = 1500;
  var positions = new Float32Array(N * 3);
  for (var i = 0; i < N; i++) {
    positions[i*3]   = (Math.random() - 0.5) * 30;
    positions[i*3+1] = (Math.random() - 0.5) * 20;
    positions[i*3+2] = (Math.random() - 0.5) * 12;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  var pMat = new THREE.PointsMaterial({
    color: 0xE8972A,
    size: 0.06,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true
  });
  var pts = new THREE.Points(pGeo, pMat);
  scene.add(pts);

  // Warm glowing spheres
  var orbColors = [0xE05252, 0xE8972A, 0x009688, 0xE05252];
  var orbPositions = [
    [3.2, 1.5, -2], [-3.0, -1.2, -1.5], [0.5, -2.5, -3], [-1.5, 2.2, -4]
  ];
  var orbs = [];
  orbColors.forEach(function(col, idx) {
    var geo = new THREE.SphereGeometry(1.2 - idx * 0.15, 32, 32);
    var mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.08 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(orbPositions[idx][0], orbPositions[idx][1], orbPositions[idx][2]);
    scene.add(mesh);
    orbs.push({ mesh: mesh, baseY: orbPositions[idx][1], speed: 0.3 + Math.random() * 0.3, phase: Math.random() * Math.PI * 2 });
  });

  var mx = 0, my = 0;
  document.addEventListener('mousemove', function(e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  var clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    var t = clock.getElapsedTime();
    pts.rotation.y = t * 0.012;
    pts.rotation.x = t * 0.004;
    orbs.forEach(function(o) {
      o.mesh.position.y = o.baseY + Math.sin(t * o.speed + o.phase) * 0.6;
      o.mesh.rotation.y = t * 0.06;
    });
    camera.position.x += (mx * 0.3 - camera.position.x) * 0.03;
    camera.position.y += (-my * 0.2 - camera.position.y) * 0.03;
    renderer.render(scene, camera);
  })();
}

/* ── MOBILE MENU ── */
ready(function() {
  var burger = document.getElementById('burgerBtn');
  var mmenu  = document.getElementById('mobile-menu');
  if (burger && mmenu) {
    burger.addEventListener('click', function() {
      var open = mmenu.classList.toggle('open');
      burger.classList.toggle('open', open);
    });
  }
});

window.closeMM = function() {
  var burger = document.getElementById('burgerBtn');
  var mmenu  = document.getElementById('mobile-menu');
  if (mmenu) mmenu.classList.remove('open');
  if (burger) burger.classList.remove('open');
};

/* ── SCROLL TO SECTION ── */
window.scrollToSection = function(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var top = el.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top: top, behavior: 'smooth' });
};

/* ── TIMELINE ── */
ready(function() {
  var tlPos = 0, tlDrag = false, tlSX = 0, tlSP = 0;
  var tlTrack = document.getElementById('tlTrack');
  if (!tlTrack) return;

  tlTrack.addEventListener('mousedown', function(e) {
    tlDrag = true; tlSX = e.clientX; tlSP = tlPos;
    tlTrack.style.transition = 'none';
  });
  window.addEventListener('mousemove', function(e) {
    if (!tlDrag) return;
    var min = -(tlTrack.scrollWidth - tlTrack.parentElement.offsetWidth);
    tlPos = Math.max(Math.min(tlSP + (e.clientX - tlSX), 0), min);
    tlTrack.style.transform = 'translateX(' + tlPos + 'px)';
  });
  window.addEventListener('mouseup', function() {
    if (tlDrag) { tlDrag = false; tlTrack.style.transition = ''; }
  });

  // Touch
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

/* ── LIGHTBOX ── */
window.openLb = function(src) {
  document.getElementById('lb-img').src = src;
  document.getElementById('lb').classList.add('open');
};
window.closeLb = function() {
  document.getElementById('lb').classList.remove('open');
};
ready(function() {
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') window.closeLb(); });
  var lb = document.getElementById('lb');
  if (lb) lb.addEventListener('click', function(e) { if (e.target.id === 'lb') window.closeLb(); });
});

/* ── GUESTBOOK ── */
var MSG_COLORS = ['var(--c-rose)', 'var(--c-amber)', 'var(--c-teal)', 'var(--c-blue)', 'var(--c-green)'];
function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
window.addMsg = function() {
  var name = document.getElementById('gbName').value.trim();
  var rel  = document.getElementById('gbRel').value;
  var msg  = document.getElementById('gbMsg').value.trim();
  if (!name || !msg) {
    ['gbName','gbMsg'].forEach(function(id) {
      var el = document.getElementById(id);
      if (!el.value.trim()) {
        el.style.borderColor = 'var(--c-rose)';
        setTimeout(function() { el.style.borderColor = ''; }, 1500);
      }
    });
    return;
  }
  var color = MSG_COLORS[Math.floor(Math.random() * MSG_COLORS.length)];
  var time  = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  var div   = document.createElement('div');
  div.className = 'msg-card';
  div.style.borderLeftColor = color;
  div.style.opacity = '0';
  div.style.transform = 'translateX(-20px)';
  div.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  div.innerHTML =
    '<div class="msg-top">' +
      '<div class="msg-av" style="background:' + color + '">' + escHtml(name)[0].toUpperCase() + '</div>' +
      '<div><span class="msg-name">' + escHtml(name) + '</span><span class="msg-rel">' + escHtml(rel) + '</span></div>' +
      '<span class="msg-time">' + time + '</span>' +
    '</div>' +
    '<p class="msg-txt">"' + escHtml(msg) + '"</p>';
  var list = document.getElementById('msgList');
  list.insertBefore(div, list.firstChild);
  setTimeout(function() { div.style.opacity = '1'; div.style.transform = 'translateX(0)'; }, 10);
  document.getElementById('gbName').value = '';
  document.getElementById('gbMsg').value = '';
  window.celebrate();
};

/* ── CONFETTI ── */
window.celebrate = function() {
  if (!window.confetti) return;
  var colors = ['#E05252','#E8972A','#009688','#4285F4','#4CAF50'];
  var end = Date.now() + 3000;
  (function fire() {
    if (Date.now() > end) return;
    var n = 30;
    confetti({ startVelocity:30, spread:360, ticks:60, zIndex:99999, particleCount:n, colors:colors, origin:{ x:Math.random()*0.4, y:Math.random()-0.2 }});
    confetti({ startVelocity:30, spread:360, ticks:60, zIndex:99999, particleCount:n, colors:colors, origin:{ x:0.6+Math.random()*0.4, y:Math.random()-0.2 }});
    setTimeout(fire, 250);
  })();
};

ready(function() {
  var navCelebrate = document.getElementById('navCelebrate');
  if (navCelebrate) navCelebrate.addEventListener('click', window.celebrate);
});

/* ════ BOOT ════ */
ready(function() {
  initThree();

  startLoader(function() {
    // Show nav
    var navEls = document.querySelectorAll('.nav-logo, #navLinks, .nav-burger');
    navEls.forEach(function(el) { el.style.opacity = '1'; });

    // Reveal hero section immediately
    var heroReveal = document.querySelectorAll('#s0 .reveal, #s0 .reveal-word');
    heroReveal.forEach(function(el, i) {
      setTimeout(function() { el.classList.add('in'); }, i * 60);
    });

    // Init scroll reveal for rest of page
    initReveal();
    initNav();
    initCursor();
  });
});
