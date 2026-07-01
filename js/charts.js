/* ============ Chart.js helpers ============ */
const CHARTS = {};
function destroyChart(id){ if(CHARTS[id]){ CHARTS[id].destroy(); delete CHARTS[id]; } }

Chart.defaults.font.family = "'Roboto','Inter',sans-serif";
Chart.defaults.font.size = 10;
Chart.defaults.color = '#8a93a0';
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.legend.labels.boxHeight = 8;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.font = {size:10};

const gridY = {grid:{color:'#f0f2f4'},border:{display:false},ticks:{padding:6}};
const gridX = {grid:{display:false},border:{color:'#e8eaee'},ticks:{padding:6}};

/* horizontal top-10 gradient bars */
function horizBar(id, labels, values, colors){
  destroyChart(id);
  const ctx = document.getElementById(id); if(!ctx) return;
  CHARTS[id] = new Chart(ctx,{type:'bar',data:{labels,datasets:[{data:values,backgroundColor:colors,borderRadius:2,barThickness:9}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{}},
      scales:{x:{...gridY,beginAtZero:true},y:{grid:{display:false},border:{display:false},ticks:{font:{size:9},color:'#4b5563'}}}}});
}

/* multi-line trend */
function lineTrend(id, labels, series, opts={}){
  destroyChart(id);
  const ctx = document.getElementById(id); if(!ctx) return;
  CHARTS[id] = new Chart(ctx,{type:'line',data:{labels,datasets:series.map(s=>({
      label:s.name,data:s.data,borderColor:s.color,backgroundColor:s.color,
      tension:.4,borderWidth:2,pointRadius:s.point===false?0:2.5,pointBackgroundColor:s.color,
      fill:s.fill||false, ...(s.fillColor?{backgroundColor:s.fillColor}:{})}))},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:opts.legend!==false,position:'top',align:'start'}},
      interaction:{mode:'index',intersect:false},
      scales:{y:{...gridY,beginAtZero:true,...(opts.yMax?{max:opts.yMax}:{})},x:gridX}}});
}

/* stacked bar */
function stackedBar(id, labels, series){
  destroyChart(id);
  const ctx = document.getElementById(id); if(!ctx) return;
  CHARTS[id] = new Chart(ctx,{type:'bar',data:{labels,datasets:series.map(s=>({
      label:s.name,data:s.data,backgroundColor:s.color,borderRadius:2,barThickness:26}))},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:true,position:'top',align:'end'}},
      scales:{x:{...gridX,stacked:true},y:{...gridY,stacked:true,beginAtZero:true}}}});
}

/* horizontal stacked conformance bar (In-Spec green / OOS red) */
function stackedBarH(id, labels, series){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  CHARTS[id]=new Chart(ctx,{type:'bar',data:{labels,datasets:series.map(s=>({
      label:s.name,data:s.data,backgroundColor:s.color,borderRadius:3,barThickness:15}))},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:true,position:'top',align:'end'},
        tooltip:{callbacks:{label:c=>` ${c.dataset.label}: ${c.raw}%`}}},
      scales:{x:{...gridY,stacked:true,max:100,ticks:{callback:v=>v+'%'}},
        y:{stacked:true,grid:{display:false},border:{display:false},ticks:{font:{size:9.5},color:'#4b5563'}}}}});
}

/* SPC control chart: value line + mean / UCL / LCL limits, out-of-limit points flagged */
function spcChart(id, labels, values, lim){
  destroyChart(id);
  const ctx=document.getElementById(id); if(!ctx) return;
  const flat=y=>labels.map(()=>y);
  const ptColors=values.map(v=> (v>lim.ucl||v<lim.lcl)?'#e11f26' : (v>lim.uwl||v<lim.lwl)?'#e0930b' : '#0060b0');
  CHARTS[id]=new Chart(ctx,{type:'line',data:{labels,datasets:[
    {label:'Result',data:values,borderColor:'#0060b0',backgroundColor:'#0060b0',
      pointBackgroundColor:ptColors,pointBorderColor:'#fff',pointBorderWidth:1,pointRadius:4,
      tension:.25,borderWidth:2,order:1},
    {label:'UCL (+3σ)',data:flat(lim.ucl),borderColor:'#e11f26',borderDash:[6,4],borderWidth:1,pointRadius:0,order:3},
    {label:'Mean',data:flat(lim.mean),borderColor:'#0a8f6d',borderDash:[3,3],borderWidth:1,pointRadius:0,order:3},
    {label:'LCL (−3σ)',data:flat(lim.lcl),borderColor:'#e11f26',borderDash:[6,4],borderWidth:1,pointRadius:0,order:3},
  ]},options:{responsive:true,maintainAspectRatio:false,
    plugins:{legend:{display:true,position:'top',align:'end',labels:{boxWidth:10,font:{size:9.5}}},
      tooltip:{mode:'index',intersect:false}},
    scales:{y:{...gridY},x:gridX}}});
}

/* doughnut */
function doughnut(id, labels, values, colors){
  destroyChart(id);
  const ctx = document.getElementById(id); if(!ctx) return;
  CHARTS[id] = new Chart(ctx,{type:'doughnut',data:{labels,datasets:[{data:values,backgroundColor:colors,borderWidth:2,borderColor:'#fff'}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'62%',
      plugins:{legend:{display:false}}}});
}
