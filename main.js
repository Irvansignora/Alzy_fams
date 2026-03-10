/* ════════════════════════════════════════
   ALZY FAMILY — main.js
   Warm Light Theme · Three.js · GSAP
   ════════════════════════════════════════ */

window.addEventListener('load', function () {

  const gsap = window.gsap;
  if (!gsap) {
    // GSAP failed to load — just hide loader and show page
    const l = document.getElementById('loader');
    if (l) l.style.display = 'none';
    document.querySelectorAll('.reveal,.reveal-word').forEach(el => el.classList.add('in'));
    return;
  }

  /* ══ THREE.JS WARM PARTICLE BG ══ */
  function initThree() {
    const canvas = document.getElementById('webgl-bg');
    if (!canvas || !window.THREE) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
    camera.position.z = 5;

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
        gl_FragColor = vec4(0.88, 0.55, 0.35, a * 0.3);
      }
    `;
    const TRAIL_FRAG = `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        if(length(uv) > 0.5) discard;
        float g = exp(-length(uv) * 6.0);
        gl_FragColor = vec4(0.9, 0.4, 0.2, g * vAlpha);
      }
    `;
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

    // Particles
    const N = 1800;
    const pos = new Float32Array(N*3), sz = new Float32Array(N), al = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i*3]=(Math.random()-.5)*32; pos[i*3+1]=(Math.random()-.5)*22; pos[i*3+2]=(Math.random()-.5)*14;
      sz[i]=Math.random()*2.5+0.5; al[i]=Math.random()*0.35+0.05;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    pGeo.setAttribute('aSize',    new THREE.BufferAttribute(sz,1));
    pGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(al,1));
    const pMat = new THREE.ShaderMaterial({ vertexShader:PART_VERT, fragmentShader:PART_FRAG, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending });
    const pts = new THREE.Points(pGeo, pMat);
    scene.add(pts);

    // Orbs
    const orbDefs = [
      { color:'#E05252', x:3.2,  y:1.5,  z:-2,   r:1.8 },
      { color:'#E8972A', x:-3.0, y:-1.2, z:-1.5, r:1.4 },
      { color:'#009688', x:0.5,  y:-2.5, z:-3,   r:1.1 },
      { color:'#E05252', x:-1.5, y:2.2,  z:-4,   r:0.9 },
    ];
    const orbs = orbDefs.map(def => {
      const mat = new THREE.ShaderMaterial({
        vertexShader:ORB_VERT, fragmentShader:ORB_FRAG,
        uniforms:{ uTime:{value:0}, uColor:{value:new THREE.Color(def.color)}, uOpacity:{value:0.15} },
        transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      });
      const m = new THREE.Mesh(new THREE.SphereGeometry(def.r,48,48), mat);
      m.position.set(def.x,def.y,def.z); scene.add(m);
      gsap.to(m.position,{ y:def.y+.7+Math.random()*.5, duration:3+Math.random()*3, yoyo:true, repeat:-1, ease:'sine.inOut', delay:Math.random()*2 });
      return m;
    });

    // Mouse trail
    const TM = 100;
    const tPos=new Float32Array(TM*3), tAl=new Float32Array(TM), tSz=new Float32Array(TM);
    for(let i=0;i<TM;i++){tPos[i*3]=9999; tSz[i]=Math.random()*4+2;}
    const tGeo=new THREE.BufferGeometry();
    tGeo.setAttribute('position',new THREE.BufferAttribute(tPos,3));
    tGeo.setAttribute('aAlpha',  new THREE.BufferAttribute(tAl,1));
    tGeo.setAttribute('aSize',   new THREE.BufferAttribute(tSz,1));
    const tMat=new THREE.ShaderMaterial({ vertexShader:PART_VERT, fragmentShader:TRAIL_FRAG, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending });
    scene.add(new THREE.Points(tGeo,tMat));

    let tHead=0,mx3=0,my3=0,lx=0,ly=0,mx=0,my=0;
    document.addEventListener('mousemove',e=>{
      mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2;
      mx3=mx*6; my3=-my*4;
      const dx=mx3-lx,dy=my3-ly,spd=Math.sqrt(dx*dx+dy*dy);
      if(spd>.02){
        const i=tHead%TM;
        tPos[i*3]=mx3+(Math.random()-.5)*.3; tPos[i*3+1]=my3+(Math.random()-.5)*.3; tPos[i*3+2]=(Math.random()-.5)*.5;
        tAl[i]=0.7; tSz[i]=Math.min(spd*14+2,8); tHead++;
        tGeo.attributes.position.needsUpdate=true; tGeo.attributes.aAlpha.needsUpdate=true; tGeo.attributes.aSize.needsUpdate=true;
      }
      lx=mx3; ly=my3;
    });

    window.addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

    const clock=new THREE.Clock();
    (function loop(){
      requestAnimationFrame(loop);
      const t=clock.getElapsedTime();
      orbs.forEach(o=>{ o.material.uniforms.uTime.value=t; o.rotation.y=t*.08; o.rotation.x=t*.05; });
      for(let i=0;i<TM;i++) if(tAl[i]>.001) tAl[i]*=.93;
      tGeo.attributes.aAlpha.needsUpdate=true;
      pts.rotation.y=t*.015; pts.rotation.x=t*.005;
      camera.position.x+=(mx*.3-camera.position.x)*.03;
      camera.position.y+=(-my*.2-camera.position.y)*.03;
      renderer.render(scene,camera);
    })();
  }

  /* ══ LOADER ══ */
  function runLoader(onComplete) {
    const bar     = document.getElementById('loaderBar');
    const pct     = document.getElementById('loaderPct');
    const logoImg = document.getElementById('loader-logo');
    const chars   = document.querySelectorAll('.lt-char');
    const sub     = document.querySelector('.loader-sub');

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to('#loader', {
          opacity: 0, duration: 0.6, ease: 'power2.in',
          onComplete: () => {
            const l = document.getElementById('loader');
            if (l) l.style.display = 'none';
            onComplete();
          }
        });
      }
    });

    tl.set(logoImg, { opacity: 0, scale: 0.5 })
      .set(chars,   { opacity: 0, y: 30 })
      .set(sub,     { opacity: 0 })
      .set(pct,     { opacity: 0 })
      .to(logoImg,  { opacity:1, scale:1, duration:.7, ease:'back.out(2)' }, 0.2)
      .to(chars,    { opacity:1, y:0, duration:.5, stagger:.04, ease:'power3.out' }, 0.5)
      .to([sub,pct],{ opacity:1, duration:.4 }, 0.9)
      .to(bar,      {
        width: '100%', duration: 1.8, ease: 'power1.inOut',
        onUpdate() {
          const w = parseFloat(bar.style.width) || 0;
          if (pct) pct.textContent = Math.round(w) + '%';
        }
      }, 1.0)
      .to({}, { duration: 0.3 });
  }

  /* ══ SCROLL REVEAL ══ */
  function initReveal() {
    const els = [...document.querySelectorAll('.reveal'), ...document.querySelectorAll('.reveal-word')];

    // stagger delays
    document.querySelectorAll('.hero-h1, .section-h2, .penutup-h2').forEach(h => {
      h.querySelectorAll('.reveal-word').forEach((w,i) => { w.style.transitionDelay = (i*90)+'ms'; });
    });
    document.querySelectorAll('.member-card.reveal').forEach(el => {
      el.style.transitionDelay = (el.getAttribute('data-delay')||0)+'ms';
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          el.classList.remove('out'); el.classList.add('in');
        } else {
          const rect = entry.boundingClientRect;
          el.classList.remove('in');
          if (rect.top < 0) el.classList.add('out');
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    els.forEach(el => obs.observe(el));
  }

  /* ══ NAV ══ */
  function initNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* ══ CURSOR ══ */
  function initCursor() {
    const dot  = document.getElementById('cur-dot');
    const ring = document.getElementById('cur-ring');
    if (!dot || !ring) return;
    let cx=0,cy=0,rx=0,ry=0;
    document.addEventListener('mousemove', e => { cx=e.clientX; cy=e.clientY; gsap.set(dot,{x:cx,y:cy}); });
    gsap.ticker.add(() => { rx+=(cx-rx)*.1; ry+=(cy-ry)*.1; gsap.set(ring,{x:rx,y:ry}); });
    document.querySelectorAll('a,button,.member-card,.gp,.val-card,.tl-btn,.msg-card,.nav-link').forEach(el => {
      el.addEventListener('mouseenter',()=>document.body.classList.add('hov'));
      el.addEventListener('mouseleave',()=>document.body.classList.remove('hov'));
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
  window.closeMM = () => { mmenu&&mmenu.classList.remove('open'); burger&&burger.classList.remove('open'); };

  /* ══ SCROLL TO SECTION ══ */
  window.scrollToSection = id => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior:'smooth' });
  };

  /* ══ TIMELINE DRAG ══ */
  let tlPos=0, tlDrag=false, tlSX=0, tlSP=0;
  const tlTrack = document.getElementById('tlTrack');
  if (tlTrack) {
    tlTrack.addEventListener('mousedown', e=>{ tlDrag=true; tlSX=e.clientX; tlSP=tlPos; tlTrack.style.transition='none'; });
    window.addEventListener('mousemove', e=>{
      if(!tlDrag) return;
      const min=-(tlTrack.scrollWidth-tlTrack.parentElement.offsetWidth);
      tlPos=Math.max(Math.min(tlSP+(e.clientX-tlSX),0),min);
      tlTrack.style.transform=`translateX(${tlPos}px)`;
    });
    window.addEventListener('mouseup',()=>{ if(tlDrag){tlDrag=false;tlTrack.style.transition='';} });
    let tlTY=0;
    tlTrack.addEventListener('touchstart',e=>{tlTY=e.touches[0].clientX;tlSP=tlPos;},{passive:true});
    tlTrack.addEventListener('touchmove',e=>{
      const min=-(tlTrack.scrollWidth-tlTrack.parentElement.offsetWidth);
      tlPos=Math.max(Math.min(tlSP+(e.touches[0].clientX-tlTY),0),min);
      tlTrack.style.transform=`translateX(${tlPos}px)`;
    },{passive:true});
  }
  const tlMove = dir => {
    if(!tlTrack) return;
    const min=-(tlTrack.scrollWidth-tlTrack.parentElement.offsetWidth+100);
    tlPos=Math.max(Math.min(tlPos-dir*280,0),min);
    gsap.to(tlTrack,{x:tlPos,duration:.6,ease:'power3.out'});
  };
  const tlPrev=document.getElementById('tlPrev'); if(tlPrev) tlPrev.onclick=()=>tlMove(-1);
  const tlNext=document.getElementById('tlNext'); if(tlNext) tlNext.onclick=()=>tlMove(1);

  /* ══ LIGHTBOX ══ */
  window.openLb = src => { document.getElementById('lb-img').src=src; document.getElementById('lb').classList.add('open'); };
  window.closeLb = ()=>{ document.getElementById('lb').classList.remove('open'); };
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') window.closeLb(); });
  const lb=document.getElementById('lb');
  if(lb) lb.addEventListener('click',e=>{ if(e.target.id==='lb') window.closeLb(); });

  /* ══ GUESTBOOK ══ */
  const COLORS=['var(--c-rose)','var(--c-amber)','var(--c-teal)','var(--c-blue)','var(--c-green)'];
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  window.addMsg = () => {
    const name=document.getElementById('gbName').value.trim();
    const rel =document.getElementById('gbRel').value;
    const msg =document.getElementById('gbMsg').value.trim();
    if(!name||!msg){
      ['gbName','gbMsg'].forEach(id=>{
        const el=document.getElementById(id);
        if(!el.value.trim()){ el.style.borderColor='var(--c-rose)'; gsap.fromTo(el,{x:0},{x:7,yoyo:true,repeat:5,duration:.06,onComplete:()=>el.style.borderColor=''}); }
      }); return;
    }
    const color=COLORS[Math.floor(Math.random()*COLORS.length)];
    const time=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
    const div=document.createElement('div');
    div.className='msg-card'; div.style.cssText=`border-left-color:${color};opacity:0;transform:translateX(-20px)`;
    div.innerHTML=`<div class="msg-top"><div class="msg-av" style="background:${color}">${esc(name)[0].toUpperCase()}</div><div><span class="msg-name">${esc(name)}</span><span class="msg-rel">${esc(rel)}</span></div><span class="msg-time">${time}</span></div><p class="msg-txt">"${esc(msg)}"</p>`;
    document.getElementById('msgList').insertBefore(div,document.getElementById('msgList').firstChild);
    gsap.to(div,{opacity:1,x:0,duration:.5,ease:'power3.out'});
    document.getElementById('gbName').value=''; document.getElementById('gbMsg').value='';
    window.celebrate();
  };

  /* ══ CONFETTI ══ */
  window.celebrate = () => {
    if(!window.confetti) return;
    const end=Date.now()+3000;
    const colors=['#E05252','#E8972A','#009688','#4285F4','#4CAF50'];
    const iv=setInterval(()=>{
      const t=end-Date.now(); if(t<=0) return clearInterval(iv);
      const n=35*(t/3000);
      confetti({startVelocity:32,spread:360,ticks:65,zIndex:99999,particleCount:n,colors,origin:{x:Math.random()*.4,y:Math.random()-.2}});
      confetti({startVelocity:32,spread:360,ticks:65,zIndex:99999,particleCount:n,colors,origin:{x:.6+Math.random()*.4,y:Math.random()-.2}});
    },250);
  };
  const navCelebrate=document.getElementById('navCelebrate');
  if(navCelebrate) navCelebrate.onclick=window.celebrate;

  /* ══ BOOT ══ */
  initThree();

  runLoader(() => {
    // Show nav
    gsap.set(['.nav-logo','#navLinks','.nav-burger'],{opacity:0});
    gsap.to(['.nav-logo','#navLinks','.nav-burger'],{opacity:1,duration:.6,stagger:.08,ease:'power3.out'});

    // Reveal hero immediately
    setTimeout(() => {
      document.querySelectorAll('#s0 .reveal, #s0 .reveal-word').forEach((el,i) => {
        setTimeout(() => el.classList.add('in'), i * 55);
      });
    }, 80);

    initReveal();
    initNav();
    initCursor();
  });

}); // end window.load
