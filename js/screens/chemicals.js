/* ===== Reagents, glassware, vendors & safety data sheets ===== */
function chemRows(){
  return DATA.chem.rows.map(r=>({code:r[0],item:r[1],desc:r[2],uom:r[3],rack:r[4],purchased:r[5],issued:r[6],balance:r[7],ro:r[8],critical:r[9]}));
}
function chemLevel(r){ const b=parseFloat(r[7]), ro=parseFloat(r[8]); if(b<=0) return 'out'; if(b<ro) return 'crit'; if(b<ro*1.5) return 'low'; return 'ok'; }
let CHEM_TAB='Chemicals';
function chemTab(t){CHEM_TAB=t;render();}

function screenChemicals(){
  const rows=DATA.chem.rows;
  const lv=l=>rows.filter(r=>chemLevel(r)===l).length;
  const tabs=[['Chemicals','flask-conical'],['Glassware','beaker'],['Vendors','truck'],['MSDS','file-warning']];
  const tabrow=`<div class="tabrow pills" style="margin:0">${tabs.map(([n,ic])=>`<div class="tab ${CHEM_TAB===n?'active':''}" onclick="chemTab('${n}')"><i data-lucide="${ic}"></i>${n}</div>`).join('')}</div>`;
  let content;
  if(CHEM_TAB==='Chemicals'){
    const tbl=makeTable('chem',{
      title:'Reagents & Chemicals Inventory', pageSize:15, search:['code','item','desc','rack'],
      rowStyle:r=>{const l=chemLevel([0,0,0,0,0,0,0,r.balance,r.ro]); return l==='out'?'background:var(--row-bad)':l==='crit'?'background:var(--row-warn)':'';},
      onOpen:r=>editChem(r.code),
      toolbar:`<button class="btn btn-out" onclick="bulkUpload()"><i data-lucide="upload"></i>Import CSV</button><button class="btn btn-green" onclick="exportGeneric('chem','chemicals.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addChemical()"><i data-lucide="plus"></i>Add Chemical</button>`,
      columns:[
        {key:'code',label:'CODE',render:v=>`<b style="color:var(--brand)">${v}</b>`},
        {key:'item',label:'ITEM CODE',render:v=>`<span style="color:var(--muted)">${v}</span>`},
        {key:'desc',label:'DESCRIPTION',render:v=>`<span style="font-weight:500;color:var(--ink)">${v}</span>`},
        {key:'rack',label:'RACK #',render:v=>`<span style="color:var(--brand);font-weight:600">${v}</span>`},
        {key:'balance',label:'BALANCE',align:'left',render:(v,r)=>{const l=chemLevel([0,0,0,0,0,0,0,v,r.ro]);return `<span class="stock ${l}">${v}</span> <span style="color:var(--muted2);font-size:10.5px">${String(r.uom).split(' ')[0]}</span>`;}},
        {key:'ro',label:'RO LEVEL',align:'left'},
        {key:'x',label:'ACTIONS',sortable:false,align:'right',render:(_,r)=>`<span style="display:inline-flex;gap:10px">
          <i data-lucide="arrow-down-to-line" title="Receive stock" style="width:14px;color:#0a9d78;cursor:pointer" onclick="stockMove('${r.code}','in')"></i>
          <i data-lucide="arrow-up-from-line" title="Issue to bench" style="width:14px;color:var(--amber);cursor:pointer" onclick="stockMove('${r.code}','out')"></i>
          <i data-lucide="pencil" title="Edit" style="width:14px;color:var(--brand);cursor:pointer" onclick="editChem('${r.code}')"></i>
          <i data-lucide="trash-2" title="Delete" style="width:14px;color:#d64545;cursor:pointer" onclick="delChem('${r.code}')"></i></span>`},
      ], data:chemRows()
    });
    content=`<div class="card" style="flex:1">${tbl}</div>`;
  } else if(CHEM_TAB==='Glassware'){
    content=`<div class="card" style="flex:1">${makeTable('glass',{title:'Glassware Register',pageSize:10,search:['name','type','code'],
      toolbar:`<button class="btn btn-green" onclick="exportGeneric('glass','glassware.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addGlass()"><i data-lucide="plus"></i>Add Item</button>`,
      columns:[{key:'code',label:'CODE',render:v=>`<b style="color:var(--brand)">${v}</b>`},{key:'name',label:'ITEM'},{key:'type',label:'TYPE'},{key:'qty',label:'QTY',align:'center'},{key:'condition',label:'CONDITION',render:v=>`<span class="badge ${v==='Good'?'b-green':v==='Broken'?'b-red':'b-amber'}">${v}</span>`}],
      data:DATA.glass})}</div>`;
  } else if(CHEM_TAB==='Vendors'){
    content=`<div class="card" style="flex:1">${makeTable('vendors',{title:'Approved Vendors',pageSize:10,search:['name','contact','category'],
      toolbar:`<button class="btn btn-green" onclick="exportGeneric('vendors','vendors.csv')"><i data-lucide="download"></i>Export</button><button class="btn btn-blue" style="background:var(--brand);color:#fff" onclick="addVendor()"><i data-lucide="plus"></i>Add Vendor</button>`,
      onOpen:r=>openVendor(r.code),
      columns:[{key:'code',label:'VENDOR ID',render:v=>`<b style="color:var(--brand)">${v}</b>`},{key:'name',label:'VENDOR'},{key:'category',label:'CATEGORY'},{key:'contact',label:'CONTACT'},{key:'status',label:'STATUS',render:v=>`<span class="badge ${v==='Approved'?'b-green':v==='Suspended'?'b-red':'b-amber'}">${v}</span>`}],
      data:DATA.vendors})}</div>`;
  } else {
    content=`<div class="card" style="flex:1">${makeTable('msds',{title:'Safety Data Sheets (GHS)',pageSize:10,search:['chem','cas','signal'],
      toolbar:`<button class="btn btn-green" onclick="exportGeneric('msds','sds-register.csv')"><i data-lucide="download"></i>Export</button>`,
      onOpen:r=>viewSds(r.cas),
      columns:[{key:'chem',label:'CHEMICAL',render:v=>`<span style="font-weight:500;color:var(--ink)">${v}</span>`},{key:'cas',label:'CAS NO.'},
        {key:'signal',label:'SIGNAL WORD',render:v=>`<span class="badge ${v==='Danger'?'b-red':'b-amber'}">${v}</span>`},
        {key:'haz',label:'HAZARDS',sortable:false,render:v=>(v||[]).map(h=>`<span class="ghs">${h}</span>`).join('')},
        {key:'rev',label:'REVISION',render:v=>`<span style="color:var(--muted)">${v}</span>`}],
      data:DATA.msds})}</div>`;
  }
  return `
  <div class="page-head"><div><div class="ph-t" style="font-size:22px">Reagents &amp; Chemicals</div><div class="ph-s">Stock moves update balances instantly. Items below their reorder (RO) level are flagged.</div></div></div>
  ${tabrow}
  ${CHEM_TAB==='Chemicals'?kpiRow([
    {l:'Total Chemicals',v:String(rows.length),i:'flask-conical',s:'Unique chemicals tracked'},
    {l:'Out of Stock',v:String(lv('out')),i:'circle-alert',s:'Balance reached zero'},
    {l:'Critical Stock',v:String(lv('crit')),i:'triangle-alert',s:'Below RO level'},
    {l:'Low Stock',v:String(lv('low')),i:'circle-alert',s:'Within 50% of RO level'},
  ],4)+'<div style="height:4px"></div>':''}
  ${content}`;
}
function chemFind(code){ return DATA.chem.rows.find(x=>x[0]===code); }
function stockMove(code, dir){
  const r=chemFind(code); if(!r) return;
  openModal({title:(dir==='in'?'Receive stock · ':'Issue to bench · ')+code, body:`
    <div class="kv"><span>Chemical</span><span>${r[2]}</span></div>
    <div class="kv"><span>Current balance</span><span>${r[7]} ${String(r[3]).split(' ')[0]}</span></div>
    <div class="form-row" style="margin-top:12px"><label>Quantity (${r[3]})</label><input id="sm-q" type="number" min="0" step="any" placeholder="0"></div>
    <div class="form-row"><label>${dir==='in'?'Supplier / GRN no.':'Issued to (analyst / test)'}</label><input id="sm-ref" placeholder="${dir==='in'?'e.g. Merck · GRN-2291':'e.g. Biuret test, Urea lab'}"></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:dir==='in'?'Receive':'Issue',cls:'btn-green',icon:dir==='in'?'arrow-down-to-line':'arrow-up-from-line',fn:`stockMoveGo('${code}','${dir}')`}]});
  setTimeout(()=>{ const i=document.getElementById('sm-q'); if(i) i.focus(); },60);
}
function stockMoveGo(code,dir){
  const r=chemFind(code); const q=parseFloat(document.getElementById('sm-q').value);
  if(!q||q<=0){ toast('Enter a quantity greater than zero','err'); return; }
  const bal=parseFloat(r[7])||0;
  if(dir==='out'&&q>bal){ toast(`Only ${bal} available`,'err'); return; }
  const ref=document.getElementById('sm-ref').value.trim();
  if(dir==='in'){ r[5]=+(parseFloat(r[5]||0)+q).toFixed(3); r[7]=+(bal+q).toFixed(3); }
  else { r[6]=+(parseFloat(r[6]||0)+q).toFixed(3); r[7]=+(bal-q).toFixed(3); }
  r[9]=parseFloat(r[7])<parseFloat(r[8]);
  audit(dir==='in'?'Received stock':'Issued stock','Chemicals',`${code} ${dir==='in'?'+':'−'}${q}${ref?' · '+ref:''}`);
  const l=chemLevel(r);
  if(dir==='out'&&(l==='out'||l==='crit')) notify(l==='out'?'Chemical out of stock':'Chemical below reorder level',`${titleCase(r[2])} · balance ${r[7]}`,{icon:'circle-alert',color:'#e03131',route:'chemicals'});
  closeModal(); render(); toast(`${code}: balance now ${r[7]}`,'ok');
}
function editChem(code){
  const r=chemFind(code); if(!r) return;
  const labels=['Code','Item Code','Description','UOM','Rack #','Purchased','Issued','Balance','RO Level'];
  const body=`<div class="form-grid">${labels.map((l,i)=>`<div class="form-row"><label>${l}</label><input id="ch-${i}" value="${esc(r[i])}" ${i===0?'disabled':''}></div>`).join('')}</div>`;
  window.__chemEdit=code;
  openModal({title:'Edit '+code,wide:true,body,actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Save',cls:'btn-green',icon:'check',fn:'saveChem()'}]});
}
function saveChem(){
  const r=chemFind(window.__chemEdit);
  for(let i=1;i<=8;i++){const el=document.getElementById('ch-'+i);if(el)r[i]=el.value;}
  r[9]=parseFloat(r[7])<parseFloat(r[8]);
  audit('Edited chemical','Chemicals',r[0]); closeModal();render();toast('Chemical '+r[0]+' updated','ok');
}
function delChem(code){
  if(!can('Lab Supervisor','Deleting a chemical')) return;
  confirmModal('Delete chemical',`Remove <b>${code}</b> from inventory?`,()=>{
    const i=DATA.chem.rows.findIndex(x=>x[0]===code);if(i>-1)DATA.chem.rows.splice(i,1);
    audit('Deleted chemical','Chemicals',code); render();toast('Chemical '+code+' deleted','ok');
  },'Delete','danger');
}
function nextChemCode(){ return seq('CHEM-',DATA.chem.rows,null,0).replace(/-(\d+)$/,(m,n)=>'-'+String(n).padStart(4,'0')); }
function addChemical(){
  simpleAdd('Add Chemical',[
    {key:'desc',label:'Description'},{key:'item',label:'Item Code'},
    {key:'uom',label:'UOM',opts:['grams (GMS)','kilogram (KG)','litre (L)','millilitre (ML)']},
    {key:'rack',label:'Rack #'},{key:'purchased',label:'Opening quantity'},{key:'ro',label:'Reorder (RO) level'},
  ], v=>{
    const nid=nextChemCode(); const p=parseFloat(v.purchased||0);
    DATA.chem.rows.unshift([nid,v.item||'C-NEW',(v.desc||'NEW CHEMICAL').toUpperCase(),v.uom,v.rack||'A-00',p,0,p,parseFloat(v.ro||0),p<parseFloat(v.ro||0)]);
    audit('Added chemical','Chemicals',`${nid} · ${v.desc}`); toast('Chemical '+nid+' added','ok');
  });
}
function bulkUpload(){
  openModal({title:'Import chemicals from CSV',wide:true,body:`
    <label class="drop" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="event.preventDefault();this.classList.remove('over');chemCsv(event.dataTransfer.files)">
      <input type="file" accept=".csv,text/csv" style="display:none" onchange="chemCsv(this.files)">
      <i data-lucide="upload-cloud"></i><b id="csv-name">Drop a CSV here or click to browse</b><span>Columns: Description, Item Code, UOM, Rack, Quantity, RO Level</span>
    </label>
    <div id="csv-prev" style="margin-top:10px"></div>
    <div style="margin-top:8px;font-size:11.5px;color:var(--muted)">Need a template? <a style="color:var(--brand);cursor:pointer" onclick="chemTemplate()">Download the CSV template</a></div>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Import',cls:'btn-green',icon:'upload',fn:'chemImportGo()'}]});
  window.__csvRows=null;
}
function chemTemplate(){ downloadFile('chemicals-template.csv','Description,Item Code,UOM,Rack,Quantity,RO Level\r\nPOTASSIUM PERMANGANATE 0.1N,C40A,litre (L),I-07,20,5\r\nSODIUM THIOSULPHATE,C41A,kilogram (KG),A-09,10,2\r\n','text/csv'); }
function parseCSV(text){
  const out=[]; let row=[], cur='', q=false;
  for(let i=0;i<text.length;i++){ const ch=text[i];
    if(q){ if(ch==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=ch; }
    else if(ch==='"') q=true; else if(ch===','){ row.push(cur); cur=''; } else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n') i++; row.push(cur); cur=''; if(row.some(c=>c.trim())) out.push(row); row=[]; } else cur+=ch; }
  row.push(cur); if(row.some(c=>c.trim())) out.push(row); return out;
}
function chemCsv(files){
  const f=files&&files[0]; if(!f) return;
  f.text().then(t=>{
    const rows=parseCSV(t); if(rows.length<2){ toast('The file has no data rows','err'); return; }
    const head=rows[0].map(h=>h.trim().toLowerCase());
    const ix=k=>head.findIndex(h=>h.includes(k));
    const map={desc:ix('desc'),item:ix('item'),uom:ix('uom'),rack:ix('rack'),qty:Math.max(ix('qty'),ix('quantity'),ix('balance')),ro:ix('ro')};
    if(map.desc<0){ toast('Could not find a Description column','err'); return; }
    window.__csvRows=rows.slice(1).map(r=>({desc:(r[map.desc]||'').trim(),item:map.item>=0?r[map.item]:'',uom:map.uom>=0?r[map.uom]:'grams (GMS)',rack:map.rack>=0?r[map.rack]:'A-00',qty:parseFloat(map.qty>=0?r[map.qty]:0)||0,ro:parseFloat(map.ro>=0?r[map.ro]:0)||0})).filter(r=>r.desc);
    document.getElementById('csv-name').textContent=`${f.name} · ${window.__csvRows.length} rows ready`;
    document.getElementById('csv-prev').innerHTML=`<div class="tbl-wrap"><table class="tbl dense"><thead><tr><th>DESCRIPTION</th><th>ITEM</th><th>UOM</th><th>RACK</th><th>QTY</th><th>RO</th></tr></thead><tbody>${window.__csvRows.slice(0,6).map(r=>`<tr><td>${esc(r.desc)}</td><td>${esc(r.item)}</td><td>${esc(r.uom)}</td><td>${esc(r.rack)}</td><td>${r.qty}</td><td>${r.ro}</td></tr>`).join('')}</tbody></table></div>${window.__csvRows.length>6?`<div style="font-size:11px;color:var(--muted);margin-top:4px">+ ${window.__csvRows.length-6} more</div>`:''}`;
  });
}
function chemImportGo(){
  const rows=window.__csvRows; if(!rows||!rows.length){ toast('Choose a CSV file first','err'); return; }
  rows.forEach(r=>{ const nid=nextChemCode(); DATA.chem.rows.unshift([nid,r.item||'C-IMP',r.desc.toUpperCase(),r.uom||'grams (GMS)',r.rack||'A-00',r.qty,0,r.qty,r.ro,r.qty<r.ro]); });
  audit('Imported chemicals','Chemicals',`${rows.length} rows from CSV`);
  closeModal(); render(); toast(`${rows.length} chemical${rows.length>1?'s':''} imported`,'ok');
}
function addGlass(){ simpleAdd('Add Glassware',[{key:'name',label:'Item'},{key:'type',label:'Type',opts:['Class A','Class B','Borosilicate','Glass','Plastic']},{key:'qty',label:'Quantity'},{key:'condition',label:'Condition',opts:['Good','Fair','Broken']}],
  v=>{ const id=seq('GL-',DATA.glass,'code',0).replace(/-(\d)$/,'-0$1'); DATA.glass.unshift({code:id,name:v.name||'New item',type:v.type,qty:parseInt(v.qty)||1,condition:v.condition}); audit('Added glassware','Chemicals',id); toast(id+' added','ok'); }); }
function addVendor(){ simpleAdd('Add Vendor',[{key:'name',label:'Vendor name'},{key:'category',label:'Category',opts:['Reagents','Standards','Glassware','Instruments','Gases','Services']},{key:'contact',label:'Phone / email'},{key:'status',label:'Status',opts:['Under Review','Approved']}],
  v=>{ const id=seq('V-',DATA.vendors,'code',100); DATA.vendors.unshift({code:id,name:v.name||'New vendor',category:v.category,contact:v.contact||'—',status:v.status}); audit('Added vendor','Chemicals',`${id} · ${v.name}`); toast('Vendor '+id+' added','ok'); }); }
function openVendor(code){
  const v=DATA.vendors.find(x=>x.code===code); if(!v) return;
  openRecord(`${v.code} · ${v.name}`,[['Vendor',v.name],['Category',v.category],['Contact',v.contact],['Status',v.status]],[
    ...(v.status!=='Approved'?[{label:'Approve vendor',cls:'btn-green',icon:'badge-check',fn:`vendorSet('${code}','Approved')`}]:[]),
    ...(v.status!=='Suspended'?[{label:'Suspend',cls:'btn-out',icon:'ban',fn:`vendorSet('${code}','Suspended')`}]:[])]);
}
function vendorSet(code,s){ if(!can('QC Manager','Changing vendor approval')) return; const v=DATA.vendors.find(x=>x.code===code); v.status=s; audit(s==='Approved'?'Approved vendor':'Suspended vendor','Chemicals',code); closeDrawer(); render(); toast(`${v.name} ${s.toLowerCase()}`,'ok'); }
function viewSds(cas){
  const s=DATA.msds.find(x=>x.cas===cas); if(!s) return;
  const pict={Oxidiser:'flame',Corrosive:'droplet',Flammable:'flame',Toxic:'skull',Harmful:'triangle-alert',Irritant:'triangle-alert',Environmental:'leaf',Carcinogen:'heart-pulse'};
  openModal({title:'Safety Data Sheet · '+s.chem, wide:true, body:`
    <div class="sds-top"><div><div style="font-size:16px;font-weight:700;color:var(--ink)">${s.chem}</div><div style="color:var(--muted);font-size:12px">CAS ${s.cas} · ${s.rev}</div></div><span class="badge b-red" style="font-size:12px">${s.signal}</span></div>
    <div class="sds-picts">${s.haz.map(h=>`<div class="sds-p"><i data-lucide="${pict[h]||'triangle-alert'}"></i><span>${h}</span></div>`).join('')}</div>
    <div class="dp-sec"><b>Personal protective equipment</b><p>${s.ppe}</p></div>
    <div class="dp-sec"><b>Storage</b><p>${s.store}</p></div>
    <div class="dp-sec"><b>First aid</b><p>Eyes: rinse with water for at least 15 minutes and get medical help. Skin: remove contaminated clothing and wash with plenty of water. Inhalation: move to fresh air. Ingestion: rinse mouth, do not induce vomiting, get medical help.</p></div>
    <div class="dp-sec"><b>Spill response</b><p>Evacuate the area, wear the PPE above, contain with inert absorbent and neutralise where applicable. Report the spill to the shift supervisor and HSE.</p></div>`,
    actions:[{label:'Close',cls:'btn-out',fn:'closeModal()'},{label:'Download summary',cls:'btn-green',icon:'download',fn:`sdsDownload('${cas}')`}]});
}
function sdsDownload(cas){ const s=DATA.msds.find(x=>x.cas===cas); downloadFile(`SDS-${s.chem.replace(/[^\w]+/g,'-')}.txt`,`SAFETY DATA SHEET SUMMARY\n${s.chem}\nCAS ${s.cas} · ${s.rev}\nSignal word: ${s.signal}\nHazards: ${s.haz.join(', ')}\nPPE: ${s.ppe}\nStorage: ${s.store}\n\nGenerated by Descon Assure LIQS on ${fmtStamp()}`); audit('Downloaded SDS','Chemicals',s.chem); }
