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
  <div class="pageicon" style="font-size:24px">Assistant</div>
  <div class="card chat-wrap">
    <div class="chat-head">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="bot-av"><i data-lucide="bot" style="width:17px"></i></div>
        <div><div style="font-weight:600;color:#334">Descon Assure Assistant</div>
        <div style="font-size:10.5px;color:#9aa3af">Demo mode · multi-agent orchestration (mocked, no API)</div></div>
      </div>
      <div style="color:#d64545;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px" onclick="clearChat()"><i data-lucide="trash-2" style="width:14px"></i>Clear Chat</div>
    </div>
    <div class="chat-body" id="chat-body">${msgs}</div>
    <div class="chat-suggest" id="chat-suggest" style="display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 6px">
      ${['How many samples were missed last week?','Which chemicals need reordering?','Show shift performance','Off-spec summary','Audit status'].map(s=>`<span class="sugg" onclick="askSuggest(this)">${s}</span>`).join('')}
    </div>
    <div class="chat-input">
      <input id="chat-in" placeholder="Ask about samples, compliance, shifts, or lab data..." onkeydown="if(event.key==='Enter')sendChat()">
      <div class="send" id="chat-send" onclick="sendChat()"><i data-lucide="send" style="width:15px"></i></div>
    </div>
    <div style="font-size:10.5px;color:#9aa3af;padding:2px 16px 8px;display:flex;align-items:center;gap:5px">
      <i data-lucide="info" style="width:12px"></i>Demo responses are generated from mock data — no external API is called.</div>
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
