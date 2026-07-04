/* ===== Documents & SOPs (interactive) ===== */
let DOC_Q='', DOC_CAT='All';
function docCard(c,idx){
  return `<div class="card card-pad" style="width:280px">
    <div style="display:flex;gap:10px">
      <div style="width:34px;height:40px;border-radius:5px;background:#fdecec;color:#e03131;display:grid;place-items:center"><i data-lucide="file-text"></i></div>
      <div style="flex:1">
        <div style="font-weight:600;color:#334">${c.name}</div>
        <div style="font-size:10.5px;color:#9aa3af;margin-top:2px">${c.code} • ${c.size}</div>
        <div style="margin-top:6px"><span class="badge b-teal-o">${c.cat}</span></div>
        <div style="font-size:10px;color:#9aa3af;margin-top:6px">Updated ${c.updated}</div>
      </div>
      <i data-lucide="more-horizontal" style="width:16px;color:#9aa3af;cursor:pointer" onclick="docMenu(${idx})"></i>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-green" style="flex:1;justify-content:center" onclick="docDownload('${c.name}')"><i data-lucide="download"></i>Download</button>
      <button class="btn btn-out" style="flex:1;justify-content:center" onclick="docView(${idx})"><i data-lucide="eye"></i>View</button>
    </div>
  </div>`;
}
function docList(){
  return DATA.docs.cards
    .map((c,i)=>({c,i}))
    .filter(({c})=>(DOC_CAT==='All'||c.cat===DOC_CAT)&&(!DOC_Q||c.name.toLowerCase().includes(DOC_Q)||c.code.toLowerCase().includes(DOC_Q)));
}
function screenDocs(){
  const d = DATA.docs;
  const cats=['All',...new Set(d.cards.map(c=>c.cat))];
  const list=docList();
  
  const docRows = list.map(({c,i}) => `
    <div class="queue-item" onclick="toast('Viewing ${c.name}')">
      <div style="width:32px;height:40px;background:#fdecec;color:#e03131;display:grid;place-items:center;border-radius:6px"><i data-lucide="file-text"></i></div>
      <div class="qi-content">
        <div class="qi-title" style="color:var(--brand)">${c.name}</div>
        <div class="qi-meta">${c.code} · ${c.cat}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:var(--muted)">
        <div>${c.updated}</div>
        <div>${c.size}</div>
      </div>
    </div>
  `).join('') || `<div class="empty">No documents match your filter.</div>`;

  return `
  <div class="master-detail" style="height:calc(100vh - 120px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="font-size:18px;font-weight:700;color:var(--ink)">Controlled Document Vault</div>
        <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="docUpload()"><i data-lucide="upload"></i>Upload Document</button>
      </div>
      
      <div style="display:flex;gap:12px;align-items:center">
        <div class="mini-search" style="flex:1"><i data-lucide="search" style="width:14px"></i><input placeholder="Search documents..." value="${DOC_Q}" oninput="docSearch(this.value)"></div>
        <select onchange="docFilter(this.value)" class="rp-select" style="padding:7px 10px">${cats.map(c=>`<option ${c===DOC_CAT?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      
      <div class="action-queue">${docRows}</div>
    </div>
    
    <div class="detail-panel">
      <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px">
        Document Details
      </div>
      <div style="display:flex;justify-content:center;padding:24px 0;background:#f8fafb;border-radius:8px;border:1px solid var(--line)">
        <i data-lucide="file-text" style="width:48px;height:48px;color:#e03131"></i>
      </div>
      <div style="text-align:center">
        <div style="font-weight:700;color:var(--ink)">Standard Operating Procedure v2</div>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">SOP-2026-04 · Analytical Laboratory</div>
      </div>
      
      <div style="border:1px solid var(--line);border-radius:8px;padding:12px;background:#fbfcfd;margin-top:12px">
        <div class="kv" style="margin-bottom:8px"><span>Status</span><span class="badge b-green">Approved</span></div>
        <div class="kv" style="margin-bottom:8px"><span>Last Updated</span><span style="color:var(--ink)">May 12, 2026</span></div>
        <div class="kv"><span>Author</span><span style="color:var(--ink)">Ahmad R.</span></div>
      </div>
      
      <div style="margin-top:auto;display:flex;gap:8px">
        <button class="btn btn-out" style="flex:1;justify-content:center"><i data-lucide="eye"></i> View</button>
        <button class="btn btn-green" style="flex:1;justify-content:center"><i data-lucide="download"></i> Download</button>
      </div>
    </div>
  </div>`;
}
function docSearch(v){DOC_Q=v.toLowerCase();const wrap=document.querySelectorAll('.content > div:last-child')[0];render();const inp=document.querySelector('.mini-search input');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}}
function docFilter(v){DOC_CAT=v;render();}
function docDownload(name){toast('Downloading "'+name+'"…','info');setTimeout(()=>toast('"'+name+'" downloaded','ok'),700);}
function docView(idx){
  const c=DATA.docs.cards[idx];
  openModal({title:c.name, wide:true, body:`
    <div class="kv"><span>Document Code</span><span>${c.code}</span></div>
    <div class="kv"><span>Category</span><span>${c.cat}</span></div>
    <div class="kv"><span>Size</span><span>${c.size}</span></div>
    <div class="kv"><span>Last Updated</span><span>${c.updated}</span></div>
    <div style="margin-top:12px;border:1px solid var(--line);border-radius:8px;height:200px;display:grid;place-items:center;color:#9aa3af;background:#fafbfc">
      <div style="text-align:center"><i data-lucide="file-text" style="width:40px"></i><div style="margin-top:8px;font-size:12px">Document preview (demo)</div></div>
    </div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Download',cls:'btn-green',icon:'download',fn:`closeModal();docDownload('${c.name.replace(/'/g,"")}')`}]});
}
function docMenu(idx){
  confirmModal('Delete document',`Delete <b>${DATA.docs.cards[idx].name}</b>?`,()=>{
    DATA.docs.cards.splice(idx,1);
    DATA.docs.kpis[0].v=String(DATA.docs.cards.length);
    render();toast('Document deleted','ok');
  },'Delete','danger');
}
function docUpload(){
  simpleAdd('Upload Document',[
    {key:'name',label:'Document Name'},
    {key:'cat',label:'Category',opts:['JD','SOP','Policy','Manual','Record']},
    {key:'code',label:'Document Code',ph:'e.g. LAB-SOP-IMS-010'},
  ], v=>{
    DATA.docs.cards.unshift({name:v.name||'New Document',code:v.code||'LAB-DOC-'+(DATA.docs.cards.length+1),size:(Math.random()*300+20).toFixed(2)+' KB',cat:v.cat,updated:'01/07/2026'});
    DATA.docs.kpis[0].v=String(DATA.docs.cards.length);
    toast('Document uploaded','ok');
  });
}
