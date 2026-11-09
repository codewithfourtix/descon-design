/* ===== Stream Dashboard ===== */
function shiftTable(sh){
  const cIcons = sh.icons;
  let head = `<th></th>`+sh.cols.map((c,i)=>`<th style="text-align:center"><span style="display:inline-flex;align-items:center;gap:4px"><i data-lucide="${cIcons[i]}" style="width:13px;color:#0060b0"></i>${c}</span></th>`).join('');
  const colr = {ink:'var(--ink)',green:'#0a9d78',amber:'#e08e0b',red:'#d64545'};
  let body = sh.rows.map(r=>{
    const color = colr[r.c]||'var(--ink)';
    return `<tr>
      <td style="font-weight:${r.bold?700:600};color:var(--ink)">${r.k}</td>
      ${r.v.map(v=>`<td style="text-align:center;color:${color};font-weight:600">${v}</td>`).join('')}
    </tr>`;
  }).join('');
  return `<table class="tbl"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function streamQueue(){ return (DATA.inReview||[]).filter(r=>r.route===state.route&&r.status!=='Approved'&&r.status!=='Rejected'); }
let ACTIVE_DASH = null;
function screenDashboard(){
  const d = DATA.getStreamDash ? DATA.getStreamDash(state.route) : DATA.dash;
  ACTIVE_DASH = d;
  const q=streamQueue();
  const statusItems = [
    {val:d.kpis[0].v, label:d.kpis[0].l, color:'var(--brand)'},
    {val:d.kpis[1].v, label:d.kpis[1].l, color:'var(--ink)'},
    {val:String(q.length), label:'Awaiting Review', color:'var(--amber)'},
    {val:String(routeBatches().filter(b=>b.status==='Awaiting QC'||b.status==='Under Test').length), label:'Batches Awaiting QC', color:'var(--descon-red)'},
  ];
  const actionItems = q.slice(0, 6).map(r => ({
    title: `${r.id} · ${String(r.area).split('(')[0].trim()}`,
    meta: `${r.status} · ${r.pending} result${r.pending>1?'s':''} · ${titleCase(r.analyst)}`,
    priority: r.status === 'Pending' ? 'high' : 'med',
    fn:`reviewSample('${r.id}')`
  }));
  const down=(DATA.equipment||[]).filter(e=>e.status!=='Operational').slice(0,3);
  const lowStock=DATA.chem.rows.filter(r=>parseFloat(r[7])<=0).slice(0,2);
  const exceptions=[
    ...down.map(e=>({title:`${e.name} · ${e.status}`, meta:`${e.tag} · ${e.location}`, priority:e.status==='Calibration Due'?'high':'med', fn:`go('equip');setTimeout(()=>openEquip('${e.id}'),150)`})),
    ...lowStock.map(r=>({title:`${titleCase(r[2]).slice(0,34)} out of stock`, meta:`${r[0]} · rack ${r[4]}`, priority:'high', fn:`go('chemicals')`})),
  ];

  return `
  <div class="workspace-split">
    <div class="workspace-board">
      <div style="margin-bottom:8px">
        <div style="font-size:16px;font-weight:700;color:var(--ink);margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <i data-lucide="activity" style="color:var(--brand)"></i> Operational Status <span class="live-dot" title="Live"></span>
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
        Review Queue <span class="badge b-amber">${q.length} pending</span>
      </div>
      ${renderActionQueue(actionItems)}
      <button class="btn btn-out" style="width:100%;justify-content:center" onclick="reviewAll()"><i data-lucide="list-checks"></i>Review all pending</button>

      <div style="font-weight:700;color:var(--ink);font-size:13px;margin-top:16px">Critical Exceptions</div>
      ${renderActionQueue(exceptions)}
    </div>
  </div>`;
}

function reviewSample(id){
  const r=(DATA.inReview||[]).find(x=>x.id===id); if(!r) return;
  const cards=labCards(); const ci=r.ci!=null?r.ci:Math.max(0,cards.findIndex(c=>c.t.startsWith(String(r.area).split('(')[0].trim())));
  const c=cards[ci]||cards[0];
  const st=(DATA.labResults[state.route]||{})[ci];
  const rng=mulberry32(id.length*31+parseInt(id.replace(/\D/g,''))||7);
  const rows=c.rows.slice(0,Math.max(3,Math.min(8,c.rows.length))).map((row,ri)=>{
    const v=st&&st.values[ri+'-0']!==undefined&&st.values[ri+'-0']!==''?st.values[ri+'-0']:String(sampleWithin(row[2],rng));
    const chk=checkSpec(row[2],v);
    return `<tr><td style="font-weight:600;color:var(--ink)">${row[0]}</td><td>${row[2]||'—'}</td><td><b>${v}</b> <span style="color:var(--muted)">${row[1]||''}</span></td><td>${stBadge(chk==='none'?'pass':chk)}</td></tr>`;
  }).join('');
  openModal({title:`Review ${r.id} · ${String(r.area).split('(')[0].trim()}`, wide:true, body:`
    <div class="bt-head">
      <div><span>Status</span><b>${r.status}</b></div><div><span>Analyst</span><b>${titleCase(r.analyst)}</b></div>
      <div><span>Logged</span><b>${r.logged}</b></div><div><span>Results</span><b>${r.pending}</b></div>
    </div>
    <div class="tbl-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>PARAMETER</th><th>SPECIFICATION</th><th>RESULT</th><th>STATUS</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},
      {label:'Request retest',cls:'btn-out',icon:'rotate-ccw',fn:`reviewDecide('${r.id}','Retest')`},
      {label:'Reject',cls:'btn-red',icon:'x',fn:`reviewDecide('${r.id}','Rejected')`},
      {label:'Approve',cls:'btn-green',icon:'check',fn:`reviewDecide('${r.id}','Approved')`}]});
}
function reviewDecide(id, decision){
  if(decision!=='Retest'&&!can('Lab Supervisor',decision==='Approved'?'Approving results':'Rejecting results')) return;
  const r=(DATA.inReview||[]).find(x=>x.id===id); if(!r) return;
  if(decision==='Retest'){ r.status='Pending'; r.logged=fmtStamp(); }
  else { r.status=decision; r.decidedBy=myName(); }
  if(decision==='Approved'&&r.ci!=null){ const st=(DATA.labResults[r.route]||{})[r.ci]; if(st&&st.status==='Submitted'){ st.status='Approved'; st.approvedBy=titleCase(myName()); } }
  audit(decision==='Retest'?'Requested retest':decision==='Approved'?'Approved sample':'Rejected sample','Review Queue',`${id} · ${r.area}`);
  closeModal(); render();
  toast(decision==='Retest'?`Retest requested for ${id}`:`${id} ${decision.toLowerCase()}`,decision==='Rejected'?'warn':'ok');
}
function reviewAll(){
  const q=streamQueue();
  if(!q.length){ toast('Nothing is waiting for review','info'); return; }
  openModal({title:`Pending review · ${PRODUCT_LABELS[state.route]}`, wide:true, body:`
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:30px"><input type="checkbox" onchange="document.querySelectorAll('.ra-cb').forEach(c=>c.checked=this.checked)"></th><th>SAMPLE</th><th>POINT</th><th>STATUS</th><th>RESULTS</th><th>ANALYST</th><th>LOGGED</th></tr></thead>
    <tbody>${q.map(r=>`<tr><td><input type="checkbox" class="ra-cb" value="${r.id}"></td><td><b style="color:var(--brand);cursor:pointer" onclick="reviewSample('${r.id}')">${r.id}</b></td><td>${String(r.area).split('(')[0].trim()}</td><td>${r.status}</td><td style="text-align:center">${r.pending}</td><td>${titleCase(r.analyst)}</td><td style="color:var(--muted)">${r.logged}</td></tr>`).join('')}</tbody></table></div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Approve selected',cls:'btn-green',icon:'check-check',fn:'reviewBulk()'}]});
}
function reviewBulk(){
  const ids=[...document.querySelectorAll('.ra-cb:checked')].map(c=>c.value);
  if(!ids.length){ toast('Select at least one sample','err'); return; }
  if(!can('Lab Supervisor','Approving results')) return;
  ids.forEach(id=>{ const r=DATA.inReview.find(x=>x.id===id); if(r){ r.status='Approved'; r.decidedBy=myName(); } });
  audit('Bulk approved samples','Review Queue',ids.join(', '));
  closeModal(); render(); toast(`${ids.length} sample${ids.length>1?'s':''} approved`,'ok');
}

function dashboardCharts(){
  const d = ACTIVE_DASH || DATA.getStreamDash(state.route);
  stackedBarH('c-conformance', d.conformance.map(x=>x.param), [
    {name:'In-Spec', color:'#0a8f6d', data:d.conformance.map(x=>x.inSpec)},
    {name:'OOS',     color:'#e11f26', data:d.conformance.map(x=>x.oos)},
  ]);
  spcChart('c-spc', d.spc.labels, d.spc.values, d.spc);
}
