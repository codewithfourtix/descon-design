/* ===== ISO 17025 Audits (page 6) ===== */
function progressList(items){
  return items.map(it=>`<div style="margin:10px 0">
    <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:5px">
      <span style="color:#4b5563">${it.n}</span><span style="color:#334;font-weight:600">${it.v}</span></div>
    <div class="progress"><span style="width:${it.p}%;background:${it.c}"></span></div>
  </div>`).join('');
}
function screenISO(){
  const iso = DATA.iso;
  const ncStat = iso.ncStatus.map(x=>`<div class="stat-box" style="background:${x.bg};flex:1;padding:12px;border-radius:8px"><div class="n" style="color:${x.c};font-size:20px;font-weight:700">${x.v}</div><div class="l" style="font-size:11px;color:var(--muted)">${x.n}</div></div>`).join('');
  const capaStat = iso.capaStatus.map(x=>`<div class="stat-box" style="background:${x.bg};flex:1;padding:12px;border-radius:8px"><div class="n" style="color:${x.c};font-size:20px;font-weight:700">${x.v}</div><div class="l" style="font-size:11px;color:var(--muted)">${x.n}</div></div>`).join('');
  
  const auditTbl = makeTable('audits',{
    title:'Internal Audits', pageSize:10, search:['id','type','dept','org','lead','status'],
    toolbar:`<button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addAudit()"><i data-lucide="plus"></i>Add New</button>`,
    columns:[
      {key:'id',label:'AUDIT ID',render:v=>`<b style="color:var(--brand);cursor:pointer">${v}</b>`},
      {key:'type',label:'TYPE',render:v=>`<span class="badge b-teal-o">${v}</span>`},
      {key:'dept',label:'DEPARTMENT'},
      {key:'date',label:'AUDIT DATE',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Completed'?'b-green':v==='Ongoing'?'b-amber':'b-blue'}">${v}</span>`},
      {key:'nc',label:'NC COUNT',render:v=>`<span class="badge ${v==='0 NCs'?'b-green':'b-red'}">${v}</span>`},
      {key:'comp',label:'COMPLIANCE',render:v=>`<span style="color:var(--brand);font-weight:600">${v}</span>`},
      {key:'x',label:'',sortable:false,align:'right',render:(_,r)=>`<span style="display:inline-flex;gap:8px"><i data-lucide="eye" style="width:14px;color:var(--muted);cursor:pointer" onclick="viewAudit('${r.id}')"></i><i data-lucide="pencil" style="width:14px;color:var(--amber);cursor:pointer" onclick="editAudit('${r.id}')"></i></span>`},
    ], data:iso.table.map(r=>({id:r[0],type:r[1],dept:r[2],org:r[3],lead:r[4],date:r[5],status:r[6],nc:r[7],comp:r[8]}))
  });

  return `
  <div class="workspace-split" style="height:calc(100vh - 100px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:18px;font-weight:700;color:var(--ink)">Audit Compliance Workspace</div>
        <div class="tabrow pills" style="margin:0">
          <div class="tab ${ISO_SCOPE==='Internal'?'active':''}" onclick="isoScope('Internal')"><i data-lucide="building-2"></i>Internal</div>
          <div class="tab ${ISO_SCOPE==='External'?'active':''}" onclick="isoScope('External')"><i data-lucide="briefcase"></i>External</div>
        </div>
      </div>
      
      <div class="grid" style="grid-template-columns:repeat(3,minmax(200px,1fr));overflow-x:auto;padding-bottom:4px">
        <div class="card"><div class="card-head"><div class="card-title">Audit Status Distribution</div></div><div class="card-pad">${progressList(iso.statusDist)}</div></div>
        <div class="card"><div class="card-head"><div class="card-title">Clause-wise NC Distribution</div></div><div class="card-pad">${progressList(iso.clauseNC.map(c=>({...c,p:100})))}</div></div>
        <div class="card"><div class="card-head"><div class="card-title">Department NC Risk</div></div><div class="card-pad">${progressList(iso.deptRisk)}</div></div>
      </div>
      
      <div class="card">${auditTbl}</div>
    </div>
    
    <div class="detail-panel">
      <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px">
        Corrective Action Panel
      </div>
      
      <div>
        <div style="font-weight:600;font-size:12px;color:var(--ink);margin-bottom:8px">NC Status Overview</div>
        <div style="display:flex;gap:8px">${ncStat}</div>
      </div>
      
      <div>
        <div style="font-weight:600;font-size:12px;color:var(--ink);margin-bottom:8px">CAPA Status Overview</div>
        <div style="display:flex;gap:8px">${capaStat}</div>
      </div>
      
      <div style="margin-top:8px">
        <div style="font-weight:600;font-size:12px;color:var(--ink);margin-bottom:8px">Action Items</div>
        ${renderActionQueue([
          {title:'Review Draft Report', meta:'Audit ISO-INT-2025-001', priority:'high'},
          {title:'Upload Evidence', meta:'CAPA-042', priority:'med'},
          {title:'Sign-off on Clause 8', meta:'Quality Control Dept'}
        ])}
      </div>
      
      <div style="margin-top:auto">
        <button class="btn btn-out" style="width:100%;justify-content:center" onclick="toast('Generating report...')"><i data-lucide="file-text"></i> Generate Report</button>
      </div>
    </div>
  </div>`;
}

/* ISO tab state + CRUD */
let ISO_SCOPE='Internal', ISO_SUB='Dashboard';
function isoScope(s){ISO_SCOPE=s;toast(s+' audits','info');render();}
function isoSub(s){ISO_SUB=s;render();}
function viewAudit(id){
  const r=DATA.iso.table.find(x=>x[0]===id); if(!r)return;
  const labels=['Audit ID','Type','Department','Organization','Lead Assessor','Audit Date','Status','NC Count','Compliance'];
  openModal({title:'Audit '+id, body:labels.map((l,i)=>`<div class="kv"><span>${l}</span><span>${r[i]}</span></div>`).join('')});
}
function editAudit(id){
  const r=DATA.iso.table.find(x=>x[0]===id); if(!r)return;
  const labels=['Audit ID','Type','Department','Organization','Lead Assessor','Audit Date','Status','NC Count','Compliance'];
  window.__auditEdit=id;
  openModal({title:'Edit '+id,wide:true,body:`<div class="form-grid">${labels.map((l,i)=>`<div class="form-row"><label>${l}</label><input id="au-${i}" value="${r[i]}" ${i===0?'disabled':''}></div>`).join('')}</div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Save',cls:'btn-green',icon:'check',fn:'saveAudit()'}]});
}
function saveAudit(){const r=DATA.iso.table.find(x=>x[0]===window.__auditEdit);for(let i=1;i<=8;i++){const el=document.getElementById('au-'+i);if(el)r[i]=el.value;}closeModal();render();toast('Audit '+r[0]+' updated','ok');}
function delAudit(id){confirmModal('Delete audit',`Delete audit <b>${id}</b>?`,()=>{const i=DATA.iso.table.findIndex(x=>x[0]===id);if(i>-1)DATA.iso.table.splice(i,1);render();toast('Audit '+id+' deleted','ok');},'Delete','danger');}
function addAudit(){
  simpleAdd('Add Internal Audit',[
    {key:'type',label:'Type',opts:['Assessment','Surveillance','Follow-up']},
    {key:'dept',label:'Department',opts:['Quality Control','Analytical Laboratory','Sampling','Instrumentation']},
    {key:'org',label:'Organization'},{key:'lead',label:'Lead Assessor'},
  ], v=>{
    const n=DATA.iso.table.length+1;
    DATA.iso.table.unshift([`ISO-INT-2025-${String(n).padStart(3,'0')}`,v.type,v.dept,v.org||'AILAB',v.lead||'—','Jul 01, 2025','Planned','0 NCs','—']);
    toast('Audit created','ok');
  });
}
