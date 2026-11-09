/* ===== Site Overview ===== */
let SITE_Q='All';
function siteQueue(){
  const items=[];
  (DATA.qualityRecords||[]).filter(r=>r.status==='Off-Spec'&&!r.capa).slice(0,4).forEach(r=>items.push({cat:'Quality',crit:true,
    title:`${r.parameter} OOS · ${r.id}`, meta:`${r.result} vs ${r.spec}${r.point?' · '+String(r.point).split('(')[0].trim():''}`, priority:'high',
    fn:`go('${r.route||'urea'}');setTab('quality');setTimeout(()=>qualSelect('${r.id}'),120)`}));
  DATA.chem.rows.filter(r=>parseFloat(r[7])<=0).slice(0,3).forEach(r=>items.push({cat:'Inventory',crit:true,
    title:`${titleCase(r[2]).slice(0,36)} out of stock`, meta:`${r[0]} · rack ${r[4]} · RO level ${r[8]}`, priority:'high', fn:`go('chemicals')`}));
  (DATA.equipment||[]).filter(e=>e.status==='Calibration Due').slice(0,2).forEach(e=>items.push({cat:'Inventory',crit:true,
    title:`${e.name} calibration due`, meta:`${e.tag} · ${e.location}`, priority:'high', fn:`go('equip');setTimeout(()=>openEquip('${e.id}'),150)`}));
  const rel=(DATA.batches||[]).filter(b=>b.status==='Awaiting QC'||b.status==='Under Test');
  if(rel.length) items.push({cat:'Quality',title:`${rel.length} batch${rel.length>1?'es':''} awaiting release`, meta:rel.slice(0,3).map(b=>b.id).join(', '), fn:`go('${rel[0].route}');setTab('wpp')`});
  const rev=(DATA.inReview||[]).filter(r=>r.status==='In Review'||r.status==='Pending');
  if(rev.length) items.push({cat:'Quality',title:`Sign off ${rev.length} sample results`, meta:'Urea and Hydrogen Peroxide review queues', fn:`go('urea')`});
  const capa=(DATA.capas||[]).filter(c=>c.status!=='Closed');
  if(capa.length) items.push({cat:'Quality',title:`${capa.length} open CAPA${capa.length>1?'s':''}`, meta:capa.slice(0,3).map(c=>c.id).join(', '), fn:`go('iso')`});
  const sl=(DATA.shiftlog||[])[0];
  if(sl) items.push({cat:'Inventory',title:'Review shift handover', meta:`${sl.shift} shift · ${titleCase(sl.supervisor)}`, fn:`go('shiftlog')`});
  return items;
}
function screenSite(){
  const s = DATA.site;
  const off=(DATA.qualityRecords||[]).filter(r=>r.status==='Off-Spec').length;
  const recs=(DATA.qualityRecords||[]).length;
  const comp=recs?(((recs-off)/recs)*100).toFixed(1)+'%':'96.4%';
  const alerts=unreadCount();
  const down=(DATA.equipment||[]).filter(e=>e.status!=='Operational').length;
  const perf = s.topPerf.map(p=>`<div class="perf-item" style="padding:10px;border:1px solid var(--line);border-radius:6px;margin-bottom:8px">
    <div style="font-weight:600;color:var(--ink)">${p.n}</div>
    <div style="font-size:12px;color:var(--brand);margin-top:2px">${p.v} <span class="star">★</span></div>
  </div>`).join('');
  const conc = s.concern.map(c=>`<div class="perf-item" style="padding:10px;border:1px solid var(--line);border-radius:6px;margin-bottom:8px">
    <div style="font-weight:600;color:var(--ink)">${c.n}</div>
    <div style="font-size:12px;color:var(--descon-red);margin-top:2px">${c.v} <span style="color:var(--muted)">(${c.s})</span></div>
  </div>`).join('');
  const q=siteQueue().filter(i=>SITE_Q==='All'||i.cat===SITE_Q);
  return `
  <div class="workspace-split" style="height:calc(100vh - 80px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      <div class="page-head"><div><div class="ph-t" style="font-size:20px">Plant Intelligence Overview</div><div class="ph-s">Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, ${esc(myName().split(' ')[0])}. Here is the lab right now.</div></div></div>

      ${renderStatusCluster([
        {val: comp, label: 'Result Compliance', color: 'var(--brand)'},
        {val: String(alerts), label: 'Unread Alerts', color: 'var(--descon-red)'},
        {val: String(down), label: 'Instruments Down', color: 'var(--amber)'},
        {val: (11371+(DATA.activity||[]).filter(a=>/Submitted results|Registered|Logged sample/.test(a.action)).length).toLocaleString(), label: 'Samples Processed', color: 'var(--ink)'}
      ])}

      <div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)">
        <div class="card">
          <div class="card-head"><div class="card-title">Shift Wise Samples &amp; Compliance</div></div>
          <div style="padding:2px 4px">${shiftTable(s.shift)}</div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Top Performers</div></div>
          <div style="padding:12px">${perf}</div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Areas of Concern</div></div>
          <div style="padding:12px">${conc}</div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
        <div class="card">
          <div class="card-head"><div class="card-title">Sample Distribution By Plant</div>${chartTools()}</div>
          <div class="card-pad" style="height:200px;position:relative"><canvas id="c-plantdonut"></canvas></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Total Shift Wise Samples</div>${chartTools()}</div>
          <div class="card-pad" style="height:200px;position:relative"><canvas id="c-shiftdonut"></canvas></div>
        </div>
        <div class="card"><div class="card-head"><div class="card-title">Top 10 Parameters</div>${chartTools()}</div>
          <div class="card-pad" style="height:200px"><canvas id="c-site-params"></canvas></div>
        </div>
      </div>
    </div>

    <div class="detail-panel">
      <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px">Global Action Queue</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        ${['All','Quality','Inventory'].map(t=>`<div class="subtab ${SITE_Q===t?'active':''}" style="flex:1;justify-content:center" onclick="SITE_Q='${t}';render()">${t}</div>`).join('')}
      </div>
      <div style="overflow-y:auto;flex:1">
        <div style="font-weight:600;font-size:11.5px;color:var(--muted);margin-bottom:8px;margin-top:4px">CRITICAL ALERTS</div>
        ${renderActionQueue(q.filter(i=>i.crit))}
        <div style="font-weight:600;font-size:11.5px;color:var(--muted);margin-bottom:8px;margin-top:16px">PENDING ACTIONS</div>
        ${renderActionQueue(q.filter(i=>!i.crit))}
      </div>
      <button class="btn btn-out" style="justify-content:center" onclick="openAssistant('What needs my attention today?')"><i data-lucide="sparkles" style="color:var(--brand)"></i> Ask Operations Assistant</button>
    </div>
  </div>`;
}

function siteCharts(){
  const s = DATA.site;
  doughnut('c-plantdonut', s.plantDonut.labels, s.plantDonut.data, s.plantDonut.colors);
  doughnut('c-shiftdonut', s.shiftDonut.labels, s.shiftDonut.data, s.shiftDonut.colors);
  horizBar('c-site-params', ['Moisture','Iron','pH','Biuret','Chloride'], [3,2.4,1.9,1.4,1.2], ['#4c6ef5','#4c6ef5','#4c6ef5','#4c6ef5','#4c6ef5']);
}
