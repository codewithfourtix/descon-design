/* ============================================================
   Outlook Integration (front-end demo / mock)
   ------------------------------------------------------------
   When a report is generated anywhere in Assure LIQS, it can be
   emailed to a distribution list straight through Outlook.
   This module is UI-only — no mail is actually sent.
   ============================================================ */

const OUTLOOK = {
  connected: true,
  account: { name:'demo user', email:'demo.user@descon.com' },
  /* Named distribution lists. Recipients are seeded from DATA.users by role
     where possible, so the demo feels wired to the directory — then editable. */
  lists: [
    { id:'qc-lead',  name:'QC Leadership',         roles:['QC Manager','Lab Supervisor'] },
    { id:'iso',      name:'ISO / Audit Committee',  roles:['Auditor','QC Manager'] },
    { id:'analysts', name:'QC Analysts',           roles:['Senior Analyst','Lab Analyst'] },
    { id:'plant',    name:'Plant Managers',        static:[
        {name:'Plant Manager — Oxychem', email:'pm.oxychem@descon.com', role:'Plant Manager'},
        {name:'Plant Manager — Urea',    email:'pm.urea@descon.com',    role:'Plant Manager'},
        {name:'QA Head',                 email:'qa.head@descon.com',    role:'QA Head'},
      ] },
  ],
  /* Which distribution list each report type is emailed to (report routing). */
  reportTypes: [
    { key:'iso',   name:'ISO 17025 Audit Compliance', list:'iso' },
    { key:'coa',   name:'Certificate of Analysis (CoA)', list:'plant' },
    { key:'qoos',  name:'Quality & OOS Report',       list:'qc-lead' },
    { key:'audit', name:'Audit Trail Export',         list:'iso' },
    { key:'shift', name:'Shift Handover Summary',     list:'analysts' },
  ],
  /* Delivery preferences (mock). */
  prefs: {
    auto:true, attachPdf:true, bccMe:false, readReceipt:false,
    ccRecords:true, format:'PDF', digest:'Immediate',
    senderName:'Descon Assure LIQS',
  },
};

/* Materialise a list's members once (from roles / static seed), then edit in place. */
function ensureMembers(list){
  if(list.members) return list.members;
  if(list.static){ list.members = list.static.map(m=>({...m})); return list.members; }
  const users=(typeof DATA!=='undefined'&&DATA.users)?DATA.users:[];
  const seen=new Set(), out=[];
  for(const u of users){
    if(list.roles.includes(u.role) && !seen.has(u.email)){
      seen.add(u.email); out.push({name:u.name, email:u.email, role:u.role});
    }
    if(out.length>=6) break;
  }
  list.members=out; return out;
}
function olFindList(id){ return OUTLOOK.lists.find(l=>l.id===id); }
function olInitials(name){ return (name||'?').split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); }

/* Microsoft Outlook logo (inline SVG so it works offline & scales crisply) */
function outlookLogoSVG(size){
  size=size||24;
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Outlook">
    <rect x="22" y="14" width="24" height="20" rx="2.5" fill="#0F78D4"/>
    <path d="M22.5 16.6 34 25.2 45.5 16.6" fill="none" stroke="#CFE7FF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
    <rect x="2" y="8" width="27" height="32" rx="5" fill="#0A48A0"/>
    <ellipse cx="15.5" cy="24" rx="6.6" ry="8.3" fill="none" stroke="#fff" stroke-width="3.5"/>
  </svg>`;
}

/* resolve a list -> [{name,email}] (the editable member set) */
function olListRecipients(list){
  return ensureMembers(list).map(m=>({name:m.name, email:m.email}));
}

/* live compose state (single active composer at a time) */
let OL = null;

/* Public entry point used by report-generation flows.
   cfg: { report, file, size, listId, reportKey, subject, body } — all optional.
   If reportKey is given, the destination list comes from report-routing so
   changes made in Manage → Report routing are reflected here. */
function emailReportViaOutlook(cfg={}){
  const routed = cfg.reportKey ? (OUTLOOK.reportTypes.find(t=>t.key===cfg.reportKey)||{}).list : null;
  const listId = routed || cfg.listId || 'qc-lead';
  const list = olFindList(listId) || OUTLOOK.lists[0];
  const report = cfg.report || 'Laboratory Report';
  const cc = [];
  if(OUTLOOK.prefs.ccRecords) cc.push({name:'QA Records', email:'qa.records@descon.com'});
  OL = {
    report,
    file:  cfg.file  || (report.replace(/[^\w]+/g,'_')+'.pdf'),
    size:  cfg.size  || '248 KB',
    listId: list.id,
    subject: cfg.subject || `${report} — ${olToday()}`,
    body: cfg.body || olDefaultBody(report),
    recipients: olListRecipients(list),
    cc,
    bcc: OUTLOOK.prefs.bccMe ? [{name:OUTLOOK.account.name, email:OUTLOOK.account.email}] : [],
  };
  openOutlookComposer();
}

function olToday(){
  // deterministic demo date (no Date.now allowed / needed)
  return '07 Jul 2026';
}
function olDefaultBody(report){
  return `Dear team,\n\nPlease find attached the ${report}, auto-generated from Descon Assure LIQS.\n`+
         `Kindly review and confirm receipt. Reply to this thread for any observations.\n\n`+
         `This is a system-generated distribution.\n\nRegards,\nDescon Assure LIQS`;
}

/* ---- the Outlook compose modal ---- */
function openOutlookComposer(){
  openModal({ title:'', wide:true, body:`<div id="ol-host">${outlookComposeHTML()}</div>`,
    actions:[
      {label:'Cancel',        cls:'btn-out',  fn:'closeModal()'},
      {label:'Save to Drafts',cls:'btn-out',  icon:'save', fn:`closeModal();toast('Saved to Outlook Drafts (demo)','info')`},
      {label:'Send',          cls:'btn-blue', icon:'send', fn:'outlookSend()'},
    ]});
  // dress the modal header as an Outlook window
  const head=document.querySelector('#modal-host .modal-head');
  if(head){
    head.classList.add('ol-modal-head');
    head.querySelector('.modal-title').innerHTML =
      `<span class="ol-brandmark">${outlookLogoSVG(20)}</span>`+
      `<span>New Message <span class="ol-sub">· Outlook</span></span>`;
  }
  if(window.lucide) lucide.createIcons();
}

function outlookComposeHTML(){
  const listOpts = OUTLOOK.lists.map(l=>
    `<option value="${l.id}" ${l.id===OL.listId?'selected':''}>${l.name} (${olListRecipients(l).length})</option>`).join('');
  const chips = arr => arr.map((r,i)=>
    `<span class="ol-chip" title="${r.email}">${r.name}<i data-lucide="x" onclick="olRemove('${i}')"></i></span>`).join('');
  return `
  <div class="ol-compose">
    <div class="ol-account">
      <div class="avatar" style="width:26px;height:26px;font-size:10px">DU</div>
      <div><b>${OUTLOOK.account.name}</b> &lt;${OUTLOOK.account.email}&gt;
        <span class="ol-conn"><span class="ol-dot"></span>Connected to Outlook</span></div>
    </div>

    <div class="ol-listrow">
      <label>Distribution list</label>
      <select id="ol-list" onchange="olPickList(this.value)">${listOpts}</select>
      <span class="ol-hint"><i data-lucide="users"></i>${OL.recipients.length} recipients</span>
    </div>

    <div class="ol-field">
      <span class="ol-lbl">To</span>
      <div class="ol-chips">${chips(OL.recipients)}
        <input class="ol-addin" placeholder="Add recipient…" onkeydown="olAddKey(event)">
      </div>
    </div>
    <div class="ol-field">
      <span class="ol-lbl">Cc</span>
      <div class="ol-chips">${OL.cc.length?chips(OL.cc):'<span style="font-size:11.5px;color:var(--muted2)">—</span>'}</div>
    </div>
    ${OL.bcc && OL.bcc.length ? `<div class="ol-field">
      <span class="ol-lbl">Bcc</span>
      <div class="ol-chips">${chips(OL.bcc)}</div>
    </div>`:''}
    <div class="ol-field">
      <span class="ol-lbl">Subject</span>
      <input class="ol-subject" id="ol-subject" value="${OL.subject.replace(/"/g,'&quot;')}">
    </div>

    <div class="ol-attach">
      <span class="ol-file"><i data-lucide="file-text"></i></span>
      <div class="ol-fmeta"><b>${OL.file}</b><span>PDF · ${OL.size} · generated just now</span></div>
      <span class="ol-ok"><i data-lucide="paperclip"></i>Attached</span>
    </div>

    <textarea class="ol-bodytext" id="ol-body">${OL.body}</textarea>
  </div>`;
}

function olRefresh(){
  const host=document.getElementById('ol-host');
  if(!host) return;
  // preserve subject/body edits before re-render
  const s=document.getElementById('ol-subject'); if(s) OL.subject=s.value;
  const b=document.getElementById('ol-body');    if(b) OL.body=b.value;
  host.innerHTML=outlookComposeHTML();
  const hint=document.querySelector('.ol-hint');
  if(window.lucide) lucide.createIcons();
}

function olPickList(id){
  const l=OUTLOOK.lists.find(x=>x.id===id); if(!l) return;
  OL.listId=id; OL.recipients=olListRecipients(l);
  olRefresh();
  toast('Loaded “'+l.name+'” ('+OL.recipients.length+')','info');
}
function olRemove(i){ OL.recipients.splice(+i,1); olRefresh(); }
function olAddKey(e){
  if(e.key!=='Enter') return;
  const v=e.target.value.trim(); if(!v) return;
  const email=v.includes('@')?v:(v.toLowerCase().replace(/[^a-z]+/g,'.')+'@descon.com');
  OL.recipients.push({name:v.includes('@')?v.split('@')[0]:v, email});
  e.target.value=''; olRefresh();
}

function outlookSend(){
  const s=document.getElementById('ol-subject'); if(s) OL.subject=s.value;
  if(!OL.recipients.length){ toast('Add at least one recipient','warn'); return; }
  const n=OL.recipients.length + OL.cc.length;
  const report=OL.report, file=OL.file, names=OL.recipients.slice(0,3).map(r=>r.name);
  closeModal();
  toast('Sending “'+report+'” via Outlook…','info');
  // mock the async send, then show a delivery confirmation
  setTimeout(()=>{
    olSentModal(report, file, n, names, OL.recipients.length+OL.cc.length);
    // drop a notification so it feels wired into the app
    if(typeof DATA!=='undefined' && DATA.notifs){
      DATA.notifs.unshift({icon:'mail-check',color:'#0a8f6d',
        title:'Report emailed via Outlook', body:`${report} sent to ${n} recipient(s)`, time:'just now'});
    }
  }, 1100);
}

function olSentModal(report,file,n,names,total){
  const more = total-names.length;
  const who = names.join(', ') + (more>0?` +${more} more`:'');
  openModal({ title:'Report sent', body:`
    <div style="text-align:center;padding:6px 4px 2px">
      <div class="ol-sent-ic"><i data-lucide="mail-check"></i></div>
      <div style="font-weight:700;font-size:15px;color:var(--ink);margin-top:12px">Delivered through Outlook</div>
      <div style="color:var(--muted);font-size:12.5px;margin-top:6px;line-height:1.6">
        <b>${report}</b> was emailed to <b>${total}</b> recipient(s).</div>
      <div class="ol-recap">
        <div class="kv"><span>Attachment</span><span>${file}</span></div>
        <div class="kv"><span>Recipients</span><span style="max-width:60%;text-align:right">${who}</span></div>
        <div class="kv"><span>Sent from</span><span>${OUTLOOK.account.email}</span></div>
        <div class="kv" style="border:none"><span>Status</span><span class="badge b-green"><i data-lucide="check" style="width:11px"></i>Delivered</span></div>
      </div>
    </div>`,
    actions:[{label:'Done',cls:'btn-green',icon:'check',fn:'closeModal()'}]});
  if(window.lucide) lucide.createIcons();
  toast('Report emailed to '+total+' recipient(s) via Outlook','ok');
}


/* ============================================================
   Manage Outlook integration — recipients, routing, delivery
   ============================================================ */
let OLM = { tab:'recipients', open:null };

function manageOutlook(){
  OLM = { tab:'recipients', open:OUTLOOK.lists[0].id };
  openModal({ title:'Outlook Integration', wide:true,
    body:`<div id="olm-host">${olmBody()}</div>`,
    actions:[
      {label:'Disconnect', cls:'btn-out', icon:'unplug', fn:`closeModal();toast('Outlook disconnected (demo)','info')`},
      {label:'Done',       cls:'btn-green', icon:'check', fn:`closeModal();toast('Outlook settings saved','ok')`},
    ]});
  if(window.lucide) lucide.createIcons();
}

function olmRender(){
  const h=document.getElementById('olm-host');
  if(h){ h.innerHTML=olmBody(); if(window.lucide) lucide.createIcons(); }
}
function olmTab(t){ OLM.tab=t; olmRender(); }

function olmBody(){
  const tab=(id,ic,label)=>`<div class="tab ${OLM.tab===id?'active':''}" onclick="olmTab('${id}')"><i data-lucide="${ic}"></i>${label}</div>`;
  const totalPeople = OUTLOOK.lists.reduce((n,l)=>n+ensureMembers(l).length,0);
  return `
  <div class="ol-int" style="margin-bottom:14px">
    <div class="ol-logo">${outlookLogoSVG(30)}</div>
    <div style="flex:1">
      <div style="font-weight:600;color:var(--ink);font-size:13px">Microsoft Outlook</div>
      <div style="font-size:11.5px;color:var(--muted)">${OUTLOOK.account.name} &lt;${OUTLOOK.account.email}&gt; · ${OUTLOOK.lists.length} lists · ${totalPeople} recipients</div>
    </div>
    <span class="badge b-green"><i data-lucide="check" style="width:11px"></i>Connected</span>
  </div>
  <div class="tabrow pills" style="margin:0 0 14px">
    ${tab('recipients','users','Recipients')}
    ${tab('routing','route','Report routing')}
    ${tab('delivery','sliders-horizontal','Delivery')}
  </div>
  <div class="olm-pane">${
    OLM.tab==='recipients' ? olmRecipients() :
    OLM.tab==='routing'    ? olmRouting() :
                             olmDelivery()
  }</div>`;
}

/* ---- Tab 1: who gets the email (edit list members) ---- */
function olmRecipients(){
  return OUTLOOK.lists.map(l=>{
    const mem=ensureMembers(l);
    const open=OLM.open===l.id;
    const rows=mem.map((m,i)=>`
      <div class="olm-member">
        <div class="olm-av">${olInitials(m.name)}</div>
        <div class="olm-mmeta"><b>${m.name}</b><span>${m.email}</span></div>
        ${m.role?`<span class="badge b-blue" style="font-size:9.5px">${m.role}</span>`:''}
        <i data-lucide="x" class="olm-rm" title="Remove" onclick="olmRemoveMember('${l.id}',${i})"></i>
      </div>`).join('') || `<div style="font-size:11.5px;color:var(--muted);padding:6px 0">No recipients yet.</div>`;
    return `
    <div class="olm-list">
      <div class="olm-list-head" onclick="olmToggle('${l.id}')" style="cursor:pointer">
        <div style="display:flex;align-items:center;gap:8px">
          <i data-lucide="${open?'chevron-down':'chevron-right'}" style="width:15px;color:var(--muted)"></i>
          <b style="font-size:12.5px;color:var(--ink)">${l.name}</b>
          <span class="badge b-teal-o" style="font-size:9.5px">${mem.length} people</span>
        </div>
        <i data-lucide="mail" style="width:14px;color:var(--muted)"></i>
      </div>
      ${open?`<div class="olm-members">${rows}
        <div class="olm-addrow">
          <input placeholder="Add name or email…" onkeydown="olmAddKey(event,'${l.id}')">
          <button class="btn btn-out" onclick="olmAddClick(this,'${l.id}')"><i data-lucide="user-plus"></i>Add</button>
        </div></div>`:''}
    </div>`;
  }).join('') + `<div style="font-size:11px;color:var(--muted);margin-top:4px"><i data-lucide="info" style="width:12px;vertical-align:-2px"></i> Members are pulled from the user directory and can be edited per list. Changes apply to every report routed to that list.</div>`;
}
function olmToggle(id){ OLM.open = OLM.open===id ? null : id; olmRender(); }
function olmRemoveMember(id,i){ const l=olFindList(id); if(l){ ensureMembers(l).splice(i,1); olmRender(); } }
function olmAddMember(id,val){
  const v=(val||'').trim(); if(!v) return;
  const l=olFindList(id); if(!l) return;
  const email=v.includes('@')?v:(v.toLowerCase().replace(/[^a-z]+/g,'.')+'@descon.com');
  const name=v.includes('@')?v.split('@')[0].replace(/\./g,' ').replace(/\b\w/g,c=>c.toUpperCase()):v;
  ensureMembers(l).push({name, email, role:'Added'});
  olmRender(); toast('Added to '+l.name,'ok');
}
function olmAddKey(e,id){ if(e.key==='Enter'){ olmAddMember(id,e.target.value); } }
function olmAddClick(btn,id){ const inp=btn.parentElement.querySelector('input'); olmAddMember(id, inp&&inp.value); }

/* ---- Tab 2: which list each report is emailed to ---- */
function olmRouting(){
  const listOpt = sel => OUTLOOK.lists.map(l=>`<option value="${l.id}" ${l.id===sel?'selected':''}>${l.name}</option>`).join('');
  return `
  <div style="font-size:12px;color:var(--muted);margin-bottom:10px">Choose the distribution list each report type is emailed to when generated.</div>
  ${OUTLOOK.reportTypes.map(t=>`
    <div class="olm-route">
      <i data-lucide="file-text" style="width:15px;color:var(--brand)"></i>
      <span class="rn">${t.name}</span>
      <i data-lucide="arrow-right" style="width:13px;color:var(--muted2)"></i>
      <select onchange="olmSetRoute('${t.key}',this.value)">${listOpt(t.list)}</select>
    </div>`).join('')}`;
}
function olmSetRoute(key,listId){
  const t=OUTLOOK.reportTypes.find(x=>x.key===key); if(t){ t.list=listId; toast('Routing updated','info'); }
}

/* ---- Tab 3: delivery preferences ---- */
function olmDelivery(){
  const sw=(k,label,desc)=>`
    <div class="olm-toggle">
      <div><div class="tl">${label}</div>${desc?`<div class="ts">${desc}</div>`:''}</div>
      <label class="sw"><input type="checkbox" ${OUTLOOK.prefs[k]?'checked':''} onchange="olmPref('${k}',this.checked)"><span class="sl"></span></label>
    </div>`;
  const opt=(v,cur)=>`<option ${v===cur?'selected':''}>${v}</option>`;
  return `
  ${sw('auto','Auto-email on generation','Send the report the moment it is generated, no extra clicks')}
  ${sw('attachPdf','Attach report as PDF','Include the rendered report as a PDF attachment')}
  ${sw('ccRecords','Cc QA Records','Copy qa.records@descon.com on every distribution')}
  ${sw('bccMe','Send me a copy (Bcc)','Bcc '+OUTLOOK.account.email+' on outgoing reports')}
  ${sw('readReceipt','Request read receipt','Ask recipients’ Outlook to confirm they opened it')}
  <div class="olm-toggle">
    <div><div class="tl">Attachment format</div><div class="ts">File type sent with the email</div></div>
    <select class="olm-selpref" onchange="olmPref('format',this.value)">${['PDF','Excel','PDF + Excel'].map(v=>opt(v,OUTLOOK.prefs.format)).join('')}</select>
  </div>
  <div class="olm-toggle">
    <div><div class="tl">Digest schedule</div><div class="ts">When batched/summary reports are sent</div></div>
    <select class="olm-selpref" onchange="olmPref('digest',this.value)">${['Immediate','Daily 6:00 PM','Weekly (Mon)'].map(v=>opt(v,OUTLOOK.prefs.digest)).join('')}</select>
  </div>
  <div class="olm-toggle" style="border:none">
    <div><div class="tl">Sender display name</div><div class="ts">Shown as the “From” name in Outlook</div></div>
    <input class="olm-selpref" style="min-width:170px" value="${OUTLOOK.prefs.senderName}" onchange="olmPref('senderName',this.value)">
  </div>`;
}
function olmPref(k,v){ OUTLOOK.prefs[k]=v; }
