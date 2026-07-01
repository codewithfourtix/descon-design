/* ===== Site Dashboard (page 10) ===== */
function screenSite(){
  const s = DATA.site;
  const perf = s.topPerf.map(p=>`<div class="perf-item"><span>${p.n}</span><span style="color:#0a9d78;font-weight:600">${p.v} <span class="star">★</span></span></div>`).join('');
  const conc = s.concern.map(c=>`<div class="perf-item"><span>${c.n}</span><span style="color:#e08e0b;font-weight:600">${c.v} <span style="color:#c98110;font-size:10px">(${c.s})</span></span></div>`).join('');
  return `
  <div class="subtabs"><div class="subtab" onclick="go('urea')"><i data-lucide="bar-chart-3"></i>Quality Report</div></div>
  <div style="height:6px"></div>
  ${kpiRow(s.kpis,9)}
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(0,1fr)">
    <div class="card">
      <div class="card-head"><div class="card-title">Shift Wise Samples &amp; Compliance</div></div>
      <div style="padding:2px 4px">${shiftTable(s.shift)}</div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">Top Performers <span style="font-weight:400;color:#9aa3af;font-size:10px">Excellent compliance</span></div><i data-lucide="trophy" style="width:15px;color:#0a9d78"></i></div>
      <div style="padding:2px 4px">${perf}</div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">Areas of Concern <span style="font-weight:400;color:#9aa3af;font-size:10px">Units requiring attention</span></div><i data-lucide="triangle-alert" style="width:15px;color:#e08e0b"></i></div>
      <div style="padding:2px 4px">${conc}</div>
    </div>
  </div>
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
    <div class="card">
      <div class="card-head"><div class="card-title">Shift wise Test Volume</div>${chartTools()}</div>
      <div class="card-pad" style="height:200px"><canvas id="c-testvol"></canvas></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">Sample Distribution By Plant</div>${chartTools()}</div>
      <div class="card-pad" style="height:200px;position:relative"><canvas id="c-plantdonut"></canvas></div>
    </div>
    <div class="card">
      <div class="card-head"><div class="card-title">Total Shift Wise Samples</div>${chartTools()}</div>
      <div class="card-pad" style="height:200px;position:relative"><canvas id="c-shiftdonut"></canvas></div>
    </div>
  </div>
  <div style="height:10px"></div>
  <div class="grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">
    <div class="card"><div class="card-head"><div class="card-title">Top 10 Samples by Frequency</div>${chartTools()}</div><div class="card-pad" style="height:180px"><canvas id="c-site-top10"></canvas></div></div>
    <div class="card"><div class="card-head"><div class="card-title">Top 10 Parameters</div>${chartTools()}</div><div class="card-pad" style="height:180px"><canvas id="c-site-params"></canvas></div></div>
    <div class="card"><div class="card-head"><div class="card-title">Sample Plan Distribution</div>${chartTools()}</div><div class="card-pad" style="height:180px;position:relative"><canvas id="c-site-plan"></canvas></div></div>
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
