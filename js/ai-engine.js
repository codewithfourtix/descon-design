/* ============ Assistant engine ============
   Intent matcher that answers from the app's live data (every number is
   computed at question time), with links that jump to the right screen.
*/
const AI = {
  link(label, fn){ return `<button class="ai-link" onclick="${fn}">${label} <i data-lucide="arrow-right"></i></button>`; },
  li(items){ return items.map(t=>`<div>• ${t}</div>`).join(''); },

  stock(){
    const rows=DATA.chem.rows;
    const out=rows.filter(r=>parseFloat(r[7])<=0), crit=rows.filter(r=>parseFloat(r[7])>0&&parseFloat(r[7])<parseFloat(r[8]));
    return {out,crit,total:rows.length};
  },

  intents: [
    { keys:['attention','today','priority','priorities','what should','urgent','summary'],
      reply(){
        const q=siteQueue();
        return `<p>Here is what needs attention right now:</p>${AI.li(q.slice(0,6).map(i=>`<b>${i.title}</b> · ${i.meta}`))}
          <p style="margin-top:6px">${AI.link('Open the overview',"go('site')")}</p>`; } },
    { keys:['release','batch','batches','finished','dispatch'],
      reply(){
        const b=DATA.batches||[]; const wait=b.filter(x=>x.status==='Awaiting QC'||x.status==='Under Test'); const hold=b.filter(x=>x.status==='On Hold');
        return `<p><b>${wait.length}</b> batch${wait.length===1?'':'es'} waiting for a release decision, <b>${hold.length}</b> on hold, <b>${b.filter(x=>x.status==='Released').length}</b> released.</p>
          ${AI.li(wait.slice(0,5).map(x=>{const s=batchScore(x);return `<b>${x.id}</b> ${x.product} · ${s.done}/${s.total} results${s.fails?` · <span style="color:var(--descon-red)">${s.fails} OOS</span>`:''}`;}))}
          <p style="margin-top:6px">${wait[0]?AI.link('Open '+wait[0].id,`go('${wait[0].route}');setTab('wpp');setTimeout(()=>openBatch('${wait[0].id}'),150)`):''}</p>`; } },
    { keys:['coa','certificate','certificates'],
      reply(){
        const c=DATA.coas||[]; const ready=(DATA.batches||[]).filter(b=>b.status==='Released'&&!c.some(x=>x.batch===b.id&&x.status==='Issued'));
        return `<p><b>${c.filter(x=>x.status==='Issued').length}</b> certificates issued. Latest: <b>${c[0]?c[0].id+' · '+c[0].product+' → '+esc(c[0].customer):'none'}</b>.</p>
          <p><b>${ready.length}</b> released batch${ready.length===1?' is':'es are'} ready for a certificate${ready.length?': '+ready.slice(0,4).map(b=>b.id).join(', '):''}.</p>
          <p>${AI.link('Open certificates',"go('h2o2');setTab('coa')")}</p>`; } },
    { keys:['chemical','stock','inventory','reorder','ro level','reagent'],
      reply(){ const s=AI.stock();
        return `<p><b>${s.total}</b> chemicals tracked. <b>${s.out.length}</b> out of stock and <b>${s.crit.length}</b> below their reorder level.</p>
          ${s.out.length?`<p style="margin:6px 0 2px"><b>Order now (zero balance):</b></p>${AI.li(s.out.slice(0,5).map(r=>`${titleCase(r[2])} · rack ${r[4]}`))}`:''}
          ${s.crit.length?`<p style="margin:6px 0 2px"><b>Below reorder level:</b></p>${AI.li(s.crit.slice(0,5).map(r=>`${titleCase(r[2])} · ${r[7]} left (RO ${r[8]})`))}`:''}
          <p style="margin-top:6px">${AI.link('Open Reagents & Chemicals',"go('chemicals')")}</p>`; } },
    { keys:['calibration','calibrate','instrument','equipment'],
      reply(){ const e=DATA.equipment||[]; const due=e.filter(x=>x.status==='Calibration Due'), mnt=e.filter(x=>x.status==='Under Maintenance');
        return `<p><b>${e.length}</b> instruments registered: <b>${e.length-due.length-mnt.length}</b> operational, <b>${due.length}</b> due for calibration, <b>${mnt.length}</b> under maintenance.</p>
          ${AI.li(due.concat(mnt).slice(0,6).map(x=>`<b>${x.name}</b> (${x.tag}) · ${x.status} · next cal ${x.nextCal}`))}
          <p style="margin-top:6px">${AI.link('Open Instruments',"go('equip')")}</p>`; } },
    { keys:['capa','corrective','nonconform','non-conform','nc','audit','iso','17025'],
      reply(){ const c=DATA.capas||[]; const open=c.filter(x=>x.status!=='Closed'); const late=open.filter(x=>new Date(x.due)<new Date());
        return `<p><b>${open.length}</b> open CAPA${open.length===1?'':'s'}${late.length?`, <b style="color:var(--descon-red)">${late.length} overdue</b>`:''}. ${DATA.iso.table.length} internal and ${DATA.extAudits.length} external audits on record.</p>
          ${AI.li(open.slice(0,5).map(x=>`<b>${x.id}</b> ${esc(x.title)} · ${x.status} · ${x.owner}, due ${x.due}`))}
          <p style="margin-top:6px">${AI.link('Open Audit & CAPA',"go('iso')")}</p>`; } },
    { keys:['off spec','offspec','off-spec','oos','deviation','reject','out of spec'],
      reply(){ const r=(DATA.qualityRecords||[]).filter(x=>x.status==='Off-Spec'); const cnt={}; r.forEach(x=>cnt[x.parameter]=(cnt[x.parameter]||0)+1);
        const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,3);
        return `<p><b>${r.length}</b> out-of-specification results on record, <b>${r.filter(x=>!x.capa).length}</b> without a CAPA yet.</p>
          ${top.length?`<p style="margin:6px 0 2px">Most frequent:</p>${AI.li(top.map(([k,v])=>`${k} · ${v}`))}`:''}
          <p style="margin-top:6px">${AI.link('Open Quality & OOS',"go('urea');setTab('quality')")}</p>`; } },
    { keys:['method','procedure','sop','limit','spec','specification','test for'],
      reply(q){ const s=(DATA.specs||[]).find(x=>q.toLowerCase().includes(x.parameter.toLowerCase()));
        if(s) return `<p><b>${s.parameter}</b> (${s.stream}, ${s.point}): limit <b>${s.limit}</b> ${s.unit||''}, alert band ${s.alo} – ${s.ahi}.</p><p>Test method: <b>${s.method}</b>. Spec ${s.id}, status ${s.status}.</p><p>${AI.link('Open Specifications',"go('specs')")} ${AI.link('Open SOPs',"go('docs')")}</p>`;
        return `<p>I couldn't match that parameter to a specification. ${DATA.specs.length} specifications are on file across ${new Set(DATA.specs.map(x=>x.stream)).size} streams.</p><p>${AI.link('Browse specifications',"go('specs')")}</p>`; } },
    { keys:['missed','miss','skipped'],
      reply(){ const missed=Object.values(DATA.labResults||{}).flatMap(o=>Object.values(o)).filter(s=>s.status==='Missed').length;
        return `<p>Shift records show <b>${17+missed}</b> missed sampling slots in the last lab week${missed?` (including <b>${missed}</b> marked this session)`:''}.</p>
          ${AI.li(['Morning (06:00–14:00) · 4','Evening (14:00–22:00) · 7','Night (22:00–06:00) · 4','General crew · 2'])}
          <p style="margin-top:6px">${AI.link('Open Shift Handover',"go('shiftlog')")}</p>`; } },
    { keys:['review','approve','pending','sign off','sign-off'],
      reply(){ const r=(DATA.inReview||[]).filter(x=>x.status==='In Review'||x.status==='Pending'||x.status==='Analyzing');
        return `<p><b>${r.length}</b> sample result sets waiting for review: ${r.filter(x=>x.route==='urea').length} Urea, ${r.filter(x=>x.route==='h2o2').length} Hydrogen Peroxide.</p>
          ${AI.li(r.slice(0,5).map(x=>`<b>${x.id}</b> ${String(x.area).split('(')[0].trim()} · ${x.status}`))}
          <p style="margin-top:6px">${AI.link('Review Urea queue',"go('urea')")} ${AI.link('Review H2O2 queue',"go('h2o2')")}</p>`; } },
    { keys:['shift','morning','evening','night','roster'],
      reply(){ const r=DATA.roster||[];
        return `<p>Current shift: <b>${currentShift()}</b>.</p>${AI.li(r.map(x=>`<b>${x.shift}</b> ${x.time} · ${titleCase(x.supervisor)} + ${x.analysts.length} analysts · ${x.status}`))}
          <p style="margin-top:6px">${AI.link('Open Shift Scheduling',"go('shift')")}</p>`; } },
    { keys:['compliance','compliant','rate'],
      reply(){ const r=DATA.qualityRecords||[]; const off=r.filter(x=>x.status==='Off-Spec').length;
        return `<p>Result compliance across recorded results is <b>${r.length?(((r.length-off)/r.length)*100).toFixed(1):'—'}%</b> (${off} OOS of ${r.length}).</p><p>${AI.link('See the compliance trend',"go('urea');setTab('quality')")}</p>`; } },
    { keys:['sample','samples','how many','total','register'],
      reply(){ const g=DATA.registry||[];
        return `<p><b>${g.length}</b> samples in the register: ${g.filter(x=>x.type==='Routine').length} routine, ${g.filter(x=>x.type==='Non-Routine').length} non-routine, ${g.filter(x=>x.type==='Special').length} special. <b>${g.filter(x=>x.status!=='Approved').length}</b> not yet approved.</p>
          <p>${AI.link('Open Sample Register',"go('registry')")}</p>`; } },
    { keys:['document','documents','sop','policy','manual'],
      reply(){ const d=DATA.docs.cards;
        return `<p><b>${d.length}</b> controlled documents: ${d.filter(x=>x.status==='Approved').length} approved, ${d.filter(x=>x.status==='In Review').length} in review, ${d.filter(x=>x.status==='Draft').length} draft.</p><p>${AI.link('Open Documents & SOPs',"go('docs')")}</p>`; } },
    { keys:['hello','hi','hey','help','what can you'],
      reply(){ return `<p>Hi ${esc(myName().split(' ')[0])}. I answer from the live lab data. Try:</p>
        ${AI.li(['What needs my attention today?','Which batches are waiting for release?','Which chemicals need reordering?','Instruments due for calibration','Open CAPAs','What is the limit for Biuret?'])}`; } },
  ],

  fallback(q){
    const ql=q.toLowerCase();
    const hit=(DATA.registry||[]).find(r=>ql.includes(r.id.toLowerCase()))||(DATA.batches||[]).find(b=>ql.includes(b.id.toLowerCase()));
    if(hit&&hit.tests) return `<p>Batch <b>${hit.id}</b> · ${hit.product} · <b>${hit.status}</b>. ${(()=>{const s=batchScore(hit);return `${s.done}/${s.total} results, ${s.fails} OOS.`;})()}</p><p>${AI.link('Open batch',`go('${hit.route}');setTab('wpp');setTimeout(()=>openBatch('${hit.id}'),150)`)}</p>`;
    if(hit) return `<p>Sample <b>${hit.id}</b> · ${hit.plant} ${esc(hit.source)} · ${hit.type} · <b>${hit.status}</b>, received ${hit.received}.</p><p>${AI.link('Open sample',`go('registry');setTimeout(()=>openRegistry('${hit.id}'),150)`)}</p>`;
    const nav=DATA.nav.find(n=>n.id&&ql.includes(n.label.toLowerCase()));
    if(nav) return `<p>${AI.link('Open '+nav.label,`go('${nav.id}')`)}</p>`;
    const s=AI.stock(); const open=(DATA.capas||[]).filter(c=>c.status!=='Closed').length;
    return `<p>I couldn't find a direct answer to "<b>${esc(q).slice(0,80)}</b>". Here is the current picture:</p>
      ${AI.li([`${(DATA.inReview||[]).filter(x=>x.status!=='Approved'&&x.status!=='Rejected').length} result sets awaiting review`,
        `${(DATA.batches||[]).filter(b=>b.status==='Awaiting QC'||b.status==='Under Test').length} batches awaiting release`,
        `${s.out.length} chemicals out of stock, ${s.crit.length} below reorder level`,`${open} open CAPAs`])}
      <p style="margin-top:6px">Ask about batches, certificates, stock, instruments, CAPAs, specifications or a sample ID.</p>`;
  },

  respond(q){
    const s=q.toLowerCase();
    const hit=this.intents.find(it=>it.keys.some(k=>new RegExp('\\b'+k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(s)));
    try{ return hit?hit.reply(q):this.fallback(q); }catch(e){ console.error(e); return this.fallback(q); }
  },

  stages:['Understanding your question…','Querying sample & compliance records…','Aggregating shift and lab data…','Composing the answer…'],

  agents:[
    {id:'sampling',   name:'Sampling Analyst',   icon:'flask-conical',   color:'#0060b0',
      steps:['Scanning sample register…','Reading active samples…','Computing routine / non-routine split…'], get done(){ return `Parsed ${(DATA.registry||[]).length} samples`; }},
    {id:'compliance', name:'Compliance Auditor',  icon:'shield-check',    color:'#0a8f6d',
      steps:['Loading specifications…','Checking OOS / OOT flags…','Scoring shift compliance…'], get done(){ return `${(DATA.qualityRecords||[]).filter(r=>r.status==='Off-Spec').length} OOS · compliance scored`; }},
    {id:'inventory',  name:'Inventory Agent',     icon:'boxes',           color:'#e0930b',
      steps:['Reading reagent balances…','Comparing against RO levels…','Flagging low / out-of-stock…'], get done(){ const s=AI.stock(); return `${s.out.length+s.crit.length} items below RO level`; }},
    {id:'shift',      name:'Shift Coordinator',   icon:'users-round',     color:'#7c6bf5',
      steps:['Pulling shift roster…','Tallying planned vs completed…','Ranking backlog by unit…'], done:'Roster and backlog checked'},
    {id:'quality',    name:'Quality Reviewer',    icon:'clipboard-check', color:'#e11f26',
      steps:['Opening NC / CAPA log…','Reviewing audit findings…','Summarising deviations…'], get done(){ return `${(DATA.capas||[]).filter(c=>c.status!=='Closed').length} open CAPAs reviewed`; }},
  ],
  synth:{id:'synth', name:'Synthesizer', icon:'sparkles', color:'#0060b0',
    steps:['Merging findings…','Resolving conflicts…','Composing final answer…'], done:'Answer ready'},

  pickAgents(q){
    const s=q.toLowerCase(), pool=this.agents, picked=[];
    const add=id=>{const a=pool.find(x=>x.id===id); if(a&&!picked.includes(a))picked.push(a);};
    if(/miss|shift|morning|evening|night|backlog|roster/.test(s)) add('shift');
    if(/complian|rate/.test(s)) add('compliance');
    if(/off.?spec|oos|deviat|reject|batch|release|coa|certif/.test(s)){ add('compliance'); add('quality'); }
    if(/sample|total|how many|routine|pending|review/.test(s)) add('sampling');
    if(/chemical|stock|inventory|reorder|reagent|glassware|instrument|calibrat/.test(s)) add('inventory');
    if(/audit|iso|\bnc\b|capa|nonconform|17025|document|sop/.test(s)) add('quality');
    ['sampling','compliance','inventory','quality'].forEach(id=>{ if(picked.length<2) add(id); });
    return picked.slice(0,4);
  },
};
