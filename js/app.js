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
function chartTools(){
  const tips={download:'Download PNG',circle:'Refresh','file':'Export data','file-down':'Export CSV','maximize-2':'Expand',wifi:'Live',maximize:'Fullscreen'};
  return `<div class="chart-tools">${['download','circle','file','file-down','maximize-2','wifi','maximize'].map(i=>`<i data-lucide="${i}" title="${tips[i]}" onclick="toast('${tips[i]} (demo)','info')"></i>`).join('')}</div>`;
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

function render(){
  renderNavigation();
  crumbFor();
  const c = document.getElementById('content');
  if(!c) return;
  const r = state.route;

  if(DATA.nav.find(n=>n.id===r&&n.product)){
    let inner='';
    if(state.tab==='dashboard') inner = screenDashboard();
    else if(state.tab==='labsheet') inner = screenLabsheet();
    else if(state.tab==='quality') inner = screenQuality();
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

  const blurredPages = ['specs', 'docs', 'equip', 'registry', 'shiftlog', 'shift'];
  if (blurredPages.includes(r)) {
    const contentHtml = c.innerHTML;
    c.innerHTML = `<div style="position:relative; height:100%;">
      <div style="filter:blur(6px); opacity:0.4; pointer-events:none; user-select:none; height:100%; overflow:hidden;">${contentHtml}</div>
      <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:10;">
        <div class="card" style="padding:24px 32px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.1); border-radius:12px; background:rgba(255,255,255,0.9); backdrop-filter:blur(4px);">
          <i data-lucide="lock" style="width:40px; height:40px; color:var(--brand); margin:0 auto 16px; display:block;"></i>
          <div style="font-size:18px; font-weight:700; color:var(--ink); margin-bottom:8px;">Demo Mode</div>
          <div style="color:var(--muted); font-size:13px; max-width:240px; margin:0 auto; line-height:1.5;">This module is locked in the current demo environment. The underlying functionality exists but is hidden for this presentation.</div>
        </div>
      </div>
    </div>`;
  }

  if(window.lucide) lucide.createIcons();
  if(typeof afterRender==='function') afterRender();
}

/* placeholder for un-shown tabs / menu items */
function screenPlaceholder(name){
  return `<div class="card card-pad" style="text-align:center;padding:60px">
    <div style="font-size:16px;font-weight:600;color:#334;margin-bottom:6px">${name}</div>
    <div style="color:#9aa3af">This module is available in the full Descon Assure build.</div>
  </div>`;
}
function screenGeneric(name){
  return `<div class="pageicon">${name}</div>
    <div class="card card-pad" style="text-align:center;padding:60px">
    <div style="font-size:15px;font-weight:600;color:#334;margin-bottom:6px">${name}</div>
    <div style="color:#9aa3af">Demo module — connect a data source to populate this screen.</div>
  </div>`;
}

/* run after each render to (re)build charts for the active screen */
function afterRender(){
  if(DATA.nav.find(n=>n.id===state.route&&n.product) && state.tab==='dashboard') dashboardCharts();
  else if(state.route==='site') siteCharts();
  else if(state.route==='iso') {/* css bars, no chart.js */}
  else if(DATA.nav.find(n=>n.id===state.route&&n.product) && state.tab==='quality') qualityCharts();
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
  document.getElementById('theme-ic').setAttribute('data-lucide',dark?'sun':'moon');
  if(window.lucide)lucide.createIcons();
  // recolor charts
  Chart.defaults.color = dark?'#8a95a3':'#8a93a0';
  afterRender();
}
function closeDropdowns(){document.querySelectorAll('.dropdown').forEach(d=>d.remove());}
document.addEventListener('click',e=>{
  if(!e.target.closest('.dropdown')&&!e.target.closest('.iconbtn'))closeDropdowns();
});
function toggleNotif(e){
  e.stopPropagation();
  if(document.querySelector('.dropdown:not(.dd-profile)')){closeDropdowns();return;}
  closeDropdowns();
  const dd=document.createElement('div');dd.className='dropdown';
  dd.innerHTML=`<div class="dd-head">Notifications <span style="font-size:11px;color:var(--teal);cursor:pointer" onclick="markAllRead()">Mark all read</span></div>
    ${DATA.notifications.map(n=>`<div class="dd-item">
      <div class="dd-ic" style="background:${n.color}1a;color:${n.color}"><i data-lucide="${n.icon}"></i></div>
      <div style="flex:1"><div class="t">${n.title}</div><div class="b">${n.body}</div><div class="tm">${n.time}</div></div></div>`).join('')}
    <div class="dd-foot" onclick="toast('Opening activity log','info');closeDropdowns();go('logs')">View all activity</div>`;
  document.body.appendChild(dd);
  if(window.lucide)lucide.createIcons();
}
function markAllRead(){document.querySelector('.badge-dot')?.remove();toast('All notifications marked read','ok');closeDropdowns();}
function toggleProfile(e){
  e.stopPropagation();
  if(document.querySelector('.dd-profile')){closeDropdowns();return;}
  closeDropdowns();
  const dd=document.createElement('div');dd.className='dropdown dd-profile';
  dd.innerHTML=`<div class="dd-head" style="border:none;padding-bottom:4px">demo user<br><span style="font-weight:400;font-size:10px;color:#9aa3af">demo.user@descon.com</span></div>
    <div class="dd-line" onclick="closeDropdowns();go('profile')"><i data-lucide="user-cog"></i>Profile Settings</div>
    <div class="dd-line" onclick="toggleTheme();closeDropdowns()"><i data-lucide="moon"></i>Toggle theme</div>
    <div class="dd-line" onclick="closeDropdowns();go('logs')"><i data-lucide="history"></i>Audit Trail</div>
    <div class="dd-line" style="color:#d64545;border-top:1px solid var(--line2)" onclick="doLogout()"><i data-lucide="log-out" style="color:#d64545"></i>Log out</div>`;
  document.body.appendChild(dd);
  if(window.lucide)lucide.createIcons();
}
function doLogout(){closeDropdowns();toast('Signing out… (demo)','info');}
function downloadCurrent(){
  const label=(DATA.nav.find(n=>n.id===state.route)||{}).label||'dashboard';
  toast('Preparing snapshot of "'+label+'"…','info');
  setTimeout(()=>toast('Screen export ready (demo)','ok'),900);
}
function globalSearch(q){
  if(!q.trim())return;
  const ql=q.toLowerCase();
  const hits=DATA.nav.filter(n=>n.label.toLowerCase().includes(ql));
  const chem=DATA.chem.rows.filter(r=>r[2].toLowerCase().includes(ql)).slice(0,5);
  const spec=DATA.special.rows.filter(r=>String(r[2]).toLowerCase().includes(ql)||String(r[3]).toLowerCase().includes(ql)).slice(0,5);
  openModal({title:`Search results for "${q}"`, wide:true, body:`
    <div style="font-size:12px">
      ${hits.length?`<div style="font-weight:600;margin:2px 0 6px">Modules</div>${hits.map(h=>`<div class="dd-line" style="border:1px solid var(--line2);border-radius:6px;margin-bottom:4px" onclick="closeModal();go('${h.id}')"><i data-lucide="${h.icon}"></i>${h.label}</div>`).join('')}`:''}
      ${chem.length?`<div style="font-weight:600;margin:10px 0 6px">Chemicals</div>${chem.map(c=>`<div class="kv"><span>${c[0]} · ${c[2]}</span><span>Bal ${c[7]}</span></div>`).join('')}`:''}
      ${spec.length?`<div style="font-weight:600;margin:10px 0 6px">Special Samples</div>${spec.map(s=>`<div class="kv"><span>${s[2]} · ${s[3]}</span><span>${s[6]}</span></div>`).join('')}`:''}
      ${(!hits.length&&!chem.length&&!spec.length)?'<div class="empty">No matches found.</div>':''}
    </div>`});
}

document.addEventListener('DOMContentLoaded', ()=>{
  // optional deep-link: #route or #route:tab (used for previews)
  const h = location.hash.replace('#','');
  if(h){ const [r,t]=h.split(':'); if(DATA.nav.find(n=>n.id===r)) state.route=r; if(t) state.tab=t; }
  initPanelResize();
  render();
});
