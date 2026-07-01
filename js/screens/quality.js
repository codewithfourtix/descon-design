/* ===== Quality & OOS (per-stream) ===== */
let ACTIVE_QUAL = null;
function screenQuality(){
  const q = DATA.getStreamQuality ? DATA.getStreamQuality(state.route) : DATA.quality;
  ACTIVE_QUAL = q;
  const recTbl = makeTable('qrec',{
    title:'Detailed Reports Records', pageSize:10, search:['id','parameter','status','shift','reviewer'],
    toolbar:`<button class="btn btn-green" onclick="exportGeneric('qrec','quality-records.csv')"><i data-lucide="download"></i>Export</button>`,
    columns:[
      {key:'id',label:'SAMPLE ID',render:v=>`<b style="color:#0060b0">${v}</b>`},
      {key:'parameter',label:'PARAMETER'},
      {key:'result',label:'RESULT',align:'center'},
      {key:'spec',label:'SPEC',align:'center',render:v=>`<span style="color:#6b7280">${v}</span>`},
      {key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Off-Spec'?'b-red':'b-green'}">${v}</span>`},
      {key:'shift',label:'SHIFT'},
      {key:'reviewer',label:'REVIEWED BY'},
    ], data:DATA.qualityRecords
  });
  return `
  ${kpiRow(q.kpis,8,true)}
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div class="card"><div class="card-head"><div class="card-title">Daily Compliance</div>${chartTools()}</div>
      <div class="card-pad" style="height:210px"><canvas id="q-compliance"></canvas></div></div>
    <div class="card"><div class="card-head"><div class="card-title">Routine vs Non Routine Samples</div>${chartTools()}</div>
      <div class="card-pad" style="height:210px"><canvas id="q-routine"></canvas></div></div>
  </div>
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:1fr 1fr">
    <div class="card"><div class="card-head"><div class="card-title">Off Spec Trend Over Time</div>${chartTools()}</div>
      <div class="card-pad" style="height:210px"><canvas id="q-offspec"></canvas></div></div>
    <div class="card"><div class="card-head"><div class="card-title">Parameter-wise Deviation Frequency</div>${chartTools()}</div>
      <div class="card-pad" style="height:210px"><canvas id="q-deviation"></canvas></div></div>
  </div>
  <div style="height:10px"></div>
  <div class="card">${recTbl}</div>`;
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
