/* ===== Quality & OOS (per-stream) ===== */
let ACTIVE_QUAL = null;
function screenQuality(){
  const q = DATA.getStreamQuality ? DATA.getStreamQuality(state.route) : DATA.quality;
  ACTIVE_QUAL = q;
  const recTbl = makeTable('qrec',{
    title:'Detailed Reports Records', pageSize:5, search:['id','parameter','status','shift','reviewer'],
    toolbar:`<button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="emailQualityReport()"><i data-lucide="mail"></i>Email Report</button>`,
    columns:[
      {key:'id',label:'SAMPLE ID',render:v=>`<b style="color:var(--brand);cursor:pointer" onclick="toast('Loading investigation for ${v}')">${v}</b>`},
      {key:'parameter',label:'PARAMETER'},
      {key:'result',label:'RESULT',align:'center'},
      {key:'spec',label:'SPEC',align:'center',render:v=>`<span style="color:var(--muted)">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Off-Spec'?'b-red':'b-green'}">${v}</span>`},
      {key:'reviewer',label:'REVIEWED BY'},
    ], data:DATA.qualityRecords
  });
  
  return `
  <div class="master-detail" style="height:calc(100vh - 120px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      ${renderStatusCluster([
        {val: '98.2%', label: 'Compliance Rate', color: 'var(--brand)'},
        {val: '3', label: 'Active Off-Specs', color: 'var(--descon-red)'},
        {val: '12', label: 'Pending Reviews', color: 'var(--amber)'}
      ])}
      
      <div class="grid" style="grid-template-columns:1fr 1fr">
        <div class="card"><div class="card-head"><div class="card-title">Daily Compliance</div>${chartTools()}</div>
          <div class="card-pad" style="height:180px"><canvas id="q-compliance"></canvas></div></div>
        <div class="card"><div class="card-head"><div class="card-title">Parameter Deviation</div>${chartTools()}</div>
          <div class="card-pad" style="height:180px"><canvas id="q-deviation"></canvas></div></div>
      </div>
      
      <div class="card">${recTbl}</div>
    </div>
    
    <div class="detail-panel">
      <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px">
        Investigation Context
      </div>
      
      <div style="display:flex;align-items:center;gap:12px">
        <div class="icon-sq" style="background:var(--descon-red);color:#fff;border:none"><i data-lucide="triangle-alert"></i></div>
        <div>
          <div style="font-size:16px;font-weight:700;color:var(--ink)">U-8021 <span class="badge b-red">Off-Spec</span></div>
          <div style="font-size:11.5px;color:var(--muted)">Logged 2 hours ago</div>
        </div>
      </div>
      
      <div style="border:1px solid var(--line);border-radius:8px;padding:12px;background:#fbfcfd">
        <div style="font-size:11px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase">Parameter details</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-weight:600;color:var(--ink)">Free Ammonia</span>
          <span style="color:var(--descon-red);font-weight:700">0.82 wt%</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)">
          <span>Spec Limit</span>
          <span>< 0.50 wt%</span>
        </div>
      </div>
      
      <div>
        <div style="font-weight:600;color:var(--ink);margin-bottom:8px">Recommended Actions</div>
        ${renderActionQueue([
          {title:'Initiate root cause analysis', meta:'Assigned to: Lab Supervisor'},
          {title:'Re-sample at points A, B', meta:'Priority: High', priority:'high'}
        ])}
      </div>
      
      <div style="margin-top:auto">
        <button class="btn btn-teal" style="width:100%;justify-content:center;background:var(--brand);color:#fff" onclick="toast('Logging CAPA')"><i data-lucide="clipboard-check"></i> Log CAPA</button>
      </div>
    </div>
  </div>`;
}

function emailQualityReport(){
  const label = (typeof PRODUCT_LABELS!=='undefined' && PRODUCT_LABELS[state.route]) ? PRODUCT_LABELS[state.route] : 'Stream';
  toast('Compiling quality & OOS report…','info');
  setTimeout(()=>emailReportViaOutlook({
    report:`${label} — Quality & OOS Report`,
    file:`Quality_OOS_Report_${label.replace(/[^\w]+/g,'_')}.pdf`,
    size:'274 KB',
    reportKey:'qoos', listId:'qc-lead',
    subject:`${label} — Quality & OOS Report (07 Jul 2026)`,
  }), 800);
}

function qualityCharts(){
  const q = ACTIVE_QUAL || DATA.getStreamQuality(state.route);
  lineTrend('q-compliance', q.complianceLabels, [{name:'Compliance',color:'#0060b0',data:q.compliance,fill:true,fillColor:'rgba(0,96,176,.12)',point:true}], {legend:false,yMax:100});
  stackedBar('q-routine', q.routineLabels, [
    {name:'Routine',color:'#0060b0',data:q.routine},
    {name:'Non Routine',color:'#f59f00',data:q.nonRoutine},
  ]);
  lineTrend('q-offspec', q.offspecLabels, [{name:'Off Spec',color:'#f59f00',data:q.offspec,fill:true,fillColor:'rgba(245,159,0,.12)',point:true}], {legend:false});
  horizBar('q-deviation', q.deviation.map(x=>x.n), q.deviation.map(x=>x.v), q.deviation.map(()=>'#e8595b'));
}
