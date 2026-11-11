/* ===== Plant Sheet: the daily Plant Analysis Sheet (TD-3-004), built from Result Entry =====
   Today's sheet fills itself as analysts enter results. Past sheets are kept by date, and old
   Excel sheets can be imported as they are. */
const PS={date:null, edit:false, view:'sheet', zoom:1, cells:{}};
LIBS.xlsx='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

function psToday(){ return pasIso(new Date()); }
function psLabel(iso){ const d=new Date(iso+'T00:00:00'); return isNaN(d)?iso:fmtDate(d); }
function psCards(){ return (DATA.labByStream&&DATA.labByStream.h2o2)||[]; }
function psCardIndex(gid){ return psCards().findIndex(c=>c.pas===gid); }
function psRec(date){ return (DATA.pasSheets||{})[date]||null; }
function psLiveRec(){
  const t=psToday(); DATA.pasSheets=DATA.pasSheets||{};
  if(!DATA.pasSheets[t]) DATA.pasSheets[t]={date:t, source:'live', logs:{}, signoff:{}, closed:false};
  return DATA.pasSheets[t];
}
function psIsLive(date){ const r=psRec(date); return date===psToday()&&!(r&&(r.closed||r.source==='import')); }
function psLiveGrids(){
  const lr=(DATA.labResults&&DATA.labResults.h2o2)||{}, out={};
  PAS_TPL.grids.forEach(g=>{ const st=lr[psCardIndex(g.id)]; const v={}; if(st) Object.entries(st.values||{}).forEach(([k,x])=>{ if(x!==''&&x!=null) v[k]=String(x); }); out[g.id]=v; });
  return out;
}
function psGrids(date){ if(psIsLive(date)) return psLiveGrids(); const r=psRec(date); return (r&&r.grids)||{}; }
function psDates(){ const s=new Set([psToday(),...Object.keys(DATA.pasSheets||{})]); return [...s].sort().reverse(); }
function psCurrent(){ if(!PS.date){ const t=psToday(); PS.date=pasCount(psGrids(t))?t:(psDates().find(d=>pasCount(psGrids(d)))||t); } return PS.date; }
function psGrid(id){ return PAS_TPL.grids.find(g=>g.id===id); }
/* the same cell on the most recent saved sheet before today (for Result Entry's "previous reading") */
function psPrevious(gid,ri,cx){
  const t=psToday();
  const d=Object.keys(DATA.pasSheets||{}).filter(x=>x<t).sort().reverse().find(x=>{ const g=(psRec(x).grids||{})[gid]; return g&&g[ri+'-'+cx]!=null; });
  return d?{v:psRec(d).grids[gid][ri+'-'+cx],label:psLabel(d)}:null;
}
function psOOS(grids){
  const out=[];
  PAS_TPL.grids.forEach(g=>{ const v=grids[g.id]||{}; g.rows.forEach((r,ri)=>g.cols.forEach((col,cx)=>{ const x=v[ri+'-'+cx]; if(x!=null&&checkSpec(r[2],x)==='fail') out.push({g,ri,cx,col,v:x,r}); })); });
  return out;
}
function psNum(v){ const n=parseFloat(String(v||'').replace(/,/g,'')); return /^-?\d/.test(String(v||'').trim())&&!isNaN(n)?n:null; }
function psAvg(list){ const n=list.map(psNum).filter(x=>x!=null); if(!n.length) return ''; const a=n.reduce((s,x)=>s+x,0)/n.length; return String(+a.toFixed(a>=100?0:2)); }

/* ---------- screen ---------- */
function screenPlantSheet(){
  const date=psCurrent(), rec=psRec(date), live=psIsLive(date), grids=psGrids(date);
  const edit=PS.edit&&live;
  const oos=psOOS(grids), n=pasCount(grids);
  const logs=(rec&&rec.logs)||{};
  const points=PAS_TPL.grids.filter(g=>Object.keys(grids[g.id]||{}).length).length;
  const signed=PAS_TPL.shifts.filter(s=>rec&&rec.signoff&&rec.signoff[s.k]).length;
  const src=live?`<span class="badge b-green">Live</span> Builds itself from Result Entry as results are entered`
    :rec&&rec.source==='import'?`<span class="badge b-blue">Imported</span> From <b>${esc(rec.file||'Excel')}</b>${rec.importedAt?` · ${esc(rec.importedAt)}`:''}`
    :rec&&rec.closed?`<span class="badge b-teal-o">Closed</span> Saved after all three shifts signed off${rec.closedAt?` · ${esc(rec.closedAt)}`:''}`
    :`<span class="badge b-teal-o">No sheet</span> Nothing recorded for this date`;
  return `
  <div class="pas">
    <div class="pas-top">
      <div>
        <div class="ph-t" style="font-size:20px">Plant Analysis Sheet</div>
        <div class="ph-s">${PAS_TPL.code} · ${PAS_TPL.issue} · QC Laboratory, Descon Oxychem</div>
        <div class="pas-src">${src}</div>
      </div>
      <div class="pas-acts">
        <label class="pas-date"><i data-lucide="calendar"></i><select onchange="psPick(this.value)" aria-label="Sheet date">${psDates().map(d=>`<option value="${d}" ${d===date?'selected':''}>${psLabel(d)}${d===psToday()?' · today':''}${psRec(d)&&psRec(d).source==='import'?' · imported':''}</option>`).join('')}</select></label>
        ${live?`<button class="btn ${edit?'btn-green':'btn-out'}" onclick="psToggleEdit()"><i data-lucide="${edit?'check':'pencil'}"></i>${edit?'Done editing':'Type into the sheet'}</button>`:''}
        <button class="btn btn-out" onclick="psImport()"><i data-lucide="upload"></i>Import Excel sheet</button>
        <button class="btn btn-out" onclick="psExportXlsx()"><i data-lucide="file-spreadsheet"></i>Excel</button>
        <button class="btn btn-out" onclick="psPdf()"><i data-lucide="file-text"></i>PDF</button>
        <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="psSend()"><i data-lucide="send"></i>Send to distribution</button>
      </div>
    </div>
    <div id="ps-kpis">${psKpis(n,oos.length,points,signed)}</div>
    <div id="ps-oos">${psOosCard(oos,date)}</div>
    <div class="pas-viewbar">
      <div class="seg" role="tablist" aria-label="View">
        <button class="${PS.view==='sheet'?'on':''}" onclick="psView('sheet')"><i data-lucide="sheet"></i>Sheet</button>
        <button class="${PS.view==='cards'?'on':''}" onclick="psView('cards')"><i data-lucide="layout-grid"></i>Sections</button>
      </div>
      ${PS.view==='sheet'?`<div class="pas-zoom"><button onclick="psZoom(-0.1)" aria-label="Zoom out"><i data-lucide="minus"></i></button><span>${Math.round(PS.zoom*100)}%</span><button onclick="psZoom(0.1)" aria-label="Zoom in"><i data-lucide="plus"></i></button><button onclick="psZoom(0)" class="pas-fit">Fit width</button></div>`:''}
      ${edit?'<span class="pas-editing"><i data-lucide="pencil"></i>Typing into the sheet · values save to Result Entry</span>':''}
    </div>
    ${PS.view==='sheet'?psSheetView(date,grids,logs,rec,live,edit)
      :PAS_TPL.sections.map(sec=>psSection(sec,grids,logs,edit,live)).join('')+psFooter(rec,live,date)}
  </div>`;
}
function psKpis(n,o,points,signed){
  return kpiRow([
    {l:'Readings recorded',v:String(n),i:'clipboard-check',s:'On this sheet'},
    {l:'Outside range',v:String(o),i:'triangle-alert',s:o?'Flagged in red below':'All within range'},
    {l:'Sampling points',v:`${points}/${PAS_TPL.grids.length}`,i:'map-pin',s:'With at least one result'},
    {l:'Shift sign-off',v:`${signed}/3`,i:'pen-line',s:'Evening · Night · Morning'},
  ],4);
}
function psOosCard(oos,date){
  if(!oos.length) return '';
  return `<div class="card pas-oos"><div class="card-head"><div class="card-title"><i data-lucide="triangle-alert" style="width:15px;color:#e0930b"></i> Outside range on ${psLabel(date)} <span class="badge b-amber">${oos.length}</span></div>
    <span style="font-size:11.5px;color:var(--muted)">The paper sheet shows these as plain numbers. Here each one is flagged. Click to find it.</span></div>
    <div class="pas-oos-list">${psGroupOos(oos).map(x=>{ const o=x.items[0];
      const vals=x.items.map(i=>psNum(i.v)).filter(v=>v!=null); const lo=Math.min(...vals), hi=Math.max(...vals);
      const shown=vals.length>1&&lo!==hi?`${lo} to ${hi}`:esc(o.v);
      return `<button class="pas-oos-i" onclick="psJumpTo('${o.g.id}',${o.ri},${o.cx})"><b>${esc(o.g.t)}</b><span>${esc(o.r[0])} · ${x.items.length>1?`${x.items.length} of ${x.total} readings`:esc(o.col)}</span><em>${shown} <small>${esc(o.r[1]||'')}</small></em><i>range ${esc(o.r[2])}${x.items.length>1?` · at ${x.items.map(i=>i.col).join(', ')}`:''}</i></button>`; }).join('')}</div></div>`;
}
/* one line per sampling point + test, e.g. "Color · 11 of 12 readings" */
function psGroupOos(oos){
  const m=new Map();
  oos.forEach(o=>{ const k=o.g.id+'|'+o.ri; if(!m.has(k)) m.set(k,{items:[],total:0,g:o.g,ri:o.ri}); m.get(k).items.push(o); });
  const date=psCurrent(), grids=psGrids(date);
  m.forEach(x=>{ const v=grids[x.g.id]||{}; x.total=x.g.cols.filter((_,cx)=>v[x.ri+'-'+cx]!=null).length; });
  return [...m.values()];
}
function psSection(sec,grids,logs,edit,live){
  const gs=PAS_TPL.grids.filter(g=>g.sec===sec.id), ls=PAS_TPL.logs.filter(l=>l.sec===sec.id);
  const n=gs.reduce((s,g)=>s+Object.keys(grids[g.id]||{}).length,0)+ls.reduce((s,l)=>s+((logs[l.id]||[]).filter(r=>Object.values(r).some(Boolean)).length),0);
  const o=psOOS(grids).filter(x=>x.g.sec===sec.id).length;
  let blocks='';
  if(sec.id==='hp'){
    blocks+=psGridBlock(psGrid('hyd'),grids,edit);
    blocks+=psExtraction(grids,edit);
    blocks+=psCombo('Oxidation & WS cooler',['ox2042','ox2063','ws1025'],grids,edit);
    ['ws','wsm','tg','cg'].forEach(id=>blocks+=psGridBlock(psGrid(id),grids,edit));
  } else {
    gs.forEach(g=>blocks+=psGridBlock(g,grids,edit));
  }
  ls.forEach(l=>blocks+=psLogBlock(l,logs[l.id]||[],edit,live));
  return `<section class="pas-sec"><div class="pas-sec-h"><h2>${sec.t}</h2><span>${n} entr${n===1?'y':'ies'}${o?` · <b class="pas-bad">${o} outside range</b>`:''}</span></div><div class="pas-blocks">${blocks}</div></section>`;
}
function psCell(g,ri,cx,v,edit,extraCls){
  const spec=g.rows[ri][2]; const chk=checkSpec(spec,v);
  const cls=chk==='fail'?'bad':chk==='pass'?'ok':'';
  if(edit) return `<td class="pas-c ${cls} ${extraCls||''}" id="pc-${g.id}-${ri}-${cx}"><input class="pas-in" value="${esc(v||'')}" data-g="${g.id}" data-r="${ri}" data-x="${cx}" oninput="psEdit(this)" aria-label="${esc(g.t+' '+g.rows[ri][0]+' '+g.cols[cx])}" placeholder="·"></td>`;
  return `<td class="pas-c ${cls} ${extraCls||''}" id="pc-${g.id}-${ri}-${cx}" ${chk==='fail'?`title="Outside range ${esc(spec)}"`:''}>${v?esc(v):'<span class="pas-nil">·</span>'}</td>`;
}
function psParam(r){ return `<td class="pas-p">${esc(r[0])}${r[1]?` <small>${esc(r[1])}</small>`:''}</td>`; }
function psGridBlock(g,grids,edit){
  const v=grids[g.id]||{};
  const body=g.rows.map((r,ri)=>`<tr>${psParam(r)}<td class="pas-r">${esc(r[2]||'—')}</td>${g.cols.map((_,cx)=>psCell(g,ri,cx,v[ri+'-'+cx],edit)).join('')}</tr>`).join('');
  return `<div class="pas-b ${g.cols.length>4?'wide':''}" id="pasb-${g.id}"><div class="pas-bh"><b>${esc(g.t)}</b>${g.note?`<span>${esc(g.note)}</span>`:''}</div>
    <div class="pas-tw"><table class="pas-t"><thead><tr><th>Parameter</th><th>Range</th>${g.cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div></div>`;
}
/* 3011 F: old and new line side by side, every 2 hours, with the day's average (as on the paper sheet) */
function psExtraction(grids,edit){
  const o=psGrid('x3011o'), n=psGrid('x3011n'), vo=grids.x3011o||{}, vn=grids.x3011n||{};
  const body=o.rows.map((r,ri)=>[[o,vo,'Old'],[n,vn,'New']].map(([g,v,line],li)=>{
    const vals=g.cols.map((_,cx)=>v[ri+'-'+cx]); const avg=psAvg(vals); const ac=checkSpec(r[2],avg);
    return `<tr class="${li?'pas-new':''}">${li?'':`<td class="pas-p" rowspan="2">${esc(r[0])}${r[1]?` <small>${esc(r[1])}</small>`:''}</td><td class="pas-r" rowspan="2">${esc(r[2])}</td>`}<td class="pas-line">${line}</td>${g.cols.map((_,cx)=>psCell(g,ri,cx,v[ri+'-'+cx],edit)).join('')}<td class="pas-c pas-avg ${ac==='fail'?'bad':ac==='pass'?'ok':''}">${avg||'<span class="pas-nil">·</span>'}</td></tr>`;
  }).join('')).join('');
  return `<div class="pas-b wide" id="pasb-x3011"><div class="pas-bh"><b>3011 F · Extraction bottom outlet</b><span>every 2 hours · old and new</span><button class="btn btn-out btn-sm" onclick="psTrend()"><i data-lucide="line-chart"></i>24 h trend</button></div>
    <div class="pas-tw"><table class="pas-t"><thead><tr><th>Test</th><th>Range</th><th></th>${o.cols.map(c=>`<th>${c}</th>`).join('')}<th>Avg.</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}
function psCombo(title,ids,grids,edit){
  const gs=ids.map(psGrid); const cols=gs[0].cols;
  const body=gs.map(g=>{ const v=grids[g.id]||{}; const r=g.rows[0]; const avg=psAvg(cols.map((_,cx)=>v['0-'+cx])); const ac=checkSpec(r[2],avg);
    const [pt,loc]=g.t.split(' · ');
    return `<tr><td class="pas-p">${esc(pt)}<small class="pas-loc">${esc(loc||'')}</small></td><td class="pas-p">${esc(r[0])} <small>${esc(r[1])}</small></td><td class="pas-r">${esc(r[2])}</td>${cols.map((_,cx)=>psCell(g,0,cx,v['0-'+cx],edit)).join('')}<td class="pas-c pas-avg ${ac==='fail'?'bad':ac==='pass'?'ok':''}">${avg||'<span class="pas-nil">·</span>'}</td></tr>`; }).join('');
  return `<div class="pas-b wide" id="pasb-${ids[0]}"><div class="pas-bh"><b>${title}</b><span>sample points 2042, 2063, 1025 / 1021</span></div>
    <div class="pas-tw"><table class="pas-t"><thead><tr><th>Sample point</th><th>Test</th><th>Range</th>${cols.map(c=>`<th>${c}</th>`).join('')}<th>Avg.</th></tr></thead><tbody>${body}</tbody></table></div></div>`;
}
function psLogBlock(l,rows,edit,live){
  const head=l.fields.map(f=>`<th>${esc(f[1])}</th>`).join('')+(edit?'<th></th>':'');
  const list=rows.map((r,i)=>({r,i})).filter(x=>Object.values(x.r).some(Boolean));
  const body=list.length?list.map(({r,i})=>`<tr>${l.fields.map(f=>`<td class="${f[0]==='tank'||f[0]==='time'?'pas-k':''}">${r[f[0]]?esc(r[f[0]]):'<span class="pas-nil">·</span>'}</td>`).join('')}${edit?`<td><button class="pas-x" onclick="psLogDel('${l.id}',${i})" aria-label="Remove line"><i data-lucide="x"></i></button></td>`:''}</tr>`).join('')
    :`<tr><td colspan="${l.fields.length+(edit?1:0)}" class="pas-empty">No entries</td></tr>`;
  return `<div class="pas-b ${l.fields.length>5?'wide':''}" id="pasb-${l.id}"><div class="pas-bh"><b>${esc(l.t)}</b><span>${list.length} line${list.length===1?'':'s'}</span>${live?`<button class="btn btn-out btn-sm" onclick="psLogAdd('${l.id}')"><i data-lucide="plus"></i>Add</button>`:''}</div>
    <div class="pas-tw"><table class="pas-t pas-log"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div></div>`;
}
function psFooter(rec,live,date){
  const sign=PAS_TPL.shifts.map(s=>{
    const x=rec&&rec.signoff&&rec.signoff[s.k];
    const body=x?(x.paper?'<span class="pas-ok">Signed on the paper sheet</span>':`<span class="pas-ok">${esc(titleCase(x.by))}</span><small>${esc(x.at)}</small>`)
      :live?`<button class="btn btn-green btn-sm" onclick="psSign('${s.k}')"><i data-lucide="pen-line"></i>Sign off</button>`:'<span class="pas-nil">Not signed</span>';
    return `<div class="pas-sign ${x?'done':''}"><b>${s.l}</b><span class="pas-from">from ${s.from}</span>${body}</div>`;
  }).join('');
  return `<div class="card pas-foot">
    <div class="pas-signs">${sign}</div>
    <div class="pas-dist"><b>To:</b> ${PAS_TPL.to} <b>CC:</b> ${PAS_TPL.cc.join(', ')}${rec&&rec.sent&&rec.sent.length?` <span class="badge b-green" style="margin-left:6px">Sent ${esc(rec.sent[rec.sent.length-1].at)}</span>`:''}</div>
  </div>`;
}

/* ---------- actions ---------- */
function psPick(d){ PS.date=d; PS.edit=false; render(); }
function psToggleEdit(){ PS.edit=!PS.edit; render(); if(PS.edit){ const f=document.querySelector('.pas-in'); if(f) f.focus(); toast('Type values straight into the sheet. They save to Result Entry.','info'); } }
let PS_T=null;
function psEdit(inp){
  const g=psGrid(inp.dataset.g), ri=+inp.dataset.r, cx=+inp.dataset.x, ci=psCardIndex(g.id); if(ci<0) return;
  const st=labState(ci); st.values[ri+'-'+cx]=inp.value.trim();
  if(st.status==='Pending'||st.status==='Missed') st.status='Draft';
  st.updated=fmtStamp(); st.by=myName();
  const chk=checkSpec(g.rows[ri][2],inp.value), td=inp.parentElement;
  td.classList.toggle('bad',chk==='fail'); td.classList.toggle('ok',chk==='pass');
  clearTimeout(PS_T); PS_T=setTimeout(psRefresh,400); persistSoon();
}
function psRefresh(){
  const date=psCurrent(), rec=psRec(date), grids=psGrids(date), oos=psOOS(grids);
  const points=PAS_TPL.grids.filter(g=>Object.keys(grids[g.id]||{}).length).length;
  const signed=PAS_TPL.shifts.filter(s=>rec&&rec.signoff&&rec.signoff[s.k]).length;
  const k=document.getElementById('ps-kpis'); if(k) k.innerHTML=psKpis(pasCount(grids),oos.length,points,signed);
  const o=document.getElementById('ps-oos'); if(o) o.innerHTML=psOosCard(oos,date);
  if(window.lucide) lucide.createIcons();
}
function psJump(id){
  const el=document.getElementById(id); if(!el) return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  el.classList.remove('pas-flash'); void el.offsetWidth; el.classList.add('pas-flash');
}
function psOpenFrom(gid){ state.tab='pas'; PS.date=psToday(); render(); setTimeout(()=>psJump('pasb-'+(gid.startsWith('x3011')?'x3011':['ox2063','ws1025'].includes(gid)?'ox2042':gid)),120); }
function psLogAdd(id){
  const l=PAS_TPL.logs.find(x=>x.id===id); if(!l) return;
  simpleAdd(`${l.t} · add line`, l.fields.map(f=>({key:f[0],label:f[1],ph:f[2]==='time'?'e.g. 1600':f[0]==='tank'?'e.g. 5005':''})), v=>{
    const rec=psLiveRec(); rec.logs[id]=rec.logs[id]||[];
    const row={}; l.fields.forEach(f=>row[f[0]]=pasNorm(v[f[0]],f[2]));
    if(!Object.values(row).some(x=>x)){ toast('Nothing entered','info'); return; }
    rec.logs[id].push(row); audit('Added sheet line','Plant Sheet',`${l.t} · ${Object.values(row).filter(Boolean).join(' / ')}`); persistSoon(); toast('Line added','ok');
  });
}
function psLogDel(id,i){ const rec=psLiveRec(); (rec.logs[id]||[]).splice(i,1); persistSoon(); render(); }
function psSign(k){
  if(!can('Senior Analyst','Signing off a shift')) return;
  const rec=psLiveRec(); rec.signoff=rec.signoff||{};
  const s=PAS_TPL.shifts.find(x=>x.k===k);
  rec.signoff[k]={by:myName(),at:fmtStamp()};
  audit('Signed off shift','Plant Sheet',`${s.l} · ${psLabel(rec.date)}`);
  persistSoon(); render(); toast(`${s.l} signed off`,'ok');
  if(PAS_TPL.shifts.every(x=>rec.signoff[x.k])){
    confirmModal('Close the day\'s sheet',`All three shifts have signed. Close the sheet for <b>${psLabel(rec.date)}</b>? Its values are saved as the record for that day.`,()=>{
      rec.grids=psLiveGrids(); rec.closed=true; rec.closedAt=fmtStamp(); PS.edit=false;
      /* the paper workflow: once the day is closed, Result Entry starts fresh */
      const lr=DATA.labResults.h2o2=DATA.labResults.h2o2||{};
      PAS_TPL.grids.forEach(g=>{ const ci=psCardIndex(g.id); if(ci>=0) lr[ci]={values:{},status:'Pending',updated:null,by:null}; });
      audit('Closed plant sheet','Plant Sheet',psLabel(rec.date)); persistSoon(); render(); toast('Sheet closed and saved','ok');
    },'Close sheet');
  }
}

/* ---------- Excel import / export ---------- */
function psImport(){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.xls,.xlsx';
  inp.onchange=()=>{ const f=inp.files&&inp.files[0]; if(f) psReadFile(f); };
  inp.click();
}
async function psReadFile(file){
  toast('Reading '+file.name+'…','info');
  try{
    await loadScript(LIBS.xlsx);
    const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
    const ws=wb.SheetNames.map(n=>wb.Sheets[n]).find(w=>pasLooksRight(a=>w[a]?w[a].v:null));
    if(!ws){ toast(`${file.name} isn't a ${PAS_TPL.code} Plant Analysis Sheet`,'err'); return; }
    const p=pasParse(a=>ws[a]?ws[a].v:null, file.name);
    if(!p.date) p.date=psToday();
    window.__psImport={p,file:file.name};
    const oos=psOOS(p.grids).length, logs=Object.entries(p.logs).filter(([,v])=>v.length);
    const exists=psRec(p.date)&&pasCount(psGrids(p.date));
    openModal({title:'Import plant sheet', body:`
      <div class="pas-imp">
        <div><span>File</span><b>${esc(file.name)}</b></div>
        <div><span>Sheet date</span><b>${psLabel(p.date)}</b></div>
        <div><span>Readings found</span><b>${pasCount(p.grids)} across ${PAS_TPL.grids.filter(g=>Object.keys(p.grids[g.id]).length).length} sampling points</b></div>
        <div><span>Outside range</span><b class="${oos?'pas-bad':''}">${oos}</b></div>
        <div><span>Lists</span><b>${logs.length?logs.map(([k,v])=>`${PAS_TPL.logs.find(l=>l.id===k).t} ${v.length}`).join(' · '):'None'}</b></div>
      </div>
      ${exists?`<p class="pas-warn">A sheet for ${psLabel(p.date)} already exists. Importing replaces it.</p>`:''}`,
      actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Import sheet',cls:'btn-green',icon:'check',fn:'psImportSave()'}]});
  }catch(e){ console.error(e); toast('Could not read the file. Check your internet connection and that it is an Excel file.','err'); }
}
function psImportSave(){
  const x=window.__psImport; if(!x) return;
  const p=x.p; DATA.pasSheets=DATA.pasSheets||{};
  DATA.pasSheets[p.date]={date:p.date, source:'import', file:x.file, importedAt:fmtStamp(), importedBy:myName(), grids:p.grids, logs:p.logs,
    signoff:{E:{paper:true},N:{paper:true},M:{paper:true}}, closed:true};
  audit('Imported plant sheet','Plant Sheet',`${x.file} · ${psLabel(p.date)} · ${pasCount(p.grids)} readings`);
  const oos=psOOS(p.grids);
  if(oos.length) notify(`${oos.length} readings outside range on ${psLabel(p.date)}`,`From ${x.file} · ${oos.slice(0,3).map(o=>o.g.t+' '+o.r[0]).join(', ')}${oos.length>3?'…':''}`,{icon:'triangle-alert',color:'#e0930b',route:'h2o2',tab:'pas'});
  PS.date=p.date; PS.edit=false; window.__psImport=null;
  closeModal(); persistSoon(); render(); toast(`Imported ${psLabel(p.date)} · ${pasCount(p.grids)} readings`,'ok');
}
async function psExportXlsx(){
  const date=psCurrent(), rec=psRec(date), grids=psGrids(date), logs=(rec&&rec.logs)||{}, live=psIsLive(date);
  try{
    await loadScript(LIBS.xlsx);
    const L=PAS_LAYOUT, m=psSheetCells(date,grids,logs,rec,live,false), ws={}, merges=[];
    const fmtZ={p4:'0000',i:'0',d1:'0.0',d2:'0.00',d3:'0.000',d4:'0.0000'};
    L.cells.forEach((line,r)=>line.forEach(cell=>{
      const [c,rs,cs,text]=cell, a=psColName(c)+(r+1);
      if(rs>1||cs>1) merges.push({s:{r,c},e:{r:r+rs-1,c:c+cs-1}});
      let v=text;
      if(cell.length>5){ const d=m[a]||{}; v=d.text!=null?d.text:(d.v||''); }
      if(v===''||v==null) return;
      const sv=String(v).trim(), n=psNum(sv);
      if(n!=null&&/^-?\d+(\.\d+)?$/.test(sv)) ws[a]={t:'n',v:n,z:fmtZ[cell[5]]};
      else ws[a]={t:'s',v:String(v)};
    }));
    ws['!ref']='A1:AH44'; ws['!merges']=merges;
    ws['!cols']=L.cols.map(w=>({wpx:w})); ws['!rows']=L.rows.map(hp=>({hpx:hp}));
    const oos=psOOS(grids);
    const ws2=XLSX.utils.aoa_to_sheet([['Sampling point','Parameter','Time','Value','Unit','Range'],...oos.map(o=>[o.g.t,o.r[0],o.col,o.v,o.r[1],o.r[2]])]);
    ws2['!cols']=[{wch:40},{wch:20},{wch:10},{wch:10},{wch:8},{wch:18}];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Sheet2'); XLSX.utils.book_append_sheet(wb,ws2,'Outside range');
    XLSX.writeFile(wb,`${date.split('-').reverse().join('-')}.xlsx`);
    audit('Exported plant sheet','Plant Sheet',`${psLabel(date)} (Excel)`); toast('Excel file saved in the TD-3-004 layout','ok');
  }catch(e){ console.error(e); toast('Export needs an internet connection to load the Excel writer','err'); }
}
function psSend(){
  const date=psCurrent(), grids=psGrids(date), oos=psOOS(grids), n=pasCount(grids);
  if(!n){ toast('This sheet has no results yet','info'); return; }
  if(typeof OUTLOOK!=='undefined'&&!OUTLOOK.lists.find(l=>l.id==='plant-sheet')){
    OUTLOOK.lists.push({id:'plant-sheet', name:'Plant sheet distribution (TD-3-004)', static:[
      {name:'Operational Manager',email:'operations.manager@descon.com',role:'To'},
      ...PAS_TPL.cc.map(c=>({name:c,email:c.toLowerCase().replace(/[^a-z]+/g,'.').replace(/\.$/,'')+'@descon.com',role:'CC'}))]});
  }
  const lines=oos.slice(0,12).map(o=>`- ${o.g.t} · ${o.r[0]} at ${o.col}: ${o.v} ${o.r[1]||''} (range ${o.r[2]})`).join('\n');
  window.__psSentDate=date;
  emailReportViaOutlook({report:'Plant Analysis Sheet · '+psLabel(date), file:`Plant_Analysis_Sheet_${date}.pdf`, size:'312 KB', listId:'plant-sheet',
    subject:`Plant Analysis Sheet (${PAS_TPL.code}) · ${psLabel(date)}`,
    body:`Dear all,\n\nPlease find attached the Plant Analysis Sheet for ${psLabel(date)}.\n\n${n} readings recorded. ${oos.length?oos.length+' outside range:\n'+lines+(oos.length>12?`\n- and ${oos.length-12} more`:''):'All readings within range.'}\n\nRegards,\n${titleCase(myName())}\nQC Laboratory, Descon Oxychem`});
}

/* ---------- 3011 F 24-hour trend ---------- */
function psTrend(){
  const date=psCurrent(), grids=psGrids(date), o=psGrid('x3011o');
  openModal({title:`3011 F · Extraction bottom outlet · ${psLabel(date)}`, wide:true, body:`<div class="pas-trends">${o.rows.map((r,ri)=>`<div><div class="pas-tt">${esc(r[0])} ${r[1]?`<small>${esc(r[1])}</small>`:''} · range ${esc(r[2])}</div><div style="height:170px"><canvas id="ps-tr-${ri}"></canvas></div></div>`).join('')}</div>`});
  setTimeout(()=>o.rows.forEach((r,ri)=>{
    const id='ps-tr-'+ri; destroyChart(id); const el=document.getElementById(id); if(!el) return;
    const get=gid=>o.cols.map((_,cx)=>psNum((grids[gid]||{})[ri+'-'+cx]));
    const p=parseSpec(r[2]), ds=[
      {label:'Old',data:get('x3011o'),borderColor:'#0060b0',backgroundColor:'#0060b0',tension:.3,borderWidth:2,pointRadius:2.5,spanGaps:true},
      {label:'New',data:get('x3011n'),borderColor:'#0a9d78',backgroundColor:'#0a9d78',tension:.3,borderWidth:2,pointRadius:2.5,spanGaps:true}];
    if(p&&p.hi!=null) ds.push({label:'Max '+p.hi,data:o.cols.map(()=>p.hi),borderColor:'#e11f26',borderDash:[5,4],borderWidth:1.4,pointRadius:0});
    if(p&&p.lo!=null&&p.lo>0) ds.push({label:'Min '+p.lo,data:o.cols.map(()=>p.lo),borderColor:'#e0930b',borderDash:[5,4],borderWidth:1.4,pointRadius:0});
    CHARTS[id]=new Chart(el,{type:'line',data:{labels:o.cols,datasets:ds},options:{responsive:true,maintainAspectRatio:false,animation:false,
      plugins:{legend:{position:'top',align:'start',labels:{boxWidth:10}}},interaction:{mode:'index',intersect:false},scales:{y:{grace:'8%'},x:{grid:{display:false}}}}});
  }),80);
}

/* ================= Exact sheet view: TD-3-004 drawn cell for cell from Descon's Excel layout ================= */
function psColName(c){ let n=c+1, out=''; while(n>0){ const m=(n-1)%26; out=String.fromCharCode(65+m)+out; n=Math.floor((n-1)/26); } return out; }
function psCellAddr(g,ri,cx){ const src=g.rows[ri][3]; if(Array.isArray(src)) return src[cx]; if(src&&src.pairs&&src.pairs[cx]) return src.pairs[cx][1]; return null; }
function psJumpTo(gid,ri,cx){
  if(PS.view==='sheet'){ const a=psCellAddr(psGrid(gid),ri,cx); if(a) return psJump('xa-'+a); }
  psJump('pc-'+gid+'-'+ri+'-'+cx);
}
function psView(v){ PS.view=v; render(); }
function psZoom(d){
  const t=document.querySelector('.xls'), w=document.querySelector('.xls-wrap');
  if(d===0){ if(w&&t) PS.zoom=Math.max(0.4,Math.min(1.5,+((w.clientWidth-40)/(t.offsetWidth)).toFixed(2))); }
  else PS.zoom=Math.max(0.4,Math.min(1.5,+(PS.zoom+d).toFixed(2)));
  const sh=document.querySelector('.xls-sheet'); if(sh) sh.style.zoom=PS.zoom;
  const z=document.querySelector('.pas-zoom span'); if(z) z.textContent=Math.round(PS.zoom*100)+'%';
  psAfter();
}
/* number formats as set in the Excel file ("0000" times, "0.00" results), never hiding digits that were entered */
function psFmt(v,code,width,strict){
  if(v==null||v==='') return '';
  const s=String(v).trim(); if(!/^-?\d+(\.\d+)?$/.test(s)) return s;
  const n=parseFloat(s); let f=s;
  if((!code||code==='g')&&width){ const max=Math.max(3,Math.floor((width-4)/7.2)); if(s.length>max&&s.includes('.')){ const intLen=String(Math.trunc(Math.abs(n))).length+(n<0?1:0); const dp=Math.max(0,max-intLen-1); return String(+n.toFixed(dp)); } return s; }
  if(strict&&code){ if(code==='p4') return String(Math.round(n)).padStart(4,'0'); if(code==='i') return String(Math.round(n)); if(code[0]==='d') return n.toFixed(+code[1]); }
  if(code==='p4') f=String(Math.round(n)).padStart(4,'0');
  else if(code==='i') f=String(Math.round(n));
  else if(code&&code[0]==='d') f=n.toFixed(+code[1]);
  return parseFloat(f)===n?f:s;
}
function psExcelDate(iso){ const d=new Date(iso+'T00:00:00'); return isNaN(d)?iso:`${d.getDate()}-${MON[d.getMonth()]}-${d.getFullYear()}`; }
let PS_CSS=false;
function psSheetStyles(){
  if(PS_CSS||typeof PAS_LAYOUT==='undefined') return; PS_CSS=true;
  const el=document.createElement('style'); el.id='xls-css';
  el.textContent=PAS_LAYOUT.styles.map((c,i)=>`.xls td.s${i}{${c}}`).join('\n');
  document.head.appendChild(el);
}
/* what goes in each data cell of the sheet */
function psSheetCells(date,grids,logs,rec,live,edit){
  const m={};
  m[PAS_TPL.dateCell]={v:psExcelDate(date),ro:true};
  PAS_TPL.grids.forEach(g=>{ const vals=grids[g.id]||{};
    g.rows.forEach((r,ri)=>{ const src=r[3];
      if(Array.isArray(src)) src.forEach((a,cx)=>{ if(!a) return; const v=vals[ri+'-'+cx]; m[a]={v,g,ri,chk:checkSpec(r[2],v),ed:{t:'g',g:g.id,ri,cx}}; });
      else if(src&&src.pairs) src.pairs.forEach(([ta,va],k)=>{ const v=vals[ri+'-'+k]; const has=v!=null&&v!=='';
        m[ta]={v:has||edit?g.cols[k]:'',ro:true}; m[va]={v,g,ri,chk:checkSpec(r[2],v),ed:{t:'g',g:g.id,ri,cx:k}}; });
    });
  });
  PAS_TPL.logs.forEach(l=>{ const rows=logs[l.id]||[], per=l.to-l.from+1;
    l.sets.forEach((set,si)=>{ for(let r=l.from;r<=l.to;r++){ const slot=si*per+(r-l.from), row=rows[slot]||{};
      set.forEach((col,fi)=>{ const f=l.fields[fi]; m[col+r]={v:row[f[0]]||'',ed:{t:'l',l:l.id,slot,f:f[0],k:f[2]}}; }); }});
  });
  [['x3011o','AG'],['x3011n','AH']].forEach(([gid,col])=>{ const g=psGrid(gid), vals=grids[gid]||{};
    g.rows.forEach((r,ri)=>{ const a=psAvg(g.cols.map((_,cx)=>vals[ri+'-'+cx])); m[col+(21+ri)]={v:a,g,ri,chk:checkSpec(r[2],a),ro:true,strict:true}; }); });
  [['ox2042','AG24'],['ox2063','AG25'],['ws1025','AG26']].forEach(([gid,a])=>{ const g=psGrid(gid), vals=grids[gid]||{};
    const av=psAvg(g.cols.map((_,cx)=>vals['0-'+cx])); m[a]={v:av,g,ri:0,chk:checkSpec(g.rows[0][2],av),ro:true,strict:true}; });
  const sg={E:'AB44',N:'AD44',M:'AF44'};
  PAS_TPL.shifts.forEach(s=>{ const x=rec&&rec.signoff&&rec.signoff[s.k];
    m[sg[s.k]]={ro:true,text:x?(x.paper?'Signed':initialsOf(titleCase(x.by))):'',html:x?(x.paper?'<span class="xls-signed">Signed</span>':`<span class="xls-signed" title="${esc(titleCase(x.by)+' · '+x.at)}">${esc(initialsOf(titleCase(x.by)))}</span>`)
      :live?`<button class="xls-sign" onclick="psSign('${s.k}')">Sign</button>`:''}; });
  m.Z44={ro:true,v:''}; /* lab in-charge signs on paper; names are not shown */
  return m;
}
function psSheetView(date,grids,logs,rec,live,edit){
  if(typeof PAS_LAYOUT==='undefined') return '<div class="empty">Sheet layout not loaded</div>';
  psSheetStyles();
  const L=PAS_LAYOUT, m=psSheetCells(date,grids,logs,rec,live,edit); PS.cells=m;
  const W=L.cols.reduce((a,b)=>a+b,0);
  let h=`<div class="xls-wrap"><div class="xls-sheet" style="zoom:${PS.zoom}"><table class="xls" style="width:${W}px"><colgroup>${L.cols.map(w=>`<col style="width:${w}px">`).join('')}</colgroup><tbody>`;
  L.cells.forEach((line,r)=>{
    h+=`<tr style="height:${L.rows[r]}px">`;
    line.forEach(cell=>{
      const [c,rs,cs,text,st]=cell, a=psColName(c)+(r+1), dyn=cell.length>5;
      let inner, cls='s'+st, title='';
      if(dyn){
        const d=m[a]||{};
        if(d.html!=null) inner=d.html;
        else if(edit&&d.ed) inner=`<input class="xls-in" value="${esc(d.v||'')}" data-a="${a}" oninput="psSheetEdit(this)" aria-label="${esc(d.g?d.g.t+' · '+d.g.rows[d.ri][0]:a)}">`;
        else { let w=0; for(let k=0;k<cs;k++) w+=L.cols[c+k]; const s=psFmt(d.v,cell[5],w,d.strict); inner=esc(s); if(/^-?\d/.test(s)) cls+=' xn'; }
        if(d.chk==='fail'){ cls+=' xbad'; title=`Outside range ${d.g.rows[d.ri][2]}`; }
      } else inner=Array.isArray(text)?text[1]:esc(text);
      h+=`<td${rs>1?` rowspan="${rs}"`:''}${cs>1?` colspan="${cs}"`:''} class="${cls}" id="xa-${a}"${title?` title="${esc(title)}"`:''}>${inner}</td>`;
    });
    h+='</tr>';
  });
  return h+'</tbody></table><div class="xls-draw" aria-hidden="true"></div></div></div>';
}
function psSheetEdit(inp){
  const d=PS.cells[inp.dataset.a]; if(!d||!d.ed) return;
  const v=inp.value.trim(), e=d.ed;
  if(e.t==='g'){
    const g=psGrid(e.g), ci=psCardIndex(e.g); if(ci<0) return;
    const st=labState(ci); st.values[e.ri+'-'+e.cx]=v;
    if(st.status==='Pending'||st.status==='Missed') st.status='Draft';
    st.updated=fmtStamp(); st.by=myName();
    const chk=checkSpec(g.rows[e.ri][2],v); inp.parentElement.classList.toggle('xbad',chk==='fail');
    inp.parentElement.title=chk==='fail'?'Outside range '+g.rows[e.ri][2]:'';
  } else {
    const rec=psLiveRec(); rec.logs[e.l]=rec.logs[e.l]||[];
    while(rec.logs[e.l].length<=e.slot) rec.logs[e.l].push({});
    rec.logs[e.l][e.slot][e.f]=v;
  }
  clearTimeout(PS_T); PS_T=setTimeout(psRefresh,400); persistSoon();
}
async function psPdf(){
  const t=document.querySelector('.xls');
  if(PS.view!=='sheet'||!t){ exportPage('pdf'); return; }
  const date=psCurrent(); toast('Preparing PDF…','info');
  try{
    await loadScript(LIBS.html2canvas); await loadScript(LIBS.jspdf);
    const sh=t.parentElement, z=sh.style.zoom; sh.style.zoom=1; psAfter();
    const canvas=await html2canvas(sh,{scale:2,backgroundColor:'#ffffff',width:t.offsetWidth,height:t.offsetHeight,windowWidth:t.offsetWidth+80});
    sh.style.zoom=z; psAfter();
    const {jsPDF}=window.jspdf; const pdf=new jsPDF({orientation:'landscape',unit:'pt',format:'a3'});
    const Wp=pdf.internal.pageSize.getWidth(), Hp=pdf.internal.pageSize.getHeight(), mg=24;
    const k=Math.min((Wp-2*mg)/canvas.width,(Hp-2*mg)/canvas.height);
    pdf.addImage(canvas.toDataURL('image/jpeg',0.95),'JPEG',mg,mg,canvas.width*k,canvas.height*k);
    pdf.save(`Plant_Analysis_Sheet_${date}.pdf`);
    audit('Exported plant sheet','Plant Sheet',`${psLabel(date)} (PDF)`); toast('PDF saved','ok');
  }catch(e){ console.error(e); toast('PDF needs an internet connection to load the exporter','err'); }
}

/* drawing layer of the Excel sheet: the Descon logo, thin divider lines and text boxes, placed by their cell anchors */
function psAfter(){
  const sh=document.querySelector('.xls-sheet'), t=sh&&sh.querySelector('.xls'), lay=sh&&sh.querySelector('.xls-draw');
  if(!lay||typeof PAS_LAYOUT==='undefined') return;
  const L=PAS_LAYOUT; /* measured at the current zoom: row heights shift slightly between zoom levels */
  const top=[...t.rows].map(r=>r.offsetTop), hgt=[...t.rows].map(r=>r.offsetHeight); /* offsets ignore the page's entry animation */
  const left=[]; L.cols.reduce((x,w,i)=>{ left[i]=x; return x+w; },0);
  const P=(c,dx,r,dy)=>[left[c]+dx/1024*L.cols[c], (top[r]||0)+dy/256*(hgt[r]||0)];
  const W=t.offsetWidth, H=t.offsetHeight; let svg='', html='';
  (L.draw||[]).forEach(d=>{
    let [x1,y1]=P(d.a[0],d.a[1],d.a[2],d.a[3]), [x2,y2]=P(d.a[4],d.a[5],d.a[6],d.a[7]);
    const box=`left:${Math.min(x1,x2)}px;top:${Math.min(y1,y2)}px;width:${Math.max(1,Math.abs(x2-x1))}px;height:${Math.max(1,Math.abs(y2-y1))}px`;
    if(d.t==='line'){ if(d.fh) [x1,x2]=[x2,x1]; if(d.fv) [y1,y2]=[y2,y1];
      svg+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="1"${d.ae?' marker-end="url(#xd-arrow)"':''}${d.as?' marker-start="url(#xd-arrow-s)"':''}/>`; }
    else if(d.t==='pic') html+=`<img class="xd-pic" src="assets/sheet-logo.png" alt="" style="${box}">`;
    else if(d.t==='art') html+=`<div class="xd-art" style="${box};font-size:${Math.abs(y2-y1)*0.92}px">${esc(d.s)}</div>`;
    else html+=`<div class="xd-text" style="${box}">${esc(d.s)}</div>`;
  });
  lay.innerHTML=`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><marker id="xd-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,1 L10,5 L0,9 z" fill="#000"/></marker><marker id="xd-arrow-s" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,1 L10,5 L0,9 z" fill="#000"/></marker></defs>${svg}</svg>`+html;
}
