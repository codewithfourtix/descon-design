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
  const ncStat = iso.ncStatus.map(x=>`<div class="stat-box" style="background:${x.bg};flex:1"><div class="n" style="color:${x.c}">${x.v}</div><div class="l">${x.n}</div></div>`).join('');
  const capaStat = iso.capaStatus.map(x=>`<div class="stat-box" style="background:${x.bg};flex:1"><div class="n" style="color:${x.c}">${x.v}</div><div class="l">${x.n}</div></div>`).join('');
  const auditTbl = makeTable('audits',{
    title:'Internal Audits', pageSize:10, search:['id','type','dept','org','lead','status'],
    toolbar:`<button class="btn btn-blue" onclick="addAudit()"><i data-lucide="plus"></i>Add New</button><button class="btn btn-green" onclick="exportGeneric('audits','internal-audits.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'AUDIT ID',render:v=>`<b style="color:#334">${v}</b>`},
      {key:'type',label:'TYPE',render:v=>`<span class="badge b-teal-o">${v}</span>`},
      {key:'dept',label:'DEPARTMENT'},
      {key:'org',label:'ORGANIZATION'},
      {key:'lead',label:'LEAD ASSESSOR',render:v=>`<span style="font-weight:500">${v}</span>`},
      {key:'date',label:'AUDIT DATE',render:v=>`<span style="color:#6b7280">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Completed'?'b-green':v==='Ongoing'?'b-amber':'b-blue'}">${v}</span>`},
      {key:'nc',label:'NC COUNT',render:v=>`<span class="badge ${v==='0 NCs'?'b-green':'b-red'}">${v}</span>`},
      {key:'comp',label:'COMPLIANCE',render:v=>`<span style="color:#0a9d78;font-weight:600">${v}</span>`},
      {key:'x',label:'ACTIONS',sortable:false,align:'center',render:(_,r)=>`<span style="display:inline-flex;gap:8px"><i data-lucide="eye" style="width:14px;color:#0060b0;cursor:pointer" onclick="viewAudit('${r.id}')"></i><i data-lucide="pencil" style="width:14px;color:#e08e0b;cursor:pointer" onclick="editAudit('${r.id}')"></i><i data-lucide="trash-2" style="width:14px;color:#d64545;cursor:pointer" onclick="delAudit('${r.id}')"></i></span>`},
    ], data:iso.table.map(r=>({id:r[0],type:r[1],dept:r[2],org:r[3],lead:r[4],date:r[5],status:r[6],nc:r[7],comp:r[8]}))
  });

  return `
  <div class="pageicon" style="font-size:24px">Quality System <small>· Audits &amp; CAPA · ISO/IEC 17025</small></div>
  <div class="tabrow pills" style="margin-bottom:2px">
    <div class="tab ${ISO_SCOPE==='Internal'?'active':''}" onclick="isoScope('Internal')"><i data-lucide="building-2"></i>Internal</div>
    <div class="tab ${ISO_SCOPE==='External'?'active':''}" onclick="isoScope('External')"><i data-lucide="briefcase"></i>External</div>
  </div>
  <div class="tabrow">
    ${[['Dashboard','layout-grid'],['Non-Conformities','file-warning'],['CAPA','wrench'],['Audit Closure','check-check'],['Timeline','clock']].map(([n,ic])=>`<div class="tab ${ISO_SUB===n?'active':''}" onclick="isoSub('${n}')"><i data-lucide="${ic}"></i>${n}</div>`).join('')}
  </div>
  ${kpiRow(iso.kpis,6)}
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="card"><div class="card-head"><div class="card-title"><i data-lucide="pie-chart" style="width:14px;color:#0060b0"></i> Audit Status Distribution</div></div><div class="card-pad">${progressList(iso.statusDist)}</div></div>
    <div class="card"><div class="card-head"><div class="card-title"><i data-lucide="bar-chart-3" style="width:14px;color:#0060b0"></i> Clause-wise NC Distribution</div></div><div class="card-pad">${progressList(iso.clauseNC.map(c=>({...c,p:100})))}</div></div>
    <div class="card"><div class="card-head"><div class="card-title"><i data-lucide="building" style="width:14px;color:#e03131"></i> Department NC Risk</div></div><div class="card-pad">${progressList(iso.deptRisk)}</div></div>
  </div>
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div class="card"><div class="card-head"><div class="card-title"><i data-lucide="circle-alert" style="width:14px;color:#e03131"></i> NC Status Overview</div></div>
      <div class="card-pad" style="display:flex;gap:12px">${ncStat}</div></div>
    <div class="card"><div class="card-head"><div class="card-title"><i data-lucide="wrench" style="width:14px;color:#0060b0"></i> CAPA Status Overview</div></div>
      <div class="card-pad" style="display:flex;gap:12px">${capaStat}</div></div>
  </div>
  <div style="height:10px"></div>
  <div class="card">${auditTbl}</div>`;
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
