/* ============ Mock AI engine (no API) ============
   Keyword-intent matcher that returns rich, context-aware answers
   drawn from the app's live mock data, with a staged "thinking" flow.
*/
const AI = {
  history: [],

  intents: [
    {
      keys:['missed','miss','skipped'],
      reply(){ return `<p>For the previous lab week (Mon–Sun), sampling compliance records show:</p>
        <p><b>Missed samples: 17</b></p>
        <p style="margin:6px 0 2px">Breakdown by shift:</p>
        <div><b>• Morning (06:00–14:00)</b> — 4 missed</div>
        <div><b>• Evening (14:00–22:00)</b> — 7 missed</div>
        <div><b>• Night (22:00–06:00)</b> — 4 missed</div>
        <div><b>• General crew</b> — 2 missed</div>
        <p style="margin:6px 0 2px">Top contributing units:</p>
        <div>1. Raw Lab-09 — 5 missed slots</div>
        <div>2. OU Boiler Lab-02 — 4 missed slots</div>
        <p style="margin-top:6px">Overall weekly compliance was <b>94.2%</b>. Drill down via <b>Dashboard → Shift Wise Samples & Compliance</b>.</p>`; }
    },
    {
      keys:['compliance','compliant','rate'],
      reply(){ const d=DATA.dash; return `<p>Current <b>compliance rate</b> for the selected stream is <b>${d.kpis[0].v}</b>.</p>
        <p style="margin:6px 0 2px">Shift compliance today:</p>
        <div>• General — 30% &nbsp; • Morning — 33.3%</div>
        <div>• Evening — 25% &nbsp; • Night — 13.6%</div>
        <p style="margin-top:6px">Site-wide compliance across all plants is trending at <b>~28%</b> for the day window. Use <b>Quality Report</b> for the 7-day compliance curve.</p>`; }
    },
    {
      keys:['sample','total','how many'],
      reply(){ const d=DATA.dash; return `<p>Sample totals for the active window:</p>
        <div>• Total samples — <b>${d.kpis[1].v}</b></div>
        <div>• Routine — <b>${d.kpis[2].v}</b> &nbsp; • Non-routine — <b>${d.kpis[3].v}</b></div>
        <div>• In review — <b>${d.kpis[4].v}</b> &nbsp; • Completed — <b>${d.kpis[5].v}</b></div>
        <div>• Pending — <b>${d.kpis[6].v}</b> &nbsp; • Off-spec — <b>${d.kpis[7].v}</b></div>
        <p style="margin-top:6px">Site-wide you currently have <b>11,371</b> samples logged. Open <b>Overview</b> for the full rollup.</p>`; }
    },
    {
      keys:['chemical','stock','inventory','reorder','ro level'],
      reply(){ const oos=DATA.chem.rows.filter(r=>r[7]==='0').length; const crit=9;
        return `<p><b>Chemicals inventory</b> status:</p>
        <div>• Tracked chemicals — <b>22</b></div>
        <div>• Out of stock — <b>1</b> (Aluminium Potassium Sulphate variant)</div>
        <div>• Critical (below RO level) — <b>${crit}</b></div>
        <div>• Low stock — <b>2</b></div>
        <p style="margin-top:6px">Recommend raising a purchase request for: <b>Acetic Acid (Glacial)</b>, <b>8-Hydroxyquinoline</b>, and <b>Ammonia (28–32%)</b>. Go to <b>Reagents & Chemicals → Add Chemical</b> to restock.</p>`; }
    },
    {
      keys:['audit','iso','17025','nc','capa','non-conform'],
      reply(){ return `<p><b>ISO 17025 audit</b> snapshot:</p>
        <div>• Total audits — <b>4</b> (1 ongoing, 2 completed)</div>
        <div>• Open non-conformities — <b>5</b> across clauses 6.2, 6.4, 7.2, 7.5, 8.7</div>
        <div>• Overdue CAPAs — <b>0</b> &nbsp; • Compliance score — <b>91%</b></div>
        <p style="margin-top:6px">Highest NC risk is in <b>Quality Control (4 NCs)</b>. See <b>Quality System → Nonconformities</b>.</p>`; }
    },
    {
      keys:['off spec','offspec','oos','deviation','reject'],
      reply(){ return `<p><b>Off-spec / OOS</b> summary:</p>
        <div>• Total OOS — <b>13</b> (+2 vs last month)</div>
        <div>• Critical OOS (>30% deviation) — <b>3</b></div>
        <div>• Repeat OOS (same parameter) — <b>2</b></div>
        <p style="margin-top:6px">Most frequent deviating parameters: <b>Moisture</b>, <b>Iron Content</b>, <b>pH Value</b>. Full breakdown on the <b>Quality Report</b> screen.</p>`; }
    },
    {
      keys:['special'],
      reply(){ return `<p><b>Special samples</b> queue:</p>
        <div>• Total registered — <b>54</b></div>
        <div>• New requests — <b>10</b> (awaiting review)</div>
        <div>• In progress — <b>19</b> &nbsp; • Completed — <b>25</b></div>
        <p style="margin-top:6px">Latest request: <b>SS-20260518-181</b> (6 parameters) by Muhammad Asif Hanif — status <b>Results Approved</b>.</p>`; }
    },
    {
      keys:['shift','morning','evening','night'],
      reply(){ return `<p><b>Shift performance</b> today:</p>
        <table style="border-collapse:collapse;margin-top:4px">
        <tr><td style="padding:2px 12px 2px 0"></td><td style="padding:2px 10px"><b>Plan</b></td><td style="padding:2px 10px"><b>Done</b></td><td style="padding:2px 10px"><b>Missed</b></td></tr>
        <tr><td>Morning</td><td style="text-align:center">15</td><td style="text-align:center">10</td><td style="text-align:center">0</td></tr>
        <tr><td>Evening</td><td style="text-align:center">8</td><td style="text-align:center">8</td><td style="text-align:center">0</td></tr>
        <tr><td>Night</td><td style="text-align:center">22</td><td style="text-align:center">11</td><td style="text-align:center">0</td></tr>
        </table><p style="margin-top:6px">Night shift has the largest backlog (11 pending). Consider reallocating an analyst.</p>`; }
    },
    {
      keys:['hello','hi','hey','help','what can you'],
      reply(){ return `<p>Hi! I'm the <b>Descon Assure Assistant</b> (demo mode). I can answer questions about:</p>
        <div>• Sample counts, compliance & rejection rates</div>
        <div>• Missed / off-spec / OOS analysis</div>
        <div>• Chemical stock & reorder suggestions</div>
        <div>• ISO 17025 audits, NCs & CAPAs</div>
        <div>• Shift-wise performance</div>
        <p style="margin-top:6px">Try: <i>"How many samples were missed last week?"</i> or <i>"Which chemicals need reordering?"</i></p>`; }
    },
  ],

  fallback(q){
    return `<p>I looked across the current lab dataset for "<b>${q.replace(/</g,'&lt;').slice(0,80)}</b>".</p>
      <p>Here's what I can tell you from the live demo data:</p>
      <div>• <b>130</b> samples in the active stream window (44 completed, 24 pending)</div>
      <div>• Day compliance <b>24.6%</b>, rejection rate <b>25.5%</b></div>
      <div>• <b>13</b> OOS results, <b>9</b> chemicals below reorder level</div>
      <p style="margin-top:6px">Ask me about samples, compliance, missed slots, chemicals, audits, or shifts and I'll give a detailed breakdown. <i>(Demo mode — responses are generated from mock data, not a live model.)</i></p>`;
  },

  respond(q){
    const s=q.toLowerCase();
    const hit=this.intents.find(it=>it.keys.some(k=>s.includes(k)));
    return hit?hit.reply():this.fallback(q);
  },

  /* thinking stages shown while "processing" */
  stages:['Understanding your question…','Querying sample & compliance records…','Aggregating shift and lab data…','Composing the answer…'],

  /* ===== mocked multi-agent orchestration ===== */
  agents:[
    {id:'sampling',   name:'Sampling Analyst',   icon:'flask-conical',   color:'#0060b0',
      steps:['Scanning sample register…','Reading active samples…','Computing routine / non-routine split…'], done:'Parsed 130 samples · 2 anomalies'},
    {id:'compliance', name:'Compliance Auditor',  icon:'shield-check',    color:'#0a8f6d',
      steps:['Loading specifications…','Checking OOS / OOT flags…','Scoring shift compliance…'], done:'13 OOS · compliance scored'},
    {id:'inventory',  name:'Inventory Agent',     icon:'boxes',           color:'#e0930b',
      steps:['Reading reagent balances…','Comparing against RO levels…','Flagging low / out-of-stock…'], done:'9 items below RO level'},
    {id:'shift',      name:'Shift Coordinator',   icon:'users-round',     color:'#7c6bf5',
      steps:['Pulling shift roster…','Tallying planned vs completed…','Ranking backlog by unit…'], done:'Night shift backlog = 11'},
    {id:'quality',    name:'Quality Reviewer',    icon:'clipboard-check', color:'#e11f26',
      steps:['Opening NC / CAPA log…','Reviewing audit findings…','Summarising deviations…'], done:'5 open NCs reviewed'},
  ],
  synth:{id:'synth', name:'Synthesizer', icon:'sparkles', color:'#0060b0',
    steps:['Merging agent findings…','Resolving conflicts…','Composing final answer…'], done:'Answer ready'},

  pickAgents(q){
    const s=q.toLowerCase(), pool=this.agents, picked=[];
    const add=id=>{const a=pool.find(x=>x.id===id); if(a&&!picked.includes(a))picked.push(a);};
    if(/miss|shift|morning|evening|night|backlog|roster/.test(s)) add('shift');
    if(/complian|rate/.test(s)) add('compliance');
    if(/off.?spec|oos|deviat|reject/.test(s)){ add('compliance'); add('quality'); }
    if(/sample|total|how many|routine|pending/.test(s)) add('sampling');
    if(/chemical|stock|inventory|reorder|reagent|glassware/.test(s)) add('inventory');
    if(/audit|iso|\bnc\b|capa|nonconform|17025/.test(s)) add('quality');
    ['sampling','compliance','shift','inventory','quality'].forEach(id=>{ if(picked.length<3) add(id); });
    return picked.slice(0,4);
  },
};
