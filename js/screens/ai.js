/* ===== AI Assistance (interactive mock) ===== */
function aiBubble(m){
  if(m.who==='bot'){
    return `<div class="msg bot">
      <div class="bot-av"><i data-lucide="bot" style="width:16px"></i></div>
      <div><div class="bubble">${m.html}</div>${m.time?`<div class="time">${m.time}</div>`:''}</div>
    </div>`;
  }
  return `<div class="msg user">
    <div class="usr-av"><i data-lucide="user" style="width:16px"></i></div>
    <div><div class="bubble">${m.html}</div>${m.time?`<div class="time" style="text-align:right">${m.time}</div>`:''}</div>
  </div>`;
}

function screenAI(){
  const msgs = DATA.ai.messages.map(aiBubble).join('');
  return `
  <div class="workspace-split" style="height:calc(100vh - 80px)">
    <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto;padding-right:4px">
      <div style="font-size:20px;font-weight:700;color:var(--ink)">Operations Command Center</div>
      
      <div class="grid" style="grid-template-columns:1fr 1fr">
        <div class="card card-pad" style="background:#f8fafb">
          <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px">SYSTEM STATUS</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="badge b-green">Online</span> <span style="font-size:13px;font-weight:600;color:var(--ink)">Data Pipeline</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge b-green">Online</span> <span style="font-size:13px;font-weight:600;color:var(--ink)">Agent Network</span>
          </div>
        </div>
        <div class="card card-pad" style="background:#f8fafb">
          <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:8px">ACTIVE AGENTS</div>
          <div style="display:flex;gap:4px">
            <div class="icon-sq" style="background:var(--brand);color:#fff" title="Operations Analyst"><i data-lucide="bar-chart-2"></i></div>
            <div class="icon-sq" style="background:var(--amber);color:#fff" title="Quality Monitor"><i data-lucide="microscope"></i></div>
            <div class="icon-sq" style="background:var(--teal);color:#fff" title="Inventory Forecaster"><i data-lucide="flask-conical"></i></div>
            <div class="icon-sq" style="background:var(--descon-red);color:#fff" title="Safety Compliance"><i data-lucide="shield-alert"></i></div>
          </div>
        </div>
      </div>
      
      <div class="card" style="flex:1;display:flex;flex-direction:column">
        <div class="card-head"><div class="card-title">Real-time Operations Log</div></div>
        <div class="card-pad" style="flex:1;background:#1e293b;color:#e2e8f0;font-family:monospace;font-size:12px;overflow-y:auto;line-height:1.6">
          <div style="color:#4ade80">[sys] Network synchronization complete.</div>
          <div style="color:#94a3b8">[log] 14:02 - Plant: Urea - Shift: B - Samples parsed: 42</div>
          <div style="color:#fcd34d">[warn] 14:03 - Quality: Free Ammonia (U-8021) 0.82 wt% > 0.50 wt% (Off-spec)</div>
          <div style="color:#4ade80">[ai] Monitor triggered. Alert dispatched to Shift In-charge.</div>
          <div style="color:#94a3b8">[log] 14:05 - Inventory: Reagent Sulphuric Acid checked. Balance: 40L. Status: OK.</div>
          <div style="color:#fcd34d">[warn] 14:08 - Inventory: Ammonia Buffer checked. Balance: 0L. Critical!</div>
          <div style="color:#4ade80">[ai] Forecaster generated Purchase Req #4012. Pending approval.</div>
          <div style="color:#94a3b8">[log] 14:15 - Awaiting user queries...</div>
        </div>
      </div>
    </div>
    
    <div class="detail-panel chat-wrap" style="padding:0;display:flex;flex-direction:column">
      <div class="chat-head" style="padding:16px;border-bottom:1px solid var(--line)">
        <div style="display:flex;align-items:center;gap:10px">
          <div class="bot-av"><i data-lucide="sparkles" style="width:17px"></i></div>
          <div><div style="font-weight:700;color:var(--ink)">Descon Operations Assistant</div>
          <div style="font-size:10.5px;color:var(--muted)">Multi-agent orchestration</div></div>
        </div>
        <div style="color:var(--descon-red);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px" onclick="clearChat()"><i data-lucide="trash-2" style="width:14px"></i>Clear</div>
      </div>
      <div class="chat-body" id="chat-body" style="flex:1;padding:16px;background:#fbfcfd">${msgs}</div>
      <div class="chat-suggest" id="chat-suggest" style="display:flex;flex-wrap:wrap;gap:7px;padding:8px 16px">
        ${['How many samples were missed last week?','Which chemicals need reordering?','Show shift performance','Off-spec summary'].map(s=>`<span class="sugg" onclick="askSuggest(this)">${s}</span>`).join('')}
      </div>
      <div class="chat-input" style="padding:12px 16px;background:#fff">
        <input id="chat-in" placeholder="Ask about samples, compliance, shifts..." onkeydown="if(event.key==='Enter')sendChat()">
        <div class="send" id="chat-send" onclick="sendChat()"><i data-lucide="send" style="width:15px"></i></div>
      </div>
    </div>
  </div>`;
}

let AI_BUSY=false;
function scrollChat(){const b=document.getElementById('chat-body');if(b)b.scrollTop=b.scrollHeight;}
function nowTime(){const d=new Date();let h=d.getHours(),m=d.getMinutes(),ap=h>=12?'PM':'AM';h=h%12||12;return `${h}:${String(m).padStart(2,'0')} ${ap}`;}

function appendMsg(who,html,time){
  const b=document.getElementById('chat-body');
  const div=document.createElement('div');
  div.innerHTML=aiBubble({who,html,time});
  b.appendChild(div.firstElementChild);
  if(window.lucide)lucide.createIcons();
  scrollChat();
}

function askSuggest(el){const inp=document.getElementById('chat-in');inp.value=el.textContent;sendChat();}

function sendChat(){
  if(AI_BUSY)return;
  const inp=document.getElementById('chat-in');
  const q=inp.value.trim(); if(!q)return;
  inp.value='';
  const sg=document.getElementById('chat-suggest'); if(sg)sg.style.display='none';
  appendMsg('user', q.replace(/</g,'&lt;'), nowTime());
  AI_BUSY=true;
  document.getElementById('chat-send').style.opacity=.5;
  runAgents(q);
}

/* ===== Mocked multi-agent orchestration animation ===== */
function runAgents(q){
  const specialists = AI.pickAgents(q);
  const all = specialists.concat([AI.synth]);
  const b=document.getElementById('chat-body');
  const wrap=document.createElement('div'); wrap.className='msg bot'; wrap.id='orch-msg';
  wrap.innerHTML=`<div class="bot-av"><i data-lucide="bot" style="width:16px"></i></div>
    <div class="orch-card">
      <div class="orch-head"><span>Multi-agent run <span class="orch-sub">· ${specialists.length} specialists → 1 synthesis</span></span><span class="orch-timer" id="orch-timer">0.0s</span></div>
      <div class="orch-agents" id="orch-agents">
        ${all.map((a,i)=>`<div class="agent-row" id="ag-${i}" style="--ac:${a.color}">
          <div class="agent-node"><i data-lucide="${a.icon}"></i></div>
          <div class="agent-main">
            <div class="agent-name">${a.name}<span class="agent-status" id="ag-st-${i}">queued</span></div>
            <div class="agent-step" id="ag-step-${i}">Waiting to start…</div>
          </div>
          <div class="agent-state" id="ag-ic-${i}"><span class="dot-q"></span></div>
        </div>`).join('')}
      </div>
      <div class="orch-foot"><div class="orch-prog"><i id="orch-bar"></i></div><span class="orch-count" id="orch-count">0/${all.length}</span></div>
    </div>`;
  b.appendChild(wrap);
  if(window.lucide)lucide.createIcons();
  scrollChat();

  const t0=Date.now();
  const timer=setInterval(()=>{const el=document.getElementById('orch-timer'); if(el)el.textContent=((Date.now()-t0)/1000).toFixed(1)+'s';},100);
  let done=0; const total=all.length;
  const bump=()=>{ done++; const bar=document.getElementById('orch-bar'); if(bar)bar.style.width=(done/total*100)+'%'; const c=document.getElementById('orch-count'); if(c)c.textContent=done+'/'+total; };

  const runAgent=(a,i,startAt,dur)=>new Promise(res=>{
    setTimeout(()=>{
      const row=document.getElementById('ag-'+i), st=document.getElementById('ag-st-'+i),
            step=document.getElementById('ag-step-'+i), ic=document.getElementById('ag-ic-'+i);
      if(row)row.classList.add('running');
      if(st){st.textContent='running'; st.className='agent-status running';}
      if(ic){ic.innerHTML='<i data-lucide="loader-2" class="spin"></i>'; if(window.lucide)lucide.createIcons();}
      let s=0; if(step)step.textContent=a.steps[0];
      const iv=setInterval(()=>{ s++; if(s<a.steps.length&&step)step.textContent=a.steps[s]; }, dur/(a.steps.length+0.4));
      setTimeout(()=>{
        clearInterval(iv);
        if(row){row.classList.remove('running'); row.classList.add('done');}
        if(st){st.textContent='done'; st.className='agent-status done';}
        if(step)step.textContent=a.done||'Completed.';
        if(ic){ic.innerHTML='<i data-lucide="check"></i>'; if(window.lucide)lucide.createIcons();}
        bump(); scrollChat(); res();
      },dur);
    },startAt);
  });

  // specialists fan out in parallel (staggered starts); synthesizer runs after they converge
  Promise.all(specialists.map((a,i)=>runAgent(a,i, i*280, 1150+Math.random()*950)))
    .then(()=>runAgent(AI.synth, all.length-1, 140, 850))
    .then(()=>{
      clearInterval(timer);
      setTimeout(()=>{ const w=document.getElementById('orch-msg'); if(w)w.remove(); typeOut(AI.respond(q)); }, 300);
    });
}

/* progressive reveal of the answer */
function typeOut(html){
  const b=document.getElementById('chat-body');
  const wrap=document.createElement('div');
  wrap.className='msg bot';
  wrap.innerHTML=`<div class="bot-av"><i data-lucide="bot" style="width:16px"></i></div><div><div class="bubble" id="typing"></div><div class="time" id="typing-time"></div></div>`;
  b.appendChild(wrap);
  if(window.lucide)lucide.createIcons();
  const target=wrap.querySelector('#typing');
  target.classList.add('typing-cursor');
  // reveal in chunks by splitting top-level nodes
  const tmp=document.createElement('div'); tmp.innerHTML=html;
  const nodes=Array.from(tmp.childNodes);
  let i=0;
  const step=()=>{
    if(i<nodes.length){
      target.appendChild(nodes[i].cloneNode(true));
      i++; scrollChat();
      setTimeout(step, 90+Math.random()*90);
    } else {
      target.classList.remove('typing-cursor');
      wrap.querySelector('#typing-time').textContent=nowTime();
      AI_BUSY=false;
      const s=document.getElementById('chat-send'); if(s)s.style.opacity=1;
      scrollChat();
    }
  };
  step();
}

function clearChat(){
  confirmModal('Clear chat','This will remove the current conversation. Continue?',()=>{
    const b=document.getElementById('chat-body'); if(b)b.innerHTML='';
    const sg=document.getElementById('chat-suggest'); if(sg)sg.style.display='flex';
    appendMsg('bot', AI.intents.find(i=>i.keys.includes('hello')).reply(), nowTime());
    toast('Chat cleared','info');
  },'Clear','danger');
}
