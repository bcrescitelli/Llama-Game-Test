
/* ========= Core utilities / storage ========= */
const STORAGE_KEY = "llamalog_state_v7";
const profanityList = ["fuck","shit","bitch","asshole","dick","cunt","bastard","slut","whore","fag","retard","twat","prick","wank","bollock"];
const uid = (n=10)=>{const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>c[b%c.length]).join("")};
const todayKey = ()=> new Date().toISOString().slice(0,10);
const load = ()=> { try { return JSON.parse(localStorage.getItem(STORAGE_KEY))||{teams:{}} } catch { return {teams:{}} } };
const save = s => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
let session = { role:null, teamCode:null, email:null };

/* ========= Mini helpers ========= */
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const Toast = (msg,type="info")=>{
  const box=$("#toastContainer"); const d=document.createElement("div");
  d.className=`glass rounded-xl px-4 py-3 text-sm flex items-start gap-3 border ${type==="success"?"border-emerald-400":type==="error"?"border-rose-400":type==="warn"?"border-amber-400":"border-white/20"}`;
  d.innerHTML = `<div class="flex-1">${msg}</div><button class="bg-white/10 hover:bg-white/20 px-2 rounded">✕</button>`;
  d.querySelector("button").onclick=()=>d.remove(); box.appendChild(d);
  setTimeout(()=>{ if(d.isConnected) d.remove(); },3500);
};

/* ========= Confetti ========= */
function confettiBurst(n=40){
  const frag=document.createDocumentFragment();
  for(let i=0;i<n;i++){
    const s=document.createElement("span");
    s.style.cssText=`position:fixed;top:10px;right:10px;width:8px;height:8px;background:hsl(${Math.random()*360}deg 90% 60%);border-radius:2px;transform:translate(${(Math.random()*-160)}px,${(Math.random()*60)}px) rotate(${Math.random()*360}deg);opacity:.95;z-index:9999;`;
    frag.appendChild(s);
    const dx=(Math.random()*2-1)*200, dy=200+Math.random()*300, rot=360+Math.random()*360, t=800+Math.random()*800;
    s.animate([{transform:s.style.transform,opacity:.95},{transform:`translate(${dx}px,${dy}px) rotate(${rot}deg)`,opacity:0}],{duration:t,easing:"cubic-bezier(.2,.8,.2,1)"}).onfinish=()=>s.remove();
  }
  document.body.appendChild(frag);
}

/* ========= Teams & members ========= */
function ensureTeam(s, code){
  if(!s.teams[code]) s.teams[code]={teamName:"",managerEmail:"",activities:[],pending:[],members:{},chat:[],town:{owned:[],unlocked:[],active:null,lastActive:Date.now()}};
  return s.teams[code];
}
function ensureMember(team, email){
  if(!team.members[email]){
    const foods=Object.keys(CATALOG.food); const fav=foods[Math.floor(Math.random()*foods.length)];
    let dis=foods[Math.floor(Math.random()*foods.length)]; if(dis===fav) dis=foods[(foods.indexOf(dis)+1)%foods.length];
    team.members[email]={firstName:"",email,coins:30,
      llama:{name:"",hunger:60,happiness:60,xp:0,level:1,lastTick:Date.now(),fedStreak:0},
      owned:{},equipped:{hat:null,neck:null,pants:null,shoes:null,accessories:[],background:"bg_meadow"},
      inventory:{hay:1,carrot:1,espresso:0}, giftsInbox:[],
      achievements:{badges:{}}, progress:{}, checkins:{}, streak:{count:0,lastDay:null},
      personality:{favoriteFood:fav,dislikedFood:dis}, lastReads:{chat:0}, stats:{progressClicks:[]}
    };
  }
  return team.members[email];
}

/* ========= Llama sim ========= */
function tick(member){
  const now=Date.now(), el=Math.max(0,Math.round((now-(member.llama.lastTick||now))/60000));
  if(el<=0) return; member.llama.lastTick=now;
  member.llama.hunger=Math.max(0, member.llama.hunger-0.5*(el/5));
  const pen = member.llama.hunger<30?0.6:member.llama.hunger<50?0.3:0;
  member.llama.happiness=Math.max(0, Math.min(100, member.llama.happiness-pen*(el/5)));
}
function addXP(member, amt=2){ member.llama.xp+=amt; while(member.llama.xp>=member.llama.level*50){ member.llama.xp-=member.llama.level*50; member.llama.level++; Toast("Your llama leveled up!","success"); }}

/* ========= Town / Pomodoro builds ========= */
const IDLE_MS=20000;
let lastInput=Date.now();
["mousemove","keydown","click","touchstart","scroll"].forEach(evt=>addEventListener(evt,()=>{lastInput=Date.now()}));
function townTick(team){
  const active= document.visibilityState==="visible" && (Date.now()-lastInput)<IDLE_MS;
  team.town.lastActive = active ? Date.now() : team.town.lastActive;
  if(!team.town.active || !active) return;
  const a=team.town.active; a.activeMs = (a.activeMs||0) + 1000;
  if(a.activeMs >= a.durationMs){
    const b = BUILDINGS.find(x=>x.key===a.key);
    team.town.owned.push(a.key);
    b.unlocks.forEach(u=>{ if(!team.town.unlocked.includes(u)) team.town.unlocked.push(u); });
    if(b.rareDrop && Math.random()<0.25){
      const mem = team.members[a.startedBy];
      if(mem){ mem.owned[b.rareDrop]=true; }
    }
    team.town.active=null;
    Toast(`${b.name} complete! New features unlocked.`,"success");
    confettiBurst(60);
  }
}
setInterval(()=>{
  if(!session.teamCode) return;
  const s=load(), team=s.teams[session.teamCode]; if(!team) return;
  townTick(team); save(s);
  if(!$("#repDashboard")?.classList.contains("hidden")){
    const member=team.members[session.email]; if(!member) return;
    tick(member); save(s);
    $("#hungerBar").style.width = `${Math.round(member.llama.hunger)}%`;
    $("#happinessBar").style.width = `${Math.round(member.llama.happiness)}%`;
  }
},1000);

/* ========= Gates & chat unread ========= */
const gate = (team, key)=> team.town.unlocked.includes(key);
function unreadCount(team, me){
  const since = (me.lastReads?.chat)||0;
  return team.chat.filter(m=>m.at>since && m.from!==me.email).length;
}
function markChatRead(){
  const s=load(), t=s.teams[session.teamCode], me=t.members[session.email];
  me.lastReads.chat = Date.now(); save(s); updateChatBadges();
}
function updateChatBadges(){
  const s=load(), t=s.teams[session.teamCode]; if(!t) return;
  const me=t.members[session.email]; if(!me) return;
  const n = unreadCount(t, me);
  ["#chatBadgeRep","#chatBadgeMgr"].forEach(sel=>{
    const el=$(sel); if(!el) return;
    el.textContent = n>99?"99+": String(n);
    el.classList.toggle("hidden", n===0);
  });
}

/* ========= Badges (simple) ========= */
const Badges={
  defs:{ streak_3:{name:"Warm Up"}, streak_7:{name:"One Week"}, path_master:{name:"Path Master"}, accessor_3:{name:"Accessorizer"} },
  unlock(m,k){ if(m.achievements.badges[k]) return; m.achievements.badges[k]=Date.now(); Toast(`Badge earned: ${this.defs[k]?.name||k}`,"success"); },
  render(m){ const g=$("#badgesGrid"); if(!g) return; g.innerHTML="";
    Object.keys(this.defs).forEach(k=>{ const d=document.createElement("div"); d.className="badge";
      d.innerHTML=`<span>${m.achievements.badges[k]?"🏅":"🔒"}</span><div><div class="font-semibold">${this.defs[k].name}</div><div class="text-xs text-white/70">—</div></div>`; g.appendChild(d); });
  }
};

/* ========= Render helpers ========= */
function findItem(key){
  for(const g of ["hats","neckwear","pants","shoes","accessories"]){ const f=(CATALOG[g]||[]).find(i=>i.key===key); if(f) return f; }
  return null;
}
function applyLayer(slot,m){
  const key=m.equipped[slot], el=$("#layer-"+slot); if(!el) return;
  if(!key){ el.src=""; el.style.transform="translate(0,0) scale(1) rotate(0deg)"; return; }
  const item=findItem(key); if(!item) return; el.src=item.image;
  const o=item.offset||{x:0,y:0,scale:1,rotate:0}; el.style.transform=`translate(${o.x}px,${o.y}px) scale(${o.scale}) rotate(${o.rotate}deg)`;
}
function applyAccessories(m){
  const wrap=$("#layer-accessories"); wrap.innerHTML="";
  (m.equipped.accessories||[]).forEach(key=>{ const it=findItem(key); if(!it) return;
    const img=document.createElement("img"); img.className="llama-layer"; img.src=it.image;
    const o=it.offset||{x:0,y:0,scale:1,rotate:0}; img.style.transform=`translate(${o.x}px,${o.y}px) scale(${o.scale}) rotate(${o.rotate}deg)`;
    wrap.appendChild(img);
  });
}
function applyBackground(m){
  const bgKey=m.equipped.background||"bg_meadow"; const b=CATALOG.background.find(x=>x.key===bgKey); $("#llamaCanvas").style.background=b?b.bgCSS:"transparent";
}
function dailyStreak(m){
  const t=todayKey(); if(m.streak.lastDay===t) return;
  const y=new Date(); y.setDate(y.getDate()-1); const yk=y.toISOString().slice(0,10);
  m.streak.count = (!m.streak.lastDay || m.streak.lastDay!==yk) ? 1 : (m.streak.count+1);
  m.streak.lastDay=t; m.coins+=2; if(m.streak.count===3) Badges.unlock(m,"streak_3"); if(m.streak.count%7===0) Badges.unlock(m,"streak_7");
}

/* ========= Shop / Activities / Social renders ========= */
function renderPathAndActivities(t,m){
  const path=$("#pathNodes"); path.innerHTML=""; const list=$("#activitiesList"); list.innerHTML="";
  const dk=todayKey(); if(!m.progress[dk]) m.progress[dk]={};
  (t.activities||[]).slice(0,4).forEach((a,i)=>{
    const slot=m.progress[dk][i]||(a.target?{count:0}:{done:false}); m.progress[dk][i]=slot;
    const complete=a.target? (slot.count||0)>=a.target : !!slot.done;
    const node=document.createElement("div"); node.className=`px-3 py-2 rounded-xl border ${complete?'bg-emerald-500/20 border-emerald-400':'bg-white/5 border-white/10'}`;
    node.innerHTML=`<div class="text-sm font-semibold">${a.label}</div><div class="text-[10px] text-white/70">${a.target?`Target ${a.target}`:'Checkbox'}</div>`; path.appendChild(node);
    const row=document.createElement("div"); row.className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between";
    row.innerHTML = a.target ? `<div><div class="font-semibold">${a.label}</div><div class="text-xs text-white/60">Target ${a.target} • Progress ${slot.count||0}</div></div>
      <div class="flex items-center gap-2">
        <button class="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded" onclick="Handlers.adjustProgress(${i},-1)">–</button>
        <button class="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded" onclick="Handlers.adjustProgress(${i},1)">+1</button>
      </div>` :
      `<div><div class="font-semibold">${a.label}</div><div class="text-xs text-white/60">Checkbox</div></div>
       <div><label class="inline-flex items-center gap-2"><input type="checkbox" ${slot.done?'checked':''} onchange="Handlers.toggleDone(${i}, this.checked)" /><span>Done</span></label></div>`;
    list.appendChild(row);
  });
}
function renderGiftingSelectors(t,m){
  const recSel=$("#repGiftRecipient"); if(recSel){ recSel.innerHTML=""; Object.values(t.members).forEach(x=>{ if(x.email===m.email) return; const o=document.createElement("option"); o.value=x.email; o.textContent=x.firstName||x.email; recSel.appendChild(o); }); }
  const itemSel=$("#repGiftItem"); if(itemSel){ itemSel.innerHTML=""; Object.entries(m.inventory).forEach(([k,q])=>{ if(q>0){ const o=document.createElement("option"); o.value=k; o.textContent=`${CATALOG.food[k].emoji} ${CATALOG.food[k].label} (You have ${q})`; itemSel.appendChild(o); }}); }
  const recM=$("#giftRecipient"); if(recM){ recM.innerHTML=""; Object.values(t.members).forEach(x=>{ const o=document.createElement("option"); o.value=x.email; o.textContent=x.firstName||x.email; recM.appendChild(o); }); }
  const giftM=$("#giftItem"); if(giftM){ giftM.innerHTML=""; Object.entries(CATALOG.food).forEach(([k,v])=>{ const o=document.createElement("option"); o.value=k; o.textContent=`${v.emoji} ${v.label} (Cost ${v.cost})`; giftM.appendChild(o); }); }
}
function renderInbox(m){
  const ib=$("#giftInbox"); if(!ib) return; ib.innerHTML="";
  (m.giftsInbox||[]).slice(-10).reverse().forEach(g=>{
    const row=document.createElement("div"); row.className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between";
    row.innerHTML=`<div class="text-sm"><span class="text-white/80">Gift from ${g.fromName||g.from}</span> · ${CATALOG.food[g.itemKey]?.emoji} ${CATALOG.food[g.itemKey]?.label}</div>
    <button class="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded text-sm" onclick="Handlers.claimGift('${g.id}')">Claim</button>`;
    ib.appendChild(row);
  });
}
function renderTownPanel(team){
  const wrap = $("#townPanel"); if(!wrap) return;
  const active = team.town.active;
  wrap.innerHTML = `
    <h2 class="text-xl font-semibold mb-2">Team Town</h2>
    <div class="grid md:grid-cols-2 gap-3">
      <div class="glass rounded-xl p-3">
        <div class="font-semibold mb-2">Build queue</div>
        ${active ? `<div class="text-sm">Building: ${BUILDINGS.find(b=>b.key===active.key).name}</div>
                    <div class="w-full bg-white/10 h-2 rounded mt-2"><div id="buildProg" class="h-2 bg-indigo-400 rounded" style="width:${Math.min(100, Math.round(100*active.activeMs/active.durationMs))}%"></div></div>
                    <div class="text-xs text-white/60 mt-1">Paused when tab is hidden/idle</div>`
                 : `<div class="text-sm text-white/70">No active build</div>`}
      </div>
      <div class="glass rounded-xl p-3">
        <div class="font-semibold mb-2">Unlocked</div>
        <div class="text-xs">${team.town.unlocked.length?team.town.unlocked.join(", "):"—"}</div>
      </div>
    </div>
    <div class="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3" id="buildGrid"></div>
  `;
  const g=$("#buildGrid");
  BUILDINGS.forEach(b=>{
    const owned = team.town.owned.includes(b.key);
    const inQ = active && active.key===b.key;
    const div=document.createElement("div"); div.className="glass rounded-xl p-3";
    div.innerHTML = `
      <div class="font-semibold">${b.name}</div>
      <div class="text-xs text-white/70 mb-1">Cost ${b.cost} • ${b.mins}m • Unlocks: ${b.unlocks.join(", ")}</div>
      <button class="mt-1 bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded text-sm ${owned||inQ?'opacity-50 cursor-not-allowed':''}"
              ${owned||inQ?'disabled':''}
              onclick="Handlers.startBuild('${b.key}')">${owned?'Owned':inQ?'Building…':'Build'}</button>`;
    g.appendChild(div);
  });
}

/* ========= SCREENS (GLOBAL) ========= */
window.Screens = {
  renderManager(){
    const s=load(), t=s.teams[session.teamCode]; if(!t) return window.UI.show("landingPage");
    $("#teamInfo").textContent=`Team ${t.teamName} • Code ${session.teamCode} • Manager ${t.managerEmail}`;
    const list=$("#approvalsList"); list.innerHTML="";
    (t.pending||[]).forEach((p,i)=>{
      const row=document.createElement("div");
      row.className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 gap-3 flex-wrap";
      row.innerHTML=`<div class="flex-1 min-w-[220px]"><div class="font-medium">${p.firstName} <span class="text-white/60">(${p.email})</span></div><div class="text-xs text-white/60">Requested ${new Date(p.requestedAt).toLocaleString()}</div></div>
      <div class="flex gap-2">
        <button class="bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded" onclick="Handlers.approve(${i})">Approve</button>
        <button class="bg-rose-500 hover:bg-rose-600 px-3 py-2 rounded" onclick="Handlers.reject(${i})">Reject</button>
      </div>`;
      list.appendChild(row);
    });
    const c=(t.pending||[]).length; $("#pendingBadge").textContent=c; $("#pendingBadge").classList.toggle("hidden", c===0);
    ["act1","act2","act3","act4"].forEach((id,i)=>{ $("#"+id).value = t.activities[i]? (t.activities[i].target?`${t.activities[i].label} ${t.activities[i].target}`:t.activities[i].label) : "" });
    renderTownPanel(t);
    save(s);
    updateChatBadges();
  },

  renderRep(){
    const s=load(), t=s.teams[session.teamCode]; if(!t) return window.UI.show("landingPage");
    const m=ensureMember(t, session.email); tick(m); dailyStreak(m); save(s);
    $("#repFirstNameLabel").textContent=m.firstName||session.email; $("#repTeamNameLabel").textContent=t.teamName; $("#streakLabel").textContent=`Streak: ${m.streak.count}`;
    const h=m.llama.happiness,g=m.llama.hunger, head=$("#repHeader");
    head.classList.remove("mood-happy","mood-sad","mood-angry","mood-energized");
    if(h>70&&g>50) head.classList.add("mood-happy"); else if(h<35&&g<30) head.classList.add("mood-angry"); else if(h<45) head.classList.add("mood-sad"); else head.classList.add("mood-energized");
    $("#llama-base").src = CATALOG.llamaBase; applyBackground(m); applyLayer("hat",m); applyLayer("neck",m); applyLayer("pants",m); applyLayer("shoes",m); applyAccessories(m);
    $("#llamaNameLabel").textContent = m.llama.name||"Unnamed"; $("#llamaLevel").textContent=m.llama.level; $("#llamaXP").textContent=m.llama.xp;
    $("#hungerBar").style.width = `${Math.round(m.llama.hunger)}%`; $("#happinessBar").style.width=`${Math.round(m.llama.happiness)}%`;

    const chatLocked = !gate(t,"chat");
    $$("[data-btn=chat]").forEach(b=>{ b.disabled=chatLocked; b.title=chatLocked?"Build Networking Center to unlock chat":""; });
    const foodLocked = !gate(t,"food");
    $$("[data-btn=food]").forEach(b=>{ b.disabled=foodLocked; b.title=foodLocked?"Build Market to unlock food":""; });

    renderPathAndActivities(t,m);
    $("#coinsLabel").textContent=`Coins: ${m.coins}`;
    renderGiftingSelectors(t,m);
    renderInbox(m);
    Badges.render(m);
    renderTownPanel(t);
    save(s);
    updateChatBadges();
  },

  renderShop(tab="hats"){
    const s=load(), t=s.teams[session.teamCode], m=t.members[session.email];
    $("#shopCoins").textContent = m.coins; $("#shopXP").textContent = m.llama.xp + (m.llama.level-1)*50;
    const grid=$("#shopGrid"); grid.innerHTML="";
    const addCard=(item,type)=>{
      const isFood=(type==="food"), isBg=(type==="background");
      const owned = isFood? (m.inventory[item.key]||0)>0 : isBg? (m.equipped.background===item.key) : !!m.owned[item.key];
      const equipped = !isFood && !isBg && (m.equipped.hat===item.key || m.equipped.neck===item.key || m.equipped.pants===item.key || m.equipped.shoes===item.key || m.equipped.accessories.includes(item.key));
      const media = isFood? `<div class="text-4xl">${item.emoji}</div>`
                : isBg? `<div class="w-full h-full" style="background:${item.thumbCSS};"></div>`
                : `<img src="${(item.thumb && !item.thumb.startsWith('blob:'))?item.thumb:item.image}" onerror="this.src='${item.image}'" class="w-full h-full object-contain" alt="${item.name}">`;
      const div=document.createElement("div"); div.className="bg-white/5 border border-white/10 rounded-xl p-3";
      div.innerHTML = `<div class="aspect-video bg-white/5 rounded-xl mb-2 flex items-center justify-center overflow-hidden">${media}</div>
        <div class="font-semibold">${isFood?item.label:item.name}</div>
        <div class="text-xs text-white/60 mb-2">${isFood?`Cost ${item.cost} • You have ${(m.inventory[item.key]||0)}`:isBg?`Click to apply`:`Cost ${item.cost?.coins||0} • ${owned?'Owned':'Not owned'}`}</div>
        <div class="grid grid-cols-2 gap-2">
          ${ isFood
              ? `<button class="bg-indigo-500 hover:bg-indigo-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.buyFood('${item.key}')">Buy</button>
                 <button data-btn="food" class="bg-emerald-500 hover:bg-emerald-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.feed('${item.key}')">Feed</button>`
              : isBg
              ? `<button class="col-span-2 bg-indigo-500 hover:bg-indigo-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.applyBackground('${item.key}')">Apply</button>`
              : owned
              ? `<button class="bg-emerald-500 hover:bg-emerald-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.equip('${item.key}')">${equipped?'Unequip':'Equip'}</button>
                 <button class="bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded text-sm" onclick="Handlers.preview('${item.key}')">Preview</button>`
              : `<button class="col-span-2 bg-indigo-500 hover:bg-indigo-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.buy('${item.key}')">Buy</button>`}
        </div>`;
      grid.appendChild(div);
    };

    const allow = {
      hats: gate(t,"shop:hats"), neckwear: gate(t,"shop:neckwear"),
      pants: gate(t,"shop:pants"), shoes: gate(t,"shop:shoes"),
      accessories: true, background: gate(t,"backgrounds"), food: gate(t,"food")
    };
    if(!allow[tab]) tab = Object.keys(allow).find(k=>allow[k]) || "accessories";
    window.currentShopTab = tab;
    $$("#shopModal .tab-btn").forEach(b=>{
      const k=b.dataset.tab; b.disabled=!allow[k]; b.title = allow[k]?"": "Build to unlock";
      b.classList.toggle("opacity-50", !allow[k]);
      b.classList.toggle("active", k===tab);
    });

    const source = tab==="food"      ? Object.values(CATALOG.food)
                : tab==="background" ? CATALOG.background
                : CATALOG[tab]||[];
    source.forEach(i=>addCard(i, tab));
  },

  renderChat(){
    const s=load(), t=s.teams[session.teamCode]; const feed=$("#chatFeed"); feed.innerHTML="";
    t.chat.slice(-100).forEach(m=>{
      const row=document.createElement("div"); row.className="flex items-start gap-2";
      row.innerHTML=`<div class="bg-white/5 border border-white/10 rounded-xl px-3 py-2"><div class="text-xs text-white/60">${m.name} • ${new Date(m.at).toLocaleTimeString()}</div><div class="text-sm">${m.text}</div></div>`;
      feed.appendChild(row);
    });
    feed.scrollTop=feed.scrollHeight;
  }
};

/* ========= UI (GLOBAL) ========= */
window.UI = {
  show(id){
    $$("section").forEach(s=>s.classList.add("hidden"));
    $("#"+id)?.classList.remove("hidden");
    if(id==="managerDashboard") Screens.renderManager();
    if(id==="repDashboard") Screens.renderRep();
  },
  openShop(){ $("#shopModal").classList.add("show"); Screens.renderShop(window.currentShopTab||"hats"); },
  closeShop(){ $("#shopModal").classList.remove("show"); },
  switchShopTab(tab,btn){ $$("#shopModal .tab-btn").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); window.currentShopTab=tab; Screens.renderShop(tab); },
  openMood(){ $("#moodModal").classList.add("show"); }, closeMood(){ $("#moodModal").classList.remove("show"); },
  openChat(){ $("#chatModal").classList.add("show"); Screens.renderChat(); (function(){const s=load(),t=s.teams[session.teamCode],me=t.members[session.email]; me.lastReads.chat=Date.now(); save(s); updateChatBadges();})(); },
  closeChat(){ $("#chatModal").classList.remove("show"); }
};
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ UI.closeShop(); UI.closeMood(); UI.closeChat(); }});

/* ========= Handlers (GLOBAL) ========= */
window.Handlers = {
  createManagerAccount(e){ e.preventDefault(); const email=$("#managerEmail").value.trim().toLowerCase(); const teamName=$("#teamName").value.trim();
    if(!email||!teamName) return; const s=load(); const code=uid(10); const t=ensureTeam(s,code); t.teamName=teamName;t.managerEmail=email; save(s); session={role:"manager",teamCode:code,email}; Toast(`Team created. Code ${code}`,"success"); UI.show("managerDashboard"); },
  managerLogin(e){ e.preventDefault(); const email=$("#loginEmail").value.trim().toLowerCase(); const code=$("#loginTeamCode").value.trim().toUpperCase();
    const s=load(), t=s.teams[code]; if(!t||t.managerEmail!==email) return Toast("Invalid email or team code","error"); session={role:"manager",teamCode:code,email}; UI.show("managerDashboard"); },
  logout(){ session={role:null,teamCode:null,email:null}; Toast("Signed out","success"); UI.show("landingPage"); },

  approve(i){ const s=load(), t=s.teams[session.teamCode], p=t.pending[i]; if(!p) return; const m=ensureMember(t,p.email); m.firstName=p.firstName; t.pending.splice(i,1); save(s); Toast("Rep approved","success"); Screens.renderManager(); },
  reject(i){ const s=load(), t=s.teams[session.teamCode]; t.pending.splice(i,1); save(s); Toast("Request removed","warn"); Screens.renderManager(); },
  refreshApprovals(){ Screens.renderManager(); },

  saveActivities(e){ e.preventDefault(); const parse=r=>{if(!r)return null; const m=r.match(/(\d+)/); const tg=m?parseInt(m[1],10):null; let label=r.replace(/\d+/g,"").trim(); if(!label) label=r.trim(); return {label,target:isNaN(tg)?null:tg}};
    const a=["act1","act2","act3","act4"].map(id=>parse($("#"+id).value.trim())).filter(Boolean);
    const s=load(), t=s.teams[session.teamCode]; t.activities=a.slice(0,4); const dk=todayKey();
    Object.values(t.members).forEach(m=>{ m.progress[dk]={}; t.activities.forEach((ac,i)=>{ m.progress[dk][i]=ac.target?{count:0}:{done:false}; }); });
    save(s); Toast("Activities saved & published","success"); Screens.renderManager(); },

  repJoinTeam(e){ e.preventDefault(); const firstName=$("#repFirstName").value.trim(), email=$("#repEmail").value.trim().toLowerCase(), code=$("#repTeamCode").value.trim().toUpperCase();
    const s=load(), t=s.teams[code]; if(!t) return Toast("Team code not found","error");
    if(t.members[email]){ session={role:"rep",teamCode:code,email}; return UI.show("repDashboard"); }
    if(t.pending.find(p=>p.email===email)){ session={role:"rep",teamCode:code,email}; return UI.show("pendingApproval"); }
    t.pending.push({email,firstName,requestedAt:Date.now()}); save(s); session={role:"rep",teamCode:code,email}; Toast("Request sent","success"); UI.show("pendingApproval"); },

  checkApprovalStatus(){ const s=load(), t=s.teams[session.teamCode]; if(!t) return UI.show("landingPage"); if(t.members[session.email]) UI.show("repDashboard"); else Toast("Still pending","warn"); },

  repLogin(e){ e.preventDefault(); const email=$("#repLoginEmail").value.trim().toLowerCase(), code=$("#repLoginTeamCode").value.trim().toUpperCase(); const s=load(), t=s.teams[code];
    if(!t||!t.members[email]){ if(t && t.pending.find(p=>p.email===email)){ session={role:"rep",teamCode:code,email}; return UI.show("pendingApproval"); } return Toast("Not approved yet or invalid","error"); }
    session={role:"rep",teamCode:code,email}; UI.show("repDashboard"); },

  promptRename(){ const nm=prompt("Enter llama name"); if(!nm) return; const lower=nm.toLowerCase(); if(profanityList.some(b=>lower.includes(b))) return Toast("Please use a different name","error");
    const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; m.llama.name=nm.trim(); save(s); Toast("Name updated","success"); Screens.renderRep(); },

  preview(k){ this.equip(k); },
  buy(k){ const it=findItem(k); if(!it) return; const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; const cost=it.cost?.coins||0; if(m.coins<cost) return Toast("Not enough coins","error");
    m.coins-=cost; m.owned[k]=true; save(s); Toast("Purchased","success"); confettiBurst(50); Screens.renderShop(window.currentShopTab||"hats"); Screens.renderRep();
    const eqc=["hat","neck","pants","shoes"].filter(s=>m.equipped[s]).length+(m.equipped.accessories||[]).length; if(eqc>=3) Badges.unlock(m,"accessor_3"); },

  equip(k){ const it=findItem(k); if(!it) return; const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; if(!m.owned[k]) return Toast("You don't own this yet","warn");
    if(it.slot==="accessory"){ const i=m.equipped.accessories.indexOf(k); if(i>=0) m.equipped.accessories.splice(i,1); else m.equipped.accessories.push(k); }
    else { m.equipped[it.slot] = (m.equipped[it.slot]===k? null : k); }
    save(s); Screens.renderRep(); Screens.renderShop(window.currentShopTab||"hats"); },

  applyBackground(k){ const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; m.equipped.background=k; save(s); Toast("Background applied","success"); Screens.renderRep(); Screens.renderShop(window.currentShopTab||"background"); },

  buyFood(k){ const f=CATALOG.food[k]; if(!f) return; const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; if(m.coins<f.cost) return Toast("Not enough coins","error");
    if(!gate(t,"food")) return Toast("Build Market to unlock food","warn");
    m.coins-=f.cost; m.inventory[k]=(m.inventory[k]||0)+1; save(s); Toast("Food purchased","success"); confettiBurst(30); Screens.renderShop(window.currentShopTab||"food"); Screens.renderRep(); },

  feed(k){ const f=CATALOG.food[k]; if(!f) return; const s=load(), t=s.teams[session.teamCode], m=t.members[session.email];
    if(!gate(t,"food")) return Toast("Build Market to unlock food","warn");
    if((m.inventory[k]||0)<=0) return Toast("You don't have this item","error");
    m.inventory[k]-=1; let happy=f.happiness; if(gate(t,"buff:gym")) happy+=1; if(gate(t,"buff:espresso")&&k==="espresso") happy+=1;
    m.llama.hunger=Math.min(100,m.llama.hunger+f.hunger); m.llama.happiness=Math.min(100,m.llama.happiness+happy); addXP(m,3); m.coins+=1; save(s); Toast(`Fed ${f.label}`,"success"); Screens.renderRep(); },

  adjustProgress(i,delta){ const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; const d=todayKey(), a=t.activities[i]; if(!a?.target) return;
    const now=Date.now(); m.stats.progressClicks=(m.stats.progressClicks||[]).filter(ts=>now-ts<20000); const last=m.stats.progressClicks[m.stats.progressClicks.length-1]||0;
    if(m.stats.progressClicks.length>=5 || (now-last)<350){ return Toast("Whoa—too fast. Take a beat ✋","warn"); }
    m.stats.progressClicks.push(now);
    const slot=m.progress[d]?.[i]||(m.progress[d][i]={count:0}); const before=slot.count||0; slot.count=Math.max(0, before+delta);
    if(before<a.target && slot.count>=a.target){ m.coins+=5; m.llama.happiness=Math.min(100,m.llama.happiness+5); addXP(m,4); Toast(`Completed: ${a.label}`,"success"); this.checkPath(t,m); }
    save(s); Screens.renderRep(); },

  toggleDone(i,checked){ const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; const d=todayKey(); const slot=m.progress[d][i]; slot.done=!!checked;
    if(slot.done){ m.coins+=3; m.llama.happiness=Math.min(100,m.llama.happiness+4); addXP(m,3); this.checkPath(t,m); } save(s); Screens.renderRep(); },

  checkPath(t,m){ const d=todayKey(); const all=(t.activities||[]).slice(0,4).every((a,i)=>a.target? (m.progress[d][i].count>=a.target): !!m.progress[d][i].done);
    if(all){ m.coins+=8; addXP(m,6); Toast("Path complete! +8 coins","success"); if(t.town.unlocked.includes("perk:celebration")) confettiBurst(80); } },

  submitMood(v){ const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; const now=new Date(); m.checkins[todayKey()]={mood:v,at:now.getTime()};
    m.llama.happiness=Math.min(100,m.llama.happiness+Math.max(0,v-2)); save(s); Toast("Mood saved","success"); UI.closeMood(); Screens.renderRep(); Screens.renderManager(); },

  sendChat(e){ e.preventDefault(); const input=$("#chatInput"); const text=input.value.trim(); if(!text) return; const s=load(), t=s.teams[session.teamCode];
    if(!t.town.unlocked.includes("chat")) return Toast("Build Networking Center to unlock chat","warn");
    const me=t.members[session.email]||{firstName:session.email}; t.chat.push({from:session.email,name:me.firstName||session.email,text,at:Date.now()}); save(s); input.value=""; Screens.renderChat(); updateChatBadges(); },

  repGift(e){ e.preventDefault(); const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; if(!t.town.unlocked.includes("gifting")) return Toast("Build Networking Center to unlock gifting","warn");
    const rec=$("#repGiftRecipient").value, itemKey=$("#repGiftItem").value; if((m.inventory[itemKey]||0)<=0) return Toast("You do not have this item","error");
    m.inventory[itemKey]-=1; t.members[rec].giftsInbox.push({id:uid(8),from:session.email,fromName:m.firstName,itemKey,at:Date.now()}); save(s); Toast("Gift sent","success"); Screens.renderRep(); },

  managerGift(e){ e.preventDefault(); const s=load(), t=s.teams[session.teamCode]; if(!t.town.unlocked.includes("gifting")) return Toast("Build Networking Center to unlock gifting","warn");
    const rec=$("#giftRecipient").value, itemKey=$("#giftItem").value; t.members[rec].giftsInbox.push({id:uid(8),from:session.email,fromName:t.managerEmail,itemKey,at:Date.now()}); save(s); Toast("Gift sent","success"); Screens.renderManager(); },

  claimGift(id){ const s=load(), t=s.teams[session.teamCode], m=t.members[session.email]; const i=m.giftsInbox.findIndex(g=>g.id===id); if(i<0) return;
    const g=m.giftsInbox[i]; m.inventory[g.itemKey]=(m.inventory[g.itemKey]||0)+1; m.giftsInbox.splice(i,1); save(s); Toast("Gift claimed","success"); Screens.renderRep(); },

  startBuild(key){ const s=load(), t=s.teams[session.teamCode], me=t.members[session.email]; const b=BUILDINGS.find(x=>x.key===key); if(!b) return;
    if(t.town.owned.includes(key) || (t.town.active&&t.town.active.key===key)) return;
    if(me.coins<b.cost) return Toast("Not enough coins","error");
    me.coins-=b.cost; t.town.active={ key, startedAt:Date.now(), startedBy:session.email, activeMs:0, durationMs:b.mins*60*1000 }; save(s); Toast(`Building ${b.name}… Come back in ${b.mins} min!`,"success"); Screens.renderRep(); Screens.renderManager(); }
};

/* ========= Router + seed ========= */
window.UI.show("landingPage");
(function seed(){
  const s=load(); if(Object.keys(s.teams).length) return;
  const code=uid(10); s.teams[code]={
    teamName:"Demo Team", managerEmail:"manager@example.com",
    activities:[ {label:"Log calls",target:3},{label:"Send follow ups",target:5},{label:"Update pipeline",target:null},{label:"Prep opportunities",target:null} ],
    pending:[], members:{}, chat:[], town:{owned:[],unlocked:[],active:null,lastActive:Date.now()}
  };
  const t=s.teams[code]; const m1=ensureMember(t,"alex@example.com"); m1.firstName="Alex"; m1.coins=50; const m2=ensureMember(t,"casey@example.com"); m2.firstName="Casey";
  save(s);
})();

