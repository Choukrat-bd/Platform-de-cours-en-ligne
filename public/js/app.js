/* =====================================================================
   ChoukrApp Academie - Noyau JavaScript client
   Gestion de l'API (Fetch), de la session, de la navigation et des
   notifications. Utilisé par toutes les pages.
   ===================================================================== */
const API = {
  async request(path, { method = 'GET', body = null, isForm = false } = {}) {
    const opts = { method, headers: {}, credentials: 'same-origin' };
    if (body && !isForm) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    else if (body && isForm) { opts.body = body; }
    const res = await fetch('/api' + path, opts);
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) {
      const err = new Error((data && data.message) || 'Une erreur est survenue.');
      err.status = res.status; err.data = data; throw err;
    }
    return data;
  },
  get: (p) => API.request(p),
  post: (p, b, isForm = false) => API.request(p, { method: 'POST', body: b, isForm }),
  put: (p, b) => API.request(p, { method: 'PUT', body: b }),
  del: (p) => API.request(p, { method: 'DELETE' })
};

let CURRENT_USER = null;

async function loadUser() {
  try { CURRENT_USER = (await API.get('/auth/me')).user; } catch { CURRENT_USER = null; }
  return CURRENT_USER;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const qs = (sel, root = document) => root.querySelector(sel);
const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const fmtShort = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '');
const levelLabel = (l) => ({ Debutant: 'Débutant', Intermediaire: 'Intermédiaire', Avance: 'Avancé' }[l] || l);
const gradeLabel = (g) => ({ 'Tres Bien': 'Très Bien', 'Assez Bien': 'Assez Bien', Excellent: 'Excellent', Bien: 'Bien', Insuffisant: 'Insuffisant' }[g] || g);

/* ---------- Affiches des cours ---------- */
const COVERS = {
  code: '/img/code.jpg',
  web: '/img/web.jpg',
  data: '/img/data.jpg',
  math: '/img/math.jpg',
  design: '/img/design.jpg',
  business: '/img/business.jpg',
  books: '/img/books.jpg',
  default: '/img/default.jpg'
};

function coverFor(course) {
  const s = ((course.title || '') + ' ' + (course.category || '')).toLowerCase();
  if (/mysql|sql|base de donn|donn[ée]e|data|statist/.test(s)) return COVERS.data;
  if (/html|css|web|front|react|node|express|javascript|php|laravel|vue|angular/.test(s)) return COVERS.web;
  if (/algorithm|program|python|java\b|c\+\+|d[ée]veloppement logiciel|informatique|code/.test(s)) return COVERS.code;
  if (/math|calcul|g[ée]om[ée]trie|analyse|physique|chimie/.test(s)) return COVERS.math;
  if (/design|graphi|maquette|ux|ui|photo|cr[ée]ation|artist/.test(s)) return COVERS.design;
  if (/marketing|gestion|business|commerce|communication|entrepre|droit|[ée]conom|finance|management/.test(s)) return COVERS.business;
  if (/anglais|fran[çc]ais|langue|lettre|philosophie|histoire|g[ée]ographie|litt[ée]rature/.test(s)) return COVERS.books;
  return COVERS.default;
}

function coverTag(course) {
  const img = coverFor(course);
  const label = esc(course.category || 'Cours');
  return `<div class="course-thumb" style="background-image:url('${img}')"><span class="course-thumb-badge">${label}</span></div>`;
}

/* ---------- Graphiques SVG (sans librairie externe) ---------- */
function lineChart(points, opts = {}) {
  const w = opts.w || 580, h = opts.h || 230;
  const padL = 42, padR = 18, padT = 18, padB = 34;
  const iw = w - padL - padR, ih = h - padT - padB;
  if (!points || points.length === 0) {
    return `<div class="chart-empty">Aucune donnée pour le moment. Passez un quiz pour suivre votre évolution.</div>`;
  }
  const n = points.length;
  const X = (i) => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const Y = (v) => padT + ih - (Math.max(0, Math.min(100, v)) / 100) * ih;
  const grid = [0, 25, 50, 75, 100].map((g) =>
    `<line x1="${padL}" y1="${Y(g).toFixed(1)}" x2="${(w - 16).toFixed(1)}" y2="${Y(g).toFixed(1)}" class="chart-grid"/>
     <text x="${padL - 8}" y="${(Y(g) + 4).toFixed(1)}" class="chart-axis" text-anchor="end">${g}</text>`).join('');
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${X(n - 1).toFixed(1)} ${(padT + ih).toFixed(1)} L${X(0).toFixed(1)} ${(padT + ih).toFixed(1)} Z`;
  const dots = points.map((p, i) =>
    `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.value).toFixed(1)}" r="4.5" class="chart-dot"><title>${esc(p.label)} : ${p.value}/100</title></circle>`).join('');
  const step = Math.ceil(n / 7);
  const xlabels = points.map((p, i) =>
    (i % step === 0 || i === n - 1)
      ? `<text x="${X(i).toFixed(1)}" y="${(h - 12)}" class="chart-axis" text-anchor="middle">${esc(p.label)}</text>` : '').join('');
  return `<svg viewBox="0 0 ${w} ${h}" class="chart-svg" preserveAspectRatio="xMidYMid meet" role="img">
    <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(219,39,119,.40)"/><stop offset="100%" stop-color="rgba(219,39,119,0)"/>
    </linearGradient></defs>
    ${grid}
    <path d="${area}" fill="url(#areaGrad)"/>
    <path d="${line}" class="chart-line"/>
    ${dots}${xlabels}
  </svg>`;
}

function donutChart(segments, opts = {}) {
  const size = opts.size || 190, thick = opts.thick || 26;
  const r = (size - thick) / 2, c = size / 2;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return `<div class="chart-empty">Aucune donnée.</div>`;
  let offset = 0;
  const arcs = segments.filter((s) => s.value > 0).map((s) => {
    const len = (s.value / total) * C;
    const el = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thick}"
      stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}"
      transform="rotate(-90 ${c} ${c})"><title>${esc(s.label)} : ${s.value}</title></circle>`;
    offset += len;
    return el;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="chart-donut" role="img">${arcs}
    <text x="${c}" y="${c + 2}" text-anchor="middle" class="chart-donut-value">${total}</text>
    <text x="${c}" y="${c + 20}" text-anchor="middle" class="chart-donut-label">au total</text></svg>`;
}

function barChart(items) {
  if (!items.length) return `<div class="chart-empty">Aucune donnée.</div>`;
  return `<div class="bars">${items.map((i) => `
    <div class="bar-row">
      <span class="bar-label" title="${esc(i.label)}">${esc(i.label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(i.value, 3)}%">${i.value}%</div></div>
    </div>`).join('')}</div>`;
}

const legendHTML = (segments) =>
  `<div class="legend">${segments.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.label)} (${s.value})</span>`).join('')}</div>`;

function toast(message, type = 'info') {
  let box = qs('#toast');
  if (!box) { box = document.createElement('div'); box.id = 'toast'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast-item ' + type;
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.4s'; setTimeout(() => el.remove(), 400); }, 3500);
}

/* ---------- Barre de navigation + cloche de notifications ---------- */
async function renderNav() {
  const header = qs('#site-header');
  if (!header) return;
  const me = await loadUser();

  const here = location.pathname.replace(/\/$/, '') || '/index.html';
  const active = (p) => (here === p ? 'active' : '');

  let links = `<a href="/catalog.html" class="${active('/catalog.html')}">Catalogue</a>`;
  let actions = '';
  if (me) {
    links += `<a href="/dashboard.html" class="${active('/dashboard.html')}">Mon tableau de bord</a>`;
    links += `<a href="/certificats.html" class="${active('/certificats.html')}">Mes certificats</a>`;
    if (me.role === 'enseignant' || me.role === 'admin') {
      links += `<a href="/enseignant.html" class="${active('/enseignant.html')}">Espace enseignant</a>`;
    }
    const initials = `${(me.prenom || '?')[0] || ''}${(me.nom || '')[0] || ''}`.toUpperCase();
    actions = `
      <button id="btn-notif" class="icon-btn" title="Notifications" aria-label="Notifications">🔔<span id="notif-count" class="badge-notif hidden"></span></button>
      <span class="nav-user" title="${esc(me.prenom)} ${esc(me.nom)}">
        <span class="nav-avatar">${esc(initials)}</span>
        <span class="nav-user-text"><strong>${esc(me.prenom)} ${esc(me.nom)}</strong><small>${esc(me.role)}</small></span>
      </span>
      <button id="btn-logout" class="btn btn-light btn-sm">Déconnexion</button>`;
  } else {
    links += `<a href="/login.html" class="${active('/login.html')}">Connexion</a>`;
    actions = `<a href="/register.html" class="btn btn-light btn-sm">Créer un compte</a>`;
  }

  header.innerHTML = `
    <div class="container header-inner">
      <a class="logo" href="/index.html">
        <span class="logo-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="27" height="27">
            <path d="M24 8 L5 16 L24 24 L43 16 Z" fill="#fff"/>
            <path d="M14 20.5 L14 29 C14 32.3 18.5 34.6 24 34.6 C29.5 34.6 34 32.3 34 29 L34 20.5" fill="none" stroke="#fff" stroke-width="2.6"/>
            <path d="M43 16 L43 27" stroke="#f9a8d4" stroke-width="2.6" stroke-linecap="round"/>
            <circle cx="43" cy="28.6" r="2.4" fill="#f9a8d4"/>
          </svg>
        </span>
        <span class="logo-text">ChoukrApp<small>Academie</small></span>
      </a>
      <nav class="nav-links" id="nav-links">${links}</nav>
      <div class="nav-actions">${actions}</div>
    </div>
    <div id="notif-panel" class="notif-panel hidden"></div>`;

  const logout = qs('#btn-logout');
  if (logout) logout.addEventListener('click', async () => {
    await API.post('/auth/logout');
    toast('Vous êtes déconnecté.', 'success');
    setTimeout(() => (location.href = '/index.html'), 500);
  });

  const bell = qs('#btn-notif');
  if (bell) bell.addEventListener('click', toggleNotifications);

  if (me) refreshUnread();
}

async function refreshUnread() {
  try {
    const d = await API.get('/notifications');
    const badge = qs('#notif-count');
    if (!badge) return;
    if (d.unread > 0) { badge.textContent = d.unread; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
  } catch { /* ignore */ }
}

async function toggleNotifications() {
  const panel = qs('#notif-panel');
  if (!panel) return;
  if (!panel.classList.contains('hidden')) { panel.classList.add('hidden'); return; }

  panel.innerHTML = '<div class="card"><p class="muted">Chargement…</p></div>';
  panel.classList.remove('hidden');
  try {
    const { notifications, unread } = await API.get('/notifications');
    panel.innerHTML = `
      <div class="card" style="max-height:60vh;overflow:auto">
        <div class="flex between mb">
          <strong>Notifications ${unread ? `(${unread} non lues)` : ''}</strong>
          <button class="btn btn-sm btn-outline" id="read-all">Tout marquer lu</button>
        </div>
        ${notifications.length === 0 ? '<p class="muted">Aucune notification.</p>' :
          notifications.map((n) => `
            <div class="alert ${n.is_read ? 'alert-info' : 'alert-success'}" style="margin-bottom:8px">
              <small class="muted">${fmtShort(n.created_at)}</small><br>${esc(n.message)}
            </div>`).join('')}
      </div>`;

    const ra = qs('#read-all');
    if (ra) ra.addEventListener('click', async () => {
      await API.post('/notifications/read-all');
      toast('Notifications marquées comme lues.', 'success');
      panel.classList.add('hidden');
      refreshUnread();
    });
  } catch (e) {
    panel.innerHTML = `<div class="alert alert-info">${esc(e.message)}</div>`;
  }
}

function requireAuth() {
  if (!CURRENT_USER) { location.href = '/login.html?next=' + encodeURIComponent(location.pathname); return false; }
  return true;
}

document.addEventListener('DOMContentLoaded', renderNav);
