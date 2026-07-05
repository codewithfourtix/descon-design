/* ============ AILAB Clone — Mock Data ============ */
const DATA = {};

/* ---- Sidebar nav (grouped, standard-LIMS information architecture) ---- */
DATA.nav = [
  {id:'site', label:'Overview', icon:'layout-dashboard'},

  {header:'Plant Streams', collapsible:true},
  {subhead:'Descon Oxychem'},
  {id:'h2o2',    label:'Hydrogen Peroxide',   icon:'droplets',  product:true},
  {id:'urea',    label:'Urea Status',         icon:'sheet',     product:true},

  {header:'Quality & Compliance', collapsible:true},
  {id:'iso',   label:'Nonconformities & CAPA', icon:'clipboard-check'},
  {id:'specs', label:'Specifications',         icon:'ruler'},
  {id:'docs',  label:'Documents & SOPs',       icon:'folder'},

  {header:'Inventory & Instruments', collapsible:true},
  {id:'chemicals', label:'Reagents & Chemicals',     icon:'flask-conical'},
  {id:'equip',     label:'Instruments & Calibration', icon:'settings-2'},
  {id:'registry',  label:'Sample Register',          icon:'database'},

  {header:'Operations', collapsible:true},
  {id:'shift',    label:'Shift Scheduling', icon:'calendar-days'},
  {id:'shiftlog', label:'Shift Handover',   icon:'clipboard-list'},
  {id:'ai',       label:'Assistant',        icon:'sparkles'},

  {header:'Administration', collapsible:true},
  {id:'users',   label:'Users & Roles', icon:'users'},
  {id:'logs',    label:'Audit Trail',   icon:'history'},
  {id:'profile', label:'Settings',      icon:'settings'},
];

/* ---- Stream workspace tabs (standard sample-to-CoA workflow) ---- */
DATA.subtabs = [
  {id:'dashboard', label:'Dashboard',         icon:'layout-grid'},
  {id:'labsheet',  label:'Result Entry',      icon:'clipboard-pen-line'},
  {id:'wpp',       label:'Finished Goods',    icon:'package'},
  {id:'quality',   label:'Quality & OOS',     icon:'bar-chart-3'},
  {id:'coa',       label:'Certificate (CoA)', icon:'file-check-2'},
  {id:'special',   label:'Non-Routine',       icon:'flask-round'},
];

/* ---- Product Dashboard (page 2) ---- */
DATA.dash = {
  kpis:[
    {l:'Compliance Rate', v:'24.6%', i:'bar-chart-2'},
    {l:'Total Samples',   v:'130',   i:'flask-conical'},
    {l:'Routine Samples', v:'65',    i:'repeat'},
    {l:'Non-Routine',     v:'65',    i:'triangle-alert'},
    {l:'In Review',       v:'62',    i:'flask-round'},
    {l:'Completed',       v:'44',    i:'circle-check'},
    {l:'Pending Samples', v:'24',    i:'clock'},
    {l:'Off Spec',        v:'1',     i:'triangle-alert'},
    {l:'Rejection Rate',  v:'25.5%', i:'x-circle'},
  ],
  shift:{
    cols:['General','Morning','Evening','Night'],
    icons:['bar-chart','sun','sunset','star'],
    rows:[
      {k:'Planned',   v:[20,15,8,22], c:'ink'},
      {k:'Completed', v:[12,10,8,11], c:'green'},
      {k:'On-Time',   v:[6,5,2,3],    c:'green'},
      {k:'Late',      v:[6,5,6,8],    c:'amber'},
      {k:'Missed',    v:[0,0,0,0],    c:'red'},
      {k:'Shift Compliance', v:['30%','33.3%','25%','13.6%'], c:'red', bold:true},
    ]
  },
  top10:[
    {n:'Purified process condensate', v:12},
    {n:'Urea Product From Plant', v:12},
    {n:'Urea Product From PH&S', v:11},
    {n:'Evaporator                    Condenser', v:11},
    {n:'Feed CO2', v:8},
    {n:'H2 Converter outlet', v:7},
    {n:'Pool Reactor', v:7},
    {n:'Stripper', v:6},
    {n:'Ammonia Condensate Water tank', v:6},
    {n:'Condensate Water', v:5},
  ],
  trendLabels:['12 May 07:30','13 May 07:30','14 May 07:30','15 May 07:30','16 May 07:30','17 May 07:30'],
  trend:[
    {name:'Hydrogen', color:'#22b8cf', data:[1,1,1,2,1,1]},
    {name:'Nitrogen', color:'#7c6bf5', data:[96,97,95,98,99,97]},
    {name:'Ar+O2',    color:'#f5a623', data:[3,3,2,3,3,2]},
    {name:'CH4',      color:'#e64980', data:[45,46,44,42,92,10]},
    {name:'CO2',      color:'#f76707', data:[2,2,3,2,2,2]},
    {name:'Water',    color:'#20c997', data:[1,1,1,1,1,1]},
  ]
};

/* ---- Site Dashboard (page 10) ---- */
DATA.site = {
  kpis:[
    {l:'Safety Incidents', v:'158',   i:'shield-alert'},
    {l:'Total Samples',    v:'11371', i:'flask-conical'},
    {l:'Routine Samples',  v:'11267', i:'repeat'},
    {l:'Non-Routine',      v:'104',   i:'triangle-alert'},
    {l:'In Review',        v:'79',    i:'flask-round'},
    {l:'Completed',        v:'7523',  i:'circle-check'},
    {l:'Pending Samples',  v:'3769',  i:'clock'},
    {l:'Off Spec',         v:'1147',  i:'triangle-alert'},
    {l:'Rejection Rate',   v:'20.6%', i:'x-circle'},
  ],
  shift:{
    cols:['General','Morning','Evening','Night'],
    icons:['bar-chart','sun','sunset','star'],
    rows:[
      {k:'Planned',   v:[744,3102,2729,4692], c:'ink'},
      {k:'Completed', v:[496,2031,1828,3143], c:'green'},
      {k:'On-Time',   v:[151,968,762,1496],   c:'green'},
      {k:'Late',      v:[345,1063,1066,1647], c:'amber'},
      {k:'Missed',    v:[0,15,1,19],          c:'red'},
      {k:'Shift Compliance', v:['20.3%','31.2%','27.9%','31.9%'], c:'red', bold:true},
    ]
  },
  topPerf:[{n:'AN/CAN-Lab-01',v:'0%'},{n:'OU-Lab-01',v:'0%'}],
  concern:[
    {n:'AN/CAN-Lab-01',v:'0%',s:'202 missed'},
    {n:'OU-Lab-01',v:'0%',s:'377 missed'},
    {n:'Ammonia-Lab-01',v:'0%',s:'120 missed'},
    {n:'Nitric Acid-Lab-01',v:'0%',s:'318 missed'},
  ],
  testVolLabels:['Apr 2','Apr 8','Apr 14','Apr 20','Apr 26','May 2','May 8','May 14'],
  testVol:[
    {name:'Morning', color:'#20c997', data:[10,10,10,505,505,505,500,10]},
    {name:'Evening', color:'#f59f00', data:[8,8,8,110,110,110,108,8]},
    {name:'Night',   color:'#fab005', data:[6,6,6,105,105,105,104,6]},
  ],
  plantDonut:{labels:['OU','NP','CAN','UREA','Ammonia','Nitric Acid'],
    data:[6721,5358,4841,3290,2632,2068],
    colors:['#0060b0','#4c6ef5','#7c6bf5','#f5a623','#f59f00','#e8590c']},
  shiftDonut:{labels:['Morning','Evening','Night'],
    data:[63,14,4],colors:['#0060b0','#f5a623','#7c6bf5']},
};

/* ---- Lab sheet (page 3) ---- */
DATA.lab = {
  actions:['Reset Values','Mark Missed','Approve & Submit'],
  cards:[
    {t:'Urea Product From PH&S (UR-30)', cols:['1000','1800','0000','0200'],
     rows:[['+2.80mm','%',''],['+2.00mm','%',''],['Biuret','%','1.5max'],['+1.00mm','%',''],['+0.50mm','%',''],['Moisture','%','0.5max']]},
    {t:'Evaporator Condenser (UR-100)', cols:['1300','2100','0000','0500'],
     rows:[['pH','n/a','6.5 – 8.5'],['Conductivity','µs/cm','1100–1300'],['TDS','ppm','<1000']]},
    {t:'Ammonia Condensate Water tank (UR15)', cols:['0000','0500'],
     rows:[['CO2','%','2.0max'],['Temperature','°c',''],['Urea','%','0.9–1.8'],['Density','gm/ml',''],['Fe','ppm',''],['NH3','%','6.8max']]},
    {t:'Purified process condensate (UR17)', cols:['1300','2100','0500'],
     rows:[['Conductivity','µs/cm','30max'],['pH','',''],['Ammonia','ppm','3max'],['Urea','ppm','3max']]},
    {t:'Condensate Water (UR-80)', cols:['1300','0000'],
     rows:[['pH','n/a','9.5 to 10'],['Conductivity','µs/cm','15 to 40'],['NH3','ppm','Nil'],['Ammonia','ppm',''],['DO','ppb','<10'],['Silica','ppb','500 to 700']]},
    {t:'Feed CO2 (UR02)', cols:['0730','0000'],
     rows:[['CH4','%','Nil'],['Ar+O2','%','0.4max'],['Hydrogen','%','0.5–0.9'],['Water','%','5.8–9.9'],['Nitrogen','%','0.2max'],['CO2','%','96.0– 98.0']]},
    {t:'H2 Converter outlet (UR03)', cols:['0730','0000'],
     rows:[['CH4','%',''],['Hydrogen','ppm','50 max ppm'],['Ar+O2','%','3.6max'],['Moisture','%','3.1–4.5'],['Nitrogen','%','0.25–0.4'],['CO2','%','95–98']]},
    {t:'Pool Reactor (UR04)', cols:['0700','0000'],
     rows:[['Biuret','%','0.3 max'],['Urea','%','30–33'],['NH3','%','29.5– 31.5'],['Fe','ppm',''],['CO2','%','17– 19.5'],['Nickle','ppb','']]},
    {t:'Stripper (UR05)', cols:['0700','0000'],
     rows:[['Biuret','%','0.4max'],['Urea','%','52–54'],['NH3','%','8–10'],['Fe','ppm',''],['CO2','%','9–11'],['Nickle','ppb','']]},
    {t:'Urea Product From Plant (UR27)', cols:['1300','2100','0000','0500'],
     rows:[['+2.40mm','%',''],['-0.50mm','%',''],['Avg Crush Strength','gms',''],['Moisture','%','0.5max'],['+1.40mm','%',''],['Fe','ppm','']]},
    {t:'Cooling Water (OU-146)', cols:[],
     rows:[['pH','n/a','7.8 – 8.2'],['Ammonia','ppm','1 max']]},
    {t:'Urea Solution Tank (UR10)', cols:[],
     rows:[['Urea','%','70–73'],['Density','gm/ml',''],['Fe','ppm',''],['Biuret','%','0.6max'],['Temperature','°c',''],['NH3','%','0.4–0.8']]},
    {t:'Prilling Tower Gas (UR28)', cols:[],
     rows:[['NH3','mg/nm3',''],['Dust','mg/nm3','120 max']]},
    {t:'Lube Oil (UR-62)', cols:[],
     rows:[['Moisture','ppm',''],['Viscosity','cst',''],['Acid Number','mgkoh/g',''],['SS','ppm','']]},
    {t:'Rectifying column (UR06)', cols:[],
     rows:[['NH3','%','1–3.5'],['Urea','%','65–67'],['Fe','ppm','']]},
    {t:'MP Absorber (UR11)', cols:[],
     rows:[['NH3','%','0.46– 0.80']]},
  ]
};

/* ---- Quality Report (page 4) ---- */
DATA.quality = {
  kpis:[
    {l:'Compliance Rate',v:'—',i:'circle-check',s:''},
    {l:'Off-Spec Results',v:'—',i:'triangle-alert',s:''},
    {l:'In Review',v:'—',i:'eye',s:'Pending approval'},
    {l:'Approved',v:'—',i:'circle-check',s:'Reviewed & passed'},
    {l:'Rejected',v:'—',i:'x-circle',s:'Sent back'},
    {l:'Total OOS',v:'13',i:'triangle-alert',s:'+2 from last month'},
    {l:'Critical OOS',v:'3',i:'alert-octagon',s:'Deviation > 30%'},
    {l:'Repeat OOS',v:'2',i:'repeat',s:'Same parameter'},
  ],
  complianceLabels:['May 12','May 13','May 14','May 15','May 16','May 17','May 18'],
  compliance:[95,93,92,94,88,90,97],
  routineLabels:['May 12','May 13','May 14','May 15','May 16','May 17','May 18'],
  routine:[240,235,238,242,215,225,222],
  nonRoutine:[18,14,16,12,20,15,17],
  offspecLabels:['Week 1','Week 2','Week 3','Week 4'],
  offspec:[3,2,5,3],
  deviation:[
    {n:'Chloride',v:1.4},{n:'Biuret',v:1.4},{n:'pH Value',v:1.4},
    {n:'Iron Content',v:2},{n:'Moisture',v:3},
  ]
};

/* ---- Special Samples (page 5) ---- */
DATA.special = {
  kpis:[
    {l:'Total Special Samples',v:'54',i:'flask-round',s:'Registered in system'},
    {l:'New Requests',v:'10',i:'file-plus',s:'18.5% awaiting review'},
    {l:'In Progress',v:'19',i:'clock',s:'35.2% currently active'},
    {l:'Completed',v:'25',i:'circle-check',s:'46.3% completion rate'},
  ],
  rows:[
    [54,'OU','SS-20260518-181','SP-A2F700','18 May 2026 19:44',6,'Results Approved','MUHAMMAD ASIF HANIF'],
    [53,'OU','SS-20260517-965','SP-751C99','17 May 2026 14:12',4,'Completed','VANIZA'],
    [52,'OU','SS-20260517-524','SP-DA488A','18 May 2026 19:40',5,'Completed','NASEER AHMED'],
    [51,'OU','SS-20260517-855','SP-0393FF','17 May 2026 14:05',6,'Request Approved','RIZWAN ALI'],
    [50,'OU','SS-20260516-643','SP-AB8C2C','16 May 2026 18:43',5,'Completed','ABDUL KAREEM'],
    [49,'OU','SS-20260515-290','SP-BBED89','—',5,'Requested','ASHIQ HUSSAIN SHAKAR'],
    [48,'OU','SS-20260515-279','SP-C3E3E2','15 May 2026 12:36',5,'Completed','RAO ASIF SHAKEEL'],
    [47,'OU','SS-20260514-585','SP-DCB0F0','14 May 2026 15:45',6,'Request Approved','SHARJEEL TAHIR'],
    [46,'OU','SS-20260514-779','SP-E9307F','—',5,'Requested','SHAKEEL ABBAS'],
    [45,'OU','SS-20260513-829','SP-91F75F','13 May 2026 18:25',6,'Request Approved','MUHAMMAD HANIF'],
    [44,'OU','SS-20260513-929','SP-CC1D37','13 May 2026 19:27',4,'Completed','MUHAMMAD SHAHZAD'],
    [43,'OU','SS-20260512-424','SP-77E6EB','—',5,'Requested','RAO ASIF SHAKEEL'],
    [42,'OU','SS-20260512-146','SP-DDC102','12 May 2026 19:07',6,'Completed','MOHSIN MAQBOOL'],
  ]
};

/* ---- ISO 17025 Audits (page 6) ---- */
DATA.iso = {
  kpis:[
    {l:'Total Audits',v:'4',i:'clipboard-list',s:'Overall count'},
    {l:'Ongoing Audits',v:'1',i:'refresh-cw',s:'Currently active'},
    {l:'Completed Audits',v:'2',i:'circle-check',s:'Successfully finished'},
    {l:'Open NCs',v:'5',i:'circle-alert',s:'Requires action'},
    {l:'Overdue CAPAs',v:'0',i:'clock',s:'Needs attention'},
    {l:'Compliance Score',v:'91%',i:'shield-check',s:'Average score'},
  ],
  statusDist:[
    {n:'Planned',v:'1 (25%)',c:'#1f2a44',p:25},
    {n:'Ongoing',v:'1 (25%)',c:'#f59f00',p:25},
    {n:'Completed',v:'1 (25%)',c:'#0060b0',p:25},
    {n:'Closed',v:'1 (25%)',c:'#20c997',p:25},
  ],
  clauseNC:[
    {n:'Clause 6.4',v:'1 NC',c:'#4dabf7'},
    {n:'Clause 6.2',v:'1 NC',c:'#f59f00'},
    {n:'Clause 7.5',v:'1 NC',c:'#0060b0'},
    {n:'Clause 8.7',v:'1 NC',c:'#20c997'},
    {n:'Clause 7.2',v:'1 NC',c:'#e64980'},
  ],
  deptRisk:[
    {n:'Quality Control',v:'4 NCs',c:'#e03131',p:100},
    {n:'Analytical Laboratory',v:'2 NCs',c:'#f59f00',p:50},
  ],
  ncStatus:[{n:'Open',v:2,bg:'#fdeaea',c:'#d64545'},{n:'In Progress',v:3,bg:'#fef4e2',c:'#c98110'},{n:'Closed',v:1,bg:'#e6f7f1',c:'#0a9d78'}],
  capaStatus:[{n:'Pending',v:1,bg:'#fef4e2',c:'#c98110'},{n:'Approved',v:2,bg:'#e6f7f1',c:'#0a9d78'},{n:'Revision Req.',v:0,bg:'#fdeaea',c:'#d64545'}],
  table:[
    ['ISO-INT-2025-001','Assessment','Quality Control','AILAB Quality Control','TAJAMMAL RASHID','Jan 15, 2025','Completed','4 NCs','87%'],
    ['ISO-INT-2025-002','Surveillance','Analytical Laboratory','AILAB Analytical Lab','MUHAMMAD ASIF HANIF','Feb 10, 2025','Ongoing','2 NCs','91%'],
  ]
};

/* ---- Chemicals (page 8) ---- */
DATA.chem = {
  kpis:[
    {l:'Total Chemicals',v:'22',i:'triangle-alert',s:'Unique chemicals tracked'},
    {l:'Out of Stock',v:'1',i:'circle-alert',s:'Balance reached zero'},
    {l:'Critical Stock',v:'9',i:'triangle-alert',s:'Below RO Level'},
    {l:'Low Stock',v:'2',i:'circle-alert',s:'Approaching RO Level'},
  ],
  rows:[
    ['CHEM-0009','C1A','1-AMINO-2-NAPHTHOL-4-SULFONIC ACID','grams (GMS)','B-04','2475','1875','600','50',false],
    ['CHEM-0010','C2A','1-NAPHTHYLAMINE 7-SULFONIC ACID','grams (GMS)','B-04','236.5','166.5','70','20',false],
    ['CHEM-0011','C39P','6-PYRIDINEDICARBOXYLIC ACID (DIPICOLINIC','grams (GMS)','B-04','500','50','450','10',false],
    ['CHEM-0012','C3A','ACID)','grams (GMS)','B-04','25','25','0','50',true],
    ['CHEM-0013','C4A','4 AMINO N N DIMETHYLANILINE SULPHATE','grams (GMS)','B-04','225','25','200','10',false],
    ['CHEM-0014','C39H','4-AMINO ANTIPYRINE','grams (GMS)','B-04','250','0','250','0.5',false],
    ['CHEM-0015','C5A','8-HYDROXYQUINOLINE','litre (L)','I-05','612.5','597.5','15','50',true],
    ['CHEM-0016','C7A','ACETIC ACID (GLACIAL)','kilogram (KG)','A-03','19','17','2','5',true],
    ['CHEM-0017','C8A','ALPHA- NAPHTHYL AMINE','grams (GMS)','B-04','1100.1','1010.12','90','0.25',false],
    ['CHEM-0018','C9A','ALPHA-NAPHTHOL BENZENE (INDICATOR)','grams (GMS)','B-04','35','30','5','0.5',false],
    ['CHEM-0019','C10A','ALUMINIUM POTASSIUM SULPHATE','kilogram (KG)','A-02','1','0','1','2.5',true],
    ['CHEM-0020','C11A','DODECAHYDRATE','litre','K-64','2.5','2','0.5','0.5',false],
    ['CHEM-0021','C12A','ALUMINUM STANDARD SOLUTION (1000PPM)','litre','H-05','155','152.5','2.5','28',true],
    ['CHEM-0022','C13A','AMMONIA (28–32%)','kilogram (KG)','A-02','7','6.05','0.95','250',true],
    ['CHEM-0023','C14A','AMMONIUM METAVANADATE','kilogram (KG)','A-02','307','284','23','3',false],
  ]
};

/* ---- Documents (page 7) ---- */
DATA.docs = {
  kpis:[
    {l:'Total Documents',v:'1',i:'file-text',s:'All registered'},
    {l:'Categories',v:'1',i:'folder',s:'Defined groups'},
    {l:'Total Size',v:'0.03 MB',i:'hard-drive',s:'Combined storage'},
  ],
  cards:[
    {name:'Notes',code:'LAB-JD-IMS-001',size:'26.56 KB',cat:'JD',updated:'5/18/2026'},
  ]
};

/* ---- AI Assistance (page 11) ---- */
DATA.ai = {
  messages:[
    {who:'bot', time:'10:03 PM', html:`
      <div><b>• Other units</b> — 5 samples</div>
      <p>Most pending items were logged in the last 4 hours during the evening shift. You can open <b>Sample Management → Pending Approvals</b> to review and sign off results.</p>
      <p style="font-style:italic;color:#9aa3af;font-size:11px;margin:4px 0 0">Tip: Samples older than 12 hours in pending state are highlighted on the Dashboard KPI card.</p>`},
    {who:'user', time:'10:03 PM', html:`How many samples were missed last week?`},
    {who:'bot', time:'', html:`
      <p>For the previous calendar week (lab week, Mon–Sun), sampling compliance records show:</p>
      <p><b>Missed samples: 17</b></p>
      <p style="margin:6px 0 2px">Summary:</p>
      <div><b>• Morning shift (06:00–14:00)</b> — 4 missed</div>
      <div><b>• Evening shift (14:00–22:00)</b> — 7 missed</div>
      <div><b>• Night shift (22:00–06:00)</b> — 4 missed</div>
      <div><b>• General shift crew</b> — 2 missed</div>
      <p style="margin:6px 0 2px">Top contributing units:</p>
      <div>1. Raw Lab-09 — 5 missed slots</div>
      <div>2. OU Boiler Lab-02 — 4 missed slots</div>
      <p style="margin-top:6px">Overall weekly compliance was <b>94.2%</b>. For drill-down by shift and status, use <b>Dashboard → Shift Wise Samples & Compliance</b> or <b>Sampling Compliance</b>.</p>`},
  ]
};
