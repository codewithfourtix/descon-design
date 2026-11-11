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
function uid(p,n){ return p+Date.now().toString(36).toUpperCase().slice(-(n||6))+Math.random().toString(36).slice(2,4).toUpperCase(); }

/* ---------- shared sync: every phone, station and computer sees the same clock-ins ----------
   Server: /api/clock (Vercel function + Upstash Redis). If it can't be reached, this browser
   keeps working on its own and sends its changes when the connection comes back. */
const CLOCK={live:null, ver:'', busy:null, last:0, merged:false};
async function clockApi(body){
  const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),8000);
  try{
    const r=await fetch('/api/clock'+(body?'':'?since='+encodeURIComponent(CLOCK.ver)),{method:body?'POST':'GET',
      headers:body?{'Content-Type':'application/json'}:{}, body:body?JSON.stringify(body):undefined, cache:'no-store', signal:ctl.signal});
    let j={}; try{ j=await r.json(); }catch(e){ j={ok:false}; }
    j.status=r.status; return j;
  }catch(e){ return {ok:false,status:0}; }
  finally{ clearTimeout(to); }
}
const clockStrip=o=>{ const c=Object.assign({},o); delete c.dirty; delete c.synced; return c; };
function clockDirty(){ return (DATA.attendance||[]).some(a=>a.dirty)||(DATA.devices||[]).some(d=>d.dirty)||(DATA.shiftlog||[]).some(l=>l.by&&l.at&&!l.synced); }
async function clockPushAll(){
  const jobs=[];
  (DATA.attendance||[]).filter(a=>a.dirty).forEach(a=>jobs.push({action:'attendance',record:a}));
  (DATA.devices||[]).filter(d=>d.dirty).forEach(d=>jobs.push({action:'link',device:d}));
  (DATA.shiftlog||[]).filter(l=>l.by&&l.at&&!l.synced).forEach(l=>jobs.push({action:'handover',log:l}));
  for(const job of jobs){
    const obj=job.record||job.device||job.log, key=job.record?'record':job.device?'device':'log';
    const j=await clockApi({action:job.action,[key]:clockStrip(obj)});
    if(j.ok){ delete obj.dirty; if(job.log) obj.synced=true; continue; }
    if(j.status===409){ DATA.devices=(DATA.devices||[]).filter(x=>x!==obj); toast(j.error,'warn'); continue; }
    if(j.status>=400&&j.status<500){ delete obj.dirty; if(job.log) obj.synced=true; continue; } /* rejected: don't retry forever */
    return false; /* offline or server down: keep the rest for later */
  }
  return true;
}
function clockSync(){
  if(CLOCK.busy) return CLOCK.busy.then(()=>clockSync());
  CLOCK.busy=(async()=>{
    try{
      const pushed=await clockPushAll();
      const j=await clockApi();
      if(!j.ok){ clockSetLive(false); return false; }
      clockSetLive(true);
      if(!j.same){ CLOCK.ver=j.ver; clockMerge(j); }
      return pushed;
    }finally{ CLOCK.last=Date.now(); CLOCK.busy=null; }
  })();
  return CLOCK.busy;
}
function clockSyncSoon(){ setTimeout(()=>clockSync(),50); }
function clockMerge(j){
  const before=JSON.stringify([DATA.attendance,DATA.devices]);
  const announce=CLOCK.merged, fresh=[];
  const local=new Map((DATA.attendance||[]).map(a=>[a.id,a]));
  const att=(j.attendance||[]).map(s=>{
    const l=local.get(s.id);
    if(l&&l.dirty&&(l.upd||0)>=(s.upd||0)) return l;
    if(announce&&(!l||(l.upd||0)<(s.upd||0))) fresh.push({s,l});
    return s;
  });
  const seen=new Set(att.map(a=>a.id));
  (DATA.attendance||[]).forEach(a=>{ if(a.dirty&&!seen.has(a.id)) att.push(a); });
  att.sort((x,y)=>(y.inAt||0)-(x.inAt||0));
  DATA.attendance=att;
  const mine=(DATA.devices||[]).filter(d=>d.dirty);
  DATA.devices=(j.devices||[]).filter(d=>!mine.some(x=>x.id===d.id)).concat(mine);
  DATA.shiftlog=DATA.shiftlog||[];
  (j.handovers||[]).forEach(h=>{ h.synced=true; const i=DATA.shiftlog.findIndex(l=>l.id===h.id); if(i<0) DATA.shiftlog.unshift(h); else Object.assign(DATA.shiftlog[i],h); });
  CLOCK.merged=true;
  fresh.forEach(({s,l})=>{
    const name=titleCase(s.user);
    if(s.out&&!(l&&l.out)){
      if(s.noHandover) notify(`${name} clocked out without handover`,s.noHandover,{icon:'clipboard-x',color:'#e0930b',route:'clock'});
      stationFlash(name,'out',s.out);
      if(state.route==='clock'&&!document.getElementById('station')?.classList.contains('open')) toast(`${name} clocked out · ${s.outMethod||s.method}`,'info');
    } else if(!l){
      stationFlash(name,'in',s.in);
      if(state.route==='clock'&&!document.getElementById('station')?.classList.contains('open')) toast(`${name} clocked in · ${s.method}`,'ok');
    }
  });
  if(JSON.stringify([DATA.attendance,DATA.devices])!==before){
    persistSoon(); stationRecent();
    if(state.route==='clock'&&SESSION&&!document.getElementById('scan-screen')?.classList.contains('open')) render();
  }
}
function clockSetLive(on){
  CLOCK.live=on;
  document.querySelectorAll('[data-clock-live]').forEach(el=>{ el.className='live-chip '+(on?'on':'off'); el.innerHTML=on?'<i></i>Live · all devices':'<i></i>This browser only'; });
}
function clockLiveChip(){ const on=CLOCK.live; return `<span data-clock-live class="live-chip ${on?'on':on===false?'off':''}"><i></i>${on?'Live · all devices':on===false?'This browser only':'Connecting…'}</span>`; }
/* poll: fast on the Clock page and the QR station, slow elsewhere, paused when the tab is hidden */
setInterval(()=>{
  if(document.hidden||CLOCK.busy) return;
  const fast=!!document.getElementById('st-clock')||(typeof state!=='undefined'&&state.route==='clock');
  const every=CLOCK.live===false?15000:fast?3000:30000;
  if(Date.now()-CLOCK.last>=every) clockSync();
},1000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&!CLOCK.busy) clockSync(); });
document.addEventListener('DOMContentLoaded',()=>{ if(!location.hash.startsWith('#scan')) clockSync(); });

/* ---------- rotating station code (a photo of the QR stops working after ~90 s) ---------- */
function stationCode(offset){ const w=Math.floor(Date.now()/30000)+(offset||0); return (w*7919%2176782336).toString(36).toUpperCase(); }
function validCode(c){ return [0,-1,-2,1].some(o=>stationCode(o)===String(c||'').toUpperCase()); }
function scanUrl(){ return location.origin+location.pathname+'#scan:'+stationCode(); }

function screenClock(){
  const t0=startOfToday();
  const att=(DATA.attendance||[]).filter(a=>!a.out||!a.inAt||a.inAt>=t0||(a.outAt||0)>=t0);
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
  <div class="page-head"><div><div class="ph-t" style="font-size:22px">Clock In / Out</div><div class="ph-s">Scan the QR at the lab with your phone. First scan clocks you in, next scan clocks you out. Lab Analysts give the shift handover before clocking out.</div></div><div>${clockLiveChip()}</div></div>
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
  const now=Date.now();
  const r={id:uid('ATT-'),user,shift:currentShift(),in:fmtStamp(),inAt:now,out:'',method,upd:now,dirty:true};
  DATA.attendance.unshift(r);
  audit('Clocked in','Clock In / Out',`${titleCase(user)} · ${r.shift} · ${method}`);
  if(state.route==='clock') render(); else persistSoon();
  clockSyncSoon(); stationRecent();
  return r;
}
function doClockOut(user, method, extra){
  const r=openRecordFor(user); if(!r) return null;
  const now=Date.now();
  r.out=fmtStamp(); r.outAt=now; r.outMethod=method; Object.assign(r,extra||{}); r.upd=now; r.dirty=true;
  audit('Clocked out','Clock In / Out',`${titleCase(user)} · ${hoursBetween(r.in,r.out)}${r.noHandover?' · no handover: '+r.noHandover:r.handover?' · handover given':''}`);
  if(state.route==='clock') render(); else persistSoon();
  clockSyncSoon(); stationRecent();
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
  const id=uid('SLB-',4);
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
    :'<div class="empty" style="padding:30px">No phones linked yet. Each phone links to its owner on the first scan at the QR station.</div>',
    actions: me().role==='Admin'&&CLOCK.live?[{label:'Clear all clock data',cls:'btn-out',icon:'eraser',fn:'clockResetAsk()'},{label:'Close',cls:'btn-out',fn:'closeModal()'}]:undefined});
}
async function deviceRemove(id){
  if(!can('Lab Supervisor','Unlinking a phone')) return;
  const i=(DATA.devices||[]).findIndex(d=>d.id===id); if(i<0) return;
  const d=DATA.devices[i];
  if(CLOCK.live&&!d.dirty){ const j=await clockApi({action:'unlink',id}); if(!j.ok){ toast("Couldn't reach the lab system. Try again.",'err'); return; } }
  DATA.devices=DATA.devices.filter(x=>x.id!==id); persistSoon();
  audit('Unlinked phone','Clock In / Out',`${d.id} · ${titleCase(d.user)}`); devicesOpen(); render(); toast('Phone unlinked','info');
}
function clockResetAsk(){
  confirmModal('Clear clock data','This removes every clock-in, clock-out, linked phone and handover saved from the QR system, on all devices. Use it to start a fresh demo.',async()=>{
    const j=await clockApi({action:'reset'});
    if(!j.ok){ toast("Couldn't reach the lab system",'err'); return; }
    DATA.attendance=[]; DATA.devices=[]; CLOCK.ver=''; CLOCK.merged=false; persistSoon();
    audit('Cleared clock data','Clock In / Out'); await clockSync(); render(); toast('Clock data cleared on all devices','ok');
  },'Clear everything','danger');
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
        <div style="margin-top:14px">${clockLiveChip()}</div>
      </div>
    </div>
    <div class="st-flash" id="st-flash"></div>
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
    stationRecent();
  }
}
/* last 5 scans, newest first (clock-ins and clock-outs) */
function stationRecent(){
  const rec=document.getElementById('st-recent'); if(!rec) return;
  const ev=[];
  (DATA.attendance||[]).forEach(a=>{ ev.push({u:a.user,k:'in',t:a.inAt||0,s:a.in}); if(a.out) ev.push({u:a.user,k:'out',t:a.outAt||a.upd||0,s:a.out}); });
  ev.sort((x,y)=>y.t-x.t);
  const last=ev.slice(0,5);
  rec.innerHTML=last.length?'<div class="st-rh">Recent scans</div>'+last.map(e=>`<div class="st-ri"><b>${titleCase(e.u)}</b><span class="${e.k}">${e.k==='in'?'In':'Out'} ${String(e.s).slice(-5)}</span></div>`).join(''):'';
}
/* big confirmation on the lab screen when a phone scan arrives */
let FLASH_T=null;
function stationFlash(name,kind,stamp){
  const f=document.getElementById('st-flash'); if(!f) return;
  f.className='st-flash show '+kind;
  f.innerHTML=`<b>${esc(name)}</b><span>${kind==='in'?'Clocked in':'Clocked out'} · ${String(stamp).slice(-5)}</span>`;
  clearTimeout(FLASH_T); FLASH_T=setTimeout(()=>{ f.className='st-flash'; },4500);
}
function closeStation(){ const h=document.getElementById('station'); if(h){ h.classList.remove('open'); h.innerHTML=''; } clearInterval(STATION_T); if(location.hash==='#qr-station'){ history.replaceState(null,'',location.pathname+'#clock'); state.route='clock'; render(); } }
/* compatibility: old buttons */
function qrShow(){ openStation(); }

/* ---------- the phone's scan page ---------- */
async function showScan(code, again){
  let host=document.getElementById('scan-screen'); if(!host){ host=document.createElement('div'); host.id='scan-screen'; document.body.appendChild(host); }
  host.classList.add('open');
  const did=deviceId();
  const head=`<div class="sc-head"><img src="assets/logo.jpg" alt=""><div><b>Assure LIQS</b><span>Clock in / out</span></div></div>`;
  if(!again&&!validCode(code)){
    host.innerHTML=`<div class="sc">${head}<div class="sc-card bad"><i data-lucide="qr-code"></i><b>Scan the QR at the lab</b><span>This link has expired or wasn't opened from the QR station. Scan the live code on the lab screen.</span></div>
      <div class="sc-dev">Phone ID ${did}</div></div>`;
    if(window.lucide) lucide.createIcons(); return;
  }
  host.innerHTML=`<div class="sc">${head}<div class="sc-card"><i data-lucide="loader" class="spin"></i><b>Checking…</b><span>Connecting to the lab system</span></div><div class="sc-dev">Phone ID ${did}</div></div>`;
  if(window.lucide) lucide.createIcons();
  await clockSync();
  const owner=deviceOwner(did);
  if(!owner){
    const people=labPeople();
    host.innerHTML=`<div class="sc">${head}<div class="sc-card"><i data-lucide="smartphone"></i><b>Link this phone</b><span>First time on this phone. Pick your name once; after that every scan clocks you in or out automatically.</span></div>
      <div class="mini-search sc-search"><i data-lucide="search" style="width:14px"></i><input placeholder="Search your name" oninput="scanFilter(this.value)"></div>
      <div class="sc-list" id="sc-list">${people.map(u=>`<button class="sc-person" data-n="${esc(u.name.toLowerCase())}" onclick="scanLink('${u.id}','${jsq(code)}')"><span class="ks-av">${initialsOf(titleCase(u.name))}</span><div><b>${titleCase(u.name)}</b><span>${u.role}</span></div></button>`).join('')}</div>
      <div class="sc-dev">Phone ID ${did}</div></div>`;
    if(window.lucide) lucide.createIcons(); return;
  }
  owner.last=fmtStamp(); owner.dirty=true; persistSoon();
  const user=owner.user;
  if(openRecordFor(user)){ host.innerHTML=`<div class="sc">${head}<div id="sc-panel"></div><div class="sc-dev">Phone ID ${did} · ${titleCase(user)}</div></div>`; requestClockOut(user,'QR · phone','scan'); }
  else { const r=clockIn(user,'QR · phone'); host.innerHTML=`<div class="sc">${head}<div id="sc-panel"></div><div class="sc-dev">Phone ID ${did} · ${titleCase(user)}</div></div>`; scanDone('in',user,r); }
}
function scanFilter(q){ q=q.toLowerCase(); document.querySelectorAll('.sc-person').forEach(b=>b.style.display=b.dataset.n.includes(q)?'':'none'); }
async function scanLink(userId,code){
  const u=(DATA.users||[]).find(x=>x.id===userId); if(!u) return;
  DATA.devices=DATA.devices||[];
  const taken=DATA.devices.find(d=>d.user===u.name);
  if(taken){ toast(`${titleCase(u.name)} already has a linked phone. Ask a supervisor to unlink it first.`,'warn'); return; }
  DATA.devices.unshift({id:deviceId(),user:u.name,at:fmtStamp(),last:fmtStamp(),dirty:true});
  audit('Linked phone','Clock In / Out',`${deviceId()} · ${titleCase(u.name)}`);
  persist(); await clockSync(); showScan(code,true);
}
function scanPanel(html){ const p=document.getElementById('sc-panel'); if(p){ p.innerHTML=html; if(window.lucide) lucide.createIcons(); } }
function scanDone(kind,user,r){
  scanPanel(`<div class="sc-card ${kind==='in'?'good':'out'}"><i data-lucide="${kind==='in'?'circle-check':'log-out'}"></i>
    <b>${kind==='in'?'Clocked in':'Clocked out'} · ${fmtTime()}</b>
    <span>${titleCase(user)} · ${r?r.shift:currentShift()} shift${kind==='out'&&r?' · '+hoursBetween(r.in,r.out)+' today':''}</span>
    ${kind==='out'&&r&&r.noHandover?`<span class="sc-warn">No handover · ${esc(r.noHandover)}</span>`:''}${kind==='out'&&r&&r.handover&&r.handover!==true?`<span class="sc-ok">Handover ${r.handover} saved</span>`:''}</div>
    <div class="sc-sync" id="sc-sync"><i data-lucide="loader" class="spin"></i>Sending to the lab system…</div>
    <div class="sc-hint">You can close this page.</div>`);
  clockSync().then(()=>{
    const el=document.getElementById('sc-sync'); if(!el) return;
    const ok=CLOCK.live&&!clockDirty();
    el.className='sc-sync '+(ok?'ok':'wait');
    el.innerHTML=ok?'<i data-lucide="check"></i>Sent. It shows on the lab screen now.':'<i data-lucide="wifi-off"></i>Saved on this phone. It will send when the phone is online.';
    if(window.lucide) lucide.createIcons();
  });
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

