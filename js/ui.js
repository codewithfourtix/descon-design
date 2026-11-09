/* ============ Reusable UI kit: tables, modals, toasts, export ============ */

/* ---- seeded PRNG for stable rich mock data ---- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const RNG = mulberry32(20260518);
function pick(arr,rng){return arr[Math.floor((rng||RNG)()*arr.length)];}
function randInt(a,b,rng){return a+Math.floor((rng||RNG)()*(b-a+1));}

/* ---- toast ---- */
function toast(msg, type='ok'){
  let host = document.getElementById('toast-host');
  if(!host){host=document.createElement('div');host.id='toast-host';document.body.appendChild(host);}
  const t = document.createElement('div');
  const ic = {ok:'check-circle',info:'info',warn:'triangle-alert',err:'x-circle'}[type]||'info';
  t.className = 'toast t-'+type;
  t.innerHTML = `<i data-lucide="${ic}"></i><span>${msg}</span>`;
  host.appendChild(t);
  if(window.lucide) lucide.createIcons();
  setTimeout(()=>{t.classList.add('show');},10);
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300);},2600);
}

/* ---- modal ---- */
function openModal({title, body, actions, wide}){
  let host = document.getElementById('modal-host');
  if(!host){host=document.createElement('div');host.id='modal-host';document.body.appendChild(host);}
  const acts = (actions||[{label:'Close',cls:'btn-out',fn:'closeModal()'}])
    .map(a=>`<button class="btn ${a.cls||'btn-out'}" onclick="${a.fn}">${a.icon?`<i data-lucide="${a.icon}"></i>`:''}${a.label}</button>`).join('');
  host.innerHTML = `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="modal ${wide?'modal-wide':''}">
      <div class="modal-head"><div class="modal-title">${title}</div><i data-lucide="x" class="modal-x" onclick="closeModal()"></i></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">${acts}</div>
    </div></div>`;
  host.classList.add('open');
  if(window.lucide) lucide.createIcons();
}
function closeModal(){const h=document.getElementById('modal-host');if(h){h.classList.remove('open');h.innerHTML='';}}
function confirmModal(title, msg, onYes, yesLabel='Confirm', danger){
  window.__confirmYes = onYes;
  openModal({title, body:`<p style="color:#4b5563;line-height:1.6">${msg}</p>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},
             {label:yesLabel,cls:danger?'btn-red':'btn-green',fn:'(window.__confirmYes&&window.__confirmYes());closeModal()'}]});
}

/* ---- CSV export ---- */
function exportCSV(filename, headers, rows){
  const esc = v => '"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const csv = [headers.map(esc).join(',')].concat(rows.map(r=>r.map(esc).join(','))).join('\r\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  toast('Exported '+filename,'ok');
}

/* ============ Generic interactive table engine ============
   register with makeTable(id,{columns,data,search,pageSize,title,toolbar})
   columns: [{key,label,align,sortable,render,width}]
   data: array of row-objects
*/
const TBL = {};
const TBL_PREFS = {}; /* hidden columns / density / filters survive re-renders */
function makeTable(id, cfg){
  const keep=TBL_PREFS[id]||{};
  const prev=TBL[id];
  TBL[id] = {cfg, q:prev?prev.q:'', sortKey:prev?prev.sortKey:null, sortDir:prev?prev.sortDir:1, page:prev?prev.page:1,
    pageSize:prev?prev.pageSize:(cfg.pageSize||10), sel:new Set(), hidden:keep.hidden||new Set(), filters:keep.filters||{}, dense:!!keep.dense};
  return `<div id="tblbox-${id}">${tableHTML(id)}</div>`;
}
function _rows(id){
  const t=TBL[id], c=t.cfg; let rows=c.data.slice();
  if(t.q && c.search){
    const q=t.q.toLowerCase();
    rows=rows.filter(r=>c.search.some(k=>String(r[k]??'').toLowerCase().includes(q)));
  }
  Object.entries(t.filters||{}).forEach(([k,v])=>{ rows=rows.filter(r=>String(r[k]??'')===v); });
  if(c.filterFn) rows=rows.filter(c.filterFn);
  if(t.sortKey){
    rows.sort((a,b)=>{
      let x=a[t.sortKey],y=b[t.sortKey];
      const nx=parseFloat(x),ny=parseFloat(y);
      if(!isNaN(nx)&&!isNaN(ny)&&String(x).match(/^-?[\d.,%]+$/)){x=nx;y=ny;}
      if(x<y)return -1*t.sortDir; if(x>y)return 1*t.sortDir; return 0;
    });
  }
  return rows;
}
function tableHTML(id){
  const t=TBL[id], c=t.cfg;
  const all=_rows(id);
  const pages=Math.max(1,Math.ceil(all.length/t.pageSize));
  if(t.page>pages)t.page=pages;
  const start=(t.page-1)*t.pageSize;
  const rows=all.slice(start,start+t.pageSize);
  t.view=rows;
  const cols=c.columns.filter(col=>!t.hidden.has(col.key));
  const head=cols.map(col=>{
    const arrow = t.sortKey===col.key ? (t.sortDir>0?'chevron-up':'chevron-down') : (col.sortable!==false?'chevrons-up-down':null);
    const click = col.sortable!==false?`onclick="tblSort('${id}','${col.key}')"`:'';
    return `<th style="text-align:${col.align||'left'}${col.width?';width:'+col.width:''}" ${click} class="${col.sortable!==false?'sortable':''}">${col.label} ${arrow?`<i data-lucide="${arrow}" style="width:11px"></i>`:''}</th>`;
  }).join('');
  const opens = c.onRow || c.onOpen || c.rowOpen!==false;
  const body = rows.length ? rows.map((r,i)=>`<tr onclick="${c.onRow?c.onRow(r):`tblOpen(event,'${id}',${i})`}" class="${opens?'clickable':''}" style="${c.rowStyle?c.rowStyle(r):''}">${
      cols.map(col=>{
        const v = col.render? col.render(r[col.key], r, start+i) : (r[col.key]??'');
        return `<td style="text-align:${col.align||'left'}${col.tdStyle?';'+col.tdStyle(r):''}">${v}</td>`;
      }).join('')
    }</tr>`).join('')
    : `<tr><td colspan="${cols.length}" class="empty">${t.q||Object.keys(t.filters).length?'No records match your search or filters':'No records yet'}</td></tr>`;

  const chips = Object.entries(t.filters).map(([k,v])=>{
    const col=c.columns.find(x=>x.key===k);
    return `<span class="fchip">${col?col.label:k}: <b>${v}</b><i data-lucide="x" onclick="tblUnfilter('${id}','${k}')"></i></span>`;
  }).join('');
  const toolbar = c.title!==false ? `<div class="tbl-toolbar">
    <span class="tbtn ${t.dense?'on':''}" title="${t.dense?'Comfortable rows':'Compact rows'}" onclick="tblDense('${id}')"><i data-lucide="${t.dense?'rows-3':'list'}"></i></span>
    <span class="tbtn ${t.hidden.size?'on':''}" title="Show / hide columns" onclick="tblColumns('${id}')"><i data-lucide="columns-3"></i></span>
    <span class="tbtn ${Object.keys(t.filters).length?'on':''}" title="Filter" onclick="tblFilter('${id}')"><i data-lucide="filter"></i></span>
    <div class="mini-search"><i data-lucide="search" style="width:13px"></i><input placeholder="Search..." value="${t.q}" oninput="tblSearch('${id}',this.value)"></div>
    ${chips}
    <div class="tt-title">${c.title||''}</div>
    ${c.toolbar||''}
  </div>`:'';

  const pager = `<div class="rows-per">Rows per page
    <select onchange="tblPageSize('${id}',this.value)" class="rp-select">${[10,15,25,50].map(n=>`<option ${n==t.pageSize?'selected':''}>${n}</option>`).join('')}</select>
    <span style="color:#9aa3af;margin:0 6px">${all.length?start+1:0}–${Math.min(start+t.pageSize,all.length)} of ${all.length}</span>
    <i data-lucide="chevron-left" style="width:15px;cursor:pointer" onclick="tblPage('${id}',-1)"></i>
    ${pagesNav(id,pages)}
    <i data-lucide="chevron-right" style="width:15px;cursor:pointer" onclick="tblPage('${id}',1)"></i></div>`;

  return `${toolbar}<div class="tbl-wrap"><table class="tbl ${t.dense?'dense':''}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>${pager}`;
}
function _tp(id){ const t=TBL[id]; TBL_PREFS[id]={hidden:t.hidden,filters:t.filters,dense:t.dense}; }
function tblDense(id){ const t=TBL[id]; t.dense=!t.dense; _tp(id); rerenderTable(id); }
function tblColumns(id){
  const t=TBL[id], cols=t.cfg.columns.filter(c=>c.key!=='x');
  openModal({title:'Show / hide columns', body:`<div class="colpick">${cols.map(c=>`<label class="cp-row"><input type="checkbox" ${t.hidden.has(c.key)?'':'checked'} onchange="tblToggleCol('${id}','${c.key}',this.checked)"><span>${c.label}</span></label>`).join('')}</div>`,
    actions:[{label:'Show all',cls:'btn-out',fn:`TBL['${id}'].hidden.clear();_tp('${id}');rerenderTable('${id}');closeModal()`},{label:'Done',cls:'btn-green',icon:'check',fn:'closeModal()'}]});
}
function tblToggleCol(id,key,on){ const t=TBL[id]; if(on) t.hidden.delete(key); else t.hidden.add(key); _tp(id); rerenderTable(id); }
function tblFilter(id){
  const t=TBL[id], c=t.cfg;
  const cols=c.columns.filter(col=>col.key!=='x').map(col=>{
    const vals=[...new Set(c.data.map(r=>String(r[col.key]??'')).filter(v=>v!==''))];
    return {col,vals};
  }).filter(x=>x.vals.length>1&&x.vals.length<=25);
  if(!cols.length){ toast('Use the search box to filter this table','info'); return; }
  window.__fcols=cols;
  openModal({title:'Filter '+(c.title||'records'), body:`
    <div class="form-row"><label>Column</label><select id="flt-col" onchange="tblFilterVals()">${cols.map((x,i)=>`<option value="${i}">${x.col.label}</option>`).join('')}</select></div>
    <div class="form-row"><label>Value</label><select id="flt-val"></select></div>`,
    actions:[{label:'Clear filters',cls:'btn-out',fn:`TBL['${id}'].filters={};_tp('${id}');rerenderTable('${id}');closeModal()`},{label:'Apply',cls:'btn-green',icon:'filter',fn:`tblApplyFilter('${id}')`}]});
  tblFilterVals();
}
function tblFilterVals(){ const i=+document.getElementById('flt-col').value; const x=window.__fcols[i];
  document.getElementById('flt-val').innerHTML=x.vals.sort().map(v=>`<option>${v.replace(/</g,'&lt;')}</option>`).join(''); }
function tblApplyFilter(id){ const x=window.__fcols[+document.getElementById('flt-col').value]; const v=document.getElementById('flt-val').value;
  TBL[id].filters[x.col.key]=v; TBL[id].page=1; _tp(id); rerenderTable(id); closeModal(); }
function tblUnfilter(id,k){ delete TBL[id].filters[k]; _tp(id); rerenderTable(id); }
/* row click: custom handler, or a detail panel listing every field */
function tblOpen(ev,id,i){
  if(ev && ev.target.closest('svg,i,button,a,input,select,label')) return;
  const t=TBL[id]; const r=t&&t.view&&t.view[i]; if(!r) return;
  if(t.cfg.onOpen){ t.cfg.onOpen(r); return; }
  if(t.cfg.rowOpen===false) return;
  const pairs=t.cfg.columns.filter(c=>c.key!=='x').map(c=>[c.label.charAt(0)+c.label.slice(1).toLowerCase(), r[c.key]==null?'':String(r[c.key])]);
  openRecord((t.cfg.title||'Record')+(r.id?' · '+r.id:''), pairs);
}
function pagesNav(id,pages){
  const t=TBL[id]; if(pages<=1)return '';
  let out='';const around=[];
  for(let p=1;p<=pages;p++){if(p===1||p===pages||Math.abs(p-t.page)<=1)around.push(p);}
  let last=0;
  around.forEach(p=>{
    if(p-last>1)out+=`<span style="color:#c2c8d0">…</span>`;
    out+=`<span class="pg ${p===t.page?'pg-on':''}" onclick="tblGo('${id}',${p})">${p}</span>`;
    last=p;
  });
  return out;
}
function rerenderTable(id){
  const box=document.getElementById('tblbox-'+id);
  if(box){box.innerHTML=tableHTML(id); if(window.lucide)lucide.createIcons();}
}
function tblSearch(id,v){TBL[id].q=v;TBL[id].page=1;const box=document.getElementById('tblbox-'+id);const sel=box.querySelector('.mini-search input');const pos=sel?sel.selectionStart:null;rerenderTable(id);const ni=document.getElementById('tblbox-'+id).querySelector('.mini-search input');if(ni){ni.focus();if(pos!=null)ni.setSelectionRange(pos,pos);}}
function tblSort(id,key){const t=TBL[id];if(t.sortKey===key)t.sortDir*=-1;else{t.sortKey=key;t.sortDir=1;}rerenderTable(id);}
function tblPage(id,d){const t=TBL[id];const pages=Math.max(1,Math.ceil(_rows(id).length/t.pageSize));t.page=Math.min(pages,Math.max(1,t.page+d));rerenderTable(id);}
function tblGo(id,p){TBL[id].page=p;rerenderTable(id);}
function tblPageSize(id,n){TBL[id].pageSize=parseInt(n);TBL[id].page=1;rerenderTable(id);}
function tblData(id){return _rows(id);}

/* ============ Workspace Structural Helpers ============ */

function renderStatusCluster(items) {
  return `<div class="status-cluster">
    ${items.map(item => `<div class="status-item">
      <div class="si-val" style="color:${item.color||'var(--ink)'}">${item.val}</div>
      <div class="si-lbl">${item.label}</div>
    </div>`).join('')}
  </div>`;
}

function renderActionQueue(items, actionClick = '') {
  if(!items.length) return `<div class="queue-empty"><i data-lucide="circle-check"></i>Nothing waiting here</div>`;
  return `<div class="action-queue">
    ${items.map(item => `<div class="queue-item ${item.priority||''}" onclick="${item.fn||actionClick}">
      <div class="qi-content">
        <div class="qi-title">${item.title}</div>
        <div class="qi-meta">${item.meta}</div>
      </div>
      <i data-lucide="chevron-right" style="color:var(--muted2);width:16px"></i>
    </div>`).join('')}
  </div>`;
}

function renderPipelineBoard(lanes) {
  return `<div class="pipeline-board">
    ${lanes.map(lane => `<div class="pipeline-lane">
      <div class="lane-head"><span>${lane.title}</span><span class="lane-count">${lane.items.length}</span></div>
      ${lane.items.length?lane.items.map(item => `<div class="card card-pad lane-card" onclick="${item.fn||''}">
        <div style="font-weight:600;margin-bottom:4px;color:var(--ink)">${item.title}</div>
        <div style="color:var(--muted2)">${item.meta}</div>
        ${item.tag?`<div style="margin-top:6px">${item.tag}</div>`:''}
      </div>`).join(''):`<div class="lane-empty">Empty</div>`}
    </div>`).join('')}
  </div>`;
}

function openDrawer(title, body) {
  const d = document.getElementById('assistant-drawer');
  if(!d) return;
  d.innerHTML = `
    <div class="fp-head drawer-head" style="justify-content:space-between">
      <div class="fp-title">${title}</div>
      <div class="fp-icon" onclick="closeDrawer()"><i data-lucide="x"></i></div>
    </div>
    <div style="padding:16px;overflow-y:auto;flex:1">${body}</div>
  `;
  document.body.classList.add('assistant-open');
  if(window.lucide) lucide.createIcons();
}

function closeDrawer() {
  document.body.classList.remove('assistant-open');
}
