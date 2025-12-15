
// --- Persistenz/State ---
const KEY = 'kidquest_state_v2';
const defaultState = {
  points: 0,
  adminPin: '1234',
  tasks: [
    { id:'t1', title:'Hausaufgaben erledigt', points:10, limitPerDay:1 },
    { id:'t2', title:'Zimmer aufräumen', points:8, limitPerDay:1 },
    { id:'t3', title:'Müll rausbringen', points:6, limitPerDay:1 },
    { id:'t4', title:'Zähne putzen (morgens/abends)', points:4, limitPerDay:2 },
    { id:'t5', title:'Freundlich & respektvoll', points:5, limitPerDay:1 },
    { id:'t6', title:'Pünktlich ins Bett', points:8, limitPerDay:1 },
    { id:'t7', title:'Schultasche packen', points:6, limitPerDay:1 },
    { id:'t8', title:'Esstisch decken', points:5, limitPerDay:1 },
    { id:'t9', title:'Esstisch abräumen', points:5, limitPerDay:1 },
  ],
  rewards: [
    { id:'r1', title:'Kleines Eis', cost:25 },
    { id:'r2', title:'30 Min. Tablet-Zeit', cost:30 },
    { id:'r3', title:'Filmabend aussuchen', cost:50 },
    { id:'r4', title:'Ausflug am Wochenende', cost:120 },
    { id:'r5', title:'Roblox In-App-Kauf (5,99€)', cost:300 },
  ],
  pending: [], // {id, taskId, title, points, date}
  history: [], // {id,type,title,delta,date}
  badges: { points100:false, tasks10:false, streak7:false },
  streak: { count:0, lastDay:null, bonusEvery:7, lastBonusAt:0 },
  limits: { maxPointsPerDay:50, maxPointsPerWeek:250 },
  counters: {
    lastDayKey: null,
    dailyPoints: 0, // nur positive Punkte aus Aufgabenbestätigungen
    weekStart: null,
    weeklyPoints: 0,
    dailyTaskCounts: {} // taskId -> approved count heute
  }
};

function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || defaultState; }catch(e){ return defaultState; } }
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
let state = load();

// --- Helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
function showToast(msg){ const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'), 1500); }
function dayKeyOf(date){ const d = new Date(date); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function todayKey(){ return dayKeyOf(new Date()); }
function weekStartOf(date){ const d = new Date(date); const day = d.getDay(); // 0=So..6=Sa
  const diff = (day===0? -6 : 1 - day); // Montag als Wochenstart
  d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d.toISOString(); }

function ensurePeriodCounters(){
  const tKey = todayKey();
  if(state.counters.lastDayKey !== tKey){
    state.counters.lastDayKey = tKey;
    state.counters.dailyPoints = 0;
    state.counters.dailyTaskCounts = {};
    save();
  }
  const wStart = weekStartOf(new Date());
  if(state.counters.weekStart !== wStart){
    state.counters.weekStart = wStart;
    state.counters.weeklyPoints = 0;
    save();
  }
}

function updateStreakOnAction(){
  const today = new Date(); today.setHours(0,0,0,0);
  const last = state.streak.lastDay ? new Date(state.streak.lastDay) : null;
  if(!last){ state.streak.count = 1; state.streak.lastDay = today.toISOString(); }
  else {
    const diffDays = Math.round((today - last)/86400000);
    if(diffDays === 0){ state.streak.lastDay = today.toISOString(); }
    else if(diffDays === 1){ state.streak.count += 1; state.streak.lastDay = today.toISOString(); }
    else if(diffDays > 1){ state.streak.count = 1; state.streak.lastDay = today.toISOString(); }
  }
  // Bonus alle 7 Tage
  if(state.streak.count > 0 && state.streak.count % state.streak.bonusEvery === 0 && state.streak.lastBonusAt !== state.streak.count){
    state.points += 10;
    state.streak.lastBonusAt = state.streak.count;
    addHistory({ id:Date.now()+'', type:'task', title:'Streak-Bonus', delta:10, date:new Date().toISOString() });
  }
  checkBadges();
}

function checkBadges(){
  if(!state.badges.points100 && state.points >= 100) state.badges.points100 = true;
  const confirmedTasks = state.history.filter(h => h.type==='task' && h.title !== 'Streak-Bonus').length;
  if(!state.badges.tasks10 && confirmedTasks >= 10) state.badges.tasks10 = true;
  if(!state.badges.streak7 && state.streak.count >= 7) state.badges.streak7 = true;
}

function addHistory(entry){ state.history.unshift(entry); }

// --- Rendering ---
function render(){
  ensurePeriodCounters();
  $('#pointsDisplay').textContent = state.points;
  $('#streakCount').textContent = state.streak.count || 0;
  $('#todayPoints').textContent = state.counters.dailyPoints || 0;
  $('#weekPoints').textContent = state.counters.weeklyPoints || 0;
  $('#maxDay').textContent = state.limits.maxPointsPerDay;
  $('#maxWeek').textContent = state.limits.maxPointsPerWeek;

  // Aufgaben
  const tasksUl = $('#tasksList'); tasksUl.innerHTML = '';
  state.tasks.forEach(t => {
    const approvedToday = state.counters.dailyTaskCounts[t.id] || 0;
    const pendingToday = state.pending.filter(p => p.taskId === t.id && dayKeyOf(p.date) === todayKey()).length;
    const used = approvedToday + pendingToday;
    const remaining = Math.max(0, (t.limitPerDay || 1) - used);

    const li = document.createElement('li'); li.className = 'card';
    li.innerHTML = `<div><div class="title">${t.title}</div><div class="sub">+${t.points} Punkte · Heute: ${used}/${t.limitPerDay||1}</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn'; btn.textContent = remaining>0 ? 'Markieren' : 'Limit erreicht';
    if(remaining<=0){ btn.classList.add('disabled'); }
    btn.onclick = () => { if(remaining>0) markTask(t.id); };
    li.appendChild(btn); tasksUl.appendChild(li);
  });

  // Pending
  const pendUl = $('#pendingList'); pendUl.innerHTML = '';
  state.pending.forEach(p => {
    const li = document.createElement('li'); li.className = 'card';
    li.innerHTML = `<div><div class="title">${p.title}</div><div class="sub">+${p.points} Punkte · markiert ${new Date(p.date).toLocaleString()}</div></div><span class="sub">Wartet auf Bestätigung</span>`;
    pendUl.appendChild(li);
  });

  // Belohnungen
  const rewardsUl = $('#rewardsList'); rewardsUl.innerHTML = '';
  state.rewards.forEach(r => {
    const li = document.createElement('li'); li.className = 'card';
    li.innerHTML = `<div><div class="title">${r.title}</div><div class="sub">${r.cost} Punkte</div></div>`;
    const btn = document.createElement('button'); btn.className = 'btn secondary'; btn.textContent = 'Einlösen';
    btn.onclick = () => redeemReward(r.id);
    li.appendChild(btn); rewardsUl.appendChild(li);
  });

  // Badges
  const badgesUl = $('#badgesList'); badgesUl.innerHTML = '';
  const defs = [
    { key:'points100', title:'Punktesammler 100', desc:'Erreiche 100 Punkte gesamt.' },
    { key:'tasks10', title:'Aufgabenheld 10', desc:'10 bestätigte Aufgaben.' },
    { key:'streak7', title:'Streak 7', desc:'7 Tage in Folge aktiv.' },
  ];
  defs.forEach(b => {
    const li = document.createElement('li'); li.className = 'badge'+(state.badges[b.key]?'':' locked');
    li.innerHTML = `<div class="medal">★</div><div><div class="title">${b.title}</div><div class="sub">${b.desc}</div></div>`;
    badgesUl.appendChild(li);
  });

  // Verlauf
  const histUl = $('#historyList'); histUl.innerHTML = '';
  state.history.forEach(h => {
    const li = document.createElement('li'); li.className = 'card';
    const deltaClass = h.delta > 0 ? 'plus' : 'minus';
    li.innerHTML = `<div>
      <div class="title">${h.type === 'task' ? 'Aufgabe' : 'Belohnung'}: ${h.title}</div>
      <div class="sub">${new Date(h.date).toLocaleString()}</div>
    </div>
    <div class="delta ${deltaClass}">${h.delta > 0 ? '+' : ''}${h.delta}</div>`;
    histUl.appendChild(li);
  });

  // Admin Listen
  const aTasks = $('#adminTasks'); aTasks.innerHTML = '';
  state.tasks.forEach(t => {
    const li = document.createElement('li'); li.className = 'card';
    const title = document.createElement('div'); title.innerHTML = `<div class="title">${t.title}</div><div class="sub">+${t.points} · Max/Tag: ${t.limitPerDay||1}</div>`;
    const rm = document.createElement('button'); rm.textContent = 'Entfernen'; rm.className='btn danger'; rm.onclick = () => removeTask(t.id);
    li.append(title, rm); aTasks.appendChild(li);
  });

  const aRewards = $('#adminRewards'); aRewards.innerHTML = '';
  state.rewards.forEach(r => {
    const li = document.createElement('li'); li.className = 'card';
    const title = document.createElement('div'); title.innerHTML = `<div class="title">${r.title}</div><div class="sub">${r.cost}</div>`;
    const rm = document.createElement('button'); rm.textContent = 'Entfernen'; rm.className='btn danger'; rm.onclick = () => removeReward(r.id);
    li.append(title, rm); aRewards.appendChild(li);
  });

  const aPend = $('#adminPending'); aPend.innerHTML = '';
  state.pending.forEach(p => {
    const li = document.createElement('li'); li.className = 'card';
    const left = document.createElement('div'); left.innerHTML = `<div class="title">${p.title}</div><div class="sub">+${p.points} · markiert ${new Date(p.date).toLocaleString()}</div>`;
    const approve = document.createElement('button'); approve.className='btn'; approve.textContent='Bestätigen'; approve.onclick = () => approveTask(p.id);
    const reject = document.createElement('button'); reject.className='btn danger'; reject.textContent='Ablehnen'; reject.onclick = () => rejectTask(p.id);
    li.append(left, approve, reject); aPend.appendChild(li);
  });

  // Admin Limits Anzeige
  $('#adminTodayPoints').textContent = state.counters.dailyPoints;
  $('#adminWeekPoints').textContent = state.counters.weeklyPoints;
  $('#adminMaxDay').textContent = state.limits.maxPointsPerDay;
  $('#adminMaxWeek').textContent = state.limits.maxPointsPerWeek;
}

// --- Actions ---
function markTask(taskId){
  ensurePeriodCounters();
  const t = state.tasks.find(x=>x.id===taskId); if(!t) return;
  const approvedToday = state.counters.dailyTaskCounts[taskId] || 0;
  const pendingToday = state.pending.filter(p => p.taskId === taskId && dayKeyOf(p.date) === todayKey()).length;
  const totalToday = approvedToday + pendingToday;
  if(totalToday >= (t.limitPerDay||1)){ showToast('Tageslimit erreicht'); return; }
  state.pending.unshift({ id:'p'+Date.now(), taskId, title:t.title, points:t.points, date:new Date().toISOString() });
  save(); render(); showToast('Zur Freigabe markiert');
}

function approveTask(pId){
  ensurePeriodCounters();
  const idx = state.pending.findIndex(p=>p.id===pId); if(idx<0) return;
  const p = state.pending[idx];
  const t = state.tasks.find(x=>x.id===p.taskId);

  // Check Aufgabe Tageslimit (approved count)
  const approvedToday = state.counters.dailyTaskCounts[p.taskId] || 0;
  if(approvedToday >= (t.limitPerDay||1)) { showToast('Tageslimit für Aufgabe erreicht'); return; }

  // Check Punkte-Limits
  const wouldDaily = state.counters.dailyPoints + p.points;
  if(wouldDaily > state.limits.maxPointsPerDay){ showToast('Tageslimit Punkte erreicht'); return; }
  const wouldWeekly = state.counters.weeklyPoints + p.points;
  if(wouldWeekly > state.limits.maxPointsPerWeek){ showToast('Wochenlimit Punkte erreicht'); return; }

  // Anwenden
  state.pending.splice(idx,1);
  state.points += p.points;
  state.counters.dailyPoints += p.points;
  state.counters.weeklyPoints += p.points;
  state.counters.dailyTaskCounts[p.taskId] = (state.counters.dailyTaskCounts[p.taskId]||0) + 1;

  addHistory({ id:Date.now()+'', type:'task', title:p.title, delta:p.points, date:new Date().toISOString() });
  updateStreakOnAction();
  checkBadges();
  save(); render(); showToast('Bestätigt: +'+p.points+' Punkte');
}

function rejectTask(pId){ state.pending = state.pending.filter(p=>p.id!==pId); save(); render(); showToast('Abgelehnt'); }

function redeemReward(id){
  const r = state.rewards.find(x=>x.id===id); if(!r) return;
  if(state.points < r.cost) { showToast('Nicht genug Punkte'); return; }
  state.points -= r.cost;
  addHistory({ id:Date.now()+'', type:'reward', title:r.title, delta:-r.cost, date:new Date().toISOString() });
  save(); render(); showToast('Belohnung eingelöst');
}

function addTask(title, pts, limit){ state.tasks.unshift({ id:'t'+Date.now(), title, points:pts, limitPerDay: (limit||1) }); save(); render(); }
function removeTask(id){ state.tasks = state.tasks.filter(t=>t.id!==id); save(); render(); }
function addReward(title, cost){ state.rewards.unshift({ id:'r'+Date.now(), title, cost }); save(); render(); }
function removeReward(id){ state.rewards = state.rewards.filter(r=>r.id!==id); save(); render(); }

// --- Admin Lock ---
const adminLock = $('#adminLock'); const adminPanel = $('#adminPanel');
$('#unlockBtn').onclick = () => { const pin = $('#pinInput').value.trim(); if(pin === state.adminPin){ adminLock.classList.add('hidden'); adminPanel.classList.remove('hidden'); } else { showToast('Falscher PIN'); } };

// Punkte Buttons
document.addEventListener('click', (e) => {
  const add = e.target.getAttribute('data-add');
  if(add){ const delta = parseInt(add,10); state.points = Math.max(0, state.points + delta); checkBadges(); save(); render(); showToast((delta>0?'+':'')+delta+' Punkte'); }
});

// Admin Forms
$('#addTaskBtn').onclick = () => {
  const title = $('#taskTitle').value.trim(); const pts = parseInt($('#taskPoints').value,10); let limit = parseInt($('#taskLimit').value,10);
  if(!title || isNaN(pts)) return showToast('Titel & Punkte angeben');
  if(isNaN(limit) || limit <= 0) limit = 1;
  addTask(title, pts, limit); $('#taskTitle').value=''; $('#taskPoints').value=''; $('#taskLimit').value='';
};
$('#addRewardBtn').onclick = () => {
  const title = $('#rewardTitle').value.trim(); const cost = parseInt($('#rewardCost').value,10);
  if(!title || isNaN(cost)) return showToast('Titel & Kosten angeben');
  addReward(title, cost); $('#rewardTitle').value=''; $('#rewardCost').value='';
};
$('#savePinBtn').onclick = () => { const np = $('#newPin').value.trim(); if(!np) return showToast('PIN angeben'); state.adminPin = np; save(); showToast('PIN aktualisiert'); $('#newPin').value=''; };
$('#saveLimitsBtn').onclick = () => { const d = parseInt($('#limitDay').value,10); const w = parseInt($('#limitWeek').value,10); if(!isNaN(d)) state.limits.maxPointsPerDay = Math.max(1,d); if(!isNaN(w)) state.limits.maxPointsPerWeek = Math.max(1,w); save(); render(); showToast('Limits gespeichert'); };

// Tabs
$$('.tabs button').forEach(btn => { btn.addEventListener('click', () => { $$('.tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const tab = btn.getAttribute('data-tab'); $$('.tab-content').forEach(sec=>sec.classList.remove('visible')); document.getElementById(tab).classList.add('visible'); }); });

// Initial
ensurePeriodCounters();
checkBadges();
render();
