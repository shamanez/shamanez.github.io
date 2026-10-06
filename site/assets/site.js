(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPreference = null;
  try { motionPreference = localStorage.getItem('shamane-motion'); } catch {}
  let moving = motionPreference === 'off' ? false : !reduce.matches;
  function setMotion(on, save = false) {
    moving = on && !reduce.matches;
    root.dataset.motion = moving ? 'on' : 'off';
    document.querySelectorAll('.motion-toggle').forEach(button => {
      button.textContent = moving ? 'MOTION ON' : 'MOTION OFF';
      button.setAttribute('aria-pressed', String(moving));
      button.setAttribute('aria-label', moving ? 'Turn off animations' : reduce.matches ? 'Animations follow your reduced motion preference' : 'Turn on animations');
    });
    if (save) { motionPreference = moving ? 'on' : 'off'; try { localStorage.setItem('shamane-motion', motionPreference); } catch {} }
    window.dispatchEvent(new Event('motionchange'));
  }
  setMotion(moving);
  document.querySelectorAll('.motion-toggle').forEach(button => button.addEventListener('click', () => setMotion(!moving, true)));
  reduce.addEventListener('change', () => setMotion(motionPreference !== 'off'));

  let booted = false;
  try { booted = sessionStorage.getItem('shamane-initialized') === '1'; sessionStorage.setItem('shamane-initialized', '1'); } catch { booted = true; }
  if (!booted && moving && document.querySelector('.hero')) {
    const boot = document.createElement('div');
    boot.className = 'boot-console'; boot.setAttribute('aria-hidden', 'true');
    const text = document.createElement('pre');
    const hint = document.createElement('span'); hint.className = 'boot-skip'; hint.textContent = 'ESC TO SKIP';
    boot.append(text, hint); document.body.append(boot);
    const lines = ['[s_] INITIALIZING SHAMANE’S CORNER', '     0x5f2a · 0x91c0 · 0x8b7e', '[OK] RESEARCH INDEX MOUNTED', '[OK] FIELD NOTES DECRYPTED', '     WELCOME TO THE LATENT SPACE_'];
    const timers = lines.map((line, i) => setTimeout(() => { text.textContent += line + '\n'; }, i * 120));
    const close = () => { timers.forEach(clearTimeout); boot.classList.add('is-done'); setTimeout(() => boot.remove(), 200); document.removeEventListener('keydown', skip); };
    const skip = event => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', skip); timers.push(setTimeout(close, 820));
  }

  const canvas = document.getElementById('mesh');
  if (canvas) {
    const context = canvas.getContext('2d');
    if (context) {
      const count = 216;
      const points = Array.from({ length: count }, (_, i) => {
        const y = 1 - (i / (count - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const angle = Math.PI * (3 - Math.sqrt(5)) * i;
        const uneven = 1 + .045 * Math.sin(i * 1.37);
        return { x: Math.cos(angle) * radius * uneven, y: y * uneven, z: Math.sin(angle) * radius * uneven };
      });
      const edges = [];
      points.forEach((a, i) => {
        points.map((b, j) => ({ j, d: (a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2 })).filter(b => b.j !== i).sort((a, b) => a.d-b.d).slice(0, 5).forEach(b => { if (b.j > i) edges.push([i, b.j]); });
      });
      let width = 0, height = 0, angle = .42, frame = 0, visible = true, lastTime = 0;
      let pointerX = 0, pointerY = 0;
      function draw(time = 0) {
        if (moving && lastTime) angle += Math.min(time-lastTime, 40) * .00007;
        lastTime = time;
        context.clearRect(0, 0, width, height);
        const scale = Math.min(width*.34, height*.42);
        const ax = -.15 + pointerY * .10, ay = angle + pointerX * .15;
        const transformed = points.map(point => {
          const x = point.x * Math.cos(ay) + point.z * Math.sin(ay);
          const z = -point.x * Math.sin(ay) + point.z * Math.cos(ay);
          const y = point.y * Math.cos(ax) - z * Math.sin(ax);
          const depth = point.y * Math.sin(ax) + z * Math.cos(ax);
          const perspective = 3.8 / (3.8 - depth);
          return { x: width/2 + x*scale*perspective, y: height/2 + y*scale*.94*perspective, depth };
        });
        context.lineWidth = .6;
        context.strokeStyle = '#263722'; context.setLineDash([2, 6]);
        context.beginPath(); context.moveTo(20, height/2); context.lineTo(width-20, height/2); context.moveTo(width/2, 12); context.lineTo(width/2, height-12); context.stroke(); context.setLineDash([]);
        edges.forEach(([a, b]) => {
          const p = transformed[a], q = transformed[b];
          const opacity = .10 + ((p.depth+q.depth+2)/4)*.33;
          context.strokeStyle = `rgba(0,255,65,${opacity})`;
          context.beginPath(); context.moveTo(p.x,p.y); context.lineTo(q.x,q.y); context.stroke();
        });
        transformed.forEach((point, i) => {
          const front = (point.depth+1)/2;
          context.fillStyle = i % 29 === 0 ? `rgba(0,243,255,${.35+front*.55})` : `rgba(0,255,65,${.2+front*.7})`;
          context.beginPath(); context.arc(point.x, point.y, i%17===0 ? 2 : .9+front*.5, 0, Math.PI*2); context.fill();
          if (i%47===0 && point.depth>.15) {
            context.font = '12px JetBrains, monospace'; context.fillStyle = 'rgba(138,169,129,.7)'; context.fillText(`n_${String(i).padStart(3,'0')}`,point.x+7,point.y-7);
          }
        });
        context.fillStyle = '#58684e'; context.font = '12px JetBrains, monospace'; context.fillText('x',width-14,height/2+3); context.fillText('y',width/2-3,11);
        if (moving && visible && !document.hidden) frame = requestAnimationFrame(draw); else { frame = 0; lastTime = 0; }
      }
      function restart() { if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; draw(); }
      function resize() {
        const box = canvas.getBoundingClientRect(); width = box.width; height = box.height;
        const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = width*ratio; canvas.height = height*ratio;
        context.setTransform(ratio, 0, 0, ratio, 0, 0); restart();
      }
      new ResizeObserver(resize).observe(canvas);
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; restart(); }).observe(canvas);
      window.addEventListener('motionchange', restart); document.addEventListener('visibilitychange', restart);
      canvas.addEventListener('pointermove', event => { if (!moving) return; const box = canvas.getBoundingClientRect(); pointerX = (event.clientX-box.left)/box.width-.5; pointerY = (event.clientY-box.top)/box.height-.5; });
      canvas.addEventListener('pointerleave', () => { pointerX=0; pointerY=0; });
      resize();
    }
  }

  const selectedTab = document.getElementById('selected-tab');
  const latestTab = document.getElementById('latest-tab');
  const publicationList = document.getElementById('publication-list');
  const sourceLabel = document.getElementById('research-source');
  const panel = document.getElementById('publication-panel');
  if (selectedTab && latestTab && publicationList) {
    const selectedNodes = [...publicationList.children].map(node => node.cloneNode(true));
    let latestData = null, loading = null, active = 'selected';
    function externalUrl(value) { try { const url = new URL(value); return url.protocol==='https:' && ['scholar.google.com','arxiv.org','aclanthology.org'].includes(url.hostname) ? url.href : null; } catch { return null; } }
    function textNode(tag, className, text) { const node=document.createElement(tag); node.className=className; node.textContent=text; return node; }
    function renderLatest(data) {
      const records = data.publications.filter(paper => typeof paper.title==='string' && externalUrl(paper.url)).slice(0, 6);
      if (!records.length) throw new Error('No publication records available');
      const nodes = records.map(paper => {
        const link=document.createElement('a'); link.className='publication'; link.href=externalUrl(paper.url); link.target='_blank'; link.rel='noopener noreferrer';
        const body=document.createElement('div'); body.append(textNode('span','paper-label',paper.authors || 'GOOGLE SCHOLAR'),textNode('h3','',paper.title));
        if (paper.venue) body.append(textNode('p','',paper.venue));
        const venue=textNode('span','publication-venue','SCHOLAR'); venue.append(textNode('span','','VIEW RECORD'));
        link.append(textNode('span','publication-year',paper.year || '—'),body,venue); return link;
      });
      publicationList.replaceChildren(...nodes);
      const date = new Date(data.fetchedAt);
      const readable = Number.isNaN(date.valueOf()) ? '' : date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
      sourceLabel.textContent = `${data.source === 'scholar' ? 'SCHOLAR / CHECKED' : 'SCHOLAR SNAPSHOT /'} ${readable}`;
    }
    async function loadLatest() {
      const response = await fetch('/data/scholar.json', { cache: 'no-cache', signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Scholar feed unavailable');
      const data = await response.json();
      if (!Array.isArray(data.publications)) throw new Error('Invalid publication data');
      return data;
    }
    async function activate(view) {
      active=view;
      for (const [tab, name] of [[selectedTab,'selected'],[latestTab,'latest']]) { tab.setAttribute('aria-selected',String(view===name)); tab.tabIndex=view===name?0:-1; }
      panel.setAttribute('aria-labelledby',view==='selected'?'selected-tab':'latest-tab');
      if (view==='selected') { publicationList.replaceChildren(...selectedNodes.map(node=>node.cloneNode(true))); sourceLabel.textContent='SELECTED WORK / 2023–2026'; panel.removeAttribute('aria-busy'); return; }
      if (latestData) { renderLatest(latestData); return; }
      publicationList.replaceChildren(textNode('p','publication-loading','Reading the latest publication records…')); sourceLabel.textContent='READING SCHOLAR RECORDS'; panel.setAttribute('aria-busy','true');
      try { loading ||= loadLatest(); latestData=await loading; if (active==='latest') renderLatest(latestData); }
      catch { if (active==='latest') { publicationList.replaceChildren(textNode('p','publication-loading','The publication feed is unavailable. The selected papers and full Scholar record are still available above.')); sourceLabel.textContent='FEED UNAVAILABLE'; } loading=null; }
      finally { panel.removeAttribute('aria-busy'); }
    }
    selectedTab.addEventListener('click',()=>activate('selected')); latestTab.addEventListener('click',()=>activate('latest'));
    [selectedTab,latestTab].forEach(tab=>tab.addEventListener('keydown',event=>{ if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const next=event.key==='Home'?selectedTab:event.key==='End'?latestTab:tab===selectedTab?latestTab:selectedTab; next.focus(); activate(next===selectedTab?'selected':'latest'); } }));
  }

  const progress=document.querySelector('.reading-progress');
  if(progress){let ticking=false;const update=()=>{const article=document.querySelector('.prose');const start=article.offsetTop;const total=article.offsetHeight-innerHeight;progress.style.width=`${Math.max(0,Math.min(100,(scrollY-start)/Math.max(1,total)*100))}%`;ticking=false;};window.addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}},{passive:true});window.addEventListener('resize',update);update();}
})();
