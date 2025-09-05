// app.js (v5)

const STORAGE_KEY="llamalog_state_v12";
const DEMO_BUILD_MS=15000, IDLE_MS=20000;
const profanity=["fuck","shit","bitch","asshole","dick","cunt","bastard","slut","whore","fag","retard","twat","prick","wank","bollock"];
const uid=(n=10)=>{const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";return Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>c[b%c.length]).join("")};
const today=()=>new Date().toISOString().slice(0,10);
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const load=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||{teams:{}}}catch{return{teams:{}}}};
const save=s=>localStorage.setItem(STORAGE_KEY,JSON.stringify(s));
let session={role:null,teamCode:null,email:null}; let lastInput=Date.now();
["mousemove","keydown","click","touchstart","scroll"].forEach(e=>addEventListener(e,()=>{lastInput=Date.now()}));

const Toast=(m,t="info")=>{
  const c=$("#toastContainer"),d=document.createElement("div");
  d.className=`glass rounded-xl px-4 py-3 text-sm flex items-start gap-3 border ${t==="success"?"border-emerald-400":t==="error"?"border-rose-400":t==="warn"?"border-amber-400":"border-white/20"}`;
  d.innerHTML=`<div class="flex-1">${m}</div><button class="bg-white/10 hover:bg-white/20 px-2 rounded">✕</button>`;
  d.querySelector("button").onclick=()=>d.remove();
  c.appendChild(d); setTimeout(()=>{if(d.isConnected)d.remove()},3500);
};
function confetti(n=40){
  const f=document.createDocumentFragment();
  for(let i=0;i<n;i++){
    const s=document.createElement("span");
    s.style.cssText=`position:fixed;top:10px;right:10px;width:8px;height:8px;background:hsl(${Math.random()*360} 90% 60%);border-radius:2px;transform:translate(${(Math.random()*-160)}px,${(Math.random()*60)}px) rotate(${Math.random()*360}deg);opacity:.95;z-index:9999;`;
    f.appendChild(s);
    const dx=(Math.random()*2-1)*200,dy=200+Math.random()*300,rot=360+Math.random()*360,t=800+Math.random()*800;
    s.animate([{transform:s.style.transform,opacity:.95},{transform:`translate(${dx}px,${dy}px) rotate(${rot}deg)`,opacity:0}],{duration:t,easing:"cubic-bezier(.2,.8,.2,1)"}).onfinish=()=>s.remove();
  }
}

// Data bootstrap
function ensureTeam(s,code){
  if(!s.teams[code]) s.teams[code]={teamName:"",managerEmail:"",activities:[],pending:[],members:{},chat:[],reports:[],ui:{activitiesCollapsed:false}};
  return s.teams[code];
}
function ensureMember(team,email){
  if(!team.members[email]){
    const foods=Object.keys(CATALOG.food),fav=foods[Math.floor(Math.random()*foods.length)];
    let dis=foods[Math.floor(Math.random()*foods.length)]; if(dis===fav) dis=foods[(foods.indexOf(dis)+1)%foods.length];
    team.members[email]={
      firstName:"",email,coins:50,
      llama:{name:"",hunger:60,happiness:60,xp:0,level:1,lastTick:Date.now()},
      owned:{},equipped:{hat:null,neck:null,pants:null,shoes:null,accessories:[],background:"bg_meadow"},
      inventory:{},giftsInbox:[],achievements:{badges:{}},
      progress:{},checkins:{},streak:{count:0,lastDay:null},
      personality:{favoriteFood:fav,dislikedFood:dis},
      lastReads:{chat:0},stats:{progressClicks:[]},
      pets:[],activePet:null,flags:{},
      town:{owned:[],unlocked:[],active:null,lastActive:Date.now()},
      reports:{}
    };
  }
  return team.members[email];
}
function findItem(key){
  for(const g of["hats","neckwear","pants","shoes","accessories"]){
    const f=(CATALOG[g]||[]).find(i=>i.key===key);
    if(f) return f;
  }
  return null;
}

// XP weighting utilities
function computeXPForActivity(a){
  // If you ever add explicit weights, honor a.xpUnit / a.bonusXP.
  if(a.xpUnit && a.bonusXP) return {xpUnit:a.xpUnit, bonusXP:a.bonusXP};
  if(a.target){ // numeric—scale by target
    const xpUnit=Math.max(1, Math.round(Math.min(3, a.target/3))); // 1..3 per +1
    const bonusXP=Math.max(3, Math.round(a.target/2)+2);          // completion bonus
    return {xpUnit, bonusXP};
  }
  return {xpUnit:3, bonusXP:0}; // checkbox
}

// Tick loops
function tick(m){
  const now=Date.now(),el=Math.max(0,Math.round((now-(m.llama.lastTick||now))/60000));
  if(el<=0) return;
  m.llama.lastTick=now;
  m.llama.hunger=Math.max(0,m.llama.hunger-0.5*(el/5));
  const pen=m.llama.hunger<30?0.6:m.llama.hunger<50?0.3:0;
  m.llama.happiness=Math.max(0,Math.min(100,m.llama.happiness-pen*(el/5)));
}
function addXP(m,a=2){m.llama.xp+=a;while(m.llama.xp>=m.llama.level*50){m.llama.xp-=m.llama.level*50;m.llama.level++;Toast("Your llama leveled up!","success")}}
const gate=(member,key)=>!!(member?.town?.unlocked||[]).includes(key);

function townTick(m){
  const active=document.visibilityState==="visible"&&(Date.now()-lastInput)<IDLE_MS;
  m.town.lastActive=active?Date.now():m.town.lastActive;
  const q=m.town.active; if(!q||!active) return;
  q.activeMs=(q.activeMs||0)+1000;
  if(q.activeMs>=q.durationMs){
    const b=BUILDINGS.find(x=>x.key===q.key);
    m.town.owned.push(q.key);
    (b.unlocks||[]).forEach(u=>{if(!m.town.unlocked.includes(u)) m.town.unlocked.push(u)});
    if(b.rareDrop && Math.random()<0.25) m.owned[b.rareDrop]=true;
    m.town.active=null;
    Toast(`${b.name} complete! New features unlocked.`,"success");
    confetti(60);
  }
}
setInterval(()=>{
  if(!session.teamCode||session.role!=="rep")return;
  const s=load(),t=s.teams[session.teamCode],m=t.members[session.email]; if(!m) return;
  townTick(m); save(s);
  if(!$("#repDashboard")?.classList.contains("hidden")){
    tick(m); save(s);
    $("#hungerBar").style.width=`${Math.round(m.llama.hunger)}%`;
    $("#happinessBar").style.width=`${Math.round(m.llama.happiness)}%`;
  }
},1000);

// Unread chat badge
function unread(team,me){const since=me.lastReads?.chat||0;return team.chat.filter(m=>m.at>since&&m.from!==me.email).length}
function updateBadges(){
  const s=load(),t=s.teams[session.teamCode]; if(!t) return;
  const me=t.members[session.email]; if(!me) return;
  const n=unread(t,me);
  ["#chatBadgeRep","#chatBadgeMgr"].forEach(sel=>{
    const el=$(sel); if(!el) return;
    el.textContent=n>99?"99+":String(n);
    el.classList.toggle("hidden",n===0);
  });
}

// Renders
function renderTownPanel(team,member){
  const wrap = member ? $("#townPanelRep") : $("#townPanelMgr");
  if(!wrap) return;

  if(member){
    const a=member.town.active,prog=a?Math.min(100,Math.round(100*a.activeMs/a.durationMs)):0;
    const secsLeft = a ? Math.max(0, Math.ceil((a.durationMs - (a.activeMs||0))/1000)) : 0;
    // Header + progress
    wrap.innerHTML=`<h2 class="text-2xl font-bold mb-3">Your Town</h2>
      ${a?`
        <div class="glass rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="font-semibold">${(BUILDINGS.find(b=>b.key===a.key).emoji)||"🏗️"} ${BUILDINGS.find(b=>b.key===a.key).name}</div>
            <div class="text-sm text-white/70">~${secsLeft}s left</div>
          </div>
          <div class="w-full bg-white/10 h-3 rounded mt-2"><div class="h-3 rounded" style="width:${prog}%; background:linear-gradient(90deg,#60a5fa,#a78bfa)"></div></div>
          <div class="text-xs text-white/60 mt-1">Timer pauses if the tab is hidden or idle. Tip: log your activities while you wait!</div>
        </div>`:""}
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" id="buildGrid"></div>`;

    const grid=$("#buildGrid");
    (window.buildFilter||"").toString(); // no-op but keeps future expand simple
    BUILDINGS.forEach(b=>{
      const owned=member.town.owned.includes(b.key), inQ=a&&a.key===b.key, canAfford=member.coins>=b.cost;
      const card=document.createElement("div");
      card.className="rounded-2xl overflow-hidden border border-white/10";
      card.innerHTML=`
        <div class="p-4" style="background:${b.bg}">
          <div class="text-2xl">${b.emoji||"🏗️"}</div>
          <div class="font-semibold text-white mt-1">${b.name}</div>
          <div class="text-xs opacity-90">${b.desc||""}</div>
        </div>
        <div class="p-3 bg-white/5">
          <div class="flex flex-wrap gap-1 mb-2">
            ${(b.unlocks||[]).map(u=>`<span class="text-[10px] px-2 py-[2px] rounded-full border border-white/15 bg-white/5">${u}</span>`).join("")}
            ${b.rareDrop?`<span class="text-[10px] px-2 py-[2px] rounded-full border border-amber-300/40 bg-amber-300/10">rare: ${b.rareDrop}</span>`:""}
          </div>
          <div class="flex items-center justify-between text-sm">
            <div class="text-white/80">Cost <b>${b.cost}</b> · ${Math.round(b.mins*60)}s</div>
            <button class="px-3 py-1.5 rounded bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              ${owned||inQ||!canAfford?'disabled':''}
              onclick="Handlers.startBuild('${b.key}')">${owned?'Owned':inQ?'Building…':'Build'}</button>
          </div>
        </div>`;
      grid.appendChild(card);
    });

  }else{
    // Manager read-only summary + mood overview
    const ownedCounts={}; Object.values(team.members).forEach(m=>m.town?.owned?.forEach(k=>ownedCounts[k]=(ownedCounts[k]||0)+1));
    const todayStr=today();
    const todays=team.reports.filter(r=>new Date(r.at).toISOString().slice(0,10)===todayStr);
    const avg=todays.length?Math.round(todays.reduce((a,b)=>a+b.mood,0)/todays.length):0;
    const moodEmoji=avg>=5?"🤩":avg===4?"😄":avg===3?"🙂":avg===2?"😕":avg===1?"😫":"—";

    wrap.innerHTML=`
      <h2 class="text-2xl font-bold mb-3">Team Town (read-only)</h2>
      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <div class="glass rounded-xl p-4">
          <div class="text-sm text-white/70">Today’s mood overview</div>
          <div class="text-3xl mt-1">${moodEmoji}</div>
          <div class="text-xs text-white/60 mt-1">${todays.length?`Avg ${avg}/5 from ${todays.length} reports`:`No reports yet today`}</div>
        </div>
        <div class="glass rounded-xl p-4 md:col-span-2">
          <div class="text-sm text-white/70 mb-2">Buildings owned across reps</div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${BUILDINGS.map(b=>`
              <div class="rounded-xl border border-white/10 overflow-hidden">
                <div class="p-3" style="background:${b.bg}">
                  <div class="text-lg">${b.emoji||"🏗️"} ${b.name}</div>
                </div>
                <div class="p-2 bg-white/5 text-sm">Owned by <b>${ownedCounts[b.key]||0}</b> reps</div>
              </div>`).join("")}
          </div>
        </div>
      </div>`;
  }
}

function renderActivities(t,m){
  const path=$("#pathNodes"); path.innerHTML="";
  const list=$("#activitiesList"); list.innerHTML="";
  const dk=today(); if(!m.progress[dk]) m.progress[dk]={};

  if(!(t.activities||[]).length){
    path.innerHTML=`<div class="px-3 py-2 rounded-xl border bg-white/5 border-white/10">No activities published yet</div>`;
    return;
  }

  (t.activities||[]).slice(0,4).forEach((a,i)=>{
    const slot=m.progress[dk][i]||(a.target?{count:0}:{done:false});
    m.progress[dk][i]=slot;
    const done=a.target?(slot.count||0)>=a.target:!!slot.done;
    const xp=computeXPForActivity(a);

    const node=document.createElement("div");
    node.className=`px-3 py-2 rounded-xl border ${done?'bg-emerald-500/20 border-emerald-400':'bg-white/5 border-white/10'}`;
    node.innerHTML=`<div class="text-sm font-semibold">${a.label}</div><div class="text-[10px] text-white/70">${a.target?`Target ${a.target}`:'Checkbox'} • XP ${a.target?`+${xp.xpUnit}/log, +${xp.bonusXP} bonus`:`+${xp.xpUnit} on check`}</div>`;
    path.appendChild(node);

    const row=document.createElement("div");
    row.className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between";
    row.innerHTML=a.target?`
      <div><div class="font-semibold">${a.label}</div>
        <div class="text-xs text-white/60">Target ${a.target} • Progress ${slot.count||0}</div></div>
      <div class="flex items-center gap-2">
        <button class="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded" onclick="Handlers.adjustProgress(${i},-1)">–</button>
        <button class="bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded" onclick="Handlers.adjustProgress(${i},1)">+1</button>
      </div>`
      :`<div><div class="font-semibold">${a.label}</div><div class="text-xs text-white/60">Checkbox</div></div>
        <div><label class="inline-flex items-center gap-2"><input type="checkbox" ${slot.done?'checked':''} onchange="Handlers.toggleDone(${i}, this.checked)"><span>Done</span></label></div>`;
    list.appendChild(row);
  });
}

function renderGiftingSelectors(t,m){
  const r=$("#repGiftRecipient"); if(r){ r.innerHTML=""; Object.values(t.members).forEach(x=>{ if(x.email===m.email) return; const o=document.createElement("option"); o.value=x.email;o.textContent=x.firstName||x.email;r.appendChild(o)})}
  const it=$("#repGiftItem"); if(it){ it.innerHTML=""; Object.entries(m.inventory).forEach(([k,q])=>{ if(q>0){ const o=document.createElement("option"); o.value=k;o.textContent=`${CATALOG.food[k].emoji} ${CATALOG.food[k].label} (You have ${q})`; it.appendChild(o)}})}
}
function renderGiftInbox(m){
  const box=$("#giftInbox"); if(!box) return;
  box.innerHTML="";
  (m.giftsInbox||[]).slice(-20).reverse().forEach(g=>{
    const div=document.createElement("div");
    const item=CATALOG.food[g.itemKey];
    div.className="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center justify-between";
    div.innerHTML=`<div class="text-sm">${item.emoji} ${item.label} from ${g.fromName||g.from}</div>
      <button class="bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded text-sm" onclick="Handlers.claimGift('${g.id}')">Claim</button>`;
    box.appendChild(div);
  });
}

function applyBackground(m){
  const b=CATALOG.background.find(x=>x.key===m.equipped.background)||CATALOG.background[0];
  $("#llamaCanvas").style.background=b.bgCSS;
}
function applyLayer(slot,m){
  const key=m.equipped[slot],el=$("#layer-"+slot); if(!el) return;
  if(!key){ el.removeAttribute("src"); return; }
  const item=findItem(key); if(!item) return;
  el.src=item.image; el.style.transform="none";
}
function applyAccessories(m){
  const wrap=$("#layer-accessories"); wrap.innerHTML="";
  (m.equipped.accessories||[]).forEach(k=>{
    const it=findItem(k); if(!it) return;
    const img=document.createElement("img");
    img.className="llama-layer"; img.src=it.image; img.style.transform="none";
    wrap.appendChild(img);
  });
}

// Screens
window.Screens={
  renderManager(){
    const s=load(),t=s.teams[session.teamCode]; if(!t) return UI.show("landingPage");
    $("#teamInfo").textContent=`Team ${t.teamName} • Code ${session.teamCode} • Manager ${t.managerEmail}`;

    const list=$("#approvalsList"); list.innerHTML="";
    (t.pending||[]).forEach((p,i)=>{
      const row=document.createElement("div");
      row.className="flex flex-wrap items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 gap-3";
      row.innerHTML=`<div class="flex-1 min-w-[220px]">
          <div class="font-medium">${p.firstName} <span class="text-white/60">(${p.email})</span></div>
          <div class="text-xs text-white/60">Requested ${new Date(p.requestedAt).toLocaleString()}</div>
        </div>
        <div class="flex gap-2">
          <button class="bg-emerald-500 hover:bg-emerald-600 px-3 py-2 rounded" onclick="Handlers.approve(${i})">Approve</button>
          <button class="bg-rose-500 hover:bg-rose-600 px-3 py-2 rounded" onclick="Handlers.reject(${i})">Reject</button>
        </div>`;
      list.appendChild(row);
    });
    const c=(t.pending||[]).length; $("#pendingBadge").textContent=c; $("#pendingBadge").classList.toggle("hidden",c===0);

    // Activities section: collapsed or form
    const formWrap=$("#activitiesWrap");
    if(t.ui?.activitiesCollapsed && (t.activities||[]).length){
      formWrap.innerHTML=`<div class="bg-emerald-500/15 border border-emerald-400 rounded-xl p-4">
        <div class="font-semibold mb-1">Daily focus saved ✔</div>
        <div class="text-sm text-white/80">${t.activities.map(a=>a.target?`${a.label} (Target ${a.target})`:a.label).join(" • ")}</div>
        <button class="mt-3 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded" onclick="Handlers.editActivities()">Edit</button>
      </div>`;
    }else{
      formWrap.innerHTML=`<div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold mb-2">Daily focus</h2>
          <span class="text-white/60 text-sm">“Log 3 calls” auto-detects the 3 · XP scales with target</span>
        </div>
        <form onsubmit="Handlers.saveActivities(event)" class="grid md:grid-cols-2 gap-3">
          <input id="act1" class="bg-white/10 border border-white/20 rounded-xl p-3" placeholder="Activity 1">
          <input id="act2" class="bg-white/10 border border-white/20 rounded-xl p-3" placeholder="Activity 2">
          <input id="act3" class="bg-white/10 border border-white/20 rounded-xl p-3" placeholder="Activity 3">
          <input id="act4" class="bg-white/10 border border-white/20 rounded-xl p-3" placeholder="Activity 4">
          <button class="md:col-span-2 btn-grad rounded-xl py-3 font-semibold hover:brightness-110 transition">Save & publish</button>
        </form>`;
    }

    const repList=$("#reportsList"); repList.innerHTML="";
    // Mood overview will be in town panel (renderTownPanel manager)
    (t.reports||[]).slice(-10).reverse().forEach(r=>{
      const d=document.createElement("div"); d.className="bg-white/5 border border-white/10 rounded-xl p-3";
      d.innerHTML=`<div class="text-xs text-white/60">${new Date(r.at).toLocaleString()} • ${r.name} (${r.email}) • mood ${r.mood}/5</div>
      <div class="text-sm mt-1 break-words">Why: ${r.why||"—"}</div><div class="text-sm break-words">Q's: ${r.questions||"—"}</div><div class="text-sm break-words">Coaching: ${r.coaching||"—"}</div>`;
      repList.appendChild(d);
    });

    renderTownPanel(t,null);
    save(s); updateBadges();
  },

  renderRep(){
    const s=load(),t=s.teams[session.teamCode]; if(!t) return UI.show("landingPage");
    const m=ensureMember(t,session.email); tick(m); save(s);

    $("#repFirstNameLabel").textContent=m.firstName||session.email;
    $("#repTeamNameLabel").textContent=t.teamName;
    $("#streakLabel").textContent=`Streak: ${m.streak.count||0}`;

    $("#llama-base").src=CATALOG.llamaBase;
    applyBackground(m); applyLayer("hat",m); applyLayer("neck",m); applyLayer("pants",m); applyLayer("shoes",m); applyAccessories(m);
    $("#llamaNameLabel").textContent=m.llama.name||"Unnamed";
    $("#llamaLevel").textContent=m.llama.level; $("#llamaXP").textContent=m.llama.xp;
    $("#hungerBar").style.width=`${Math.round(m.llama.hunger)}%`; $("#happinessBar").style.width=`${Math.round(m.llama.happiness)}%`;

    renderActivities(t,m);
    $("#coinsLabel").textContent=`Coins: ${m.coins}`;
    renderGiftingSelectors(t,m);
    renderGiftInbox(m);
    renderTownPanel(t,m);
    updateBadges();

    const dk=today(); if(!m.reports[dk]) UI.openReport(true);
  },

  renderShop(tab="hats"){
    const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];
    $("#shopCoins").textContent=m.coins; $("#shopXP").textContent=m.llama.xp+(m.llama.level-1)*50;
    const allow={hats:gate(m,"shop:hats"),neckwear:gate(m,"shop:neckwear"),pants:gate(m,"shop:pants"),shoes:gate(m,"shop:shoes"),accessories:true,background:gate(m,"backgrounds"),food:gate(m,"food"),pets:gate(m,"pets")};
    if(!allow[tab]) tab=Object.keys(allow).find(k=>allow[k])||"accessories"; window.currentShopTab=tab;
    $$("#shopModal .tab-btn").forEach(b=>{const k=b.dataset.tab;b.disabled=!allow[k];b.title=allow[k]?"":"Build to unlock";b.classList.toggle("opacity-50",!allow[k]);b.classList.toggle("active",k===tab)});
    const grid=$("#shopGrid"); grid.innerHTML="";
    const addCard=(item,type)=>{
      const isFood=(type==="food"),isBg=(type==="background"),isPet=(type==="pets");
      const owned=isFood? (m.inventory[item.key]||0)>0 : isBg? (m.equipped.background===item.key) : isPet? (m.pets.includes(item.key)) : !!m.owned[item.key];
      const equipped=!isFood && !isBg && !isPet && (m.equipped.hat===item.key||m.equipped.neck===item.key||m.equipped.pants===item.key||m.equipped.shoes===item.key||m.equipped.accessories.includes(item.key));
      const media=isFood?`<div class="text-4xl">${item.emoji}</div>`:isBg?`<div class="w-full h-full" style="background:${item.thumbCSS};"></div>`:isPet?`<div class="text-4xl">🐾</div>`:`<img src="${(item.thumb&& !item.thumb.startsWith('blob:'))?item.thumb:item.image}" onerror="this.src='${item.image}'" class="w-full h-full object-contain" alt="${item.name}">`;
      const div=document.createElement("div"); div.className="bg-white/5 border border-white/10 rounded-xl p-3";
      div.innerHTML=`<div class="aspect-video bg-white/5 rounded-xl mb-2 flex items-center justify-center overflow-hidden">${media}</div>
      <div class="font-semibold">${isFood?item.label:isBg?item.name:isPet?item.label:item.name}</div>
      <div class="text-xs text-white/60 mb-2">${isFood?`Cost ${item.cost} • You have ${(m.inventory[item.key]||0)}`:isBg?`Click to apply` : isPet? `Cost ${item.cost} • ${owned?'Owned':'Not owned'}` : `Cost ${item.cost?.coins||0} • ${owned?'Owned':'Not owned'}`}</div>
      <div class="grid grid-cols-2 gap-2">
        ${isFood?`
          <button class="bg-indigo-500 hover:bg-indigo-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.buyFood('${item.key}')">Buy</button>
          <button data-btn="food" class="bg-emerald-500 hover:bg-emerald-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.feed('${item.key}')">Feed</button>`
        :isBg?`<button class="col-span-2 bg-indigo-500 hover:bg-indigo-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.applyBackground('${item.key}')">Apply</button>`
        :isPet? (owned? `<button class="col-span-2 bg-emerald-500 hover:bg-emerald-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.setActivePet?.('${item.key}')">${m.activePet===item.key?'Active':'Make Active'}</button>`
                       : `<button class="col-span-2 bg-indigo-500 hover:bg-indigo-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.buyPet?.('${item.key}')">Buy</button>`)
        : owned?`<button class="bg-emerald-500 hover:bg-emerald-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.equip('${item.key}')">${equipped?'Unequip':'Equip'}</button>
                 <button class="bg-white/10 hover:bg-white/20 px-2 py-1.5 rounded text-sm" onclick="Handlers.preview('${item.key}')">Preview</button>`
               :`<button class="col-span-2 bg-indigo-500 hover:bg-indigo-600 px-2 py-1.5 rounded text-sm" onclick="Handlers.buy('${item.key}')">Buy</button>`}
      </div>`;
      grid.appendChild(div);
    };
    const src=tab==="food"?Object.values(CATALOG.food):tab==="background"?CATALOG.background:tab==="pets"?CATALOG.pets:CATALOG[tab]||[];
    src.forEach(i=>addCard(i,tab));
  },

  renderChat(){
    const s=load(),t=s.teams[session.teamCode];
    const feed=$("#chatFeed"); feed.innerHTML="";
    t.chat.slice(-100).forEach(m=>{
      const row=document.createElement("div");
      row.className="flex items-start gap-2";
      row.innerHTML=`<div class="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
        <div class="text-xs text-white/60">${m.name} • ${new Date(m.at).toLocaleTimeString()}</div>
        <div class="text-sm break-words">${m.text}</div>
      </div>`;
      feed.appendChild(row);
    });
    feed.scrollTop=feed.scrollHeight;
  }
};

// UI
window.UI={
  show(id){$$("section").forEach(s=>s.classList.add("hidden"));$("#"+id)?.classList.remove("hidden");if(id==="managerDashboard")Screens.renderManager();if(id==="repDashboard")Screens.renderRep()},
  openShop(){window.scrollTo({top:0,behavior:"smooth"});document.body.classList.add("modal-open");$("#shopModal").classList.add("show");Screens.renderShop(window.currentShopTab||"hats")},
  closeShop(){document.body.classList.remove("modal-open");$("#shopModal").classList.remove("show")},
  switchShopTab(tab,btn){$$("#shopModal .tab-btn").forEach(b=>b.classList.remove("active"));btn.classList.add("active");window.currentShopTab=tab;Screens.renderShop(tab)},
  openMood(){window.scrollTo({top:0,behavior:"smooth"});document.body.classList.add("modal-open");$("#moodModal").classList.add("show")},
  closeMood(){document.body.classList.remove("modal-open");$("#moodModal").classList.remove("show")},
  openChat(){window.scrollTo({top:0,behavior:"smooth"});document.body.classList.add("modal-open");$("#chatModal").classList.add("show");const s=load(),t=s.teams[session.teamCode],me=t.members[session.email];if(me){me.lastReads.chat=Date.now();save(s);updateBadges()}Screens.renderChat()},
  closeChat(){document.body.classList.remove("modal-open");$("#chatModal").classList.remove("show")},
  openReport(force=false){window.scrollTo({top:0,behavior:"smooth"});document.body.classList.add("modal-open");$("#reportModal").classList.add("show"); if(force) $("#reportSkip").classList.add("hidden")},
  closeReport(){document.body.classList.remove("modal-open");$("#reportModal").classList.remove("show")}
};
document.addEventListener("keydown",e=>{if(e.key==="Escape"){UI.closeShop();UI.closeMood();UI.closeChat();UI.closeReport()}});

// Handlers
window.Handlers={
  // Auth
  createManagerAccount(e){e.preventDefault();const email=$("#managerEmail").value.trim().toLowerCase(),teamName=$("#teamName").value.trim();if(!email||!teamName)return;const s=load();const code=uid(10);const t=ensureTeam(s,code);t.teamName=teamName;t.managerEmail=email;save(s);session={role:"manager",teamCode:code,email};Toast(`Team created. Code ${code}`,"success");UI.show("managerDashboard")},
  managerLogin(e){e.preventDefault();const email=$("#loginEmail").value.trim().toLowerCase(),code=$("#loginTeamCode").value.trim().toUpperCase();const s=load(),t=s.teams[code];if(!t||t.managerEmail!==email)return Toast("Invalid email or team code","error");session={role:"manager",teamCode:code,email};UI.show("managerDashboard")},
  logout(){session={role:null,teamCode:null,email:null};Toast("Signed out","success");UI.show("landingPage")},
  approve(i){const s=load(),t=s.teams[session.teamCode],p=t.pending[i];if(!p)return;const m=ensureMember(t,p.email);m.firstName=p.firstName;t.pending.splice(i,1);save(s);Toast("Rep approved","success");Screens.renderManager()},
  reject(i){const s=load(),t=s.teams[session.teamCode];t.pending.splice(i,1);save(s);Toast("Request removed","warn");Screens.renderManager()},
  repJoinTeam(e){e.preventDefault();const firstName=$("#repFirstName").value.trim(),email=$("#repEmail").value.trim().toLowerCase(),code=$("#repTeamCode").value.trim().toUpperCase();const s=load(),t=s.teams[code];if(!t)return Toast("Team code not found","error");if(t.members[email]){session={role:"rep",teamCode:code,email};return UI.show("repDashboard")}if(t.pending.find(p=>p.email===email)){session={role:"rep",teamCode:code,email};return UI.show("pendingApproval")}t.pending.push({email,firstName,requestedAt:Date.now()});save(s);session={role:"rep",teamCode:code,email};Toast("Request sent","success");UI.show("pendingApproval")},
  checkApprovalStatus(){const s=load(),t=s.teams[session.teamCode];if(!t)return UI.show("landingPage");if(t.members[session.email])UI.show("repDashboard");else Toast("Still pending","warn")},
  repLogin(e){e.preventDefault();const email=$("#repLoginEmail").value.trim().toLowerCase(),code=$("#repLoginTeamCode").value.trim().toUpperCase();const s=load(),t=s.teams[code];if(!t||!t.members[email]){if(t&&t.pending.find(p=>p.email===email)){session={role:"rep",teamCode:code,email};return UI.show("pendingApproval")}return Toast("Not approved yet or invalid","error")}session={role:"rep",teamCode:code,email};UI.show("repDashboard")},

  // Manager activities
  saveActivities(e){e.preventDefault();
    const parse=r=>{if(!r)return null;const m=r.match(/(\d+)/);const tg=m?parseInt(m[1],10):null;let label=r.replace(/\d+/g,"").trim();if(!label)label=r.trim();const a={label,target:isNaN(tg)?null:tg};const xp=computeXPForActivity(a);a.xpUnit=xp.xpUnit;a.bonusXP=xp.bonusXP;return a};
    const a=["act1","act2","act3","act4"].map(id=>parse($("#"+id).value.trim())).filter(Boolean);
    const s=load(),t=s.teams[session.teamCode];
    t.activities=a.slice(0,4);
    const dk=today();
    Object.values(t.members).forEach(m=>{m.progress[dk]={};t.activities.forEach((ac,i)=>{m.progress[dk][i]=ac.target?{count:0}:{done:false}})});
    t.ui.activitiesCollapsed=true;
    save(s); Toast("Activities saved & published","success"); Screens.renderManager();
  },
  editActivities(){const s=load(),t=s.teams[session.teamCode];t.ui.activitiesCollapsed=false;save(s);Screens.renderManager()},

  // Rep llama name
  promptRename(){const nm=prompt("Enter llama name");if(!nm)return;const lower=nm.toLowerCase();if(profanity.some(b=>lower.includes(b)))return Toast("Please use a different name","error");const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];m.llama.name=nm.trim();save(s);Toast("Name updated","success");Screens.renderRep()},

  // Shop actions
  preview(k){this.equip(k)},
  buy(k){const it=findItem(k);if(!it)return;const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];const cost=it.cost?.coins||0;if(m.coins<cost)return Toast("Not enough coins","error");m.coins-=cost;m.owned[k]=true;save(s);Toast("Purchased","success");confetti(50);Screens.renderShop(window.currentShopTab||"hats");Screens.renderRep()},
  equip(k){const it=findItem(k);if(!it)return;const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];if(!m.owned[k])return Toast("You don't own this yet","warn");if(it.slot==="accessory"){const i=m.equipped.accessories.indexOf(k);if(i>=0)m.equipped.accessories.splice(i,1);else m.equipped.accessories.push(k)}else{m.equipped[it.slot]=(m.equipped[it.slot]===k?null:k)}save(s);Screens.renderRep();Screens.renderShop(window.currentShopTab||"hats")},
  applyBackground(k){const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];m.equipped.background=k;save(s);Toast("Background applied","success");Screens.renderRep();Screens.renderShop(window.currentShopTab||"background")},

  // Food
  buyFood(k){const f=CATALOG.food[k];if(!f)return;const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];
    if(!gate(m,"food"))return Toast("Build Market to unlock food","warn");
    if(m.coins<f.cost)return Toast("Not enough coins","error");
    m.coins-=f.cost;m.inventory[k]=(m.inventory[k]||0)+1;save(s);Toast("Food purchased","success");confetti(30);Screens.renderShop(window.currentShopTab||"food");Screens.renderRep()},
  feed(k){const f=CATALOG.food[k];if(!f)return;const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];
    if(!gate(m,"food"))return Toast("Build Market to unlock food","warn");
    if((m.inventory[k]||0)<=0)return Toast("You don't have this item","error");
    m.inventory[k]-=1; let happy=f.happiness; if(gate(m,"buff:gym"))happy+=1; if(gate(m,"buff:espresso")&&k==="espresso")happy+=1;
    m.llama.hunger=Math.min(100,m.llama.hunger+f.hunger);
    m.llama.happiness=Math.min(100,m.llama.happiness+happy);
    addXP(m,3); m.coins+=1; save(s); Toast(`Fed ${f.label}`,"success"); Screens.renderRep()},

  // Activities logging (weighted XP)
  adjustProgress(i,delta){
    const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];const d=today(),a=t.activities[i];if(!a?.target)return;
    const now=Date.now(); m.stats.progressClicks=(m.stats.progressClicks||[]).filter(ts=>now-ts<20000);
    if(m.stats.progressClicks.length>=8) return Toast("Easy—log steadily, not all at once ✋","warn");
    m.stats.progressClicks.push(now);

    const slot=m.progress[d]?.[i]||(m.progress[d][i]={count:0});
    const before=slot.count||0; slot.count=Math.max(0,before+delta);

    const xp=computeXPForActivity(a);
    if(delta>0){ m.coins+=1; addXP(m,xp.xpUnit); m.llama.hunger=Math.max(0,m.llama.hunger-1); }
    if(before<a.target && slot.count>=a.target){ m.coins+=5; addXP(m,xp.bonusXP); m.llama.happiness=Math.min(100,m.llama.happiness+5); this.checkPath(t,m) }

    save(s); Screens.renderRep();
  },
  toggleDone(i,checked){
    const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];const d=today();const a=t.activities[i];const slot=m.progress[d][i]||(m.progress[d][i]={done:false});
    slot.done=!!checked; if(slot.done){ const xp=computeXPForActivity(a); m.coins+=3; addXP(m,xp.xpUnit); m.llama.happiness=Math.min(100,m.llama.happiness+4); m.llama.hunger=Math.max(0,m.llama.hunger-1); this.checkPath(t,m) }
    save(s); Screens.renderRep();
  },
  checkPath(t,m){
    const d=today();
    const all=(t.activities||[]).slice(0,4).every((a,i)=>a.target?(m.progress[d][i].count>=a.target):!!m.progress[d][i].done);
    if(all){ let bonus=8; if(m.activePet==="mini_alpaca") bonus+=1; m.coins+=bonus; addXP(m,6); Toast("Path complete! +coins","success"); if(gate(m,"perk:celebration")) confetti(80) }
  },

  // Chat + gifting
  sendChat(e){e.preventDefault();const input=$("#chatInput");const text=input.value.trim();if(!text)return;const s=load(),t=s.teams[session.teamCode];const me=t.members[session.email]||{firstName:session.email};t.chat.push({from:session.email,name:me.firstName||session.email,text,at:Date.now()});save(s);input.value="";Screens.renderChat();updateBadges()},
  repGift(e){e.preventDefault();const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];if(!gate(m,"gifting"))return Toast("Build Networking Center to unlock gifting","warn");const rec=$("#repGiftRecipient").value,item=$("#repGiftItem").value;if((m.inventory[item]||0)<=0)return Toast("You do not have this item","error");m.inventory[item]-=1;t.members[rec].giftsInbox.push({id:uid(8),from:session.email,fromName:m.firstName,itemKey:item,at:Date.now()});save(s);Toast("Gift sent","success");Screens.renderRep()},
  claimGift(id){const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];const i=m.giftsInbox.findIndex(g=>g.id===id);if(i<0)return;const g=m.giftsInbox[i];m.inventory[g.itemKey]=(m.inventory[g.itemKey]||0)+1;m.giftsInbox.splice(i,1);save(s);Toast("Gift claimed","success");Screens.renderRep()},

  // Buildings (REPs build)
  startBuild(key){
    const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];
    const b=BUILDINGS.find(x=>x.key===key); if(!b||!m) return;
    if(m.town.owned.includes(key)||(m.town.active&&m.town.active.key===key)) return;
    if(m.coins<b.cost) return Toast("Not enough coins","error");
    m.coins-=b.cost;
    m.town.active={key,startedAt:Date.now(),startedBy:session.email,activeMs:0,durationMs:DEMO_BUILD_MS};
    save(s);
    Toast(`Building ${b.name}… ready in ~15s when active`,"success");
    Screens.renderRep();
  },

  // Mood → Rep Report
  submitMood(n){ UI.closeMood(); setTimeout(()=>{ UI.openReport(true); const el=$("#reportMood"); if(el) el.value=n; },150); },

  // Rep Report
  submitReport(e){
    e.preventDefault();
    const s=load(),t=s.teams[session.teamCode],m=t.members[session.email];
    const mood=parseInt($("#reportMood").value,10);
    const why=$("#reportWhy").value.trim();
    const qs=$("#reportQuestions").value.trim();
    const coach=$("#reportCoach").value.trim();
    const dk=today(); if(m.reports[dk]) return UI.closeReport();
    m.reports[dk]={mood,why,questions:qs,coaching:coach,at:Date.now()};
    t.reports.push({email:m.email,name:m.firstName||m.email,mood,why,questions:qs,coaching:coach,at:Date.now()});
    m.coins+=5; addXP(m,5); save(s);
    Toast("Report submitted +5 coins/+5 XP","success");
    UI.closeReport();
  },
  skipReport(){UI.closeReport()}
};

// Router + seeds (includes LLAMADEMO team)
window.UI.show("landingPage");
(function seed(){
  const s=load(); if(Object.keys(s.teams).length) return;

  // Auto-create a demo team with three logins
  const code="LLAMADEMO";
  s.teams[code]={teamName:"Demo Team",managerEmail:"manager@demo.com",
    activities:[{label:"Log calls",target:3,xpUnit:1,bonusXP:4},{label:"Send follow ups",target:5,xpUnit:2,bonusXP:5},{label:"Update pipeline",target:null,xpUnit:3,bonusXP:0},{label:"Prep opportunities",target:null,xpUnit:3,bonusXP:0}],
    pending:[],members:{},chat:[],reports:[],ui:{activitiesCollapsed:false}};
  const t=s.teams[code];
  const full=ensureMember(t,"full@demo.com"); full.firstName="Full"; full.coins=200;
  // Unlock everything for "full"
  full.town.owned=BUILDINGS.map(b=>b.key);
  full.town.unlocked=[...new Set(BUILDINGS.flatMap(b=>b.unlocks))];
  const mid=ensureMember(t,"mid@demo.com"); mid.firstName="Mid"; mid.coins=120;
  // Half unlocked for "mid"
  ["networking_center","market","outfitters","photo_booth","gym","roastery"].forEach(k=>{mid.town.owned.push(k);const b=BUILDINGS.find(x=>x.key===k);(b.unlocks||[]).forEach(u=>{if(!mid.town.unlocked.includes(u)) mid.town.unlocked.push(u)})});
  const mgr=ensureMember(t,"manager@demo.com"); mgr.firstName="Manager"; // manager doesn’t use rep view

  save(s);
})();
