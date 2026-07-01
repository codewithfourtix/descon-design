/* ===== Chemicals & Glassware (interactive) ===== */
function chemRows(){
  return DATA.chem.rows.map(r=>({code:r[0],item:r[1],desc:r[2],uom:r[3],rack:r[4],purchased:r[5],issued:r[6],balance:r[7],ro:r[8],critical:r[9]}));
}
let CHEM_TAB='Chemicals';
function chemTab(t){CHEM_TAB=t;render();}

function screenChemicals(){
  const c = DATA.chem;
  const tabs=[['Chemicals','flask-conical'],['Glassware','beaker'],['Vendors','truck'],['MSDS','file-text']];
  const tabrow=`<div class="tabrow">${tabs.map(([n,ic])=>`<div class="tab ${CHEM_TAB===n?'active':''}" onclick="chemTab('${n}')"><i data-lucide="${ic}"></i>${n}</div>`).join('')}</div>`;

  let content;
  if(CHEM_TAB==='Chemicals'){
    const tbl=makeTable('chem',{
      title:'Reagents & Chemicals Inventory', pageSize:15, search:['code','item','desc','rack'],
      rowStyle:r=>r.critical?'background:#fdf1f1':'',
      toolbar:`<button class="btn btn-out" onclick="bulkUpload()"><i data-lucide="upload"></i>Bulk Upload</button><button class="btn btn-blue" onclick="addChemical()"><i data-lucide="plus"></i>Add Chemical</button><button class="btn btn-green" onclick="exportGeneric('chem','chemicals.csv')"><i data-lucide="download"></i>Export</button>`,
      columns:[
        {key:'code',label:'CODE',render:v=>`<b style="color:#0060b0">${v}</b>`},
        {key:'item',label:'ITEM CODE',render:v=>`<span style="color:#6b7280">${v}</span>`},
        {key:'desc',label:'DESCRIPTION',render:v=>`<span style="font-weight:500;color:#374151">${v}</span>`},
        {key:'uom',label:'UOM',render:v=>`<span style="color:#6b7280">${v}</span>`},
        {key:'rack',label:'RACK #',render:v=>`<span style="color:#4c6ef5;font-weight:600">${v}</span>`},
        {key:'purchased',label:'PURCHASED',align:'left'},
        {key:'issued',label:'ISSUED',align:'left'},
        {key:'balance',label:'BALANCE',align:'left',render:(v)=>v==0?`<span style="color:#e03131;font-weight:700">${v}</span>`:v},
        {key:'ro',label:'RO LEVEL',align:'left'},
        {key:'x',label:'ACTIONS',sortable:false,align:'left',render:(_,r)=>`<span style="display:inline-flex;gap:10px"><i data-lucide="pencil" style="width:14px;color:#0060b0;cursor:pointer" onclick="editChem('${r.code}')"></i><i data-lucide="trash-2" style="width:14px;color:#d64545;cursor:pointer" onclick="delChem('${r.code}')"></i></span>`},
      ], data:chemRows()
    });
    content=`<div class="card">${tbl}</div>`;
  } else if(CHEM_TAB==='Glassware'){
    content=`<div class="card">${makeTable('glass',{title:'Glassware Register',pageSize:10,search:['name','type'],
      toolbar:`<button class="btn btn-green" onclick="toast('Export ready (demo)','ok')"><i data-lucide="download"></i>Export</button>`,
      columns:[{key:'code',label:'CODE',render:v=>`<b style="color:#0060b0">${v}</b>`},{key:'name',label:'ITEM'},{key:'type',label:'TYPE'},{key:'qty',label:'QTY',align:'center'},{key:'condition',label:'CONDITION',render:v=>`<span class="badge ${v==='Good'?'b-green':'b-amber'}">${v}</span>`}],
      data:[['GL-01','Volumetric Flask 100ml','Class A',48,'Good'],['GL-02','Burette 50ml','Class A',24,'Good'],['GL-03','Pipette 25ml','Class A',36,'Good'],['GL-04','Beaker 250ml','Borosilicate',60,'Good'],['GL-05','Measuring Cylinder 100ml','Class B',30,'Fair'],['GL-06','Conical Flask 250ml','Borosilicate',40,'Good'],['GL-07','Desiccator','Glass',6,'Fair']].map(r=>({code:r[0],name:r[1],type:r[2],qty:r[3],condition:r[4]}))
    })}</div>`;
  } else if(CHEM_TAB==='Vendors'){
    content=`<div class="card">${makeTable('vendors',{title:'Approved Vendors',pageSize:10,search:['name','contact','category'],
      toolbar:`<button class="btn btn-blue" onclick="toast('Vendor form (demo)','info')"><i data-lucide="plus"></i>Add Vendor</button>`,
      columns:[{key:'code',label:'VENDOR ID',render:v=>`<b style="color:#0060b0">${v}</b>`},{key:'name',label:'VENDOR'},{key:'category',label:'CATEGORY'},{key:'contact',label:'CONTACT'},{key:'status',label:'STATUS',render:v=>`<span class="badge b-green">${v}</span>`}],
      data:[['V-101','ABC Chemicals','Reagents','+92 42 111 222','Approved'],['V-102','Merck KGaA','Standards','+49 6151 72','Approved'],['V-103','Sigma-Aldrich','Reagents','+1 800 325','Approved'],['V-104','Fisher Scientific','Glassware','+1 800 766','Approved'],['V-105','Local Glass Works','Glassware','+92 300 12','Approved']].map(r=>({code:r[0],name:r[1],category:r[2],contact:r[3],status:r[4]}))
    })}</div>`;
  } else {
    content=`<div class="card">${makeTable('msds',{title:'Material Safety Data Sheets',pageSize:10,search:['chemical','hazard'],
      toolbar:`<button class="btn btn-green" onclick="toast('MSDS export (demo)','ok')"><i data-lucide="download"></i>Export</button>`,
      columns:[{key:'code',label:'MSDS ID',render:v=>`<b style="color:#0060b0">${v}</b>`},{key:'chemical',label:'CHEMICAL'},{key:'hazard',label:'HAZARD CLASS',render:v=>`<span class="badge ${v==='Corrosive'||v==='Toxic'?'b-red':'b-amber'}">${v}</span>`},{key:'updated',label:'UPDATED'},{key:'x',label:'',sortable:false,render:()=>`<span style="color:#0060b0;cursor:pointer" onclick="toast('Opening MSDS (demo)','info')">View</span>`}],
      data:[['MS-01','Acetic Acid (Glacial)','Corrosive','12 Apr 2026'],['MS-02','Nitric Acid (69%)','Corrosive','08 Mar 2026'],['MS-03','Silver Nitrate','Toxic','20 Feb 2026'],['MS-04','Ammonia (28–32%)','Corrosive','15 Apr 2026'],['MS-05','Copper Sulphate','Irritant','02 Jan 2026']].map(r=>({code:r[0],chemical:r[1],hazard:r[2],updated:r[3]}))
    })}</div>`;
  }

  return `
  <div class="pageicon" style="font-size:24px">Reagents &amp; Chemicals</div>
  ${tabrow}
  ${CHEM_TAB==='Chemicals'?kpiRow(c.kpis,4):''}
  ${CHEM_TAB==='Chemicals'?'<div style="height:10px"></div>':''}
  ${content}`;
}

function editChem(code){
  const r=DATA.chem.rows.find(x=>x[0]===code); if(!r)return;
  const labels=['Code','Item Code','Description','UOM','Rack #','Purchased','Issued','Balance','RO Level'];
  const body=`<div class="form-grid">${labels.map((l,i)=>`<div class="form-row"><label>${l}</label><input id="ch-${i}" value="${r[i]}" ${i===0?'disabled':''}></div>`).join('')}</div>`;
  window.__chemEdit=code;
  openModal({title:'Edit '+code,wide:true,body,actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Save',cls:'btn-green',icon:'check',fn:'saveChem()'}]});
}
function saveChem(){
  const r=DATA.chem.rows.find(x=>x[0]===window.__chemEdit);
  for(let i=1;i<=8;i++){const el=document.getElementById('ch-'+i);if(el)r[i]=el.value;}
  r[9]=parseFloat(r[7])<parseFloat(r[8]);
  closeModal();render();toast('Chemical '+r[0]+' updated','ok');
}
function delChem(code){
  confirmModal('Delete chemical',`Remove <b>${code}</b> from inventory?`,()=>{
    const i=DATA.chem.rows.findIndex(x=>x[0]===code);if(i>-1)DATA.chem.rows.splice(i,1);
    DATA.chem.kpis[0].v=String(DATA.chem.rows.length);
    render();toast('Chemical '+code+' deleted','ok');
  },'Delete','danger');
}
function addChemical(){
  simpleAdd('Add Chemical',[
    {key:'desc',label:'Description'},{key:'item',label:'Item Code'},
    {key:'uom',label:'UOM',opts:['grams (GMS)','kilogram (KG)','litre (L)','litre']},
    {key:'rack',label:'Rack #'},{key:'purchased',label:'Purchased Qty'},{key:'ro',label:'RO Level'},
  ], v=>{
    const nid='CHEM-'+String(9+DATA.chem.rows.length).padStart(4,'0');
    const p=parseFloat(v.purchased||0);
    DATA.chem.rows.unshift([nid,v.item||'C-NEW',v.desc||'NEW CHEMICAL',v.uom,v.rack||'A-00',p,0,p,parseFloat(v.ro||0),p<parseFloat(v.ro||0)]);
    DATA.chem.kpis[0].v=String(DATA.chem.rows.length);
    toast('Chemical '+nid+' added','ok');
  });
}
function bulkUpload(){
  openModal({title:'Bulk Upload Chemicals',body:`
    <div style="border:2px dashed var(--line);border-radius:10px;padding:34px;text-align:center;color:#9aa3af">
      <i data-lucide="upload-cloud" style="width:34px"></i>
      <div style="margin-top:8px;font-size:13px">Drag &amp; drop a CSV/XLSX file here</div>
      <div style="font-size:11px;margin-top:4px">or click to browse</div>
    </div>
    <p style="font-size:11px;color:#9aa3af;margin-top:10px">Expected columns: Code, Item Code, Description, UOM, Rack, Purchased, Issued, Balance, RO Level</p>`,
    actions:[{label:'Cancel',cls:'btn-out',fn:'closeModal()'},{label:'Upload',cls:'btn-green',icon:'upload',fn:`closeModal();toast('12 chemicals imported (demo)','ok')`}]});
}
