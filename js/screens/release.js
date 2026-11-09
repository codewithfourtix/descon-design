/* ===== Finished Goods (batch release) + Certificates of Analysis ===== */

function routeBatches(){ return (DATA.batches||[]).filter(b=>b.route===state.route); }
function batchById(id){ return (DATA.batches||[]).find(b=>b.id===id); }
function batchScore(b){
  const done=b.tests.filter(t=>t.result!==''&&t.result!=null);
  const fails=b.tests.filter(t=>checkSpec(t.spec,t.result)==='fail');
  return {done:done.length,total:b.tests.length,fails:fails.length};
}
function batchBadge(s){
  const m={'Released':'b-green','Awaiting QC':'b-teal-o','Under Test':'b-blue','On Hold':'b-amber','Rejected':'b-red'};
  const ic={'Released':'circle-check','Awaiting QC':'clock','Under Test':'flask-conical','On Hold':'pause-circle','Rejected':'x-circle'};
  return `<span class="badge ${m[s]||'b-blue'}"><i data-lucide="${ic[s]||'circle'}" style="width:11px"></i>${s}</span>`;
}

function screenRelease(){
  const list=routeBatches();
  const n=s=>list.filter(b=>b.status===s).length;
  const decided=n('Released')+n('Rejected')+n('On Hold');
  const rft=decided?((n('Released')/decided)*100).toFixed(1)+'%':'—';
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
      {l:'Released',v:String(n('Released')),i:'circle-check',s:'Cleared for dispatch'},
      {l:'On Hold',v:String(n('On Hold')),i:'pause-circle',s:'Waiting on retest'},
      {l:'Rejected',v:String(n('Rejected')),i:'x-circle',s:'Out of specification'},
      {l:'Right First Time',v:rft,i:'target',s:'Released ÷ decided'},
    ],5)}
    <div class="card">${tbl}</div>
  </div>`;
}

function openBatch(id){
  const b=batchById(id); if(!b) return;
  const locked=b.status==='Released'||b.status==='Rejected';
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
    acts.push({label:'Generate CoA',cls:'btn-green',icon:'file-check-2',fn:`closeModal();newCoa('${b.id}')`});
  }
  openModal({title:`Batch ${b.id} · ${b.product}`, wide:true, body:`
    <div class="bt-head">
      <div><span>Status</span>${batchBadge(b.status)}</div>
      <div><span>Tank / silo</span><b>${b.tank}</b></div>
      <div><span>Quantity</span><b>${b.qty} ${b.unit}</b></div>
      <div><span>Manufactured</span><b>${b.mfg}</b></div>
      <div><span>Sampling point</span><b>${b.point}</b></div>
    </div>
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
    <div class="form-row"><label>Customer</label><input id="nc-cust" list="nc-cust-l" placeholder="Customer name"><datalist id="nc-cust-l">${CUSTOMERS.map(c=>`<option>${c}</option>`).join('')}</datalist></div>
    <div class="form-row"><label>Customer PO / reference</label><input id="nc-ref" placeholder="Optional"></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Generate',cls:'btn-green',icon:'file-check-2',fn:'newCoaGo()'}]});
}
function newCoaGo(){
  const b=batchById(document.getElementById('nc-batch').value); if(!b) return;
  const cust=document.getElementById('nc-cust').value.trim()||'Internal transfer';
  const ref=document.getElementById('nc-ref').value.trim();
  const id=seq('COA-'+new Date().getFullYear()+'-',DATA.coas,'id',400).replace(/-(\d+)$/,(m,n)=>'-'+String(n).padStart(4,'0'));
  DATA.coas.unshift({id,batch:b.id,route:b.route,product:b.product,customer:cust,ref,issued:fmtDate(),by:signer(),status:'Issued'});
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
    </div>
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
