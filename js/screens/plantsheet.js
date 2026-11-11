/* ===== Plant Sheet: the daily Plant Analysis Sheet (TD-3-004), built from Result Entry =====
   Today's sheet fills itself as analysts enter results. Past sheets are kept by date, and old
   Excel sheets can be imported as they are. */
const PS={date:null, edit:false};
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
        <button class="btn btn-out" onclick="exportPage('pdf')"><i data-lucide="file-text"></i>PDF</button>
        <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="psSend()"><i data-lucide="send"></i>Send to distribution</button>
      </div>
    </div>
    <div id="ps-kpis">${psKpis(n,oos.length,points,signed)}</div>
    <div id="ps-oos">${psOosCard(oos,date)}</div>
    ${PAS_TPL.sections.map(sec=>psSection(sec,grids,logs,edit,live)).join('')}
    ${psFooter(rec,live,date)}
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
      return `<button class="pas-oos-i" onclick="psJump('pc-${o.g.id}-${o.ri}-${o.cx}')"><b>${esc(o.g.t)}</b><span>${esc(o.r[0])} · ${x.items.length>1?`${x.items.length} of ${x.total} readings`:esc(o.col)}</span><em>${shown} <small>${esc(o.r[1]||'')}</small></em><i>range ${esc(o.r[2])}${x.items.length>1?` · at ${x.items.map(i=>i.col).join(', ')}`:''}</i></button>`; }).join('')}</div></div>`;
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
  const n=gs.reduce((s,g)=>s+Object.keys(grids[g.id]||{}).length,0)+ls.reduce((s,l)=>s+((logs[l.id]||[]).length),0);
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
  const body=rows.length?rows.map((r,i)=>`<tr>${l.fields.map(f=>`<td class="${f[0]==='tank'||f[0]==='time'?'pas-k':''}">${r[f[0]]?esc(r[f[0]]):'<span class="pas-nil">·</span>'}</td>`).join('')}${edit?`<td><button class="pas-x" onclick="psLogDel('${l.id}',${i})" aria-label="Remove line"><i data-lucide="x"></i></button></td>`:''}</tr>`).join('')
    :`<tr><td colspan="${l.fields.length+(edit?1:0)}" class="pas-empty">No entries</td></tr>`;
  return `<div class="pas-b ${l.fields.length>5?'wide':''}" id="pasb-${l.id}"><div class="pas-bh"><b>${esc(l.t)}</b><span>${rows.length} line${rows.length===1?'':'s'}</span>${live?`<button class="btn btn-out btn-sm" onclick="psLogAdd('${l.id}')"><i data-lucide="plus"></i>Add</button>`:''}</div>
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
  const date=psCurrent(), rec=psRec(date), grids=psGrids(date), logs=(rec&&rec.logs)||{};
  try{
    await loadScript(LIBS.xlsx);
    const A=[[PAS_TPL.title.toUpperCase(),'','',PAS_TPL.code+' '+PAS_TPL.issue],['Date',psLabel(date)],['Plant','Descon Oxychem · QC Laboratory'],[]];
    PAS_TPL.sections.forEach(sec=>{
      A.push([sec.t.toUpperCase()]);
      PAS_TPL.grids.filter(g=>g.sec===sec.id).forEach(g=>{
        const v=grids[g.id]||{};
        A.push([g.t]); A.push(['Parameter','Unit','Range',...g.cols]);
        g.rows.forEach((r,ri)=>A.push([r[0],r[1],r[2],...g.cols.map((_,cx)=>{ const x=v[ri+'-'+cx]; const n=psNum(x); return x==null?'':(n!=null&&String(n)===x?n:x); })]));
        A.push([]);
      });
      PAS_TPL.logs.filter(l=>l.sec===sec.id).forEach(l=>{ A.push([l.t]); A.push(l.fields.map(f=>f[1])); (logs[l.id]||[]).forEach(r=>A.push(l.fields.map(f=>r[f[0]]||''))); A.push([]); });
    });
    A.push(['Shift sign-off',...PAS_TPL.shifts.map(s=>{ const x=rec&&rec.signoff&&rec.signoff[s.k]; return s.l+': '+(x?(x.paper?'signed on paper':titleCase(x.by)+' '+x.at):'not signed'); })]);
    A.push(['To: '+PAS_TPL.to+'   CC: '+PAS_TPL.cc.join(', ')]);
    const ws=XLSX.utils.aoa_to_sheet(A); ws['!cols']=[{wch:30},{wch:10},{wch:18},...Array(13).fill({wch:9})];
    const oos=psOOS(grids);
    const ws2=XLSX.utils.aoa_to_sheet([['Sampling point','Parameter','Time','Value','Unit','Range'],...oos.map(o=>[o.g.t,o.r[0],o.col,o.v,o.r[1],o.r[2]])]);
    ws2['!cols']=[{wch:40},{wch:20},{wch:10},{wch:10},{wch:8},{wch:18}];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Plant Analysis'); XLSX.utils.book_append_sheet(wb,ws2,'Outside range');
    XLSX.writeFile(wb,`Plant_Analysis_Sheet_${date}.xlsx`);
    audit('Exported plant sheet','Plant Sheet',`${psLabel(date)} (Excel)`); toast('Excel file saved','ok');
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
