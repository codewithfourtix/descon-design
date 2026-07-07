/* ============================================================
   Microsoft 365 integrations (front-end demo / mock)
   ------------------------------------------------------------
   Descon runs on Microsoft 365, so the essential Microsoft
   services are surfaced here, each mapped to the module it
   powers. UI-only — nothing actually connects.
   Logos are simplified brand-coloured inline SVGs.
   ============================================================ */

const MS_INTEGRATIONS = [
  {id:'outlook',    name:'Microsoft Outlook', cat:'Reports',   desc:'Emails generated reports to distribution lists', status:'connected', manage:true},
  {id:'entra',      name:'Microsoft Entra ID', cat:'Identity', desc:'Single sign-on (SSO) & MFA for all lab users',   status:'connected'},
  {id:'sharepoint', name:'SharePoint',        cat:'Documents', desc:'Controlled storage & versioning for SOPs',       status:'connected'},
  {id:'teams',      name:'Microsoft Teams',   cat:'Alerts',    desc:'Instant alerts for OOS, CAPA & calibration due', status:'connected'},
];

/* ---- brand logos (simplified, colour-accurate) ---- */
function msLogo(id, size){
  size = size || 30;
  const s = `width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"`;
  switch(id){
    case 'outlook': return outlookLogoSVG(size);
    case 'entra': return `<svg ${s} aria-label="Microsoft Entra">
      <rect x="5" y="5" width="17" height="17" fill="#F25022"/>
      <rect x="26" y="5" width="17" height="17" fill="#7FBA00"/>
      <rect x="5" y="26" width="17" height="17" fill="#00A4EF"/>
      <rect x="26" y="26" width="17" height="17" fill="#FFB900"/></svg>`;
    case 'teams': return `<svg ${s} aria-label="Microsoft Teams">
      <rect x="5" y="5" width="38" height="38" rx="9" fill="#5B5FC7"/>
      <circle cx="32.5" cy="15.5" r="5.5" fill="#fff" opacity=".92"/>
      <rect x="11" y="17" width="18" height="4.2" rx="1.2" fill="#fff"/>
      <rect x="18" y="17" width="4.2" height="15" rx="1.2" fill="#fff"/></svg>`;
    case 'sharepoint': return `<svg ${s} aria-label="SharePoint">
      <rect x="5" y="5" width="38" height="38" rx="9" fill="#037B78"/>
      <circle cx="18.5" cy="17.5" r="5.6" fill="none" stroke="#fff" stroke-width="2.6"/>
      <circle cx="30.5" cy="27" r="6.6" fill="none" stroke="#fff" stroke-width="2.6"/>
      <circle cx="16.5" cy="31" r="4.4" fill="#fff"/>
      <path d="M22.4 20.6 26 24" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>`;
    case 'onedrive': return `<svg ${s} aria-label="OneDrive">
      <path d="M28 15a9 9 0 0 0-8.3 5.6A7.5 7.5 0 0 0 15 34h5l6-14a9 9 0 0 0 2-5Z" fill="#28A8EA"/>
      <path d="M15 34h23a6 6 0 0 0 .6-11.9A8.5 8.5 0 0 0 24.2 17 7.5 7.5 0 0 0 15 34Z" fill="#0F78D4"/></svg>`;
    case 'excel': return `<svg ${s} aria-label="Microsoft Excel">
      <rect x="6" y="6" width="36" height="36" rx="8" fill="#107C41"/>
      <path d="M17 16 31 32 M31 16 17 32" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/></svg>`;
    case 'powerbi': return `<svg ${s} aria-label="Power BI">
      <rect x="6" y="6" width="36" height="36" rx="8" fill="#F2C811"/>
      <rect x="12.5" y="27" width="5.5" height="9"  rx="1.2" fill="#fff"/>
      <rect x="21.25" y="21" width="5.5" height="15" rx="1.2" fill="#fff"/>
      <rect x="30" y="14" width="5.5" height="22" rx="1.2" fill="#fff"/></svg>`;
    default: return `<i data-lucide="plug"></i>`;
  }
}

/* ---- the Integrations section on the Settings screen ---- */
function renderIntegrations(){
  const connected = MS_INTEGRATIONS.filter(a=>a.status==='connected').length;
  const cards = MS_INTEGRATIONS.map(a=>{
    const badge = a.status==='connected'
        ? `<span class="badge b-green"><i data-lucide="check" style="width:11px"></i>Connected</span>`
      : a.status==='connecting'
        ? `<span class="badge b-amber"><i data-lucide="loader" style="width:11px"></i>Connecting…</span>`
        : `<span class="badge b-teal-o">Available</span>`;
    const action = a.status==='connected'
        ? `<button class="btn btn-out btn-sm" onclick="manageApp('${a.id}')"><i data-lucide="settings-2"></i>${a.manage?'Manage':'Configure'}</button>`
      : a.status==='connecting'
        ? `<button class="btn btn-out btn-sm" disabled>Connecting…</button>`
        : `<button class="btn btn-blue btn-sm" style="background:var(--brand);color:#fff" onclick="connectApp('${a.id}')"><i data-lucide="plug"></i>Connect</button>`;
    return `
    <div class="intg-card">
      <div class="intg-logo">${msLogo(a.id,30)}</div>
      <div class="intg-body">
        <div class="intg-name">${a.name}<span class="intg-cat">${a.cat}</span></div>
        <div class="intg-desc">${a.desc}</div>
      </div>
      <div class="intg-actions">${badge}${action}</div>
    </div>`;
  }).join('');

  return `
  <div class="card card-pad" style="margin-top:16px">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:2px">
      <div style="font-weight:600;color:#334">Integrations</div>
      <span class="badge b-blue" style="font-size:10px"><i data-lucide="shield-check" style="width:11px"></i>Microsoft 365 · Descon tenant · ${connected} connected</span>
    </div>
    <div style="color:var(--muted);font-size:12px;margin-bottom:14px">Microsoft services that power sign-in, reports, alerts, documents and analytics across Assure LIQS.</div>
    <div class="intg-grid">${cards}</div>
  </div>`;
}

/* ---- mock connect / manage handlers ---- */
function connectApp(id){
  const a=MS_INTEGRATIONS.find(x=>x.id===id); if(!a) return;
  a.status='connecting';
  if(typeof state!=='undefined' && state.route==='profile') render();
  toast('Connecting to '+a.name+' (Descon tenant)…','info');
  setTimeout(()=>{
    a.status='connected';
    if(typeof state!=='undefined' && state.route==='profile') render();
    toast(a.name+' connected','ok');
  }, 1000);
}
function disconnectApp(id){
  const a=MS_INTEGRATIONS.find(x=>x.id===id); if(!a) return;
  a.status='available';
  if(typeof state!=='undefined' && state.route==='profile') render();
  toast(a.name+' disconnected','info');
}
function manageApp(id){
  const a=MS_INTEGRATIONS.find(x=>x.id===id); if(!a) return;
  if(a.id==='outlook'){ manageOutlook(); return; }
  const acct=(typeof OUTLOOK!=='undefined')?OUTLOOK.account.email:'demo.user@descon.com';
  openModal({title:a.name, body:`
    <div class="ol-int" style="margin-bottom:14px">
      <div class="ol-logo">${msLogo(a.id,30)}</div>
      <div style="flex:1">
        <div style="font-weight:600;color:var(--ink);font-size:13px">${a.name}</div>
        <div style="font-size:11.5px;color:var(--muted)">${a.desc}</div>
      </div>
      <span class="badge b-green"><i data-lucide="check" style="width:11px"></i>Connected</span>
    </div>
    <div class="kv"><span>Signed in as</span><span>${acct}</span></div>
    <div class="kv"><span>Tenant</span><span>Descon (Microsoft 365)</span></div>
    <div class="kv" style="border:none"><span>Powers</span><span>${a.cat}</span></div>
    <div class="form-row" style="display:flex;align-items:center;gap:10px;margin-top:12px"><input type="checkbox" checked style="width:auto"> <label style="margin:0">Enabled for ${a.cat.toLowerCase()}</label></div>
    <div class="form-row" style="display:flex;align-items:center;gap:10px"><input type="checkbox" checked style="width:auto"> <label style="margin:0">Use Descon single sign-on</label></div>`,
    actions:[
      {label:'Disconnect',cls:'btn-out',fn:`closeModal();disconnectApp('${a.id}')`},
      {label:'Done',cls:'btn-green',icon:'check',fn:'closeModal()'},
    ]});
  if(window.lucide) lucide.createIcons();
}
