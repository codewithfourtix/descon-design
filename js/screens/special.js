/* ===== Non-Routine / Special Samples (request → result → certificate) ===== */
function statusBadge(s){
  const map={'Results Approved':'b-green','Completed':'b-amber','Request Approved':'b-green-o','Requested':'b-teal-o','In Progress':'b-blue','Rejected':'b-red'};
  const icon={'Results Approved':'user-check','Completed':'flask-round','Request Approved':'circle-check','Requested':'send','In Progress':'loader','Rejected':'x-circle'};
  return `<span class="badge ${map[s]||'b-green'}"><i data-lucide="${icon[s]||'circle'}" style="width:11px"></i>${s}</span>`;
}
function specialRows(){
  return DATA.special.rows.map(r=>({id:r[0],plant:r[1],source:r[2],code:r[3],received:r[4],params:r[5],status:r[6],by:r[7],note:r[8]||''}));
}
let SPECIAL_PLANT='All';
const SP_FLOW=['Requested','Request Approved','In Progress','Completed','Results Approved'];
function screenSpecial(){
  const rows = specialRows().filter(r=>SPECIAL_PLANT==='All'||r.plant===SPECIAL_PLANT);
  const card=r=>({title:`${r.code} · ${r.source}`, meta:`${r.plant} · ${r.params} params · ${titleCase(r.by)}`, fn:`openSpecial(${r.id})`});
  const lanes = [
    { title: 'Requested', items: rows.filter(r => r.status === 'Requested').map(card) },
    { title: 'Approved · awaiting sample', items: rows.filter(r => r.status === 'Request Approved').map(card) },
    { title: 'In Progress', items: rows.filter(r => r.status === 'In Progress').map(card) },
    { title: 'Completed', items: rows.filter(r => r.status === 'Completed' || r.status === 'Results Approved').map(r=>({...card(r), tag:statusBadge(r.status)})) },
  ];
  const plants=['All',...new Set(DATA.special.rows.map(r=>r[1]))];
  return `
  <div class="workspace-board" style="height:calc(100vh - 120px)">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
      <div><div class="ph-t">Non-Routine Sample Pipeline</div><div class="ph-s">${rows.length} request${rows.length===1?'':'s'}${SPECIAL_PLANT!=='All'?' · '+SPECIAL_PLANT:''} · click a card to move it forward</div></div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="seg-pills">${plants.map(p=>`<span class="${p===SPECIAL_PLANT?'on':''}" onclick="SPECIAL_PLANT='${p}';render()">${p}</span>`).join('')}</div>
        <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="raiseRequest()"><i data-lucide="plus"></i>Raise Request</button>
      </div>
    </div>
    ${renderPipelineBoard(lanes)}
  </div>`;
}
function spRow(id){ return DATA.special.rows.find(x=>x[0]===id); }
function openSpecial(id){
  const r=spRow(id); if(!r) return;
  const st=r[6]; const i=SP_FLOW.indexOf(st);
  const next={'Requested':['Approve request','circle-check','Lab Supervisor'],'Request Approved':['Receive sample','package-open','Lab Analyst'],'In Progress':['Mark testing complete','flask-round','Lab Analyst'],'Completed':['Approve results','user-check','QC Manager']}[st];
  const steps=SP_FLOW.map((s,k)=>`<div class="tl-step ${k<i?'done':k===i?'cur':''}"><span></span>${s==='Request Approved'?'Approved':s}</div>`).join('');
  const acts=[];
  if(next) acts.push({label:next[0],cls:'btn-green',icon:next[1],fn:`spAdvance(${id})`});
  if(st==='Requested') acts.push({label:'Reject',cls:'btn-red',icon:'x',fn:`spReject(${id})`});
  if(st==='Results Approved'){ acts.push({label:'Certificate (PDF)',cls:'btn-green',icon:'file-check-2',fn:`spCoa(${id})`}); acts.push({label:'Email via Outlook',cls:'btn-out',icon:'mail',fn:`emailCoaViaOutlook('${jsq(r[2])}','${r[0]}')`}); }
  openRecord(`${r[3]} · ${r[2]}`,[
    ['Request no.',r[0]],['Plant',r[1]],['Source',r[2]],['Code',r[3]],['Received',r[4]],['Parameters',r[5]],['Status',statusBadge(st)],['Requested by',titleCase(r[7])],...(r[8]?[['Note',esc(r[8])]]:[])
  ], acts, `<div class="tl">${steps}</div>`);
}
function spAdvance(id){
  const r=spRow(id); if(!r) return;
  const order={'Requested':'Request Approved','Request Approved':'In Progress','In Progress':'Completed','Completed':'Results Approved'};
  const need={'Requested':'Lab Supervisor','Completed':'QC Manager'}[r[6]];
  if(need&&!can(need,r[6]==='Requested'?'Approving a request':'Approving results')) return;
  const prev=r[6]; r[6]=order[prev]; if(!r[6]) return;
  if(r[6]==='In Progress') r[4]=fmtStamp();
  audit('Special sample '+r[6].toLowerCase(),'Non-Routine',`${r[3]} · ${r[2]}`);
  if(r[6]==='Results Approved') notify(`Results approved · ${r[3]}`,`${r[2]} · certificate ready`,{icon:'user-check',color:'#0a9d78',route:state.route,tab:'special'});
  render(); openSpecial(id);
  toast(`${r[3]} moved to ${r[6]==='Request Approved'?'Approved':r[6]}`,'ok');
}
function spReject(id){
  const r=spRow(id); if(!r) return;
  if(!can('Lab Supervisor','Rejecting a request')) return;
  confirmModal('Reject request',`Reject special request <b>${r[3]}</b> from ${titleCase(r[7])}?`,()=>{
    r[6]='Rejected'; r[8]='Rejected by '+myName(); audit('Rejected special request','Non-Routine',r[3]); closeDrawer(); render(); toast(r[3]+' rejected','warn');
  },'Reject','danger');
}
function spCoa(id){
  const r=spRow(id); if(!r) return;
  const cards=(DATA.labByStream&&DATA.labByStream.h2o2)||DATA.lab.cards;
  const pool=(r[1]==='OU'?DATA.lab.cards[4]:r[1]==='UREA'?DATA.lab.cards[0]:cards[0]).rows.filter(x=>x[2]);
  const rng=mulberry32(id*7919);
  const b={id:r[2],product:`Special sample · ${r[1]}`,qty:'—',unit:'',tank:r[1]+' plant',mfg:r[4],by:r[7],
    tests:pool.slice(0,Math.max(3,Math.min(r[5],pool.length))).map(x=>({param:x[0],unit:x[1],spec:x[2],result:String(sampleWithin(x[2],rng))}))};
  const c={id:'SCA-'+r[3].replace('SP-',''),batch:r[2],customer:titleCase(r[7])+' (internal)',issued:fmtDate(),by:signer(),status:'Issued',ref:r[3]};
  closeDrawer();
  openModal({title:'Certificate '+c.id, wide:true, body:`<div class="coa-wrap">${coaDocHTML(c,b)}</div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Print',cls:'btn-out',icon:'printer',fn:`printCoa('${c.id}')`},{label:'Download PDF',cls:'btn-green',icon:'download',fn:`coaPdf('${c.id}')`}]});
  audit('Generated special-sample certificate','Non-Routine',c.id);
}
function emailCoaViaOutlook(source, id){
  toast('Preparing Certificate of Analysis…','info');
  setTimeout(()=>emailReportViaOutlook({
    report:'Certificate of Analysis · '+source,
    file:('CoA_'+String(source).replace(/[^\w]+/g,'_')+'.pdf'),
    size:'196 KB',
    reportKey:'coa', listId:'plant',
    subject:`Certificate of Analysis · ${source} (Sample ${id})`,
    body:`Dear team,\n\nPlease find attached the Certificate of Analysis for ${source} (Sample ID ${id}), generated from Descon Assure LIQS.\n\nKindly acknowledge receipt.\n\nRegards,\n${myName()}`,
  }), 500);
}
function raiseRequest(){
  simpleAdd('Raise Special Request',[
    {key:'plant',label:'Plant',opts:['OU','UREA','NP','CAN','Ammonia','Nitric Acid']},
    {key:'source',label:'Source / sample point',ph:'e.g. Cooling tower basin'},
    {key:'params',label:'Parameters',opts:['3','4','5','6','7']},
    {key:'note',label:'Reason',ph:'e.g. Suspected contamination after shutdown'},
  ], v=>{
    const nid=Math.max(...DATA.special.rows.map(r=>r[0]))+1;
    const code='SP-'+Math.floor(Math.random()*0xFFFFFF).toString(16).toUpperCase().padStart(6,'0');
    const d=new Date(); const src=v.source||(`SS-${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${nid}`);
    DATA.special.rows.unshift([nid,v.plant,src,code,'—',parseInt(v.params||5),'Requested',myName().toUpperCase(),v.note||'']);
    audit('Raised special request','Non-Routine',`${code} · ${src}`);
    notify('New special request',`${code} · ${src} · by ${myName()}`,{icon:'flask-round',color:'#0060b0',route:state.route,tab:'special'});
    toast('Special request '+code+' raised','ok');
  });
}
