/* ============ Descon-specific data & personalization ============ */
(function(){
/* ---- Per-stream Result Entry worksheets ---- */
DATA.labByStream = {
  /* Descon Oxychem — Hydrogen Peroxide (authentic to Descon's own chemistry) */
  h2o2:[
    {t:'H2O2 Product — Final (HP-01)', cols:['0600','1400','2200'],
     rows:[['Concentration','% w/w','49.0 – 50.5'],['Active Oxygen','%','23.1 min'],['Stability','%','98 min'],['Free Acid','ppm','300 max'],['TOC','ppm','200 max'],['Conductivity','µS/cm','80 max'],['Density','g/ml','1.19 – 1.20']]},
    {t:'Aseptox — Food Grade (HP-02)', cols:['0600','1800'],
     rows:[['Concentration','% w/w','34.5 – 35.5'],['Active Oxygen','%','16.2 min'],['Stability','%','99 min'],['Total Nitrate','ppm','2 max'],['Phosphate','ppm','50 max'],['Heavy Metals','ppm','1 max']]},
    {t:'Textox — Textile Grade (HP-03)', cols:['0600','1800'],
     rows:[['Concentration','% w/w','49.0 – 50.5'],['Stabilizer','ppm','300 – 500'],['pH (10% sol.)','','2.0 – 4.0'],['Iron','ppm','0.5 max']]},
    {t:'Hydrogen Plant Feed (HP-10)', cols:['0700','1900'],
     rows:[['H2 Purity','%','99.9 min'],['CO','ppm','10 max'],['CO2','ppm','10 max'],['Moisture','ppm','5 max']]},
    {t:'Working Solution (WS-05)', cols:['0700','1900'],
     rows:[['Anthraquinone','g/l','120 – 140'],['Concentration','g/l','9 – 11'],['Water Content','%','0.3 max']]},
    {t:'Effluent / Utilities (EU-20)', cols:['0800','2000'],
     rows:[['COD','mg/l','150 max'],['pH','','6.5 – 8.5'],['TSS','mg/l','30 max'],['H2O2 Residual','ppm','1 max']]},
  ],
};

/* ---- Specifications register (standard LIMS "Specifications" module) ---- */
DATA.specs = [];
(function(){
  const src=[
    ['Hydrogen Peroxide','HP-01','Concentration','% w/w','49.0','50.5','48.5','51.0','Titration (KMnO4)'],
    ['Hydrogen Peroxide','HP-01','Active Oxygen','%','23.1','—','23.0','—','Calculated'],
    ['Hydrogen Peroxide','HP-01','Stability','%','98','—','97','—','Accelerated 96h'],
    ['Hydrogen Peroxide','HP-02','Concentration','% w/w','34.5','35.5','34.0','36.0','Titration'],
    ['Urea','UR-30','Biuret','%','—','1.5','—','1.7','Spectrophotometry'],
    ['Urea','UR-30','Moisture','%','—','0.50','—','0.60','Karl Fischer'],
    ['Urea','UR-27','Total Nitrogen','%','46.0','—','45.5','—','Kjeldahl'],
    ['Ammonia','UR-15','NH3','%','—','6.8','—','7.2','Titration'],
    ['Nitric Acid','NA-01','Concentration','%','60.0','62.0','59.5','62.5','Titration'],
    ['CAN','UR-04','Total Nitrogen','%','26.0','—','25.5','—','Kjeldahl'],
    ['CAN','UR-04','Calcium','%','8.0','—','7.5','—','EDTA Titration'],
    ['NP / Agri','NP-01','Phosphorus (P2O5)','%','18.0','—','17.5','—','Gravimetric'],
    ['NP / Agri','NP-01','Nitrogen','%','18.0','—','17.5','—','Kjeldahl'],
    ['Utilities & Off-Gas','OU-146','pH','','7.8','8.2','7.5','8.5','Electrode'],
  ];
  src.forEach((r,i)=>DATA.specs.push({
    id:'SPEC-'+String(101+i), stream:r[0], point:r[1], parameter:r[2], unit:r[3],
    lo:r[4], hi:r[5], alo:r[6], ahi:r[7], method:r[8],
    limit:(r[4]!=='—'?r[4]:'')+((r[4]!=='—'&&r[5]!=='—')?' – ':'')+(r[5]!=='—'?r[5]:(r[4]!=='—'?' min':'')),
    status:'Approved'
  }));
})();

/* ---- Personalize sites/locations to real Descon facilities ---- */
if(DATA.equipment){
  const sites=['Oxychem QC Lab — Sheikhupura','Central QC Lab — Lahore','Agri Lab — Kasur','Process Lab — Port Qasim'];
  DATA.equipment.forEach((e,i)=>e.location=sites[i%sites.length]);
}

/* ---- Enrich notifications with Descon context ---- */
if(DATA.notifications){
  DATA.notifications.unshift(
    {icon:'droplets',color:'#0060b0',title:'H2O2 batch HP-2451 released',body:'Oxychem — Sheikhupura · Concentration 49.8% (in-spec)',time:'4m ago'},
  );
}

/* ============ Per-stream dashboards (same layout, distinct data/graphs) ============ */
DATA.streamProfiles = {
  h2o2:   {f:1.12, seed:1107, comp:'92.4', rej:'4.1',
    names:['H2O2 Product Final','Aseptox Food Grade','Textox Textile','Printox Paper','Working Solution','Hydrogen Plant Feed','Anthraquinone Soln','Sanidol','Dolox Mining','Plant Effluent'],
    params:['Concentration','Active Oxygen','Stability','Free Acid','TOC','Conductivity']},
  urea:   {f:1.0,  seed:2203, comp:'24.6', rej:'25.5',
    names:DATA.dash.top10.map(x=>x.n),
    params:['Biuret','Moisture','Total Nitrogen','Crush Strength','Iron','NH3']},
  ammonia:{f:0.92, seed:3305, comp:'71.8', rej:'9.4',
    names:['Ammonia Product','Synthesis Gas','Converter Outlet','Purge Gas','Refrigeration','Let-down Gas','Absorber','Stripper','Cooling Water','Condensate'],
    params:['NH3 Purity','Moisture','Oil Content','Iron','Inerts','Water']},
  nitric: {f:0.66, seed:4417, comp:'63.2', rej:'12.7',
    names:['Nitric Acid Product','Absorber Tower','Tail Gas','NOx Stream','Bleacher','Ammonia Feed','Weak Acid','Bleaching Air','Cooling Water','Condensate'],
    params:['Concentration','NOx','Chloride','Iron','Density','Colour']},
  can:    {f:0.78, seed:5529, comp:'58.9', rej:'14.1',
    names:['CAN Product','Neutralizer','Granulator','Scrubber','Dust Cyclone','Coating Oil','Ammonia Feed','Nitric Acid Feed','Prilling Tower','Cooling Water'],
    params:['Total Nitrogen','Calcium','Moisture','Granule Size','Coating','Iron']},
  np:     {f:0.85, seed:6631, comp:'66.4', rej:'11.2',
    names:['NP Product','Pipe Reactor','Granulator','Scrubber Liquor','Phosphoric Acid','Ammonia Feed','Coating','Dryer','Screen Oversize','Fines'],
    params:['Nitrogen','P2O5','Moisture','Granule Size','Fines','Coating']},
  ou:     {f:1.34, seed:7743, comp:'81.3', rej:'6.8',
    names:['Boiler Feed Water','Cooling Tower','Demin Water','Condensate','Instrument Air','Plant Effluent','Steam','Raw Water','Service Water','Flare Gas'],
    params:['pH','Conductivity','Hardness','Silica','Dissolved O2','TSS']},
};

DATA.getStreamDash = function(route){
  const base=DATA.dash, p=DATA.streamProfiles[route]||DATA.streamProfiles.urea;
  const rng=mulberry32(p.seed);
  const jit=(v,amp)=>Math.max(0,Math.round(v*(1+(rng()*2-1)*(amp||0.18))));
  const kpis=base.kpis.map((k,i)=>{
    let v=k.v;
    if(i===0) v=p.comp+'%';                       // Compliance Rate
    else if(i===8) v=p.rej+'%';                   // Rejection Rate
    else if(String(v).includes('%')) v=(parseFloat(v)*(0.7+rng()*0.8)).toFixed(1)+'%';
    else v=String(jit(parseInt(v)*p.f,0.22));
    return {...k,v};
  });
  const shift={cols:base.shift.cols,icons:base.shift.icons,rows:base.shift.rows.map(r=>{
    if(r.k==='Shift Compliance') return {...r,v:r.v.map(()=> (8+rng()*40).toFixed(1)+'%')};
    return {...r,v:r.v.map(val=> jit(val*p.f,0.32))};
  })};
  const top10=p.names.slice(0,10).map((n,i)=>({n,v:Math.max(1,Math.round((12-i)*p.f*(0.7+rng()*0.7)))}))
    .sort((a,b)=>b.v-a.v);
  const trend=base.trend.map(s=>({...s,
    data:s.data.map(v=>Math.min(100,Math.max(0,Math.round(v*(0.5+rng()*1.0)+ (rng()*14-4)))))}));

  /* Specification conformance per key parameter (In-Spec vs OOS %) */
  const conformance=(p.params||[]).map(pl=>{
    const inSpec=+(80+rng()*19.5).toFixed(1);
    return {param:pl, inSpec, oos:+(100-inSpec).toFixed(1)};
  });

  /* SPC control chart for the lead parameter (14 recent results) */
  const n=14, sd=5, target=50;
  const vals=[];
  for(let i=0;i<n;i++){
    let v=target+(rng()*2-1)*sd*1.35;
    if(rng()<0.10) v+=(rng()<0.5?1:-1)*sd*3.2;   // occasional excursion
    vals.push(+v.toFixed(1));
  }
  const spc={
    param:(p.params&&p.params[0])||'Key Parameter',
    labels:Array.from({length:n},(_,i)=>'S-'+String(i+1).padStart(2,'0')),
    values:vals, mean:target, ucl:target+3*sd, lcl:target-3*sd, uwl:target+2*sd, lwl:target-2*sd,
  };

  return {kpis,shift,top10,trendLabels:base.trendLabels,trend,conformance,spc};
};

/* ============ Per-stream Quality report data ============ */
DATA.getStreamQuality = function(route){
  const q=DATA.quality, p=DATA.streamProfiles[route]||DATA.streamProfiles.urea;
  const rng=mulberry32(p.seed+99);
  const j=(v,a)=>Math.max(0,Math.round(v*(1+(rng()*2-1)*(a||0.2))));
  const oos=j(13*p.f), crit=Math.max(0,j(3*p.f)), rep=Math.max(0,j(2*p.f));
  const kpis=q.kpis.map((k,i)=>{
    if(i===5) return {...k,v:String(oos)};
    if(i===6) return {...k,v:String(crit)};
    if(i===7) return {...k,v:String(rep)};
    return k;
  });
  return {
    kpis,
    complianceLabels:q.complianceLabels,
    compliance:q.compliance.map(v=>Math.min(100,j(v,0.12))),
    routineLabels:q.routineLabels,
    routine:q.routine.map(v=>j(v*p.f,0.18)),
    nonRoutine:q.nonRoutine.map(v=>j(v*p.f,0.4)),
    offspecLabels:q.offspecLabels,
    offspec:q.offspec.map(()=>1+Math.round(rng()*6)),
    deviation:q.deviation.map(d=>({n:d.n,v:+(0.6+rng()*3).toFixed(1)})),
  };
};
})();
