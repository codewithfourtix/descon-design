/* ===== Operations & administration modules ===== */

function moduleShell(title, kpis, tableHTML, sub){
  return `
  <div style="display:flex;flex-direction:column;gap:16px;min-height:calc(100vh - 80px)">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div><div class="ph-t" style="font-size:20px">${title}</div>${sub?`<div class="ph-s">${sub}</div>`:''}</div>
      <button class="btn btn-out" onclick="exportPage('csv')"><i data-lucide="download"></i> Export</button>
    </div>
    ${kpis ? `<div style="margin-bottom:-6px">${kpis}</div>` : ''}
    <div class="card" style="flex:1;display:flex;flex-direction:column">${tableHTML}</div>
  </div>`;
}

/* ---------- Users & Roles ---------- */
const PERMS=[
  ['Enter results',['Lab Analyst','Senior Analyst','Lab Supervisor','QC Manager','Admin']],
  ['Approve results',['Lab Supervisor','QC Manager','Admin']],
  ['Release batches',['QC Manager','Admin']],
  ['Issue certificates (CoA)',['Lab Supervisor','QC Manager','Admin']],
  ['Close CAPAs',['QC Manager','Admin']],
  ['Approve documents',['QC Manager','Admin']],
  ['Complete audits',['Auditor','Lab Supervisor','QC Manager','Admin']],
  ['Manage users',['Admin']],
];
function screenUsers(){
  const active=DATA.users.filter(u=>u.status==='Active').length;
  const kpis=kpiRow([
    {l:'Total Users',v:String(DATA.users.length),i:'users',s:'All accounts'},
    {l:'Active',v:String(active),i:'user-check',s:'Currently enabled'},
    {l:'Inactive',v:String(DATA.users.length-active),i:'user-x',s:'Disabled'},
    {l:'Roles',v:String(ROLES.length),i:'shield',s:'Click to view permissions'},
  ],4).replace('<div class="kpi">'.repeat(1),'<div class="kpi">');
  const tbl=makeTable('users',{
    title:'System Users', pageSize:10, search:['name','email','role','dept'],
    toolbar:`<button class="btn btn-out" onclick="rolesMatrix()"><i data-lucide="shield"></i>Permissions</button><button class="btn btn-green" onclick="exportGeneric('users','users.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addUser()"><i data-lucide="plus"></i>Add User</button>`,
    onOpen:r=>openUser(r.id),
    columns:[
      {key:'id',label:'USER ID',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'name',label:'NAME',render:v=>titleCase(v)},
      {key:'email',label:'EMAIL',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'role',label:'ROLE',render:v=>`<span class="badge b-blue">${v}</span>`},
      {key:'dept',label:'DEPARTMENT'},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Active'?'b-green':'b-red'}">${v}</span>`},
      {key:'last',label:'LAST ACTIVE',align:'left'},
      {key:'x',label:'ACTIONS',sortable:false,align:'center',render:(_,r)=>rowActions('user',r.id)},
    ], data:DATA.users
  });
  return moduleShell('Users & Roles',kpis,tbl,'Accounts sign in with Microsoft Entra ID. Roles control who can approve, release and sign.');
}
function rolesMatrix(){
  openModal({title:'Roles & permissions', wide:true, body:`<div class="tbl-wrap"><table class="tbl perm"><thead><tr><th>PERMISSION</th>${ROLES.map(r=>`<th style="text-align:center">${r.replace(' ','<br>')}</th>`).join('')}</tr></thead>
    <tbody>${PERMS.map(([p,rs])=>`<tr><td style="font-weight:500;color:var(--ink)">${p}</td>${ROLES.map(r=>`<td style="text-align:center">${rs.includes(r)?'<i data-lucide="check" style="width:15px;color:#0a9d78"></i>':'<span style="color:var(--muted2)">—</span>'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div style="font-size:11.5px;color:var(--muted);margin-top:8px">You are signed in as <b>${me().role}</b>. Use <b>Switch role</b> in the profile menu to see the app as another role.</div>`});
}
function openUser(id){
  const u=DATA.users.find(x=>x.id===id); if(!u) return;
  openRecord(`${titleCase(u.name)}`,[['User ID',u.id],['Email',u.email],['Role',`<span class="badge b-blue">${u.role}</span>`],['Department',u.dept],['Status',u.status],['Last active',u.last],['Sign-in','Microsoft Entra ID (SSO + MFA)']],[
    {label:u.status==='Active'?'Deactivate':'Activate',cls:'btn-out',icon:u.status==='Active'?'user-x':'user-check',fn:`userToggle('${id}')`},
    {label:'Reset MFA',cls:'btn-out',icon:'key-round',fn:`userMfa('${id}')`},
    {label:'Edit',cls:'btn-green',icon:'pencil',fn:`editRow('user','${id}')`}]);
}
function userToggle(id){ if(!can('Admin','Changing user access')) return; const u=DATA.users.find(x=>x.id===id); u.status=u.status==='Active'?'Inactive':'Active'; audit(u.status==='Active'?'Activated user':'Deactivated user','Users',`${u.id} · ${u.name}`); render(); openUser(id); toast(`${titleCase(u.name)} ${u.status==='Active'?'activated':'deactivated'}`,'ok'); }
function userMfa(id){ if(!can('Admin','Resetting MFA')) return; const u=DATA.users.find(x=>x.id===id); audit('Reset MFA','Users',u.id); toast(`MFA reset. ${titleCase(u.name)} will re-register on next sign-in.`,'ok'); }

/* ---------- Instruments & Calibration ---------- */
function screenEquipment(){
  const op=DATA.equipment.filter(e=>e.status==='Operational').length;
  const kpis=kpiRow([
    {l:'Total Instruments',v:String(DATA.equipment.length),i:'settings-2',s:'Registered assets'},
    {l:'Operational',v:String(op),i:'circle-check',s:'Running normally'},
    {l:'Under Maintenance',v:String(DATA.equipment.filter(e=>e.status==='Under Maintenance').length),i:'wrench',s:'Being serviced'},
    {l:'Calibration Due',v:String(DATA.equipment.filter(e=>e.status==='Calibration Due').length),i:'triangle-alert',s:'Action required'},
  ],4);
  const tbl=makeTable('equip',{
    title:'Instrument Register', pageSize:10, search:['name','tag','location','status'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('equip','instruments.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addEquip()"><i data-lucide="plus"></i>Add Instrument</button>`,
    onOpen:r=>openEquip(r.id),
    columns:[
      {key:'id',label:'ASSET ID',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'name',label:'INSTRUMENT'},
      {key:'tag',label:'TAG',render:v=>`<span style="color:#4c6ef5;font-weight:600">${v}</span>`},
      {key:'location',label:'LOCATION'},
      {key:'status',label:'STATUS',render:v=>{const c={'Operational':'b-green','Under Maintenance':'b-amber','Calibration Due':'b-red'}[v];return `<span class="badge ${c}">${v}</span>`;}},
      {key:'lastCal',label:'LAST CAL'},
      {key:'nextCal',label:'NEXT CAL'},
      {key:'x',label:'ACTIONS',sortable:false,align:'center',render:(_,r)=>`<span style="display:inline-flex;gap:10px"><i data-lucide="gauge" title="Record calibration" style="width:14px;color:#0a9d78;cursor:pointer" onclick="calibrate('${r.id}')"></i>${rowActions('equip',r.id).replace('<span style="display:inline-flex;gap:10px" onclick="event.stopPropagation()">','').replace(/<\/span>$/,'')}</span>`},
    ], data:DATA.equipment
  });
  return moduleShell('Instruments & Calibration',kpis,tbl,'Calibration records feed straight into result approval: results from out-of-calibration instruments are blocked.');
}
function openEquip(id){
  const e=DATA.equipment.find(x=>x.id===id); if(!e) return;
  const hist=(e.cals||[]).map(c=>`<div class="hist"><b>${c.result} · cert ${esc(c.cert)}</b><span>${c.by} · ${c.at}</span></div>`).join('');
  openRecord(`${e.name} · ${e.tag}`,[['Asset ID',e.id],['Location',e.location],['Status',e.status],['Last calibration',e.lastCal],['Next calibration',e.nextCal]],[
    {label:'Record calibration',cls:'btn-green',icon:'gauge',fn:`calibrate('${id}')`},
    {label:e.status==='Under Maintenance'?'Return to service':'Send for maintenance',cls:'btn-out',icon:'wrench',fn:`equipMaint('${id}')`}],
    hist?`<div class="ctx-k" style="margin:12px 0 6px">Calibration history</div>${hist}`:'');
}
function calibrate(id){
  const e=DATA.equipment.find(x=>x.id===id); if(!e) return;
  openModal({title:'Record calibration · '+e.name, body:`
    <div class="form-row"><label>Calibration date</label><input id="cal-d" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
    <div class="form-row"><label>Certificate no.</label><input id="cal-c" placeholder="e.g. PCSIR-CAL-26-1182"></div>
    <div class="form-row"><label>Result</label><select id="cal-r"><option>Pass</option><option>Pass with adjustment</option><option>Fail</option></select></div>
    <div class="form-row"><label>Next due in</label><select id="cal-n"><option value="90">3 months</option><option value="180" selected>6 months</option><option value="365">12 months</option></select></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Save calibration',cls:'btn-green',icon:'check',fn:`calibrateGo('${id}')`}]});
}
function calibrateGo(id){
  const e=DATA.equipment.find(x=>x.id===id);
  const d=new Date((document.getElementById('cal-d').value||new Date().toISOString().slice(0,10))+'T00:00');
  const res=document.getElementById('cal-r').value, cert=document.getElementById('cal-c').value.trim()||('CAL-'+Math.floor(Math.random()*90000+10000));
  e.lastCal=fmtDate(d); e.nextCal=fmtDate(addDays(d,+document.getElementById('cal-n').value));
  e.status=res==='Fail'?'Under Maintenance':'Operational';
  e.cals=e.cals||[]; e.cals.unshift({result:res,cert,by:titleCase(myName()),at:fmtStamp()});
  audit('Recorded calibration','Instruments',`${e.id} ${e.name} · ${res} · ${cert}`);
  if(res==='Fail') notify(`${e.name} failed calibration`,`${e.tag} moved to maintenance`,{icon:'wrench',color:'#e03131',route:'equip'});
  closeModal(); closeDrawer(); render(); toast(`${e.name}: ${res}. Next due ${e.nextCal}.`,res==='Fail'?'warn':'ok');
}
function equipMaint(id){
  const e=DATA.equipment.find(x=>x.id===id);
  e.status=e.status==='Under Maintenance'?'Operational':'Under Maintenance';
  audit(e.status==='Operational'?'Returned instrument to service':'Sent instrument for maintenance','Instruments',`${e.id} ${e.name}`);
  render(); openEquip(id); toast(`${e.name} is now ${e.status}`,'ok');
}

/* ---------- Shift Handover ---------- */
function screenShiftLog(){
  const tbl=makeTable('shiftlog',{
    title:'Shift Handover Log', pageSize:10, search:['shift','supervisor','remarks','date'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('shiftlog','shift-log.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addLog()"><i data-lucide="plus"></i>New Handover</button>`,
    onOpen:r=>openLog(r.id),
    columns:[
      {key:'id',label:'LOG ID',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'date',label:'DATE'},
      {key:'shift',label:'SHIFT',render:v=>`<span class="badge b-teal-o">${v}</span>`},
      {key:'supervisor',label:'SUPERVISOR',render:v=>titleCase(v)},
      {key:'samples',label:'SAMPLES',align:'center'},
      {key:'completed',label:'COMPLETED',align:'center',render:v=>`<span style="color:#0a9d78;font-weight:600">${v}</span>`},
      {key:'remarks',label:'REMARKS',render:(v,r)=>`<span style="color:var(--muted)">${esc(v)}</span>${r.ack?' <span class="badge b-green">Acknowledged</span>':''}`},
    ], data:DATA.shiftlog
  });
  return moduleShell('Shift Handover Log','',tbl,'Outgoing supervisors hand over open work; the incoming shift acknowledges it.');
}
function openLog(id){
  const l=DATA.shiftlog.find(x=>x.id===id); if(!l) return;
  openRecord(`Handover ${l.id}`,[['Date',l.date],['Shift',l.shift],['Supervisor',titleCase(l.supervisor)],['Samples planned',l.samples],['Completed',l.completed],['Open',Math.max(0,l.samples-l.completed)],['Remarks',esc(l.remarks)],['Acknowledged',l.ack?`${l.ack}`:'Not yet']],
    l.ack?[]:[{label:'Acknowledge handover',cls:'btn-green',icon:'check',fn:`ackLog('${id}')`}]);
}
function ackLog(id){ const l=DATA.shiftlog.find(x=>x.id===id); l.ack=titleCase(myName())+' · '+fmtStamp(); audit('Acknowledged handover','Shift Handover',id); render(); openLog(id); toast('Handover acknowledged','ok'); }

/* ---------- Audit Trail ---------- */
function screenActivity(){
  const tbl=makeTable('activity',{
    title:'Audit Trail', pageSize:14, search:['user','action','module','ip','detail','time'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('activity','audit-trail.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'time',label:'TIMESTAMP',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'user',label:'USER',render:v=>titleCase(v)},
      {key:'action',label:'ACTION',render:v=>`<span class="badge b-blue">${v}</span>`},
      {key:'module',label:'MODULE'},
      {key:'detail',label:'DETAIL',render:v=>`<span style="color:var(--muted)">${esc(v||'')}</span>`},
      {key:'ip',label:'IP ADDRESS',render:v=>`<span style="color:var(--muted2)">${v}</span>`},
    ], data:DATA.activity
  });
  return moduleShell('Audit Trail','',tbl,`${DATA.activity.length} entries · every create, edit, approval, export and sign-in is recorded and cannot be edited (ISO/IEC 17025 clause 7.5).`);
}

/* ---------- Sample Register ---------- */
const REG_FLOW=['Registered','In Review','Completed','Approved'];
function screenRegistry(){
  const kpis=kpiRow([
    {l:'Registered Samples',v:String(DATA.registry.length),i:'database',s:'All entries'},
    {l:'Routine',v:String(DATA.registry.filter(r=>r.type==='Routine').length),i:'repeat',s:'Scheduled sampling'},
    {l:'Non-Routine',v:String(DATA.registry.filter(r=>r.type==='Non-Routine').length),i:'triangle-alert',s:'Ad-hoc requests'},
    {l:'Awaiting Approval',v:String(DATA.registry.filter(r=>r.status!=='Approved').length),i:'clock',s:'Not yet signed off'},
  ],4);
  const tbl=makeTable('registry',{
    title:'Sample Register', pageSize:12, search:['id','plant','source','status','by'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('registry','sample-register.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addRegistry()"><i data-lucide="plus"></i>Log Sample</button>`,
    onOpen:r=>openRegistry(r.id),
    columns:[
      {key:'id',label:'REG ID',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'plant',label:'PLANT',render:v=>`<span style="color:var(--brand);font-weight:600">${v}</span>`},
      {key:'source',label:'SOURCE'},
      {key:'type',label:'TYPE',render:v=>`<span class="badge ${v==='Special'?'b-amber':v==='Non-Routine'?'b-blue':'b-green'}">${v}</span>`},
      {key:'received',label:'RECEIVED'},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Approved'?'b-green':v==='Completed'?'b-blue':'b-teal-o'}">${v}</span>`},
      {key:'by',label:'REGISTERED BY',render:v=>titleCase(v)},
    ], data:DATA.registry
  });
  return moduleShell('Sample Register',kpis,tbl,'Every sample gets a unique ID and barcode label at the point of collection.');
}
function openRegistry(id){
  const r=DATA.registry.find(x=>x.id===id); if(!r) return;
  const i=REG_FLOW.indexOf(r.status); const nxt=REG_FLOW[i+1];
  openRecord(`Sample ${r.id}`,[['Plant',r.plant],['Source',r.source],['Type',r.type],['Received',r.received],['Status',r.status],['Registered by',titleCase(r.by)]],[
    ...(nxt?[{label:nxt==='Approved'?'Approve':'Move to '+nxt,cls:'btn-green',icon:nxt==='Approved'?'check-check':'arrow-right',fn:`regAdvance('${id}')`}]:[]),
    {label:'Print label',cls:'btn-out',icon:'printer',fn:`regLabel('${id}')`}],
    `<div class="tl">${REG_FLOW.map((s,k)=>`<div class="tl-step ${k<i?'done':k===i?'cur':''}"><span></span>${s}</div>`).join('')}</div>`);
}
function regAdvance(id){
  const r=DATA.registry.find(x=>x.id===id); const i=REG_FLOW.indexOf(r.status);
  if(REG_FLOW[i+1]==='Approved'&&!can('Lab Supervisor','Approving a sample')) return;
  r.status=REG_FLOW[i+1]; audit('Sample '+r.status.toLowerCase(),'Sample Register',id); render(); openRegistry(id); toast(`${id} is now ${r.status}`,'ok');
}
function barcodeSVG(text){
  let x=8, bars=''; const s=String(text);
  for(let i=0;i<s.length;i++){ const c=s.charCodeAt(i); for(let b=0;b<7;b++){ const w=((c>>b)&1)?3:1.4; if((b+i)%2===0) bars+=`<rect x="${x.toFixed(1)}" y="6" width="${w}" height="46" fill="#111"/>`; x+=w+1.2; } x+=2; }
  return `<svg viewBox="0 0 ${Math.ceil(x+8)} 58" width="100%" height="58" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}
function regLabel(id){
  const r=DATA.registry.find(x=>x.id===id); if(!r) return;
  openModal({title:'Sample label · '+id, body:`<div class="label-card" id="label-card">
      <div class="lc-top"><b>DESCON OXYCHEM · QC</b><span>${r.type}</span></div>
      ${barcodeSVG(r.id)}
      <div class="lc-id">${r.id}</div>
      <div class="lc-meta"><span>${r.plant} · ${esc(r.source)}</span><span>${r.received}</span></div>
    </div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Print',cls:'btn-green',icon:'printer',fn:`printLabel('${id}')`}]});
}
function printLabel(id){
  const el=document.getElementById('label-card'); if(!el) return;
  const w=window.open('','_blank','width=420,height=320'); if(!w){ toast('Allow pop-ups to print','warn'); return; }
  w.document.write(`<!doctype html><html><head><title>${id}</title><style>body{font-family:Arial;margin:16px}.label-card{border:1px solid #111;border-radius:6px;padding:10px;width:320px}.lc-top{display:flex;justify-content:space-between;font-size:11px}.lc-id{font:700 18px monospace;text-align:center;letter-spacing:2px}.lc-meta{display:flex;justify-content:space-between;font-size:10px;color:#333}</style></head><body>${el.outerHTML}</body></html>`);
  w.document.close(); setTimeout(()=>{ w.print(); },300); audit('Printed sample label','Sample Register',id);
}

/* ---------- Specifications ---------- */
function screenSpecs(){
  const kpis=kpiRow([
    {l:'Specifications',v:String(DATA.specs.length),i:'ruler',s:'Active parameters'},
    {l:'Streams Covered',v:String(new Set(DATA.specs.map(s=>s.stream)).size),i:'layers',s:'Product streams'},
    {l:'Approved',v:String(DATA.specs.filter(s=>s.status==='Approved').length),i:'circle-check',s:'Released to production'},
    {l:'Test Methods',v:String(new Set(DATA.specs.map(s=>s.method)).size),i:'flask-conical',s:'Referenced methods'},
  ],4);
  const tbl=makeTable('specs',{
    title:'Specifications & Limits', pageSize:12, search:['stream','point','parameter','method','id'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('specs','specifications.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addSpec()"><i data-lucide="plus"></i>New Specification</button>`,
    onOpen:r=>viewSpec(r.id),
    columns:[
      {key:'id',label:'SPEC ID',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'stream',label:'STREAM',render:v=>`<span style="color:var(--brand);font-weight:600">${v}</span>`},
      {key:'point',label:'SAMPLING POINT'},
      {key:'parameter',label:'PARAMETER'},
      {key:'unit',label:'UNIT',render:v=>`<span style="color:var(--muted)">${v||'—'}</span>`},
      {key:'limit',label:'SPEC LIMIT',render:v=>`<span style="font-weight:600">${v||'—'}</span>`},
      {key:'method',label:'TEST METHOD',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Approved'?'b-green':'b-amber'}">${v}</span>`},
    ], data:DATA.specs
  });
  return moduleShell('Specifications',kpis,tbl,'Limits here drive pass / fail checks in Result Entry, batch release and certificates.');
}
function viewSpec(id){
  const r=DATA.specs.find(x=>x.id===id); if(!r)return;
  openRecord('Specification '+id,[['Stream',r.stream],['Sampling point',r.point],['Parameter',`${r.parameter} (${r.unit||'—'})`],['Spec limit (lo–hi)',`${r.lo} – ${r.hi}`],['Alert / action limit',`${r.alo} – ${r.ahi}`],['Test method',r.method],['Status',r.status]],[
    {label:'Edit',cls:'btn-green',icon:'pencil',fn:`editSpec('${id}')`},{label:'Retire',cls:'btn-out',icon:'archive',fn:`retireSpec('${id}')`}]);
}
function editSpec(id){
  const r=DATA.specs.find(x=>x.id===id); if(!r) return;
  const f=[['point','Sampling point'],['parameter','Parameter'],['unit','Unit'],['lo','Lower limit'],['hi','Upper limit'],['alo','Alert low'],['ahi','Alert high'],['method','Test method']];
  openModal({title:'Edit '+id, wide:true, body:`<div class="form-grid">${f.map(([k,l])=>`<div class="form-row"><label>${l}</label><input id="sp-${k}" value="${esc(r[k])}"></div>`).join('')}</div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Save',cls:'btn-green',icon:'check',fn:`saveSpec('${id}')`}]});
}
function saveSpec(id){
  if(!can('QC Manager','Changing a specification')) return;
  const r=DATA.specs.find(x=>x.id===id);
  ['point','parameter','unit','lo','hi','alo','ahi','method'].forEach(k=>{ const el=document.getElementById('sp-'+k); if(el) r[k]=el.value.trim()||'—'; });
  r.limit=(r.lo!=='—'?r.lo:'')+((r.lo!=='—'&&r.hi!=='—')?' – ':'')+(r.hi!=='—'?r.hi:(r.lo!=='—'?' min':''));
  audit('Edited specification','Specifications',`${id} · ${r.parameter} ${r.limit}`); closeModal(); closeDrawer(); render(); toast('Specification '+id+' updated','ok');
}
function retireSpec(id){
  if(!can('QC Manager','Retiring a specification')) return;
  confirmModal('Retire specification',`Retire <b>${id}</b>? It stays in history but is no longer used for new results.`,()=>{ const r=DATA.specs.find(x=>x.id===id); r.status='Retired'; audit('Retired specification','Specifications',id); closeDrawer(); render(); toast(id+' retired','info'); },'Retire','danger');
}
function addSpec(){
  simpleAdd('New Specification',[
    {key:'stream',label:'Stream',opts:['Hydrogen Peroxide','Urea','Ammonia','Nitric Acid','CAN','NP / Agri','Utilities & Off-Gas']},
    {key:'point',label:'Sampling Point'},{key:'parameter',label:'Parameter'},{key:'unit',label:'Unit'},
    {key:'lo',label:'Lower Limit'},{key:'hi',label:'Upper Limit'},{key:'method',label:'Test Method'},
  ], v=>{
    const id=seq('SPEC-',DATA.specs,'id',100);
    DATA.specs.unshift({id,stream:v.stream,point:v.point||'—',parameter:v.parameter||'—',unit:v.unit,lo:v.lo||'—',hi:v.hi||'—',alo:v.lo||'—',ahi:v.hi||'—',method:v.method||'—',limit:(v.lo||'')+(v.lo&&v.hi?' – ':'')+(v.hi||(v.lo?' min':'')),status:'Approved'});
    audit('Added specification','Specifications',`${id} · ${v.parameter}`); toast('Specification '+id+' added','ok');
  });
}

/* ---------- Shift Scheduling ---------- */
function screenShiftMgmt(){
  const d=DATA.dash.shift; const ros=DATA.roster;
  const onDuty=ros.filter(r=>r.status==='On Duty').reduce((s,r)=>s+r.analysts.length+1,0);
  return `<div class="page-head"><div><div class="ph-t" style="font-size:22px">Shift Scheduling</div><div class="ph-s">Assign analysts to shifts. The roster drives who can enter and approve results on each shift.</div></div></div>
  ${kpiRow([
    {l:'Shifts',v:String(ros.length),i:'calendar-days',s:ros.map(r=>r.shift).join(' / ')},
    {l:'On Duty Now',v:String(onDuty),i:'users',s:'Supervisors + analysts'},
    {l:'Assigned Analysts',v:String(ros.reduce((s,r)=>s+r.analysts.length,0)),i:'clipboard-list',s:'Across all shifts'},
    {l:'Current Shift',v:currentShift(),i:'clock',s:'Based on the clock'},
  ],4)}
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div class="card"><div class="card-head"><div class="card-title">Shift Roster</div>
      <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="assignShift()"><i data-lucide="plus"></i>Assign</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>SHIFT</th><th>TIMING</th><th>SUPERVISOR</th><th style="text-align:center">ANALYSTS</th><th>STATUS</th></tr></thead><tbody>
      ${ros.map((r,i)=>`<tr class="clickable" onclick="openShift(${i})"><td><span class="badge b-teal-o">${r.shift}</span></td><td>${r.time}</td><td>${titleCase(r.supervisor)}</td><td style="text-align:center">${r.analysts.length}</td><td><span class="badge ${r.status==='On Duty'?'b-green':'b-blue'}">${r.status}</span></td></tr>`).join('')}
      </tbody></table></div></div>
    <div class="card"><div class="card-head"><div class="card-title">Shift Wise Samples &amp; Compliance</div></div>
      <div style="padding:2px 4px">${shiftTable(d)}</div></div>
  </div>`;
}
function openShift(i){
  const r=DATA.roster[i]; if(!r) return;
  openRecord(`${r.shift} shift · ${r.time}`,[['Supervisor',titleCase(r.supervisor)],['Status',r.status],['Analysts',String(r.analysts.length)]],
    [{label:'Assign analyst',cls:'btn-green',icon:'user-plus',fn:`assignShift('${r.shift}')`},{label:r.status==='On Duty'?'End shift':'Start shift',cls:'btn-out',icon:'clock',fn:`shiftToggle(${i})`}],
    `<div class="ctx-k" style="margin:12px 0 6px">On this shift</div>${r.analysts.map((a,k)=>`<div class="hist row"><b>${titleCase(a)}</b><i data-lucide="x" title="Remove" style="width:14px;cursor:pointer;color:var(--muted2)" onclick="unassign(${i},${k})"></i></div>`).join('')}`);
}
function shiftToggle(i){ const r=DATA.roster[i]; r.status=r.status==='On Duty'?'Scheduled':'On Duty'; audit(r.status==='On Duty'?'Started shift':'Ended shift','Shift Scheduling',r.shift); render(); openShift(i); toast(`${r.shift} shift ${r.status==='On Duty'?'started':'ended'}`,'ok'); }
function unassign(i,k){ const r=DATA.roster[i]; const a=r.analysts.splice(k,1)[0]; audit('Removed from shift','Shift Scheduling',`${a} · ${r.shift}`); render(); openShift(i); toast(`${titleCase(a)} removed from ${r.shift}`,'info'); }
function assignShift(pre){
  if(!can('Lab Supervisor','Changing the roster')) return;
  const users=DATA.users.filter(u=>u.status==='Active');
  openModal({title:'Assign analyst to shift', body:`
    <div class="form-row"><label>Shift</label><select id="as-s">${DATA.roster.map(r=>`<option ${r.shift===pre?'selected':''}>${r.shift}</option>`).join('')}</select></div>
    <div class="form-row"><label>Analyst</label><select id="as-a">${users.map(u=>`<option value="${esc(u.name)}">${titleCase(u.name)} · ${u.role}</option>`).join('')}</select></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Assign',cls:'btn-green',icon:'user-plus',fn:'assignGo()'}]});
}
function assignGo(){
  const s=document.getElementById('as-s').value, a=document.getElementById('as-a').value;
  const r=DATA.roster.find(x=>x.shift===s);
  if(r.analysts.includes(a)){ toast(`${titleCase(a)} is already on the ${s} shift`,'warn'); return; }
  r.analysts.push(a); audit('Assigned to shift','Shift Scheduling',`${a} → ${s}`); closeModal(); closeDrawer(); render(); toast(`${titleCase(a)} assigned to ${s}`,'ok');
}

/* ---------- Profile & Settings ---------- */
function screenProfile(){
  const s=me();
  return `<div class="page-head"><div><div class="ph-t" style="font-size:22px">Profile &amp; Settings</div><div class="ph-s">Changes are saved to your account and kept between sessions.</div></div></div>
  <div class="grid" style="grid-template-columns:1fr 2fr">
    <div class="card card-pad" style="text-align:center">
      <div class="avatar big" id="pf-av">${s.photo?`<img src="${s.photo}" alt="">`:initialsOf(s.name)}</div>
      <div style="font-weight:600;font-size:15px;color:var(--ink);margin-top:6px">${esc(s.name)}</div>
      <div style="color:var(--muted2);font-size:12px">${esc(s.email)}</div>
      <div style="margin-top:8px"><span class="badge b-blue">${esc(s.role)}</span></div>
      <input type="file" id="pf-photo" accept="image/*" style="display:none" onchange="profilePhoto(this.files)">
      <button class="btn btn-out" style="margin-top:14px;width:100%;justify-content:center" onclick="document.getElementById('pf-photo').click()"><i data-lucide="camera"></i>Change Photo</button>
      ${s.photo?`<button class="btn btn-out" style="margin-top:8px;width:100%;justify-content:center" onclick="profilePhotoRemove()"><i data-lucide="trash-2"></i>Remove Photo</button>`:''}
      <div style="font-size:11px;color:var(--muted2);margin-top:12px">Signed in ${s.since?relTime({at:s.since}):''} · Microsoft Entra ID</div>
    </div>
    <div class="card card-pad">
      <div style="font-weight:600;color:var(--ink);margin-bottom:12px">Account Details</div>
      <div class="form-grid">
        <div class="form-row"><label>Full Name</label><input id="pf-name" value="${esc(s.name)}"></div>
        <div class="form-row"><label>Email</label><input id="pf-email" value="${esc(s.email)}"></div>
        <div class="form-row"><label>Department</label><input id="pf-dept" value="${esc(s.dept||'Quality Control')}"></div>
        <div class="form-row"><label>Role</label><select id="pf-role">${ROLES.map(r=>`<option ${r===s.role?'selected':''}>${r}</option>`).join('')}</select></div>
        <div class="form-row"><label>Phone</label><input id="pf-phone" value="${esc(PREFS.phone)}"></div>
        <div class="form-row"><label>Language</label><select id="pf-lang">${['English','Urdu'].map(l=>`<option ${l===PREFS.lang?'selected':''}>${l}</option>`).join('')}</select></div>
      </div>
      <div style="font-weight:600;color:var(--ink);margin:8px 0 12px">Preferences</div>
      <label class="pref"><input type="checkbox" id="pf-oos" ${PREFS.offspecEmail?'checked':''}> Email me for off-spec results</label>
      <label class="pref"><input type="checkbox" id="pf-dig" ${PREFS.digest?'checked':''}> Daily compliance digest</label>
      <label class="pref"><input type="checkbox" id="pf-dark" ${PREFS.dark?'checked':''}> Dark mode</label>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button class="btn btn-out" onclick="render();toast('Changes discarded','info')">Cancel</button>
        <button class="btn btn-green" onclick="saveProfile()"><i data-lucide="check"></i>Save Changes</button>
      </div>
    </div>
  </div>

  ${renderIntegrations()}

  <div class="card card-pad" style="margin-top:16px">
    <div style="font-weight:600;color:var(--ink);margin-bottom:4px">Data &amp; backup</div>
    <div style="color:var(--muted);font-size:12px;margin-bottom:12px">Everything you create here is saved in this browser. Download a full backup, or restore the original sample data.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-out" onclick="exportAllData()"><i data-lucide="database-backup"></i>Download backup (JSON)</button>
      <button class="btn btn-red" onclick="resetAllData()"><i data-lucide="rotate-ccw"></i>Reset to sample data</button>
    </div>
  </div>`;
}
function saveProfile(){
  const v=k=>(document.getElementById(k)||{}).value||'';
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('pf-email'))){ toast('Enter a valid email','err'); return; }
  SESSION.name=v('pf-name').trim()||SESSION.name; SESSION.email=v('pf-email').trim(); SESSION.dept=v('pf-dept').trim();
  const role=v('pf-role'); if(role!==SESSION.role){ SESSION.role=role; audit('Switched role','Security',role); }
  saveSession();
  PREFS.phone=v('pf-phone'); PREFS.lang=v('pf-lang');
  PREFS.offspecEmail=document.getElementById('pf-oos').checked; PREFS.digest=document.getElementById('pf-dig').checked;
  const dark=document.getElementById('pf-dark').checked; if(dark!==PREFS.dark) toggleTheme();
  savePrefs();
  if(typeof OUTLOOK!=='undefined') OUTLOOK.account={name:SESSION.name,email:SESSION.email};
  audit('Updated profile','Settings',SESSION.email); updateIdentity(); render(); toast('Profile saved','ok');
}
function profilePhoto(files){
  const f=files&&files[0]; if(!f) return;
  if(f.size>3*1024*1024){ toast('Choose an image under 3 MB','err'); return; }
  const img=new Image(); const rd=new FileReader();
  rd.onload=()=>{ img.onload=()=>{ const c=document.createElement('canvas'); const s=160; c.width=s; c.height=s; const x=c.getContext('2d');
      const m=Math.min(img.width,img.height); x.drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,s,s);
      SESSION.photo=c.toDataURL('image/jpeg',0.85); saveSession(); audit('Changed profile photo','Settings'); updateIdentity(); render(); toast('Photo updated','ok'); };
    img.src=rd.result; };
  rd.readAsDataURL(f);
}
function profilePhotoRemove(){ SESSION.photo=null; saveSession(); updateIdentity(); render(); toast('Photo removed','info'); }

/* ---------- shared row actions + generic CRUD helpers ---------- */
function rowActions(kind,id){
  return `<span style="display:inline-flex;gap:10px" onclick="event.stopPropagation()">
    <i data-lucide="eye" style="width:14px;color:var(--brand);cursor:pointer" onclick="viewRow('${kind}','${id}')"></i>
    <i data-lucide="pencil" style="width:14px;color:#e08e0b;cursor:pointer" onclick="editRow('${kind}','${id}')"></i>
    <i data-lucide="trash-2" style="width:14px;color:#d64545;cursor:pointer" onclick="deleteRow('${kind}','${id}')"></i></span>`;
}
function findRow(kind,id){
  const map={user:DATA.users,equip:DATA.equipment};
  const arr=map[kind]; return {arr, row:arr.find(x=>x.id===id)};
}
function viewRow(kind,id){ if(kind==='user') return openUser(id); if(kind==='equip') return openEquip(id); }
const EDIT_LABELS={name:'Name',email:'Email',role:'Role',dept:'Department',status:'Status',last:'Last active',tag:'Tag',location:'Location',lastCal:'Last calibration',nextCal:'Next calibration'};
function editRow(kind,id){
  const {row}=findRow(kind,id); if(!row)return;
  const fields=Object.entries(row).filter(([k,v])=>k!=='id'&&typeof v!=='object');
  const sel={role:ROLES,status:kind==='user'?['Active','Inactive']:['Operational','Under Maintenance','Calibration Due'],dept:['Quality Control','Analytical Laboratory','Sampling','QA','Instrumentation']};
  const body=`<div class="form-grid">${fields.map(([k,v])=>`<div class="form-row"><label>${EDIT_LABELS[k]||k}</label>${sel[k]?`<select id="ef-${k}">${sel[k].map(o=>`<option ${o===v?'selected':''}>${o}</option>`).join('')}</select>`:`<input id="ef-${k}" value="${esc(v)}">`}</div>`).join('')}</div>`;
  window.__editCtx={kind,id};
  openModal({title:'Edit '+id, wide:true, body, actions:[
    {label:'Cancel',cls:'btn-out',fn:'closeModal()'},
    {label:'Save',cls:'btn-green',icon:'check',fn:'saveEdit()'}]});
}
function saveEdit(){
  const {kind,id}=window.__editCtx; const {row}=findRow(kind,id);
  if(kind==='user'&&!can('Admin','Editing users')) return;
  Object.keys(row).forEach(k=>{if(k==='id')return;const el=document.getElementById('ef-'+k);if(el)row[k]=el.value;});
  audit('Edited record','Admin',`${id}`); closeModal(); closeDrawer(); render(); toast('Record '+id+' updated','ok');
}
function deleteRow(kind,id){
  if(!can(kind==='user'?'Admin':'Lab Supervisor','Deleting records')) return;
  confirmModal('Delete record',`Delete <b>${id}</b>? The deletion is kept in the audit trail.`,()=>{
    const {arr}=findRow(kind,id); const i=arr.findIndex(x=>x.id===id); if(i>-1)arr.splice(i,1);
    audit('Deleted record','Admin',id); render(); toast('Record '+id+' deleted','ok');
  },'Delete','danger');
}
function exportGeneric(id,filename){
  const t=TBL[id]; if(!t){ toast('Nothing to export','info'); return; }
  const cfg=t.cfg; const rows=tblData(id);
  const cols=cfg.columns.filter(c=>c.key!=='x'&&!t.hidden.has(c.key));
  const val=v=>Array.isArray(v)?v.map(x=>typeof x==='object'?(x.param||JSON.stringify(x)):x).join('; '):(v&&typeof v==='object'?JSON.stringify(v):v);
  exportCSV(filename, cols.map(c=>c.label), rows.map(r=>cols.map(c=>c.key==='tests'&&Array.isArray(r.tests)?(()=>{const s=batchScore(r);return `${s.done}/${s.total}`;})():val(r[c.key]))));
  audit('Exported data','Reports',filename);
}

/* add-record modals */
function simpleAdd(title, fields, onAdd){
  const body=`<div class="form-grid">${fields.map(f=>`<div class="form-row"><label>${f.label}</label>${f.opts?`<select id="af-${f.key}">${f.opts.map(o=>`<option>${o}</option>`).join('')}</select>`:`<input id="af-${f.key}" placeholder="${f.ph||''}">`}</div>`).join('')}</div>`;
  window.__addFn=onAdd; window.__addFields=fields;
  openModal({title, wide:true, body, actions:[
    {label:'Cancel',cls:'btn-out',fn:'closeModal()'},
    {label:'Save',cls:'btn-green',icon:'check',fn:'commitAdd()'}]});
  setTimeout(()=>{ const first=document.querySelector('#modal-host input,#modal-host select'); if(first) first.focus(); },60);
}
function commitAdd(){
  const vals={}; window.__addFields.forEach(f=>{vals[f.key]=((document.getElementById('af-'+f.key)||{}).value||'').trim();});
  window.__addFn(vals); closeModal(); render();
}
function addUser(){
  if(!can('Admin','Adding users')) return;
  simpleAdd('Add User',[
  {key:'name',label:'Full Name'},{key:'email',label:'Work email',ph:'name@descon.com'},
  {key:'role',label:'Role',opts:ROLES},
  {key:'dept',label:'Department',opts:['Quality Control','Analytical Laboratory','Sampling','QA','Instrumentation']}],
  v=>{ const id=seq('USR-',DATA.users,'id',100);
    DATA.users.unshift({id,name:(v.name||'New User').toUpperCase(),email:v.email||((v.name||'new.user').toLowerCase().replace(/[^a-z]+/g,'.')+'@descon.com'),role:v.role,dept:v.dept,status:'Active',last:'Invited'});
    audit('Added user','Users',`${id} · ${v.name}`); toast('User added. An invitation was sent via Microsoft Entra ID.','ok'); }); }
function addEquip(){simpleAdd('Add Instrument',[
  {key:'name',label:'Instrument'},{key:'tag',label:'Tag'},
  {key:'location',label:'Location',opts:['Oxychem QC Lab — Sheikhupura','Central QC Lab — Lahore','Agri Lab — Kasur','Process Lab — Port Qasim']},
  {key:'status',label:'Status',opts:['Operational','Under Maintenance','Calibration Due']}],
  v=>{ const id=seq('EQP-',DATA.equipment,'id',300); DATA.equipment.unshift({id,name:v.name||'New Instrument',tag:v.tag||'NEW-00',location:v.location,status:v.status,lastCal:'—',nextCal:'—'}); audit('Added instrument','Instruments',`${id} · ${v.name}`); toast('Instrument '+id+' added','ok');});}
function addLog(){simpleAdd('New Shift Handover',[
  {key:'shift',label:'Shift',opts:['Morning','Evening','Night','General']},{key:'samples',label:'Samples planned',ph:'e.g. 40'},{key:'completed',label:'Completed',ph:'e.g. 36'},{key:'remarks',label:'Handover notes',ph:'Open work, instrument issues, reagents'}],
  v=>{ const id=(typeof uid==='function'?uid('SLB-',4):seq('SLB-',DATA.shiftlog,'id',5100)); DATA.shiftlog.unshift({id,date:fmtDate(),shift:v.shift,supervisor:myName().toUpperCase(),by:myName().toUpperCase(),at:Date.now(),samples:parseInt(v.samples)||0,completed:parseInt(v.completed)||0,remarks:v.remarks||'—'}); audit('Added shift handover','Shift Handover',id); toast('Handover '+id+' logged','ok');});}
function addRegistry(){simpleAdd('Log Sample',[
  {key:'plant',label:'Plant',opts:['UREA','NP','OU','CAN','Ammonia','Nitric Acid','H2O2']},{key:'source',label:'Source / sampling point',ph:'e.g. Pool Reactor'},
  {key:'type',label:'Type',opts:['Routine','Non-Routine','Special']}],
  v=>{ const id=seq('REG-',DATA.registry,'id',9000); DATA.registry.unshift({id,plant:v.plant,source:v.source||'—',type:v.type,received:fmtStamp(),status:'Registered',by:myName().toUpperCase()}); audit('Logged sample','Sample Register',`${id} · ${v.plant} ${v.source}`); toast('Sample '+id+' registered','ok'); setTimeout(()=>regLabel(id),300);});}
