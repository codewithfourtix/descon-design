/* ===== Quality & OOS (per-stream) ===== */
let ACTIVE_QUAL = null;
let QUAL_SEL = null;
function qualRecords(){ return (DATA.qualityRecords||[]).filter(r=>!r.route||r.route===state.route); }
function screenQuality(){
  const q = DATA.getStreamQuality ? DATA.getStreamQuality(state.route) : DATA.quality;
  ACTIVE_QUAL = q;
  const recs=qualRecords();
  const off=recs.filter(r=>r.status==='Off-Spec');
  const open=off.filter(r=>!r.capa);
  const comp=recs.length?(((recs.length-off.length)/recs.length)*100).toFixed(1)+'%':'—';
  if(!QUAL_SEL||!recs.find(r=>r.id===QUAL_SEL)) QUAL_SEL=(open[0]||off[0]||recs[0]||{}).id;
  const recTbl = makeTable('qrec',{
    title:'Results & OOS Records', pageSize:8, search:['id','parameter','status','shift','reviewer'],
    toolbar:`<button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="emailQualityReport()"><i data-lucide="mail"></i>Email Report</button>`,
    onOpen:r=>qualSelect(r.id),
    rowStyle:r=>r.id===QUAL_SEL?'background:var(--brand-soft)':'',
    columns:[
      {key:'id',label:'RECORD',render:v=>`<b style="color:var(--brand)">${v}</b>`},
      {key:'parameter',label:'PARAMETER'},
      {key:'result',label:'RESULT',align:'center'},
      {key:'spec',label:'SPEC',align:'center',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'status',label:'STATUS',render:(v,r)=>`<span class="badge ${v==='Off-Spec'?'b-red':'b-green'}">${v}</span>${r.capa?` <span class="badge b-blue">${r.capa}</span>`:''}`},
      {key:'reviewer',label:'REVIEWED BY'},
    ], data:recs
  });

  return `
  <div class="master-detail" style="height:calc(100vh - 120px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      ${renderStatusCluster([
        {val: comp, label: 'Compliance Rate', color: 'var(--brand)'},
        {val: String(open.length), label: 'Open OOS', color: 'var(--descon-red)'},
        {val: String(off.filter(r=>r.capa).length), label: 'Under CAPA', color: 'var(--amber)'},
        {val: String(recs.length), label: 'Records', color: 'var(--ink)'}
      ])}

      <div class="grid" style="grid-template-columns:1fr 1fr">
        <div class="card"><div class="card-head"><div class="card-title">Daily Compliance</div>${chartTools()}</div>
          <div class="card-pad" style="height:180px"><canvas id="q-compliance"></canvas></div></div>
        <div class="card"><div class="card-head"><div class="card-title">Parameter Deviation</div>${chartTools()}</div>
          <div class="card-pad" style="height:180px"><canvas id="q-deviation"></canvas></div></div>
      </div>

      <div class="card">${recTbl}</div>
    </div>

    <div class="detail-panel" id="qual-panel">${qualPanel()}</div>
  </div>`;
}
function qualPanel(){
  const r=(DATA.qualityRecords||[]).find(x=>x.id===QUAL_SEL);
  if(!r) return `<div class="empty">Select a record to investigate.</div>`;
  const oos=r.status==='Off-Spec';
  const tasks=(DATA.tasks||[]).filter(t=>t.ref===r.id);
  return `
    <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px">Investigation</div>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="icon-sq" style="background:${oos?'var(--descon-red)':'#0a9d78'};color:#fff;border:none"><i data-lucide="${oos?'triangle-alert':'circle-check'}"></i></div>
      <div>
        <div style="font-size:16px;font-weight:700;color:var(--ink)">${r.id} <span class="badge ${oos?'b-red':'b-green'}">${r.status}</span></div>
        <div style="font-size:11.5px;color:var(--muted)">${r.point?esc(r.point)+' · ':''}${r.shift||''} shift${r.logged?' · '+r.logged:''}</div>
      </div>
    </div>
    <div class="ctx-box ${oos?'bad':'good'}">
      <div class="ctx-k">Parameter details</div>
      <div style="display:flex;justify-content:space-between;margin:4px 0"><span style="font-weight:600;color:var(--ink)">${r.parameter}</span><span style="color:${oos?'var(--descon-red)':'#0a9d78'};font-weight:700">${r.result}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)"><span>Specification</span><span>${r.spec}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)"><span>Reviewed by</span><span>${r.reviewer||'—'}</span></div>
    </div>
    ${oos?`<div>
      <div style="font-weight:600;color:var(--ink);margin-bottom:8px">Investigation steps</div>
      ${renderActionQueue([
        {title:(tasks.find(t=>t.kind==='rca')?'✓ ':'')+'Initiate root cause analysis', meta:tasks.find(t=>t.kind==='rca')?'Assigned to '+tasks.find(t=>t.kind==='rca').owner:'Assign to Lab Supervisor', fn:`qualTask('${r.id}','rca')`},
        {title:(tasks.find(t=>t.kind==='resample')?'✓ ':'')+'Re-sample and retest', meta:tasks.find(t=>t.kind==='resample')?'Requested '+tasks.find(t=>t.kind==='resample').at:'Priority: High', priority:tasks.find(t=>t.kind==='resample')?'':'high', fn:`qualTask('${r.id}','resample')`},
      ])}
    </div>`:`<div class="note-line"><i data-lucide="circle-check"></i>Result is within specification. No investigation needed.</div>`}
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
      ${oos?(r.capa?`<button class="btn btn-out" style="justify-content:center" onclick="go('iso');setTimeout(()=>openCapa('${r.capa}'),150)"><i data-lucide="clipboard-check"></i>Open ${r.capa}</button>`
        :`<button class="btn btn-teal" style="justify-content:center;background:var(--brand);color:#fff" onclick="logCapa('${r.id}')"><i data-lucide="clipboard-check"></i>Log CAPA</button>`):''}
      ${oos&&!r.closed?`<button class="btn btn-out" style="justify-content:center" onclick="qualClose('${r.id}')"><i data-lucide="check"></i>Close as invalid OOS (lab error)</button>`:''}
    </div>`;
}
function qualSelect(id){
  QUAL_SEL=id;
  const p=document.getElementById('qual-panel'); if(p){ p.innerHTML=qualPanel(); if(window.lucide)lucide.createIcons(); }
  document.querySelectorAll('#tblbox-qrec tbody tr').forEach(tr=>{ const b=tr.querySelector('b'); tr.style.background=b&&b.textContent===id?'var(--brand-soft)':''; });
}
function qualTask(id,kind){
  if((DATA.tasks||[]).find(t=>t.ref===id&&t.kind===kind)){ toast('Already assigned','info'); return; }
  const owner=kind==='rca'?'Lab Supervisor':'Sampling Team';
  DATA.tasks.push({ref:id,kind,owner,at:fmtStamp(),by:myName()});
  audit(kind==='rca'?'Started root cause analysis':'Requested re-sample','Quality & OOS',id);
  notify(kind==='rca'?`RCA assigned for ${id}`:`Re-sample requested for ${id}`,`Assigned to ${owner} by ${myName()}`,{icon:kind==='rca'?'search':'test-tube',color:'#0060b0',route:state.route,tab:'quality'});
  qualSelect(id); toast(kind==='rca'?'Root cause analysis assigned to Lab Supervisor':'Re-sample request sent to the sampling team','ok');
}
function qualClose(id){
  const r=(DATA.qualityRecords||[]).find(x=>x.id===id); if(!r) return;
  if(!can('Lab Supervisor','Closing an OOS')) return;
  confirmModal('Close OOS',`Close <b>${id}</b> as an invalid OOS caused by a lab error? The original result stays in the audit trail.`,()=>{
    r.status='In-Spec'; r.closed=true; r.reviewer=myName().toUpperCase(); audit('Closed OOS as lab error','Quality & OOS',id); render(); toast(id+' closed','ok');
  },'Close OOS');
}
function logCapa(recId){
  const r=recId?(DATA.qualityRecords||[]).find(x=>x.id===recId):null;
  openModal({title:'Log CAPA'+(r?' for '+r.id:''), wide:true, body:`
    <div class="form-grid">
      <div class="form-row" style="grid-column:1/-1"><label>Problem</label><input id="cp-title" value="${r?esc(`${r.parameter} OOS: ${r.result} vs ${r.spec}${r.point?' at '+r.point.split('(')[0].trim():''}`):''}" placeholder="What went wrong"></div>
      <div class="form-row"><label>Source</label><input id="cp-src" value="${r?r.id:'Internal audit'}"></div>
      <div class="form-row"><label>ISO 17025 clause</label><select id="cp-clause">${['7.9 Complaints / OOS','7.10 Nonconforming work','6.4 Equipment','6.2 Personnel','7.5 Technical records','8.7 Corrective action'].map(o=>`<option>${o}</option>`).join('')}</select></div>
      <div class="form-row" style="grid-column:1/-1"><label>Root cause</label><input id="cp-root" placeholder="Why it happened"></div>
      <div class="form-row" style="grid-column:1/-1"><label>Corrective action</label><input id="cp-act" placeholder="What will be done"></div>
      <div class="form-row"><label>Owner</label><select id="cp-owner">${['Lab Supervisor','QC Manager','Senior Analyst','QA Head','Instrumentation'].map(o=>`<option>${o}</option>`).join('')}</select></div>
      <div class="form-row"><label>Due date</label><input id="cp-due" type="date" value="${addDays(new Date(),14).toISOString().slice(0,10)}"></div>
    </div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Create CAPA',cls:'btn-green',icon:'clipboard-check',fn:`logCapaGo('${recId||''}')`}]});
}
function logCapaGo(recId){
  const v=k=>(document.getElementById(k)||{}).value||'';
  if(!v('cp-title').trim()){ toast('Describe the problem','err'); return; }
  const id=seq('CAPA-0',DATA.capas,'id',40);
  const due=v('cp-due')?fmtDate(new Date(v('cp-due')+'T00:00')):fmtDate(addDays(new Date(),14));
  DATA.capas.unshift({id,source:v('cp-src'),clause:v('cp-clause').split(' ')[0],title:v('cp-title'),owner:v('cp-owner'),due,status:'Open',root:v('cp-root')||'Under investigation',action:v('cp-act')||'To be defined',created:fmtStamp(),by:myName()});
  if(recId){ const r=DATA.qualityRecords.find(x=>x.id===recId); if(r) r.capa=id; }
  audit('Created CAPA','Quality & OOS',`${id} · ${v('cp-title')}`);
  notify(`${id} created`,`${v('cp-title')} · owner ${v('cp-owner')}, due ${due}`,{icon:'clipboard-check',color:'#0060b0',route:'iso'});
  closeModal(); render(); toast(`${id} created and assigned to ${v('cp-owner')}`,'ok');
}

function emailQualityReport(){
  const label = (typeof PRODUCT_LABELS!=='undefined' && PRODUCT_LABELS[state.route]) ? PRODUCT_LABELS[state.route] : 'Stream';
  toast('Compiling quality & OOS report…','info');
  setTimeout(()=>emailReportViaOutlook({
    report:`${label} · Quality & OOS Report`,
    file:`Quality_OOS_Report_${label.replace(/[^\w]+/g,'_')}.pdf`,
    size:'274 KB',
    reportKey:'qoos', listId:'qc-lead',
    subject:`${label} · Quality & OOS Report (${fmtDate()})`,
  }), 800);
}

function qualityCharts(){
  const q = ACTIVE_QUAL || DATA.getStreamQuality(state.route);
  lineTrend('q-compliance', q.complianceLabels, [{name:'Compliance',color:'#0060b0',data:q.compliance,fill:true,fillColor:'rgba(0,96,176,.12)',point:true}], {legend:false,yMax:100});
  const counts={}; qualRecords().filter(r=>r.status==='Off-Spec').forEach(r=>counts[r.parameter]=(counts[r.parameter]||0)+1);
  const dev=Object.keys(counts).length?Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([n,v])=>({n,v})):q.deviation;
  horizBar('q-deviation', dev.map(x=>x.n), dev.map(x=>x.v), dev.map(()=>'#e8595b'));
}
