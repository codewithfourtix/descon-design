/* ===== Lab Sheet (interactive) ===== */
function screenLabsheet(){
  const cardSet = (DATA.labByStream && DATA.labByStream[state.route]) || DATA.lab.cards;
  
  // Left: Sample List (using first item from cards as mock)
  const sampleList = cardSet.map((c, i) => `
    <div class="dd-line" style="border-bottom:1px solid var(--line2); cursor:pointer; padding:12px; ${i===0?'background:var(--brand-soft);border-left:3px solid var(--brand)':'border-left:3px solid transparent'}" onclick="toast('Loading ${c.t}')">
      <i data-lucide="flask-conical" style="color:${i===0?'var(--brand)':'var(--muted)'}"></i>
      <div style="flex:1">
        <div style="font-weight:600;color:var(--ink);font-size:12px">${c.t}</div>
        <div style="color:var(--muted);font-size:10.5px">Pending tests: ${c.rows.length}</div>
      </div>
      <i data-lucide="chevron-right" style="width:14px;color:var(--muted2)"></i>
    </div>
  `).join('');

  // Center: Editable grid for the first card
  const c = cardSet[0];
  const timeCols = c.cols.map(col => `<th style="text-align:center">${col}</th>`).join('');
  const tbody = c.rows.map((r, ri) => {
    const cells = (c.cols.length?c.cols:['']).map((_, cx) =>
      `<td style="text-align:center;padding:4px"><input class="lab-in" style="font-size:12px;padding:6px;background:#f8fafb" data-c="0" data-r="${ri}" data-x="${cx}" oninput="labEdited()" placeholder="—"></td>`
    ).join('');
    return `<tr><td style="font-weight:600;color:var(--ink)">${r[0]}</td><td style="color:var(--muted)">${r[1]}</td><td style="color:var(--muted)">${r[2]}</td>${cells}</tr>`;
  }).join('');
  
  const gridTable = `
    <div style="flex:1;overflow:auto">
      <table class="tbl" style="min-width:600px">
        <thead><tr><th>Parameter</th><th>Units</th><th>Spec. limit</th>${timeCols||'<th>Value</th>'}</tr></thead>
        <tbody>${tbody}</tbody>
      </table>
    </div>
  `;

  return `
  <div class="dense-grid" style="height:calc(100vh - 180px)">
    <!-- Left: Sample List -->
    <div class="dense-panel">
      <div class="card-head" style="background:#fafbfc"><div class="card-title">Pending Samples</div></div>
      <div style="padding:8px;border-bottom:1px solid var(--line2)">
        <div class="mini-search" style="width:100%"><i data-lucide="search" style="width:14px"></i><input placeholder="Search ID..." oninput="labSearch(this.value)"></div>
      </div>
      <div style="flex:1;overflow-y:auto">${sampleList}</div>
    </div>
    
    <!-- Center: Entry Grid -->
    <div class="dense-panel">
      <div class="card-head" style="background:#fafbfc">
        <div class="card-title" style="color:var(--brand)">${c.t} <span class="badge b-amber">In Progress</span></div>
        <div class="chart-tools">
          <div class="icon-sq" style="width:24px;height:24px" onclick="labUndo()" title="Undo"><i data-lucide="rotate-ccw" style="width:12px"></i></div>
          <div class="icon-sq" style="width:24px;height:24px" onclick="labFill(0)" title="Auto-fill"><i data-lucide="wand-2" style="width:12px"></i></div>
        </div>
      </div>
      ${gridTable}
      <div class="card-head" style="background:#fafbfc;border-top:1px solid var(--line);border-bottom:none">
        <span id="lab-status" style="font-size:11px;color:var(--muted)">0 value(s) entered</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-out" onclick="labReset()"><i data-lucide="x"></i>Clear</button>
          <button class="btn btn-green" onclick="labApprove()"><i data-lucide="check"></i>Save Results</button>
        </div>
      </div>
    </div>
    
    <!-- Right: Parameter Details Context -->
    <div class="dense-panel">
      <div class="card-head" style="background:#fafbfc"><div class="card-title">Parameter Context</div></div>
      <div style="padding:16px;flex:1;overflow-y:auto;font-size:12px;display:flex;flex-direction:column;gap:16px">
        <div style="color:var(--muted)">Select a cell to view historical trends, standard operating procedures, and validation rules.</div>
        <div style="border:1px solid var(--line);border-radius:8px;padding:12px">
          <div style="font-weight:600;margin-bottom:8px">Previous Reading</div>
          <div style="font-size:18px;color:var(--ink);font-weight:700">0.45 <span style="font-size:11px;color:var(--muted);font-weight:400">wt%</span></div>
          <div style="color:var(--muted2);font-size:10px;margin-top:4px">Taken 2 hours ago</div>
        </div>
        <div style="border:1px solid var(--line);border-radius:8px;padding:12px">
          <div style="font-weight:600;margin-bottom:8px">Validation Rules</div>
          <div style="color:var(--descon-red);font-weight:500">Requires supervisor override if > 0.60</div>
          <div style="color:var(--muted2);margin-top:4px">Standard: ISO-390-X</div>
        </div>
        <button class="btn btn-out" style="justify-content:center" onclick="openDrawer('AI Assistant', '<div class=\\'empty\\'>Asking about parameter testing procedure...</div>')"><i data-lucide="sparkles" style="color:var(--brand)"></i> Ask Assistant</button>
      </div>
    </div>
  </div>`;
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
