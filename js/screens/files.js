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
  const folder=key.split('/').filter(Boolean).slice(0,-1).join(' / ')||'root';
  const blob=FP_BLOBS[key];
  let preview;
  if(blob&&/^image\//.test(blob.type)) preview=`<img src="${blob.url}" style="max-width:100%;border-radius:8px">`;
  else if(blob&&blob.type==='application/pdf') preview=`<iframe src="${blob.url}" style="width:100%;height:480px;border:1px solid var(--line);border-radius:8px"></iframe>`;
  else if(node.preview||blob&&blob.text!=null) preview=`<div class="fv-code">${esc(node.preview||blob.text)}</div>`;
  else preview=`<div class="fv-blank"><div style="text-align:center"><i data-lucide="${ic}" style="width:44px;color:${col}"></i>
      <div style="margin-top:8px;font-size:12.5px;color:var(--ink);font-weight:600">${esc(node.name)}</div>
      <div style="margin-top:4px;font-size:11.5px">${node.ext==='raw'||node.ext==='dat'?'Instrument raw data file · open in the instrument software':'Stored in the SharePoint document library'} · ${node.size||''}</div></div></div>`;
  openModal({title:esc(node.name), wide:true, body:`
    <div class="fv-meta">
      <b>Type</b><span>${node.ext.toUpperCase()} file</span>
      <b>Size</b><span>${node.size||'—'}</span>
      <b>Modified</b><span>${node.modified||'—'}</span>
      <b>Location</b><span>${folder}</span>
    </div>${preview}`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Download',cls:'btn-green',icon:'download',fn:`fpDownload('${jsq(key)}')`}]});
  audit('Opened file','File Explorer',node.name);
}
const FP_BLOBS={};
async function fpDownload(key){
  const node=findByPath(key); if(!node) return;
  const blob=FP_BLOBS[key];
  const folder=key.split('/').filter(Boolean).slice(0,-1).join(' / ');
  if(blob){ const a=document.createElement('a'); a.href=blob.url; a.download=node.name; document.body.appendChild(a); a.click(); a.remove(); }
  else if(node.ext==='csv'||node.ext==='xls'||node.ext==='xlsx'){
    const csv=node.preview||`file,folder,modified\r\n"${node.name}","${folder}","${node.modified||''}"\r\n`;
    downloadFile(node.name.replace(/\.(xlsx?|csv)$/i,'')+'.csv',csv,'text/csv');
  } else if(node.ext==='pdf'){
    try{
      await loadScript(LIBS.jspdf); const {jsPDF}=window.jspdf; const pdf=new jsPDF({unit:'pt',format:'a4'});
      pdf.setFontSize(9); pdf.setTextColor(0,96,176); pdf.text('DESCON OXYCHEM LIMITED · QUALITY CONTROL',40,48);
      pdf.setFontSize(16); pdf.setTextColor(15,27,45); pdf.text(node.name.replace(/\.pdf$/i,''),40,78);
      pdf.setFontSize(9); pdf.setTextColor(105,117,134); pdf.text(`${folder} · ${node.size||''} · modified ${node.modified||''}`,40,96);
      pdf.setFont('courier','normal'); pdf.setFontSize(9.5); pdf.setTextColor(30,41,59);
      const body=node.preview||`Controlled copy from the Assure LIQS document repository.\n\nFolder: ${folder}\nFile: ${node.name}\nDownloaded by: ${myName()} on ${fmtStamp()}`;
      pdf.text(pdf.splitTextToSize(body,515),40,128);
      pdf.save(node.name.toLowerCase().endsWith('.pdf')?node.name:node.name+'.pdf');
    }catch(e){ toast('PDF download needs an internet connection','err'); return; }
  } else {
    downloadFile(node.name.replace(/\.[^.]+$/,'')+'.txt', node.preview||`${node.name}\n${folder}\nModified ${node.modified||''}\n\nDownloaded from Assure LIQS by ${myName()} on ${fmtStamp()}`);
  }
  audit('Downloaded file','File Explorer',node.name); toast('Downloaded '+node.name,'ok');
}
function fpUpload(){
  openModal({title:'Upload to repository', body:`
    <label class="drop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');fpPick(event.dataTransfer.files)">
      <input type="file" multiple style="display:none" onchange="fpPick(this.files)">
      <i data-lucide="upload-cloud"></i><b id="fp-fname">Drop files here or click to browse</b><span>Any file type</span>
    </label>
    <div class="form-row" style="margin-top:12px"><label>Folder</label><select id="fp-folder">${FILES.tree.map(f=>`<option>${esc(f.name)}</option>`).join('')}</select></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Upload',cls:'btn-green',icon:'upload',fn:'fpUploadGo()'}]});
  window.__fpFiles=[];
}
function fpPick(files){ window.__fpFiles=[...(files||[])]; const n=document.getElementById('fp-fname'); if(n) n.textContent=window.__fpFiles.length?window.__fpFiles.map(f=>f.name).join(', '):'Drop files here or click to browse'; }
function fpUploadGo(){
  const files=window.__fpFiles||[]; if(!files.length){ toast('Choose at least one file','err'); return; }
  const folder=FILES.tree.find(f=>f.name===document.getElementById('fp-folder').value)||FILES.tree[0];
  files.forEach(f=>{
    const ext=(f.name.split('.').pop()||'').toLowerCase();
    folder.children.unshift({name:f.name,kind:'file',ext,size:f.size>1048576?(f.size/1048576).toFixed(1)+' MB':Math.max(1,Math.round(f.size/1024))+' KB',modified:fmtDate()});
    const key='/'+folder.name+'/'+f.name; const entry={url:URL.createObjectURL(f),type:f.type}; FP_BLOBS[key]=entry;
    if(/^text\/|csv|json/.test(f.type)||/\.(txt|csv|md|json)$/i.test(f.name)) f.text().then(t=>entry.text=t.slice(0,8000));
  });
  FILES.expanded.add(folder.name);
  audit('Uploaded files','File Explorer',`${files.length} → ${folder.name}`);
  closeModal(); renderFiles(); persistSoon(); toast(`${files.length} file${files.length>1?'s':''} uploaded to ${folder.name}`,'ok');
}
function fpNewFolder(){
  simpleAdd('New Folder',[{key:'name',label:'Folder name'}], v=>{
    if(FILES.tree.some(f=>f.name===v.name)){ toast('A folder with that name exists','warn'); return; }
    FILES.tree.push({name:v.name||'New Folder',kind:'folder',children:[]});
    audit('Created folder','File Explorer',v.name); renderFiles(); persistSoon(); toast('Folder created','ok');
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
