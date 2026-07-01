/* ============ Expanded / generated mock data (loaded after data.js + ui.js) ============ */
(function(){
const R = mulberry32(778812);
const rnd=(a,b)=>a+Math.floor(R()*(b-a+1));
const pk=a=>a[Math.floor(R()*a.length)];
const people=['MUHAMMAD ASIF HANIF','RAO ASIF SHAKEEL','NASEER AHMED','RIZWAN ALI','ABDUL KAREEM','SHARJEEL TAHIR','SHAKEEL ABBAS','MUHAMMAD HANIF','MUHAMMAD SHAHZAD','MOHSIN MAQBOOL','VANIZA','ASHIQ HUSSAIN SHAKAR','TAJAMMAL RASHID','IMRAN YOUSAF','FARHAN AKRAM','BILAL AHMED','USMAN GHANI','ZAIN UL ABIDEEN','KASHIF MEHMOOD','ADNAN RAZA'];
const plants=['UREA','NP','OU','CAN','Ammonia','Nitric Acid'];
const shifts=['Morning','Evening','Night','General'];

/* ---------- convert existing simple arrays into row-objects + expand ---------- */

/* Chemicals: expand to 30 rows across 2 pages */
const moreChem=[
  ['CHEM-0024','C15A','BARIUM CHLORIDE DIHYDRATE','kilogram (KG)','A-05',120,44,76,10,false],
  ['CHEM-0025','C16A','BORIC ACID','kilogram (KG)','A-05',60,58,2,5,true],
  ['CHEM-0026','C17A','BROMOCRESOL GREEN INDICATOR','grams (GMS)','B-06',25,10,15,3,false],
  ['CHEM-0027','C18A','CALCIUM CARBONATE','kilogram (KG)','A-06',300,120,180,25,false],
  ['CHEM-0028','C19A','COPPER SULPHATE PENTAHYDRATE','kilogram (KG)','A-06',80,78,2,10,true],
  ['CHEM-0029','C20A','DIPHENYLAMINE','grams (GMS)','B-06',45,40,5,4,false],
  ['CHEM-0030','C21A','EDTA DISODIUM SALT','kilogram (KG)','A-07',150,60,90,15,false],
  ['CHEM-0031','C22A','FERROUS AMMONIUM SULPHATE','kilogram (KG)','A-07',40,38,2,8,true],
  ['CHEM-0032','C23A','HYDROCHLORIC ACID (37%)','litre (L)','I-06',500,180,320,50,false],
  ['CHEM-0033','C24A','METHYL ORANGE INDICATOR','grams (GMS)','B-07',20,3,17,2,false],
  ['CHEM-0034','C25A','NITRIC ACID (69%)','litre (L)','I-06',400,150,250,40,false],
  ['CHEM-0035','C26A','PHENOLPHTHALEIN INDICATOR','grams (GMS)','B-07',30,29,1,3,true],
  ['CHEM-0036','C27A','POTASSIUM DICHROMATE','kilogram (KG)','A-08',25,5,20,5,false],
  ['CHEM-0037','C28A','SILVER NITRATE','grams (GMS)','B-08',100,95,5,10,true],
  ['CHEM-0038','C29A','SODIUM HYDROXIDE PELLETS','kilogram (KG)','A-08',200,60,140,20,false],
];
DATA.chem.rows.push(...moreChem);
DATA.chem.kpis[0].v='37';

/* Special samples: expand id 41..10 */
const statuses=['Results Approved','Completed','Request Approved','Requested','In Progress'];
for(let id=41;id>=10;id--){
  const st=pk(statuses);
  const d=rnd(1,18), h=rnd(8,21), m=rnd(0,59);
  const recv = st==='Requested'?'—':`${String(d).padStart(2,'0')} May 2026 ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  DATA.special.rows.push([id, pk(plants), `SS-202605${String(d).padStart(2,'0')}-${rnd(100,999)}`, `SP-${Math.floor(R()*0xFFFFFF).toString(16).toUpperCase().padStart(6,'0')}`, recv, rnd(3,7), st, pk(people)]);
}

/* ---------- In Review table (dashboard) ---------- */
DATA.inReview=[];
const areas=['Urea Product From Plant','Feed CO2','Pool Reactor','Stripper','Condensate Water','H2 Converter outlet','Evaporator Condenser','Purified process condensate'];
for(let i=1;i<=18;i++){
  DATA.inReview.push({
    id:`URE-${String(2600+i)}`, area:pk(areas), plant:pk(plants),
    status: pk(['In Review','Pending','Analyzing']), pending: rnd(1,5),
    logged:`${rnd(12,18)} May ${String(rnd(6,20)).padStart(2,'0')}:${String(rnd(0,59)).padStart(2,'0')}`,
    analyst: pk(people)
  });
}

/* ---------- Quality detailed records ---------- */
DATA.qualityRecords=[];
const params=['Moisture','Biuret','Iron Content','pH Value','Chloride','Conductivity','Ammonia','Density'];
for(let i=1;i<=26;i++){
  const off=R()<.28;
  DATA.qualityRecords.push({
    id:`QR-${String(4400+i)}`, parameter:pk(params),
    result:(R()*4+0.2).toFixed(2), spec:'< '+(R()*2+2).toFixed(1),
    status: off?'Off-Spec':'In-Spec', shift:pk(shifts), reviewer:pk(people)
  });
}

/* ---------- Notifications ---------- */
DATA.notifications=[
  {icon:'triangle-alert',color:'#e08e0b',title:'3 samples off-spec',body:'UREA Pool Reactor exceeded Biuret limit',time:'8m ago'},
  {icon:'flask-round',color:'#0060b0',title:'New special request',body:'SS-20260518-181 raised by M. Asif Hanif',time:'22m ago'},
  {icon:'circle-alert',color:'#e03131',title:'Chemical out of stock',body:'Aluminium Potassium Sulphate reached zero balance',time:'1h ago'},
  {icon:'circle-check',color:'#0a9d78',title:'Audit ISO-INT-2025-002 updated',body:'2 NCs logged, status set to Ongoing',time:'3h ago'},
  {icon:'clock',color:'#7c6bf5',title:'Night shift backlog',body:'11 UREA samples pending review',time:'5h ago'},
];

/* ---------- Users ---------- */
DATA.users=[];
const roles=['Lab Analyst','Senior Analyst','QC Manager','Lab Supervisor','Auditor','Admin'];
const depts=['Quality Control','Analytical Laboratory','Sampling','QA','Instrumentation'];
people.forEach((p,i)=>{
  DATA.users.push({id:`USR-${String(101+i)}`, name:p, email:p.toLowerCase().replace(/[^a-z]+/g,'.').slice(0,18)+'@ailab.ca',
    role:pk(roles), dept:pk(depts), status: R()<.85?'Active':'Inactive', last:`${rnd(1,18)} May 2026`});
});

/* ---------- Equipment ---------- */
DATA.equipment=[];
const eq=['pH Meter','Analytical Balance','UV Spectrophotometer','Gas Chromatograph','Muffle Furnace','Hot Air Oven','Titrator','Conductivity Meter','Karl Fischer','Flame Photometer','Kjeldahl Unit','Centrifuge'];
eq.forEach((e,i)=>{
  const st=pk(['Operational','Operational','Operational','Under Maintenance','Calibration Due']);
  DATA.equipment.push({id:`EQP-${String(301+i)}`, name:e, tag:`${e.split(' ')[0].toUpperCase().slice(0,3)}-${rnd(10,99)}`,
    location:pk(['UREA Lab','OU Lab','Ammonia Lab','Central Lab']), status:st,
    lastCal:`${rnd(1,28)} Apr 2026`, nextCal:`${rnd(1,28)} Jul 2026`});
});

/* ---------- Shift Handover Log ---------- */
DATA.shiftlog=[];
for(let i=1;i<=22;i++){
  DATA.shiftlog.push({id:`SLB-${String(5100+i)}`, date:`${rnd(1,18)} May 2026`, shift:pk(shifts),
    supervisor:pk(people), samples:rnd(20,60), completed:rnd(15,55), remarks:pk(['All routine done','2 samples deferred','Instrument recalibrated','No abnormalities','Reagent restocked','Night backlog cleared'])});
}

/* ---------- Audit Trail ---------- */
DATA.activity=[];
const acts=['Logged in','Approved sample','Edited result','Raised special request','Uploaded document','Marked sample missed','Added chemical','Closed non-conformity','Exported report','Updated user role'];
for(let i=1;i<=30;i++){
  DATA.activity.push({time:`${rnd(1,18)} May 2026 ${String(rnd(6,22)).padStart(2,'0')}:${String(rnd(0,59)).padStart(2,'0')}`,
    user:pk(people), action:pk(acts), module:pk(['Sample Mgmt','Quality','Chemicals','ISO Audits','Documents','Users']),
    ip:`10.0.${rnd(0,9)}.${rnd(2,254)}`});
}

/* ---------- Sample Registry ---------- */
DATA.registry=[];
for(let i=1;i<=34;i++){
  DATA.registry.push({id:`REG-${String(9000+i)}`, plant:pk(plants), source:pk(areas),
    type:pk(['Routine','Non-Routine','Special']), received:`${rnd(1,18)} May ${String(rnd(6,20)).padStart(2,'0')}:${String(rnd(0,59)).padStart(2,'0')}`,
    status:pk(['Registered','In Review','Completed','Approved']), by:pk(people)});
}

/* ---------- More documents ---------- */
const docCats=['JD','SOP','Policy','Manual','Record'];
const docNames=['Sampling SOP','Calibration Manual','Quality Policy','Instrument Log','Method Validation','Safety Data Sheet Index','Training Record','Internal Audit Plan'];
docNames.forEach((n,i)=>{
  DATA.docs.cards.push({name:n, code:`LAB-${pk(docCats)}-IMS-${String(2+i).padStart(3,'0')}`,
    size:(R()*800+20).toFixed(2)+' KB', cat:pk(docCats), updated:`${rnd(1,18)}/5/2026`});
});
DATA.docs.kpis[0].v=String(DATA.docs.cards.length);
DATA.docs.kpis[1].v=String(docCats.length);
DATA.docs.kpis[2].v=(DATA.docs.cards.length*0.15).toFixed(2)+' MB';

/* ---------- More audit rows ---------- */
DATA.iso.table.push(
  ['ISO-INT-2025-003','Assessment','Sampling','AILAB Sampling Unit','IMRAN YOUSAF','Mar 05, 2025','Completed','1 NC','93%'],
  ['ISO-INT-2025-004','Surveillance','Instrumentation','AILAB Instrumentation','FARHAN AKRAM','Apr 18, 2025','Planned','0 NCs','—'],
);

/* ---------- Per-product scaling (dashboards differ per plant) ---------- */
DATA.productScale={
  urea:1, np:0.82, nitric:0.65, ammonia:0.9, can:0.75, ou:1.35
};

/* period multipliers for Daily/MTD/QTD/YTD */
DATA.periodMul={Daily:1, MTD:6.4, QTD:19.2, YTD:74};
})();
