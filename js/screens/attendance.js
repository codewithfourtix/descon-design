/* ===== Clock In / Out (lab tablet, QR on mobile, or one click) + PIN pad ===== */

const LAB_ROLES=['Lab Analyst','Senior Analyst','Lab Supervisor','QC Manager'];
function pinHash(id,pin){ let h=5381; const s=id+':'+pin; for(let i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))>>>0; return h.toString(36); }
function labPeople(){ return (DATA.users||[]).filter(u=>u.status==='Active'&&LAB_ROLES.includes(u.role)); }
function openRecordFor(name){ return (DATA.attendance||[]).find(a=>a.user===name&&!a.out); }
function hoursBetween(a,b){ const p=s=>{ const m=String(s).match(/(\d{1,2}):(\d{2})$/); return m?(+m[1])*60+(+m[2]):null; }; const x=p(a), y=b?p(b):(new Date().getHours()*60+new Date().getMinutes()); if(x==null||y==null) return ''; let d=y-x; if(d<0) d+=1440; return (d/60).toFixed(1)+' h'; }

function screenClock(){
  const att=DATA.attendance||[];
  const onDuty=att.filter(a=>!a.out);
  const meName=myName().toUpperCase();
  const mine=openRecordFor(meName)||openRecordFor(myName());
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
      {key:'status',label:'STATUS',sortable:false,render:(_,r)=>r.out?'<span class="badge b-blue">Clocked out</span>':'<span class="badge b-green">On duty</span>'},
    ], data:att
  });
  return `
  <div class="page-head"><div><div class="ph-t" style="font-size:22px">Clock In / Out</div><div class="ph-s">Three ways to clock in: the lab tablet, a QR code on your phone, or one click here. Works on the Descon network.</div></div></div>
  ${kpiRow([
    {l:'On Duty Now',v:String(onDuty.length),i:'user-check',s:'Clocked in, not out'},
    {l:'Clocked In Today',v:String(att.length),i:'log-in',s:fmtDate()},
    {l:'Clocked Out',v:String(att.filter(a=>a.out).length),i:'log-out',s:'Finished their shift'},
    {l:'Current Shift',v:currentShift(),i:'clock',s:'From the clock'},
  ],4)}
  <div class="clock-grid">
    <div class="card clock-card">
      <div class="cc-ic"><i data-lucide="tablet-smartphone"></i></div>
      <div class="cc-t">Lab tablet</div>
      <div class="cc-s">Big buttons on a shared tablet. Tap your name, enter your 4-digit PIN.</div>
      <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="kioskOpen()"><i data-lucide="maximize"></i>Open tablet mode</button>
    </div>
    <div class="card clock-card">
      <div class="cc-ic"><i data-lucide="qr-code"></i></div>
      <div class="cc-t">QR on mobile</div>
      <div class="cc-s">Scan the lab QR code with your phone camera, then sign in once.</div>
      <button class="btn btn-out" onclick="qrShow()"><i data-lucide="qr-code"></i>Show lab QR code</button>
    </div>
    <div class="card clock-card ${mine?'on':''}">
      <div class="cc-ic"><i data-lucide="${mine?'log-out':'log-in'}"></i></div>
      <div class="cc-t">${mine?'You are on duty':'Clock in here'}</div>
      <div class="cc-s">${mine?`Since ${String(mine.in).slice(-5)} · ${mine.shift} shift`:`Signed in as ${esc(myName())}.`}</div>
      <button class="btn ${mine?'btn-red':'btn-green'}" onclick="${mine?`clockOut('${jsq(mine.user)}','Web')`:`clockIn('${jsq(meName)}','Web')`}"><i data-lucide="${mine?'log-out':'log-in'}"></i>${mine?'Clock out':'Clock in'}</button>
    </div>
  </div>
  <div class="card">${tbl}</div>`;
}
function clockIn(user, method){
  if(openRecordFor(user)){ toast(`${titleCase(user)} is already clocked in`,'info'); return; }
  const r={id:seq('ATT-',DATA.attendance,'id',0),user,shift:currentShift(),in:fmtStamp(),out:'',method};
  DATA.attendance.unshift(r);
  audit('Clocked in','Clock In / Out',`${titleCase(user)} · ${r.shift} · ${method}`);
  if(state.route==='clock') render(); else persistSoon();
  return r;
}
function clockOut(user, method, quiet){
  const r=openRecordFor(user); if(!r){ toast(`${titleCase(user)} is not clocked in`,'info'); return; }
  r.out=fmtStamp(); r.outMethod=method;
  audit('Clocked out','Clock In / Out',`${titleCase(user)} · ${hoursBetween(r.in,r.out)}`);
  if(state.route==='clock') render(); else persistSoon();
  if(!quiet) toastAction(`${titleCase(user)} clocked out. Write the shift handover?`,'Write handover',"go('shiftlog');setTimeout(addLog,200)");
  return r;
}
function attOpen(id){
  const r=(DATA.attendance||[]).find(x=>x.id===id); if(!r) return;
  openRecord(`${titleCase(r.user)} · ${r.shift} shift`,[['Clock in',r.in],['Clock out',r.out||'Still on duty'],['Hours',hoursBetween(r.in,r.out)],['Method',r.method+(r.outMethod?` / out: ${r.outMethod}`:'')]],
    r.out?[]:[{label:'Clock out now',cls:'btn-red',icon:'log-out',fn:`closeDrawer();clockOut('${jsq(r.user)}','Supervisor')`}]);
}
function toastAction(msg,label,fn){
  toast(msg,'ok');
  const host=document.getElementById('toast-host'); const t=host&&host.lastElementChild; if(!t) return;
  const b=document.createElement('button'); b.className='toast-act'; b.textContent=label; b.onclick=()=>{ try{ (new Function(fn))(); }catch(e){} t.remove(); };
  t.appendChild(b);
}

/* ---------- QR clock-in ---------- */
async function qrShow(){
  const url=location.origin+location.pathname+'#clock';
  openModal({title:'Lab QR code · Clock in', body:`
    <div class="qr-wrap"><div id="qr-box" class="qr-box"></div>
      <div class="qr-txt"><b>Descon Oxychem · QC Lab</b><span>Point your phone camera at the code. It opens Clock In / Out; sign in once with Microsoft and tap Clock in.</span><span class="qr-url">${esc(url)}</span></div></div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Print poster',cls:'btn-green',icon:'printer',fn:'qrPrint()'}]});
  try{
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
    const box=document.getElementById('qr-box'); if(!box) return; box.innerHTML='';
    new QRCode(box,{text:url,width:200,height:200,colorDark:'#0f1b2d',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
  }catch(e){ const box=document.getElementById('qr-box'); if(box) box.innerHTML='<div class="empty" style="padding:20px">QR needs an internet connection</div>'; }
}
function qrPrint(){
  const box=document.getElementById('qr-box'); if(!box) return;
  const img=box.querySelector('img,canvas'); const src=img?(img.tagName==='CANVAS'?img.toDataURL():img.src):'';
  const w=window.open('','_blank','width=600,height=800'); if(!w){ toast('Allow pop-ups to print','warn'); return; }
  w.document.write(`<!doctype html><html><head><title>Clock in QR</title><style>body{font-family:Arial;text-align:center;padding:40px}h1{font-size:28px;margin:0 0 6px}p{color:#555}</style></head><body><h1>Clock in / out</h1><p>Descon Oxychem · QC Laboratory</p><img src="${src}" style="width:320px;height:320px;margin:24px auto;display:block"><p>Scan with your phone camera</p></body></html>`);
  w.document.close(); setTimeout(()=>w.print(),400);
  audit('Printed clock-in QR','Clock In / Out');
}

/* ---------- PIN pad (used by the tablet and by profile switching) ---------- */
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

/* ---------- Tablet (kiosk) mode ---------- */
function kioskOpen(){
  let host=document.getElementById('kiosk'); if(!host){ host=document.createElement('div'); host.id='kiosk'; document.body.appendChild(host); }
  host.classList.add('open'); kioskDraw();
  audit('Opened tablet clock-in','Clock In / Out');
  clearInterval(window.__kioskT); window.__kioskT=setInterval(()=>{ const c=document.getElementById('ks-clock'); if(c) c.textContent=fmtTime()+':'+pad2(new Date().getSeconds()); else clearInterval(window.__kioskT); },1000);
}
function kioskDraw(msg){
  const host=document.getElementById('kiosk'); if(!host) return;
  const people=labPeople();
  host.innerHTML=`<div class="ks">
    <div class="ks-top"><div class="ks-brand"><img src="assets/logo.jpg" alt=""><div><b>QC Laboratory</b><span>Clock in / out · ${currentShift()} shift</span></div></div>
      <div class="ks-clock" id="ks-clock">${fmtTime()}</div>
      <button class="ks-exit" onclick="kioskClose()"><i data-lucide="x"></i>Exit tablet mode</button></div>
    ${msg?`<div class="ks-msg ${msg.cls}"><i data-lucide="${msg.ic}"></i><div><b>${msg.t}</b><span>${msg.s}</span></div></div>`:`<div class="ks-hint">Tap your name</div>`}
    <div class="ks-grid">${people.map(u=>{ const on=openRecordFor(u.name); return `<button class="ks-tile ${on?'on':''}" onclick="kioskPick('${u.id}')">
      <span class="ks-av">${initialsOf(titleCase(u.name))}</span><b>${titleCase(u.name)}</b><span>${on?'On duty since '+String(on.in).slice(-5):u.role}</span></button>`; }).join('')}</div>
  </div>`;
  if(window.lucide) lucide.createIcons();
}
function kioskPick(id){
  const u=(DATA.users||[]).find(x=>x.id===id); if(!u) return;
  const on=openRecordFor(u.name);
  withPin(u, on?'Clock out':'Clock in', ()=>{
    const r=on?clockOut(u.name,'Lab tablet',true):clockIn(u.name,'Lab tablet');
    kioskDraw(on?{cls:'out',ic:'log-out',t:`Goodbye, ${titleCase(u.name).split(' ')[0]}`,s:`Clocked out at ${fmtTime()} · ${hoursBetween(r.in,r.out)} today`}
                :{cls:'in',ic:'circle-check',t:`Welcome, ${titleCase(u.name).split(' ')[0]}`,s:`Clocked in at ${fmtTime()} · ${r.shift} shift`});
    clearTimeout(window.__kioskMsg); window.__kioskMsg=setTimeout(()=>kioskDraw(),3500);
  });
}
function kioskClose(){ const h=document.getElementById('kiosk'); if(h){ h.classList.remove('open'); h.innerHTML=''; } clearInterval(window.__kioskT); if(state.route==='clock') render(); }
