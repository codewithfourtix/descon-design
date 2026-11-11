/* ===== Finished Goods (batch release) + Certificates of Analysis ===== */

function routeBatches(){ return (DATA.batches||[]).filter(b=>b.route===state.route); }
function batchById(id){ return (DATA.batches||[]).find(b=>b.id===id); }
function batchScore(b){
  const done=b.tests.filter(t=>t.result!==''&&t.result!=null);
  const fails=b.tests.filter(t=>checkSpec(t.spec,t.result)==='fail');
  return {done:done.length,total:b.tests.length,fails:fails.length};
}
function batchBadge(s){
  const m={'Released':'b-green','Dispatched':'b-blue','Awaiting QC':'b-teal-o','Under Test':'b-blue','On Hold':'b-amber','Rejected':'b-red'};
  const ic={'Released':'circle-check','Dispatched':'truck','Awaiting QC':'clock','Under Test':'flask-conical','On Hold':'pause-circle','Rejected':'x-circle'};
  return `<span class="badge ${m[s]||'b-blue'}"><i data-lucide="${ic[s]||'circle'}" style="width:11px"></i>${s}</span>`;
}

function screenRelease(){
  const list=routeBatches();
  const n=s=>list.filter(b=>b.status===s).length;
  const decided=n('Released')+n('Dispatched')+n('Rejected')+n('On Hold');
  const rft=decided?(((n('Released')+n('Dispatched'))/decided)*100).toFixed(1)+'%':'—';
  const tbl=makeTable('batches',{
    title:'Finished Goods Batches', pageSize:10, search:['id','product','tank','status','by'],
    toolbar:`<button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="newBatch()"><i data-lucide="package-plus"></i>Register Batch</button><button class="btn btn-green" onclick="exportGeneric('batches','finished-goods.csv')"><i data-lucide="download"></i>Export</button>`,
    onOpen:r=>openBatch(r.id),
    columns:[
      {key:'id',label:'BATCH',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'product',label:'PRODUCT',render:v=>`<span style="font-weight:500;color:var(--ink)">${v}</span>`},
      {key:'tank',label:'TANK / SILO'},
      {key:'qty',label:'QTY',align:'right',render:(v,r)=>`${v} ${r.unit}`},
      {key:'mfg',label:'MFG DATE',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'tests',label:'TESTS',sortable:false,render:(_,r)=>{const s=batchScore(r); return `<span class="tests-pill ${s.fails?'bad':s.done===s.total?'ok':''}">${s.done}/${s.total}${s.fails?` · ${s.fails} OOS`:''}</span>`;}},
      {key:'status',label:'STATUS',render:v=>batchBadge(v)},
    ], data:list.map(b=>({...b}))
  });
  return `
  <div class="workspace-board">
    <div class="page-head">
      <div><div class="ph-t">Finished Goods Release</div><div class="ph-s">Test every batch against its specification, then release, hold or reject it.</div></div>
    </div>
    ${kpiRow([
      {l:'Awaiting QC',v:String(n('Awaiting QC')+n('Under Test')),i:'clock',s:'Need results or a decision'},
      {l:'Released',v:String(n('Released')),i:'circle-check',s:`Cleared · ${n('Dispatched')} dispatched`},
      {l:'On Hold',v:String(n('On Hold')),i:'pause-circle',s:'Waiting on retest'},
      {l:'Rejected',v:String(n('Rejected')),i:'x-circle',s:'Out of specification'},
      {l:'Right First Time',v:rft,i:'target',s:'Released ÷ decided'},
    ],5)}
    <div class="card">${tbl}</div>
  </div>`;
}

function openBatch(id){
  const b=batchById(id); if(!b) return;
  const locked=b.status==='Released'||b.status==='Rejected'||b.status==='Dispatched';
  const coa=(DATA.coas||[]).find(c=>c.batch===b.id&&c.status==='Issued');
  const stepIdx=b.status==='Dispatched'?4:b.status==='Released'?(coa?3:2):b.status==='Under Test'?1:0;
  const flow=['Registered','Tested','Released','CoA issued','Dispatched'];
  const tl=b.status==='Rejected'||b.status==='On Hold'?'':`<div class="tl" style="margin:12px 0 0">${flow.map((s,k)=>`<div class="tl-step ${k<stepIdx?'done':k===stepIdx?'cur':''}"><span></span>${s}</div>`).join('')}</div>${b.status==='Dispatched'?'<div class="note-line"><i data-lucide="flag"></i>Flow complete: tested, released, certified and dispatched.</div>':''}`;
  const rows=b.tests.map((t,i)=>{
    const st=checkSpec(t.spec,t.result);
    return `<tr><td style="font-weight:600;color:var(--ink)">${t.param}</td><td style="color:var(--muted)">${t.unit||'—'}</td><td>${t.spec}</td>
      <td style="width:120px">${locked?`<b>${t.result||'—'}</b>`:`<input class="lab-in bt-in" data-i="${i}" value="${esc(t.result)}" placeholder="—" oninput="batchLive(this,'${jsq(t.spec)}')">`}</td>
      <td class="bt-st">${stBadge(st)}</td></tr>`;
  }).join('');
  const s=batchScore(b);
  const acts=[{label:'Close',cls:'btn-out',fn:'closeModal()'}];
  if(!locked){
    acts.push({label:'Auto-fill from instrument',cls:'btn-out',icon:'wand-2',fn:`batchFill('${b.id}')`});
    acts.push({label:'Save results',cls:'btn-out',icon:'save',fn:`batchSave('${b.id}')`});
    if(b.status!=='On Hold') acts.push({label:'Hold',cls:'btn-out',icon:'pause-circle',fn:`batchDecide('${b.id}','On Hold')`});
    acts.push({label:'Reject',cls:'btn-red',icon:'x-circle',fn:`batchDecide('${b.id}','Rejected')`});
    acts.push({label:'Release batch',cls:'btn-green',icon:'circle-check',fn:`batchRelease('${b.id}')`});
  } else if(b.status==='Released'){
    if(coa){ acts.push({label:'View CoA',cls:'btn-out',icon:'file-check-2',fn:`closeModal();viewCoa('${coa.id}')`}); acts.push({label:'Mark dispatched',cls:'btn-green',icon:'truck',fn:`batchDispatch('${b.id}')`}); }
    else acts.push({label:'Generate CoA',cls:'btn-green',icon:'file-check-2',fn:`closeModal();newCoa('${b.id}')`});
  } else if(b.status==='Dispatched'&&coa){
    acts.push({label:'View CoA',cls:'btn-out',icon:'file-check-2',fn:`closeModal();viewCoa('${coa.id}')`});
  }
  openModal({title:`Batch ${b.id} · ${b.product}`, wide:true, body:`
    <div class="bt-head">
      <div><span>Status</span>${batchBadge(b.status)}</div>
      <div><span>Tank / silo</span><b>${b.tank}</b></div>
      <div><span>Quantity</span><b>${b.qty} ${b.unit}</b></div>
      <div><span>Manufactured</span><b>${b.mfg}</b></div>
      <div><span>Sampling point</span><b>${b.point}</b></div>
    </div>
    ${tl}
    ${b.dispatch?`<div class="note-line"><i data-lucide="truck"></i>Dispatched ${esc(b.dispatch.at)} · ${esc(b.dispatch.ref)} · to ${esc(b.dispatch.customer)}</div>`:''}
    ${b.reason?`<div class="note-line"><i data-lucide="info"></i>${esc(b.reason)}${b.decidedBy?` · ${esc(b.decidedBy)}`:''}</div>`:''}
    <div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>PARAMETER</th><th>UNIT</th><th>SPECIFICATION</th><th>RESULT</th><th>STATUS</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="bt-sum" id="bt-sum">${s.done}/${s.total} results entered${s.fails?` · <b style="color:var(--descon-red)">${s.fails} out of specification</b>`:''}</div>`,
    actions:acts});
}
function stBadge(st){ return st==='pass'?'<span class="badge b-green">Pass</span>':st==='fail'?'<span class="badge b-red">OOS</span>':'<span class="badge b-teal-o">Pending</span>'; }
function batchLive(inp,spec){
  const st=checkSpec(spec,inp.value);
  inp.classList.toggle('oos',st==='fail'); inp.classList.toggle('ok',st==='pass');
  const td=inp.closest('tr').querySelector('.bt-st'); if(td) td.innerHTML=stBadge(st);
}
function batchRead(b){
  document.querySelectorAll('.bt-in').forEach(inp=>{ const i=+inp.dataset.i; if(b.tests[i]) b.tests[i].result=inp.value.trim(); });
}
function batchFill(id){
  const b=batchById(id); if(!b) return;
  document.querySelectorAll('.bt-in').forEach(inp=>{ if(!inp.value){ const t=b.tests[+inp.dataset.i]; inp.value=String(sampleWithin(t.spec)); batchLive(inp,t.spec); } });
  toast('Results pulled from the instrument queue','info');
}
function batchSave(id, quiet){
  const b=batchById(id); if(!b) return;
  batchRead(b);
  const s=batchScore(b);
  if(s.done&&b.status==='Awaiting QC') b.status='Under Test';
  audit('Entered batch results','Finished Goods',`${b.id}: ${s.done}/${s.total} results${s.fails?`, ${s.fails} OOS`:''}`);
  if(s.fails) notify(`${b.id} has ${s.fails} OOS result${s.fails>1?'s':''}`,`${b.product} · review before release`,{icon:'triangle-alert',color:'#e0930b',route:b.route,tab:'wpp'});
  if(!quiet){ closeModal(); render(); toast(`Results saved for ${b.id}`,'ok'); }
}
function batchRelease(id){
  const b=batchById(id); if(!b) return;
  batchRead(b);
  const s=batchScore(b);
  if(s.done<s.total){ toast(`Enter all ${s.total} results before release (${s.total-s.done} missing)`,'err'); return; }
  if(s.fails){ toast(`${s.fails} result${s.fails>1?'s are':' is'} out of specification. Hold or reject this batch.`,'err'); return; }
  if(!can('QC Manager','Releasing a batch')) return;
  confirmModal('Release batch',`Release <b>${b.id}</b> (${b.product}, ${b.qty} ${b.unit}) for dispatch? This is signed with your name and logged in the audit trail.`,()=>{
    b.status='Released'; b.reason=''; b.decidedBy=myName(); b.decidedAt=fmtStamp();
    audit('Released batch','Finished Goods',`${b.id} · ${b.product}`);
    notify(`Batch ${b.id} released`,`${b.product} · ${b.qty} ${b.unit} · by ${myName()}`,{icon:'package-check',color:'#0a9d78',route:b.route,tab:'wpp'});
    render();
    toast(`${b.id} released. Generate its CoA from the Certificate tab.`,'ok');
  },'Release');
}
function batchDecide(id, status){
  const b=batchById(id); if(!b) return;
  if(status==='Rejected'&&!can('QC Manager','Rejecting a batch')) return;
  batchRead(b);
  openModal({title:(status==='Rejected'?'Reject':'Hold')+' batch '+b.id, body:`
    <div class="form-row"><label>Reason</label><select id="bd-reason">${(status==='Rejected'?['Out of specification','Contamination','Packaging failure','Customer requirement not met']:['Awaiting retest','Awaiting supervisor review','Instrument under investigation','Sample re-collection'])
      .map(o=>`<option>${o}</option>`).join('')}</select></div>
    <div class="form-row"><label>Comment</label><input id="bd-note" placeholder="Optional details"></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:status==='Rejected'?'Reject batch':'Put on hold',cls:status==='Rejected'?'btn-red':'btn-green',fn:`batchDecideGo('${b.id}','${status}')`}]});
}
function batchDecideGo(id,status){
  const b=batchById(id); if(!b) return;
  const r=document.getElementById('bd-reason').value, note=document.getElementById('bd-note').value.trim();
  b.status=status; b.reason=r+(note?` · ${note}`:''); b.decidedBy=myName(); b.decidedAt=fmtStamp();
  audit(status==='Rejected'?'Rejected batch':'Put batch on hold','Finished Goods',`${b.id} · ${b.reason}`);
  notify(`Batch ${b.id} ${status==='Rejected'?'rejected':'on hold'}`,b.reason,{icon:status==='Rejected'?'x-circle':'pause-circle',color:status==='Rejected'?'#e03131':'#e0930b',route:b.route,tab:'wpp'});
  closeModal(); render(); toast(`${b.id} ${status==='Rejected'?'rejected':'put on hold'}`,status==='Rejected'?'warn':'info');
}
function batchDispatch(id){
  const b=batchById(id); if(!b) return;
  const coa=(DATA.coas||[]).find(c=>c.batch===b.id&&c.status==='Issued');
  openModal({title:'Dispatch batch '+b.id, body:`
    <div class="kv"><span>Product</span><span>${b.product}</span></div>
    <div class="kv"><span>CoA</span><span>${coa?coa.id+' · '+esc(coa.customer):'—'}</span></div>
    <div class="form-row" style="margin-top:12px"><label>Gate pass / delivery no.</label><input id="dp-ref" placeholder="e.g. GP-26-1182"></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Confirm dispatch',cls:'btn-green',icon:'truck',fn:`batchDispatchGo('${id}')`}]});
}
function batchDispatchGo(id){
  const b=batchById(id); const coa=(DATA.coas||[]).find(c=>c.batch===b.id&&c.status==='Issued');
  b.status='Dispatched'; b.dispatch={at:fmtStamp(),ref:document.getElementById('dp-ref').value.trim()||'Gate pass pending',customer:coa?coa.customer:'—',by:myName()};
  audit('Dispatched batch','Finished Goods',`${b.id} · ${b.dispatch.ref}`);
  notify(`Batch ${b.id} dispatched`,`${b.product} · to ${b.dispatch.customer}`,{icon:'truck',color:'#0060b0',route:b.route,tab:'wpp'});
  closeModal(); render(); toast(`${b.id} dispatched. Flow complete.`,'ok');
}
function newBatch(){
  const prods=[...new Map(routeBatches().map(b=>[b.product,b])).values()];
  const cards=(DATA.labByStream&&DATA.labByStream[state.route])||DATA.lab.cards;
  const opts=prods.length?prods.map(b=>b.product):cards.map(c=>c.t);
  simpleAdd('Register Finished Batch',[
    {key:'product',label:'Product',opts},
    {key:'tank',label:'Tank / silo',ph:state.route==='h2o2'?'e.g. TK-104':'e.g. Silo 3'},
    {key:'qty',label:'Quantity (MT)',ph:'e.g. 40'},
  ], v=>{
    const tpl=prods.find(b=>b.product===v.product);
    const card=cards.find(c=>c.t===v.product)||cards[0];
    const tests=tpl?tpl.tests.map(t=>({...t,result:''})):card.rows.filter(r=>r[2]).slice(0,6).map(r=>({param:r[0],unit:r[1],spec:r[2],result:''}));
    const prefix=state.route==='h2o2'?'HP-':state.route==='urea'?'UR-':state.route.toUpperCase().slice(0,2)+'-';
    const id=seq(prefix,DATA.batches.filter(b=>b.id.startsWith(prefix)),'id',2400);
    DATA.batches.unshift({id,route:state.route,product:v.product,point:tpl?tpl.point:(card.t.match(/\(([^)]+)\)/)||[,'—'])[1],
      qty:parseFloat(v.qty)||25,unit:'MT',tank:v.tank||'TK-101',mfg:fmtDate(),status:'Awaiting QC',by:myName(),tests,reason:''});
    audit('Registered batch','Finished Goods',`${id} · ${v.product}`);
    toast(`Batch ${id} registered. Enter its results to release it.`,'ok');
    setTimeout(()=>openBatch(id),250);
  });
}

/* ---------------- Certificates of Analysis ---------------- */
function screenCoa(){
  const list=(DATA.coas||[]).filter(c=>c.route===state.route);
  const issued=list.filter(c=>c.status==='Issued');
  const now=new Date(); const thisMonth=issued.filter(c=>c.issued.includes(MON[now.getMonth()]+' '+now.getFullYear())).length;
  const tbl=makeTable('coas',{
    title:'Certificates of Analysis', pageSize:10, search:['id','batch','product','customer','status'],
    toolbar:`<button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="newCoa()"><i data-lucide="file-plus-2"></i>Generate CoA</button><button class="btn btn-green" onclick="exportGeneric('coas','certificates.csv')"><i data-lucide="download"></i>Export</button>`,
    onOpen:r=>viewCoa(r.id),
    columns:[
      {key:'id',label:'CERTIFICATE',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'batch',label:'BATCH'},
      {key:'product',label:'PRODUCT',render:v=>`<span style="font-weight:500;color:var(--ink)">${v}</span>`},
      {key:'customer',label:'CUSTOMER'},
      {key:'issued',label:'ISSUED',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'by',label:'APPROVED BY'},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Issued'?'b-green':v==='Revoked'?'b-red':'b-teal-o'}">${v}</span>`},
    ], data:list.map(c=>({...c}))
  });
  const pending=routeBatches().filter(b=>b.status==='Released'&&!(DATA.coas||[]).some(c=>c.batch===b.id&&c.status==='Issued'));
  return `
  <div class="workspace-board">
    <div class="page-head"><div><div class="ph-t">Certificates of Analysis</div><div class="ph-s">Issued from released batches only, with every result traced to its specification.</div></div></div>
    ${kpiRow([
      {l:'Issued',v:String(issued.length),i:'file-check-2',s:'Valid certificates'},
      {l:'This Month',v:String(thisMonth),i:'calendar',s:MON[now.getMonth()]+' '+now.getFullYear()},
      {l:'Ready to Certify',v:String(pending.length),i:'package-check',s:'Released, no CoA yet'},
      {l:'Revoked',v:String(list.filter(c=>c.status==='Revoked').length),i:'ban',s:'Withdrawn certificates'},
    ],4)}
    ${pending.length?`<div class="hint-bar"><i data-lucide="package-check"></i><span><b>${pending.length}</b> released batch${pending.length>1?'es are':' is'} ready for a certificate: ${pending.slice(0,4).map(b=>`<a onclick="newCoa('${b.id}')">${b.id}</a>`).join(', ')}</span></div>`:''}
    <div class="card">${tbl}</div>
  </div>`;
}
const CUSTOMERS=['Nishat Mills','Engro Polymer','Packages Ltd','Shan Foods','Interloop','Fauji Fertilizer','Sapphire Textiles','Nestle Pakistan','Internal transfer'];
function newCoa(batchId){
  const rel=(DATA.batches||[]).filter(b=>b.status==='Released'&&(b.route===state.route||b.id===batchId));
  if(!rel.length){ toast('Release a batch first. Certificates can only be issued for released batches.','warn'); return; }
  if(!can('Lab Supervisor','Issuing a certificate')) return;
  openModal({title:'Generate Certificate of Analysis', body:`
    <div class="form-row"><label>Released batch</label><select id="nc-batch">${rel.map(b=>`<option value="${b.id}" ${b.id===batchId?'selected':''}>${b.id} · ${b.product} · ${b.qty} ${b.unit}</option>`).join('')}</select></div>
    <div class="form-row"><label>Customer (from the customer list)</label><select id="nc-cust" onchange="ncFmt()">${(DATA.customers||[]).map(c=>`<option value="${c.id}">${esc(c.name)}${c.sap?' · SAP '+c.sap:''}</option>`).join('')}</select></div>
    <div class="note-line" id="nc-fmt" style="margin:-4px 0 10px"></div>
    <div class="form-row"><label>Customer PO / reference</label><input id="nc-ref" placeholder="e.g. PO-77812"></div>
    <div style="font-size:11.5px;color:var(--muted)">Customer missing? <a style="color:var(--brand);cursor:pointer" onclick="closeModal();go('customers')">Add or import customers</a></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Generate',cls:'btn-green',icon:'file-check-2',fn:'newCoaGo()'}]});
  ncFmt();
}
function ncFmt(){ const c=(DATA.customers||[]).find(x=>x.id===(document.getElementById('nc-cust')||{}).value); const el=document.getElementById('nc-fmt'); if(el&&c){ el.innerHTML=`<i data-lucide="file-text"></i>${esc(c.coa)}${c.fields?' · adds: '+esc(c.fields):''}`; if(window.lucide) lucide.createIcons(); } }
function newCoaGo(){
  const b=batchById(document.getElementById('nc-batch').value); if(!b) return;
  const c=(DATA.customers||[]).find(x=>x.id===document.getElementById('nc-cust').value)||{name:'Internal transfer',id:'',sap:'',coa:'Descon standard',fields:''};
  const cust=c.name;
  const ref=document.getElementById('nc-ref').value.trim();
  const id=seq('COA-'+new Date().getFullYear()+'-',DATA.coas,'id',400).replace(/-(\d+)$/,(m,n)=>'-'+String(n).padStart(4,'0'));
  DATA.coas.unshift({id,batch:b.id,route:b.route,product:b.product,customer:cust,customerId:c.id,sap:c.sap,format:c.coa,fields:c.fields,ref,issued:fmtDate(),by:signer(),status:'Issued'});
  audit('Issued CoA','Certificates',`${id} · ${b.id} · ${cust}`);
  notify(`CoA ${id} issued`,`${b.product} · ${b.id} → ${cust}`,{icon:'file-check-2',color:'#0060b0',route:b.route,tab:'coa'});
  closeModal();
  if(state.tab!=='coa'){ state.route=b.route; setTab('coa'); } else render();
  setTimeout(()=>viewCoa(id),200);
}
function signer(){ return myName()===me().role?myName():myName()+' ('+me().role+')'; }
function coaHash(c){ let h=2166136261; const s=c.id+c.batch+c.customer+c.issued; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(16).toUpperCase().padStart(8,'0'); }
function coaDocHTML(c, b){
  const rows=b.tests.map(t=>{const st=checkSpec(t.spec,t.result);
    return `<tr><td>${t.param}</td><td>${t.unit||'—'}</td><td>${t.spec}</td><td><b>${t.result||'—'}</b></td><td class="${st==='fail'?'f':'p'}">${st==='fail'?'FAIL':'PASS'}</td></tr>`;}).join('');
  const allPass=b.tests.every(t=>checkSpec(t.spec,t.result)!=='fail');
  return `<div class="coa-doc" id="coa-doc">
    ${c.status==='Revoked'?'<div class="coa-void">REVOKED</div>':''}
    <div class="coa-top">
      <img src="assets/logo.jpg" alt="Descon">
      <div class="coa-co"><b>Descon Oxychem Limited</b><span>Quality Control Laboratory · Sheikhupura, Punjab, Pakistan</span></div>
      <div class="coa-no"><span>Certificate No.</span><b>${c.id}</b></div>
    </div>
    <div class="coa-title">Certificate of Analysis</div>
    <div class="coa-meta">
      <div><span>Product</span><b>${b.product}</b></div><div><span>Batch No.</span><b>${b.id}</b></div>
      <div><span>Quantity</span><b>${b.qty} ${b.unit}</b></div><div><span>Tank / silo</span><b>${b.tank}</b></div>
      <div><span>Manufacturing date</span><b>${b.mfg}</b></div><div><span>Date of issue</span><b>${c.issued}</b></div>
      <div><span>Customer</span><b>${esc(c.customer)}</b></div><div><span>Reference</span><b>${esc(c.ref||'—')}</b></div>
      ${c.sap?`<div><span>Customer no. (SAP)</span><b>${esc(c.sap)}</b></div><div><span>Format</span><b>${esc(c.format||'Descon standard')}</b></div>`:''}
    </div>
    ${c.fields?`<div class="coa-extra"><b>Customer-required fields:</b> ${esc(c.fields)}</div>`:''}
    <table class="coa-tbl"><thead><tr><th>Parameter</th><th>Unit</th><th>Specification</th><th>Result</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="coa-concl"><b>Conclusion:</b> ${allPass?'The batch conforms to the specification and is released for dispatch.':'The batch does not conform to the specification.'}</div>
    <div class="coa-sign">
      <div><span>Analysed by</span><b>${titleCase(b.by||'QC Analyst')}</b></div>
      <div><span>Approved by</span><b>${esc(c.by)}</b></div>
      <div><span>Electronic signature</span><b>${coaHash(c)}</b></div>
    </div>
    <div class="coa-foot">Generated by Descon Assure LIQS · Electronically signed record, valid without a handwritten signature · Results relate only to the batch tested.</div>
  </div>`;
}
function viewCoa(id){
  const c=(DATA.coas||[]).find(x=>x.id===id); if(!c) return;
  const b=batchById(c.batch);
  if(!b){ openRecord('Certificate '+c.id,[['Batch',c.batch],['Product',c.product],['Customer',c.customer],['Issued',c.issued],['Status',c.status]]); return; }
  const acts=[{label:'Close',cls:'btn-out',fn:'closeModal()'}];
  if(c.status==='Issued') acts.push({label:'Revoke',cls:'btn-out',icon:'ban',fn:`revokeCoa('${c.id}')`});
  acts.push({label:'Email',cls:'btn-out',icon:'mail',fn:`emailCoa('${c.id}')`});
  acts.push({label:'Print',cls:'btn-out',icon:'printer',fn:`printCoa('${c.id}')`});
  acts.push({label:'Download PDF',cls:'btn-green',icon:'download',fn:`coaPdf('${c.id}')`});
  openModal({title:'Certificate '+c.id, wide:true, body:`<div class="coa-wrap">${coaDocHTML(c,b)}</div>`, actions:acts});
}
async function coaPdf(id){
  const doc=document.getElementById('coa-doc'); if(!doc) return;
  toast('Building PDF…','info');
  try{
    await loadScript(LIBS.html2canvas); await loadScript(LIBS.jspdf);
    const canvas=await html2canvas(doc,{backgroundColor:'#ffffff',scale:2,useCORS:true,logging:false});
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:'pt',format:'a4'});
    const W=pdf.internal.pageSize.getWidth(), m=32, w=W-2*m, h=canvas.height*w/canvas.width;
    pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',m,m,w,h);
    pdf.save(id+'.pdf'); audit('Downloaded CoA','Certificates',id); toast('Saved '+id+'.pdf','ok');
  }catch(e){ console.error(e); toast('PDF export needs an internet connection; use Print instead','err'); }
}
function printCoa(id){
  const doc=document.getElementById('coa-doc'); if(!doc) return;
  const css=[...document.styleSheets].map(s=>{ try{ return [...s.cssRules].map(r=>r.cssText).join('\n'); }catch(e){ return ''; } }).join('\n');
  const w=window.open('','_blank','width=900,height=1100');
  if(!w){ toast('Allow pop-ups to print','warn'); return; }
  w.document.write(`<!doctype html><html><head><title>${id}</title><base href="${location.href.replace(/[^/]*$/,'')}"><style>${css}body{background:#fff;padding:24px}</style></head><body>${doc.outerHTML}</body></html>`);
  w.document.close(); setTimeout(()=>{ w.focus(); w.print(); },400);
  audit('Printed CoA','Certificates',id);
}
function emailCoa(id){
  const c=(DATA.coas||[]).find(x=>x.id===id); if(!c) return;
  closeModal();
  emailReportViaOutlook({report:'Certificate of Analysis · '+c.product, file:c.id+'.pdf', size:'184 KB', reportKey:'coa',
    subject:`Certificate of Analysis ${c.id} · ${c.product} · Batch ${c.batch}`,
    body:`Dear ${c.customer} team,\n\nPlease find attached Certificate of Analysis ${c.id} for ${c.product}, batch ${c.batch}.\n\nRegards,\n${myName()}\nQuality Control, Descon Oxychem Limited`});
}
function revokeCoa(id){
  const c=(DATA.coas||[]).find(x=>x.id===id); if(!c) return;
  if(!can('QC Manager','Revoking a certificate')) return;
  confirmModal('Revoke certificate',`Revoke <b>${c.id}</b>? The customer copy becomes invalid and the reason is kept in the audit trail.`,()=>{
    c.status='Revoked'; audit('Revoked CoA','Certificates',c.id); render(); toast(c.id+' revoked','warn');
  },'Revoke','danger');
}

/* ---------------- Customers (SAP list + CoA format per customer) ---------------- */
function screenCustomers(){
  const list=DATA.customers||[];
  const tbl=makeTable('customers',{
    title:'Customers', pageSize:12, search:['id','name','sap','product','coa','contact'],
    toolbar:`<button class="btn btn-out" onclick="custImport()"><i data-lucide="upload"></i>Import from SAP (CSV)</button><button class="btn btn-green" onclick="exportGeneric('customers','customers.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="custAdd()"><i data-lucide="plus"></i>Add Customer</button>`,
    onOpen:r=>custOpen(r.id),
    columns:[
      {key:'name',label:'CUSTOMER',render:v=>`<b style="color:var(--ink)">${esc(v)}</b>`},
      {key:'source',label:'SOURCE',render:v=>`<span class="badge ${v==='SAP'?'b-blue':'b-teal-o'}">${v}</span>`},
      {key:'sap',label:'SAP NO.',render:v=>v||'—'},
      {key:'product',label:'BUYS'},
      {key:'coa',label:'COA FORMAT',render:v=>`<span class="badge ${v==='Customer format'?'b-amber':'b-green'}">${v}</span>`},
      {key:'fields',label:'EXTRA FIELDS',render:v=>`<span style="color:var(--muted)">${esc(v||'—')}</span>`},
    ], data:list
  });
  return moduleShell('Customers',kpiRow([
    {l:'Customers',v:String(list.length),i:'building-2',s:'Used when issuing a CoA'},
    {l:'From SAP',v:String(list.filter(c=>c.source==='SAP').length),i:'database',s:'Imported from an SAP export'},
    {l:'Own CoA Format',v:String(list.filter(c=>c.coa==='Customer format').length),i:'file-text',s:'Need their own fields'},
    {l:'CoAs Issued',v:String((DATA.coas||[]).filter(c=>c.status==='Issued').length),i:'file-check-2',s:'Across all customers'},
  ],4),tbl,'Customer list for certificates. Import it from an SAP export file. A live SAP link would be a separate change request.');
}
function custOpen(id){
  const c=(DATA.customers||[]).find(x=>x.id===id); if(!c) return;
  const coas=(DATA.coas||[]).filter(x=>x.customerId===c.id||x.customer===c.name);
  openRecord(c.name,[['Customer ID',c.id],['Source',c.source],['SAP customer no.',c.sap||'—'],['Contact',c.contact||'—'],['Buys',c.product],['CoA format',c.coa],['Extra CoA fields',c.fields||'—'],['CoAs issued',String(coas.length)]],
    [{label:'Edit customer & CoA format',cls:'btn-green',icon:'pencil',fn:`custEdit('${c.id}')`}],
    coas.length?`<div class="ctx-k" style="margin:12px 0 6px">Certificates</div>${renderActionQueue(coas.slice(0,5).map(x=>({title:`${x.id} · ${x.product}`,meta:`${x.batch} · ${x.issued} · ${x.status}`,fn:`go('${x.route}');setTab('coa');setTimeout(()=>viewCoa('${x.id}'),150)`})))}`:'');
}
function custEdit(id){
  const c=(DATA.customers||[]).find(x=>x.id===id); if(!c) return;
  openModal({title:'Edit '+esc(c.name), body:`
    <div class="form-row"><label>Contact email</label><input id="ce-contact" value="${esc(c.contact||'')}"></div>
    <div class="form-row"><label>Product they buy</label><input id="ce-product" value="${esc(c.product||'')}"></div>
    <div class="form-row"><label>CoA format</label><select id="ce-coa">${['Descon standard','Customer format'].map(o=>`<option ${o===c.coa?'selected':''}>${o}</option>`).join('')}</select></div>
    <div class="form-row"><label>Extra fields on their CoA</label><input id="ce-fields" value="${esc(c.fields||'')}" placeholder="e.g. PO no., material code, shelf life"></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Save',cls:'btn-green',icon:'check',fn:`custSave('${id}')`}]});
}
function custSave(id){
  const c=(DATA.customers||[]).find(x=>x.id===id); if(!c) return;
  c.contact=document.getElementById('ce-contact').value.trim(); c.product=document.getElementById('ce-product').value.trim();
  c.coa=document.getElementById('ce-coa').value; c.fields=document.getElementById('ce-fields').value.trim();
  audit('Edited customer','Customers',`${c.name} · ${c.coa}`); closeModal(); closeDrawer(); render(); toast(c.name+' updated','ok');
}
function custAdd(){
  simpleAdd('Add Customer',[{key:'name',label:'Customer name'},{key:'sap',label:'SAP customer no. (optional)'},{key:'contact',label:'Contact email'},{key:'product',label:'Product they buy'},
    {key:'coa',label:'CoA format',opts:['Descon standard','Customer format']},{key:'fields',label:'Extra CoA fields',ph:'e.g. PO no., material code'}],
  v=>{ if(!v.name){ toast('Enter a customer name','err'); return; }
    const id=v.sap?'C-'+v.sap:seq('C-2',DATA.customers.filter(c=>/^C-2/.test(c.id)),'id',0).replace(/^C-2(\d+)$/,(m,n)=>'C-2'+String(n).padStart(5,'0'));
    DATA.customers.unshift({id,name:v.name,source:v.sap?'SAP':'Manual',sap:v.sap,contact:v.contact,product:v.product||'Any',coa:v.coa,fields:v.fields});
    audit('Added customer','Customers',v.name); toast(v.name+' added','ok'); });
}
function custImport(){
  openModal({title:'Import customers from SAP', wide:true, body:`
    <label class="drop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');custCsv(event.dataTransfer.files)">
      <input type="file" accept=".csv,text/csv" style="display:none" onchange="custCsv(this.files)">
      <i data-lucide="upload-cloud"></i><b id="cc-name">Drop the SAP customer export (CSV) here</b><span>Columns: Customer No, Name, Email, Product</span>
    </label>
    <div id="cc-prev" style="margin-top:10px"></div>
    <div style="margin-top:8px;font-size:11.5px;color:var(--muted)">Existing customers are updated by SAP number; new ones are added. <a style="color:var(--brand);cursor:pointer" onclick="custTemplate()">Download template</a></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Import',cls:'btn-green',icon:'upload',fn:'custImportGo()'}]});
  window.__custRows=null;
}
function custTemplate(){ downloadFile('sap-customers-template.csv','Customer No,Name,Email,Product\r\n100601,Example Textiles,qa@example.com,Textox 50% Textile\r\n','text/csv'); }
function custCsv(files){
  const f=files&&files[0]; if(!f) return;
  f.text().then(t=>{
    const rows=parseCSV(t); if(rows.length<2){ toast('The file has no data rows','err'); return; }
    const head=rows[0].map(h=>h.trim().toLowerCase()); const ix=k=>head.findIndex(h=>h.includes(k));
    const m={no:Math.max(ix('customer no'),ix('kunnr'),ix('number')),name:Math.max(ix('name'),ix('name1')),mail:Math.max(ix('mail'),ix('email')),prod:ix('product')};
    if(m.name<0){ toast('Could not find a Name column','err'); return; }
    window.__custRows=rows.slice(1).map(r=>({sap:m.no>=0?(r[m.no]||'').trim():'',name:(r[m.name]||'').trim(),contact:m.mail>=0?(r[m.mail]||'').trim():'',product:m.prod>=0?(r[m.prod]||'').trim():''})).filter(r=>r.name);
    document.getElementById('cc-name').textContent=`${f.name} · ${window.__custRows.length} customers ready`;
    document.getElementById('cc-prev').innerHTML=`<div class="tbl-wrap"><table class="tbl dense"><thead><tr><th>SAP NO.</th><th>NAME</th><th>EMAIL</th><th>PRODUCT</th></tr></thead><tbody>${window.__custRows.slice(0,6).map(r=>`<tr><td>${esc(r.sap)}</td><td>${esc(r.name)}</td><td>${esc(r.contact)}</td><td>${esc(r.product)}</td></tr>`).join('')}</tbody></table></div>`;
  });
}
function custImportGo(){
  const rows=window.__custRows; if(!rows||!rows.length){ toast('Choose a CSV file first','err'); return; }
  let added=0, updated=0;
  rows.forEach(r=>{ const ex=r.sap&&DATA.customers.find(c=>c.sap===r.sap);
    if(ex){ ex.name=r.name; if(r.contact) ex.contact=r.contact; if(r.product) ex.product=r.product; updated++; }
    else { DATA.customers.unshift({id:r.sap?'C-'+r.sap:'C-'+Math.floor(Math.random()*900000+100000),name:r.name,source:'SAP',sap:r.sap,contact:r.contact,product:r.product||'Any',coa:'Descon standard',fields:'PO no.'}); added++; } });
  audit('Imported customers from SAP','Customers',`${added} added, ${updated} updated`);
  closeModal(); render(); toast(`${added} added, ${updated} updated from SAP`,'ok');
}
