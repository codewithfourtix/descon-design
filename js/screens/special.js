/* ===== Special Samples (interactive) ===== */
function statusBadge(s){
  const map={'Results Approved':'b-amber','Completed':'b-green','Request Approved':'b-green-o','Requested':'b-teal-o','In Progress':'b-blue'};
  const icon={'Results Approved':'user-check','Completed':'flask-round','Request Approved':'circle-check','Requested':'send','In Progress':'loader'};
  return `<span class="badge ${map[s]||'b-green'}"><i data-lucide="${icon[s]||'circle'}" style="width:11px"></i>${s}</span>`;
}

/* build row-objects once from the raw arrays */
function specialRows(){
  return DATA.special.rows.map(r=>({id:r[0],plant:r[1],source:r[2],code:r[3],received:r[4],params:r[5],status:r[6],by:r[7]}));
}

function screenSpecial(){
  const rows = specialRows();
  
  // Group rows by status for the pipeline board
  const lanes = [
    { title: 'Requested', items: rows.filter(r => r.status === 'Requested').map(r => ({title: `Req ${r.id}: ${r.source}`, meta: `${r.plant} · ${r.by}`})) },
    { title: 'Approved', items: rows.filter(r => r.status === 'Request Approved').map(r => ({title: `Req ${r.id}: ${r.source}`, meta: `Waiting for sample · ${r.by}`})) },
    { title: 'In Progress', items: rows.filter(r => r.status === 'In Progress').map(r => ({title: `Req ${r.id}: ${r.source}`, meta: `Testing ${r.params} params`})) },
    { title: 'Completed', items: rows.filter(r => r.status === 'Results Approved' || r.status === 'Completed').map(r => ({title: `Req ${r.id}: ${r.source}`, meta: `Results finalized`})) },
  ];

  return `
  <div class="workspace-board" style="height:calc(100vh - 120px)">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:16px;font-weight:700;color:var(--ink)">Special Sample Pipeline</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-out"><i data-lucide="filter"></i>Filter</button>
        <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="raiseRequest()"><i data-lucide="plus"></i>Raise Request</button>
      </div>
    </div>
    
    ${renderPipelineBoard(lanes)}
  </div>`;
}

function viewSpecial(id){
  const r=DATA.special.rows.find(x=>x[0]===id); if(!r)return;
  openModal({title:'Special Sample '+r[2], body:`
    <div class="kv"><span>Sample ID</span><span>${r[0]}</span></div>
    <div class="kv"><span>Plant</span><span>${r[1]}</span></div>
    <div class="kv"><span>Source Name</span><span>${r[2]}</span></div>
    <div class="kv"><span>Code</span><span>${r[3]}</span></div>
    <div class="kv"><span>Received At</span><span>${r[4]}</span></div>
    <div class="kv"><span>Parameters</span><span>${r[5]}</span></div>
    <div class="kv"><span>Status</span><span>${r[6]}</span></div>
    <div class="kv"><span>Requested By</span><span>${r[7]}</span></div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},
      {label:'Email via Outlook',cls:'btn-out',icon:'mail',fn:`closeModal();emailCoaViaOutlook('${r[2]}','${r[0]}')`},
      {label:'Download CoA',cls:'btn-green',icon:'download',fn:`closeModal();toast('Certificate generated (demo)','ok')`}]});
}

function emailCoaViaOutlook(source, id){
  toast('Preparing Certificate of Analysis…','info');
  setTimeout(()=>emailReportViaOutlook({
    report:'Certificate of Analysis — '+source,
    file:('CoA_'+String(source).replace(/[^\w]+/g,'_')+'.pdf'),
    size:'196 KB',
    reportKey:'coa', listId:'plant',
    subject:`Certificate of Analysis — ${source} (Sample ${id})`,
    body:`Dear team,\n\nPlease find attached the Certificate of Analysis for ${source} (Sample ID ${id}), generated from Descon Assure LIQS.\n\nKindly acknowledge receipt.\n\nRegards,\nDescon Assure LIQS`,
  }), 700);
}

function raiseRequest(){
  simpleAdd('Raise Special Request',[
    {key:'plant',label:'Plant',opts:['OU','UREA','NP','CAN','Ammonia','Nitric Acid']},
    {key:'source',label:'Source Name',ph:'e.g. SS-20260701-XXX'},
    {key:'params',label:'Parameters',opts:['3','4','5','6','7']},
    {key:'by',label:'Requested By',ph:'Your name'},
  ], v=>{
    const nid=Math.max(...DATA.special.rows.map(r=>r[0]))+1;
    const code='SP-'+Math.floor(Math.random()*0xFFFFFF).toString(16).toUpperCase().padStart(6,'0');
    DATA.special.rows.unshift([nid,v.plant,v.source||('SS-20260701-'+nid),code,'—',parseInt(v.params||5),'Requested',v.by||'demo user']);
    DATA.special.kpis[0].v=String(parseInt(DATA.special.kpis[0].v)+1);
    DATA.special.kpis[1].v=String(parseInt(DATA.special.kpis[1].v)+1);
    toast('Special request '+code+' raised','ok');
  });
}
