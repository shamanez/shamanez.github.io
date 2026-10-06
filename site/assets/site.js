(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hasIO = 'IntersectionObserver' in window;
  const motionListeners = [];
  let saved = null;
  try { saved = localStorage.getItem('shamane-motion'); } catch {}
  let moving = saved === 'off' ? false : !reduce.matches;

  // Deterministic noise in [0, 1) for stable dot textures.
  const hash = (a, b) => {
    let h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const observe = (elements, callback, options) => {
    if (!hasIO) { elements.forEach(element => callback({ target: element, isIntersecting: true })); return null; }
    const observer = new IntersectionObserver(entries => entries.forEach(callback), options);
    elements.forEach(element => observer.observe(element));
    return observer;
  };

  function setMotion(on, save = false) {
    moving = on && !reduce.matches;
    root.dataset.motion = moving ? 'on' : 'off';
    document.querySelectorAll('.motion-toggle').forEach(button => {
      button.textContent = moving ? 'Motion on' : 'Motion off';
      button.setAttribute('aria-pressed', String(moving));
      button.title = reduce.matches ? 'Animations follow your reduced-motion setting' : moving ? 'Turn animations off' : 'Turn animations on';
    });
    if (save) { saved = moving ? 'on' : 'off'; try { localStorage.setItem('shamane-motion', saved); } catch {} }
    motionListeners.forEach(listener => listener(moving));
  }
  document.querySelectorAll('.motion-toggle').forEach(button => button.addEventListener('click', () => setMotion(!moving, true)));
  reduce.addEventListener?.('change', () => setMotion(saved !== 'off'));
  setMotion(moving);

  /* Navigation: mobile menu and the section currently in view. */
  const nav = document.querySelector('[data-nav]');
  const menuButton = nav?.querySelector('.menu-btn');
  if (menuButton) {
    const setOpen = open => {
      nav.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuButton.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); menuButton.focus(); }
    });
  }
  const tabs = [...document.querySelectorAll('.nav-tabs a[data-section]')];
  if (tabs.length && hasIO) {
    const inView = new Set();
    const sections = tabs.map(tab => document.getElementById(tab.dataset.section)).filter(Boolean);
    observe(sections, entry => {
      if (entry.isIntersecting) inView.add(entry.target.id); else inView.delete(entry.target.id);
      const current = sections.filter(section => inView.has(section.id)).pop()?.id;
      tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.section === current));
    }, { rootMargin: '-40% 0px -55% 0px' });
  }

  /* Scroll reveals. */
  observe([...document.querySelectorAll('[data-reveal], .rule')], entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  /* Typed terminal command that cycles through domains before settling on the last one. */
  const typed = document.querySelector('.typed[data-type]');
  if (typed) {
    const command = typed.dataset.type, domains = (typed.dataset.cycle || '').split(',').filter(Boolean);
    const last = domains[domains.length - 1] || '';
    const commandText = document.createTextNode(''), domain = document.createElement('span');
    domain.className = 'domain';
    typed.replaceChildren(commandText, domain);
    let timers = [];
    const show = (head, tail) => { commandText.data = head; domain.textContent = tail; };
    const finish = () => { timers.forEach(clearTimeout); timers = []; show(command, last); };
    if (!moving) finish();
    else {
      let at = 1100;
      const queue = (head, tail, wait) => { timers.push(setTimeout(() => show(head, tail), at)); at += wait; };
      for (let i = 1; i <= command.length; i++) queue(command.slice(0, i), '', 28 + Math.random() * 36);
      domains.forEach((value, index) => {
        for (let i = 1; i <= value.length; i++) queue(command, value.slice(0, i), 60 + Math.random() * 40);
        if (index === domains.length - 1) return;
        at += 1200;
        for (let i = value.length - 1; i >= 0; i--) queue(command, value.slice(0, i), 26);
        at += 220;
      });
    }
    motionListeners.push(on => { if (!on) finish(); });
  }

  /* Story figures only animate while visible. */
  const figures = [...document.querySelectorAll('.act-fig')];
  const syncFigure = figure => {
    const svg = figure.querySelector('svg');
    if (!svg?.pauseAnimations) return;
    if (moving && figure.classList.contains('is-playing')) svg.unpauseAnimations(); else svg.pauseAnimations();
  };
  observe(figures, entry => { entry.target.classList.toggle('is-playing', entry.isIntersecting); syncFigure(entry.target); }, { rootMargin: '60px' });
  motionListeners.push(() => figures.forEach(syncFigure));

  /* Story direction: play forward from the start, or rewind from now. The cards turn over, then land in the new order. */
  const acts = document.querySelector('.acts');
  const flip = document.querySelector('.story-flip');
  if (acts && flip) {
    const lead = document.querySelector('#story-title .lead-text');
    const sub = document.querySelector('#story-title .sub-text');
    const label = flip.querySelector('.flip-label');
    const glyphs = '01<>/#%&*+=';
    const scramble = (element, text) => {
      if (!moving) { element.textContent = text; return; }
      const begin = performance.now();
      const step = now => {
        const progress = Math.min(1, (now - begin) / 560);
        const settled = Math.floor(text.length * progress);
        element.textContent = text.slice(0, settled) + text.slice(settled).replace(/\S/g, () => glyphs[Math.floor(Math.random() * glyphs.length)]);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const number = () => [...acts.children].forEach((card, index) => card.style.setProperty('--k', index));
    let busy = false;
    flip.addEventListener('click', () => {
      if (busy) return;
      const rewind = flip.getAttribute('aria-pressed') !== 'true';
      const turn = () => {
        [...acts.children].reverse().forEach(card => acts.appendChild(card));
        number();
        flip.setAttribute('aria-pressed', String(rewind));
        label.textContent = rewind ? 'Play from the start' : 'Rewind from now';
        scramble(lead, rewind ? lead.dataset.rewind : lead.dataset.forward);
        sub.textContent = rewind ? sub.dataset.rewind : sub.dataset.forward;
      };
      if (!moving) { turn(); return; }
      busy = true;
      number();
      acts.classList.add('is-turning');
      setTimeout(() => {
        turn();
        acts.classList.remove('is-turning');
        acts.classList.add('is-landing');
        setTimeout(() => { acts.classList.remove('is-landing'); busy = false; }, acts.children.length * 45 + 640);
      }, acts.children.length * 45 + 360);
    });
  }

  /* Research timeline, built from the publication list itself. */
  const driftHost = document.getElementById('drift');
  if (driftHost) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const make = (tag, attributes = {}, parent) => {
      const node = document.createElementNS(svgNS, tag);
      for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
      parent?.appendChild(node);
      return node;
    };
    const clusters = [...document.querySelectorAll('.cluster[data-lane]')].sort((a, b) => a.dataset.lane - b.dataset.lane);
    const papers = [];
    clusters.forEach(cluster => cluster.querySelectorAll('.paper[data-date]').forEach(paper => {
      const [year, month] = paper.dataset.date.split('-').map(Number);
      const link = paper.querySelector('.paper-title');
      papers.push({
        element: paper, lane: Number(cluster.dataset.lane), color: getComputedStyle(cluster).getPropertyValue('--c').trim() || '#85ed75',
        time: year + ((month || 6) - 0.5) / 12,
        title: link.textContent.replace('↗', '').trim(), href: link.href, venue: paper.dataset.venue || '',
      });
    }));
    const tip = document.createElement('div');
    tip.className = 'drift-tip';
    let svg = null;
    const setHot = (paper, on) => {
      paper.element.classList.toggle('is-hot', on);
      paper.dot?.classList.toggle('is-hot', on);
      driftHost.classList.toggle('has-hot', on);
    };
    const showTip = (paper, x, y) => {
      tip.replaceChildren(document.createTextNode(paper.title));
      const small = document.createElement('small');
      small.textContent = paper.venue;
      tip.append(small);
      const width = driftHost.clientWidth;
      tip.style.left = `${Math.max(150, Math.min(width - 150, x))}px`;
      tip.style.top = `${y}px`;
      tip.classList.add('is-on');
    };
    const hideTip = () => tip.classList.remove('is-on');
    function drawDrift() {
      const width = driftHost.clientWidth, height = driftHost.clientHeight;
      if (!width || !height) return;
      svg?.remove();
      svg = make('svg', { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: 'none' });
      const compact = width < 720;
      const left = compact ? 16 : 196, right = compact ? 18 : 34, top = compact ? 34 : 26, bottom = 40;
      const laneHeight = (height - top - bottom) / clusters.length;
      const t0 = 2017.75, t1 = 2027.1;
      const x = time => left + (time - t0) / (t1 - t0) * (width - left - right);
      const laneY = lane => top + (lane - 0.5) * laneHeight;
      for (let year = 2018; year <= 2026; year++) {
        make('line', { class: 'grid', x1: x(year), x2: x(year), y1: top - 10, y2: height - bottom + 6 }, svg);
        if (!compact || year % 2 === 0) make('text', { x: x(year), y: height - 14, 'text-anchor': 'middle' }, svg).textContent = compact ? `’${String(year).slice(2)}` : String(year);
      }
      clusters.forEach((cluster, index) => {
        const y = laneY(index + 1);
        make('line', { class: 'lane-line', x1: left, x2: width - right, y1: y, y2: y }, svg);
        const color = getComputedStyle(cluster).getPropertyValue('--c').trim();
        const labelY = compact ? y - laneHeight * 0.36 : y;
        make('rect', { x: 14, y: labelY - 4, width: 7, height: 7, fill: color }, svg);
        const label = make('text', { x: 28, y: labelY + 3.5, class: 'lane-name' }, svg);
        label.textContent = cluster.dataset.short.replace('&amp;', '&');
      });
      const now = x(2026.8);
      make('line', { class: 'now', x1: now, x2: now, y1: top - 14, y2: height - bottom + 6 }, svg);
      make('text', { x: now, y: top - 16, 'text-anchor': 'middle', fill: '#85ed75' }, svg).textContent = 'Now';
      const radius = Math.min(7, laneHeight * 0.2);
      const placed = [];
      papers.forEach((paper, index) => {
        const cx = x(paper.time);
        let cy = laneY(paper.lane);
        const clash = placed.filter(other => other.lane === paper.lane && Math.abs(other.cx - cx) < other.radius + radius).length;
        if (clash) cy += (clash % 2 ? -1 : 1) * Math.min(8, laneHeight * 0.18);
        placed.push({ lane: paper.lane, cx, radius });
        const dot = make('a', { class: 'drift-dot', href: paper.href, target: '_blank', rel: 'noopener noreferrer', tabindex: '-1' }, svg);
        make('circle', { class: 'dot-in', cx, cy, r: radius, fill: paper.color, stroke: paper.color, style: `--i:${index}` }, dot);
        paper.dot = dot;
        dot.addEventListener('pointerenter', () => { setHot(paper, true); showTip(paper, cx, cy - radius); });
        dot.addEventListener('pointerleave', () => { setHot(paper, false); hideTip(); });
      });
      driftHost.prepend(svg);
    }
    papers.forEach(paper => {
      paper.element.addEventListener('pointerenter', () => paper.dot && setHot(paper, true));
      paper.element.addEventListener('pointerleave', () => paper.dot && setHot(paper, false));
    });
    driftHost.append(tip);
    drawDrift();
    let resizeTimer = 0;
    new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawDrift, 120); }).observe(driftHost);
  }

  /* Hero: a dot-matrix world, the journey so far, and peers joining the run. */
  const fx = document.getElementById('world');
  const base = document.querySelector('.hero-base');
  const focus = document.querySelector('.map-focus');
  if (fx && base && focus) heroMap();

  function heroMap() {
    const hero = fx.closest('.hero');
    const baseContext = base.getContext('2d'), context = fx.getContext('2d');
    if (!hero || !baseContext || !context) return;
    const LAT_TOP = 84, RES = 0.5;
    const AREA = { lon0: 64, lon1: 296, lat0: 50, lat1: -50 };
    const LIME = '133,237,117';
    const PLACES = {
      lk: { name: 'Sri Lanka', note: '2013', lat: 7.29, lon: 80.63, side: -1, dy: -14 },
      sg: { name: 'Singapore', note: '2017', lat: 1.35, lon: 103.82, side: 1, dy: 16 },
      akl: { name: 'Auckland', note: '2018', lat: -36.85, lon: 174.76, side: 1, dy: 16 },
      fl: { name: 'Florida', note: 'remote', lat: 27.8, lon: 278.4, side: -1, dy: 16 },
      sf: { name: 'San Francisco', note: 'remote', lat: 37.77, lon: 237.58, side: -1, dy: -12 },
      mel: { name: 'Melbourne', note: 'now', lat: -37.81, lon: 144.96, side: -1, dy: 18 },
    };
    const ROUTES = [['lk', 'sg'], ['sg', 'akl'], ['akl', 'fl', true], ['akl', 'sf', true], ['akl', 'mel']];
    let mask = null, maskWidth = 0, maskHeight = 0;
    let width = 0, height = 0, ratio = 1, k = 1, originX = 0, originY = 0, spacing = 7, dotSize = 2;
    let dots = [], columns = [], routes = [], peers = [], region = null, avoid = null;
    let pointer = null, frame = 0, visible = true, started = performance.now(), lastSpawn = 0;
    const project = (lon, lat) => [originX + (lon - AREA.lon0) * k, originY + (AREA.lat0 - lat) * k];

    function layout() {
      const heroBox = hero.getBoundingClientRect(), box = focus.getBoundingClientRect();
      width = heroBox.width; height = heroBox.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      for (const canvas of [base, fx]) { canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); }
      const spanLon = AREA.lon1 - AREA.lon0, spanLat = AREA.lat0 - AREA.lat1;
      const boxWidth = Math.max(120, box.width), boxHeight = Math.max(120, box.height);
      k = Math.min(boxWidth / spanLon, boxHeight / spanLat);
      originX = box.left - heroBox.left + (boxWidth - spanLon * k) / 2;
      originY = box.top - heroBox.top + (boxHeight - spanLat * k) / 2;
      region = { x0: box.left - heroBox.left - boxWidth * 0.12, x1: box.right - heroBox.left, y0: box.top - heroBox.top - boxHeight * 0.1, y1: box.bottom - heroBox.top };
      const copy = hero.querySelector('.hero-copy')?.getBoundingClientRect();
      avoid = copy ? { x0: copy.left - heroBox.left - 10, x1: copy.right - heroBox.left + 10, y0: copy.top - heroBox.top - 10, y1: copy.bottom - heroBox.top + 10 } : null;
      spacing = width < 700 ? 5 : width < 1200 ? 6 : 7;
      dotSize = spacing < 6 ? 1.6 : 2;
      buildDots();
      drawBase();
      routes = ROUTES.map(([from, to, remote]) => ({ from: PLACES[from], to: PLACES[to], remote: Boolean(remote), points: arc(PLACES[from], PLACES[to]) }));
      peers = [];
      draw(performance.now());
      start();
    }

    function buildDots() {
      dots = []; columns = [];
      const columnCount = Math.ceil(width / spacing), rowCount = Math.ceil(height / spacing);
      for (let i = 0; i < columnCount; i++) {
        const list = [], x = i * spacing + spacing / 2;
        const lon = ((AREA.lon0 + (x - originX) / k + 180) % 360 + 360) % 360 - 180;
        const column = Math.min(maskWidth - 1, Math.floor((lon + 180) / RES));
        for (let j = 0; j < rowCount; j++) {
          const y = j * spacing + spacing / 2;
          const row = Math.floor((LAT_TOP - (AREA.lat0 - (y - originY) / k)) / RES);
          if (row < 0 || row >= maskHeight || !mask[row * maskWidth + column]) continue;
          const noise = hash(i, j);
          list.push(dots.length);
          dots.push({ x, y, alpha: 0.15 + noise * 0.17 });
        }
        columns.push(list);
      }
    }

    function drawBase() {
      baseContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      baseContext.clearRect(0, 0, width, height);
      const buckets = new Map();
      for (const dot of dots) {
        const key = Math.round(dot.alpha * 40) / 40;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(dot);
      }
      for (const [alpha, list] of buckets) {
        baseContext.fillStyle = `rgba(255,255,255,${alpha})`;
        baseContext.beginPath();
        for (const dot of list) baseContext.rect(dot.x - dotSize / 2, dot.y - dotSize / 2, dotSize, dotSize);
        baseContext.fill();
      }
    }

    function arc(a, b) {
      const [x1, y1] = project(a.lon, a.lat), [x2, y2] = project(b.lon, b.lat);
      const dx = x2 - x1, dy = y2 - y1, distance = Math.hypot(dx, dy) || 1;
      let nx = -dy / distance, ny = dx / distance;
      if (ny > 0) { nx = -nx; ny = -ny; }
      const lift = Math.min(distance * 0.3, 150);
      const cx = (x1 + x2) / 2 + nx * lift, cy = (y1 + y2) / 2 + ny * lift;
      const count = Math.max(10, Math.round(distance / 6));
      return Array.from({ length: count + 1 }, (_, i) => {
        const t = i / count, u = 1 - t;
        return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
      });
    }

    function nearestDot(x, y, maxDistance) {
      let best = null, bestDistance = maxDistance;
      const first = Math.max(0, Math.floor((x - maxDistance) / spacing)), last = Math.min(columns.length - 1, Math.ceil((x + maxDistance) / spacing));
      for (let c = first; c <= last; c++) for (const index of columns[c]) {
        const dot = dots[index], distance = Math.hypot(dot.x - x, dot.y - y);
        if (distance < bestDistance) { best = dot; bestDistance = distance; }
      }
      return best;
    }

    function addPeer(x, y, now, you = false) {
      const live = peers.filter(peer => now - peer.born < peer.life * 0.8);
      const links = live.map(peer => ({ peer, distance: Math.hypot(peer.x - x, peer.y - y) }))
        .filter(link => link.distance < (you ? 420 : 230)).sort((a, b) => a.distance - b.distance).slice(0, you ? 3 : 2)
        .map(link => ({ peer: link.peer, phase: Math.random() }));
      if (you) { const [mx, my] = project(PLACES.mel.lon, PLACES.mel.lat); links.push({ peer: { x: mx, y: my, born: 0, life: Infinity }, phase: 0 }); }
      peers.push({ x, y, born: now, life: you ? 14000 : 5200 + Math.random() * 4200, links, you });
      if (peers.length > 40) peers.splice(0, peers.length - 40);
    }

    function spawn(now) {
      if (!dots.length || now - lastSpawn < 520) return;
      lastSpawn = now;
      for (let attempt = 0; attempt < 12; attempt++) {
        const dot = dots[Math.floor(Math.random() * dots.length)];
        if (dot.x >= region.x0 && dot.x <= region.x1 && dot.y >= region.y0 && dot.y <= region.y1) { addPeer(dot.x, dot.y, now); return; }
      }
    }

    const square = (x, y, size) => context.fillRect(x - size / 2, y - size / 2, size, size);
    function dotted(points, upto, alpha, step = 1) {
      context.fillStyle = `rgba(${LIME},${alpha})`;
      const last = Math.floor((points.length - 1) * upto);
      for (let i = 0; i <= last; i += step) square(points[i][0], points[i][1], 1.6);
    }
    function along(points, t) {
      const position = Math.max(0, Math.min(points.length - 1, t * (points.length - 1)));
      const i = Math.floor(position), f = position - i, a = points[i], b = points[Math.min(points.length - 1, i + 1)];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }

    function draw(now) {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      if (!dots.length) return;
      const elapsed = now - started, still = !moving;

      // A slow synchronisation sweep across the land.
      if (!still) {
        const band = ((elapsed % 9000) / 9000) * (width + 400) - 200;
        const first = Math.max(0, Math.floor((band - 70) / spacing)), last = Math.min(columns.length - 1, Math.ceil((band + 70) / spacing));
        for (let c = first; c <= last; c++) for (const index of columns[c]) {
          const dot = dots[index], strength = 1 - Math.abs(dot.x - band) / 70;
          if (strength <= 0) continue;
          context.fillStyle = `rgba(255,255,255,${(strength * 0.32).toFixed(3)})`;
          square(dot.x, dot.y, dotSize);
        }
      }

      // The pointer lights up nearby land.
      if (pointer) {
        const radius = 84, first = Math.max(0, Math.floor((pointer.x - radius) / spacing)), last = Math.min(columns.length - 1, Math.ceil((pointer.x + radius) / spacing));
        for (let c = first; c <= last; c++) for (const index of columns[c]) {
          const dot = dots[index], distance = Math.hypot(dot.x - pointer.x, dot.y - pointer.y);
          if (distance >= radius) continue;
          context.fillStyle = `rgba(${LIME},${(Math.pow(1 - distance / radius, 1.4) * 0.95).toFixed(3)})`;
          square(dot.x, dot.y, dotSize + 0.8);
        }
      }

      // Peers join, link to their neighbours and exchange packets.
      if (!still) {
        spawn(now);
        peers = peers.filter(peer => now - peer.born < peer.life);
      }
      for (const peer of peers) {
        const age = still ? 1000 : now - peer.born, envelope = still ? 1 : Math.min(1, age / 500, (peer.life - age) / 900);
        for (const link of peer.links) {
          const reveal = Math.min(1, age / 700);
          const ex = peer.x + (link.peer.x - peer.x) * reveal, ey = peer.y + (link.peer.y - peer.y) * reveal;
          const steps = Math.max(2, Math.round(Math.hypot(ex - peer.x, ey - peer.y) / 6));
          context.fillStyle = `rgba(${LIME},${(0.26 * envelope).toFixed(3)})`;
          for (let s = 0; s <= steps; s++) square(peer.x + (ex - peer.x) * s / steps, peer.y + (ey - peer.y) * s / steps, 1.2);
          if (reveal === 1) {
            const t = ((elapsed / 1600) + link.phase) % 1;
            context.fillStyle = `rgba(${LIME},${(0.95 * envelope).toFixed(3)})`;
            square(peer.x + (link.peer.x - peer.x) * t, peer.y + (link.peer.y - peer.y) * t, 3);
          }
        }
        context.fillStyle = peer.you ? `rgba(${LIME},${envelope})` : `rgba(255,255,255,${(0.85 * envelope).toFixed(3)})`;
        square(peer.x, peer.y, peer.you ? 6 : 3.4);
        if (age < 700) {
          const grow = age / 700;
          context.strokeStyle = `rgba(${LIME},${(0.6 * (1 - grow)).toFixed(3)})`;
          context.strokeRect(peer.x - 3 - grow * 10, peer.y - 3 - grow * 10, 6 + grow * 20, 6 + grow * 20);
        }
        if (peer.you) {
          context.font = '500 11px "Geist Mono", ui-monospace, monospace';
          context.fillStyle = `rgba(${LIME},${envelope})`;
          context.fillText('YOU', peer.x + 9, peer.y - 7);
        }
      }

      // The journey: routes draw in order, then carry packets.
      routes.forEach((route, index) => {
        const progress = still ? 1 : Math.max(0, Math.min(1, (elapsed - 500 - index * 950) / 1100));
        if (progress <= 0) return;
        dotted(route.points, progress, route.remote ? 0.42 : 0.78, route.remote ? 2 : 1);
        if (!still && progress === 1) {
          const cycle = ((elapsed + index * 700) % 3200) / 3200;
          const t = route.remote && Math.floor((elapsed + index * 700) / 3200) % 2 ? 1 - cycle : cycle;
          const [px, py] = along(route.points, t);
          context.fillStyle = `rgb(${LIME})`;
          square(px, py, 3.6);
        }
      });

      context.font = '500 10.5px "Geist Mono", ui-monospace, monospace';
      context.textBaseline = 'middle';
      Object.entries(PLACES).forEach(([id, place], index) => {
        const appear = still ? 1 : Math.max(0, Math.min(1, (elapsed - 300 - index * 950) / 500));
        if (appear <= 0) return;
        const [x, y] = project(place.lon, place.lat);
        if (id === 'mel' || id === 'akl') {
          const pulse = still ? 0.4 : ((elapsed + (id === 'mel' ? 0 : 1200)) % 2400) / 2400;
          context.strokeStyle = `rgba(${LIME},${((1 - pulse) * 0.7 * appear).toFixed(3)})`;
          const size = 8 + pulse * 22;
          context.strokeRect(x - size / 2, y - size / 2, size, size);
        }
        context.fillStyle = `rgba(${LIME},${appear})`;
        square(x, y, 6);
        context.fillStyle = '#000';
        square(x, y, 2);
        const label = place.name.toUpperCase(), note = ` · ${place.note.toUpperCase()}`;
        const labelWidth = context.measureText(label).width, noteWidth = context.measureText(note).width;
        // Keep each label inside the canvas and clear of the headline copy.
        const boxWidth = labelWidth + noteWidth;
        const spots = [[place.side, place.dy], [-place.side, place.dy], [place.side, -place.dy], [-place.side, -place.dy]]
          .map(([side, dy]) => [side > 0 ? x + 10 : x - 10 - boxWidth, y + dy]);
        const [lx, ly] = spots.find(([sx, sy]) => sx > 4 && sx + boxWidth < width - 4
          && !(avoid && sx - 4 < avoid.x1 && sx + boxWidth + 4 > avoid.x0 && sy - 8 < avoid.y1 && sy + 8 > avoid.y0)) ?? spots[0];
        context.fillStyle = `rgba(0,0,0,${0.66 * appear})`;
        context.fillRect(lx - 4, ly - 8, labelWidth + noteWidth + 8, 16);
        context.fillStyle = `rgba(255,255,255,${0.92 * appear})`;
        context.fillText(label, lx, ly);
        context.fillStyle = `rgba(${LIME},${appear})`;
        context.fillText(note, lx + labelWidth, ly);
      });
    }

    function loop(now) {
      frame = 0;
      draw(now);
      if (moving && visible && !document.hidden) frame = requestAnimationFrame(loop);
    }
    function start() { if (!frame && moving && visible && !document.hidden) frame = requestAnimationFrame(loop); }
    function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; }

    const local = event => { const box = fx.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };
    fx.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') { pointer = local(event); if (!moving) draw(performance.now()); } });
    fx.addEventListener('pointerleave', () => { pointer = null; if (!moving) draw(performance.now()); });
    fx.addEventListener('click', event => {
      const point = local(event), now = performance.now();
      const dot = nearestDot(point.x, point.y, 18);
      addPeer(dot ? dot.x : point.x, dot ? dot.y : point.y, now, true);
      if (!moving) draw(now); else start();
    });
    motionListeners.push(on => { if (on) { started = performance.now() - 6000; start(); } else { stop(); peers = peers.filter(peer => peer.you); draw(performance.now()); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    observe([hero], entry => { visible = entry.isIntersecting; if (visible) start(); else stop(); });
    let resizeTimer = 0;
    new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (mask) layout(); }, 140); }).observe(hero);
    document.fonts?.ready.then(() => { if (mask && !moving) draw(performance.now()); });

    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const scratch = document.createElement('canvas');
      scratch.width = maskWidth = image.naturalWidth;
      scratch.height = maskHeight = image.naturalHeight;
      const scratchContext = scratch.getContext('2d', { willReadFrequently: true });
      scratchContext.drawImage(image, 0, 0);
      const pixels = scratchContext.getImageData(0, 0, maskWidth, maskHeight).data;
      mask = new Uint8Array(maskWidth * maskHeight);
      for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4] > 127 ? 1 : 0;
      started = performance.now();
      layout();
    };
    image.src = '/assets/world.png';
  }

  /* Footer: dot-matrix lettering that answers the pointer. */
  const lettering = document.getElementById('dot-text');
  if (lettering) dotText(lettering);

  function dotText(canvas) {
    const context = canvas.getContext('2d');
    if (!context) return;
    const lines = (canvas.dataset.lines || '').split('|');
    let width = 0, height = 0, ratio = 1, cell = 6, points = [], pointer = null, frame = 0, visible = false;
    function layout() {
      const box = canvas.getBoundingClientRect();
      width = box.width; height = box.height;
      if (!width || !height) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      cell = Math.max(4, Math.round(height / 30));
      const columns = Math.floor(width / cell), rows = Math.floor(height / cell);
      const scratch = document.createElement('canvas');
      scratch.width = columns; scratch.height = rows;
      const scratchContext = scratch.getContext('2d', { willReadFrequently: true });
      const lineHeight = Math.floor(rows / lines.length);
      let fontSize = Math.floor(lineHeight * 0.86);
      scratchContext.font = `500 ${fontSize}px "Geist Mono", ui-monospace, monospace`;
      const widest = Math.max(...lines.map(line => scratchContext.measureText(line).width));
      if (widest > columns - 1) fontSize = Math.floor(fontSize * (columns - 1) / widest);
      scratchContext.font = `500 ${fontSize}px "Geist Mono", ui-monospace, monospace`;
      scratchContext.fillStyle = '#fff';
      scratchContext.textBaseline = 'alphabetic';
      lines.forEach((line, index) => scratchContext.fillText(line, 0, (index + 1) * lineHeight - Math.round(lineHeight * 0.18)));
      const pixels = scratchContext.getImageData(0, 0, columns, rows).data;
      points = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
        if (pixels[(y * columns + x) * 4 + 3] > 100) points.push({ x: x * cell + cell / 2, y: y * cell + cell / 2, noise: hash(x, y) });
      }
      draw(performance.now());
    }
    function draw(now) {
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      const size = Math.max(2, cell * 0.56);
      const wave = moving ? ((now % 7000) / 7000) * (width + height) * 1.3 - height : -1e6;
      for (const point of points) {
        let glow = 0;
        if (pointer) { const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y); if (distance < 96) glow = Math.pow(1 - distance / 96, 1.3); }
        if (glow > 0.03) { context.fillStyle = `rgba(133,237,117,${(0.3 + glow * 0.7).toFixed(3)})`; }
        else {
          const offset = Math.abs(point.x + point.y * 0.55 - wave);
          const alpha = 0.18 + point.noise * 0.08 + (offset < 70 ? (1 - offset / 70) * 0.3 : 0);
          context.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        }
        context.fillRect(point.x - size / 2, point.y - size / 2, size, size);
      }
    }
    function loop(now) { frame = 0; draw(now); if (moving && visible && !document.hidden) frame = requestAnimationFrame(loop); }
    const start = () => { if (!frame && moving && visible && !document.hidden) frame = requestAnimationFrame(loop); };
    const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
    canvas.addEventListener('pointermove', event => { const box = canvas.getBoundingClientRect(); pointer = { x: event.clientX - box.left, y: event.clientY - box.top }; if (!moving) draw(performance.now()); });
    canvas.addEventListener('pointerleave', () => { pointer = null; if (!moving) draw(performance.now()); });
    observe([canvas], entry => { visible = entry.isIntersecting; if (visible) start(); else stop(); }, { rootMargin: '40px' });
    motionListeners.push(on => { if (on) start(); else { stop(); draw(performance.now()); } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    let resizeTimer = 0;
    new ResizeObserver(() => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 120); }).observe(canvas);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(layout);
  }

  /* Blog posts: reading progress and the current section in the table of contents. */
  const progress = document.querySelector('.reading-progress');
  const article = document.querySelector('.prose');
  if (progress && article) {
    let ticking = false;
    const update = () => {
      const start = article.getBoundingClientRect().top + window.scrollY;
      const total = article.offsetHeight - window.innerHeight;
      progress.style.width = `${Math.max(0, Math.min(100, (window.scrollY - start) / Math.max(1, total) * 100))}%`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  const tocLinks = [...document.querySelectorAll('.article-toc a[href^="#"]')];
  if (tocLinks.length && hasIO) {
    const headings = tocLinks.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter(Boolean);
    const inView = new Set();
    observe(headings, entry => {
      if (entry.isIntersecting) inView.add(entry.target.id); else inView.delete(entry.target.id);
      const current = headings.find(heading => inView.has(heading.id))?.id;
      if (current) tocLinks.forEach(link => link.classList.toggle('is-active', link.hash === `#${current}`));
    }, { rootMargin: '0px 0px -70% 0px' });
  }
})();
