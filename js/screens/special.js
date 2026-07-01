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
  const sp = DATA.special;
  const tbl = makeTable('special',{
    title:'Special Sample History', pageSize:13, search:['source','code','by','status','plant'],
    toolbar:`<button class="btn btn-blue" onclick="raiseRequest()"><i data-lucide="plus"></i>Raise Request</button><button class="btn btn-green" onclick="exportGeneric('special','special-samples.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'ID',render:v=>`<b style="color:#334">${v}</b>`},
      {key:'plant',label:'PLANT',render:v=>`<span style="color:#0060b0;font-weight:600">${v}</span>`},
      {key:'source',label:'SOURCE NAME'},
      {key:'code',label:'CODE',render:v=>`<span style="color:#4b5563">${v}</span>`},
      {key:'received',label:'RECEIVED AT',render:v=>`<span style="color:#6b7280">${v}</span>`},
      {key:'params',label:'PARAMETERS',align:'center',render:v=>`<span class="chip">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>statusBadge(v)},
      {key:'by',label:'REQUESTED BY'},
      {key:'x',label:'ACTIONS',sortable:false,align:'center',render:(_,r)=>`<i data-lucide="eye" style="width:15px;color:#9aa3af;cursor:pointer" onclick="viewSpecial(${r.id})"></i>`},
    ], data:specialRows()
  });
  return `
  ${kpiRow(sp.kpis,4,true)}
  <div style="height:10px"></div>
  <div class="card">${tbl}</div>`;
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
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Download CoA',cls:'btn-green',icon:'download',fn:`closeModal();toast('Certificate generated (demo)','ok')`}]});
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
