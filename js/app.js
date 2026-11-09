/* ============ App shell + router ============ */
const PRODUCT_LABELS = {h2o2:'Hydrogen Peroxide',urea:'Urea',np:'NP / Agri',nitric:'Nitric Acid',ammonia:'Ammonia',can:'CAN',ou:'Utilities & Off-Gas'};

const state = {route:'urea', tab:'dashboard', period:'Daily', dateOffset:0};
const COLLAPSED_GROUPS = new Set();
function toggleGroup(name){ COLLAPSED_GROUPS.has(name)?COLLAPSED_GROUPS.delete(name):COLLAPSED_GROUPS.add(name); renderSidebar(); if(window.lucide)lucide.createIcons(); }

/* ---------- Navigation (Rail + Panel) ---------- */
const RAIL_GROUPS = [
  { id: 'site', label: 'Overview', icon: 'layout-dashboard', type: 'route' },
  { id: 'Plant Streams', label: 'Plant Streams', icon: 'factory', type: 'group' },
  { id: 'Quality & Compliance', label: 'Quality & Compliance', icon: 'clipboard-check', type: 'group' },
  { id: 'Inventory & Instruments', label: 'Inventory & Instruments', icon: 'box', type: 'group' },
  { id: 'Operations', label: 'Operations', icon: 'calendar-days', type: 'group' },
  { id: 'Administration', label: 'Administration', icon: 'settings', type: 'group' }
];

function renderNavigation() {
  const railEl = document.getElementById('rail-items');
  if(railEl) {
    let rHtml = '';
    RAIL_GROUPS.forEach(g => {
      const active = (g.type === 'route' && state.route === g.id) || (g.type === 'group' && state.activeGroup === g.id);
      rHtml += `<div class="rail-item ${active?'active':''}" onclick="setGroup('${g.id}', '${g.type}')" title="${g.label}">
        <i data-lucide="${g.icon}"></i>
      </div>`;
    });
    railEl.innerHTML = rHtml;
  }

  const panelEl = document.getElementById('module-panel');
  if(!panelEl) return;
  if(state.activeGroup === 'site' || !state.activeGroup) {
    document.body.classList.add('module-panel-collapsed');
    panelEl.innerHTML = '';
  } else {
    document.body.classList.remove('module-panel-collapsed');
    let pHtml = `<div class="nav-section" style="padding-top:16px;font-size:11px;color:var(--brand);margin-bottom:8px">${state.activeGroup}</div>`;
    
    let inGroup = false;
    DATA.nav.forEach(n => {
      if(n.header) {
        inGroup = (n.header === state.activeGroup);
        return;
      }
      if(inGroup) {
        if(n.subhead) { pHtml += `<div class="nav-subhead" style="margin-top:12px">${n.subhead}</div>`; return; }
        const active = (state.route===n.id) ? 'active' : '';
        pHtml += `<div class="nav-item ${active}" onclick="go('${n.id}')" title="${n.label}">
          <i data-lucide="${n.icon}"></i><span>${n.label}</span>
          ${n.expand?'<i data-lucide="chevron-right" class="chev"></i>':''}
        </div>`;
      }
    });
    panelEl.innerHTML = pHtml;
  }
}

function setGroup(id, type) {
  if (type === 'route') {
    state.activeGroup = null;
    go(id);
  } else {
    state.activeGroup = id;
    
    // Auto-select the first route in this group
    let firstRoute = null;
    let inGroup = false;
    for(let n of DATA.nav) {
      if(n.header) {
        if(inGroup) break;
        if(n.header === id) inGroup = true;
      } else if(inGroup && n.id) {
        firstRoute = n.id;
        break;
      }
    }
    
    if (firstRoute && state.route !== firstRoute) {
      go(firstRoute);
    } else {
      renderNavigation();
    }
    if(window.lucide) lucide.createIcons();
  }
}

/* ---------- Module sub-tabs (Dashboard | Lab-01 | ... ) ---------- */
function subtabsBar(){
  return `<div class="subtabs">${DATA.subtabs.map(t=>{
    const active = state.tab===t.id?'active':'';
    return `<div class="subtab ${active}" onclick="setTab('${t.id}')"><i data-lucide="${t.icon}"></i>${t.label}</div>`;
  }).join('')}</div>`;
}

/* ---------- KPI helper ---------- */
function kpiRow(kpis, cols, scale){
  return `<div class="kpi-row" style="grid-template-columns:repeat(${cols||kpis.length},minmax(0,1fr))">`+
    kpis.map(k=>`<div class="kpi">
      <div class="k-top"><span>${k.l}</span><i data-lucide="${k.i}"></i></div>
      <div class="k-val">${scale?scaleNum(k.v):k.v}</div>
      ${k.s?`<div class="k-sub">${k.s}</div>`:''}
    </div>`).join('')+`</div>`;
}
function tblToolbar(title, right){
  return `<div class="tbl-toolbar">
    <i data-lucide="list" class="icon-sq" style="border:none"></i>
    <i data-lucide="columns-3" class="icon-sq" style="border:none"></i>
    <i data-lucide="filter" class="icon-sq" style="border:none"></i>
    <div class="mini-search"><i data-lucide="search" style="width:13px"></i><input placeholder="Search..."></div>
    <div class="tt-title">${title}</div>
    ${right||''}
  </div>`;
}

/* ---------- Router ---------- */
function go(route){
  state.route = route;
  if(route === 'site') {
    state.activeGroup = null;
  } else {
    let currentGroup = null;
    for(let n of DATA.nav) {
      if(n.header) currentGroup = n.header;
      else if(n.id === route) { state.activeGroup = currentGroup; break; }
    }
  }
  if(DATA.nav.find(n=>n.id===route&&n.product)) state.tab='dashboard';
  render();
}
function setTab(tab){ state.tab = tab; render(); }

function crumbFor(){
  const c = document.getElementById('crumb-page');
  if(!c) return;
  const n = DATA.nav.find(x=>x.id===state.route);
  let txt = n?n.label:'Overview';
  if(n&&n.product){
    const tab = DATA.subtabs.find(t=>t.id===state.tab);
    txt = `${PRODUCT_LABELS[state.route]} › ${tab?tab.label:'Dashboard'}`;
  }
  c.textContent = txt;
}

let LAST_VIEW='';
function render(){
  stopLive();
  renderNavigation();
  crumbFor();
  const c = document.getElementById('content');
  if(!c) return;
  const r = state.route;

  if(DATA.nav.find(n=>n.id===r&&n.product)){
    let inner='';
    if(state.tab==='dashboard') inner = screenDashboard();
    else if(state.tab==='labsheet') inner = screenLabsheet();
    else if(state.tab==='wpp') inner = screenRelease();
    else if(state.tab==='quality') inner = screenQuality();
    else if(state.tab==='coa') inner = screenCoa();
    else if(state.tab==='special') inner = screenSpecial();
    else inner = screenPlaceholder(DATA.subtabs.find(t=>t.id===state.tab).label);
    c.innerHTML = subtabsBar()+`<div style="height:6px"></div>`+inner;
  }
  else if(r==='site')      c.innerHTML = screenSite();
  else if(r==='iso')       c.innerHTML = screenISO();
  else if(r==='docs')      c.innerHTML = screenDocs();
  else if(r==='chemicals') c.innerHTML = screenChemicals();
  else if(r==='ai')        c.innerHTML = screenAI();
  else if(r==='users')     c.innerHTML = screenUsers();
  else if(r==='equip')     c.innerHTML = screenEquipment();
  else if(r==='shiftlog')  c.innerHTML = screenShiftLog();
  else if(r==='logs')      c.innerHTML = screenActivity();
  else if(r==='registry')  c.innerHTML = screenRegistry();
  else if(r==='specs')     c.innerHTML = screenSpecs();
  else if(r==='shift')     c.innerHTML = screenShiftMgmt();
  else if(r==='profile')   c.innerHTML = screenProfile();
  else                     c.innerHTML = screenGeneric(DATA.nav.find(n=>n.id===r).label);

  if(window.lucide) lucide.createIcons();
  if(typeof afterRender==='function') afterRender();
  const view=r+':'+(DATA.nav.find(n=>n.id===r&&n.product)?state.tab:'');
  if(view!==LAST_VIEW){ LAST_VIEW=view; c.scrollTop=0; animateEnter(); }
  try{ history.replaceState(null,'','#'+view.replace(/:$/,'')); }catch(e){}
  updateBadge();
  persistSoon();
}

/* fallback for any route without a dedicated screen */
function screenPlaceholder(name){
  return `<div class="card card-pad" style="text-align:center;padding:60px">
    <div style="font-size:16px;font-weight:600;color:var(--ink);margin-bottom:6px">${name}</div>
    <div style="color:var(--muted2)">No records yet.</div>
  </div>`;
}
function screenGeneric(name){
  return `<div class="pageicon">${name}</div>
    <div class="card card-pad" style="text-align:center;padding:60px">
    <div style="font-size:15px;font-weight:600;color:var(--ink);margin-bottom:6px">${name}</div>
    <div style="color:var(--muted2)">No records yet.</div>
  </div>`;
}

/* run after each render to (re)build charts for the active screen */
function afterRender(){
  if(DATA.nav.find(n=>n.id===state.route&&n.product) && state.tab==='dashboard') dashboardCharts();
  else if(state.route==='site') siteCharts();
  else if(state.route==='iso') {/* css bars, no chart.js */}
  else if(DATA.nav.find(n=>n.id===state.route&&n.product) && state.tab==='quality') qualityCharts();
  else if(DATA.nav.find(n=>n.id===state.route&&n.product) && state.tab==='labsheet') labAfter();
  if(state.route==='ai') scrollChat();
}

/* ============ Topbar interactivity ============ */
function scaleNum(v){
  const mul=DATA.periodMul[state.period]||1;
  if(typeof v!=='string') return v;
  if(v.includes('%')||v==='—') return v;               // rates/blank untouched
  const n=parseFloat(v.replace(/,/g,''));
  if(isNaN(n)) return v;
  return Math.round(n*mul).toLocaleString();
}
function setPeriod(p, btn){
  state.period=p;
  document.querySelectorAll('#period-seg button').forEach(x=>x.classList.remove('active'));
  if(btn)btn.classList.add('active');
  render();
  toast('Showing '+({Daily:'daily',MTD:'month-to-date',QTD:'quarter-to-date',YTD:'year-to-date'}[p])+' figures','info');
}
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function shiftDate(d){
  state.dateOffset+=d;
  const base=new Date(2026,4,16,6,0), end=new Date(2026,4,18,17,15);
  base.setDate(base.getDate()+state.dateOffset); end.setDate(end.getDate()+state.dateOffset);
  const fmt=(dt,t)=>`${String(dt.getMonth()+1).padStart(2,'0')}/${String(dt.getDate()).padStart(2,'0')}/${dt.getFullYear()} ${t}`;
  const s = document.getElementById('start-date'); if(s) s.textContent=fmt(base,'06:00 AM');
  const e = document.getElementById('end-date'); if(e) e.textContent=fmt(end,'05:15 PM');
  toast('Date range updated','info');
  render();
}

function initPanelResize(){
  const rz = document.getElementById('module-panel-resizer');
  if(!rz) return;
  let dragging=false;
  const MIN=180, MAX=340;
  const onMove=e=>{
    if(!dragging) return;
    let w = Math.max(MIN, Math.min(MAX, e.clientX - 64)); // subtract rail width
    document.documentElement.style.setProperty('--module-panel-w', w+'px');
  };
  const onUp=()=>{ if(!dragging)return; dragging=false; document.body.classList.remove('resizing');
    document.removeEventListener('mousemove',onMove); document.removeEventListener('mouseup',onUp); };
  rz.addEventListener('mousedown', e=>{
    dragging=true; document.body.classList.add('resizing');
    document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp);
    e.preventDefault();
  });
  rz.addEventListener('dblclick', ()=>document.documentElement.style.removeProperty('--module-panel-w'));
}
function toggleTheme(){
  document.body.classList.toggle('dark');
  const dark=document.body.classList.contains('dark');
  PREFS.dark=dark; savePrefs();
  const ic=document.getElementById('theme-ic'); if(ic) ic.setAttribute('data-lucide',dark?'sun':'moon');
  if(window.lucide)lucide.createIcons();
  // recolor charts
  Chart.defaults.color = dark?'#8a95a3':'#8a93a0';
  afterRender();
}

document.addEventListener('DOMContentLoaded', ()=>{
  // deep-link: #route or #route:tab
  const h = location.hash.replace('#','');
  if(h){ const [r,t]=h.split(':'); if(DATA.nav.find(n=>n.id===r)) state.route=r; if(t&&DATA.subtabs.find(x=>x.id===t)) state.tab=t; }
  if(state.route!=='site'){ for(const n of DATA.nav){ if(n.header) state._g=n.header; else if(n.id===state.route){ state.activeGroup=state._g; break; } } }
  initPanelResize();
  render();
  updateIdentity();
  if(!SESSION) renderLogin();
  const s=document.getElementById('global-search');
  if(s){ s.setAttribute('readonly',''); s.placeholder='Search everything…  Ctrl K'; s.addEventListener('focus',()=>{ s.blur(); openPalette(); }); s.addEventListener('click',()=>openPalette()); }
});