/* ===== Additional functional modules ===== */

function moduleShell(title, kpis, tableId){
  return `
  <div style="display:flex;flex-direction:column;gap:16px;height:calc(100vh - 80px)">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="font-size:20px;font-weight:700;color:var(--ink)">${title}</div>
      <button class="btn btn-out" onclick="toast('Exporting data...')"><i data-lucide="download"></i> Export</button>
    </div>
    ${kpis ? `<div style="margin-bottom:-6px">${kpis}</div>` : ''}
    <div class="card" style="flex:1;display:flex;flex-direction:column">
      ${tableId}
    </div>
  </div>`;
}

/* ---------- User Management ---------- */
function screenUsers(){
  const active=DATA.users.filter(u=>u.status==='Active').length;
  const kpis=kpiRow([
    {l:'Total Users',v:String(DATA.users.length),i:'users',s:'All accounts'},
    {l:'Active',v:String(active),i:'user-check',s:'Currently enabled'},
    {l:'Inactive',v:String(DATA.users.length-active),i:'user-x',s:'Disabled'},
    {l:'Roles',v:'6',i:'shield',s:'Defined access levels'},
  ],4);
  const tbl=makeTable('users',{
    title:'System Users', pageSize:10, search:['name','email','role','dept'],
    toolbar:`<button class="btn btn-blue" onclick="addUser()"><i data-lucide="plus"></i>Add User</button><button class="btn btn-green" onclick="exportUsers()"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'USER ID',render:v=>`<b style="color:#0060b0">${v}</b>`},
      {key:'name',label:'NAME'},
      {key:'email',label:'EMAIL',render:v=>`<span style="color:#6b7280">${v}</span>`},
      {key:'role',label:'ROLE',render:v=>`<span class="badge b-blue">${v}</span>`},
      {key:'dept',label:'DEPARTMENT'},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Active'?'b-green':'b-red'}">${v}</span>`},
      {key:'last',label:'LAST ACTIVE',align:'left'},
      {key:'x',label:'ACTIONS',sortable:false,align:'center',render:(_,r)=>rowActions('user',r.id)},
    ], data:DATA.users
  });
  return moduleShell('Users & Roles',kpis,tbl);
}

/* ---------- Equipment ---------- */
function screenEquipment(){
  const op=DATA.equipment.filter(e=>e.status==='Operational').length;
  const kpis=kpiRow([
    {l:'Total Equipment',v:String(DATA.equipment.length),i:'settings-2',s:'Registered assets'},
    {l:'Operational',v:String(op),i:'circle-check',s:'Running normally'},
    {l:'Under Maintenance',v:String(DATA.equipment.filter(e=>e.status==='Under Maintenance').length),i:'wrench',s:'Being serviced'},
    {l:'Calibration Due',v:String(DATA.equipment.filter(e=>e.status==='Calibration Due').length),i:'triangle-alert',s:'Action required'},
  ],4);
  const tbl=makeTable('equip',{
    title:'Equipment Register', pageSize:10, search:['name','tag','location','status'],
    toolbar:`<button class="btn btn-blue" onclick="addEquip()"><i data-lucide="plus"></i>Add Equipment</button><button class="btn btn-green" onclick="exportGeneric('equip','equipment.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'ASSET ID',render:v=>`<b style="color:#0060b0">${v}</b>`},
      {key:'name',label:'EQUIPMENT'},
      {key:'tag',label:'TAG',render:v=>`<span style="color:#4c6ef5;font-weight:600">${v}</span>`},
      {key:'location',label:'LOCATION'},
      {key:'status',label:'STATUS',render:v=>{const c={'Operational':'b-green','Under Maintenance':'b-amber','Calibration Due':'b-red'}[v];return `<span class="badge ${c}">${v}</span>`;}},
      {key:'lastCal',label:'LAST CAL'},
      {key:'nextCal',label:'NEXT CAL'},
      {key:'x',label:'ACTIONS',sortable:false,align:'center',render:(_,r)=>rowActions('equip',r.id)},
    ], data:DATA.equipment
  });
  return moduleShell('Instruments & Calibration',kpis,tbl);
}

/* ---------- Shift Handover Log ---------- */
function screenShiftLog(){
  const tbl=makeTable('shiftlog',{
    title:'Shift Handover Log', pageSize:10, search:['shift','supervisor','remarks','date'],
    toolbar:`<button class="btn btn-blue" onclick="addLog()"><i data-lucide="plus"></i>New Entry</button><button class="btn btn-green" onclick="exportGeneric('shiftlog','shift-log.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'LOG ID',render:v=>`<b style="color:#0060b0">${v}</b>`},
      {key:'date',label:'DATE'},
      {key:'shift',label:'SHIFT',render:v=>`<span class="badge b-teal-o">${v}</span>`},
      {key:'supervisor',label:'SUPERVISOR'},
      {key:'samples',label:'SAMPLES',align:'center'},
      {key:'completed',label:'COMPLETED',align:'center',render:v=>`<span style="color:#0a9d78;font-weight:600">${v}</span>`},
      {key:'remarks',label:'REMARKS',render:v=>`<span style="color:#6b7280">${v}</span>`},
    ], data:DATA.shiftlog
  });
  return moduleShell('Shift Handover Log','',tbl);
}

/* ---------- Audit Trail ---------- */
function screenActivity(){
  const tbl=makeTable('activity',{
    title:'Audit Trail', pageSize:12, search:['user','action','module','ip'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('activity','activity-logs.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'time',label:'TIMESTAMP',render:v=>`<span style="color:#6b7280">${v}</span>`},
      {key:'user',label:'USER'},
      {key:'action',label:'ACTION',render:v=>`<span class="badge b-blue">${v}</span>`},
      {key:'module',label:'MODULE'},
      {key:'ip',label:'IP ADDRESS',render:v=>`<span style="color:#9aa3af">${v}</span>`},
    ], data:DATA.activity
  });
  return moduleShell('Audit Trail','',tbl);
}

/* ---------- Sample Registry ---------- */
function screenRegistry(){
  const kpis=kpiRow([
    {l:'Registered Samples',v:String(DATA.registry.length),i:'database',s:'All entries'},
    {l:'Routine',v:String(DATA.registry.filter(r=>r.type==='Routine').length),i:'repeat',s:''},
    {l:'Non-Routine',v:String(DATA.registry.filter(r=>r.type==='Non-Routine').length),i:'triangle-alert',s:''},
    {l:'Special',v:String(DATA.registry.filter(r=>r.type==='Special').length),i:'flask-round',s:''},
  ],4);
  const tbl=makeTable('registry',{
    title:'Sample Register', pageSize:12, search:['id','plant','source','status','by'],
    toolbar:`<button class="btn btn-blue" onclick="addRegistry()"><i data-lucide="plus"></i>Log Sample</button><button class="btn btn-green" onclick="exportGeneric('registry','sample-registry.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'REG ID',render:v=>`<b style="color:#0060b0">${v}</b>`},
      {key:'plant',label:'PLANT',render:v=>`<span style="color:#0060b0;font-weight:600">${v}</span>`},
      {key:'source',label:'SOURCE'},
      {key:'type',label:'TYPE',render:v=>`<span class="badge ${v==='Special'?'b-amber':v==='Non-Routine'?'b-blue':'b-green'}">${v}</span>`},
      {key:'received',label:'RECEIVED'},
      {key:'status',label:'STATUS',render:v=>`<span class="badge b-teal-o">${v}</span>`},
      {key:'by',label:'REGISTERED BY'},
    ], data:DATA.registry
  });
  return moduleShell('Sample Register',kpis,tbl);
}

/* ---------- Specifications (standard LIMS spec/limits register) ---------- */
function screenSpecs(){
  const kpis=kpiRow([
    {l:'Specifications',v:String(DATA.specs.length),i:'ruler',s:'Active parameters'},
    {l:'Streams Covered',v:String(new Set(DATA.specs.map(s=>s.stream)).size),i:'layers',s:'Product streams'},
    {l:'Approved',v:String(DATA.specs.filter(s=>s.status==='Approved').length),i:'circle-check',s:'Released to production'},
    {l:'Test Methods',v:String(new Set(DATA.specs.map(s=>s.method)).size),i:'flask-conical',s:'Referenced methods'},
  ],4);
  const tbl=makeTable('specs',{
    title:'Specifications & Limits', pageSize:12, search:['stream','point','parameter','method','id'],
    toolbar:`<button class="btn btn-blue" onclick="addSpec()"><i data-lucide="plus"></i>New Specification</button><button class="btn btn-green" onclick="exportGeneric('specs','specifications.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'SPEC ID',render:v=>`<b style="color:#0060b0">${v}</b>`},
      {key:'stream',label:'STREAM',render:v=>`<span style="color:#0060b0;font-weight:600">${v}</span>`},
      {key:'point',label:'SAMPLING POINT'},
      {key:'parameter',label:'PARAMETER'},
      {key:'unit',label:'UNIT',render:v=>`<span style="color:#6b7280">${v||'—'}</span>`},
      {key:'limit',label:'SPEC LIMIT',render:v=>`<span style="font-weight:600">${v||'—'}</span>`},
      {key:'method',label:'TEST METHOD',render:v=>`<span style="color:#6b7280">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>`<span class="badge b-green">${v}</span>`},
      {key:'x',label:'',sortable:false,align:'center',render:(_,r)=>`<i data-lucide="eye" style="width:15px;color:#9aa3af;cursor:pointer" onclick="viewSpec('${r.id}')"></i>`},
    ], data:DATA.specs
  });
  return moduleShell('Specifications',kpis,tbl);
}
function viewSpec(id){
  const r=DATA.specs.find(x=>x.id===id); if(!r)return;
  openModal({title:'Specification '+id, body:`
    <div class="kv"><span>Stream</span><span>${r.stream}</span></div>
    <div class="kv"><span>Sampling Point</span><span>${r.point}</span></div>
    <div class="kv"><span>Parameter</span><span>${r.parameter} (${r.unit||'—'})</span></div>
    <div class="kv"><span>Spec Limit (Lo–Hi)</span><span>${r.lo} – ${r.hi}</span></div>
    <div class="kv"><span>Alert / Action Limit</span><span>${r.alo} – ${r.ahi}</span></div>
    <div class="kv"><span>Test Method</span><span>${r.method}</span></div>
    <div class="kv"><span>Status</span><span>${r.status}</span></div>`});
}
function addSpec(){
  simpleAdd('New Specification',[
    {key:'stream',label:'Stream',opts:['Hydrogen Peroxide','Urea','Ammonia','Nitric Acid','CAN','NP / Agri','Utilities & Off-Gas']},
    {key:'point',label:'Sampling Point'},{key:'parameter',label:'Parameter'},{key:'unit',label:'Unit'},
    {key:'lo',label:'Lower Limit'},{key:'hi',label:'Upper Limit'},{key:'method',label:'Test Method'},
  ], v=>{
    DATA.specs.unshift({id:'SPEC-'+(101+DATA.specs.length),stream:v.stream,point:v.point||'—',parameter:v.parameter||'—',unit:v.unit,lo:v.lo||'—',hi:v.hi||'—',alo:v.lo||'—',ahi:v.hi||'—',method:v.method||'—',limit:(v.lo||'')+' – '+(v.hi||''),status:'Approved'});
    toast('Specification added','ok');
  });
}

/* ---------- Shift Management ---------- */
function screenShiftMgmt(){
  const d=DATA.dash.shift;
  return `<div class="pageicon" style="font-size:24px">Shift Scheduling</div>
  ${kpiRow([
    {l:'Active Shifts',v:'4',i:'calendar-days',s:'General/Morning/Evening/Night'},
    {l:'On Duty',v:'18',i:'users',s:'Analysts assigned'},
    {l:'Planned Today',v:'65',i:'clipboard-list',s:'Sample slots'},
    {l:'Completion',v:'67.7%',i:'circle-check',s:'Across all shifts'},
  ],4)}
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div class="card"><div class="card-head"><div class="card-title">Shift Roster</div>
      <button class="btn btn-blue" onclick="toast('Roster editor (demo)','info')"><i data-lucide="plus"></i>Assign</button></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>SHIFT</th><th>TIMING</th><th>SUPERVISOR</th><th>ANALYSTS</th><th>STATUS</th></tr></thead><tbody>
      ${[['General','06:00–18:00','Tajammal Rashid',6,'On Duty'],['Morning','06:00–14:00','Imran Yousaf',5,'On Duty'],['Evening','14:00–22:00','Farhan Akram',4,'On Duty'],['Night','22:00–06:00','Bilal Ahmed',3,'On Duty']].map(r=>
        `<tr><td><span class="badge b-teal-o">${r[0]}</span></td><td>${r[1]}</td><td>${r[2]}</td><td style="text-align:center">${r[3]}</td><td><span class="badge b-green">${r[4]}</span></td></tr>`).join('')}
      </tbody></table></div></div>
    <div class="card"><div class="card-head"><div class="card-title">Shift Wise Samples &amp; Compliance</div></div>
      <div style="padding:2px 4px">${shiftTable(d)}</div></div>
  </div>`;
}

/* ---------- Profile Settings ---------- */
function screenProfile(){
  return `<div class="pageicon" style="font-size:24px">Profile Settings</div>
  <div class="grid" style="grid-template-columns:1fr 2fr">
    <div class="card card-pad" style="text-align:center">
      <div class="avatar" style="width:72px;height:72px;font-size:26px;margin:8px auto">DU</div>
      <div style="font-weight:600;font-size:15px;color:#334;margin-top:6px">demo user</div>
      <div style="color:#9aa3af;font-size:12px">demo.user@descon.com</div>
      <div style="margin-top:8px"><span class="badge b-blue">QC Manager</span></div>
      <button class="btn btn-out" style="margin-top:14px;width:100%;justify-content:center" onclick="toast('Photo upload (demo)','info')"><i data-lucide="camera"></i>Change Photo</button>
    </div>
    <div class="card card-pad">
      <div style="font-weight:600;color:#334;margin-bottom:12px">Account Details</div>
      <div class="form-grid">
        <div class="form-row"><label>Full Name</label><input value="demo user"></div>
        <div class="form-row"><label>Email</label><input value="demo.user@descon.com"></div>
        <div class="form-row"><label>Department</label><input value="Quality Control"></div>
        <div class="form-row"><label>Role</label><input value="QC Manager" disabled></div>
        <div class="form-row"><label>Phone</label><input value="+1 587-917-7802"></div>
        <div class="form-row"><label>Language</label><select><option>English</option><option>Urdu</option></select></div>
      </div>
      <div style="font-weight:600;color:#334;margin:8px 0 12px">Preferences</div>
      <div class="form-row" style="display:flex;align-items:center;gap:10px"><input type="checkbox" checked style="width:auto"> <label style="margin:0">Email notifications for off-spec results</label></div>
      <div class="form-row" style="display:flex;align-items:center;gap:10px"><input type="checkbox" checked style="width:auto"> <label style="margin:0">Daily compliance digest</label></div>
      <div class="form-row" style="display:flex;align-items:center;gap:10px"><input type="checkbox" style="width:auto"> <label style="margin:0">Dark mode by default</label></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
        <button class="btn btn-out" onclick="toast('Changes discarded','info')">Cancel</button>
        <button class="btn btn-green" onclick="toast('Profile saved successfully','ok')"><i data-lucide="check"></i>Save Changes</button>
      </div>
    </div>
  </div>

  ${renderIntegrations()}`;
}

/* Outlook integration management lives in js/outlook.js (manageOutlook) */

/* ---------- shared row actions + generic CRUD helpers ---------- */
function rowActions(kind,id){
  return `<span style="display:inline-flex;gap:10px" onclick="event.stopPropagation()">
    <i data-lucide="eye" style="width:14px;color:#0060b0;cursor:pointer" onclick="viewRow('${kind}','${id}')"></i>
    <i data-lucide="pencil" style="width:14px;color:#e08e0b;cursor:pointer" onclick="editRow('${kind}','${id}')"></i>
    <i data-lucide="trash-2" style="width:14px;color:#d64545;cursor:pointer" onclick="deleteRow('${kind}','${id}')"></i></span>`;
}
function findRow(kind,id){
  const map={user:DATA.users,equip:DATA.equipment};
  const arr=map[kind]; return {arr, row:arr.find(x=>x.id===id)};
}
function viewRow(kind,id){
  const {row}=findRow(kind,id); if(!row)return;
  const body=Object.entries(row).map(([k,v])=>`<div class="kv"><span>${k}</span><span>${v}</span></div>`).join('');
  openModal({title:'Details — '+id, body});
}
function editRow(kind,id){
  const {row}=findRow(kind,id); if(!row)return;
  const fields=Object.entries(row).filter(([k])=>k!=='id');
  const body=`<div class="form-grid">${fields.map(([k,v])=>`<div class="form-row"><label>${k}</label><input id="ef-${k}" value="${v}"></div>`).join('')}</div>`;
  window.__editCtx={kind,id};
  openModal({title:'Edit '+id, wide:true, body, actions:[
    {label:'Cancel',cls:'btn-out',fn:'closeModal()'},
    {label:'Save',cls:'btn-green',icon:'check',fn:'saveEdit()'}]});
}
function saveEdit(){
  const {kind,id}=window.__editCtx; const {row}=findRow(kind,id);
  Object.keys(row).forEach(k=>{if(k==='id')return;const el=document.getElementById('ef-'+k);if(el)row[k]=el.value;});
  closeModal(); render(); toast('Record '+id+' updated','ok');
}
function deleteRow(kind,id){
  confirmModal('Delete record',`Delete <b>${id}</b>? This cannot be undone.`,()=>{
    const {arr}=findRow(kind,id); const i=arr.findIndex(x=>x.id===id); if(i>-1)arr.splice(i,1);
    render(); toast('Record '+id+' deleted','ok');
  },'Delete','danger');
}
function exportGeneric(id,filename){
  const cfg=TBL[id].cfg; const rows=tblData(id);
  const cols=cfg.columns.filter(c=>c.key!=='x');
  exportCSV(filename, cols.map(c=>c.label), rows.map(r=>cols.map(c=>r[c.key])));
}
function exportUsers(){exportGeneric('users','users.csv');}

/* add-record modals */
function simpleAdd(title, fields, onAdd){
  const body=`<div class="form-grid">${fields.map(f=>`<div class="form-row"><label>${f.label}</label>${f.opts?`<select id="af-${f.key}">${f.opts.map(o=>`<option>${o}</option>`).join('')}</select>`:`<input id="af-${f.key}" placeholder="${f.ph||''}">`}</div>`).join('')}</div>`;
  window.__addFn=onAdd; window.__addFields=fields;
  openModal({title, wide:true, body, actions:[
    {label:'Cancel',cls:'btn-out',fn:'closeModal()'},
    {label:'Add',cls:'btn-green',icon:'plus',fn:'commitAdd()'}]});
}
function commitAdd(){
  const vals={}; window.__addFields.forEach(f=>{vals[f.key]=(document.getElementById('af-'+f.key)||{}).value||'';});
  window.__addFn(vals); closeModal(); render();
}
function addUser(){simpleAdd('Add User',[
  {key:'name',label:'Full Name'},{key:'email',label:'Email'},
  {key:'role',label:'Role',opts:['Lab Analyst','Senior Analyst','QC Manager','Lab Supervisor','Auditor','Admin']},
  {key:'dept',label:'Department',opts:['Quality Control','Analytical Laboratory','Sampling','QA','Instrumentation']}],
  v=>{DATA.users.unshift({id:'USR-'+(200+DATA.users.length),name:v.name||'New User',email:v.email||'new.user@ailab.ca',role:v.role,dept:v.dept,status:'Active',last:'Just now'});toast('User added','ok');});}
function addEquip(){simpleAdd('Add Equipment',[
  {key:'name',label:'Equipment'},{key:'tag',label:'Tag'},
  {key:'location',label:'Location',opts:['UREA Lab','OU Lab','Ammonia Lab','Central Lab']},
  {key:'status',label:'Status',opts:['Operational','Under Maintenance','Calibration Due']}],
  v=>{DATA.equipment.unshift({id:'EQP-'+(300+DATA.equipment.length),name:v.name||'New Asset',tag:v.tag||'NEW-00',location:v.location,status:v.status,lastCal:'—',nextCal:'—'});toast('Equipment added','ok');});}
function addLog(){simpleAdd('New Shift Log',[
  {key:'shift',label:'Shift',opts:['Morning','Evening','Night','General']},{key:'supervisor',label:'Supervisor'},{key:'remarks',label:'Remarks'}],
  v=>{DATA.shiftlog.unshift({id:'SLB-'+(5100+DATA.shiftlog.length),date:'01 Jul 2026',shift:v.shift,supervisor:v.supervisor||'—',samples:0,completed:0,remarks:v.remarks||'—'});toast('Log entry added','ok');});}
function addRegistry(){simpleAdd('Log Sample',[
  {key:'plant',label:'Plant',opts:['UREA','NP','OU','CAN','Ammonia','Nitric Acid']},{key:'source',label:'Source'},
  {key:'type',label:'Type',opts:['Routine','Non-Routine','Special']}],
  v=>{DATA.registry.unshift({id:'REG-'+(9000+DATA.registry.length),plant:v.plant,source:v.source||'—',type:v.type,received:'Just now',status:'Registered',by:'demo user'});toast('Sample registered','ok');});}
