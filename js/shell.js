/* ============================================================
   App shell: sign-in, identity, notifications, command palette,
   chart tools, page export, record drawer and the assistant panel.
   ============================================================ */

/* ---------------- Sign-in ---------------- */
function nameFromEmail(email){
  const u=(DATA.users||[]).find(x=>x.email.toLowerCase()===String(email).toLowerCase());
  if(u) return titleCase(u.name);
  const local=String(email).split('@')[0]||'User';
  return local.split(/[._-]+/).filter(Boolean).map(w=>/^(qc|qa|hse|it|lims)$/i.test(w)?w.toUpperCase():w[0].toUpperCase()+w.slice(1).toLowerCase()).join(' ');
}
function renderLogin(){
  let el=document.getElementById('login-screen');
  if(!el){ el=document.createElement('div'); el.id='login-screen'; document.body.appendChild(el); }
  let last=null; try{ last=JSON.parse(localStorage.getItem('descon-assure-lastlogin')||'null'); }catch(e){}
  const role=(last&&last.role)||'QC Manager';
  el.className='';
  el.innerHTML=`
  <div class="login-art" aria-hidden="true">
    <div class="la-grid"></div>
    <div class="la-copy">
      <div class="la-kicker">Descon Oxychem Limited</div>
      <div class="la-title">Every sample, result and certificate in one controlled system.</div>
      <div class="la-points">
        <div><i data-lucide="flask-conical"></i>Sample to CoA in one workflow</div>
        <div><i data-lucide="shield-check"></i>ISO/IEC 17025 audit trail on every change</div>
        <div><i data-lucide="sparkles"></i>Assistant that answers from live lab data</div>
      </div>
    </div>
  </div>
  <div class="login-side">
    <form class="login-card" onsubmit="event.preventDefault();doLogin()">
      <div class="login-brand"><img src="assets/logo.jpg" alt="Descon"><div><div class="lb-t">Assure LIQS</div><div class="lb-s">Laboratory Information &amp; Quality System</div></div></div>
      <div class="login-h">Sign in</div>
      <div class="login-sub">Use your Descon work account.</div>
      <button type="button" class="btn ms-btn" onclick="loginMicrosoft()">${typeof msLogo==='function'?msLogo('entra',18):''}<span>Sign in with Microsoft</span></button>
      <div class="login-or"><span>or</span></div>
      <div class="form-row"><label for="lg-email">Work email</label><input id="lg-email" type="email" required value="${esc((last&&last.email)||'qc.manager@descon.com')}" autocomplete="username"></div>
      <div class="form-row"><label for="lg-pass">Password</label><input id="lg-pass" type="password" required value="assure-2026" autocomplete="current-password"></div>
      <div class="form-row"><label for="lg-role">Sign in as</label><select id="lg-role">${ROLES.map(r=>`<option ${r===role?'selected':''}>${r}</option>`).join('')}</select></div>
      <button type="submit" class="btn btn-green login-go" id="lg-go"><span>Sign in</span></button>
      <div class="login-foot"><i data-lucide="lock" style="width:12px"></i>Microsoft Entra ID · Descon network only · every action is audit-logged</div>
    </form>
  </div>`;
  document.body.classList.add('signed-out');
  if(window.lucide) lucide.createIcons();
}
function finishLogin(email, role, via){
  SESSION={name:nameFromEmail(email), email:String(email).toLowerCase(), role, photo:(SESSION&&SESSION.photo)||null, since:Date.now(), superAdmin:role==='Admin'};
  saveSession();
  try{ localStorage.setItem('descon-assure-lastlogin',JSON.stringify({email:SESSION.email,role})); }catch(e){}
  if(typeof OUTLOOK!=='undefined') OUTLOOK.account={name:SESSION.name,email:SESSION.email};
  audit('Signed in','Security',via||'Lab account');
  const el=document.getElementById('login-screen');
  if(el){ el.classList.add('leaving'); setTimeout(()=>{ el.remove(); },420); }
  document.body.classList.remove('signed-out');
  updateIdentity(); render();
  toast(`Welcome, ${SESSION.name.split(' ')[0]}. Signed in as ${role}.`,'ok');
}
function doLogin(){
  const email=(document.getElementById('lg-email')||{}).value||'';
  const pass=(document.getElementById('lg-pass')||{}).value||'';
  const role=(document.getElementById('lg-role')||{}).value||'Lab Analyst';
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Enter a valid work email','err'); return; }
  if(pass.length<4){ toast('Enter your password','err'); return; }
  const b=document.getElementById('lg-go'); if(b){ b.disabled=true; b.innerHTML='<i data-lucide="loader-2" class="spin"></i><span>Signing in…</span>'; if(window.lucide)lucide.createIcons(); }
  setTimeout(()=>finishLogin(email,role,'Lab account'),650);
}
function loginMicrosoft(){
  const email=(document.getElementById('lg-email')||{}).value||'qc.manager@descon.com';
  const role=(document.getElementById('lg-role')||{}).value||'QC Manager';
  const card=document.querySelector('.login-card'); if(!card) return;
  card.innerHTML=`<div class="sso-wait">${msLogo('entra',34)}
    <div class="sso-t">Signing in with Microsoft</div>
    <div class="sso-s">${esc(email)} · Descon tenant</div>
    <div class="sso-bar"><i></i></div></div>`;
  setTimeout(()=>finishLogin(email,role,'Microsoft Entra ID SSO'),1300);
}
function doLogout(){
  closeDropdowns(); closeDrawer(); closeModal();
  audit('Signed out','Security');
  SESSION=null; saveSession(); persist();
  renderLogin();
}
function updateIdentity(){
  const s=me();
  const bar=document.querySelector('.command-bar');
  if(bar&&!bar.querySelector('.net-chip')){ const c=document.createElement('span'); c.className='net-chip'; c.title='Connected through the Descon network'; c.innerHTML='<i data-lucide="shield-check"></i>Descon network'; const srch=bar.querySelector('.search'); bar.insertBefore(c,srch); if(window.lucide) lucide.createIcons(); }
  if(SESSION&&SESSION.superAdmin===undefined) SESSION.superAdmin=SESSION.role==='Admin';
  document.querySelectorAll('.rail-bottom .avatar').forEach(a=>{
    if(s.photo){ a.innerHTML=`<img src="${s.photo}" alt="">`; a.classList.add('has-photo'); }
    else { a.textContent=initialsOf(s.name); a.classList.remove('has-photo'); }
    a.parentElement.title=`${s.name} · ${s.role}`;
  });
  updateBadge();
}
function switchRole(role){
  if(!SESSION) return; SESSION.role=role; saveSession(); closeDropdowns();
  audit('Switched role','Security',role); render(); updateIdentity();
  toast('Now working as '+role,'info');
}

/* ---------------- Dropdowns (profile + notifications) ---------------- */
function closeDropdowns(){ document.querySelectorAll('.dropdown').forEach(d=>d.remove()); }
document.addEventListener('click',e=>{ if(!e.target.closest('.dropdown')&&!e.target.closest('.iconbtn')) closeDropdowns(); });
function railDropdown(cls, html){
  closeDropdowns();
  const dd=document.createElement('div'); dd.className='dropdown rail-dd '+cls; dd.innerHTML=html;
  document.body.appendChild(dd); if(window.lucide) lucide.createIcons();
  return dd;
}
function toggleNotif(e){
  e.stopPropagation();
  if(document.querySelector('.dropdown.dd-notif')){ closeDropdowns(); return; }
  const list=DATA.notifications||[];
  railDropdown('dd-notif',`<div class="dd-head">Notifications <span class="dd-act" onclick="markAllRead()">Mark all read</span></div>
    <div class="dd-scroll">${list.length?list.slice(0,25).map((n,i)=>`<div class="dd-item ${n.unread!==false?'unread':''}" onclick="openNotif(${i})">
      <div class="dd-ic" style="background:${n.color}1a;color:${n.color}"><i data-lucide="${n.icon}"></i></div>
      <div style="flex:1;min-width:0"><div class="t">${esc(n.title)}</div><div class="b">${esc(n.body)}</div><div class="tm">${relTime(n)}</div></div></div>`).join('')
      :'<div class="empty" style="padding:30px">You are all caught up.</div>'}</div>
    <div class="dd-foot" onclick="closeDropdowns();go('logs')">View all activity</div>`);
}
function openNotif(i){
  const n=(DATA.notifications||[])[i]; if(!n) return;
  n.unread=false; updateBadge(); persistSoon(); closeDropdowns();
  const route=n.route||guessRoute(n.title+' '+n.body);
  if(route){ go(route); if(n.tab) setTab(n.tab); }
}
function guessRoute(t){
  t=String(t).toLowerCase();
  if(/stock|chemical|reagent/.test(t)) return 'chemicals';
  if(/audit|iso|nc|capa/.test(t)) return 'iso';
  if(/special/.test(t)) return 'h2o2';
  if(/off-spec|oos|biuret/.test(t)) return 'urea';
  if(/batch|released|h2o2/.test(t)) return 'h2o2';
  if(/backlog|shift/.test(t)) return 'shiftlog';
  return null;
}
function markAllRead(){ (DATA.notifications||[]).forEach(n=>n.unread=false); updateBadge(); persistSoon(); closeDropdowns(); toast('All notifications marked read','ok'); }
function toggleProfile(e){
  e.stopPropagation();
  if(document.querySelector('.dropdown.dd-profile')){ closeDropdowns(); return; }
  const s=me();
  railDropdown('dd-profile',`<div class="dd-who">
      <div class="avatar" style="width:36px;height:36px;font-size:13px">${s.photo?`<img src="${s.photo}" alt="">`:initialsOf(s.name)}</div>
      <div style="min-width:0"><div class="dw-n">${esc(s.name)}</div><div class="dw-e">${esc(s.email)}</div><span class="badge b-blue" style="margin-top:4px">${esc(s.role)}</span></div></div>
    ${s.profileOf?`<div class="dd-note">Using ${esc(s.name)}'s profile on ${esc(s.email)}</div>`:''}
    <div class="dd-line" onclick="closeDropdowns();openProfileSwitch()"><i data-lucide="users-round"></i>Switch profile${s.superAdmin?'<span class="kbd">Admin</span>':'<span class="kbd">PIN</span>'}</div>
    ${s.profileOf?`<div class="dd-line" onclick="closeDropdowns();backToMyProfile()"><i data-lucide="undo-2"></i>Back to my profile</div>`:''}
    <div class="dd-line" onclick="closeDropdowns();go('profile')"><i data-lucide="user-cog"></i>Profile &amp; settings</div>
    <div class="dd-line dd-sub-toggle" onclick="event.stopPropagation();this.nextElementSibling.classList.toggle('open')"><i data-lucide="repeat-2"></i>Switch role<i data-lucide="chevron-right" class="dd-chev"></i></div>
    <div class="dd-sub">${ROLES.map(r=>`<div class="dd-line ${r===s.role?'on':''}" onclick="switchRole('${r}')">${r===s.role?'<i data-lucide="check"></i>':'<span style="width:15px"></span>'}${r}</div>`).join('')}</div>
    <div class="dd-line" onclick="toggleTheme();closeDropdowns()"><i data-lucide="moon"></i>Toggle theme</div>
    <div class="dd-line" onclick="closeDropdowns();openPalette()"><i data-lucide="command"></i>Command palette<span class="kbd">Ctrl K</span></div>
    <div class="dd-line" onclick="closeDropdowns();go('logs')"><i data-lucide="history"></i>Audit trail</div>
    <div class="dd-line danger" onclick="doLogout()"><i data-lucide="log-out"></i>Sign out</div>`);
}

/* ---------------- Profile switching (shared lab login + PIN) ---------------- */
function openProfileSwitch(){
  const people=(DATA.users||[]).filter(u=>u.status==='Active');
  openModal({title:'Switch profile', wide:true, body:`
    <div class="note-line" style="margin:0 0 12px"><i data-lucide="info"></i>${SESSION.superAdmin?'Super admin: switch to any profile without a PIN.':'Everyone on this login has a profile. Tap yours and enter your 4-digit PIN.'}</div>
    <div class="ps-grid">${people.map(u=>`<button class="ps-tile ${SESSION.profileId===u.id?'on':''}" onclick="switchProfile('${u.id}')">
      <span class="ks-av">${initialsOf(titleCase(u.name))}</span><b>${titleCase(u.name)}</b><span>${u.role}</span></button>`).join('')}</div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'}]});
}
function switchProfile(id){
  const u=(DATA.users||[]).find(x=>x.id===id); if(!u) return;
  const apply=()=>{
    if(!SESSION.profileOf) SESSION.profileOf={name:SESSION.name,role:SESSION.role};
    SESSION.name=titleCase(u.name); SESSION.role=u.role; SESSION.profileId=u.id; saveSession();
    audit('Switched profile','Security',`${titleCase(u.name)} (${u.role})${SESSION.superAdmin?' · super admin':' · PIN'}`);
    closeModal(); updateIdentity(); render(); toast(`Now using ${titleCase(u.name)}'s profile`,'ok');
  };
  if(SESSION.superAdmin){ apply(); return; }
  closeModal(); withPin(u,'Switch profile',apply);
}
function backToMyProfile(){
  if(!SESSION.profileOf) return;
  SESSION.name=SESSION.profileOf.name; SESSION.role=SESSION.profileOf.role; delete SESSION.profileOf; delete SESSION.profileId; saveSession();
  audit('Switched profile','Security','Back to own profile'); updateIdentity(); render(); toast('Back on your own profile','info');
}

/* ---------------- Record drawer ---------------- */
function openRecord(title, pairs, actions, extra){
  const rows=(Array.isArray(pairs)?pairs:Object.entries(pairs)).map(([k,v])=>`<div class="kv"><span>${esc(k)}</span><span>${v==null||v===''?'—':v}</span></div>`).join('');
  const acts=(actions||[]).map(a=>`<button class="btn ${a.cls||'btn-out'}" onclick="${a.fn}">${a.icon?`<i data-lucide="${a.icon}"></i>`:''}${a.label}</button>`).join('');
  openDrawer(title, `<div class="rec">${rows}</div>${extra||''}${acts?`<div class="rec-acts">${acts}</div>`:''}`);
}

/* ---------------- Command palette ---------------- */
let PAL={items:[],sel:0};
function paletteItems(){
  const out=[];
  const nav=DATA.nav.filter(n=>n.id);
  nav.forEach(n=>out.push({k:'Go to',t:n.label,ic:n.icon,fn:`go('${n.id}')`}));
  ['h2o2','urea'].forEach(r=>DATA.subtabs.forEach(t=>out.push({k:'Open',t:`${PRODUCT_LABELS[r]} › ${t.label}`,ic:t.icon,fn:`go('${r}');setTab('${t.id}')`})));
  [['Log a new sample','plus','go(\'registry\');setTimeout(addRegistry,150)'],
   ['Raise special request','flask-round','go(\'h2o2\');setTab(\'special\');setTimeout(raiseRequest,150)'],
   ['Register finished batch','package-plus','go(\'h2o2\');setTab(\'wpp\');setTimeout(newBatch,150)'],
   ['Generate certificate (CoA)','file-check-2','go(\'h2o2\');setTab(\'coa\');setTimeout(newCoa,150)'],
   ['Add chemical','flask-conical','go(\'chemicals\');setTimeout(addChemical,150)'],
   ['Upload document','upload','go(\'docs\');setTimeout(docUpload,150)'],
   ['Record calibration','gauge','go(\'equip\')'],
   ['Log CAPA','clipboard-check','go(\'iso\');setTimeout(()=>logCapa(),150)'],
   ['Clock in / out','clock','go(\'clock\')'],
   ['Open QR station','qr-code','go(\'clock\');setTimeout(openStation,150)'],
   ['Switch profile','users-round','openProfileSwitch()'],
   ['Customers and CoA formats','building-2','go(\'customers\')'],
   ['Import customers from SAP','upload','go(\'customers\');setTimeout(custImport,150)'],
   ['Ask the assistant','sparkles','openAssistant()'],
   ['Toggle dark mode','moon','toggleTheme()'],
   ['Sign out','log-out','doLogout()']].forEach(([t,ic,fn])=>out.push({k:'Action',t,ic,fn}));
  (DATA.batches||[]).forEach(b=>out.push({k:'Batch',t:`${b.id} · ${b.product}`,s:b.status,ic:'package',fn:`go('${b.route}');setTab('wpp');setTimeout(()=>openBatch('${b.id}'),150)`}));
  (DATA.registry||[]).forEach(r=>out.push({k:'Sample',t:`${r.id} · ${r.source}`,s:r.status,ic:'test-tube',fn:`go('registry');setTimeout(()=>openRegistry('${r.id}'),150)`}));
  (DATA.chem.rows||[]).forEach(r=>out.push({k:'Chemical',t:`${r[2]}`,s:`${r[0]} · bal ${r[7]}`,ic:'flask-conical',fn:`go('chemicals');setTimeout(()=>editChem('${r[0]}'),150)`}));
  (DATA.equipment||[]).forEach(e=>out.push({k:'Instrument',t:`${e.name} (${e.tag})`,s:e.status,ic:'settings-2',fn:`go('equip');setTimeout(()=>openEquip('${e.id}'),150)`}));
  (DATA.docs.cards||[]).forEach((d,i)=>out.push({k:'Document',t:d.name,s:d.code,ic:'file-text',fn:`go('docs');setTimeout(()=>docSelect(${i}),150)`}));
  (DATA.users||[]).forEach(u=>out.push({k:'User',t:titleCase(u.name),s:u.role,ic:'user',fn:`go('users')`}));
  (DATA.capas||[]).forEach(c=>out.push({k:'CAPA',t:`${c.id} · ${c.title}`,s:c.status,ic:'clipboard-check',fn:`go('iso');setTimeout(()=>openCapa('${c.id}'),150)`}));
  (DATA.coas||[]).forEach(c=>out.push({k:'CoA',t:`${c.id} · ${c.product}`,s:c.customer,ic:'file-check-2',fn:`go('${c.route}');setTab('coa');setTimeout(()=>viewCoa('${c.id}'),150)`}));
  return out;
}
function openPalette(q){
  closeDropdowns();
  let host=document.getElementById('palette');
  if(!host){ host=document.createElement('div'); host.id='palette'; document.body.appendChild(host); }
  host.innerHTML=`<div class="pal-overlay" onclick="if(event.target===this)closePalette()">
    <div class="pal">
      <div class="pal-in"><i data-lucide="search"></i><input id="pal-q" placeholder="Search modules, samples, batches, chemicals, people… or type an action" autocomplete="off" oninput="palFilter(this.value)" onkeydown="palKey(event)"><span class="kbd">Esc</span></div>
      <div class="pal-list" id="pal-list"></div>
      <div class="pal-foot"><span><span class="kbd">↑</span><span class="kbd">↓</span> move</span><span><span class="kbd">Enter</span> open</span><span>${paletteItems().length} items indexed</span></div>
    </div></div>`;
  host.classList.add('open');
  if(window.lucide) lucide.createIcons();
  const inp=document.getElementById('pal-q'); inp.value=q||''; inp.focus(); palFilter(inp.value);
}
function closePalette(){ const h=document.getElementById('palette'); if(h){ h.classList.remove('open'); h.innerHTML=''; } }
function palFilter(q){
  const words=String(q).toLowerCase().split(/\s+/).filter(Boolean);
  const all=paletteItems();
  PAL.items = words.length ? all.filter(it=>{ const hay=(it.k+' '+it.t+' '+(it.s||'')).toLowerCase(); return words.every(w=>hay.includes(w)); }).slice(0,40)
                           : all.filter(it=>it.k==='Go to'||it.k==='Action').slice(0,16);
  PAL.sel=0; palDraw();
}
function palDraw(){
  const el=document.getElementById('pal-list'); if(!el) return;
  el.innerHTML = PAL.items.length ? PAL.items.map((it,i)=>`<div class="pal-item ${i===PAL.sel?'sel':''}" onmouseenter="PAL.sel=${i};palMark()" onclick="palRun(${i})">
      <i data-lucide="${it.ic}"></i><span class="pi-t">${esc(it.t)}</span>${it.s?`<span class="pi-s">${esc(it.s)}</span>`:''}<span class="pi-k">${it.k}</span></div>`).join('')
    : `<div class="empty" style="padding:28px">No matches. Try a sample ID, batch, chemical or module name.</div>`;
  if(window.lucide) lucide.createIcons();
}
function palMark(){ document.querySelectorAll('.pal-item').forEach((e,i)=>e.classList.toggle('sel',i===PAL.sel)); }
function palKey(e){
  if(e.key==='ArrowDown'){ PAL.sel=Math.min(PAL.items.length-1,PAL.sel+1); palMark(); scrollPal(); e.preventDefault(); }
  else if(e.key==='ArrowUp'){ PAL.sel=Math.max(0,PAL.sel-1); palMark(); scrollPal(); e.preventDefault(); }
  else if(e.key==='Enter'){ palRun(PAL.sel); e.preventDefault(); }
  else if(e.key==='Escape'){ closePalette(); }
}
function scrollPal(){ const el=document.querySelectorAll('.pal-item')[PAL.sel]; if(el) el.scrollIntoView({block:'nearest'}); }
function palRun(i){ const it=PAL.items[i]; if(!it) return; closePalette(); try{ (new Function(it.fn))(); }catch(err){ console.error(err); } }
function globalSearch(q){ openPalette(q); }

document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); if(SESSION) openPalette(); return; }
  if(e.key==='Escape'){
    if(document.getElementById('palette')?.classList.contains('open')){ closePalette(); return; }
    if(document.getElementById('modal-host')?.classList.contains('open')){ closeModal(); return; }
    if(document.body.classList.contains('assistant-open')){ closeDrawer(); return; }
    closeDropdowns();
  }
});

/* ---------------- Chart tools ---------------- */
let LIVE={};
function chartTools(){
  const tools=[['download','Download PNG','png'],['refresh-cw','Refresh','refresh'],['file-down','Export CSV','csv'],['maximize-2','Expand','expand'],['radio','Live updates','live'],['maximize','Full screen','full']];
  return `<div class="chart-tools">${tools.map(([ic,tip,k])=>`<i data-lucide="${ic}" title="${tip}" data-tool="${k}" onclick="chartAction(this,'${k}')"></i>`).join('')}</div>`;
}
function chartOf(el){
  const card=el.closest('.card'); const cv=card&&card.querySelector('canvas');
  return cv?{card,cv,chart:CHARTS[cv.id],title:(card.querySelector('.card-title')||{}).textContent||cv.id}:{};
}
function chartAction(el, kind){
  const {card,cv,chart,title}=chartOf(el);
  if(!chart){ toast('Chart is still loading','info'); return; }
  const name=String(title).trim().replace(/\s+/g,' ').replace(/[^\w ·-]+/g,'').replace(/\s/g,'_')||'chart';
  if(kind==='png'){
    const c=document.createElement('canvas'); c.width=cv.width; c.height=cv.height;
    const x=c.getContext('2d'); x.fillStyle=document.body.classList.contains('dark')?'#161f2b':'#ffffff'; x.fillRect(0,0,c.width,c.height); x.drawImage(cv,0,0);
    c.toBlob(b=>{ downloadFile(name+'.png',b); toast('Saved '+name+'.png','ok'); });
    audit('Exported chart','Dashboards',title);
  } else if(kind==='refresh'){
    chart.reset(); chart.update(); toast('Refreshed · data as of '+fmtTime(),'info');
  } else if(kind==='csv'){
    const ds=chart.data.datasets; const head=['Label',...ds.map(d=>d.label||'Value')];
    const rows=chart.data.labels.map((l,i)=>[l,...ds.map(d=>d.data[i])]);
    exportCSV(name+'.csv',head,rows); audit('Exported chart data','Dashboards',title);
  } else if(kind==='expand'){
    openModal({title:esc(title), wide:true, body:`<div style="height:420px"><canvas id="chart-zoom"></canvas></div>`});
    setTimeout(()=>{ destroyChart('chart-zoom'); const z=document.getElementById('chart-zoom'); if(!z) return;
      CHARTS['chart-zoom']=new Chart(z,{type:chart.config.type,data:JSON.parse(JSON.stringify(chart.data)),options:chart.config.options}); },60);
  } else if(kind==='live'){
    const id=cv.id;
    if(LIVE[id]){ clearInterval(LIVE[id]); delete LIVE[id]; el.classList.remove('on'); toast('Live updates paused','info'); return; }
    el.classList.add('on'); toast('Live updates on · new readings every 2 s','ok');
    LIVE[id]=setInterval(()=>{
      const c=CHARTS[id]; if(!c||!document.getElementById(id)){ clearInterval(LIVE[id]); delete LIVE[id]; return; }
      if(c.config.type==='line'){
        c.data.labels.push(fmtTime()+':'+pad2(new Date().getSeconds())); c.data.labels.shift();
        c.data.datasets.forEach((d,i)=>{ const arr=d.data; const last=+arr[arr.length-1]||0;
          const flat=arr.every(v=>v===arr[0]); arr.push(flat?last:+(last+(Math.random()-.5)*Math.max(1,Math.abs(last)*0.08)).toFixed(2)); arr.shift(); });
      } else {
        c.data.datasets.forEach(d=>{ d.data=d.data.map(v=>Math.max(0,+(v*(1+(Math.random()-.5)*0.08)).toFixed(1))); });
      }
      c.update();
    },2000);
  } else if(kind==='full'){
    if(document.fullscreenElement){ document.exitFullscreen(); return; }
    (card.requestFullscreen?card.requestFullscreen():Promise.reject()).catch(()=>toast('Full screen is not available here','warn'));
  }
}
function stopLive(){ Object.keys(LIVE).forEach(id=>{ clearInterval(LIVE[id]); delete LIVE[id]; }); }

/* ---------------- Page export (PNG / PDF / CSV) ---------------- */
function pageLabel(){ const c=document.getElementById('crumb-page'); return (c?c.textContent:'Assure').replace(/›/g,'-').trim(); }
function downloadCurrent(){
  openModal({title:'Export this page', body:`
    <div class="exp-opts">
      <div class="exp-opt" onclick="closeModal();exportPage('png')"><i data-lucide="image"></i><div><b>Image (PNG)</b><span>High-resolution snapshot of the screen</span></div></div>
      <div class="exp-opt" onclick="closeModal();exportPage('pdf')"><i data-lucide="file-text"></i><div><b>PDF report</b><span>A4 landscape, ready to share or print</span></div></div>
      <div class="exp-opt" onclick="closeModal();exportPage('csv')"><i data-lucide="file-spreadsheet"></i><div><b>Data (CSV)</b><span>Every table on this page, as spreadsheets</span></div></div>
    </div>`, actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'}]});
}
async function snapContent(){
  await loadScript(LIBS.html2canvas);
  const el=document.getElementById('content');
  const bg=getComputedStyle(document.querySelector('.main-workspace')).backgroundColor;
  return html2canvas(el,{backgroundColor:bg,scale:2,useCORS:true,logging:false,windowWidth:el.scrollWidth,height:el.scrollHeight,windowHeight:el.scrollHeight});
}
async function exportPage(kind){
  const label=pageLabel(); const base=('Assure_'+label).replace(/[^\w-]+/g,'_');
  if(kind==='csv'){
    const boxes=[...document.querySelectorAll('#content [id^="tblbox-"]')];
    if(!boxes.length){ toast('There is no table on this page to export','info'); return; }
    boxes.forEach(b=>{ const id=b.id.replace('tblbox-',''); exportGeneric(id, `${base}_${id}.csv`); });
    audit('Exported data','Reports',label); return;
  }
  toast('Preparing '+(kind==='pdf'?'PDF':'image')+'…','info');
  try{
    const canvas=await snapContent();
    if(kind==='png'){ canvas.toBlob(b=>{ downloadFile(base+'.png',b); toast('Saved '+base+'.png','ok'); }); }
    else{
      await loadScript(LIBS.jspdf);
      const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
      const W=pdf.internal.pageSize.getWidth(), H=pdf.internal.pageSize.getHeight(), m=28;
      pdf.setFontSize(11); pdf.setTextColor(15,27,45); pdf.text('Descon Assure LIQS · '+label,m,m);
      pdf.setFontSize(8); pdf.setTextColor(105,117,134); pdf.text(`Exported ${fmtStamp()} by ${myName()} (${me().role})`,m,m+13);
      const iw=W-2*m, ih=canvas.height*iw/canvas.width, top=m+24, pageH=H-top-m;
      const img=canvas.toDataURL('image/jpeg',0.92);
      let y=0; let first=true;
      while(y<ih){ if(!first){ pdf.addPage(); } pdf.addImage(img,'JPEG',m,top-y,iw,ih); y+=pageH; first=false; }
      pdf.save(base+'.pdf'); toast('Saved '+base+'.pdf','ok');
    }
    audit('Exported page','Reports',`${label} (${kind.toUpperCase()})`);
  }catch(err){ console.error(err); toast('Export needs an internet connection to load the exporter','err'); }
}

/* ---------------- Assistant panel ---------------- */
let DCHAT=[];
function toggleAssistant(){ if(document.body.classList.contains('assistant-open')&&document.getElementById('dchat-body')) closeDrawer(); else openAssistant(); }
function openAssistant(q){
  if(!DCHAT.length) DCHAT.push({who:'bot',html:`<p>Hi ${esc(myName().split(' ')[0])}. I read live data from every module: samples, results, batches, certificates, stock, instruments and audits.</p><p>Ask me anything, or pick a question below.</p>`});
  const sugg=['What needs my attention today?','Which batches are waiting for release?','Which chemicals need reordering?','Instruments due for calibration','Open CAPAs'];
  openDrawer('<span style="display:flex;align-items:center;gap:8px"><i data-lucide="sparkles" style="width:16px;color:var(--brand)"></i>Assure Assistant</span>',
    `<div class="dchat"><div class="dchat-body" id="dchat-body">${DCHAT.map(dMsg).join('')}</div>
      <div class="dchat-sugg" id="dchat-sugg">${sugg.map(s=>`<span class="sugg" onclick="dchatSend('${jsq(s)}')">${s}</span>`).join('')}</div>
      <div class="chat-input dchat-in"><input id="dchat-in" placeholder="Ask about samples, batches, stock…" onkeydown="if(event.key==='Enter')dchatSend()"><div class="send" onclick="dchatSend()"><i data-lucide="send" style="width:15px"></i></div></div></div>`);
  dScroll();
  setTimeout(()=>{ const i=document.getElementById('dchat-in'); if(i) i.focus(); },220);
  if(q) setTimeout(()=>dchatSend(q),260);
}
function dMsg(m){ return m.who==='user'?`<div class="dm user"><div class="dm-b">${m.html}</div></div>`:`<div class="dm bot"><div class="dm-av"><i data-lucide="sparkles"></i></div><div class="dm-b">${m.html}</div></div>`; }
function dScroll(){ const b=document.getElementById('dchat-body'); if(b) b.scrollTop=b.scrollHeight; if(window.lucide) lucide.createIcons(); }
let DBUSY=false;
function dchatSend(q){
  if(DBUSY) return;
  const inp=document.getElementById('dchat-in'); q=(q||(inp&&inp.value)||'').trim(); if(!q) return;
  if(inp) inp.value='';
  DCHAT.push({who:'user',html:esc(q)});
  const body=document.getElementById('dchat-body'); if(!body) return;
  body.insertAdjacentHTML('beforeend',dMsg(DCHAT[DCHAT.length-1]));
  body.insertAdjacentHTML('beforeend',`<div class="dm bot" id="dthink"><div class="dm-av"><i data-lucide="sparkles"></i></div><div class="dm-b"><span class="dots"><i></i><i></i><i></i></span> <span class="dthink-t">Reading ${AI.pickAgents(q).map(a=>a.name.split(' ')[0].toLowerCase()).join(', ')} data…</span></div></div>`);
  dScroll(); DBUSY=true;
  setTimeout(()=>{
    const t=document.getElementById('dthink'); if(t) t.remove();
    const html=AI.respond(q); DCHAT.push({who:'bot',html});
    const b=document.getElementById('dchat-body'); if(b){ b.insertAdjacentHTML('beforeend',dMsg({who:'bot',html})); const last=b.lastElementChild; last.classList.add('reveal'); }
    dScroll(); DBUSY=false;
  },650+Math.random()*500);
}

/* ---------------- Motion: page enter + number count-up ---------------- */
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateEnter(){
  const c=document.getElementById('content'); if(!c||REDUCED) return;
  c.classList.remove('enter'); void c.offsetWidth; c.classList.add('enter');
  setTimeout(()=>c.classList.remove('enter'),700);
  c.querySelectorAll('.si-val,.k-val').forEach(el=>{
    const txt=el.textContent.trim(); const m=txt.match(/^([\d,]+(?:\.\d+)?)(.*)$/); if(!m) return;
    const target=parseFloat(m[1].replace(/,/g,'')); if(!isFinite(target)||target===0) return;
    const dec=(m[1].split('.')[1]||'').length, comma=m[1].includes(','), suf=m[2];
    const t0=performance.now(), dur=650;
    const fmt=v=>{ let s=v.toFixed(dec); if(comma) s=Number(s).toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec}); return s+suf; };
    const step=t=>{ const p=Math.min(1,(t-t0)/dur); const e=1-Math.pow(1-p,3); el.textContent=fmt(target*e); if(p<1) requestAnimationFrame(step); else el.textContent=txt; };
    requestAnimationFrame(step);
  });
}
