/* ===== Plant Analysis Sheet · TD-3-004 Issue-19 (Descon Oxychem daily lab sheet) =====
   One template drives three things:
   1. the Result Entry worksheets for the Hydrogen Peroxide stream (one per sampling point)
   2. the Plant Sheet view (the day's sheet, built from Result Entry)
   3. the Excel importer (every value is read from the same cell as on the paper sheet)
   Rows: [parameter, unit, range as printed on the sheet, cells (one per time slot) | {pairs:[[timeCell,valueCell],…]}] */
const PAS_SLOTS_2H=['1600','1800','2000','2200','0000','0200','0400','0600','0800','1000','1200','1400'];
const PAS_OLD=['I','K','M','O','Q','S','U','W','Y','AA','AC','AE'], PAS_NEW=['J','L','N','P','R','T','V','X','Z','AB','AD','AF'];
const PAS_TPL={
  code:'TD-3-004', issue:'Issue-19', title:'Plant Analysis Sheet',
  dateCell:'AD4', titleCell:'G2', codeCell:'AC1',
  to:'Operational Manager',
  cc:['Works Manager','Production Manager','Technical Manager','Engineering Manager','Shift Engineers','Lab File'],
  shifts:[{k:'E',l:'Evening shift',from:'1600'},{k:'N',l:'Night shift',from:'0000'},{k:'M',l:'Morning shift',from:'0800'}],
  sections:[
    {id:'h2',t:'Hydrogen Plant'},
    {id:'hp',t:'H2O2 Plant'},
    {id:'prod',t:'Product & Packing'},
    {id:'water',t:'Water & Utilities'},
  ],
  grids:[
    /* ---------- Hydrogen plant ---------- */
    {id:'ref',sec:'h2',t:'Reformer outlet',note:'% mole, dry',cols:['1000'],rows:[
      ['Ar + O2','% mol','—',['C8']],['N2','% mol','0.8 - 2',['C9']],['CH4','% mol','2 - 3.5',['C10']],['CO','% mol','9 - 13',['C11']],
      ['CO2','% mol','9 - 13',['C12']],['H2','% mol','71 - 74',['C13']],['Steam / dry gas ratio','','> 3.0',['C14']]]},
    {id:'htsc',sec:'h2',t:'HTSC outlet',note:'% mole, dry',cols:['1000'],rows:[
      ['Ar + O2','% mol','—',['E8']],['N2','% mol','0.8 - 2',['E9']],['CH4','% mol','2 - 3.5',['E10']],['CO','% mol','3 - 5.5',['E11']],
      ['CO2','% mol','14 - 16.5',['E12']],['H2','% mol','74 - 76',['E13']]]},
    {id:'psa',sec:'h2',t:'H2 product · PSA outlet',cols:['0800'],rows:[
      ['Ar + O2','%','Max 0.1',['H8']],['N2','%','Max 0.1',['H9']],['CH4','ppm','Max 20',['H10']],['CO','ppm','Max 3',['H11']],
      ['CO2','ppm','Max 10 (CO + CO2)',['H12']],['H2','%','Min 99.90',['H13']]]},
    {id:'ng',sec:'h2',t:'Natural gas feed',cols:['Sample'],rows:[
      ['N2','% mol','1 - 8',['C17']],['CO2','% mol','1 - 2',['D17']],['CH4','% mol','> 85',['E17']],['C2H6','% mol','< 8',['F17']],
      ['C3H8','% mol','< 2',['G17']],['i-C4','% mol','< 0.1',['H17']],['n-C4','% mol','< 0.1',['I17']],['i-C5','% mol','< 0.1',['J17']],
      ['n-C5','% mol','< 0.1',['K17']],['C6','% mol','< 0.5',['L17']],['HHV','Btu/ft3','—',['M17']],['LHV','Btu/ft3','—',['N17']]]},
    /* ---------- H2O2 plant ---------- */
    {id:'hyd',sec:'hp',t:'Hydrogenator off-gas',cols:['1600'],rows:[
      ['N2','%','5 - 15',['L9']],['CH4','ppm','Max 20',['L10']],['CO','ppm','Max 2.0',['L11']],['CO2','ppm','< 500',['L12']],['H2','%','—',['L13']]]},
    {id:'x3011o',sec:'hp',t:'3011 F · Extraction bottom outlet (Old)',point:'3011 F',line:'Old',cols:PAS_SLOTS_2H,rows:[
      ['H2O2','% w/w','30 - 40',PAS_OLD.map(c=>c+'21')],['pH','','2.0 - 3.0',PAS_OLD.map(c=>c+'22')],['Color','APHA','20 max',PAS_OLD.map(c=>c+'23')]]},
    {id:'x3011n',sec:'hp',t:'3011 F · Extraction bottom outlet (New)',point:'3011 F',line:'New',cols:PAS_SLOTS_2H,rows:[
      ['H2O2','% w/w','30 - 40',PAS_NEW.map(c=>c+'21')],['pH','','2.0 - 3.0',PAS_NEW.map(c=>c+'22')],['Color','APHA','20 max',PAS_NEW.map(c=>c+'23')]]},
    {id:'ox2042',sec:'hp',t:'2042 · Oxidation feed cooler outlet',point:'2042',cols:['1600','0000','0800'],rows:[
      ['RWS test level','g/L','8 - 12',['I24','Q24','Y24']]]},
    {id:'ox2063',sec:'hp',t:'2063 · Oxidation degasser outlet',point:'2063',cols:['1600','0000','0800'],rows:[
      ['OWS test level','g/L','7.25 - 11.8',['I25','Q25','Y25']]]},
    {id:'ws1025',sec:'hp',t:'1025 / 1021 · WS cooler outlet',point:'1025 / 1021',cols:['1600','0000','0800'],rows:[
      ['H2O2','g/L','0.40 max',['I26','Q26','Y26']]]},
    {id:'ws',sec:'hp',t:'Working solution',cols:['0800'],rows:[
      ['Ar. solvent','%','69.5 - 72',['C29']],['TOP','%','2.0 - 3.0',['C30']],['TBU','%','26 - 28.5',['C31']],['EAQ','g/L','30 - 60',['C32']],
      ['H4EAQ','g/L','90 - 120',['C33']],['Epoxide','g/L','< 8.0',['C34']],['Active quinone','g/L','143 - 146',['C35']],
      ['Sp. gravity @ 25 °C','','0.92 - 0.93',['C36']],['pH','','3.5 - 5.0',['C37']]]},
    {id:'wsm',sec:'hp',t:'Working solution · moisture',cols:['1600','0000','0800','2000','0400','1200'],rows:[
      ['Moisture','%','0.21 - 0.30',{pairs:[39,40,41,42,43,44].map(r=>['B'+r,'C'+r])}]]},
    {id:'tg',sec:'hp',t:'Concentration · Technical grade',cols:['1600','0000','0800'],rows:[
      ['H2O2','%','60 max',['F31','F32','F33']],['pH','','0 - 2.0',['G31','G32','G33']],['Color','APHA','50 max',['H31','H32','H33']],
      ['TOC','ppm','300 max',['I31','I32','I33']],['PO4','ppm','200 max',['J31','J32','J33']],['NO3','ppm','125 max',['K31','K32','K33']]]},
    {id:'cg',sec:'hp',t:'Concentration · Chemical grade',cols:['1600','0000','0800'],rows:[
      ['H2O2','%','60 max',['F39','F40','F41']],['pH','','0 - 3.5',['G39','G40','G41']],['Color','APHA','20 max',['H39','H40','H41']],
      ['TOC','ppm','100 max',['I39','I40','I41']],['PO4','ppm','—',['J39','J40','J41']],['NO3','ppm','—',['K39','K40','K41']]]},
    /* ---------- Product & packing ---------- */
    {id:'jerry',sec:'prod',t:'Jerry can testing',cols:['Evening','Night','Morning'],rows:[
      ['Lot #','','',['AC31','AD31','AE31']],['Weight','','',['AC32','AD32','AE32']],['Color','','',['AC33','AD33','AE33']],
      ['Stack test · can #1','','',['AC34','AD34','AE34']],['Stack test · can #2','','',['AC35','AD35','AE35']],['Drop & leak test','','',['AF31','AG31','AH31']]]},
    /* ---------- Water & utilities ---------- */
    {id:'bd',sec:'water',t:'Boiler blow down',cols:['1600','0000','0800'],rows:[
      ['pH','','10.5 - 11.5',['R8','S8','T8']],['Conductivity','µS/cm','—',['R9','S9','T9']],['TDS','ppm','500 - 2000',['R10','S10','T10']],
      ['PO4','ppm','6 - 25',['R11','S11','T11']],['P-Alk','ppm','—',['R12','S12','T12']],['M-Alk','ppm','350 max',['R13','S13','T13']],['2P-M Alk','ppm','> 0',['R14','S14','T14']]]},
    {id:'bbd',sec:'water',t:'BBD · H2 plant',cols:['0800'],rows:[
      ['pH','','10 - 11',['V8']],['Conductivity','µS/cm','—',['V9']],['TDS','ppm','< 500',['V10']],['PO4','ppm','5 - 15',['V11']],
      ['P-Alk','ppm','5 - 50',['V12']],['M-Alk','ppm','350 max',['V13']],['2P-M Alk','ppm','> 0',['V14']]]},
    {id:'bfw',sec:'water',t:'BFW · Boiler',cols:['1600','0000','0800'],rows:[
      ['pH','','8.5 - 9.5',['X8','Y8','Z8']],['Conductivity','µS/cm','Max 50',['X9','Y9','Z9']],['TDS','ppm','—',['X10','Y10','Z10']],['PO4','ppm','—',['X11','Y11','Z11']]]},
    {id:'bfwh',sec:'water',t:'BFW · H2 plant',cols:['0800'],rows:[
      ['pH','','8.5 - 9.5',['AA8']],['Conductivity','µS/cm','Max 50',['AA9']],['TDS','ppm','—',['AA10']],['PO4','ppm','—',['AA11']]]},
    {id:'dw',sec:'water',t:'D/W storage',cols:['1600','0000','0800'],rows:[
      ['pH','','7 ± 1.0',['AC8','AD8','AE8']],['Conductivity','µS/cm','Max 1.0',['AC9','AD9','AE9']],['TDS','ppm','—',['AC10','AD10','AE10']],['SiO2','ppb','20 max',['AC11','AD11','AE11']]]},
    {id:'sc',sec:'water',t:'Steam condensate',cols:['H2O2 plant','H2 plant'],rows:[
      ['pH','','8.5 min',['AG8','AH8']],['Conductivity','µS/cm','—',['AG9','AH9']],['TDS','ppm','10 max',['AG10','AH10']],['H2O2','ppm','20 max',['AG11','AH11']]]},
    {id:'cw',sec:'water',t:'Cooling water',cols:['1600','0000','1000'],rows:[
      ['pH','','7.8 - 8.2',['X15','X16','X17']],['Conductivity','µS/cm','2300 - 3200',['Y15','Y16','Y17']],['M-Alk','ppm','120 - 200',['Z15','Z16','Z17']],
      ['CaH','ppm','220 - 350',['AA15','AA16','AA17']],['O-PO4','ppm','3.0 - 6.0',['AB15','AB16','AB17']],['Free Cl2','ppm','0.3 - 0.5',['AC15','AC16','AC17']],
      ['Zinc','ppm','0.5 - 1.5',['AD15','AD16','AD17']],['Turbidity','NTU','< 40',['AE15','AE16','AE17']]]},
    {id:'chw',sec:'water',t:'Chilled water',cols:['1600','0000','1000'],rows:[
      ['pH','','8.5 - 10.0',['AF15','AF16','AF17']],['TDS','ppm','< 2000',['AG15','AG16','AG17']],['Nitrite','ppm','400 - 550',['AH15','AH16','AH17']]]},
  ],
  /* lists on the sheet (one line per entry) */
  logs:[
    {id:'tanks',sec:'prod',t:'Product tanks',from:30,to:43,sets:[['L','M','N','O','P'],['Q','R','S','T','U']],
      fields:[['tank','Tank #','int'],['time','Time','time'],['h2o2','H2O2 %'],['ph','pH'],['color','Color (APHA)']]},
    {id:'cans',sec:'prod',t:'Filled cans',from:29,to:40,sets:[['V','W','X']],
      fields:[['time','Time','time'],['tank','Tank #','int'],['h2o2','H2O2 %']]},
    {id:'stab',sec:'prod',t:'16 hr stability',from:29,to:33,sets:[['Y','Z','AA']],
      fields:[['time','Time','time'],['tank','Tank #','int'],['result','Result %']]},
    {id:'checks',sec:'prod',t:'Sample checks',from:37,to:40,sets:[['AB','AD','AE','AF']],
      fields:[['sample','Sample'],['time','Time','time'],['ph','pH'],['cond','Cond. µS/cm']]},
    {id:'tanker',sec:'water',t:'Raw material tankers',from:16,to:17,sets:[['O','P','Q','R','S','T','U','V']],
      fields:[['ref','Tanker / step #'],['hno3','HNO3 %'],['caustic','Caustic %'],['methanol','Methanol %'],['temp','Temp °C'],['density','Density'],['h3po4','H3PO4 %'],['h2o2','H2O2 %']]},
  ],
};

/* ---------- reading a sheet (works on xlrd/SheetJS cell values) ---------- */
function pasNorm(v, kind){
  if(v==null) return '';
  if(typeof v==='number'){
    if(kind==='time') return String(Math.round(v)).padStart(4,'0');
    if(kind==='int') return String(Math.round(v));
    return String(+v.toFixed(4));
  }
  let s=String(v).replace(/\s+/g,' ').trim();
  if(/^[-–—]+$/.test(s)) return '';
  if(kind==='time'&&/^\d{1,4}(\.0+)?$/.test(s)) return String(parseInt(s,10)).padStart(4,'0');
  return s;
}
function pasIso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function pasDate(v, fileName){
  if(v instanceof Date&&!isNaN(v)) return pasIso(v);
  if(typeof v==='number'&&v>20000&&v<80000){ const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*86400000); return d.toISOString().slice(0,10); }
  const s=String(v||'');
  let m=s.match(/(\d{4})-(\d{2})-(\d{2})/); if(m) return m[0];
  m=s.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)||String(fileName||'').match(/(\d{1,2})[-/._](\d{1,2})[-/._](\d{4})/);
  if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; /* Descon writes day-month-year */
  return null;
}
/* is this the TD-3-004 sheet? */
function pasLooksRight(get){
  const t=String(get(PAS_TPL.titleCell)||'')+' '+String(get(PAS_TPL.codeCell)||'');
  return /plant\s*analysis\s*sheet/i.test(t)||/TD-3-004/i.test(t);
}
/* get(addr) returns the raw cell value. Returns {date, grids:{id:{'row-col':value}}, logs:{id:[{field:value}]}} */
function pasParse(get, fileName){
  const out={date:pasDate(get(PAS_TPL.dateCell),fileName), grids:{}, logs:{}};
  PAS_TPL.grids.forEach(g=>{
    const vals={};
    g.rows.forEach((r,ri)=>{
      const src=r[3];
      if(Array.isArray(src)) src.forEach((a,cx)=>{ if(!a) return; const v=pasNorm(get(a)); if(v!=='') vals[ri+'-'+cx]=v; });
      else if(src&&src.pairs) src.pairs.forEach(([ta,va])=>{ const t=pasNorm(get(ta),'time'), v=pasNorm(get(va)); const cx=g.cols.indexOf(t); if(cx>=0&&v!=='') vals[ri+'-'+cx]=v; });
    });
    out.grids[g.id]=vals;
  });
  PAS_TPL.logs.forEach(l=>{
    const rows=[];
    l.sets.forEach(set=>{ for(let r=l.from;r<=l.to;r++){
      const o={}; let any=false;
      l.fields.forEach((f,i)=>{ const v=pasNorm(get(set[i]+r),f[2]); o[f[0]]=v; if(v!=='') any=true; });
      if(any) rows.push(o);
    }});
    out.logs[l.id]=rows;
  });
  return out;
}
function pasCount(grids){ return Object.values(grids||{}).reduce((n,g)=>n+Object.keys(g).length,0); }

if(typeof module!=='undefined') module.exports={PAS_TPL,pasParse,pasNorm,pasDate,pasLooksRight,pasCount};

/* ---------- wire into the app ---------- */
if(typeof DATA!=='undefined'&&DATA.labByStream){
  /* finished-product worksheets stay first (batches and CoAs use them); the plant points come from TD-3-004 */
  const product=DATA.labByStream.h2o2.slice(0,3).map(c=>Object.assign(c,{sec:'Finished product'}));
  const secName=id=>(PAS_TPL.sections.find(s=>s.id===id)||{}).t;
  DATA.labByStream.h2o2=product.concat(PAS_TPL.grids.map(g=>({id:'pas-'+g.id, pas:g.id, sec:secName(g.sec), t:g.t, cols:g.cols, rows:g.rows.map(r=>[r[0],r[1],r[2]])})));
  DATA.pasSheets={};
  (typeof PAS_SEED!=='undefined'?PAS_SEED:[]).forEach(s=>{ DATA.pasSheets[s.date]=JSON.parse(JSON.stringify(s)); });
}
