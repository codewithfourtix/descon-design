/* ===== Product Dashboard (page 2 / 9) ===== */
function shiftTable(sh){
  const cIcons = sh.icons;
  let head = `<th></th>`+sh.cols.map((c,i)=>`<th style="text-align:center"><span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="${cIcons[i]}" style="width:13px;color:#0060b0"></i>${c}</span></th>`).join('');
  const colr = {ink:'#1f2a44',green:'#0a9d78',amber:'#e08e0b',red:'#d64545'};
  let body = sh.rows.map(r=>{
    const color = colr[r.c]||'#334';
    return `<tr>
      <td style="font-weight:${r.bold?700:600};color:#334">${r.k}</td>
      ${r.v.map(v=>`<td style="text-align:center;color:${color};font-weight:600">${v}</td>`).join('')}
    </tr>`;
  }).join('');
  return `<table class="tbl"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

let ACTIVE_DASH = null;
function screenDashboard(){
  const d = DATA.getStreamDash ? DATA.getStreamDash(state.route) : DATA.dash;
  ACTIVE_DASH = d;
  
  // Transform KPIs into status cluster format
  const statusItems = d.kpis.slice(0, 4).map(k => ({
    val: k.v, label: k.l, color: k.l.includes('Routine') ? 'var(--descon-red)' : 'var(--brand)'
  }));

  // Mock an action queue
  const actionItems = DATA.inReview.slice(0, 5).map(r => ({
    title: `Sample ${r.id} pending review`,
    meta: `${r.area} · Analyst: ${r.analyst}`,
    priority: r.status === 'Late' ? 'high' : 'med'
  }));

  const actionQ = renderActionQueue(actionItems, `openDrawer('Sample Actions', '<div class=\\'empty\\'>Action details...</div>')`);
  
  return `
  <div class="workspace-split">
    <div class="workspace-board">
      <div style="margin-bottom:8px">
        <div style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <i data-lucide="activity" style="color:var(--brand)"></i> Operational Status
        </div>
        ${renderStatusCluster(statusItems)}
      </div>
      
      <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.1fr)">
        <div class="card">
          <div class="card-head"><div class="card-title">Shift Wise Samples &amp; Compliance</div></div>
          <div style="padding:2px 4px;overflow-x:auto;">${shiftTable(d.shift)}</div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Specification Conformance <span style="font-weight:400;color:#9aa3af;font-size:10px">by parameter</span></div>${chartTools()}</div>
          <div class="card-pad" style="height:250px"><canvas id="c-conformance"></canvas></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-head"><div class="card-title">SPC Control Chart <span style="font-weight:400;color:#9aa3af;font-size:10px">· ${d.spc.param}</span></div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;color:#8a93a0">n=14 · ±3σ limits</span>
            ${chartTools()}
          </div>
        </div>
        <div class="card-pad" style="height:250px"><canvas id="c-spc"></canvas></div>
      </div>
    </div>
    
    <div class="detail-panel">
      <div style="font-weight:700;color:var(--ink);font-size:13px;display:flex;justify-content:space-between">
        Action Queue <span class="badge b-amber">${actionItems.length} Pending</span>
      </div>
      ${actionQ}
      <button class="btn btn-out" style="width:100%;justify-content:center" onclick="toast('Opening full queue')">View All Pending</button>
      
      <div style="font-weight:700;color:var(--ink);font-size:13px;margin-top:16px">Critical Exceptions</div>
      ${renderActionQueue([{title:'Equipment offline', meta:'Unit 4 Blower', priority:'high'}])}
    </div>
  </div>`;
}

function dashboardCharts(){
  const d = ACTIVE_DASH || DATA.getStreamDash(state.route);
  stackedBarH('c-conformance', d.conformance.map(x=>x.param), [
    {name:'In-Spec', color:'#0a8f6d', data:d.conformance.map(x=>x.inSpec)},
    {name:'OOS',     color:'#e11f26', data:d.conformance.map(x=>x.oos)},
  ]);
  spcChart('c-spc', d.spc.labels, d.spc.values, d.spc);
}
