/* ============================================================
   Store: session, persistence, audit trail, notifications,
   and shared helpers. Loaded after all seed data (data*.js)
   and before the screens, so every module reads live state.
   Everything is saved to localStorage, so records you create,
   edit, approve or delete survive a page reload.
   ============================================================ */

const STORE_KEY   = 'descon-assure-data-v2';
const SESSION_KEY = 'descon-assure-session-v2';
const PREFS_KEY   = 'descon-assure-prefs-v2';

/* ---------- small helpers ---------- */
const esc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const jsq = s => String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pad2 = n => String(n).padStart(2,'0');
function fmtDate(d){ d=d||new Date(); return `${pad2(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`; }
function fmtTime(d){ d=d||new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function fmtStamp(d){ d=d||new Date(); return `${fmtDate(d)} ${fmtTime(d)}`; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function seq(prefix, arr, field, start){
  let max=start||0;
  (arr||[]).forEach(r=>{ const v=String(typeof r==='object'&&!Array.isArray(r)?r[field||'id']:r[0]||'');
    const m=v.match(/(\d+)\s*$/); if(m) max=Math.max(max,parseInt(m[1],10)); });
  return prefix+(max+1);
}
function downloadFile(name, content, mime){
  const blob = content instanceof Blob ? content : new Blob([content],{type:mime||'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function loadScript(src){
  return new Promise((res,rej)=>{
    if(document.querySelector(`script[src="${src}"]`)){ res(); return; }
    const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=()=>rej(new Error('load '+src));
    document.head.appendChild(s);
  });
}
const LIBS = {
  html2canvas:'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  jspdf:'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
};
function initialsOf(name){ return String(name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function titleCase(s){ return String(s).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()).replace(/\b(Qc|Qa|Hse|Sds|Pnac)\b/g,m=>m.toUpperCase()); }

/* ---------- specification parsing & checking ---------- */
function parseSpec(spec){
  if(spec==null) return null;
  let s=String(spec).trim(); if(!s||s==='—'||s==='-') return null;
  if(/^nil$/i.test(s)) return {lo:null,hi:0,txt:'Nil'};
  s=s.replace(/[–—~]/g,'-').replace(/\s+to\s+/gi,'-').replace(/,/g,'');
  let m=s.match(/(\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)/);
  if(m){ const a=parseFloat(m[1]), b=parseFloat(m[2]); return {lo:+(a-b).toFixed(4),hi:+(a+b).toFixed(4)}; }
  m=s.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
  if(m) return {lo:parseFloat(m[1]),hi:parseFloat(m[2])};
  m=s.match(/(\d+(?:\.\d+)?)\s*[%a-zµ/]*\s*max/i) || s.match(/max\.?\s*(\d+(?:\.\d+)?)/i) || s.match(/<\s*=?\s*(\d+(?:\.\d+)?)/);
  if(m) return {lo:null,hi:parseFloat(m[1])};
  m=s.match(/(\d+(?:\.\d+)?)\s*[%a-zµ/]*\s*min/i) || s.match(/min\.?\s*(\d+(?:\.\d+)?)/i) || s.match(/>\s*=?\s*(\d+(?:\.\d+)?)/);
  if(m) return {lo:parseFloat(m[1]),hi:null};
  return null;
}
/* returns 'pass' | 'fail' | 'none' (no numeric spec or no value).
   "ND" (not detected) and "< x" (below detection) pass a maximum limit. */
function checkSpec(spec, value){
  if(value===''||value==null) return 'none';
  const raw=String(value).trim(); const p=parseSpec(spec); if(!p) return 'none';
  if(/^(nd|nil|n\.d\.)$/i.test(raw)) return p.hi!=null&&p.lo==null?'pass':'none';
  const lt=raw.match(/^<\s*(\d+(?:\.\d+)?)$/);
  if(lt){ if(p.hi!=null&&parseFloat(lt[1])<=p.hi&&p.lo==null) return 'pass'; return 'none'; }
  const v=parseFloat(raw.replace(/,/g,'')); if(isNaN(v)||!/^[<>]?\s*-?\d/.test(raw)) return 'none';
  if(p.lo!=null && v<p.lo) return 'fail';
  if(p.hi!=null && v>p.hi) return 'fail';
  return 'pass';
}
/* a realistic value for a spec: inside the window, nudged toward the middle */
function sampleWithin(spec, rng){
  rng=rng||Math.random; const p=parseSpec(spec);
  const dp=v=>Math.abs(v)>=100?0:Math.abs(v)>=10?1:2;
  if(!p) return +(0.2+rng()*4).toFixed(2);
  if(p.lo!=null&&p.hi!=null){ const span=p.hi-p.lo; const v=p.lo+span*(0.2+rng()*0.6); return +v.toFixed(dp(p.hi)); }
  if(p.hi!=null){ if(p.hi===0) return 0; const v=p.hi*(0.35+rng()*0.5); return +v.toFixed(dp(p.hi)); }
  const v=p.lo*(1.002+rng()*0.012); return +v.toFixed(dp(p.lo));
}

/* ---------- session (who is signed in) ---------- */
const ROLES = ['Lab Analyst','Senior Analyst','Lab Supervisor','QC Manager','Auditor','Admin'];
const ROLE_RANK = {'Auditor':0,'Lab Analyst':1,'Senior Analyst':2,'Lab Supervisor':3,'QC Manager':4,'Admin':5};
let SESSION = null;
try{ SESSION = JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); }catch(e){ SESSION=null; }
function saveSession(){ try{ if(SESSION) localStorage.setItem(SESSION_KEY,JSON.stringify(SESSION)); else localStorage.removeItem(SESSION_KEY); }catch(e){} }
function me(){ return SESSION||{name:'Guest',email:'',role:'Lab Analyst'}; }
function myName(){ return me().name; }
/* permission check: returns true, or explains and returns false */
function can(minRole, what){
  const ok=(ROLE_RANK[me().role]||0)>=(ROLE_RANK[minRole]||0);
  if(!ok) toast(`${what||'This action'} needs ${minRole} access. You are signed in as ${me().role}.`,'warn');
  return ok;
}

/* ---------- user preferences ---------- */
let PREFS = {dark:false, offspecEmail:true, digest:true, compact:false, phone:'+92 42 111 337 266', lang:'English'};
try{ Object.assign(PREFS, JSON.parse(localStorage.getItem(PREFS_KEY)||'{}')); }catch(e){}
function savePrefs(){ try{ localStorage.setItem(PREFS_KEY,JSON.stringify(PREFS)); }catch(e){} }

/* ---------- audit trail + notifications ---------- */
function audit(action, module, detail){
  if(!DATA.activity) DATA.activity=[];
  DATA.activity.unshift({time:fmtStamp(), user:myName(), action, module, detail:detail||'',
    ip:'10.0.4.'+(20+(myName().length*7)%200)});
  if(DATA.activity.length>600) DATA.activity.length=600;
  persistSoon();
}
function notify(title, body, opt={}){
  if(!DATA.notifications) DATA.notifications=[];
  DATA.notifications.unshift({icon:opt.icon||'bell', color:opt.color||'#0060b0', title, body, time:'Just now',
    at:Date.now(), unread:true, route:opt.route||null, tab:opt.tab||null});
  if(DATA.notifications.length>60) DATA.notifications.length=60;
  updateBadge(); persistSoon();
}
function relTime(n){
  if(!n.at) return n.time||'';
  const s=Math.floor((Date.now()-n.at)/1000);
  if(s<60) return 'Just now'; if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago';
}
function unreadCount(){ return (DATA.notifications||[]).filter(n=>n.unread!==false).length; }
function updateBadge(){
  const host=document.querySelector('.rail-bottom .iconbtn[title="Notifications"]'); if(!host) return;
  let b=host.querySelector('.badge-dot'); const n=unreadCount();
  if(!n){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement('span'); b.className='badge-dot'; host.appendChild(b); }
  b.textContent=n>9?'9+':String(n); b.classList.add('has-count');
}

/* ---------- seed data for modules that had none ---------- */
(function seedExtra(){
  const R=mulberry32(91357);
  const rnd=(a,b)=>a+Math.floor(R()*(b-a+1));
  const pk=a=>a[Math.floor(R()*a.length)];
  const people=DATA.users.map(u=>u.name);

  /* users: Descon email domain */
  DATA.users.forEach(u=>{ u.email=u.email.replace('@ailab.ca','@descon.com'); });
  /* every seeded notification starts unread */
  DATA.notifications.forEach(n=>{ if(n.unread===undefined) n.unread=true; });
  DATA.activity.forEach(a=>{ if(a.detail===undefined) a.detail=''; });

  /* finished-goods batches per stream, with full test panels from the worksheets */
  const testsFor=(route, cardIdx)=>{
    const cards=(DATA.labByStream&&DATA.labByStream[route])||DATA.lab.cards;
    const c=cards[cardIdx%cards.length];
    return c.rows.filter(r=>r[2]).slice(0,6).map(r=>({param:r[0],unit:r[1],spec:r[2],result:''}));
  };
  const products={
    h2o2:[['H2O2 50% Technical','HP-01',0],['Aseptox 35% Food Grade','HP-02',1],['Textox 50% Textile','HP-03',2]],
    urea:[['Urea Prilled (Plant)','UR-27',9],['Urea Product (PH&S)','UR-30',0],['Urea Solution 70%','UR-10',11]],
  };
  DATA.batches=[];
  let bn=2440;
  Object.entries(products).forEach(([route,list])=>{
    for(let i=0;i<9;i++){
      const [prod,code,ci]=list[i%list.length];
      const st=pk(['Released','Released','Released','Awaiting QC','Under Test','On Hold','Released','Awaiting QC','Rejected']);
      const tests=testsFor(route,ci).map(t=>{
        let res='';
        if(st!=='Awaiting QC'){ res=String(sampleWithin(t.spec,R));
          if((st==='On Hold'||st==='Rejected')&&R()<0.5){ const p=parseSpec(t.spec); if(p&&p.hi!=null&&p.hi>0) res=String(+(p.hi*1.08).toFixed(2)); } }
        return {...t,result:res};
      });
      const d=addDays(new Date(2026,9,20),-rnd(0,24));
      DATA.batches.push({id:(route==='h2o2'?'HP-':'UR-')+(bn++), route, product:prod, point:code,
        qty:route==='h2o2'?rnd(18,60):rnd(250,900), unit:'MT', tank:route==='h2o2'?String(pk([5001,5002,5003,5005,5008,5009])):'Silo '+rnd(1,6),
        mfg:fmtDate(d), status:st, by:pk(people), tests,
        reason: st==='On Hold'?'Awaiting retest on stability':st==='Rejected'?'Out of specification':''});
    }
  });

  /* certificates of analysis for released batches */
  DATA.coas=[];
  const customers=['Nishat Mills','Engro Polymer','Packages Ltd','Shan Foods','Interloop','Fauji Fertilizer','Sapphire Textiles','Nestle Pakistan'];
  DATA.batches.filter(b=>b.status==='Released').slice(0,8).forEach((b,i)=>{
    DATA.coas.push({id:'COA-2026-'+String(401+i).padStart(4,'0'), batch:b.id, route:b.route, product:b.product,
      customer:pk(customers), issued:b.mfg, by:'QC Manager', status:'Issued'});
  });

  /* CAPA register (linked to audits / OOS) */
  DATA.capas=[
    {id:'CAPA-041',source:'ISO-INT-2025-001',clause:'6.4',title:'Balance EQP-310 used past calibration due date',owner:'Lab Supervisor',due:'15 Nov 2026',status:'In Progress',root:'Calibration reminder not escalated',action:'Weekly calibration due report emailed to Lab Supervisor'},
    {id:'CAPA-042',source:'ISO-INT-2025-001',clause:'7.5',title:'Raw data not attached to 3 urea results',owner:'QC Manager',due:'22 Nov 2026',status:'Open',root:'Manual transcription from instrument printouts',action:'Instrument file upload required before approval'},
    {id:'CAPA-043',source:'ISO-INT-2025-002',clause:'6.2',title:'Analyst competence record expired',owner:'QC Manager',due:'30 Nov 2026',status:'Open',root:'No expiry tracking on training records',action:'Add competence expiry to user profiles'},
    {id:'CAPA-044',source:'OOS QR-4409',clause:'7.9',title:'Biuret OOS on Pool Reactor, repeat event',owner:'Senior Analyst',due:'10 Nov 2026',status:'Pending Approval',root:'Reactor temperature excursion',action:'Process alarm limit tightened with Operations'},
    {id:'CAPA-045',source:'ISO-INT-2025-003',clause:'8.7',title:'Customer complaint log not reviewed monthly',owner:'QA Head',due:'05 Oct 2026',status:'Closed',root:'Owner not assigned',action:'Monthly review added to QA calendar'},
  ];

  /* external audits (accreditation body, customers) */
  DATA.extAudits=[
    ['EXT-PNAC-2026-01','Accreditation','Quality Control','PNAC (ISO/IEC 17025)','Lead Assessor, PNAC','Mar 12, 2026','Completed','2 NCs','94%'],
    ['EXT-CUS-2026-02','Customer Audit','Analytical Laboratory','Nestle Pakistan','Supplier Quality Team','Jun 03, 2026','Completed','1 NC','96%'],
    ['EXT-CUS-2026-03','Customer Audit','Quality Control','Engro Polymer','Supplier Quality Team','Sep 18, 2026','Ongoing','0 NCs','—'],
    ['EXT-PNAC-2026-04','Surveillance','Quality Control','PNAC (ISO/IEC 17025)','Lead Assessor, PNAC','Dec 08, 2026','Planned','0 NCs','—'],
  ];

  /* shift roster */
  DATA.roster=[
    {shift:'General',time:'06:00–18:00',supervisor:'TAJAMMAL RASHID',analysts:['NASEER AHMED','RIZWAN ALI','VANIZA','ABDUL KAREEM','KASHIF MEHMOOD','ADNAN RAZA'],status:'On Duty'},
    {shift:'Morning',time:'06:00–14:00',supervisor:'IMRAN YOUSAF',analysts:['SHARJEEL TAHIR','SHAKEEL ABBAS','MUHAMMAD HANIF','USMAN GHANI','ZAIN UL ABIDEEN'],status:'On Duty'},
    {shift:'Evening',time:'14:00–22:00',supervisor:'FARHAN AKRAM',analysts:['MUHAMMAD SHAHZAD','MOHSIN MAQBOOL','RAO ASIF SHAKEEL','ASHIQ HUSSAIN SHAKAR'],status:'Scheduled'},
    {shift:'Night',time:'22:00–06:00',supervisor:'BILAL AHMED',analysts:['MUHAMMAD ASIF HANIF','NASEER AHMED','RIZWAN ALI'],status:'Scheduled'},
  ];

  /* inventory side registers */
  DATA.glass=[['GL-01','Volumetric Flask 100ml','Class A',48,'Good'],['GL-02','Burette 50ml','Class A',24,'Good'],['GL-03','Pipette 25ml','Class A',36,'Good'],['GL-04','Beaker 250ml','Borosilicate',60,'Good'],['GL-05','Measuring Cylinder 100ml','Class B',30,'Fair'],['GL-06','Conical Flask 250ml','Borosilicate',40,'Good'],['GL-07','Desiccator','Glass',6,'Fair']]
    .map(r=>({code:r[0],name:r[1],type:r[2],qty:r[3],condition:r[4]}));
  DATA.vendors=[['V-101','ABC Chemicals','Reagents','+92 42 111 222','Approved'],['V-102','Merck KGaA','Standards','+49 6151 72','Approved'],['V-103','Sigma-Aldrich','Reagents','+1 800 325','Approved'],['V-104','Fisher Scientific','Glassware','+1 800 766','Approved'],['V-105','Local Glass Works','Glassware','+92 300 12','Under Review']]
    .map(r=>({code:r[0],name:r[1],category:r[2],contact:r[3],status:r[4]}));
  DATA.msds=[
    {chem:'Hydrogen Peroxide 50%',cas:'7722-84-1',signal:'Danger',haz:['Oxidiser','Corrosive','Harmful'],rev:'Rev 4 · Feb 2026',ppe:'Face shield, PVC gloves, apron',store:'Cool, vented, away from organics and metals'},
    {chem:'Nitric Acid 69%',cas:'7697-37-2',signal:'Danger',haz:['Oxidiser','Corrosive'],rev:'Rev 3 · Feb 2026',ppe:'Acid suit, face shield, neoprene gloves',store:'Acid cabinet, away from bases and organics'},
    {chem:'Sulphuric Acid 98%',cas:'7664-93-9',signal:'Danger',haz:['Corrosive'],rev:'Rev 5 · Jan 2026',ppe:'Face shield, acid gloves, apron',store:'Acid cabinet, secondary containment'},
    {chem:'Hydrochloric Acid 37%',cas:'7647-01-0',signal:'Danger',haz:['Corrosive','Irritant'],rev:'Rev 2 · Jan 2026',ppe:'Goggles, nitrile gloves, fume hood',store:'Acid cabinet, ventilated'},
    {chem:'Sodium Hydroxide Pellets',cas:'1310-73-2',signal:'Danger',haz:['Corrosive'],rev:'Rev 3 · Dec 2025',ppe:'Goggles, nitrile gloves',store:'Dry, tightly closed, away from acids'},
    {chem:'Acetic Acid (Glacial)',cas:'64-19-7',signal:'Danger',haz:['Flammable','Corrosive'],rev:'Rev 2 · Feb 2026',ppe:'Goggles, butyl gloves, fume hood',store:'Flammables cabinet'},
    {chem:'Ammonia Solution 28–32%',cas:'1336-21-6',signal:'Danger',haz:['Corrosive','Environmental'],rev:'Rev 2 · Nov 2025',ppe:'Goggles, nitrile gloves, fume hood',store:'Cool, ventilated, away from acids'},
    {chem:'Potassium Permanganate',cas:'7722-64-7',signal:'Danger',haz:['Oxidiser','Harmful','Environmental'],rev:'Rev 1 · Oct 2025',ppe:'Goggles, nitrile gloves',store:'Away from reducing agents'},
    {chem:'Silver Nitrate',cas:'7761-88-8',signal:'Danger',haz:['Oxidiser','Corrosive','Environmental'],rev:'Rev 2 · Sep 2025',ppe:'Goggles, nitrile gloves',store:'Dark bottle, away from light'},
    {chem:'Potassium Dichromate',cas:'7778-50-9',signal:'Danger',haz:['Oxidiser','Toxic','Carcinogen','Environmental'],rev:'Rev 3 · Aug 2025',ppe:'Respirator, goggles, nitrile gloves',store:'Locked toxics cabinet'},
  ];

  /* documents: give each a status, revision and owner */
  DATA.docs.cards.forEach((c,i)=>{ c.status=c.status||(i%5===3?'In Review':'Approved'); c.rev=c.rev||('Rev '+(1+(i%4))); c.owner=c.owner||pk(['QC Manager','Lab Supervisor','QA Head']); });

  /* review queue: tag the seeded urea items and add hydrogen-peroxide ones */
  DATA.inReview.forEach(r=>{ r.route=r.route||'urea'; });
  (DATA.labByStream.h2o2||[]).slice(0,6).forEach((c,i)=>{
    DATA.inReview.push({id:'HP-'+(2610+i*3), area:c.t, plant:'Hydrogen Peroxide', status:pk(['In Review','Pending','Analyzing']),
      pending:rnd(2,6), logged:`${rnd(12,18)} May ${pad2(rnd(6,20))}:${pad2(rnd(0,59))}`, analyst:pk(people), route:'h2o2', ci:i});
  });

  /* result-entry state per stream, keyed by worksheet index */
  DATA.labResults={};
  DATA.tasks=[];

  /* customers (sample set as exported from SAP) with their CoA format */
  DATA.customers=[
    {id:'C-100045',name:'Nishat Mills',source:'SAP',sap:'100045',contact:'qa@nishat.example',product:'Textox 50% Textile',coa:'Descon standard',fields:'PO no., customer product code'},
    {id:'C-100118',name:'Engro Polymer',source:'SAP',sap:'100118',contact:'supplier.quality@engro.example',product:'H2O2 50% Technical',coa:'Customer format',fields:'PO no., material code, shelf life'},
    {id:'C-100230',name:'Packages Ltd',source:'SAP',sap:'100230',contact:'qc@packages.example',product:'H2O2 50% Technical',coa:'Descon standard',fields:'PO no.'},
    {id:'C-100307',name:'Shan Foods',source:'SAP',sap:'100307',contact:'quality@shan.example',product:'Aseptox 35% Food Grade',coa:'Customer format',fields:'PO no., food-grade statement, heavy metals'},
    {id:'C-100412',name:'Interloop',source:'SAP',sap:'100412',contact:'chem.qa@interloop.example',product:'Textox 50% Textile',coa:'Descon standard',fields:'PO no., lot no.'},
    {id:'C-100509',name:'Nestle Pakistan',source:'SAP',sap:'100509',contact:'supplier.qa@nestle.example',product:'Aseptox 35% Food Grade',coa:'Customer format',fields:'PO no., material code, food-grade statement, shelf life'},
    {id:'C-200001',name:'Internal transfer',source:'Manual',sap:'',contact:'stores@descon.com',product:'Any',coa:'Descon standard',fields:'Transfer note no.'},
  ];

  /* clock in / out records (today) */
  const today=fmtDate();
  DATA.attendance=[
    {id:'ATT-1',user:'NASEER AHMED',shift:'Morning',in:today+' 05:56',out:'',method:'Lab tablet'},
    {id:'ATT-2',user:'RIZWAN ALI',shift:'Morning',in:today+' 06:02',out:'',method:'QR · mobile'},
    {id:'ATT-3',user:'VANIZA',shift:'Morning',in:today+' 06:04',out:'',method:'Lab tablet'},
    {id:'ATT-4',user:'SHARJEEL TAHIR',shift:'Morning',in:today+' 06:10',out:'',method:'Web'},
    {id:'ATT-5',user:'IMRAN YOUSAF',shift:'Morning',in:today+' 05:48',out:'',method:'Lab tablet'},
  ];
  DATA.pins={};   /* userId -> hashed 4-digit PIN for profile switching, set on first use */
  DATA.devices=[];/* phones linked to people on their first QR scan */
})();

/* ---------- persistence ---------- */
const PERSIST = {
  users:()=>DATA.users, equipment:()=>DATA.equipment, shiftlog:()=>DATA.shiftlog, activity:()=>DATA.activity,
  registry:()=>DATA.registry, specs:()=>DATA.specs, inReview:()=>DATA.inReview, qualityRecords:()=>DATA.qualityRecords,
  notifications:()=>DATA.notifications, batches:()=>DATA.batches, coas:()=>DATA.coas, capas:()=>DATA.capas,
  extAudits:()=>DATA.extAudits, roster:()=>DATA.roster, glass:()=>DATA.glass, vendors:()=>DATA.vendors, msds:()=>DATA.msds,
  labResults:()=>DATA.labResults, tasks:()=>DATA.tasks,
  customers:()=>DATA.customers, attendance:()=>DATA.attendance, pins:()=>DATA.pins, devices:()=>DATA.devices, pasSheets:()=>DATA.pasSheets,
  docsCards:()=>DATA.docs.cards, chemRows:()=>DATA.chem.rows, specialRows:()=>DATA.special.rows, isoTable:()=>DATA.iso.table,
};
const APPLY = {
  docsCards:v=>DATA.docs.cards=v, chemRows:v=>DATA.chem.rows=v, specialRows:v=>DATA.special.rows=v, isoTable:v=>DATA.iso.table=v,
};
let _late = {}; /* parts owned by scripts that load later (files, outlook, integrations) */
(function hydrate(){
  let saved=null;
  try{ saved=JSON.parse(localStorage.getItem(STORE_KEY)||'null'); }catch(e){ saved=null; }
  if(!saved||!saved.data) return;
  Object.entries(saved.data).forEach(([k,v])=>{
    if(v==null) return;
    if(APPLY[k]) APPLY[k](v);
    else if(PERSIST[k]) DATA[k]=v;
  });
  _late = saved.late||{};
})();
/* one-time upgrade: Hydrogen Peroxide worksheets 4+ are now the TD-3-004 plant points */
(function pasUpgrade(){
  const lr=DATA.labResults=DATA.labResults||{};
  if(lr._pas!==1){ if(lr.h2o2) Object.keys(lr.h2o2).forEach(k=>{ if(+k>=3) delete lr.h2o2[k]; }); lr._pas=1; }
  if(typeof PAS_SEED!=='undefined'){ DATA.pasSheets=DATA.pasSheets||{}; PAS_SEED.forEach(s=>{ if(!DATA.pasSheets[s.date]) DATA.pasSheets[s.date]=JSON.parse(JSON.stringify(s)); }); }
  if(typeof PAS_TPL!=='undefined'&&DATA.specs&&!DATA.specs.some(x=>x.method==='TD-3-004')){
    PAS_TPL.grids.forEach(g=>g.rows.forEach(r=>{ const p=parseSpec(r[2]); if(!p) return;
      DATA.specs.push({id:'SPEC-'+(201+DATA.specs.length), stream:(PAS_TPL.sections.find(s=>s.id===g.sec)||{}).t, point:g.t, parameter:r[0], unit:r[1],
        lo:p.lo!=null?String(p.lo):'—', hi:p.hi!=null?String(p.hi):'—', alo:'—', ahi:'—', method:'TD-3-004', limit:r[2], status:'Approved'}); }));
  }
})();
function persist(){
  try{
    const data={}; Object.entries(PERSIST).forEach(([k,f])=>data[k]=f());
    const late={};
    if(typeof FILES!=='undefined') late.files=FILES.tree;
    if(typeof OUTLOOK!=='undefined') late.outlook={connected:OUTLOOK.connected,lists:OUTLOOK.lists,reportTypes:OUTLOOK.reportTypes,prefs:OUTLOOK.prefs,drafts:OUTLOOK.drafts||[],sent:OUTLOOK.sent||[]};
    if(typeof MS_INTEGRATIONS!=='undefined') late.integrations=MS_INTEGRATIONS.map(a=>({id:a.id,status:a.status}));
    localStorage.setItem(STORE_KEY,JSON.stringify({v:2,saved:Date.now(),data,late}));
  }catch(e){ /* storage full or blocked: the app keeps working in memory */ }
}
let _persistT=null;
function persistSoon(){ clearTimeout(_persistT); _persistT=setTimeout(persist,250); }
function resetAllData(){
  confirmModal('Reset all data','This restores every module to its original sample data and signs you out. Records you created will be removed.',()=>{
    try{ localStorage.removeItem(STORE_KEY); localStorage.removeItem(SESSION_KEY); }catch(e){}
    location.reload();
  },'Reset data','danger');
}
function exportAllData(){
  persist();
  let raw='{}'; try{ raw=localStorage.getItem(STORE_KEY)||'{}'; }catch(e){}
  downloadFile('descon-assure-backup-'+fmtDate().replace(/ /g,'-')+'.json', raw, 'application/json');
  audit('Exported backup','Settings','Full data export (JSON)');
  toast('Backup downloaded','ok');
}

/* late hydration for files / outlook / integrations, before the first render */
document.addEventListener('DOMContentLoaded',()=>{
  if(_late.files && typeof FILES!=='undefined') FILES.tree=_late.files;
  if(typeof OUTLOOK!=='undefined'){
    if(_late.outlook) Object.assign(OUTLOOK,_late.outlook);
    OUTLOOK.drafts=OUTLOOK.drafts||[]; OUTLOOK.sent=OUTLOOK.sent||[];
  }
  if(_late.integrations && typeof MS_INTEGRATIONS!=='undefined'){
    _late.integrations.forEach(s=>{ const a=MS_INTEGRATIONS.find(x=>x.id===s.id); if(a) a.status=s.status==='connecting'?'connected':s.status; });
  }
  if(SESSION && typeof OUTLOOK!=='undefined') OUTLOOK.account={name:SESSION.name,email:SESSION.email};
  if(PREFS.dark) document.body.classList.add('dark');
  window.addEventListener('beforeunload',persist);
});
