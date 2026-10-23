// ==UserScript==
// @name         Brite Contact Center Wallboard (Hali)
// @namespace    brite-noc
// @version      0.1.0
// @description  Full-screen contact-center wallboard overlay for RingCentral Contact Center (NICE CXone) My Dashboard, styled with the Hali design language.
// @match        https://*.nice-incontact.com/mydashboard*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  /* ======================================================================
   * CONFIG – everything you are likely to tweak lives here
   * ==================================================================== */
  const CONFIG = {
    // 'first-last-initial' -> "Nathan P." | 'initials' -> "NP" | 'full' -> "Nathan Pierce"
    nameMode: 'first-last-initial',

    // Only show these TeamNo values (empty = every team). Press D to see the TeamNo values in your data.
    teamNos: [],

    // Which agents count as "logged in": LogState values. Press D to see the distribution.
    loggedInLogStates: [1],

    // Agent is "on a contact" when Working=1. Outbound if OutboundSkill > 0, otherwise inbound.
    // Contact states: 4 = waiting in queue (per observed data). Add more if your tenant differs.
    queueWaitingStates: [4],

    // Callback entry states
    callbackQueuedStates: [],       // still waiting to be called back
    callbackDoneStates: [18],       // EndContact = completed
    callbackFailedStates: [],       // fill in once you see a failed one in debug

    // Calls waiting longer than this (seconds) turn amber / red
    queueWarnSec: 60,
    queueAlertSec: 180,

    // Time in state (seconds) before an agent row is highlighted
    stateWarnSec: { 'Unavailable': 900, 'Available': 1800, 'ACW': 300 },

    scroll: { pxPerSecond: 12, topPauseMs: 1200, bottomPauseMs: 1800, resetStepPx: 10 },
  };

  const LOGO = 'data:image/png;base64,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';

  /* ======================================================================
   * Helpers
   * ==================================================================== */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
  const C = {
    brand: '#6CD4F0', success: '#7EE2B8', warning: '#F5C96B', danger: '#F58A80',
    orange: '#F5A06B', info: '#7FA6F5', purple: '#B3A4FF', strong: '#2B3961',
  };
  const mmss = s => {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    const p = n => String(n).padStart(2, '0');
    return h ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
  };
  const initials = n => String(n).split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  function displayName(a) {
    const f = String(a.FirstName || '').trim(), l = String(a.LastName || '').trim();
    const full = (f + ' ' + l).trim() || String(a.AgentName || 'Unknown');
    if (CONFIG.nameMode === 'full') return full;
    if (CONFIG.nameMode === 'initials') return initials(full);
    return f && l ? `${f} ${l[0]}.` : full;
  }

  /* ======================================================================
   * State – kept in memory only; deltas are merged by key
   * ==================================================================== */
  const store = { agents: new Map(), contacts: new Map(), callbacks: new Map() };
  const seen = {};
  let syncedAt = null;

  const ENDPOINTS = {
    GetAllAgentEntryList:     { list: 'agentEntries',   key: r => r.AgentNo,                      map: 'agents' },
    GetContactQueueEntryList: { list: 'contactEntries', key: r => r.ContactID ?? r.MasterContactID, map: 'contacts' },
    GetCallBackEntryList:     { list: 'CallBackEntries', key: r => r.ContactId,                    map: 'callbacks' },
  };

  function onData(url, json) {
    const m = /EvolveCacheService\.svc\/rest\/(\w+)/i.exec(url);
    const ep = m && ENDPOINTS[m[1]];
    if (!ep || !json) return;
    const rows = json[ep.list] ?? json[ep.list.toLowerCase()];
    if (!Array.isArray(rows)) return;
    const deltas = json.deltasOnly ?? json.DeltasOnly;
    const target = store[ep.map];
    if (deltas === false) target.clear();
    for (const r of rows) { const k = ep.key(r); if (k != null) target.set(k, r); }
    seen[m[1]] = { rows: rows.length, total: target.size, deltas: !!deltas, keys: rows[0] ? Object.keys(rows[0]) : (seen[m[1]]?.keys || null) };
    syncedAt = new Date();
    schedule();
  }

  /* ======================================================================
   * Derived views
   * ==================================================================== */
  function agentState(a) {
    if (a.IsAcw) return { group: 'ACW', label: 'ACW: Wrap Up', color: C.orange };
    if (a.Working) {
      const out = a.OutboundSkill > 0;
      return { group: out ? 'Outbound' : 'Inbound', label: out ? 'Outbound Contact' : 'Inbound Contact', color: out ? C.warning : C.purple };
    }
    if (a.Available) return { group: 'Available', label: 'Available', color: C.success };
    const why = String(a.OutstateDescription || '').trim();
    return { group: 'Unavailable', label: why ? `Unavailable: ${why}` : 'Unavailable', color: C.danger };
  }

  function view() {
    const agents = [...store.agents.values()].filter(a =>
      !a.LoggedOff && CONFIG.loggedInLogStates.includes(a.LogState) &&
      (!CONFIG.teamNos.length || CONFIG.teamNos.includes(a.TeamNo)));
    const rows = agents.map(a => ({ name: displayName(a), dur: a.Duration, st: agentState(a) }));
    const counts = { Available: 0, Unavailable: 0, Inbound: 0, Outbound: 0, ACW: 0 };
    rows.forEach(r => { counts[r.st.group]++; });

    const waiting = [...store.contacts.values()].filter(c => CONFIG.queueWaitingStates.includes(c.CurrentContactState))
      .map(c => ({ dur: c.Duration, out: String(c.Direction) === '1', skill: c.SkillNo })).sort((a, b) => b.dur - a.dur);

    const cb = { queued: 0, done: 0, failed: 0 };
    for (const c of store.callbacks.values()) {
      const s = c.CurrentContactState;
      if (CONFIG.callbackFailedStates.includes(s)) cb.failed++;
      else if (CONFIG.callbackDoneStates.includes(s)) cb.done++;
      else if (CONFIG.callbackQueuedStates.length ? CONFIG.callbackQueuedStates.includes(s) : true) cb.queued++;
    }
    const order = { Unavailable: 0, ACW: 1, Inbound: 2, Outbound: 3, Available: 4 };
    rows.sort((a, b) => order[a.st.group] - order[b.st.group] || b.dur - a.dur);
    return { rows, counts, total: rows.length, waiting, cb };
  }

  /* ======================================================================
   * Rendering helpers
   * ==================================================================== */
  function donutHTML(segments, centre, label, size) {
    const total = segments.reduce((a, s) => a + s.n, 0);
    let bg = `${C.strong} 0 360deg`;
    if (total > 0) {
      let acc = 0;
      bg = segments.filter(s => s.n > 0).map(s => {
        const a = acc / total * 360; acc += s.n;
        return `${s.color} ${a.toFixed(2)}deg ${(acc / total * 360).toFixed(2)}deg`;
      }).join(',');
    }
    return `<div class="donut" style="--s:${size}px;background:conic-gradient(${bg})"><div class="c"><b>${centre}</b><span>${esc(label)}</span></div></div>`;
  }
  const stat = (label, n, color) => `<div class="stat"><b style="color:${color}">${n}</b><span>${esc(label)}</span></div>`;

  function stateCard(v) {
    const k = v.counts;
    const segs = [['Available', C.success], ['Unavailable', C.danger], ['Inbound', C.purple], ['Outbound', C.warning], ['ACW', C.orange]]
      .map(([g, color]) => ({ n: k[g], color }));
    return `<div class="eyebrow">Agent state</div><div class="flex">${donutHTML(segs, v.total, 'agents', 170)}
      <div class="stats">${stat('Available', k.Available, C.success)}${stat('Unavailable', k.Unavailable, C.danger)}${stat('Inbound', k.Inbound, C.purple)}${stat('Outbound', k.Outbound, C.warning)}${stat('Wrap-up', k.ACW, C.orange)}</div></div>`;
  }

  function callbackCard(v) {
    const { queued, done, failed } = v.cb;
    const segs = [{ n: queued, color: C.info }, { n: done, color: C.success }, { n: failed, color: C.danger }];
    return `<div class="eyebrow">Callback requests</div><div class="flex">${donutHTML(segs, queued + done + failed, 'today', 150)}
      <div class="stats">${stat('In queue', queued, C.info)}${stat('Successful', done, C.success)}${stat('Failed', failed, C.danger)}</div></div>`;
  }

  function queueCard(v) {
    const longest = v.waiting[0]?.dur ?? 0;
    const col = !v.waiting.length ? C.success : longest >= CONFIG.queueAlertSec ? C.danger : longest >= CONFIG.queueWarnSec ? C.warning : C.brand;
    const list = v.waiting.length
      ? `<div class="rows">${v.waiting.slice(0, 8).map((w, i) => {
          const c = w.dur >= CONFIG.queueAlertSec ? C.danger : w.dur >= CONFIG.queueWarnSec ? C.warning : C.brand;
          return `<div class="qrow"><span class="qn">${i + 1}</span><span class="qt">${w.out ? 'Outbound' : 'Inbound'}</span><b style="color:${c}">${mmss(w.dur)}</b></div>`;
        }).join('')}</div>`
      : `<div class="allclear"><svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>No calls waiting</div>`;
    return `<div class="eyebrow">Calls waiting in queue</div>
      <div class="qhead"><div class="big" style="color:${col}">${v.waiting.length}</div><div class="delta">${v.waiting.length ? 'Longest wait ' + mmss(longest) : 'Queue is clear'}</div></div>${list}`;
  }

  function teamRows(v) {
    if (!v.rows.length) return `<div class="empty">Waiting for data…</div>`;
    return v.rows.map(r => {
      const warn = CONFIG.stateWarnSec[r.st.group];
      const hot = warn && r.dur >= warn;
      return `<div class="trow${hot ? ' hot' : ''}">
        <div class="av">${esc(initials(r.name.replace('.', '')))}</div>
        <div class="nm"><span>${esc(r.name)}</span></div>
        <div class="state"><i style="background:${r.st.color}"></i>${esc(r.st.label)}</div>
        <div class="t">${mmss(r.dur)}</div></div>`;
    }).join('');
  }

  /* ======================================================================
   * Overlay
   * ==================================================================== */
  const CSS = `
    :host{all:initial}
    *{box-sizing:border-box;margin:0}
    .wrap{position:fixed;inset:0;background:#0F1522;overflow:hidden;
      --sunken:#0F1522;--default:#111827;--raised:#18213A;--overlay:#1F2A4D;--strong:#2B3961;
      --text:#F1F5FB;--subtle:#A2AABA;--subtlest:#8693A9;--brand:#6CD4F0;--brand-c:#233E4F;--on-brand:#111827;
      --success:#7EE2B8;--warning:#F5C96B;--danger:#F58A80;
      --shadow:0 1px 2px rgba(0,0,0,.28),0 8px 24px -10px rgba(0,0,0,.5);
      --f:"Poppins",system-ui,"Segoe UI",Arial,sans-serif;
      font-family:var(--f);font-variant-numeric:tabular-nums;color:var(--text)}
    .wrap.off{display:none}
    .stage{width:1920px;height:1080px;transform-origin:top left;position:absolute;left:0;top:0;
      background:radial-gradient(1200px 500px at 50% -10%,rgba(108,212,240,.14),transparent 70%),var(--default);
      padding:32px 40px;display:grid;grid-template-rows:auto 1fr;gap:24px}
    .hdr{display:flex;align-items:center;justify-content:space-between}
    .brand{display:flex;align-items:center;gap:20px}
    .brand img{height:72px}
    h1{font:700 34px/40px var(--f);letter-spacing:-.02em}
    .sub{font:500 13px var(--f);color:var(--subtle);letter-spacing:.02em}
    .pill{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 16px;border-radius:9999px;background:var(--raised);font:500 14px var(--f);color:var(--subtle)}
    .pill i{width:8px;height:8px;border-radius:50%;background:var(--success);box-shadow:0 0 10px var(--success)}
    .pill.stale i{background:var(--warning);box-shadow:0 0 10px var(--warning)}
    .grid{display:grid;gap:24px;min-height:0}
    .card{background:var(--raised);border-radius:28px;padding:24px;box-shadow:var(--shadow);min-height:0;display:flex;flex-direction:column;overflow:hidden}
    .card.hero{border-radius:32px;background:linear-gradient(160deg,var(--overlay),var(--raised))}
    .eyebrow{font:600 13px var(--f);letter-spacing:.12em;text-transform:uppercase;color:var(--subtle);margin-bottom:14px}
    .flex{display:flex;align-items:center;gap:32px;flex:1;min-height:0}
    .donut{width:var(--s);height:var(--s);border-radius:50%;display:grid;place-items:center;flex:none;position:relative}
    .donut::after{content:"";position:absolute;inset:24px;border-radius:50%;background:var(--raised)}
    .hero .donut::after{background:var(--overlay)}
    .c{position:relative;z-index:1;text-align:center}
    .c b{display:block;font:600 48px/1 var(--f)}
    .c span{font:500 12px var(--f);color:var(--subtle);letter-spacing:.08em;text-transform:uppercase}
    .stats{display:flex;flex:1;justify-content:space-around;gap:12px}
    .stat{display:grid;justify-items:center;gap:6px}
    .stat b{font:600 72px/1 var(--f);letter-spacing:-.02em}
    .stat span{font:500 15px var(--f);color:var(--subtle);letter-spacing:.06em;text-transform:uppercase}
    .big{font:600 96px/1 var(--f);letter-spacing:-.02em}
    .delta{font:500 16px var(--f);color:var(--subtlest)}
    .qhead{display:flex;align-items:baseline;gap:20px;margin-bottom:12px}
    .rows{display:grid;gap:8px;align-content:start;overflow:hidden;flex:1;min-height:0;scrollbar-width:none}
    .qrow{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:12px;height:48px;padding:0 18px;border-radius:8px;background:var(--overlay);font:600 18px var(--f)}
    .qn{color:var(--subtlest)} .qt{color:var(--subtle);font-weight:500} .qrow b{font:600 24px var(--f)}
    .allclear{flex:1;display:grid;place-items:center;align-content:center;gap:12px;color:var(--success);font:600 22px var(--f)}
    .allclear svg{width:56px;height:56px;fill:var(--success)}
    .trow{display:grid;grid-template-columns:44px 1.1fr 1.6fr auto;align-items:center;gap:16px;height:60px;padding:0 20px 0 12px;border-radius:8px;background:var(--overlay)}
    .trow.hot{box-shadow:inset 4px 0 0 var(--warning)}
    .trow.hot .t{color:var(--warning)}
    .av{width:36px;height:36px;border-radius:50%;background:var(--strong);display:grid;place-items:center;font:600 13px var(--f)}
    .nm{font:600 20px var(--f);min-width:0}
    .nm span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
    .state{display:flex;align-items:center;gap:12px;font:500 18px var(--f);color:var(--subtle);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .state i{width:12px;height:12px;border-radius:50%;flex:none}
    .t{font:600 24px var(--f)}
    .empty{color:var(--subtlest);font:500 16px var(--f);padding:12px}
    kbd,code{font:500 14px var(--f);background:var(--raised);padding:1px 6px;border-radius:4px;color:var(--text)}
    .hint{position:absolute;right:14px;bottom:8px;font:500 11px var(--f);color:var(--subtlest);opacity:.6}
    .debug{position:absolute;inset:40px;z-index:10;background:rgba(15,21,34,.97);border-radius:28px;padding:28px;overflow:auto;box-shadow:0 16px 40px rgba(0,0,0,.6);font:500 14px var(--f);display:none}
    .debug.on{display:block}
    .debug h2{font:700 22px var(--f);margin-bottom:12px}
    .debug table{border-collapse:collapse;width:100%;margin-bottom:16px}
    .debug td,.debug th{text-align:left;padding:6px 10px;border-bottom:1px solid #2B3961;vertical-align:top}
    .debug th{color:var(--subtle)}
  `;

  let ui = null, debugOpen = false, queued = false;

  function build() {
    const host = document.createElement('div');
    Object.assign(host.style, { position: 'fixed', inset: '0', zIndex: '2147483647' });
    document.documentElement.appendChild(host);

    const root = host.attachShadow({ mode: 'open' });
    // Fonts must be requested from the document: @font-face inside a shadow root is ignored
    if (!document.getElementById('noc-poppins')) {
      const font = document.createElement('link');
      font.id = 'noc-poppins'; font.rel = 'stylesheet';
      font.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
      document.head.appendChild(font);
    }
    const style = document.createElement('style');
    style.textContent = CSS;
    root.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.innerHTML = `
      <div class="stage" id="stage">
        <div class="hdr">
          <div class="brand"><img src="${LOGO}" alt="Brite">
            <div><h1>Contact Center</h1><div class="sub">Brite · RingCentral Contact Center live wallboard</div></div></div>
          <div class="pill" id="sync"><i></i><span>Waiting for data…</span></div>
        </div>
        <div class="grid" style="grid-template-columns:1fr 1.15fr;grid-template-rows:1fr .8fr 1.3fr">
          <div class="card hero" id="state"></div>
          <div class="card" id="team" style="grid-row:1 / span 3;grid-column:2"><div class="eyebrow">Team members</div><div class="rows" id="teamRows"></div></div>
          <div class="card" id="cb"></div>
          <div class="card" id="queue"></div>
        </div>
        <div class="hint"><kbd>D</kbd> data map · <kbd>O</kbd> show RingCentral page</div>
      </div>
      <div class="debug" id="debug"></div>`;
    root.appendChild(wrap);

    const $ = id => root.getElementById(id);
    const stage = $('stage');
    const fit = () => {
      const s = Math.min(innerWidth / 1920, innerHeight / 1080);
      stage.style.transform = `scale(${s})`;
      stage.style.left = `${(innerWidth - 1920 * s) / 2}px`;
      stage.style.top = `${(innerHeight - 1080 * s) / 2}px`;
    };
    addEventListener('resize', fit); fit();

    addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea|select/i.test(e.target?.tagName || '')) return;
      const k = e.key.toLowerCase();
      if (k === 'd') { debugOpen = !debugOpen; $('debug').classList.toggle('on', debugOpen); render(); }
      if (k === 'o') wrap.classList.toggle('off');
    });

    const el = { state: $('state'), cb: $('cb'), queue: $('queue'), teamRows: $('teamRows'), sync: $('sync'), debug: $('debug') };
    startScroller(el.teamRows);
    return el;
  }

  // Replace content but keep the scroll position so auto-scroll doesn't jump on every refresh
  const setHTML = (node, html) => { if (node.__html === html) return; const t = node.scrollTop; node.innerHTML = html; node.__html = html; node.scrollTop = t; };

  function render() {
    if (!ui) return;
    const v = view();
    setHTML(ui.state, stateCard(v));
    setHTML(ui.cb, callbackCard(v));
    setHTML(ui.queue, queueCard(v));
    setHTML(ui.teamRows, teamRows(v));
    if (syncedAt) {
      ui.sync.querySelector('span').textContent = `Synced ${syncedAt.toLocaleTimeString()}`;
      ui.sync.classList.toggle('stale', Date.now() - syncedAt > 2 * 60000);
    }
    if (debugOpen) renderDebug();
  }

  const tally = (list, f) => { const o = {}; list.forEach(x => { const k = String(f(x)); o[k] = (o[k] || 0) + 1; }); return JSON.stringify(o); };
  function renderDebug() {
    const A = [...store.agents.values()], Q = [...store.contacts.values()], B = [...store.callbacks.values()];
    const eps = Object.entries(seen).map(([n, s]) => `<tr><td>${esc(n)}</td><td>${s.total} held · last batch ${s.rows} (${s.deltas ? 'delta' : 'full'})</td><td>${esc((s.keys || []).join(', '))}</td></tr>`).join('');
    ui.debug.innerHTML = `<h2>Data seen (press D to close)</h2>
      <table><tr><th>Endpoint</th><th>Rows</th><th>Fields</th></tr>${eps || '<tr><td colspan=3>Nothing captured yet.</td></tr>'}</table>
      <table><tr><th>Field</th><th>Distribution (value: count)</th></tr>
        <tr><td>Agents · TeamNo</td><td>${esc(tally(A, a => a.TeamNo))}</td></tr>
        <tr><td>Agents · LogState</td><td>${esc(tally(A, a => a.LogState))}</td></tr>
        <tr><td>Agents · CurrentState</td><td>${esc(tally(A, a => a.CurrentState))}</td></tr>
        <tr><td>Agents · Available / Working / IsAcw</td><td>${esc(tally(A, a => `${a.Available}/${a.Working}/${a.IsAcw}`))}</td></tr>
        <tr><td>Agents · OutstateDescription</td><td>${esc(tally(A, a => a.OutstateDescription || '(none)'))}</td></tr>
        <tr><td>Contacts · CurrentContactState</td><td>${esc(tally(Q, c => c.CurrentContactState))}</td></tr>
        <tr><td>Contacts · Direction</td><td>${esc(tally(Q, c => c.Direction))}</td></tr>
        <tr><td>Callbacks · CurrentContactState (StateDescription)</td><td>${esc(tally(B, c => `${c.CurrentContactState} (${c.StateDescription})`))}</td></tr></table>
      <p style="color:#A2AABA">Agent names are never shown here. Edit <code>CONFIG</code> in the script to remap states.</p>`;
  }

  function schedule() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; render(); }); }
  // Durations tick between polls, so repaint once a second
  setInterval(() => { if (ui) render(); }, 1000);

  /* ======================================================================
   * Auto-scroll (one loop per list, started once)
   * ==================================================================== */
  function startScroller(el) {
    const S = CONFIG.scroll;
    let last = 0, pauseUntil = performance.now() + S.topPauseMs, returning = false;
    const tick = t => {
      const max = el.scrollHeight - el.clientHeight;
      if (max <= 2) { el.scrollTop = 0; last = t; return requestAnimationFrame(tick); }
      const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
      if (t >= pauseUntil) {
        if (!returning) {
          el.scrollTop += S.pxPerSecond * dt;
          if (el.scrollTop >= max - 1) { returning = true; pauseUntil = t + S.bottomPauseMs; }
        } else {
          el.scrollTop = Math.max(0, el.scrollTop - S.resetStepPx);
          if (el.scrollTop <= 0) { returning = false; pauseUntil = t + S.topPauseMs; }
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ======================================================================
   * Network interception (fetch + XHR) – reads the page's own responses
   * ==================================================================== */
  const wanted = url => typeof url === 'string' && /EvolveCacheService\.svc\/rest\/(GetAllAgentEntryList|GetContactQueueEntryList|GetCallBackEntryList)/i.test(url);

  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const a = args[0];
      const url = typeof a === 'string' ? a : (a && a.url) || String(a || '');
      if (wanted(url)) res.clone().json().then(d => onData(url, d)).catch(() => {});
    } catch (_) {}
    return res;
  };

  const xOpen = XMLHttpRequest.prototype.open, xSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (m, u, ...r) { this.__nocUrl = String(u || ''); return xOpen.call(this, m, u, ...r); };
  XMLHttpRequest.prototype.send = function (...a) {
    if (wanted(this.__nocUrl)) {
      this.addEventListener('load', () => {
        try {
          const d = (this.responseType === '' || this.responseType === 'text') ? JSON.parse(this.responseText) : this.response;
          if (d && typeof d === 'object') onData(this.__nocUrl, d);
        } catch (_) {}
      });
    }
    return xSend.apply(this, a);
  };

  /* ======================================================================
   * Boot
   * ==================================================================== */
  const boot = () => { if (ui) return; if (!document.body) return requestAnimationFrame(boot); ui = build(); render(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
