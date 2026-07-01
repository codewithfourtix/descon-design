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
  const cards = list.length? list.map(({c,i})=>docCard(c,i)).join('')
    : `<div class="empty" style="width:100%">No documents match your filter.</div>`;
  return `
  <div class="pageicon" style="font-size:24px">Documents & SOPs</div>
  <div class="card" style="margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;flex-wrap:wrap">
      <div class="mini-search" style="flex:1;min-width:220px"><i data-lucide="search" style="width:14px"></i><input placeholder="Search documents..." value="${DOC_Q}" oninput="docSearch(this.value)" style="width:100%"></div>
      <select onchange="docFilter(this.value)" class="rp-select" style="padding:7px 10px">${cats.map(c=>`<option ${c===DOC_CAT?'selected':''}>${c}</option>`).join('')}</select>
      <button class="btn btn-blue" onclick="docUpload()"><i data-lucide="upload"></i>Upload Document</button>
    </div>
  </div>
  ${kpiRow(d.kpis,3)}
  <div style="height:12px"></div>
  <div style="display:flex;flex-wrap:wrap;gap:12px">${cards}</div>`;
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
