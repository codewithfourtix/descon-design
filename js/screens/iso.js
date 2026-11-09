/* ===== ISO/IEC 17025 audits, nonconformities & CAPA ===== */
function progressList(items){
  return items.map(it=>`<div style="margin:10px 0">
    <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:5px">
      <span style="color:var(--muted)">${it.n}</span><span style="color:var(--ink);font-weight:600">${it.v}</span></div>
    <div class="progress"><span style="width:${it.p}%;background:${it.c}"></span></div>
  </div>`).join('');
}
let ISO_SCOPE='Internal';
function isoTable(){ return ISO_SCOPE==='Internal'?DATA.iso.table:DATA.extAudits; }
function capaBadge(s){ const m={'Open':'b-red','In Progress':'b-amber','Pending Approval':'b-blue','Closed':'b-green'}; return `<span class="badge ${m[s]||'b-blue'}">${s}</span>`; }
function screenISO(){
  const rows=isoTable();
  const total=rows.length;
  const cnt=s=>rows.filter(r=>r[6]===s).length;
  const statusDist=[['Planned','#1f2a44'],['Ongoing','#f59f00'],['Completed','#0060b0'],['Closed','#20c997']].map(([n,c])=>({n,v:`${cnt(n)} (${total?Math.round(cnt(n)/total*100):0}%)`,c,p:total?cnt(n)/total*100:0}));
  const caps=DATA.capas||[];
  const clauseCount={}; caps.forEach(c=>clauseCount[c.clause]=(clauseCount[c.clause]||0)+1);
  const clauseColors=['#4dabf7','#f59f00','#0060b0','#20c997','#e64980','#7c6bf5'];
  const clauseNC=Object.entries(clauseCount).map(([k,v],i)=>({n:'Clause '+k,v:v+' NC'+(v>1?'s':''),c:clauseColors[i%6],p:Math.min(100,v*34)}));
  const ownerCount={}; caps.filter(c=>c.status!=='Closed').forEach(c=>ownerCount[c.owner]=(ownerCount[c.owner]||0)+1);
  const maxO=Math.max(1,...Object.values(ownerCount));
  const deptRisk=Object.entries(ownerCount).map(([k,v])=>({n:k,v:v+' open',c:v>=maxO?'#e03131':'#f59f00',p:v/maxO*100}));
  const capaStat=[['Open','#fdeaea','#d64545'],['In Progress','#fef4e2','#c98110'],['Pending Approval','#e8f1fa','#0060b0'],['Closed','#e6f7f1','#0a9d78']]
    .map(([n,bg,c])=>`<div class="stat-box" style="background:${bg};flex:1;padding:10px;border-radius:8px;cursor:pointer" onclick="capaFilter('${n}')"><div class="n" style="color:${c};font-size:19px;font-weight:700">${caps.filter(x=>x.status===n).length}</div><div class="l" style="font-size:10.5px;color:#6b7280">${n}</div></div>`).join('');
  const overdue=caps.filter(c=>c.status!=='Closed'&&new Date(c.due)<new Date()).length;

  const auditTbl = makeTable('audits',{
    title:ISO_SCOPE+' Audits', pageSize:6, search:['id','type','dept','org','lead','status'],
    toolbar:`<button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addAudit()"><i data-lucide="plus"></i>Plan Audit</button>`,
    onOpen:r=>viewAudit(r.id),
    columns:[
      {key:'id',label:'AUDIT ID',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'type',label:'TYPE',render:v=>`<span class="badge b-teal-o">${v}</span>`},
      {key:'org',label:'BODY / AREA'},
      {key:'date',label:'AUDIT DATE',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Completed'||v==='Closed'?'b-green':v==='Ongoing'?'b-amber':'b-blue'}">${v}</span>`},
      {key:'nc',label:'NCs',render:v=>`<span class="badge ${v==='0 NCs'?'b-green':'b-red'}">${v}</span>`},
      {key:'comp',label:'SCORE',render:v=>`<span style="color:var(--brand);font-weight:600">${v}</span>`},
      {key:'x',label:'',sortable:false,align:'right',render:(_,r)=>`<span style="display:inline-flex;gap:8px"><i data-lucide="pencil" style="width:14px;color:var(--amber);cursor:pointer" onclick="editAudit('${r.id}')"></i></span>`},
    ], data:rows.map(r=>({id:r[0],type:r[1],dept:r[2],org:r[3],lead:r[4],date:r[5],status:r[6],nc:r[7],comp:r[8]}))
  });
  const capaTbl = makeTable('capas',{
    title:'CAPA Register', pageSize:6, search:['id','title','owner','status','source'],
    toolbar:`<button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="logCapa()"><i data-lucide="plus"></i>New CAPA</button><button class="btn btn-green" onclick="exportGeneric('capas','capa-register.csv')"><i data-lucide="download"></i>Export</button>`,
    onOpen:r=>openCapa(r.id),
    columns:[
      {key:'id',label:'CAPA',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'title',label:'PROBLEM',render:v=>`<span style="color:var(--ink)">${esc(v)}</span>`},
      {key:'clause',label:'CLAUSE',align:'center'},
      {key:'owner',label:'OWNER'},
      {key:'due',label:'DUE',render:(v,r)=>`<span style="color:${r.status!=='Closed'&&new Date(v)<new Date()?'var(--descon-red);font-weight:600':'var(--muted)'}">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>capaBadge(v)},
    ], data:caps
  });

  return `
  <div class="workspace-split" style="height:calc(100vh - 100px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div><div class="ph-t">Audit &amp; CAPA Workspace</div><div class="ph-s">ISO/IEC 17025:2017 · internal audits, accreditation and customer audits</div></div>
        <div class="tabrow pills" style="margin:0">
          <div class="tab ${ISO_SCOPE==='Internal'?'active':''}" onclick="isoScope('Internal')"><i data-lucide="building-2"></i>Internal</div>
          <div class="tab ${ISO_SCOPE==='External'?'active':''}" onclick="isoScope('External')"><i data-lucide="briefcase"></i>External</div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:repeat(3,minmax(200px,1fr));overflow-x:auto;padding-bottom:4px">
        <div class="card"><div class="card-head"><div class="card-title">Audit Status</div></div><div class="card-pad">${progressList(statusDist)}</div></div>
        <div class="card"><div class="card-head"><div class="card-title">NCs by Clause</div></div><div class="card-pad">${progressList(clauseNC)}</div></div>
        <div class="card"><div class="card-head"><div class="card-title">Open CAPAs by Owner</div></div><div class="card-pad">${deptRisk.length?progressList(deptRisk):'<div class="empty" style="padding:20px">No open CAPAs</div>'}</div></div>
      </div>

      <div class="card">${auditTbl}</div>
      <div class="card">${capaTbl}</div>
    </div>

    <div class="detail-panel">
      <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px">Corrective Action Panel</div>
      <div>
        <div style="font-weight:600;font-size:12px;color:var(--ink);margin-bottom:8px">CAPA Status</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${capaStat}</div>
        ${overdue?`<div class="note-line bad" style="margin-top:8px"><i data-lucide="alarm-clock"></i>${overdue} CAPA${overdue>1?'s are':' is'} past due</div>`:''}
      </div>
      <div style="margin-top:8px">
        <div style="font-weight:600;font-size:12px;color:var(--ink);margin-bottom:8px">Action Items</div>
        ${renderActionQueue(caps.filter(c=>c.status!=='Closed').slice(0,4).map(c=>({title:c.status==='Pending Approval'?`Approve closure · ${c.id}`:c.status==='Open'?`Start corrective action · ${c.id}`:`Upload evidence · ${c.id}`, meta:`${esc(c.title).slice(0,48)} · due ${c.due}`, priority:new Date(c.due)<new Date()?'high':'med', fn:`openCapa('${c.id}')`})))}
      </div>
      <div style="margin-top:auto">
        <button class="btn btn-out" style="width:100%;justify-content:center" onclick="generateIsoReport()"><i data-lucide="file-text"></i> Generate &amp; Email Report</button>
      </div>
    </div>
  </div>`;
}
function capaFilter(s){ if(TBL.capas){ TBL.capas.filters={status:s}; _tp('capas'); rerenderTable('capas'); toast('Showing '+s+' CAPAs','info'); } }
function openCapa(id){
  const c=(DATA.capas||[]).find(x=>x.id===id); if(!c) return;
  const flow=['Open','In Progress','Pending Approval','Closed']; const i=flow.indexOf(c.status);
  const next={'Open':['Start corrective action','play','Lab Analyst'],'In Progress':['Submit for approval','send','Lab Analyst'],'Pending Approval':['Approve & close','check-check','QC Manager']}[c.status];
  const acts=[];
  if(next) acts.push({label:next[0],cls:'btn-green',icon:next[1],fn:`capaAdvance('${c.id}')`});
  if(c.status!=='Closed') acts.push({label:'Attach evidence',cls:'btn-out',icon:'paperclip',fn:`capaEvidence('${c.id}')`});
  if(c.status==='Pending Approval') acts.push({label:'Send back',cls:'btn-out',icon:'undo-2',fn:`capaBack('${c.id}')`});
  openRecord(`${c.id} · CAPA`,[
    ['Problem',esc(c.title)],['Source',c.source],['ISO 17025 clause',c.clause],['Root cause',esc(c.root)],['Corrective action',esc(c.action)],
    ['Owner',c.owner],['Due',c.due],['Status',capaBadge(c.status)],['Evidence',(c.evidence||[]).length?(c.evidence.map(e=>`<span class="badge b-teal-o"><i data-lucide="paperclip" style="width:10px"></i>${esc(e)}</span>`).join(' ')):'None yet'],
  ], acts, `<div class="tl">${flow.map((s,k)=>`<div class="tl-step ${k<i?'done':k===i?'cur':''}"><span></span>${s}</div>`).join('')}</div>`);
}
function capaAdvance(id){
  const c=DATA.capas.find(x=>x.id===id); if(!c) return;
  const order={'Open':'In Progress','In Progress':'Pending Approval','Pending Approval':'Closed'};
  if(c.status==='Pending Approval'&&!can('QC Manager','Closing a CAPA')) return;
  if(c.status==='In Progress'&&!(c.evidence||[]).length){ toast('Attach evidence before submitting for approval','err'); return; }
  c.status=order[c.status];
  if(c.status==='Closed'){ c.closedBy=myName(); c.closedAt=fmtStamp(); }
  audit('CAPA '+c.status.toLowerCase(),'ISO 17025',`${c.id} · ${c.title}`);
  if(c.status==='Pending Approval') notify(`${c.id} waiting for approval`,`${c.title} · submitted by ${myName()}`,{icon:'clipboard-check',color:'#0060b0',route:'iso'});
  render(); openCapa(id); toast(`${c.id} is now ${c.status}`,'ok');
}
function capaBack(id){ const c=DATA.capas.find(x=>x.id===id); if(!c) return; c.status='In Progress'; audit('CAPA sent back','ISO 17025',c.id); render(); openCapa(id); toast(c.id+' sent back to the owner','info'); }
function capaEvidence(id){
  const c=DATA.capas.find(x=>x.id===id); if(!c) return;
  const inp=document.createElement('input'); inp.type='file'; inp.multiple=true;
  inp.onchange=()=>{ const files=[...inp.files]; if(!files.length) return;
    c.evidence=(c.evidence||[]).concat(files.map(f=>f.name));
    audit('Attached CAPA evidence','ISO 17025',`${c.id} · ${files.map(f=>f.name).join(', ')}`);
    render(); openCapa(id); toast(`${files.length} file${files.length>1?'s':''} attached to ${c.id}`,'ok'); };
  inp.click();
}
function generateIsoReport(){
  const caps=DATA.capas||[];
  toast('Generating audit compliance report…','info');
  setTimeout(()=>emailReportViaOutlook({
    report:'ISO/IEC 17025 Audit Compliance Report',
    file:`ISO17025_Compliance_Report_${fmtDate().replace(/ /g,'')}.pdf`,
    size:'312 KB', reportKey:'iso', listId:'iso',
    subject:`ISO/IEC 17025 Audit Compliance Report · ${fmtDate()}`,
    body:`Dear committee,\n\nPlease find attached the ISO/IEC 17025 audit compliance report.\n\nSummary: ${DATA.iso.table.length} internal and ${DATA.extAudits.length} external audits, ${caps.filter(c=>c.status!=='Closed').length} open CAPAs, ${caps.filter(c=>c.status==='Closed').length} closed.\n\nRegards,\n${myName()}`,
  }), 700);
}
function isoScope(s){ ISO_SCOPE=s; if(TBL.audits) TBL.audits.page=1; render(); }
const AUDIT_LABELS=['Audit ID','Type','Department','Body / organisation','Lead assessor','Audit date','Status','NC count','Score'];
function viewAudit(id){
  const r=isoTable().find(x=>x[0]===id); if(!r) return;
  const linked=(DATA.capas||[]).filter(c=>c.source===id);
  openRecord('Audit '+id, AUDIT_LABELS.map((l,i)=>[l,r[i]]),
    [{label:'Edit',cls:'btn-out',icon:'pencil',fn:`editAudit('${id}')`},...(r[6]!=='Completed'&&r[6]!=='Closed'?[{label:'Mark completed',cls:'btn-green',icon:'check',fn:`auditComplete('${id}')`}]:[])],
    linked.length?`<div class="ctx-k" style="margin:12px 0 6px">Linked CAPAs</div>${renderActionQueue(linked.map(c=>({title:`${c.id} · ${esc(c.title)}`,meta:c.status+' · due '+c.due,fn:`openCapa('${c.id}')`})))}`:'');
}
function auditComplete(id){
  const r=isoTable().find(x=>x[0]===id); if(!r) return;
  if(!can('Auditor','Completing an audit')) return;
  r[6]='Completed'; if(r[8]==='—') r[8]=(88+Math.floor(Math.random()*10))+'%';
  audit('Completed audit','ISO 17025',id); closeDrawer(); render(); toast(id+' marked completed','ok');
}
function editAudit(id){
  const r=isoTable().find(x=>x[0]===id); if(!r) return;
  window.__auditEdit=id;
  openModal({title:'Edit '+id,wide:true,body:`<div class="form-grid">${AUDIT_LABELS.map((l,i)=>i===6?`<div class="form-row"><label>${l}</label><select id="au-${i}">${['Planned','Ongoing','Completed','Closed'].map(o=>`<option ${o===r[i]?'selected':''}>${o}</option>`).join('')}</select></div>`:`<div class="form-row"><label>${l}</label><input id="au-${i}" value="${esc(r[i])}" ${i===0?'disabled':''}></div>`).join('')}</div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Save',cls:'btn-green',icon:'check',fn:'saveAudit()'}]});
}
function saveAudit(){const r=isoTable().find(x=>x[0]===window.__auditEdit);for(let i=1;i<=8;i++){const el=document.getElementById('au-'+i);if(el)r[i]=el.value;}audit('Edited audit','ISO 17025',r[0]);closeModal();closeDrawer();render();toast('Audit '+r[0]+' updated','ok');}
function addAudit(){
  const ext=ISO_SCOPE==='External';
  simpleAdd(ext?'Plan External Audit':'Plan Internal Audit',[
    {key:'type',label:'Type',opts:ext?['Accreditation','Surveillance','Customer Audit']:['Assessment','Surveillance','Follow-up']},
    {key:'dept',label:'Department',opts:['Quality Control','Analytical Laboratory','Sampling','Instrumentation']},
    {key:'org',label:ext?'Audit body / customer':'Area audited',ph:ext?'e.g. PNAC':'e.g. Oxychem QC Lab'},
    {key:'lead',label:'Lead assessor'},
    {key:'date',label:'Audit date',ph:'e.g. Dec 15, 2026'},
  ], v=>{
    const tbl=isoTable(); const y=new Date().getFullYear();
    const id=ext?`EXT-${(v.type||'AUD').slice(0,3).toUpperCase()}-${y}-${pad2(tbl.length+1)}`:`ISO-INT-${y}-${String(tbl.length+1).padStart(3,'0')}`;
    tbl.unshift([id,v.type,v.dept,v.org||'Oxychem QC Lab',v.lead||myName(),v.date||fmtDate(addDays(new Date(),21)),'Planned','0 NCs','—']);
    audit('Planned audit','ISO 17025',id); toast('Audit '+id+' planned','ok');
  });
}
