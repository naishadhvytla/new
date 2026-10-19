/* Naishadh Vytla portfolio: art generators, motion choreography and UI behaviour. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const isFull = () => root.dataset.motion === 'full';
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const f1 = (n) => Math.round(n * 10) / 10;

  // Seeded PRNG (mulberry32) so the art is the same on every visit.
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // One failing block must not take the rest of the page down with it.
  function safe(name, fn) {
    try { fn(); } catch (e) { console.error(`[${name}]`, e); }
  }
  // Older Safari only has addListener on media queries.
  const onMQChange = (mq, fn) => (mq.addEventListener ? mq.addEventListener('change', fn) : mq.addListener && mq.addListener(fn));

  /* ---------------------------------------------------------------------
     Loading state, then a reading-progress strip in the same ink bar
     --------------------------------------------------------------------- */
  const loadbar = $('.loadbar');
  const brandStatus = $('.brand-status');
  let maxScroll = 1;
  function measureScroll() { maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight); updateProgress(); }
  function updateProgress() {
    if (loadbar.classList.contains('is-reading')) loadbar.style.setProperty('--read', clamp(window.scrollY / maxScroll, 0, 1).toFixed(4));
  }
  loadbar.classList.add('is-busy');
  const finishLoad = () => {
    loadbar.classList.add('is-done');
    if (brandStatus) brandStatus.textContent = 'Now: AI Trainee · Calibo';
    setTimeout(() => {
      loadbar.classList.remove('is-busy', 'is-done');
      loadbar.classList.add('is-reading');
      measureScroll();
    }, 800);
  };
  if (document.readyState === 'complete') requestAnimationFrame(finishLoad);
  else window.addEventListener('load', finishLoad, { once: true });

  /* ---------------------------------------------------------------------
     Cover art: skylines, portal, web
     --------------------------------------------------------------------- */
  const SKYLINES = {
    far:  { seed: 11, vb: [1600, 420], minW: 34, maxW: 96,  minH: 120, maxH: 390, fill: 'f-vdeep', rimL: 'f-cyan', rimO: .28, win: .05, winC: ['f-cyan'], crown: .45 },
    mid:  { seed: 27, vb: [1600, 300], minW: 56, maxW: 140, minH: 70,  maxH: 270, fill: 'f-navy',  rimL: 'f-cyan', rimR: 'f-crimson', rimO: .55, win: .09, winC: ['f-yellow', 'f-cyan'], crown: .35 },
    near: { seed: 5,  vb: [1600, 160], minW: 90, maxW: 220, minH: 46,  maxH: 150, fill: 'f-ink',   rimL: 'f-crimson', rimO: .85, win: .04, winC: ['f-yellow'], crown: .25 },
  };

  function skyline(svg, o) {
    const r = rng(o.seed);
    const [W, H] = o.vb;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let x = -24, s = '';
    while (x < W + 24) {
      const w = o.minW + r() * (o.maxW - o.minW);
      const h = o.minH + r() * (o.maxH - o.minH);
      const y = H - h;
      s += `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w + .6)}" height="${f1(h + 2)}" class="${o.fill}"/>`;
      if (r() < o.crown) {
        const cw = w * (.35 + r() * .3), ch = 10 + r() * 28, cx = x + (w - cw) / 2;
        s += `<rect x="${f1(cx)}" y="${f1(y - ch)}" width="${f1(cw)}" height="${f1(ch + 1)}" class="${o.fill}"/>`;
        if (r() < .55) {
          const ah = 18 + r() * 40;
          s += `<rect x="${f1(cx + cw / 2 - 1)}" y="${f1(y - ch - ah)}" width="2" height="${f1(ah)}" class="${o.fill}"/>`;
          if (r() < .5) s += `<circle cx="${f1(cx + cw / 2)}" cy="${f1(y - ch - ah)}" r="2.4" class="f-crimson"/>`;
        }
      }
      if (o.rimL) s += `<rect x="${f1(x)}" y="${f1(y)}" width="2.5" height="${f1(h)}" class="${o.rimL}" opacity="${o.rimO}"/>`;
      if (o.rimR && r() < .5) s += `<rect x="${f1(x + w - 2)}" y="${f1(y)}" width="2" height="${f1(h)}" class="${o.rimR}" opacity="${o.rimO}"/>`;
      const cols = Math.floor((w - 14) / 12), rows = Math.floor((h - 18) / 17);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (r() < o.win) {
            const c = o.winC[Math.floor(r() * o.winC.length)];
            s += `<rect x="${f1(x + 8 + i * 12)}" y="${f1(y + 12 + j * 17)}" width="4" height="7" class="${c}" opacity="${f1(.35 + r() * .55)}"/>`;
          }
        }
      }
      x += w + (r() < .25 ? r() * 14 : 0);
    }
    svg.innerHTML = s;
  }
  safe('skylines', () => $$('[data-skyline]').forEach((svg) => skyline(svg, SKYLINES[svg.dataset.skyline])));

  function webPath(cx, cy, a0, a1, spokes, radii, r, len = 1500) {
    const ang = Array.from({ length: spokes }, (_, i) => a0 + (a1 - a0) * (i / (spokes - 1)) + (r() - .5) * .05);
    let d = '';
    ang.forEach((a) => { d += `M${cx} ${cy}L${f1(cx + Math.cos(a) * len)} ${f1(cy + Math.sin(a) * len)}`; });
    radii.forEach((rad) => {
      const pts = ang.map((a) => { const k = rad * (1 + (r() - .5) * .08); return [cx + Math.cos(a) * k, cy + Math.sin(a) * k]; });
      d += `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1][0] + pts[i][0]) / 2, my = (pts[i - 1][1] + pts[i][1]) / 2;
        const qx = cx + (mx - cx) * .9, qy = cy + (my - cy) * .9;
        d += `Q${f1(qx)} ${f1(qy)} ${f1(pts[i][0])} ${f1(pts[i][1])}`;
      }
    });
    return d;
  }

  function web(svg) {
    const r = rng(42);
    const d = webPath(1000, 0, Math.PI / 2, Math.PI, 10, [70, 125, 195, 280, 385, 510, 660, 840], r);
    svg.innerHTML =
      `<path d="${d}" class="f-none s-crimson web-plate" stroke-width="1.4" opacity=".45"/>` +
      `<path d="${d}" class="f-none s-paper" stroke-width="1.4" opacity=".7"/>`;
  }
  safe('web', () => { const heroWeb = $('#hero-web'); if (heroWeb) web(heroWeb); });

  function portal(svg, id, seed) {
    const r = rng(seed);
    const C = 300;
    // a small city inside the portal, plus its inverted twin: another dimension
    let city = '', twin = '';
    for (let x = 170; x < 430;) {
      const w = 10 + r() * 22, h = 14 + r() * 46;
      city += `<rect x="${f1(x)}" y="${f1(380 - h)}" width="${f1(w)}" height="${f1(h + 40)}"/>`;
      twin += `<rect x="${f1(x)}" y="200" width="${f1(w)}" height="${f1(r() * 34 + 10)}"/>`;
      x += w + 2;
    }
    let stars = '';
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = r() * 105;
      stars += `<circle cx="${f1(C + Math.cos(a) * d)}" cy="${f1(C + Math.sin(a) * d * .7)}" r="${f1(.8 + r() * 1.6)}" class="${r() < .5 ? 'f-cyan' : 'f-paper'}" opacity="${f1(.4 + r() * .6)}"/>`;
    }
    const webD = webPath(C, C, 0, Math.PI * 2, 13, [70, 98, 132, 170], r, 176);
    let ticks = '';
    for (let i = 0; i < 4; i++) ticks += `<rect x="296" y="26" width="8" height="22" class="f-yellow" transform="rotate(${i * 90 + 20} 300 300)"/>`;
    svg.innerHTML = `
      <defs>
        <radialGradient id="${id}-glow"><stop offset="0" style="stop-color:var(--violet);stop-opacity:.6"/><stop offset=".55" style="stop-color:var(--magenta);stop-opacity:.16"/><stop offset="1" style="stop-color:var(--violet);stop-opacity:0"/></radialGradient>
        <radialGradient id="${id}-hole"><stop offset="0" style="stop-color:var(--ink)"/><stop offset=".72" style="stop-color:var(--ink)"/><stop offset="1" style="stop-color:var(--violet-deep)"/></radialGradient>
        <pattern id="${id}-dots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="2" class="f-magenta"/></pattern>
        <radialGradient id="${id}-fade"><stop offset=".42" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <mask id="${id}-m"><circle cx="300" cy="300" r="290" fill="url(#${id}-fade)"/></mask>
        <clipPath id="${id}-clip"><circle cx="300" cy="300" r="120"/></clipPath>
      </defs>
      <circle cx="300" cy="300" r="300" fill="url(#${id}-glow)"/>
      <circle cx="300" cy="300" r="282" fill="url(#${id}-dots)" mask="url(#${id}-m)" opacity=".5"/>
      <g class="portal-spin-a">
        <circle cx="300" cy="300" r="262" class="f-none s-cyan" stroke-width="3" stroke-dasharray="2 14"/>
        <circle cx="300" cy="300" r="247" class="f-none s-magenta" stroke-width="1.5"/>
        ${ticks}
      </g>
      <g class="portal-spin-b">
        <circle cx="300" cy="300" r="216" class="f-none s-violet" stroke-width="12" stroke-dasharray="64 22 10 22"/>
        <circle cx="300" cy="300" r="197" class="f-none s-paper" stroke-width="1.2" stroke-dasharray="1 7" opacity=".55"/>
      </g>
      <g class="portal-spin-c"><path d="${webD}" class="f-none s-paper" stroke-width="1.1" opacity=".3"/></g>
      <g class="portal-core">
        <circle cx="307" cy="300" r="128" class="f-none s-crimson" stroke-width="5"/>
        <circle cx="293" cy="300" r="128" class="f-none s-cyan" stroke-width="5"/>
        <circle cx="300" cy="300" r="123" fill="url(#${id}-hole)"/>
        <g clip-path="url(#${id}-clip)">
          ${stars}
          <g class="f-none s-cyan" stroke-width="1.5" opacity=".75">${city}</g>
          <g class="f-none s-magenta" stroke-width="1.5" opacity=".5">${twin}</g>
          <rect x="170" y="379" width="260" height="2" class="f-cyan" opacity=".6"/>
        </g>
        <circle cx="300" cy="300" r="123" class="f-none s-paper" stroke-width="3"/>
      </g>`;
  }
  safe('portals', () => {
    const heroPortal = $('#hero-portal');
    if (heroPortal) portal(heroPortal, 'hp', 7);
    const contactPortal = $('#contact-portal');
    if (contactPortal) portal(contactPortal, 'cp', 19);
  });

  /* ---------------------------------------------------------------------
     Research figures (schematics, drawn to their own scales)
     --------------------------------------------------------------------- */
  const FIGS = {
    reliability() {
      const x0 = 42, x1 = 326, y0 = 18, y1 = 214, w = x1 - x0, h = y1 - y0, bw = w / 10;
      const acc = [.03, .1, .17, .25, .33, .42, .51, .6, .69, .79];
      const ts  = [.05, .15, .24, .35, .45, .54, .65, .74, .85, .93];
      const X = (v) => x0 + v * w, Y = (v) => y1 - v * h;
      let bars = '', gaps = '', after = '';
      acc.forEach((a, i) => {
        const conf = (i + .5) / 10, bx = x0 + i * bw + 2.5, bwi = bw - 5;
        bars += `<rect x="${f1(bx)}" y="${f1(Y(a))}" width="${f1(bwi)}" height="${f1(a * h)}" class="f-paper" opacity=".82"/>`;
        gaps += `<rect x="${f1(bx)}" y="${f1(Y(conf))}" width="${f1(bwi)}" height="${f1((conf - a) * h)}" fill="url(#hatch-r)" class="s-crimson" stroke-width="1"/>`;
        after += `<rect x="${f1(bx)}" y="${f1(Y(ts[i]))}" width="${f1(bwi)}" height="${f1(ts[i] * h)}" class="f-none s-cyan" stroke-width="1.6" stroke-dasharray="4 3"/>`;
      });
      return `<svg viewBox="0 0 340 250" font-size="11" role="img" aria-label="Schematic reliability diagram">
        <defs><pattern id="hatch-r" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.2" height="6" class="f-crimson"/></pattern></defs>
        <g class="f-paper t-mono" opacity=".7">
          <text x="${x0 - 8}" y="${y1 + 4}" text-anchor="end">0</text>
          <text x="${x0 - 8}" y="${Y(.5) + 4}" text-anchor="end">.5</text>
          <text x="${x0 - 8}" y="${y0 + 4}" text-anchor="end">1</text>
          <text x="${X(.5)}" y="${y1 + 16}" text-anchor="middle">.5</text>
          <text x="${x1}" y="${y1 + 16}" text-anchor="middle">1</text>
          <text x="${X(.5)}" y="${y1 + 32}" text-anchor="middle">confidence</text>
          <text transform="translate(12 ${Y(.5)}) rotate(-90)" text-anchor="middle">accuracy</text>
        </g>
        <path d="M${x0} ${y0}V${y1}H${x1}" class="f-none s-paper" stroke-width="1.5" opacity=".6"/>
        <path d="M${x0} ${Y(.5)}H${x1}" class="f-none s-paper" stroke-width="1" opacity=".12"/>
        ${bars}${gaps}${after}
        <path d="M${x0} ${y1}L${x1} ${y0}" class="f-none s-yellow" stroke-width="1.6" stroke-dasharray="5 4"/>
        <g class="t-mono" font-size="10">
          <rect x="${x0 + 10}" y="${y0 + 6}" width="10" height="10" class="f-paper" opacity=".82"/><text x="${x0 + 26}" y="${y0 + 15}" class="f-paper">accuracy</text>
          <rect x="${x0 + 10}" y="${y0 + 22}" width="10" height="10" fill="url(#hatch-r)" class="s-crimson"/><text x="${x0 + 26}" y="${y0 + 31}" class="f-paper">gap</text>
          <rect x="${x0 + 10}" y="${y0 + 38}" width="10" height="10" class="f-none s-cyan" stroke-dasharray="3 2"/><text x="${x0 + 26}" y="${y0 + 47}" class="f-paper">after temp. scaling</text>
        </g>
      </svg>`;
    },

    floor() {
      const x0 = 42, x1 = 326, y0 = 14, y1 = 156, lo = 2.4, hi = 5.15, yMax = .06;
      const X = (n) => x0 + ((Math.log10(n) - lo) / (hi - lo)) * (x1 - x0);
      const Y = (v) => y1 - (v / yMax) * (y1 - y0);
      const floorAt = (n) => .75 / Math.sqrt(n);
      let curve = '';
      for (let i = 0; i <= 48; i++) {
        const n = 10 ** (lo + (hi - lo) * (i / 48));
        curve += `${i ? 'L' : 'M'}${f1(X(n))} ${f1(Y(Math.min(floorAt(n), yMax)))}`;
      }
      const area = `${curve}L${x1} ${y1}L${x0} ${y1}Z`;
      const sets = [[320, 'DA3D', 6, -9, 'start'], [567, 'MSR-A3D', 10, -6, 'start'], [56880, 'NTU60', -8, -12, 'end'], [114480, 'NTU120', 2, -27, 'end']];
      const dots = sets.map(([n, label, dx, dy, anchor]) => {
        const cx = X(n), cy = Y(floorAt(n));
        return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="4" class="f-cyan"/><text x="${f1(cx + dx)}" y="${f1(cy + dy)}" text-anchor="${anchor}" class="f-paper t-mono" font-size="9.5">${label}</text>`;
      }).join('');
      const ticks = [[320, '320'], [1000, '1K'], [10000, '10K'], [114480, '114K']]
        .map(([n, t]) => `<path d="M${f1(X(n))} ${y1}v5" class="s-paper" opacity=".6"/><text x="${f1(X(n))}" y="${y1 + 17}" text-anchor="middle">${t}</text>`).join('');
      return `<svg viewBox="0 0 340 196" font-size="11" role="img" aria-label="Schematic of the null-model ECE floor versus dataset size">
        <defs><pattern id="hatch-f" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><rect width="1.6" height="6" class="f-crimson"/></pattern></defs>
        <path d="${area}" fill="url(#hatch-f)" opacity=".7"/>
        <path d="${curve}" class="f-none s-crimson" stroke-width="2.4"/>
        <path d="M${x0} ${y0}V${y1}H${x1}" class="f-none s-paper" stroke-width="1.5" opacity=".6"/>
        <g class="f-paper t-mono" opacity=".7">${ticks}
          <text x="${x0 - 8}" y="${y1 + 4}" text-anchor="end">0</text>
          <text x="${(x0 + x1) / 2}" y="${y1 + 33}" text-anchor="middle">dataset size, sequences (log)</text>
          <text transform="translate(12 ${(y0 + y1) / 2}) rotate(-90)" text-anchor="middle">null ECE</text>
        </g>
        <text x="${x1 - 4}" y="${y0 + 22}" text-anchor="end" class="f-cyan t-mono" font-size="10.5">measurable</text>
        <rect x="${x0 + 8}" y="${y1 - 18}" width="90" height="16" class="f-ink"/>
        <text x="${x0 + 13}" y="${y1 - 6}" class="f-crimson t-mono" font-size="10.5">estimator bias</text>
        ${dots}
      </svg>`;
    },

    vit() {
      let grid = '';
      for (let i = 1; i < 6; i++) {
        grid += `<path d="M${30 + i * 27} 60V222M30 ${60 + i * 27}H192" class="s-paper" stroke-width="1" opacity=".28"/>`;
      }
      let tokens = '';
      for (let i = 0; i < 8; i++) {
        const cls = i === 0 ? 'f-yellow' : i === 4 ? 'f-magenta' : 'f-none s-paper';
        tokens += `<rect x="214" y="${62 + i * 20}" width="15" height="15" class="${cls}" stroke-width="1.5" opacity="${i === 0 || i === 4 ? 1 : .6}"/>`;
      }
      const classes = [['glioma', .86], ['mening.', .08], ['pituitary', .04], ['no tumor', .02]];
      const bars = classes.map(([n, v], i) => `<text x="318" y="${110 + i * 26}" class="f-paper t-mono" font-size="10" opacity=".75">${n}</text><rect x="318" y="${114 + i * 26}" width="${f1(4 + v * 66)}" height="6" class="${i ? 'f-paper' : 'f-magenta'}" opacity="${i ? .45 : 1}"/>`).join('');
      return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" font-size="11">
        <text x="20" y="34" class="f-paper t-mono" opacity=".7">MRI · 384 × 384</text>
        <ellipse cx="111" cy="141" rx="76" ry="88" class="f-navy s-paper" stroke-width="2"/>
        <path d="M70 90q20-16 40 0t40 0M58 128q26-14 52 2t50-4M60 168q24 14 50-2t50 4M76 202q18-12 34 0t34 0M111 56v170" class="f-none s-paper" stroke-width="1.4" opacity=".35"/>
        <circle cx="136" cy="118" r="15" class="f-magenta" opacity=".85"/>
        <circle cx="136" cy="118" r="15" class="f-none s-magenta fx-pulse" stroke-width="2"/>
        ${grid}
        <rect x="30" y="60" width="162" height="162" class="f-none s-paper" stroke-width="1.5" opacity=".5"/>
        <rect x="111" y="87" width="27" height="27" class="f-none s-magenta fx-blink" stroke-width="2.5"/>
        <path d="M196 141H208" class="s-paper fx-flow" stroke-width="2" stroke-dasharray="3 4"/>
        ${tokens}
        <text x="210" y="240" class="f-paper t-mono" font-size="9" opacity=".7">tokens</text>
        <path d="M234 141H246" class="s-paper fx-flow" stroke-width="2" stroke-dasharray="3 4"/>
        <g class="f-none s-paper" stroke-width="1.5"><rect x="250" y="62" width="52" height="158"/><path d="M250 101H302M250 141H302M250 181H302" opacity=".5"/></g>
        <text transform="translate(281 141) rotate(-90)" text-anchor="middle" class="f-yellow t-mono" font-size="11">ViT-B/16</text>
        <path d="M304 141H314" class="s-paper fx-flow" stroke-width="2" stroke-dasharray="3 4"/>
        ${bars}
        <text x="318" y="92" class="f-magenta t-mono" font-size="10">4 classes</text>
      </svg>`;
    },

    uav() {
      const heads = [[96, 140], [200, 150], [304, 140]];
      const uavs = [[44, 232, 0], [112, 248, 0], [168, 236, 1], [232, 250, 1], [292, 236, 2], [356, 228, 2]];
      let edges = heads.map(([x, y]) => `<path d="M200 56L${x} ${y}" class="s-paper" stroke-width="1.5" opacity=".5"/>`).join('');
      let nodes = '';
      uavs.forEach(([x, y, hI], i) => {
        const [hx, hy] = heads[hI];
        const spoof = i === 5;
        edges += `<path d="M${hx} ${hy}L${x} ${y}" class="${spoof ? 's-crimson' : 's-paper'}" stroke-width="${spoof ? 2 : 1.3}" ${spoof ? 'stroke-dasharray="4 4"' : 'opacity=".5"'}/>`;
        // schematic trust meter at each link: three segments when trusted, one when spoofed
        const mx = (hx + x) / 2 + (x < hx ? -28 : 6), my = (hy + y) / 2 - 1.5;
        for (let k = 0; k < (spoof ? 1 : 3); k++) edges += `<rect x="${f1(mx + k * 8)}" y="${f1(my)}" width="6" height="3" class="${spoof ? 'f-crimson' : 'f-paper'}" opacity="${spoof ? 1 : .7}"/>`;
        if (spoof) {
          nodes += `<circle cx="${x}" cy="${y}" r="17" class="f-none s-crimson fx-pulse" stroke-width="2"/>
            <path d="M${x} ${y - 15}l4 8 9-2-5 8 7 6-9 1 1 9-7-5-7 5 1-9-9-1 7-6-5-8 9 2z" class="f-crimson"/>`;
        } else {
          nodes += `<circle cx="${x}" cy="${y}" r="9" class="f-ink s-cyan" stroke-width="2.2"/>`;
        }
      });
      heads.forEach(([x, y]) => { nodes += `<rect x="${x - 10}" y="${y - 10}" width="20" height="20" transform="rotate(45 ${x} ${y})" class="f-ink s-yellow" stroke-width="2.2"/>`; });
      return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" font-size="11">
        <text x="20" y="30" class="f-paper t-mono" opacity=".7">hierarchical graph + trust · schematic</text>
        ${edges}
        <rect x="186" y="42" width="28" height="28" class="f-yellow"/>
        ${nodes}
        <g transform="translate(358 46)">
          <rect x="-10" y="-6" width="20" height="12" class="f-crimson"/><rect x="-26" y="-3" width="13" height="6" class="f-crimson" opacity=".7"/><rect x="13" y="-3" width="13" height="6" class="f-crimson" opacity=".7"/>
        </g>
        <path d="M352 64q-8 40 4 146" class="f-none s-crimson fx-flow" stroke-width="2" stroke-dasharray="3 4"/>
        <text x="300" y="30" class="f-crimson t-mono" font-size="10">spoofed GPS</text>
        <rect x="265" y="276" width="124" height="17" class="f-ink"/>
        <text x="270" y="288" class="f-crimson t-mono" font-size="10">flagged · low trust</text>
      </svg>`;
    },

    lung() {
      const r = rng(77);
      const tissue = (ox, oy, cls1, cls2) => {
        let s = '';
        for (let i = 0; i < 38; i++) {
          const x = ox + 8 + r() * 124, y = oy + 8 + r() * 84, rad = 4 + r() * 7;
          s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(rad)}" class="${r() < .7 ? cls1 : cls2}" opacity="${f1(.35 + r() * .5)}"/>`;
        }
        return s;
      };
      return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" font-size="11">
        <defs><clipPath id="lung-a"><rect x="24" y="40" width="140" height="100"/></clipPath><clipPath id="lung-b"><rect x="24" y="176" width="140" height="100"/></clipPath></defs>
        <text x="24" y="30" class="f-paper t-mono" opacity=".7">source data</text>
        <rect x="24" y="40" width="140" height="100" class="f-navy"/>
        <g clip-path="url(#lung-a)">${tissue(24, 40, 'f-magenta', 'f-paper')}</g>
        <rect x="24" y="40" width="140" height="100" class="f-none s-paper" stroke-width="1.5" opacity=".6"/>
        <path d="M94 146v24" class="s-yellow fx-flow" stroke-width="2" stroke-dasharray="3 4"/>
        <path d="M88 164l6 8 6-8" class="f-none s-yellow" stroke-width="2"/>
        <text x="104" y="163" class="f-yellow t-mono" font-size="9.5">shift</text>
        <rect x="24" y="176" width="140" height="100" class="f-navy"/>
        <g clip-path="url(#lung-b)">${tissue(24, 176, 'f-violet', 'f-cyan')}</g>
        <rect x="24" y="176" width="140" height="100" class="f-none s-paper" stroke-width="1.5" opacity=".6"/>
        <text x="24" y="292" class="f-paper t-mono" opacity=".7">other dataset</text>
        <path d="M172 90H206M172 226H206" class="s-paper fx-flow" stroke-width="2" stroke-dasharray="3 4"/>
        <text x="214" y="64" class="f-paper t-mono" font-size="10" opacity=".75">prediction ± uncertainty</text>
        <rect x="214" y="80" width="150" height="16" class="f-none s-paper" stroke-width="1" opacity=".35"/>
        <rect x="214" y="80" width="128" height="16" class="f-cyan" opacity=".85"/>
        <path d="M336 88H348M336 82v12M348 82v12" class="s-paper" stroke-width="1.8"/>
        <rect x="214" y="216" width="150" height="16" class="f-none s-paper" stroke-width="1" opacity=".35"/>
        <rect x="214" y="216" width="98" height="16" class="f-violet" opacity=".85"/>
        <path d="M268 224H356M268 216v16M356 216v16" class="s-yellow fx-blink" stroke-width="2"/>
        <text x="214" y="252" class="f-yellow t-mono" font-size="10">wider band under shift</text>
      </svg>`;
    },
  };
  safe('figures', () => $$('[data-fig]').forEach((el) => { const f = FIGS[el.dataset.fig]; if (f) el.innerHTML = f(); }));

  /* ---------------------------------------------------------------------
     Project cover art
     --------------------------------------------------------------------- */
  const ART = {
    clarity() {
      const r = rng(3);
      let table = '';
      for (let row = 0; row < 8; row++) {
        for (let c = 0; c < 5; c++) {
          const x = 52 + c * 50, y = 116 + row * 34;
          const hot = (row === 3 && c === 2) || (row === 6 && c === 4);
          table += `<rect x="${x}" y="${y}" width="44" height="26" class="${row === 0 ? 'f-yellow' : hot ? 'f-crimson' : 'f-ink'}" opacity="${row === 0 || hot ? 1 : .75}"/>`;
          if (row > 0 && !hot) table += `<rect x="${x + 6}" y="${y + 11}" width="${f1(10 + r() * 24)}" height="4" class="f-paper" opacity=".5"/>`;
        }
      }
      const vals = [.35, .52, .44, .7, .62, .88];
      const bars = vals.map((v, i) => `<rect x="${360 + i * 40}" y="${f1(380 - v * 200)}" width="28" height="${f1(v * 200)}" class="${i === 5 ? 'f-yellow' : 'f-paper'}" opacity="${i === 5 ? 1 : .8}"/>`).join('');
      const trend = vals.map((v, i) => `${i ? 'L' : 'M'}${374 + i * 40} ${f1(360 - v * 200)}`).join('');
      return `<svg viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice" font-size="14">
        <text x="52" y="98" class="f-paper t-mono" font-size="17" opacity=".85">your_data.csv · up to 50 MB</text>
        ${table}
        <path d="M44 224H310" class="s-cyan fx-flow" stroke-width="3" stroke-dasharray="8 6"/>
        <path d="M330 270h18l-6-6M348 270l-6 6" class="f-none s-paper" stroke-width="3"/>
        <path d="M352 380H600" class="s-paper" stroke-width="2"/>
        ${bars}
        <path d="${trend}" class="f-none s-cyan" stroke-width="3"/>
        <rect x="360" y="96" width="236" height="64" class="f-ink s-yellow" stroke-width="2"/>
        <text x="374" y="122" class="f-yellow t-disp" font-size="20">REPORT</text>
        <rect x="374" y="134" width="190" height="5" class="f-paper" opacity=".6"/><rect x="374" y="146" width="140" height="5" class="f-paper" opacity=".4"/>
      </svg>`;
    },
    rag() {
      const r = rng(9);
      let pages = '';
      for (let i = 2; i >= 0; i--) {
        const x = 56 + i * 16, y = 120 + i * 18;
        pages += `<path d="M${x} ${y}h104l26 26v150H${x}z" class="f-ink s-cyan" stroke-width="2"/>`;
        for (let l = 0; l < 7; l++) pages += `<rect x="${x + 14}" y="${y + 40 + l * 16}" width="${f1(50 + r() * 60)}" height="5" class="f-paper" opacity="${i ? .2 : .55}"/>`;
      }
      let pts = '', near = '';
      const q = [452, 238];
      const cloud = Array.from({ length: 34 }, () => [372 + r() * 170, 136 + r() * 170]);
      cloud.forEach(([x, y]) => { pts += `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" class="f-paper" opacity=".55"/>`; });
      cloud.map((p) => [p, Math.hypot(p[0] - q[0], p[1] - q[1])]).sort((a, b) => a[1] - b[1]).slice(0, 3)
        .forEach(([[x, y]]) => { near += `<path d="M${q[0]} ${q[1]}L${f1(x)} ${f1(y)}" class="s-cyan" stroke-width="2.4"/><circle cx="${f1(x)}" cy="${f1(y)}" r="7" class="f-cyan"/>`; });
      return `<svg viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice" font-size="14">
        <text x="56" y="96" class="f-paper t-mono" font-size="18" opacity=".85">docs → chunks → FAISS</text>
        ${pages}
        <path d="M232 238H352" class="s-paper fx-flow" stroke-width="2.4" stroke-dasharray="8 6"/>
        <rect x="360" y="124" width="196" height="196" class="f-none s-paper" stroke-width="1.5" stroke-dasharray="2 6" opacity=".6"/>
        ${pts}${near}
        <path d="M${q[0]} ${q[1] - 13}l4 9 10 1-8 6 3 10-9-6-9 6 3-10-8-6 10-1z" class="f-yellow"/>
        <path d="M418 330h168a14 14 0 0 1 14 14v40a14 14 0 0 1-14 14H452l-22 18v-18h-12a14 14 0 0 1-14-14v-40a14 14 0 0 1 14-14z" class="f-cyan"/>
        <text x="424" y="362" class="f-ink t-disp" font-size="18">ANSWER FROM YOUR DOCS</text>
        <rect x="424" y="372" width="150" height="5" class="f-ink" opacity=".5"/>
      </svg>`;
    },
    screener() {
      const rows = [9, 8, 6, 5, 3];
      const list = rows.map((s, i) => {
        const y = 130 + i * 62, top = i === 0;
        return `<rect x="70" y="${y}" width="500" height="48" class="${top ? 'f-magenta' : 'f-ink'}" ${top ? '' : 'opacity=".85"'}/>
          <path d="M86 ${y + 10}h20l8 8v20H86z" class="${top ? 'f-ink' : 'f-none s-paper'}" stroke-width="1.5"/>
          <rect x="128" y="${y + 14}" width="${120 - i * 8}" height="6" class="${top ? 'f-ink' : 'f-paper'}" opacity="${top ? 1 : .55}"/>
          <rect x="128" y="${y + 28}" width="${80 - i * 6}" height="5" class="${top ? 'f-ink' : 'f-paper'}" opacity="${top ? .6 : .3}"/>
          <rect x="300" y="${y + 19}" width="200" height="10" class="f-none ${top ? 's-ink' : 's-paper'}" stroke-width="1.5" opacity="${top ? 1 : .4}"/>
          <rect x="300" y="${y + 19}" width="${s * 20}" height="10" class="${top ? 'f-ink' : 'f-paper'}" opacity="${top ? 1 : .55}"/>
          <text x="530" y="${y + 33}" text-anchor="middle" class="${top ? 'f-ink' : 'f-magenta'} t-disp" font-size="26">${s}</text>`;
      }).join('');
      return `<svg viewBox="0 72 640 360" preserveAspectRatio="xMidYMid slice" font-size="14">
        <text x="70" y="108" class="f-paper t-mono" font-size="18" opacity=".85">JD fit · scored 1–10 · on-device</text>
        ${list}
        <text x="580" y="160" class="f-yellow t-disp" font-size="16" transform="rotate(-8 580 160)">TOP PICK</text>
      </svg>`;
    },
    gen() {
      const r = rng(21);
      const seven = ['..........', '.########.', '.########.', '.......##.', '......##..', '.....##...', '....##....', '....##....', '...##.....', '..........'];
      let noise = '', out = '';
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const d = (Math.floor(r() * 4) * 83);
          noise += `<rect x="${60 + x * 21}" y="${130 + y * 21}" width="19" height="19" class="f-violet fx-noise" opacity="${f1(.15 + r() * .85)}" style="animation-delay:-${d}ms"/>`;
          const on = seven[y][x] === '#';
          out += `<rect x="${380 + x * 21}" y="${130 + y * 21}" width="19" height="19" class="${on ? 'f-paper' : 'f-violet'}" opacity="${on ? f1(.8 + r() * .2) : f1(r() * .18)}"/>`;
        }
      }
      return `<svg viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice" font-size="14">
        <text x="60" y="112" class="f-paper t-mono" font-size="18" opacity=".85">z ~ N(0, I)</text>
        <text x="380" y="112" class="f-paper t-mono" font-size="18" opacity=".85">G(z) · MNIST</text>
        ${noise}
        <path d="M290 235h58" class="s-paper fx-flow" stroke-width="3" stroke-dasharray="8 6"/>
        <path d="M340 225l12 10-12 10" class="f-none s-paper" stroke-width="3"/>
        <text x="320" y="214" text-anchor="middle" class="f-yellow t-disp" font-size="20">G</text>
        ${out}
      </svg>`;
    },
  };
  // Tall and modal frames show the whole drawing; wide frames crop it like a film still.
  const fitArt = (el) => { const svg = $('svg', el); if (svg) svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); };
  safe('project art', () => {
    $$('[data-art]').forEach((el) => { const a = ART[el.dataset.art]; if (a) el.innerHTML = a(); });
  });

  /* ---------------------------------------------------------------------
     Reveal system: things wait slightly out of register, then snap in.
     Content is never hidden; only its position and colour plates move.
     Each batch that enters together staggers from its own first element.
     --------------------------------------------------------------------- */
  const onReveal = new Map();
  let revealIO = null;

  function reveal(el) {
    el.classList.remove('rv--armed');
    el.classList.add('rv--in');
    const cb = onReveal.get(el);
    if (cb) { onReveal.delete(el); cb(); }
  }

  function setupReveals() {
    const els = $$('.rv');
    if (!isFull() || !('IntersectionObserver' in window)) { els.forEach(reveal); return; }
    const limit = window.innerHeight * .92;
    revealIO = new IntersectionObserver((entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => { const dy = a.boundingClientRect.top - b.boundingClientRect.top; return Math.abs(dy) > 32 ? dy : a.boundingClientRect.left - b.boundingClientRect.left; })
        .forEach((e, i) => {
          e.target.style.setProperty('--rv-d', `${Math.min(i * 70, 350)}ms`);
          reveal(e.target);
          revealIO.unobserve(e.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    els.forEach((el) => {
      if (el.getBoundingClientRect().top > limit) { el.classList.add('rv--armed'); revealIO.observe(el); }
      else reveal(el);
    });
  }

  function revealAll() {
    $$('.rv--armed').forEach((el) => { if (revealIO) revealIO.unobserve(el); reveal(el); });
  }

  // chapters register their diagonal cut once
  const chapters = $$('.chapter');
  if ('IntersectionObserver' in window) {
    const chapterIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-entered'); chapterIO.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    chapters.forEach((c) => chapterIO.observe(c));
  }

  /* ---------------------------------------------------------------------
     Cover: glitch bursts (capped), particles (on twos), parallax, replay
     --------------------------------------------------------------------- */
  const hero = $('#cover');
  let heroVisible = true;
  let pendingReplay = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      heroVisible = e.isIntersecting;
      hero.classList.toggle('is-offscreen', !heroVisible);
      if (heroVisible) startLoops();
    }, { threshold: 0 }).observe(hero);
  }

  const glitchLines = $$('.hero-name .glitch');
  const GLITCH_CAP = 3;
  let glitchTimer = 0, glitchCount = 0, lastHoverGlitch = 0;
  function glitchOnce() {
    if (!isFull() || !heroVisible || document.hidden) return;
    glitchLines.forEach((l) => { l.classList.remove('is-glitching'); void l.offsetWidth; l.classList.add('is-glitching'); });
    setTimeout(() => glitchLines.forEach((l) => l.classList.remove('is-glitching')), 400);
  }
  function scheduleGlitch(delay) {
    clearTimeout(glitchTimer);
    if (glitchCount >= GLITCH_CAP) return;
    glitchTimer = setTimeout(() => { glitchOnce(); glitchCount++; scheduleGlitch(6500 + Math.random() * 4500); }, delay);
  }
  $('.hero-name').addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || Date.now() - lastHoverGlitch < 2000) return;
    lastHoverGlitch = Date.now();
    glitchOnce();
  });

  function replayCover() {
    pendingReplay = false;
    hero.classList.add('is-rewind');
    void hero.offsetWidth;
    hero.classList.remove('is-rewind');
    glitchCount = 0;
    scheduleGlitch(1050);
  }

  // Ambient particles: halftone dots, crosses and shards, drawn at 12fps.
  const canvas = $('#particles');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const COLORS = ['#00E5FF', '#F5223D', '#FFE14A', '#F4F0E8', '#FF36B5'];
  let parts = [], partW = 0, partH = 0, partRAF = 0, partLast = 0;
  function sizeCanvas() {
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    partW = canvas.clientWidth; partH = canvas.clientHeight;
    canvas.width = Math.round(partW * dpr); canvas.height = Math.round(partH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = rng(101);
    const count = partW < 700 ? 9 : 16;
    parts = Array.from({ length: count }, () => ({
      x: r() * partW, y: r() * partH,
      vy: -(6 + r() * 14), amp: 6 + r() * 14, ph: r() * Math.PI * 2,
      size: 2 + r() * 4, kind: Math.floor(r() * 3), c: COLORS[Math.floor(r() * COLORS.length)], a: .35 + r() * .5,
    }));
  }
  function drawParticles(t) {
    if (!ctx) return;
    ctx.clearRect(0, 0, partW, partH);
    parts.forEach((p) => {
      const x = p.x + Math.sin(t / 1400 + p.ph) * p.amp;
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c; ctx.strokeStyle = p.c; ctx.lineWidth = 1.6;
      if (p.kind === 0) { ctx.beginPath(); ctx.arc(x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
      else if (p.kind === 1) { ctx.beginPath(); ctx.moveTo(x - p.size * 1.4, p.y); ctx.lineTo(x + p.size * 1.4, p.y); ctx.moveTo(x, p.y - p.size * 1.4); ctx.lineTo(x, p.y + p.size * 1.4); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(x, p.y - p.size * 1.5); ctx.lineTo(x + p.size, p.y + p.size); ctx.lineTo(x - p.size, p.y + p.size); ctx.closePath(); ctx.fill(); }
    });
    ctx.globalAlpha = 1;
  }
  function tickParticles(t) {
    partRAF = 0;
    if (!isFull() || !heroVisible || document.hidden) return;
    if (t - partLast >= 83) {
      const dt = partLast ? Math.min(t - partLast, 250) / 1000 : 0;
      partLast = t;
      parts.forEach((p) => { p.y += p.vy * dt; if (p.y < -12) { p.y = partH + 12; p.x = Math.random() * partW; } });
      drawParticles(t);
    }
    partRAF = requestAnimationFrame(tickParticles);
  }

  // Parallax: pointer moves layers by depth (counter-motion for the city);
  // scroll drifts far layers slower than the page. Never applied to text.
  const layers = $$('.hero-sky [data-depth]').map((el) => ({ el, d: parseFloat(el.dataset.depth) }));
  const SCROLL_K = { 'layer--speed': .12, 'layer--portal': .11, 'layer--web': .08, 'layer--far': .1, 'layer--mid': .06, 'layer--near': .02 };
  layers.forEach((l) => { const k = Object.keys(SCROLL_K).find((c) => l.el.classList.contains(c)); l.k = k ? SCROLL_K[k] : 0; });
  let ptx = 0, pty = 0, pcx = 0, pcy = 0, paraRAF = 0;
  function tickParallax() {
    paraRAF = 0;
    if (!isFull() || !heroVisible || !finePointer.matches) return;
    pcx += (ptx - pcx) * .08; pcy += (pty - pcy) * .08;
    const sy = Math.min(window.scrollY, hero.offsetHeight);
    layers.forEach(({ el, d, k }) => {
      el.style.transform = `translate3d(${f1(pcx * d * 36)}px, ${f1(pcy * d * 22 + sy * k)}px, 0)`;
    });
    if (Math.abs(ptx - pcx) > .002 || Math.abs(pty - pcy) > .002) paraRAF = requestAnimationFrame(tickParallax);
  }
  function kickParallax() { if (!paraRAF) paraRAF = requestAnimationFrame(tickParallax); }
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    ptx = (e.clientX / window.innerWidth - .5) * 2;
    pty = (e.clientY / window.innerHeight - .5) * 2;
    kickParallax();
  });
  hero.addEventListener('pointerleave', () => { ptx = 0; pty = 0; kickParallax(); });

  function startLoops() {
    if (!isFull()) return;
    if (ctx && !partRAF) { partLast = 0; partRAF = requestAnimationFrame(tickParticles); }
    kickParallax();
  }
  function stopLoops() {
    cancelAnimationFrame(partRAF); partRAF = 0;
    cancelAnimationFrame(paraRAF); paraRAF = 0;
    clearTimeout(glitchTimer);
    layers.forEach(({ el }) => { el.style.transform = ''; });
    drawParticles(0);
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) startLoops(); });

  /* ---------------------------------------------------------------------
     Navigation: solid after the cover, hides while reading down,
     scrollspy, reading progress, and a diagonal page-turn for long jumps
     --------------------------------------------------------------------- */
  let strandLen = 0, fracs = [];
  const nav = $('#nav');
  let lastY = window.scrollY, navTick = false;
  function onScroll() {
    if (navTick) return;
    navTick = true;
    requestAnimationFrame(() => {
      navTick = false;
      const y = window.scrollY;
      nav.classList.toggle('is-solid', y > 40);
      const goingDown = y > lastY + 6, goingUp = y < lastY - 6;
      if (goingDown && y > window.innerHeight * .8 && !nav.contains(document.activeElement)) nav.classList.add('is-hidden');
      else if (goingUp || y < 80) nav.classList.remove('is-hidden');
      if (Math.abs(y - lastY) > 6) lastY = y;
      updateStrand();
      updateProgress();
      if (heroVisible) kickParallax();
      if (pendingReplay && y < 40) replayCover();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  const spyLinks = $$('.nav-links a, .menu-list a');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        spyLinks.forEach((a) => { if (a.hash === `#${e.target.id}`) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    [hero, ...chapters].forEach((s) => spy.observe(s));
  }

  function focusTarget(target) {
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  function willPageTurn(hash) {
    const target = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    return !!target && isFull() && typeof document.startViewTransition === 'function' && Math.abs(target.getBoundingClientRect().top) > window.innerHeight * 1.5;
  }
  function navigateTo(hash, opts = {}) {
    const target = hash && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!target) return;
    const jump = () => { if (opts.before) opts.before(); target.scrollIntoView({ behavior: 'instant', block: 'start' }); focusTarget(target); };
    if (willPageTurn(hash)) {
      document.startViewTransition(jump);
    } else {
      if (opts.before) opts.before();
      target.scrollIntoView({ behavior: isFull() ? 'smooth' : 'auto', block: 'start' });
      focusTarget(target);
    }
    try { history.pushState(null, '', hash); } catch (e) { /* sandboxed history */ }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.nav-links a, .hero-cta a, .footer a[href="#cover"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigateTo(a.hash);
  });

  // Mobile menu: bands enter left to right and leave in reverse
  const menu = $('#menu');
  const menuBtn = $('#menu-btn');
  let menuClosing = false;
  function closeMenu(then) {
    if (!menu.open || menuClosing) { if (then) then(); return; }
    const done = () => { menu.close(); menu.classList.remove('is-closing'); menuClosing = false; if (then) then(); };
    if (!isFull()) { done(); return; }
    menuClosing = true;
    menu.classList.add('is-closing');
    setTimeout(done, 280);
  }
  menuBtn.addEventListener('click', () => {
    if (typeof menu.showModal !== 'function') return;
    menu.showModal();
    menuBtn.setAttribute('aria-expanded', 'true');
  });
  menu.addEventListener('close', () => menuBtn.setAttribute('aria-expanded', 'false'));
  menu.addEventListener('cancel', (e) => { e.preventDefault(); closeMenu(); });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) { closeMenu(); return; }
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    // a long jump closes the menu inside the page-turn; a short one plays the band exit first
    if (willPageTurn(link.hash)) navigateTo(link.hash, { before: () => menu.close() });
    else closeMenu(() => navigateTo(link.hash));
  });

  /* ---------------------------------------------------------------------
     Motion level: FX toggle, OS changes, one place that applies it
     --------------------------------------------------------------------- */
  const fxBtn = $('#fx-toggle');
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const osMotion = () => (reduceMQ.matches ? 'reduce' : 'none');
  function readSaved() {
    try {
      const raw = localStorage.getItem('nv-motion');
      if (raw === 'calm' || raw === 'full') return { m: raw, os: 'none' };
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function syncFx() {
    const on = isFull();
    fxBtn.setAttribute('aria-pressed', String(on));
    $('.fx-state', fxBtn).textContent = on ? 'On' : 'Off';
    const saved = readSaved();
    const osReduce = reduceMQ.matches && !(saved && saved.os === 'reduce');
    fxBtn.dataset.tip = on ? 'Turn animation off' : osReduce ? 'Reduced motion is on in your system. Turn FX on anyway' : 'Turn animation on';
    const replay = $('#replay-cover');
    if (replay) {
      replay.setAttribute('aria-disabled', String(!on));
      if (on) replay.removeAttribute('data-tip'); else replay.dataset.tip = 'Turn FX on to replay';
      $('#replay-hint').textContent = on ? '' : 'Turn FX on to replay the cover.';
    }
  }
  function applyMotion(level) {
    root.dataset.motion = level;
    syncFx();
    if (level === 'full') {
      startLoops();
      glitchCount = 0;
      scheduleGlitch(400);
      $('#strip').classList.add('is-live');
    } else {
      stopLoops();
      revealAll();
      $$('.constellation').forEach((c) => c.classList.remove('is-armed', 'is-booting'));
      $('#strip').classList.remove('is-live');
    }
    updateStrand();
  }
  safe('fx', () => {
    fxBtn.addEventListener('click', () => {
      const next = isFull() ? 'calm' : 'full';
      try { localStorage.setItem('nv-motion', JSON.stringify({ m: next, os: osMotion() })); } catch (e) { /* storage unavailable */ }
      applyMotion(next);
    });
    onMQChange(reduceMQ, () => {
      const saved = readSaved();
      const level = saved && saved.os === osMotion() ? saved.m : (reduceMQ.matches ? 'calm' : 'full');
      if (level !== root.dataset.motion) applyMotion(level); else syncFx();
    });
  });

  // Tooltips can be dismissed with Escape (WCAG 1.4.13) and come back on the next focus move.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') root.classList.add('tips-off'); });
  document.addEventListener('focusin', () => root.classList.remove('tips-off'));
  document.addEventListener('pointermove', () => root.classList.remove('tips-off'), { passive: true });

  /* ---------------------------------------------------------------------
     Projects: filters (race-safe, cards glide to new slots), tilt, files
     --------------------------------------------------------------------- */
  const grid = $('#project-grid');
  const cards = $$('.proj', grid);
  const chips = $$('.chip');
  const filterStatus = $('#filter-status');
  let activeFilter = 'all', filterGen = 0, gridT = 0;
  safe('filters', () => chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      if (f === activeFilter) return;
      activeFilter = f;
      const g = ++filterGen;
      clearTimeout(gridT);
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      const matches = cards.map((c) => f === 'all' || c.dataset.cats.split(' ').includes(f));
      const shown = matches.filter(Boolean).length;
      filterStatus.textContent = f === 'all' ? '' : `Showing ${shown} of ${cards.length} projects`;
      cards.forEach((c) => c.classList.remove('is-leaving', 'is-entering'));

      if (!isFull()) {
        cards.forEach((c, i) => { c.hidden = !matches[i]; });
        grid.classList.toggle('is-filtered', f !== 'all');
        return;
      }
      cards.forEach((c, i) => { if (!matches[i] && !c.hidden) c.classList.add('is-leaving'); });
      gridT = setTimeout(() => {
        if (g !== filterGen) return;
        // FLIP: record where survivors are, re-flow, then glide them from there.
        const survivors = cards.filter((c, i) => matches[i] && !c.hidden);
        const first = new Map(survivors.map((c) => [c, c.getBoundingClientRect()]));
        let k = 0;
        cards.forEach((c, i) => {
          c.classList.remove('is-leaving');
          if (!matches[i]) { c.hidden = true; return; }
          if (c.hidden) {
            c.hidden = false;
            c.style.setProperty('--stagger', `${k++ * 50}ms`);
            c.classList.add('is-entering');
            c.addEventListener('animationend', () => c.classList.remove('is-entering'), { once: true });
          }
        });
        grid.classList.toggle('is-filtered', f !== 'all');
        survivors.forEach((c) => {
          const a = first.get(c), b = c.getBoundingClientRect();
          const dx = a.left - b.left, dy = a.top - b.top;
          if ((Math.abs(dx) > .5 || Math.abs(dy) > .5) && c.animate) {
            c.animate([{ translate: `${f1(dx)}px ${f1(dy)}px` }, { translate: '0px 0px' }], { duration: 300, easing: 'cubic-bezier(.16, 1, .3, 1)' });
          }
        });
      }, 180);
    });
  }));

  safe('cards', () => cards.forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      if (!isFull() || e.pointerType !== 'mouse') return;
      const b = card.getBoundingClientRect();
      const px = (e.clientX - b.left) / b.width - .5, py = (e.clientY - b.top) / b.height - .5;
      card.style.setProperty('--ry', `${f1(px * 7)}deg`);
      card.style.setProperty('--rx', `${f1(-py * 5)}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    // the whole card opens its file, except its own links and buttons, or a text selection
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button') || String(window.getSelection()).trim()) return;
      const btn = $('[data-open]', card);
      if (btn) btn.click();
    });
  }));

  const modal = $('#modal');
  const modalBody = $('#modal-body');
  const modalArt = $('.modal-art', modal);
  const modalStatus = $('#modal-status');
  let opener = null, linkT = 0;

  function openProject(key, opts = {}) {
    const tpl = document.getElementById(`tpl-${key}`);
    if (!tpl || typeof modal.showModal !== 'function') return false;
    const cardBtn = $(`.proj [data-open="${CSS.escape(key)}"]`);
    const card = cardBtn ? cardBtn.closest('.proj') : null;
    opener = opts.opener || cardBtn;
    const cs = card ? getComputedStyle(card) : null;
    const accent = (cs && cs.getPropertyValue('--accent').trim()) || 'var(--crimson)';
    const accentText = (cs && cs.getPropertyValue('--accent-text').trim()) || accent;
    modal.style.setProperty('--accent', accent);
    modal.style.setProperty('--accent-text', accentText);
    modalBody.replaceChildren(tpl.content.cloneNode(true));
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'btn btn--small btn--ghost';
    copyBtn.dataset.copyLink = '';
    copyBtn.innerHTML = '<span>Copy link</span><svg aria-hidden="true"><use href="#i-copy"/></svg>';
    modalBody.appendChild(copyBtn);
    [...modalBody.children].forEach((c, i) => c.style.setProperty('--k', i));
    modalArt.innerHTML = ART[key] ? ART[key]() : '';
    fitArt(modalArt);
    modalStatus.textContent = '';
    modal.classList.remove('is-closing');
    modal.showModal();
    $('.modal-close', modal).focus();
    if (opts.push !== false) {
      try { history.pushState({ nvProject: key }, '', `${location.pathname}?project=${encodeURIComponent(key)}${location.hash}`); } catch (e) { /* sandboxed history */ }
    }
    return true;
  }
  function closeModal(fromPop = false) {
    if (!modal.open || modal.classList.contains('is-closing')) return;
    const done = () => { modal.close(); modal.classList.remove('is-closing'); };
    if (!isFull()) done();
    else { modal.classList.add('is-closing'); setTimeout(done, 260); }
    if (fromPop) return;
    try {
      if (history.state && history.state.nvProject) history.back();
      else if (new URLSearchParams(location.search).has('project')) history.replaceState(null, '', location.pathname + location.hash);
    } catch (e) { /* sandboxed history */ }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openProject(b.dataset.open, { opener: b });
  });
  modal.addEventListener('cancel', (e) => { e.preventDefault(); closeModal(); });
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) { closeModal(); return; }
    const copy = e.target.closest('[data-copy-link]');
    if (!copy) return;
    const lbl = $('span', copy);
    copyText(location.href, null).then((ok) => {
      modalStatus.textContent = ok ? 'Link to this file copied.' : 'Copy failed. Use your browser’s address bar to share this file.';
      lbl.textContent = ok ? 'Link copied' : 'Copy failed';
      clearTimeout(linkT);
      linkT = setTimeout(() => { lbl.textContent = 'Copy link'; }, 2000);
    });
  });
  modal.addEventListener('close', () => { if (opener && document.contains(opener)) opener.focus(); });
  window.addEventListener('popstate', () => {
    const k = new URLSearchParams(location.search).get('project');
    if (k && document.getElementById(`tpl-${k}`)) { if (!modal.open) openProject(k, { push: false }); }
    else if (modal.open) closeModal(true);
  });

  /* ---------------------------------------------------------------------
     Power system: constellation of ARIA tabs
     --------------------------------------------------------------------- */
  const powers = $$('#powers .power');
  const constEl = $('#constellation');
  const constSvg = $('#const-svg');
  const powerNav = $('#power-nav');
  let activatePower = () => {};
  safe('constellation', () => {
    if (!powers.length || !constEl) return;
    const VW = 1000, VH = 820, CX = 500, CY = 410;
    const angles = [-90, -30, 30, 90, 150, 210];
    const BRIDGES = [['vision', 'trust'], ['graph', 'trust'], ['genai', 'ship'], ['data', 'trust'], ['vision', 'graph'], ['data', 'ship']];
    const nodes = {};

    powers.forEach((li, i) => {
      const a = angles[i] * Math.PI / 180;
      const x = CX + Math.cos(a) * 330, y = CY + Math.sin(a) * 258;
      const color = li.style.getPropertyValue('--c').trim();
      const key = li.dataset.key;
      nodes[key] = { li, x, y, a, color, i };
      const head = document.createElement('div');
      head.className = 'power-head';
      head.innerHTML = `<span class="power-icon" aria-hidden="true"><svg><use href="#${li.dataset.icon}"/></svg></span>`;
      head.appendChild($('.power-name', li));
      li.prepend(head);
      li.setAttribute('role', 'tabpanel');
      li.setAttribute('aria-labelledby', `tab-${key}`);
      li.tabIndex = 0;
      $$('.power-skills li', li).forEach((s, k) => s.style.setProperty('--k', k));
      li.addEventListener('beforematch', () => activatePower(key, false));
    });

    let svg = '';
    BRIDGES.forEach(([p, q]) => {
      const A = nodes[p], B = nodes[q];
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      svg += `<path class="bridge" d="M${f1(A.x)} ${f1(A.y)}Q${f1(mx + (CX - mx) * .45)} ${f1(my + (CY - my) * .45)} ${f1(B.x)} ${f1(B.y)}"/>`;
    });
    let n = 0;
    Object.entries(nodes).forEach(([key, nd]) => {
      const sats = (nd.li.dataset.sat || '').split('|').filter(Boolean);
      const isBottom = Math.sin(nd.a) > .9;
      let g = `<path class="edge edge--core" d="M${CX} ${CY}L${f1(nd.x)} ${f1(nd.y)}"/>`;
      sats.forEach((label, k) => {
        const off = (k - (sats.length - 1) / 2) * 38 * Math.PI / 180;
        const down = !isBottom && Math.sin(nd.a + off) > .55;
        const d = (k % 2 ? 136 : 100) * (isBottom ? .86 : 1) + (down ? 56 : 0);
        const sx = nd.x + Math.cos(nd.a + off) * d, sy = nd.y + Math.sin(nd.a + off) * d;
        const below = Math.sin(nd.a + off) > -.25;
        g += `<path class="edge edge--sat" d="M${f1(nd.x)} ${f1(nd.y)}L${f1(sx)} ${f1(sy)}"/>`;
        g += `<g class="sat" style="--n:${n++}"><circle cx="${f1(sx)}" cy="${f1(sy)}" r="7" style="stroke:${nd.color}"/><text x="${f1(sx)}" y="${f1(below ? sy + 28 : sy - 15)}">${label}</text></g>`;
      });
      svg += `<g class="grp" data-key="${key}" style="--c:${nd.color}">${g}</g>`;
    });
    svg += `<g class="core-spin"><circle class="core-ring" cx="${CX}" cy="${CY}" r="74"/></g>
      <circle cx="${CX}" cy="${CY}" r="52" class="f-ink s-paper" stroke-width="3"/>
      <circle cx="${CX + 4}" cy="${CY}" r="52" class="f-none s-crimson" stroke-width="2" opacity=".7"/>
      <circle cx="${CX - 4}" cy="${CY}" r="52" class="f-none s-cyan" stroke-width="2" opacity=".7"/>
      <text class="core-text" x="${CX}" y="${CY + 2}">NV</text>`;
    constSvg.innerHTML = svg;

    Object.entries(nodes).forEach(([key, nd]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cnode';
      b.id = `tab-${key}`;
      b.style.left = `${(nd.x / VW) * 100}%`;
      b.style.top = `${(nd.y / VH) * 100}%`;
      b.style.setProperty('--c', nd.color);
      b.style.setProperty('--n', nd.i);
      b.dataset.key = key;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('aria-controls', `power-${key}`);
      b.tabIndex = -1;
      b.innerHTML = `<svg aria-hidden="true"><use href="#${nd.li.dataset.icon}"/></svg><span class="cnode-label">${nd.li.dataset.short}</span><span class="sr-only">: ${$('.power-name', nd.li).textContent}</span>`;
      b.addEventListener('click', () => activatePower(key, true));
      powerNav.appendChild(b);
    });

    const tabs = $$('.cnode', powerNav);
    const groups = $$('.grp', constSvg);
    activatePower = (key, user) => {
      tabs.forEach((t) => { const on = t.dataset.key === key; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      groups.forEach((g) => { g.classList.toggle('is-on', g.dataset.key === key); g.classList.toggle('is-off', g.dataset.key !== key); });
      constEl.classList.add('is-dim');
      powers.forEach((li) => {
        const on = li.dataset.key === key;
        li.classList.toggle('is-active', on);
        li.tabIndex = on ? 0 : -1;
        if (on) { li.removeAttribute('hidden'); li.removeAttribute('aria-hidden'); }
        else { li.setAttribute('hidden', 'until-found'); li.setAttribute('aria-hidden', 'true'); }
        if (on && user) { li.classList.remove('is-swapped'); void li.offsetWidth; li.classList.add('is-swapped'); }
      });
    };
    powerNav.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j < 0) return;
      e.preventDefault();
      activatePower(tabs[j].dataset.key, true);
      tabs[j].focus();
    });
    activatePower('trust', false);
    // shown only now, so the arming check below measures a laid-out box
    root.classList.add('js-ready');

    // boot sequence once the constellation scrolls in: nodes start dim, never hidden
    onReveal.set(constEl, () => {
      if (!constEl.classList.contains('is-armed')) return;
      constEl.classList.remove('is-armed');
      constEl.classList.add('is-booting');
      setTimeout(() => constEl.classList.remove('is-booting'), 1500);
    });
    if (isFull() && constEl.getBoundingClientRect().top > window.innerHeight * .92) constEl.classList.add('is-armed');
  });

  /* ---------------------------------------------------------------------
     Timeline: a strand threads the frames, draws itself as you read,
     and each frame's SFX pops when the strand reaches it
     --------------------------------------------------------------------- */
  const strip = $('#strip');
  const strand = $('#strand');
  const ghost = $('.strand-ghost', strand);
  const live = $('.strand-live', strand);
  const frames = $$('.frame', strip);
  function layoutStrand() {
    const framesEl = $('.frames', strip);
    const pts = frames.map((li) => {
      const m = $('.marker', li);
      return [framesEl.offsetLeft + li.offsetLeft + m.offsetLeft + m.offsetWidth / 2, framesEl.offsetTop + li.offsetTop + m.offsetTop + m.offsetHeight / 2];
    });
    if (!pts.length) return;
    if (window.innerWidth <= 860) pts.forEach((p) => { p[0] = 8; });
    const last = pts[pts.length - 1];
    const tail = [last[0], last[1] + frames[frames.length - 1].offsetHeight + 20];
    let d = `M${f1(pts[0][0])} ${f1(pts[0][1] - 40)}L${f1(pts[0][0])} ${f1(pts[0][1])}`;
    const prefixes = [d];
    [...pts.slice(1), tail].forEach((pt, i) => {
      const [x0, y0] = i === 0 ? pts[0] : (i < pts.length ? pts[i] : last), [x1, y1] = pt, dy = (y1 - y0) * .55;
      d += `C${f1(x0)} ${f1(y0 + dy)} ${f1(x1)} ${f1(y1 - dy)} ${f1(x1)} ${f1(y1)}`;
      if (i < pts.length - 1) prefixes.push(d);
    });
    ghost.setAttribute('d', d);
    live.setAttribute('d', d);
    strandLen = live.getTotalLength();
    live.style.strokeDasharray = `${strandLen}`;
    // where along the strand each marker sits, as a fraction of its length
    const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    probe.style.visibility = 'hidden';
    strand.appendChild(probe);
    fracs = prefixes.map((pd) => { probe.setAttribute('d', pd); return strandLen ? probe.getTotalLength() / strandLen : 0; });
    probe.remove();
    strip.classList.toggle('is-live', isFull());
    updateStrand();
  }
  function updateStrand() {
    if (!strandLen) return;
    if (!isFull()) { live.style.strokeDashoffset = '0'; return; }
    const b = strip.getBoundingClientRect();
    const p = clamp((window.innerHeight * .72 - b.top) / b.height, 0, 1);
    live.style.strokeDashoffset = `${f1(strandLen * (1 - p))}`;
    frames.forEach((fr, i) => { if (fracs[i] <= p + .002) fr.classList.add('is-reached'); });
  }

  /* ---------------------------------------------------------------------
     Awards deck on phones: keyboard-reachable scroller with a counter
     --------------------------------------------------------------------- */
  const deck = $('#cards');
  const deckCount = $('#deck-count');
  const deckPrev = $('#deck-prev');
  const deckNext = $('#deck-next');
  const deckMQ = window.matchMedia('(max-width: 620px)');
  const deckCards = $$('.card', deck);
  let deckIndex = 0;
  function syncDeck() {
    const scroller = deckMQ.matches && deck.scrollWidth > deck.clientWidth + 2;
    if (scroller) { deck.tabIndex = 0; deck.setAttribute('aria-label', 'Collectibles, scroll sideways'); }
    else { deck.removeAttribute('tabindex'); deck.removeAttribute('aria-label'); }
    deckPrev.hidden = deckNext.hidden = !scroller;
    deckCount.textContent = scroller ? `${deckIndex + 1} / ${deckCards.length}` : '';
  }
  const deckStep = () => deckCards[0].offsetWidth + (parseFloat(getComputedStyle(deck).columnGap) || 0);
  let deckTarget = -1, deckTargetT = 0;
  function stepDeck(dir) {
    deckTarget = clamp((deckTarget < 0 ? deckIndex : deckTarget) + dir, 0, deckCards.length - 1);
    deck.scrollTo({ left: deckTarget * deckStep(), behavior: isFull() ? 'smooth' : 'auto' });
    clearTimeout(deckTargetT);
    deckTargetT = setTimeout(() => { deckTarget = -1; }, 700);
  }
  function resyncDeck() {
    if (deckMQ.matches) {
      deckIndex = deck.scrollLeft >= deck.scrollWidth - deck.clientWidth - 2 ? deckCards.length - 1 : clamp(Math.round(deck.scrollLeft / deckStep()), 0, deckCards.length - 1);
    }
    syncDeck();
  }
  deckPrev.addEventListener('click', () => stepDeck(-1));
  deckNext.addEventListener('click', () => stepDeck(1));
  if ('IntersectionObserver' in window) {
    const deckIO = new IntersectionObserver((entries) => {
      if (!deckMQ.matches) return;
      entries.forEach((e) => { if (e.isIntersecting) { deckIndex = deckCards.indexOf(e.target); syncDeck(); } });
    }, { root: deck, threshold: .6 });
    deckCards.forEach((c) => deckIO.observe(c));
  }
  onMQChange(deckMQ, resyncDeck);

  /* ---------------------------------------------------------------------
     Contact: copy email, compose a message, optional direct delivery
     --------------------------------------------------------------------- */
  const EMAIL = 'vytlanaishadh2@gmail.com';
  const copyStatus = $('#copy-status');
  const burst = $('#copy-burst');
  function selectText(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(range);
  }
  function selectFallback(el) {
    if (!el) return;
    if (typeof el.select === 'function') { el.focus(); el.select(); } else selectText(el);
  }
  function copyText(text, fallbackEl) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true, () => { selectFallback(fallbackEl); return false; });
    }
    selectFallback(fallbackEl);
    return Promise.resolve(false);
  }
  $('#copy-email').addEventListener('click', () => {
    copyText(EMAIL, $('#email-text')).then((ok) => {
      copyStatus.textContent = ok ? 'Email address copied.' : 'Email address selected. Press Ctrl+C or Cmd+C to copy.';
      if (!ok) return;
      burst.classList.remove('is-off'); burst.classList.add('is-on');
      setTimeout(() => { burst.classList.remove('is-on'); burst.classList.add('is-off'); }, 1300);
    });
  });

  const form = $('#signal-form');
  const result = $('#signal-result');
  const resultLead = $('#result-lead');
  const draft = $('#draft');
  const msgField = $('#f-msg');
  const msgCount = $('#f-msg-count');
  const copyMsg = $('#copy-msg');
  const fields = [$('#f-name'), $('#f-email'), msgField];
  let composed = '', copyMsgT = 0;
  const checks = {
    name: (v) => (v.trim() ? '' : 'Add your name so I know who’s writing.'),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter an email address like name@example.com.'),
    message: (v) => (v.trim().length >= 10 ? '' : 'Write at least a sentence (10+ characters).'),
  };
  function showError(input, msg) {
    const field = input.closest('.field');
    const err = $('.field-err', field);
    err.textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const ids = [msg ? err.id : '', input === msgField ? msgCount.id : ''].join(' ').trim();
    if (ids) input.setAttribute('aria-describedby', ids); else input.removeAttribute('aria-describedby');
    field.classList.toggle('is-invalid', !!msg);
    if (msg) { field.classList.remove('is-shaking'); void field.offsetWidth; field.classList.add('is-shaking'); }
  }
  fields.forEach((el) => el.addEventListener('input', () => {
    if (el === msgField) msgCount.textContent = `${el.value.length} / ${el.maxLength}`;
    if (!result.hidden) result.hidden = true;
    if (el.closest('.field').classList.contains('is-invalid')) showError(el, checks[el.name](el.value));
  }));
  function endpointURL() {
    try { const u = new URL(form.dataset.endpoint || ''); return u.protocol === 'https:' ? u.href : ''; } catch (e) { return ''; }
  }
  function showDraft(subject, lead) {
    resultLead.textContent = lead;
    $('#open-mail').href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composed)}`;
    $('#open-gmail').href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(composed)}`;
    draft.value = composed;
    $('.result-actions', result).hidden = false;
    $('label[for="draft"]', result).hidden = draft.hidden = $('.result-to', result).hidden = false;
    result.hidden = false;
    result.focus();
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if ($('#f-gotcha').value) return;
    let first = null;
    fields.forEach((el) => {
      const msg = checks[el.name](el.value);
      showError(el, msg);
      if (msg && !first) first = el;
    });
    if (first) { first.focus(); return; }
    const btn = $('.btn--submit', form);
    const label = $('.btn-label', btn);
    const name = form.elements.name.value.trim(), from = form.elements.email.value.trim(), msg = msgField.value.trim();
    const subject = `Hello from ${name}`;
    composed = `${msg}\n\n${name}\n${from}`;
    $('span', copyMsg).textContent = 'Copy message';
    btn.classList.add('is-busy'); btn.disabled = true; label.textContent = 'Writing';
    const finish = () => { btn.classList.remove('is-busy'); btn.disabled = false; label.textContent = 'Write the email'; };
    const endpoint = endpointURL();
    if (!endpoint) {
      setTimeout(() => { finish(); showDraft(subject, 'Your message is ready. Nothing has been sent yet. Choose how to send it:'); }, 360);
      return;
    }
    label.textContent = 'Sending';
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 15000);
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ name, email: from, message: msg, _subject: `Portfolio: ${name}` }),
      signal: ctl.signal,
    }).then((r) => {
      clearTimeout(timer); finish();
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      resultLead.textContent = `Message sent. I’ll reply to ${from}.`;
      $('.result-actions', result).hidden = true;
      $('label[for="draft"]', result).hidden = draft.hidden = $('.result-to', result).hidden = true;
      result.hidden = false;
      result.focus();
      form.reset();
      msgCount.textContent = `0 / ${msgField.maxLength}`;
    }).catch(() => {
      clearTimeout(timer); finish();
      showDraft(subject, 'It couldn’t be sent from here. Your draft is below. Choose another way to send it:');
    });
  });
  copyMsg.addEventListener('click', () => {
    const lbl = $('span', copyMsg);
    copyText(composed, draft).then((ok) => {
      lbl.textContent = ok ? 'Copied' : 'Copy failed, text selected';
      copyStatus.textContent = ok ? 'Message copied.' : 'Message selected. Press Ctrl+C or Cmd+C to copy.';
      clearTimeout(copyMsgT);
      copyMsgT = setTimeout(() => { lbl.textContent = 'Copy message'; }, 2000);
    });
  });

  // Footer: replay the cover choreography (never automatic)
  $('#replay-cover').addEventListener('click', () => {
    if (!isFull()) return;
    if (window.scrollY < 40) { replayCover(); return; }
    pendingReplay = true;
    navigateTo('#cover');
  });

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */
  syncFx();
  safe('reveals', setupReveals);
  safe('particles', () => { sizeCanvas(); drawParticles(0); });
  safe('strand', layoutStrand);
  safe('deck', syncDeck);
  measureScroll();
  startLoops();
  if (isFull()) scheduleGlitch(1050);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { safe('strand', layoutStrand); measureScroll(); });
  safe('deep link', () => {
    const k = new URLSearchParams(location.search).get('project');
    if (!k || !document.getElementById(`tpl-${k}`)) return;
    openProject(k, { push: false });
    // a #fragment in the link scrolls after this and blurs the dialog; put focus back
    window.addEventListener('load', () => {
      if (modal.open && !modal.contains(document.activeElement)) $('.modal-close', modal).focus({ preventScroll: true });
    }, { once: true });
  });
  // The page height changes with filters, tab swaps and the form; keep the progress strip honest.
  if ('ResizeObserver' in window) {
    let roT = 0;
    new ResizeObserver(() => { cancelAnimationFrame(roT); roT = requestAnimationFrame(measureScroll); }).observe(document.body);
  }
  // Loops in the contact portal and the constellation pause while off screen.
  if ('IntersectionObserver' in window) {
    const offIO = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-offscreen', !e.isIntersecting)));
    $$('.contact-portal, #constellation').forEach((el) => offIO.observe(el));
  }

  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      safe('particles', () => { sizeCanvas(); drawParticles(0); });
      safe('strand', layoutStrand);
      safe('deck', resyncDeck);
      measureScroll();
    }, 150);
  });
})();
