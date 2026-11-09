/* ===== Result Entry (worksheet per sampling point) ===== */
const LAB = {sel:{}, q:'', focus:null};
function labCards(){ return (DATA.labByStream && DATA.labByStream[state.route]) || DATA.lab.cards; }
function labState(ci){
  DATA.labResults[state.route]=DATA.labResults[state.route]||{};
  const s=DATA.labResults[state.route];
  if(!s[ci]) s[ci]={values:{},status:'Pending',updated:null,by:null};
  return s[ci];
}
function labPrev(param, spec, ci, ri){ const r=mulberry32(ci*131+ri*17+param.length*7+(state.route.charCodeAt(0))); return sampleWithin(spec,r); }
function labStatusChip(s){
  const m={'Pending':'b-teal-o','Draft':'b-blue','Submitted':'b-amber','Approved':'b-green','Missed':'b-red'};
  return `<span class="badge ${m[s]||'b-teal-o'}">${s==='Submitted'?'In Review':s}</span>`;
}

function screenLabsheet(){
  const cards=labCards();
  const ci=Math.min(LAB.sel[state.route]||0, cards.length-1);
  const c=cards[ci]; const st=labState(ci);
  const q=LAB.q.toLowerCase();
  const sampleList = cards.map((cd,i)=>({cd,i})).filter(({cd})=>!q||cd.t.toLowerCase().includes(q)||cd.rows.some(r=>r[0].toLowerCase().includes(q))).map(({cd,i})=>{
    const s=labState(i); const filled=Object.values(s.values).filter(v=>v!=='').length;
    const total=cd.rows.length*Math.max(1,cd.cols.length);
    return `<div class="ls-item ${i===ci?'on':''}" onclick="labSelect(${i})">
      <i data-lucide="flask-conical"></i>
      <div style="flex:1;min-width:0">
        <div class="ls-t">${cd.t}</div>
        <div class="ls-m">${filled}/${total} values · ${labStatusChip(s.status)}</div>
      </div>
      <i data-lucide="chevron-right" style="width:14px;color:var(--muted2)"></i>
    </div>`;}).join('') || `<div class="empty" style="padding:24px">No sampling point matches “${esc(LAB.q)}”.</div>`;

  const cols=c.cols.length?c.cols:['Value'];
  const locked=st.status==='Submitted'||st.status==='Approved';
  const timeCols=cols.map(col=>`<th style="text-align:center">${col}</th>`).join('');
  const tbody=c.rows.map((r,ri)=>{
    const cells=cols.map((_,cx)=>{
      const v=st.values[ri+'-'+cx]??''; const chk=checkSpec(r[2],v);
      return `<td style="text-align:center;padding:4px"><input class="lab-in ${chk==='fail'?'oos':chk==='pass'?'ok':''}" ${locked?'disabled':''} value="${esc(v)}" data-r="${ri}" data-x="${cx}" inputmode="decimal"
        onfocus="labFocus(${ri},${cx})" oninput="labEdited(this)" onkeydown="labKey(event,${ri},${cx})" placeholder="—"></td>`;
    }).join('');
    return `<tr><td style="font-weight:600;color:var(--ink)">${r[0]}</td><td style="color:var(--muted)">${r[1]||''}</td><td style="color:var(--muted)">${r[2]||'—'}</td>${cells}</tr>`;
  }).join('');

  return `
  <div class="dense-grid" style="height:calc(100vh - 180px)">
    <div class="dense-panel">
      <div class="card-head" style="background:var(--panel-head)"><div class="card-title">Sampling Points</div><span class="badge b-blue">${cards.length}</span></div>
      <div style="padding:8px;border-bottom:1px solid var(--line2)">
        <div class="mini-search" style="width:100%"><i data-lucide="search" style="width:14px"></i><input placeholder="Search point or parameter…" value="${esc(LAB.q)}" oninput="labSearch(this.value)"></div>
      </div>
      <div style="flex:1;overflow-y:auto">${sampleList}</div>
    </div>

    <div class="dense-panel">
      <div class="card-head" style="background:var(--panel-head)">
        <div class="card-title" style="color:var(--brand)">${c.t} ${labStatusChip(st.status)}</div>
        <div class="chart-tools">
          <div class="icon-sq" style="width:26px;height:26px" onclick="labUndo()" title="Clear unsaved values"><i data-lucide="rotate-ccw" style="width:12px"></i></div>
          <div class="icon-sq" style="width:26px;height:26px" onclick="labFill()" title="Pull readings from the instrument"><i data-lucide="wand-2" style="width:12px"></i></div>
        </div>
      </div>
      <div style="flex:1;overflow:auto">
        <table class="tbl" style="min-width:560px"><thead><tr><th>Parameter</th><th>Units</th><th>Spec. limit</th>${timeCols}</tr></thead><tbody>${tbody}</tbody></table>
      </div>
      <div class="card-head" style="background:var(--panel-head);border-top:1px solid var(--line);border-bottom:none">
        <span id="lab-status" style="font-size:11px;color:var(--muted)">${labSummary(c,st)}</span>
        <div style="display:flex;gap:8px">
          ${locked?`${st.status==='Submitted'?`<button class="btn btn-out" onclick="labRecall()"><i data-lucide="undo-2"></i>Recall</button><button class="btn btn-green" onclick="labApproveReview()"><i data-lucide="check-check"></i>Approve results</button>`:`<span style="font-size:11.5px;color:var(--muted)">Approved by ${esc(st.approvedBy||'—')}</span>`}`
          :`<button class="btn btn-out" onclick="labMissed()"><i data-lucide="calendar-x"></i>Mark missed</button>
            <button class="btn btn-out" onclick="labReset()"><i data-lucide="x"></i>Clear</button>
            <button class="btn btn-out" onclick="labSaveDraft()"><i data-lucide="save"></i>Save draft</button>
            <button class="btn btn-green" onclick="labApprove()"><i data-lucide="send"></i>Submit for review</button>`}
        </div>
      </div>
    </div>

    <div class="dense-panel">
      <div class="card-head" style="background:var(--panel-head)"><div class="card-title">Parameter Context</div></div>
      <div id="lab-ctx" style="padding:14px;flex:1;overflow-y:auto;font-size:12px;display:flex;flex-direction:column;gap:12px">${labContext(ci,0,0)}</div>
    </div>
  </div>`;
}
function labSummary(c,st){
  const vals=Object.entries(st.values).filter(([,v])=>v!=='');
  const oos=vals.filter(([k,v])=>checkSpec(c.rows[+k.split('-')[0]][2],v)==='fail').length;
  const when=st.updated?` · last saved ${st.updated} by ${esc(titleCase(st.by||''))}`:'';
  return `${vals.length} value(s) entered${oos?` · <b style="color:var(--descon-red)">${oos} out of spec</b>`:''}${when}`;
}
function labContext(ci,ri,cx){
  const c=labCards()[ci]; const r=c.rows[ri]; if(!r) return '';
  const st=labState(ci); const v=st.values[ri+'-'+cx]??'';
  const prev=labPrev(r[0],r[2],ci,ri); const chk=checkSpec(r[2],v); const p=parseSpec(r[2]);
  const spec=(DATA.specs||[]).find(s=>s.parameter.toLowerCase()===r[0].toLowerCase());
  return `
    <div><div class="ctx-k">Parameter</div><div class="ctx-v">${r[0]} <span style="color:var(--muted);font-weight:400">${r[1]||''}</span></div></div>
    <div class="ctx-box ${chk==='fail'?'bad':chk==='pass'?'good':''}">
      <div class="ctx-k">Current entry</div>
      <div class="ctx-big">${v===''?'—':esc(v)} <span>${r[1]||''}</span></div>
      <div>${chk==='fail'?'<span class="badge b-red">Out of specification</span>':chk==='pass'?'<span class="badge b-green">Within specification</span>':'<span class="badge b-teal-o">Waiting for value</span>'}</div>
    </div>
    <div class="ctx-box"><div class="ctx-k">Specification</div><div class="ctx-v">${r[2]||'No limit set'}</div>
      ${p?`<div style="color:var(--muted);margin-top:3px">${p.lo!=null?'Min '+p.lo:''}${p.lo!=null&&p.hi!=null?' · ':''}${p.hi!=null?'Max '+p.hi:''}</div>`:''}
      ${spec?`<div style="color:var(--muted);margin-top:3px">Method: ${spec.method}</div>`:''}</div>
    <div class="ctx-box"><div class="ctx-k">Previous reading</div><div class="ctx-big">${prev} <span>${r[1]||''}</span></div><div style="color:var(--muted2);font-size:10.5px">Last cycle · ${c.cols[cx]||'routine'} slot</div>
      <div style="height:70px;margin-top:6px"><canvas id="ctx-spark"></canvas></div></div>
    <button class="btn btn-out" style="justify-content:center" onclick="labTrend('${jsq(r[0])}')"><i data-lucide="line-chart"></i>7-day trend</button>
    <button class="btn btn-out" style="justify-content:center" onclick="openAssistant('What is the test method and limit for ${jsq(r[0])} at ${jsq(c.t)}?')"><i data-lucide="sparkles" style="color:var(--brand)"></i>Ask assistant</button>`;
}
function labSpark(ci,ri){
  const c=labCards()[ci]; const r=c.rows[ri]; if(!r) return;
  const rng=mulberry32(ci*977+ri*31); const pts=Array.from({length:8},()=>sampleWithin(r[2],rng));
  destroyChart('ctx-spark'); const el=document.getElementById('ctx-spark'); if(!el) return;
  CHARTS['ctx-spark']=new Chart(el,{type:'line',data:{labels:pts.map((_,i)=>i),datasets:[{data:pts,borderColor:'#0060b0',backgroundColor:'rgba(0,96,176,.12)',fill:true,tension:.4,pointRadius:0,borderWidth:1.6}]},
    options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{enabled:false}},scales:{x:{display:false},y:{display:false}}}});
}
function labSelect(i){ LAB.sel[state.route]=i; render(); }
function labFocus(ri,cx){
  LAB.focus={ri,cx}; const ci=LAB.sel[state.route]||0;
  const el=document.getElementById('lab-ctx'); if(el){ el.innerHTML=labContext(ci,ri,cx); if(window.lucide)lucide.createIcons(); labSpark(ci,ri); }
}
function labEdited(inp){
  const ci=LAB.sel[state.route]||0; const st=labState(ci); const c=labCards()[ci];
  const ri=+inp.dataset.r, cx=+inp.dataset.x;
  st.values[ri+'-'+cx]=inp.value.trim();
  if(st.status==='Pending'||st.status==='Missed') st.status='Draft';
  const chk=checkSpec(c.rows[ri][2],inp.value);
  inp.classList.toggle('oos',chk==='fail'); inp.classList.toggle('ok',chk==='pass');
  const s=document.getElementById('lab-status'); if(s) s.innerHTML=labSummary(c,st)+' · <i>unsaved</i>';
  if(LAB.focus&&LAB.focus.ri===ri&&LAB.focus.cx===cx){ const el=document.getElementById('lab-ctx'); if(el){ const box=el.querySelector('.ctx-box'); if(box){ el.innerHTML=labContext(ci,ri,cx); if(window.lucide)lucide.createIcons(); labSpark(ci,ri);} } }
}
function labKey(e,ri,cx){
  if(e.key!=='Enter'&&e.key!=='ArrowDown'&&e.key!=='ArrowUp') return;
  e.preventDefault(); const d=e.key==='ArrowUp'?-1:1;
  const nx=document.querySelector(`.lab-in[data-r="${ri+d}"][data-x="${cx}"]`); if(nx) nx.focus();
}
function labFill(){
  const ci=LAB.sel[state.route]||0; const c=labCards()[ci]; const st=labState(ci);
  let n=0;
  document.querySelectorAll('.lab-in').forEach(inp=>{
    if(inp.value||inp.disabled) return; const r=c.rows[+inp.dataset.r];
    const v=sampleWithin(r[2]); inp.value=String(v); labEdited(inp); n++;
  });
  toast(n?`${n} readings pulled from connected instruments`:'Every cell already has a value','info');
}
function labSaveDraft(){
  const ci=LAB.sel[state.route]||0; const c=labCards()[ci]; const st=labState(ci);
  st.status='Draft'; st.updated=fmtStamp(); st.by=myName();
  audit('Saved draft results','Result Entry',c.t); render(); toast('Draft saved','ok');
}
function labReset(){
  confirmModal('Clear values','Clear every value on this worksheet?',()=>{
    const ci=LAB.sel[state.route]||0; const st=labState(ci); st.values={}; st.status='Pending';
    render(); toast('Worksheet cleared','info');
  },'Clear');
}
function labUndo(){ const ci=LAB.sel[state.route]||0; const st=labState(ci); if(st.status==='Draft'&&!st.updated){ st.values={}; st.status='Pending'; } render(); toast('Unsaved changes discarded','info'); }
function labMissed(){
  const ci=LAB.sel[state.route]||0; const c=labCards()[ci];
  confirmModal('Mark as missed',`Mark this sampling cycle of <b>${c.t}</b> as <b>missed</b>? It counts against shift compliance.`,()=>{
    const st=labState(ci); st.status='Missed'; st.updated=fmtStamp(); st.by=myName();
    audit('Marked sample missed','Result Entry',c.t);
    notify('Sampling slot missed',`${c.t} · ${PRODUCT_LABELS[state.route]}`,{icon:'calendar-x',color:'#e03131',route:state.route,tab:'labsheet'});
    render(); toast('Cycle marked as missed','warn');
  },'Mark missed','danger');
}
function labApprove(){
  const ci=LAB.sel[state.route]||0; const c=labCards()[ci]; const st=labState(ci);
  const vals=Object.entries(st.values).filter(([,v])=>v!=='');
  if(!vals.length){ toast('Enter at least one value before submitting','err'); return; }
  const oos=vals.filter(([k,v])=>checkSpec(c.rows[+k.split('-')[0]][2],v)==='fail');
  confirmModal('Submit for review',`Submit <b>${vals.length}</b> result(s) for <b>${c.t}</b>?${oos.length?`<br><br><span style="color:var(--descon-red)"><b>${oos.length} result(s) are out of specification.</b> Each one opens an OOS record in Quality &amp; OOS.</span>`:''}`,()=>{
    st.status='Submitted'; st.updated=fmtStamp(); st.by=myName();
    const prefix=state.route==='h2o2'?'HP':'URE';
    const id=`${prefix}-${2700+Math.floor(Math.random()*290)}`;
    DATA.inReview.unshift({id, area:c.t, plant:PRODUCT_LABELS[state.route], status:'In Review', pending:vals.length,
      logged:fmtStamp(), analyst:myName().toUpperCase(), route:state.route, ci});
    oos.forEach(([k,v])=>{ const r=c.rows[+k.split('-')[0]];
      DATA.qualityRecords.unshift({id:seq('QR-',DATA.qualityRecords,'id',4400), parameter:r[0], result:v, spec:r[2], status:'Off-Spec',
        shift:currentShift(), reviewer:'—', point:c.t, route:state.route, logged:fmtStamp()}); });
    audit('Submitted results','Result Entry',`${c.t}: ${vals.length} values${oos.length?`, ${oos.length} OOS`:''}`);
    if(oos.length) notify(`${oos.length} OOS result${oos.length>1?'s':''} at ${c.t.split('(')[0].trim()}`,`${oos.map(([k])=>c.rows[+k.split('-')[0]][0]).join(', ')} · investigation opened`,{icon:'triangle-alert',color:'#e0930b',route:state.route,tab:'quality'});
    render(); toast(oos.length?`Submitted. ${oos.length} OOS record(s) opened in Quality & OOS.`:'Results submitted for review','ok');
  },'Submit');
}
function labRecall(){ const ci=LAB.sel[state.route]||0; const st=labState(ci); st.status='Draft'; audit('Recalled results','Result Entry',labCards()[ci].t); render(); toast('Results recalled to draft','info'); }
function labApproveReview(){
  if(!can('Lab Supervisor','Approving results')) return;
  const ci=LAB.sel[state.route]||0; const st=labState(ci); const c=labCards()[ci];
  st.status='Approved'; st.approvedBy=titleCase(myName()); st.updated=fmtStamp();
  DATA.inReview=DATA.inReview.filter(x=>!(x.route===state.route&&x.ci===ci&&x.status==='In Review'));
  audit('Approved results','Result Entry',c.t); render(); toast('Results approved','ok');
}
function currentShift(){ const h=new Date().getHours(); return h>=6&&h<14?'Morning':h>=14&&h<22?'Evening':'Night'; }
function labSearch(q){ LAB.q=q; render(); const inp=document.querySelector('.dense-panel .mini-search input'); if(inp){ inp.focus(); inp.setSelectionRange(inp.value.length,inp.value.length); } }
function labTrend(name){
  openModal({title:name+' · 7-day trend', wide:true, body:`<div style="height:280px"><canvas id="lab-trend-c"></canvas></div>`});
  setTimeout(()=>{
    const labels=[...Array(7)].map((_,i)=>fmtDate(addDays(new Date(),i-6)).slice(0,6));
    const ci=LAB.sel[state.route]||0; const c=labCards()[ci]; const r=c.rows.find(x=>x[0]===name)||c.rows[0];
    const rng=mulberry32(name.length*991+ci); const p=parseSpec(r[2]);
    const series=[{name:name,color:'#0060b0',data:labels.map(()=>sampleWithin(r[2],rng)),fill:true,fillColor:'rgba(0,96,176,.10)',point:true}];
    if(p&&p.hi!=null&&p.hi>0) series.push({name:'Upper limit',color:'#e11f26',data:labels.map(()=>p.hi),point:false});
    if(p&&p.lo!=null) series.push({name:'Lower limit',color:'#e0930b',data:labels.map(()=>p.lo),point:false});
    lineTrend('lab-trend-c',labels,series,{legend:true});
  },80);
}
/* after each render on this tab, draw the sparkline for the first cell */
function labAfter(){ const ci=LAB.sel[state.route]||0; labSpark(ci,(LAB.focus&&LAB.focus.ri)||0); }
