/* ===== Lab Sheet (interactive) ===== */
function screenLabsheet(){
  const cardSet = (DATA.labByStream && DATA.labByStream[state.route]) || DATA.lab.cards;
  const cards = cardSet.map((card,ci)=>{
    const nCols = card.cols.length || 1;
    const timeCols = card.cols.map(c=>`<th style="text-align:center">${c}</th>`).join('');
    const body = card.rows.map((r,ri)=>{
      const cells = (card.cols.length?card.cols:['']).map((_,cx)=>
        `<td style="text-align:center;padding:1px 4px"><input class="lab-in" data-c="${ci}" data-r="${ri}" data-x="${cx}" oninput="labEdited()"></td>`).join('');
      return `<tr><td style="font-weight:500;color:#374151">${r[0]}</td><td style="color:#6b7280">${r[1]}</td><td style="color:#6b7280">${r[2]}</td>${cells}</tr>`;
    }).join('');
    return `<div class="lab-card" id="lab-${ci}">
      <div class="lc-head"><div class="lc-title">${card.t}</div>
        <div class="lc-btns"><i data-lucide="line-chart" style="cursor:pointer" onclick="labTrend('${card.t.replace(/'/g,'')}')"></i><span class="pc" style="cursor:pointer" onclick="labFill(${ci})">+C</span></div></div>
      <table class="lab-tbl"><thead><tr><th>Tests</th><th>Units</th><th>Spec.</th>${timeCols||'<th></th>'}</tr></thead>
        <tbody>${body}</tbody></table>
    </div>`;
  }).join('');

  return `
  <div class="card" style="margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;flex-wrap:wrap">
      <div class="mini-search" style="min-width:280px"><i data-lucide="search" style="width:14px"></i><input placeholder="Search samples, parameters..." oninput="labSearch(this.value)"></div>
      <div class="icon-sq" onclick="labUndo()"><i data-lucide="rotate-ccw" style="width:14px"></i></div>
      <div class="icon-sq" onclick="render()"><i data-lucide="rotate-cw" style="width:14px"></i></div>
      <div style="flex:1"></div>
      <span id="lab-status" style="font-size:11px;color:#9aa3af"></span>
      <button class="btn btn-out" onclick="labReset()"><i data-lucide="rotate-ccw"></i>Reset Values</button>
      <button class="btn btn-red" onclick="labMissed()"><i data-lucide="bookmark"></i>Mark Missed</button>
      <button class="btn btn-teal" style="background:#004c8c" onclick="labApprove()"><i data-lucide="send"></i>Approve &amp; Submit</button>
    </div>
  </div>
  <div class="lab-grid">${cards}</div>`;
}

let LAB_DIRTY=0;
function labEdited(){LAB_DIRTY++;const s=document.getElementById('lab-status');if(s)s.textContent=LAB_DIRTY+' value(s) entered · unsaved';}
function labFill(ci){
  document.querySelectorAll(`.lab-in[data-c="${ci}"]`).forEach(inp=>{
    if(!inp.value){inp.value=(Math.random()*4+0.2).toFixed(2);}
  });
  labEdited(); toast('Auto-filled from last cycle (demo)','info');
}
function labReset(){
  confirmModal('Reset values','Clear all entered values on this lab sheet?',()=>{
    document.querySelectorAll('.lab-in').forEach(i=>i.value='');
    document.querySelectorAll('.lab-card').forEach(c=>c.classList.remove('missed','approved'));
    LAB_DIRTY=0;document.getElementById('lab-status').textContent='';
    toast('All values reset','info');
  },'Reset');
}
function labMissed(){
  confirmModal('Mark as missed','Mark the current sampling cycle as <b>Missed</b>? This will be logged against shift compliance.',()=>{
    document.querySelectorAll('.lab-card').forEach(c=>c.classList.add('missed'));
    toast('Sampling cycle marked as missed','warn');
  },'Mark Missed','danger');
}
function labApprove(){
  if(LAB_DIRTY===0){toast('Enter at least one value before submitting','err');return;}
  confirmModal('Approve & submit',`Submit <b>${LAB_DIRTY}</b> entered value(s) for approval? Results will move to <b>In Review</b>.`,()=>{
    document.querySelectorAll('.lab-card').forEach(c=>c.classList.add('approved'));
    document.getElementById('lab-status').textContent='Submitted for review';
    LAB_DIRTY=0;
    toast('Lab sheet approved & submitted','ok');
  },'Approve & Submit');
}
function labUndo(){document.querySelectorAll('.lab-in').forEach(i=>i.value='');LAB_DIRTY=0;const s=document.getElementById('lab-status');if(s)s.textContent='';toast('Reverted','info');}
function labSearch(q){
  q=q.toLowerCase().trim();
  document.querySelectorAll('.lab-card').forEach(c=>{
    const t=c.querySelector('.lc-title').textContent.toLowerCase();
    const params=Array.from(c.querySelectorAll('tbody td:first-child')).map(td=>td.textContent.toLowerCase()).join(' ');
    c.style.display=(!q||t.includes(q)||params.includes(q))?'':'none';
  });
}
function labTrend(name){
  openModal({title:name+' — Trend', wide:true, body:`<div style="height:260px"><canvas id="lab-trend-c"></canvas></div>`});
  setTimeout(()=>{
    const labels=['12 May','13 May','14 May','15 May','16 May','17 May','18 May'];
    lineTrend('lab-trend-c',labels,[{name:name,color:'#0060b0',data:labels.map(()=>+(Math.random()*4+0.5).toFixed(2)),fill:true,fillColor:'rgba(0,96,176,.12)',point:true}],{legend:false});
  },80);
}
