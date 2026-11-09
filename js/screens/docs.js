/* ===== Documents & SOPs (controlled document vault) ===== */
let DOC_Q='', DOC_CAT='All', DOC_SEL=0;
const DOC_BLOBS={}; /* uploaded files kept for this session (by doc code) */
function docList(){
  return DATA.docs.cards.map((c,i)=>({c,i}))
    .filter(({c})=>(DOC_CAT==='All'||c.cat===DOC_CAT)&&(!DOC_Q||c.name.toLowerCase().includes(DOC_Q)||c.code.toLowerCase().includes(DOC_Q)));
}
function docStatus(s){ const m={'Approved':'b-green','In Review':'b-amber','Draft':'b-teal-o','Obsolete':'b-red'}; return `<span class="badge ${m[s]||'b-teal-o'}">${s||'Approved'}</span>`; }
function screenDocs(){
  const d=DATA.docs; const cats=['All',...new Set(d.cards.map(c=>c.cat))];
  const list=docList();
  if(!DATA.docs.cards[DOC_SEL]) DOC_SEL=0;
  const totalKB=d.cards.reduce((s,c)=>s+(parseFloat(c.size)||0)*(/MB/.test(c.size)?1024:1),0);
  const docRows=list.map(({c,i})=>`
    <div class="queue-item ${i===DOC_SEL?'sel':''}" onclick="docSelect(${i})">
      <div class="doc-ic ${c.file?'up':''}"><i data-lucide="${c.file?'file-check':'file-text'}"></i></div>
      <div class="qi-content">
        <div class="qi-title" style="color:var(--brand)">${esc(c.name)}</div>
        <div class="qi-meta">${c.code} · ${c.cat} · ${c.rev||'Rev 1'}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:var(--muted)">${docStatus(c.status)}<div style="margin-top:3px">${c.size}</div></div>
    </div>`).join('') || `<div class="empty">No documents match your filter.</div>`;
  return `
  <div class="master-detail" style="height:calc(100vh - 120px)">
    <div style="display:flex;flex-direction:column;gap:14px;overflow-y:auto;padding-right:4px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><div class="ph-t">Controlled Document Vault</div><div class="ph-s">${d.cards.length} documents · ${(totalKB/1024).toFixed(2)} MB · synced with SharePoint</div></div>
        <button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="docUpload()"><i data-lucide="upload"></i>Upload Document</button>
      </div>
      <div style="display:flex;gap:12px;align-items:center">
        <div class="mini-search" style="flex:1"><i data-lucide="search" style="width:14px"></i><input placeholder="Search documents..." value="${esc(DOC_Q)}" oninput="docSearch(this.value)"></div>
        <select onchange="docFilter(this.value)" class="rp-select" style="padding:7px 10px">${cats.map(c=>`<option ${c===DOC_CAT?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div class="action-queue">${docRows}</div>
    </div>
    <div class="detail-panel" id="doc-panel">${docPanel()}</div>
  </div>`;
}
function docPanel(){
  const c=DATA.docs.cards[DOC_SEL]; if(!c) return '<div class="empty">Select a document.</div>';
  const can2=c.status!=='Approved';
  return `
    <div style="font-weight:700;color:var(--ink);font-size:14px;border-bottom:1px solid var(--line2);padding-bottom:12px;display:flex;justify-content:space-between;align-items:center">Document Details ${docStatus(c.status)}</div>
    <div class="doc-hero" onclick="docView(${DOC_SEL})"><i data-lucide="${c.file?'file-check':'file-text'}"></i><span>Open preview</span></div>
    <div style="text-align:center">
      <div style="font-weight:700;color:var(--ink)">${esc(c.name)}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">${c.code} · ${c.cat}</div>
    </div>
    <div class="ctx-box">
      <div class="kv"><span>Revision</span><span>${c.rev||'Rev 1'}</span></div>
      <div class="kv"><span>Owner</span><span>${c.owner||'QC Manager'}</span></div>
      <div class="kv"><span>Last updated</span><span>${c.updated}</span></div>
      <div class="kv" style="border:none"><span>Size</span><span>${c.size}</span></div>
    </div>
    ${c.history&&c.history.length?`<div><div class="ctx-k" style="margin-bottom:6px">History</div>${c.history.slice(0,4).map(h=>`<div class="hist"><b>${h.what}</b><span>${h.by} · ${h.at}</span></div>`).join('')}</div>`:''}
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">
      ${c.status==='Draft'?`<button class="btn btn-out" style="justify-content:center" onclick="docStep(${DOC_SEL},'In Review')"><i data-lucide="send"></i>Send for review</button>`:''}
      ${c.status==='In Review'?`<button class="btn btn-green" style="justify-content:center" onclick="docStep(${DOC_SEL},'Approved')"><i data-lucide="badge-check"></i>Approve &amp; publish</button>`:''}
      ${c.status==='Approved'?`<button class="btn btn-out" style="justify-content:center" onclick="docRevise(${DOC_SEL})"><i data-lucide="git-branch"></i>Start new revision</button>`:''}
      <div style="display:flex;gap:8px">
        <button class="btn btn-out" style="flex:1;justify-content:center" onclick="docView(${DOC_SEL})"><i data-lucide="eye"></i>View</button>
        <button class="btn btn-green" style="flex:1;justify-content:center" onclick="docDownload(${DOC_SEL})"><i data-lucide="download"></i>Download</button>
        <button class="btn btn-out" style="justify-content:center" title="Delete" onclick="docMenu(${DOC_SEL})"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`;
}
function docSelect(i){ DOC_SEL=i; if(state.route!=='docs'){ go('docs'); return; }
  document.querySelectorAll('#content .action-queue .queue-item').forEach(el=>el.classList.remove('sel'));
  const p=document.getElementById('doc-panel'); if(p){ p.innerHTML=docPanel(); if(window.lucide)lucide.createIcons(); }
  render(); }
function docSearch(v){DOC_Q=v.toLowerCase();render();const inp=document.querySelector('#content .mini-search input');if(inp){inp.focus();inp.setSelectionRange(inp.value.length,inp.value.length);}}
function docFilter(v){DOC_CAT=v;render();}
function docHist(c,what){ c.history=c.history||[]; c.history.unshift({what,by:titleCase(myName()),at:fmtStamp()}); }
function docBody(c){
  const n=c.name.toLowerCase();
  const purpose= /sampling/.test(n)?'define how routine and non-routine samples are drawn, labelled and transported to the QC laboratory without contamination'
    :/calibration/.test(n)?'define the calibration intervals, methods and acceptance criteria for laboratory instruments'
    :/policy/.test(n)?'state the laboratory commitment to impartiality, confidentiality and consistent operation under ISO/IEC 17025:2017'
    :/validation/.test(n)?'describe how analytical methods are verified or validated before use on routine samples'
    :/safety|sds/.test(n)?'list the safety data sheets held for every hazardous chemical in the laboratory'
    :/training/.test(n)?'record analyst training, authorisation and competence review'
    :/audit/.test(n)?'plan the internal audit cycle covering every clause of ISO/IEC 17025 each year'
    :'set out the controlled procedure for this activity in the QC laboratory';
  return [
    ['1. Purpose',`This document is to ${purpose}.`],
    ['2. Scope','Applies to the Descon Oxychem QC laboratory and every analyst, supervisor and manager working in it.'],
    ['3. Responsibilities','The QC Manager owns this document. Lab Supervisors make sure it is followed on every shift. Analysts follow it and record any deviation in Assure LIQS.'],
    ['4. Procedure','4.1 Check the current revision in Assure LIQS before starting.\n4.2 Perform the activity exactly as written; record results directly in the system.\n4.3 Report any deviation or out-of-specification result immediately; the system opens an OOS record.\n4.4 The supervisor reviews and approves the records before end of shift.'],
    ['5. Records','All records are held electronically in Assure LIQS with a full audit trail, retained for a minimum of 5 years.'],
    ['6. References','ISO/IEC 17025:2017 · Descon Oxychem Quality Manual · applicable test methods'],
  ];
}
function docView(idx){
  const c=DATA.docs.cards[idx]; if(!c) return;
  const blob=DOC_BLOBS[c.code];
  let preview;
  if(blob&&/^image\//.test(blob.type)) preview=`<img src="${blob.url}" style="max-width:100%;border-radius:8px">`;
  else if(blob&&blob.type==='application/pdf') preview=`<iframe src="${blob.url}" style="width:100%;height:520px;border:1px solid var(--line);border-radius:8px"></iframe>`;
  else if(blob&&blob.text!=null) preview=`<div class="fv-code">${esc(blob.text.slice(0,6000))}</div>`;
  else if(c.file&&!blob) preview=`<div class="note-line"><i data-lucide="cloud"></i>Stored in SharePoint: ${esc(c.file)}. Download to open the original.</div>`+docPaper(c);
  else preview=docPaper(c);
  openModal({title:esc(c.name), wide:true, body:`
    <div class="fv-meta"><b>Code</b><span>${c.code}</span><b>Revision</b><span>${c.rev||'Rev 1'}</span><b>Status</b><span>${c.status||'Approved'}</span><b>Owner</b><span>${c.owner||'QC Manager'}</span></div>${preview}`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Download',cls:'btn-green',icon:'download',fn:`docDownload(${idx})`}]});
  audit('Viewed document','Documents',c.code);
}
function docPaper(c){
  return `<div class="doc-paper">
    <div class="dp-head"><img src="assets/logo.jpg" alt=""><div><b>Descon Oxychem Limited · Quality Control</b><span>${c.code} · ${c.rev||'Rev 1'} · ${c.status||'Approved'}</span></div></div>
    <div class="dp-title">${esc(c.name)}</div>
    ${docBody(c).map(([h,t])=>`<div class="dp-sec"><b>${h}</b><p>${esc(t).replace(/\n/g,'<br>')}</p></div>`).join('')}
    <div class="dp-foot">Controlled copy when viewed in Assure LIQS · Printed copies are uncontrolled</div>
  </div>`;
}
function docDownload(idx){
  const c=DATA.docs.cards[idx]; if(!c) return;
  const blob=DOC_BLOBS[c.code];
  if(blob){ const a=document.createElement('a'); a.href=blob.url; a.download=c.file||c.name; document.body.appendChild(a); a.click(); a.remove(); }
  else {
    const html=`<html><head><meta charset="utf-8"><title>${esc(c.name)}</title></head><body style="font-family:Calibri,Arial;max-width:760px">
      <h3 style="color:#0060b0;margin:0">Descon Oxychem Limited · Quality Control</h3><div style="color:#666;font-size:12px">${c.code} · ${c.rev||'Rev 1'} · ${c.status||'Approved'} · Owner: ${c.owner||'QC Manager'}</div>
      <h1>${esc(c.name)}</h1>${docBody(c).map(([h,t])=>`<h3>${h}</h3><p>${esc(t).replace(/\n/g,'<br>')}</p>`).join('')}
      <p style="color:#888;font-size:11px;margin-top:30px">Downloaded from Assure LIQS by ${esc(myName())} on ${fmtStamp()}.</p></body></html>`;
    downloadFile(`${c.code} ${c.name}.doc`, html, 'application/msword');
  }
  audit('Downloaded document','Documents',c.code); toast(`Downloaded ${c.name}`,'ok');
}
function docStep(i,status){
  const c=DATA.docs.cards[i]; if(!c) return;
  if(status==='Approved'&&!can('QC Manager','Approving a document')) return;
  c.status=status; c.updated=fmtDate(); docHist(c,status==='Approved'?'Approved & published':'Sent for review');
  audit(status==='Approved'?'Approved document':'Sent document for review','Documents',`${c.code} ${c.rev}`);
  if(status==='In Review') notify(`${c.code} waiting for approval`,`${c.name} ${c.rev} · from ${myName()}`,{icon:'file-text',color:'#0060b0',route:'docs'});
  render(); toast(`${c.name} ${status==='Approved'?'approved and published':'sent for review'}`,'ok');
}
function docRevise(i){
  const c=DATA.docs.cards[i]; if(!c) return;
  const n=parseInt(String(c.rev||'Rev 1').replace(/\D/g,''))||1;
  c.rev='Rev '+(n+1); c.status='Draft'; c.updated=fmtDate(); docHist(c,'Started '+c.rev);
  audit('Started document revision','Documents',`${c.code} ${c.rev}`); render(); toast(`${c.code} is now ${c.rev} (draft)`,'info');
}
function docMenu(idx){
  const c=DATA.docs.cards[idx]; if(!c) return;
  if(!can('QC Manager','Deleting a document')) return;
  confirmModal('Delete document',`Delete <b>${esc(c.name)}</b> (${c.code})? It is moved out of the vault and the deletion is audit-logged.`,()=>{
    DATA.docs.cards.splice(idx,1); DOC_SEL=0; audit('Deleted document','Documents',c.code); render(); toast('Document deleted','ok');
  },'Delete','danger');
}
function docUpload(){
  openModal({title:'Upload Document', wide:true, body:`
    <label class="drop" id="doc-drop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');docPick(event.dataTransfer.files)">
      <input type="file" id="doc-file" style="display:none" onchange="docPick(this.files)">
      <i data-lucide="upload-cloud"></i><b id="doc-fname">Drop a file here or click to browse</b><span>PDF, Word, Excel, images or text</span>
    </label>
    <div class="form-grid" style="margin-top:12px">
      <div class="form-row"><label>Document name</label><input id="du-name" placeholder="e.g. Sampling Procedure"></div>
      <div class="form-row"><label>Category</label><select id="du-cat">${['SOP','Policy','Manual','Record','JD','Method'].map(o=>`<option>${o}</option>`).join('')}</select></div>
      <div class="form-row"><label>Document code</label><input id="du-code" placeholder="e.g. LAB-SOP-IMS-010"></div>
      <div class="form-row"><label>Owner</label><select id="du-owner">${['QC Manager','Lab Supervisor','QA Head'].map(o=>`<option>${o}</option>`).join('')}</select></div>
    </div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Upload',cls:'btn-green',icon:'upload',fn:'docUploadGo()'}]});
  window.__docFile=null;
}
function docPick(files){
  const f=files&&files[0]; if(!f) return; window.__docFile=f;
  const nm=document.getElementById('doc-fname'); if(nm) nm.textContent=`${f.name} · ${(f.size/1024).toFixed(1)} KB`;
  const n=document.getElementById('du-name'); if(n&&!n.value) n.value=f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ');
}
function docUploadGo(){
  const f=window.__docFile; const name=document.getElementById('du-name').value.trim();
  if(!f&&!name){ toast('Choose a file or enter a document name','err'); return; }
  const cat=document.getElementById('du-cat').value;
  const code=document.getElementById('du-code').value.trim()||`LAB-${cat.toUpperCase()}-IMS-${String(DATA.docs.cards.length+1).padStart(3,'0')}`;
  const card={name:name||f.name,code,size:f?(f.size>1048576?(f.size/1048576).toFixed(2)+' MB':(f.size/1024).toFixed(2)+' KB'):'0 KB',cat,updated:fmtDate(),status:'Draft',rev:'Rev 1',owner:document.getElementById('du-owner').value,file:f?f.name:null};
  docHist(card,'Uploaded');
  DATA.docs.cards.unshift(card); DOC_SEL=0;
  if(f){ const entry={url:URL.createObjectURL(f),type:f.type}; DOC_BLOBS[code]=entry;
    if(/^text\/|csv|json/.test(f.type)||/\.(txt|csv|md|json)$/i.test(f.name)){ f.text().then(t=>entry.text=t); } }
  audit('Uploaded document','Documents',`${code} · ${card.name}`);
  closeModal(); render(); toast(`${card.name} uploaded as a draft`,'ok');
}
