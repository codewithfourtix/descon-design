/* ============ Right-docked file explorer (Codex-style) ============ */
const FILES = {
  expanded: new Set(['SOPs','Certificates of Analysis']),
  selected: null,
  query: '',
  tree: [
    {name:'SOPs', kind:'folder', children:[
      {name:'LAB-SOP-IMS-001 Sampling Procedure.pdf', kind:'file', ext:'pdf', size:'182 KB', modified:'18 May 2026'},
      {name:'LAB-SOP-IMS-004 Titration.pdf', kind:'file', ext:'pdf', size:'96 KB', modified:'12 May 2026'},
      {name:'LAB-SOP-IMS-009 Result Review.pdf', kind:'file', ext:'pdf', size:'74 KB', modified:'02 May 2026'},
      {name:'LAB-SOP-HSE-002 Chemical Handling.pdf', kind:'file', ext:'pdf', size:'210 KB', modified:'28 Apr 2026'},
    ]},
    {name:'Test Methods', kind:'folder', children:[
      {name:'MTH-H2O2-Concentration.docx', kind:'file', ext:'doc', size:'44 KB', modified:'15 May 2026',
        preview:`Method: Determination of Hydrogen Peroxide Concentration\nRef:    MTH-H2O2-Concentration  Rev 3\n\n1. Principle\n   Titration of H2O2 with standardised KMnO4 in acidic medium.\n\n2. Reagents\n   - Potassium permanganate 0.1 N\n   - Sulphuric acid 20% v/v\n\n3. Calculation\n   Conc (% w/w) = (V x N x 1.701) / sample weight\n\n4. Acceptance\n   HP-01 Final ....... 49.0 - 50.5 % w/w`},
      {name:'MTH-Urea-Biuret.docx', kind:'file', ext:'doc', size:'38 KB', modified:'11 May 2026'},
      {name:'MTH-Kjeldahl-Nitrogen.docx', kind:'file', ext:'doc', size:'52 KB', modified:'09 May 2026'},
    ]},
    {name:'Certificates of Analysis', kind:'folder', children:[
      {name:'CoA-HP2451-Aseptox.pdf', kind:'file', ext:'pdf', size:'88 KB', modified:'18 May 2026',
        preview:`DESCON OXYCHEM  —  CERTIFICATE OF ANALYSIS\n────────────────────────────────────────\nProduct    : Aseptox (Food Grade H2O2)\nBatch No.  : HP-2451\nMfg Date   : 18 May 2026     Site: Sheikhupura\n\nParameter          Spec           Result   Status\n Concentration     34.5-35.5%     35.1%    PASS\n Active Oxygen     16.2% min      16.5%    PASS\n Stability         99% min        99.4%    PASS\n Total Nitrate     2 ppm max      0.8 ppm  PASS\n\nDisposition : RELEASED     Authorised: QC Manager`},
      {name:'CoA-UR8890-Urea.pdf', kind:'file', ext:'pdf', size:'81 KB', modified:'17 May 2026'},
      {name:'CoA-NA3120-NitricAcid.pdf', kind:'file', ext:'pdf', size:'79 KB', modified:'16 May 2026'},
      {name:'CoA-CAN5540.pdf', kind:'file', ext:'pdf', size:'77 KB', modified:'14 May 2026'},
    ]},
    {name:'Chromatograms & Raw Data', kind:'folder', children:[
      {name:'GC-20260518-01.raw', kind:'file', ext:'raw', size:'1.2 MB', modified:'18 May 2026'},
      {name:'GC-20260518-02.raw', kind:'file', ext:'raw', size:'1.1 MB', modified:'18 May 2026'},
      {name:'results-export-may.csv', kind:'file', ext:'csv', size:'34 KB', modified:'18 May 2026',
        preview:`sample_id,parameter,result,unit,spec,status\nUR-2601,Concentration,49.8,%,49.0-50.5,PASS\nUR-2602,Active Oxygen,23.4,%,23.1 min,PASS\nUR-2603,Stability,99.1,%,98 min,PASS\nUR-2604,Free Acid,240,ppm,300 max,PASS\nUR-2605,TOC,180,ppm,200 max,PASS\nUR-2606,Conductivity,72,uS/cm,80 max,PASS`},
    ]},
    {name:'Calibration Certificates', kind:'folder', children:[
      {name:'EQP-301 pH Meter — Cal Cert.pdf', kind:'file', ext:'pdf', size:'120 KB', modified:'10 Apr 2026'},
      {name:'EQP-303 UV Spectrophotometer.pdf', kind:'file', ext:'pdf', size:'134 KB', modified:'05 Apr 2026'},
      {name:'EQP-310 Analytical Balance.pdf', kind:'file', ext:'pdf', size:'98 KB', modified:'02 Apr 2026'},
    ]},
    {name:'Safety Data Sheets', kind:'folder', children:[
      {name:'SDS-Hydrogen-Peroxide.pdf', kind:'file', ext:'pdf', size:'156 KB', modified:'22 Feb 2026'},
      {name:'SDS-Acetic-Acid.pdf', kind:'file', ext:'pdf', size:'142 KB', modified:'20 Feb 2026'},
      {name:'SDS-Nitric-Acid.pdf', kind:'file', ext:'pdf', size:'149 KB', modified:'18 Feb 2026'},
    ]},
    {name:'Reports', kind:'folder', children:[
      {name:'Monthly-QC-Summary-May2026.xlsx', kind:'file', ext:'xls', size:'220 KB', modified:'19 May 2026'},
      {name:'OOS-Trend-Q2.xlsx', kind:'file', ext:'xls', size:'88 KB', modified:'15 May 2026'},
      {name:'ISO17025-Audit-Report.pdf', kind:'file', ext:'pdf', size:'310 KB', modified:'12 May 2026'},
    ]},
  ],
};

function fileIcon(ext){
  const m={
    pdf:['file-text','#e11f26'], doc:['file-text','#2f7de0'], docx:['file-text','#2f7de0'],
    xls:['file-spreadsheet','#0a8f6d'], xlsx:['file-spreadsheet','#0a8f6d'], csv:['file-spreadsheet','#0a8f6d'],
    raw:['activity','#e0930b'], dat:['activity','#e0930b'],
    png:['image','#7c6bf5'], jpg:['image','#7c6bf5'], txt:['file','#98a2b3'],
  };
  return m[ext]||['file','#98a2b3'];
}
function countFiles(node){
  if(node.kind==='file') return 1;
  return (node.children||[]).reduce((s,c)=>s+countFiles(c),0);
}

function fpMatches(node,q){
  if(node.kind==='file') return node.name.toLowerCase().includes(q);
  return (node.children||[]).some(c=>fpMatches(c,q));
}
function renderNode(node, depth, path){
  const q=FILES.query;
  if(q && !fpMatches(node,q)) return '';
  const key=path+'/'+node.name;
  const guides=Array.from({length:depth}).map(()=>`<span class="fp-guide"></span>`).join('');
  if(node.kind==='folder'){
    const open = FILES.expanded.has(node.name) || !!q;
    const kids = open ? (node.children||[]).map(c=>renderNode(c,depth+1,key)).join('') : '';
    return `<div class="fp-node ${open?'open':''}" onclick="fpToggle('${node.name.replace(/'/g,"\\'")}')">
        ${guides}<i data-lucide="chevron-right" class="fp-chev"></i>
        <i data-lucide="${open?'folder-open':'folder'}" class="fp-fi" style="color:var(--brand)"></i>
        <span class="fp-name">${node.name}</span>
        <span class="fp-meta">${countFiles(node)}</span>
      </div>${kids}`;
  }
  const [ic,col]=fileIcon(node.ext);
  const sel = FILES.selected===key ? 'sel':'';
  return `<div class="fp-node ${sel}" onclick="fpOpen('${key.replace(/'/g,"\\'")}')">
      ${guides}<span class="fp-spacer" style="width:14px"></span>
      <i data-lucide="${ic}" class="fp-fi" style="color:${col}"></i>
      <span class="fp-name">${node.name}</span>
      <span class="fp-meta">${node.size||''}</span>
    </div>`;
}

function renderFiles(){
  const el=document.getElementById('filepanel'); if(!el) return;
  const total=FILES.tree.reduce((s,n)=>s+countFiles(n),0);
  const body=FILES.tree.map(n=>renderNode(n,0,'')).join('') || `<div class="fp-empty">No files match “${FILES.query}”.</div>`;
  el.innerHTML=`
    <div class="fp-head">
      <div class="fp-title"><i data-lucide="folder-tree"></i>File Explorer</div>
      <div class="fp-icon" onclick="fpNewFolder()" title="New folder"><i data-lucide="folder-plus" style="width:15px"></i></div>
      <div class="fp-icon" onclick="fpUpload()" title="Upload file"><i data-lucide="upload" style="width:15px"></i></div>
      <div class="fp-icon" onclick="toggleFiles()" title="Close"><i data-lucide="x" style="width:16px"></i></div>
    </div>
    <div class="fp-search"><i data-lucide="search" style="width:13px"></i><input placeholder="Search files…" value="${FILES.query}" oninput="fpSearch(this.value)"></div>
    <div class="fp-crumb">Descon Assure · Document Repository</div>
    <div class="fp-tree" id="fp-tree">${body}</div>
    <div class="fp-foot"><span>${total} files · ${FILES.tree.length} folders</span><span>ISO 17025 · 8.3</span></div>`;
  if(window.lucide) lucide.createIcons();
  const inp=el.querySelector('.fp-search input'); if(inp&&FILES.query){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}
}
function fpToggle(name){ if(FILES.expanded.has(name))FILES.expanded.delete(name); else FILES.expanded.add(name); renderFiles(); }
function fpSearch(v){ FILES.query=v.toLowerCase(); renderFiles(); }
function findByPath(key){
  const parts=key.split('/').filter(Boolean);
  let level=FILES.tree, node=null;
  for(const p of parts){ node=(level||[]).find(n=>n.name===p); if(!node) return null; level=node.children; }
  return node;
}
function fpOpen(key){
  FILES.selected=key; renderFiles();
  const node=findByPath(key); if(!node) return;
  const [ic,col]=fileIcon(node.ext);
  const preview = node.preview
    ? `<div class="fv-code">${node.preview.replace(/</g,'&lt;')}</div>`
    : `<div class="fv-blank"><div style="text-align:center"><i data-lucide="${ic}" style="width:44px;color:${col}"></i><div style="margin-top:8px;font-size:12px">Binary ${node.ext.toUpperCase()} — preview not available in demo</div></div></div>`;
  openModal({title:node.name, wide:true, body:`
    <div class="fv-meta">
      <b>Type</b><span>${node.ext.toUpperCase()} document</span>
      <b>Size</b><span>${node.size||'—'}</span>
      <b>Modified</b><span>${node.modified||'—'}</span>
      <b>Location</b><span>${key.split('/').filter(Boolean).slice(0,-1).join(' / ')||'root'}</span>
    </div>${preview}`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Download',cls:'btn-green',icon:'download',fn:`closeModal();toast('Downloading ${node.name.replace(/'/g,"")}…','info')`}]});
}
function fpUpload(){
  simpleAdd('Upload File',[
    {key:'name',label:'File name',ph:'e.g. CoA-HP2460.pdf'},
    {key:'folder',label:'Folder',opts:FILES.tree.map(f=>f.name)},
  ], v=>{
    const folder=FILES.tree.find(f=>f.name===v.folder)||FILES.tree[0];
    const ext=(v.name||'file.pdf').split('.').pop().toLowerCase();
    folder.children.unshift({name:v.name||'new-file.pdf',kind:'file',ext,size:(Math.random()*200+20).toFixed(0)+' KB',modified:'01 Jul 2026'});
    FILES.expanded.add(folder.name);
    renderFiles(); toast('File uploaded to '+folder.name,'ok');
  });
}
function fpNewFolder(){
  simpleAdd('New Folder',[{key:'name',label:'Folder name'}], v=>{
    FILES.tree.push({name:v.name||'New Folder',kind:'folder',children:[]});
    renderFiles(); toast('Folder created','ok');
  });
}
function toggleFiles(){
  document.body.classList.toggle('files-open');
  if(document.body.classList.contains('files-open')) renderFiles();
}
function initFilesResize(){
  const rz=document.getElementById('filepanel-resizer'); if(!rz) return;
  let drag=false; const MIN=250,MAX=520;
  const move=e=>{ if(!drag)return; let w=Math.max(MIN,Math.min(MAX,window.innerWidth-e.clientX));
    document.documentElement.style.setProperty('--filepanel-w',w+'px'); };
  const up=()=>{ if(!drag)return; drag=false; document.body.classList.remove('fp-resizing');
    document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); };
  rz.addEventListener('mousedown',e=>{ drag=true; document.body.classList.add('fp-resizing');
    document.addEventListener('mousemove',move); document.addEventListener('mouseup',up); e.preventDefault(); });
  rz.addEventListener('dblclick',()=>document.documentElement.style.removeProperty('--filepanel-w'));
}
document.addEventListener('DOMContentLoaded',()=>{
  initFilesResize();
  document.addEventListener('keydown',e=>{
    if(e.key==='f' && !/input|textarea|select/i.test((e.target.tagName||''))) toggleFiles();
  });
});
