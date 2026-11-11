/* ===== Clock In / Out: QR station + phone device ID, handover rule for Lab Analysts ===== */

const LAB_ROLES=['Lab Analyst','Senior Analyst','Lab Supervisor','QC Manager'];
function pinHash(id,pin){ let h=5381; const s=id+':'+pin; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))>>>0; return h.toString(36); }
function labPeople(){ return (DATA.users||[]).filter(u=>u.status==='Active'&&LAB_ROLES.includes(u.role)); }
function userByName(n){ return (DATA.users||[]).find(u=>u.name===String(n).toUpperCase()); }
function roleOf(n){ const u=userByName(n); if(u) return u.role; return String(n).toUpperCase()===myName().toUpperCase()?me().role:''; }
function needsHandover(n){ return roleOf(n)==='Lab Analyst'; }
function openRecordFor(name){ return (DATA.attendance||[]).find(a=>a.user===String(name).toUpperCase()&&!a.out); }
function hoursBetween(a,b){ const p=s=>{ const m=String(s).match(/(\d{1,2}):(\d{2})$/); return m?(+m[1])*60+(+m[2]):null; }; const x=p(a), y=b?p(b):(new Date().getHours()*60+new Date().getMinutes()); if(x==null||y==null) return ''; let d=y-x; if(d<0) d+=1440; return (d/60).toFixed(1)+' h'; }
function startOfToday(){ const d=new Date(); d.setHours(0,0,0,0); return d.getTime(); }
/* did this person write a handover since they clocked in? */
function hasHandover(user, rec){
  const since=(rec&&rec.inAt)||startOfToday();
  return (DATA.shiftlog||[]).some(l=>l.by===String(user).toUpperCase()&&(l.at||0)>=since);
}

/* ---------- device ID (the phone that scans) ---------- */
const DEVICE_KEY='assure-device-id';
function deviceId(){ let id=null; try{ id=localStorage.getItem(DEVICE_KEY); }catch(e){} if(!id){ id='DV-'+Math.random().toString(36).slice(2,8).toUpperCase()+Date.now().toString(36).slice(-4).toUpperCase(); try{ localStorage.setItem(DEVICE_KEY,id); }catch(e){} } return id; }
function deviceOwner(id){ return (DATA.devices||[]).find(d=>d.id===id); }

/* ---------- rotating station code (a photo of the QR stops working after ~90 s) ---------- */
function stationCode(offset){ const w=Math.floor(Date.now()/30000)+(offset||0); return (w*7919%2176782336).toString(36).toUpperCase(); }
function validCode(c){ return [0,-1,-2,1].some(o=>stationCode(o)===String(c||'').toUpperCase()); }
function scanUrl(){ return location.origin+location.pathname+'#scan:'+stationCode(); }

function screenClock(){
  const att=DATA.attendance||[];
  const onDuty=att.filter(a=>!a.out);
  const meName=myName().toUpperCase();
  const mine=openRecordFor(meName);
  const devs=DATA.devices||[];
  const tbl=makeTable('attendance',{
    title:"Today's Attendance", pageSize:10, search:['user','shift','method'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('attendance','attendance.csv')"><i data-lucide="download"></i>Export</button>`,
    onOpen:r=>attOpen(r.id),
    columns:[
      {key:'user',label:'NAME',render:v=>`<b style="color:var(--ink)">${titleCase(v)}</b>`},
      {key:'shift',label:'SHIFT',render:v=>`<span class="badge b-teal-o">${v}</span>`},
      {key:'in',label:'CLOCK IN',render:v=>`<span style="color:var(--muted)">${String(v).slice(-5)}</span>`},
      {key:'out',label:'CLOCK OUT',render:v=>v?`<span style="color:var(--muted)">${String(v).slice(-5)}</span>`:'—'},
      {key:'hours',label:'HOURS',sortable:false,render:(_,r)=>hoursBetween(r.in,r.out)},
      {key:'method',label:'METHOD'},
      {key:'handover',label:'HANDOVER',sortable:false,render:(_,r)=>!r.out?'—':r.noHandover?`<span class="badge b-amber" title="${esc(r.noHandover)}">Skipped: ${esc(r.noHandover).slice(0,28)}</span>`:r.handover?'<span class="badge b-green">Given</span>':'<span style="color:var(--muted2)">Not needed</span>'},
      {key:'status',label:'STATUS',sortable:false,render:(_,r)=>r.out?'<span class="badge b-blue">Clocked out</span>':'<span class="badge b-green">On duty</span>'},
    ], data:att
  });
  return `
  <div class="page-head"><div><div class="ph-t" style="font-size:22px">Clock In / Out</div><div class="ph-s">Scan the QR at the lab with your phone. First scan clocks you in, next scan clocks you out. Lab Analysts give the shift handover before clocking out.</div></div></div>
  ${kpiRow([
    {l:'On Duty Now',v:String(onDuty.length),i:'user-check',s:'Clocked in, not out'},
    {l:'Clocked In Today',v:String(att.length),i:'log-in',s:fmtDate()},
    {l:'Clocked Out',v:String(att.filter(a=>a.out).length),i:'log-out',s:'Finished their shift'},
    {l:'Registered Phones',v:String(devs.length),i:'smartphone',s:'One phone per person'},
  ],4)}
  <div class="clock-grid">
    <div class="card clock-card">
      <div class="cc-ic"><i data-lucide="qr-code"></i></div>
      <div class="cc-t">QR station</div>
      <div class="cc-s">Open it on the screen at the lab entrance. The code changes every 30 seconds, so a photo of it can't be used later.</div>
      <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="openStation()"><i data-lucide="external-link"></i>Open QR station (new tab)</button>
    </div>
    <div class="card clock-card">
      <div class="cc-ic"><i data-lucide="smartphone"></i></div>
      <div class="cc-t">Registered phones</div>
      <div class="cc-s">${devs.length?`${devs.length} phone${devs.length>1?'s':''} linked to people. A phone is linked the first time it scans.`:'No phones yet. A phone is linked to its owner the first time it scans.'}</div>
      <button class="btn btn-out" onclick="devicesOpen()"><i data-lucide="list"></i>Manage phones</button>
    </div>
    <div class="card clock-card ${mine?'on':''}">
      <div class="cc-ic"><i data-lucide="${mine?'log-out':'log-in'}"></i></div>
      <div class="cc-t">${mine?'You are on duty':'Clock in here'}</div>
      <div class="cc-s">${mine?`Since ${String(mine.in).slice(-5)} · ${mine.shift} shift`:`Signed in as ${esc(myName())}.`}</div>
      <button class="btn ${mine?'btn-red':'btn-green'}" onclick="${mine?`requestClockOut('${jsq(meName)}','Web','modal')`:`clockIn('${jsq(meName)}','Web')`}"><i data-lucide="${mine?'log-out':'log-in'}"></i>${mine?'Clock out':'Clock in'}</button>
    </div>
  </div>
  <div class="card">${tbl}</div>`;
}

function clockIn(user, method){
  user=String(user).toUpperCase();
  if(openRecordFor(user)){ toast(`${titleCase(user)} is already clocked in`,'info'); return; }
  const r={id:seq('ATT-',DATA.attendance,'id',0),user,shift:currentShift(),in:fmtStamp(),inAt:Date.now(),out:'',method};
  DATA.attendance.unshift(r);
  audit('Clocked in','Clock In / Out',`${titleCase(user)} · ${r.shift} · ${method}`);
  if(state.route==='clock') render(); else persistSoon();
  return r;
}
function doClockOut(user, method, extra){
  const r=openRecordFor(user); if(!r) return null;
  r.out=fmtStamp(); r.outMethod=method; Object.assign(r,extra||{});
  audit('Clocked out','Clock In / Out',`${titleCase(user)} · ${hoursBetween(r.in,r.out)}${r.noHandover?' · no handover: '+r.noHandover:r.handover?' · handover given':''}`);
  if(state.route==='clock') render(); else persistSoon();
  return r;
}
/* clock out with the handover rule. ctx: 'modal' (in the app) or 'scan' (phone screen) */
function requestClockOut(user, method, ctx){
  user=String(user).toUpperCase();
  const rec=openRecordFor(user); if(!rec){ toast(`${titleCase(user)} is not clocked in`,'info'); return; }
  if(!needsHandover(user)||hasHandover(user,rec)){
    const r=doClockOut(user,method,{handover:needsHandover(user)});
    if(ctx==='scan') scanDone('out',user,r); else toast(`${titleCase(user)} clocked out · ${hoursBetween(r.in,r.out)}`,'ok');
    return;
  }
  const html=handoverGateHTML(user,method,ctx);
  if(ctx==='scan') scanPanel(html); else openModal({title:'Handover first', body:html, actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'}]});
}
function handoverGateHTML(user,method,ctx){
  return `<div class="hg">
    <div class="hg-t"><i data-lucide="clipboard-list"></i>${titleCase(user).split(' ')[0]}, give the shift handover before you clock out.</div>
    <div class="hg-opt">
      <button class="btn btn-green" onclick="handoverForm('${jsq(user)}','${method}','${ctx}')"><i data-lucide="pen-line"></i>I'll go back and give it</button>
    </div>
    <div class="hg-or"><span>or</span></div>
    <div class="form-row"><label>Reason for not giving a handover</label><textarea id="hg-reason" rows="2" placeholder="e.g. No open work, all samples completed and approved"></textarea></div>
    <button class="btn btn-out" style="width:100%;justify-content:center" onclick="skipHandover('${jsq(user)}','${method}','${ctx}')"><i data-lucide="circle-slash"></i>No need for handover</button>
  </div>`;
}
function skipHandover(user,method,ctx){
  const reason=((document.getElementById('hg-reason')||{}).value||'').trim();
  if(reason.length<5){ toast('Write the reason for not giving a handover','err'); const el=document.getElementById('hg-reason'); if(el) el.focus(); return; }
  const r=doClockOut(user,method,{noHandover:reason});
  notify(`${titleCase(user)} clocked out without handover`,reason,{icon:'clipboard-x',color:'#e0930b',route:'clock'});
  if(ctx==='scan') scanDone('out',user,r); else { closeModal(); toast(`${titleCase(user)} clocked out (no handover: reason saved)`,'warn'); }
}
function handoverForm(user,method,ctx){
  const rec=openRecordFor(user);
  const html=`<div class="hg">
    <div class="hg-t"><i data-lucide="clipboard-list"></i>Shift handover · ${titleCase(user)} · ${rec?rec.shift:currentShift()} shift</div>
    <div class="form-grid">
      <div class="form-row"><label>Samples planned</label><input id="ho-planned" inputmode="numeric" placeholder="e.g. 40"></div>
      <div class="form-row"><label>Samples completed</label><input id="ho-done" inputmode="numeric" placeholder="e.g. 36"></div>
    </div>
    <div class="form-row"><label>Open work for the next shift</label><textarea id="ho-open" rows="2" placeholder="Pending samples, retests, results waiting for review"></textarea></div>
    <div class="form-row"><label>Instruments and reagents</label><textarea id="ho-inst" rows="2" placeholder="Anything down, due, or running low"></textarea></div>
    <button class="btn btn-green" style="width:100%;justify-content:center" onclick="handoverSave('${jsq(user)}','${method}','${ctx}')"><i data-lucide="check"></i>Submit handover and clock out</button>
  </div>`;
  if(ctx==='scan') scanPanel(html); else openModal({title:'Shift handover', body:html, actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'}]});
}
function handoverSave(user,method,ctx){
  const v=k=>((document.getElementById(k)||{}).value||'').trim();
  if(!v('ho-open')){ toast('Write the open work for the next shift (or "none")','err'); return; }
  const rec=openRecordFor(user);
  const id=seq('SLB-',DATA.shiftlog,'id',5100);
  DATA.shiftlog.unshift({id,date:fmtDate(),shift:rec?rec.shift:currentShift(),supervisor:user,by:user,at:Date.now(),samples:parseInt(v('ho-planned'))||0,completed:parseInt(v('ho-done'))||0,
    remarks:v('ho-open')+(v('ho-inst')?' · Instruments: '+v('ho-inst'):'')});
  audit('Added shift handover','Shift Handover',`${id} · ${titleCase(user)}`);
  const r=doClockOut(user,method,{handover:id});
  if(ctx==='scan') scanDone('out',user,r); else { closeModal(); toast(`Handover ${id} saved. ${titleCase(user)} clocked out.`,'ok'); }
}
function attOpen(id){
  const r=(DATA.attendance||[]).find(x=>x.id===id); if(!r) return;
  openRecord(`${titleCase(r.user)} · ${r.shift} shift`,[['Clock in',r.in],['Clock out',r.out||'Still on duty'],['Hours',hoursBetween(r.in,r.out)],['Method',r.method+(r.outMethod?` / out: ${r.outMethod}`:'')],
    ['Handover',r.handover&&r.handover!==true?r.handover:r.handover?'Given':r.noHandover?'Skipped: '+esc(r.noHandover):'—']],
    r.out?[]:[{label:'Clock out',cls:'btn-red',icon:'log-out',fn:`closeDrawer();requestClockOut('${jsq(r.user)}','Supervisor','modal')`}]);
}
function toastAction(msg,label,fn){
  toast(msg,'ok');
  const host=document.getElementById('toast-host'); const t=host&&host.lastElementChild; if(!t) return;
  const b=document.createElement('button'); b.className='toast-act'; b.textContent=label; b.onclick=()=>{ try{ (new Function(fn))(); }catch(e){} t.remove(); };
  t.appendChild(b);
}

/* ---------- registered phones ---------- */
function devicesOpen(){
  const devs=DATA.devices||[];
  openModal({title:'Registered phones', wide:true, body: devs.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>PHONE ID</th><th>PERSON</th><th>ROLE</th><th>LINKED</th><th>LAST SCAN</th><th></th></tr></thead><tbody>
    ${devs.map(d=>`<tr><td><b style="color:var(--brand)">${d.id}</b></td><td>${titleCase(d.user)}</td><td>${roleOf(d.user)||'—'}</td><td style="color:var(--muted)">${d.at}</td><td style="color:var(--muted)">${d.last||'—'}</td><td><button class="btn btn-out btn-sm" onclick="deviceRemove('${d.id}')"><i data-lucide="unlink"></i>Unlink</button></td></tr>`).join('')}</tbody></table></div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:8px">Unlink a phone if it's lost or changed hands. The owner links a new phone with their next scan.</div>`
    :'<div class="empty" style="padding:30px">No phones linked yet. Each phone links to its owner on the first scan at the QR station.</div>'});
}
function deviceRemove(id){
  if(!can('Lab Supervisor','Unlinking a phone')) return;
  const i=(DATA.devices||[]).findIndex(d=>d.id===id); if(i<0) return;
  const d=DATA.devices.splice(i,1)[0]; audit('Unlinked phone','Clock In / Out',`${d.id} · ${titleCase(d.user)}`); devicesOpen(); render(); toast('Phone unlinked','info');
}

/* ---------- QR station (opened in its own tab at the lab entrance) ---------- */
function openStation(){
  const url=location.pathname+'#qr-station';
  const w=window.open(url,'_blank');
  if(!w){ location.hash='qr-station'; showStation(); }
  audit('Opened QR station','Clock In / Out');
}
let STATION_T=null, STATION_CODE='';
function showStation(){
  let host=document.getElementById('station'); if(!host){ host=document.createElement('div'); host.id='station'; document.body.appendChild(host); }
  host.classList.add('open');
  host.innerHTML=`<div class="st">
    <div class="st-top"><div class="ks-brand"><img src="assets/logo.jpg" alt=""><div><b>QC Laboratory</b><span>Descon Oxychem · Karian Wala</span></div></div>
      <div class="ks-clock" id="st-clock">${fmtTime()}</div></div>
    <div class="st-body">
      <div class="st-qr"><div id="st-qr" class="st-qrbox"></div><div class="st-bar"><i id="st-bar"></i></div><div class="st-note">Code refreshes every 30 seconds</div></div>
      <div class="st-side">
        <div class="st-h">Scan to clock in or out</div>
        <ol class="st-steps"><li>Open your phone camera</li><li>Point it at the code</li><li>First scan clocks you in. Next scan clocks you out.</li></ol>
        <div class="st-sub">Lab Analysts: give the shift handover when you clock out.</div>
        <div class="st-recent" id="st-recent"></div>
      </div>
    </div>
    <div class="st-foot"><a onclick="window.open(scanUrl(),'_blank')">Open the scan page on this computer</a><a onclick="closeStation()">Close station</a></div>
  </div>`;
  if(window.lucide) lucide.createIcons();
  stationTick(true);
  clearInterval(STATION_T); STATION_T=setInterval(()=>stationTick(false),1000);
}
async function stationTick(force){
  const c=document.getElementById('st-clock'); if(!c){ clearInterval(STATION_T); return; }
  c.textContent=fmtTime()+':'+pad2(new Date().getSeconds());
  const left=30-Math.floor((Date.now()%30000)/1000); const bar=document.getElementById('st-bar'); if(bar) bar.style.width=(left/30*100)+'%';
  const code=stationCode();
  if(force||code!==STATION_CODE){
    STATION_CODE=code;
    try{
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
      const box=document.getElementById('st-qr'); if(!box) return; box.innerHTML='';
      new QRCode(box,{text:scanUrl(),width:300,height:300,colorDark:'#0f1b2d',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
    }catch(e){ const box=document.getElementById('st-qr'); if(box) box.innerHTML='<div style="color:#0f1b2d;padding:20px">QR needs an internet connection</div>'; }
    const rec=document.getElementById('st-recent');
    if(rec){ const last=(DATA.attendance||[]).slice(0,5); rec.innerHTML=last.length?'<div class="st-rh">Recent</div>'+last.map(a=>`<div class="st-ri"><b>${titleCase(a.user)}</b><span>${a.out?'out '+String(a.out).slice(-5):'in '+String(a.in).slice(-5)}</span></div>`).join(''):''; }
  }
}
function closeStation(){ const h=document.getElementById('station'); if(h){ h.classList.remove('open'); h.innerHTML=''; } clearInterval(STATION_T); if(location.hash==='#qr-station'){ history.replaceState(null,'',location.pathname+'#clock'); state.route='clock'; render(); } }
/* compatibility: old buttons */
function qrShow(){ openStation(); }

/* ---------- the phone's scan page ---------- */
function showScan(code){
  let host=document.getElementById('scan-screen'); if(!host){ host=document.createElement('div'); host.id='scan-screen'; document.body.appendChild(host); }
  host.classList.add('open');
  const did=deviceId();
  const head=`<div class="sc-head"><img src="assets/logo.jpg" alt=""><div><b>Assure LIQS</b><span>Clock in / out</span></div></div>`;
  if(!validCode(code)){
    host.innerHTML=`<div class="sc">${head}<div class="sc-card bad"><i data-lucide="qr-code"></i><b>Scan the QR at the lab</b><span>This link has expired or wasn't opened from the QR station. Scan the live code on the lab screen.</span></div>
      <div class="sc-dev">Phone ID ${did}</div></div>`;
    if(window.lucide) lucide.createIcons(); return;
  }
  const owner=deviceOwner(did);
  if(!owner){
    const people=labPeople();
    host.innerHTML=`<div class="sc">${head}<div class="sc-card"><i data-lucide="smartphone"></i><b>Link this phone</b><span>First time on this phone. Pick your name once; after that every scan clocks you in or out automatically.</span></div>
      <div class="mini-search sc-search"><i data-lucide="search" style="width:14px"></i><input placeholder="Search your name" oninput="scanFilter(this.value)"></div>
      <div class="sc-list" id="sc-list">${people.map(u=>`<button class="sc-person" data-n="${esc(u.name.toLowerCase())}" onclick="scanLink('${u.id}','${jsq(code)}')"><span class="ks-av">${initialsOf(titleCase(u.name))}</span><div><b>${titleCase(u.name)}</b><span>${u.role}</span></div></button>`).join('')}</div>
      <div class="sc-dev">Phone ID ${did}</div></div>`;
    if(window.lucide) lucide.createIcons(); return;
  }
  owner.last=fmtStamp(); persistSoon();
  const user=owner.user;
  if(openRecordFor(user)){ host.innerHTML=`<div class="sc">${head}<div id="sc-panel"></div><div class="sc-dev">Phone ID ${did} · ${titleCase(user)}</div></div>`; requestClockOut(user,'QR · phone','scan'); }
  else { const r=clockIn(user,'QR · phone'); host.innerHTML=`<div class="sc">${head}<div id="sc-panel"></div><div class="sc-dev">Phone ID ${did} · ${titleCase(user)}</div></div>`; scanDone('in',user,r); }
}
function scanFilter(q){ q=q.toLowerCase(); document.querySelectorAll('.sc-person').forEach(b=>b.style.display=b.dataset.n.includes(q)?'':'none'); }
function scanLink(uid,code){
  const u=(DATA.users||[]).find(x=>x.id===uid); if(!u) return;
  DATA.devices=DATA.devices||[];
  const taken=DATA.devices.find(d=>d.user===u.name);
  if(taken){ toast(`${titleCase(u.name)} already has a linked phone. Ask a supervisor to unlink it first.`,'warn'); return; }
  DATA.devices.unshift({id:deviceId(),user:u.name,at:fmtStamp(),last:fmtStamp()});
  audit('Linked phone','Clock In / Out',`${deviceId()} · ${titleCase(u.name)}`);
  persist(); showScan(code);
}
function scanPanel(html){ const p=document.getElementById('sc-panel'); if(p){ p.innerHTML=html; if(window.lucide) lucide.createIcons(); } }
function scanDone(kind,user,r){
  scanPanel(`<div class="sc-card ${kind==='in'?'good':'out'}"><i data-lucide="${kind==='in'?'circle-check':'log-out'}"></i>
    <b>${kind==='in'?'Clocked in':'Clocked out'} · ${fmtTime()}</b>
    <span>${titleCase(user)} · ${r?r.shift:currentShift()} shift${kind==='out'&&r?' · '+hoursBetween(r.in,r.out)+' today':''}</span>
    ${kind==='out'&&r&&r.noHandover?`<span class="sc-warn">No handover · ${esc(r.noHandover)}</span>`:''}${kind==='out'&&r&&r.handover&&r.handover!==true?`<span class="sc-ok">Handover ${r.handover} saved</span>`:''}</div>
    <div class="sc-hint">You can close this page.</div>`);
}

/* open the station / scan screens from the URL */
function routeClockHash(){
  const h=location.hash.replace('#','');
  if(h==='qr-station') showStation();
  else if(h.startsWith('scan')) showScan(h.split(':')[1]||'');
}
document.addEventListener('DOMContentLoaded',routeClockHash);
window.addEventListener('hashchange',routeClockHash);

/* ---------- PIN pad (used by profile switching) ---------- */
let PIN={buf:'',cb:null,setFor:null,first:null};
function pinPad(title, sub, cb, setFor){
  PIN={buf:'',cb,setFor:setFor||null,first:null};
  let host=document.getElementById('pin-host'); if(!host){ host=document.createElement('div'); host.id='pin-host'; document.body.appendChild(host); }
  host.innerHTML=`<div class="pin-overlay" onclick="if(event.target===this)pinClose()"><div class="pin-card">
    <div class="pin-t" id="pin-t">${title}</div><div class="pin-s" id="pin-s">${sub||''}</div>
    <div class="pin-dots" id="pin-dots">${'<i></i>'.repeat(4)}</div>
    <div class="pin-pad">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':`<button onclick="pinKey('${k}')">${k}</button>`).join('')}</div>
    <button class="btn btn-out" style="width:100%;justify-content:center;margin-top:10px" onclick="pinClose()">Cancel</button></div></div>`;
  host.classList.add('open');
  document.addEventListener('keydown',pinKeyboard);
}
function pinKeyboard(e){ if(!document.getElementById('pin-host')?.classList.contains('open')) return; if(/^\d$/.test(e.key)) pinKey(e.key); else if(e.key==='Backspace') pinKey('⌫'); else if(e.key==='Escape') pinClose(); }
function pinClose(){ const h=document.getElementById('pin-host'); if(h){ h.classList.remove('open'); h.innerHTML=''; } document.removeEventListener('keydown',pinKeyboard); }
function pinKey(k){
  if(k==='⌫') PIN.buf=PIN.buf.slice(0,-1); else if(PIN.buf.length<4) PIN.buf+=k;
  document.querySelectorAll('#pin-dots i').forEach((d,i)=>d.classList.toggle('on',i<PIN.buf.length));
  if(PIN.buf.length===4){
    const v=PIN.buf; setTimeout(()=>{
      if(PIN.setFor){
        if(!PIN.first){ PIN.first=v; PIN.buf=''; document.getElementById('pin-t').textContent='Confirm your PIN'; document.getElementById('pin-s').textContent='Enter the same 4 digits again'; document.querySelectorAll('#pin-dots i').forEach(d=>d.classList.remove('on')); return; }
        if(PIN.first!==v){ pinShake('PINs did not match. Start again.'); PIN.first=null; document.getElementById('pin-t').textContent='Create your 4-digit PIN'; return; }
        DATA.pins[PIN.setFor]=pinHash(PIN.setFor,v); persistSoon(); audit('Set PIN','Security',PIN.setFor);
        const cb=PIN.cb; pinClose(); cb&&cb(true); return;
      }
      const cb=PIN.cb; const ok=cb&&cb(v);
      if(ok===false) pinShake('Wrong PIN. Try again.'); else pinClose();
    },120);
  }
}
function pinShake(msg){ PIN.buf=''; const c=document.querySelector('.pin-card'); if(c){ c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); }
  document.querySelectorAll('#pin-dots i').forEach(d=>d.classList.remove('on')); const s=document.getElementById('pin-s'); if(s) s.textContent=msg; }
/* ask for a user's PIN (or create it on first use); calls done() on success */
function withPin(u, title, done){
  if(!DATA.pins[u.id]){ pinPad('Create your 4-digit PIN',`First time for ${titleCase(u.name)}. You will use this PIN to clock in and switch profile.`,()=>done(),u.id); return; }
  pinPad(title,`${titleCase(u.name)} · enter your PIN`,v=>{ if(pinHash(u.id,v)!==DATA.pins[u.id]) return false; done(); return true; });
}

