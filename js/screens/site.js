/* ===== Site Dashboard (page 10) ===== */
function screenSite(){
  const s = DATA.site;
  const perf = s.topPerf.map(p=>`<div class="perf-item" style="padding:10px;border:1px solid var(--line);border-radius:6px;margin-bottom:8px">
    <div style="font-weight:600;color:var(--ink)">${p.n}</div>
    <div style="font-size:12px;color:var(--brand);margin-top:2px">${p.v} <span class="star">★</span></div>
  </div>`).join('');
  const conc = s.concern.map(c=>`<div class="perf-item" style="padding:10px;border:1px solid var(--line);border-radius:6px;margin-bottom:8px">
    <div style="font-weight:600;color:var(--ink)">${c.n}</div>
    <div style="font-size:12px;color:var(--descon-red);margin-top:2px">${c.v} <span style="color:var(--muted)">(${c.s})</span></div>
  </div>`).join('');
  
  return `
  <div class="workspace-split" style="height:calc(100vh - 80px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      <div style="font-size:20px;font-weight:700;color:var(--ink)">Plant Intelligence Overview</div>
      
      ${renderStatusCluster([
        {val: '96.4%', label: 'Global Compliance', color: 'var(--brand)'},
        {val: '42', label: 'Active Alerts', color: 'var(--descon-red)'},
        {val: '3', label: 'Plants Offline', color: 'var(--amber)'},
        {val: '1,024', label: 'Samples Processed', color: 'var(--ink)'}
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
      <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px">
        Global Action Queue
      </div>
      
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <div class="subtab active" style="flex:1;justify-content:center">All</div>
        <div class="subtab" style="flex:1;justify-content:center">Quality</div>
        <div class="subtab" style="flex:1;justify-content:center">Inventory</div>
      </div>
      
      <div style="overflow-y:auto;flex:1">
        <div style="font-weight:600;font-size:11.5px;color:var(--muted);margin-bottom:8px;margin-top:4px">CRITICAL ALERTS</div>
        ${renderActionQueue([
          {title:'Ammonia Plant Scrubber OOS', meta:'Reported 10m ago', priority:'high'},
          {title:'Sulphuric Acid Critical Low', meta:'Inventory: 0 L', priority:'high'}
        ])}
        
        <div style="font-weight:600;font-size:11.5px;color:var(--muted);margin-bottom:8px;margin-top:16px">PENDING ACTIONS</div>
        ${renderActionQueue([
          {title:'Review Shift Handover', meta:'Shift A to B'},
          {title:'Approve Audit Report', meta:'ISO-2025-01'},
          {title:'Sign-off 12 Samples', meta:'Urea Plant'}
        ])}
      </div>
      
      <button class="btn btn-out" style="justify-content:center" onclick="openDrawer('Global Assistant', '<div class=\\'empty\\'>How can I assist with the plant overview?</div>')"><i data-lucide="sparkles" style="color:var(--brand)"></i> Ask Operations Assistant</button>
    </div>
  </div>`;
}

function siteCharts(){
  const s = DATA.site;
  lineTrend('c-testvol', s.testVolLabels, s.testVol.map(x=>({...x,point:true})));
  doughnut('c-plantdonut', s.plantDonut.labels, s.plantDonut.data, s.plantDonut.colors);
  doughnut('c-shiftdonut', s.shiftDonut.labels, s.shiftDonut.data, s.shiftDonut.colors);
  // secondary row
  horizBar('c-site-top10', DATA.dash.top10.slice(0,6).map(x=>x.n), DATA.dash.top10.slice(0,6).map(x=>x.v), DATA.dash.top10.slice(0,6).map(()=>'#0060b0'));
  horizBar('c-site-params', ['Moisture','Iron','pH','Biuret','Chloride'], [3,2.4,1.9,1.4,1.2], ['#4c6ef5','#4c6ef5','#4c6ef5','#4c6ef5','#4c6ef5']);
  doughnut('c-site-plan', ['Routine','Non-Routine'], [11267,104], ['#0060b0','#f59f00']);
}
