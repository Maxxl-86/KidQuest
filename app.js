
// --- Persistenz/State (Multi-Profile + Achievements + Pet) ---
const APPKEY = 'kidquest_app_v5';
const THEMEKEY = 'kidquest_theme';

const ACHIEVEMENTS = [
  { key:'firstStreak', name:'Erster Streak', icon:'🥇', desc:'Halte mindestens 1 Tag Streak.', check: (p)=> p.streak.count >= 1 },
  { key:'thousandPoints', name:'1000 Punkte insgesamt', icon:'🏆', desc:'Sammle insgesamt 1000 Punkte (bestätigt).', check: (p)=> p.stats.totalEarned >= 1000 },
  { key:'tenRewards', name:'10 Belohnungen eingelöst', icon:'🎖️', desc:'Löse 10 Belohnungen ein.', check: (p)=> p.stats.rewardsRedeemed >= 10 },
];

const defaultProfile = () => ({
  points: 0,
  pending: [], // {id, taskId, title, points, date}
  history: [], // {id,type,title,delta,date}
  badges: { points100:false, tasks10:false, streak7:false },
  streak: { count:0, lastDay:null, bonusEvery:7, lastBonusAt:0 },
  limits: { maxPointsPerDay:50, maxPointsPerWeek:250 },
  counters: { lastDayKey:null, dailyPoints:0, weekStart:null, weeklyPoints:0, dailyTaskCounts:{} },
  stats: { totalEarned:0, totalSpent:0, rewardsRedeemed:0 },
  achievements: { firstStreak:false, thousandPoints:false, tenRewards:false },
  pet: { wilted:false, lastUpdate:null },
  showIntro: true,
});

const defaultState = {
  adminPin: '1234',
  theme: 'light',
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
  profiles: {},
  currentProfileId: null,
};

function load(){ try{ return JSON.parse(localStorage.getItem(APPKEY)) || defaultState; }catch(e){ return defaultState; } }
function save(){ localStorage.setItem(APPKEY, JSON.stringify(state)); }
let state = load();

// Ensure at least one profile
if(!state.currentProfileId || !state.profiles[state.currentProfileId]){
  const pid = 'p'+Date.now(); state.profiles[pid] = defaultProfile(); state.profiles[pid].name = 'Profil'; state.currentProfileId = pid; save();
}

// Theme
const savedTheme = localStorage.getItem(THEMEKEY);
if(savedTheme){ state.theme = savedTheme; }
document.body.classList.toggle('dark', state.theme === 'dark');

// --- Helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const nowIso = () => new Date().toISOString();
const dayKeyOf = (date) => { const d = new Date(date); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); };
const todayKey = () => dayKeyOf(new Date());
const weekStartOf = (date) => { const d = new Date(date); const day = d.getDay(); const diff = (day===0? -6 : 1 - day); d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d.toISOString(); };
function showToast(msg){ const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'), 1600); }
function profile(){ return state.profiles[state.currentProfileId]; }

function ensurePeriodCounters(){
  const p = profile();
  const tKey = todayKey();
  if(p.counters.lastDayKey !== tKey){ p.counters.lastDayKey = tKey; p.counters.dailyPoints = 0; p.counters.dailyTaskCounts = {}; save(); }
  const wStart = weekStartOf(new Date());
  if(p.counters.weekStart !== wStart){ p.counters.weekStart = wStart; p.counters.weeklyPoints = 0; save(); }
}

function computePetStage(){
  const p = profile();
  if(p.pet.wilted) return { emoji:'🥀', text:'Oh nein, verwelkt! Halte wieder deinen Streak, um sie zu erholen.' };
  const earned = p.stats.totalEarned;
  if(earned < 50) return { emoji:'🌱', text:'Ein kleiner Keimling! Weiter so.' };
  if(earned < 150) return { emoji:'🌿', text:'Deine Pflanze wächst.' };
  if(earned < 300) return { emoji:'🪴', text:'Schon richtig kräftig!' };
  if(earned < 600) return { emoji:'🌳', text:'Stark wie ein Baum.' };
  return { emoji:'🌼', text:'In voller Blüte! Mega Leistung.' };
}

function updateStreakOnAction(){
  const p = profile();
  const today = new Date(); today.setHours(0,0,0,0);
  const last = p.streak.lastDay ? new Date(p.streak.lastDay) : null;
  if(!last){ p.streak.count = 1; p.streak.lastDay = today.toISOString(); p.pet.wilted = false; }
  else {
    const diffDays = Math.round((today - last)/86400000);
    if(diffDays === 0){ p.streak.lastDay = today.toISOString(); }
    else if(diffDays === 1){ p.streak.count += 1; p.streak.lastDay = today.toISOString(); p.pet.wilted = false; }
    else if(diffDays > 1){ p.streak.count = 1; p.streak.lastDay = today.toISOString(); p.pet.wilted = true; }
  }
  // Bonus alle 7 Tage
  if(p.streak.count > 0 && p.streak.count % p.streak.bonusEvery === 0 && p.streak.lastBonusAt !== p.streak.count){
    p.points += 10;
    p.streak.lastBonusAt = p.streak.count;
    p.history.unshift({ id:Date.now()+'', type:'task', title:'Streak-Bonus', delta:10, date:nowIso() });
    showToast('Streak-Bonus +10');
  }
  checkBadges();
  checkAchievements();
}

function checkBadges(){
  const p = profile();
  if(!p.badges.points100 && p.points >= 100) p.badges.points100 = true;
  const confirmedTasks = p.history.filter(h => h.type==='task' && h.title !== 'Streak-Bonus').length;
  if(!p.badges.tasks10 && confirmedTasks >= 10) p.badges.tasks10 = true;
  if(!p.badges.streak7 && p.streak.count >= 7) p.badges.streak7 = true;
}

function checkAchievements(){
  const p = profile(); let unlockedSomething = false;
  ACHIEVEMENTS.forEach(a => {
    if(!p.achievements[a.key] && a.check(p)){ p.achievements[a.key] = true; unlockedSomething = true; p.history.unshift({ id:Date.now()+'', type:'achievement', title:a.name, delta:0, date:nowIso() }); }
  });
  if(unlockedSomething){ showToast('Neuer Erfolg freigeschaltet!'); }
}

function iconForTaskTitle(title){
  const map = {
    'Hausaufgaben erledigt':'🏫',
    'Zimmer aufräumen':'🧹',
    'Müll rausbringen':'🗑️',
    'Zähne putzen (morgens/abends)':'🦷',
    'Freundlich & respektvoll':'🙂',
    'Pünktlich ins Bett':'🛏️',
    'Schultasche packen':'🎒',
    'Esstisch decken':'🍽️',
    'Esstisch abräumen':'🧼',
  }; return map[title] || '⭐';
}

// --- Rendering ---
function renderProfileSelector(){
  const sel = $('#profileSelect'); sel.innerHTML = '';
  Object.keys(state.profiles).forEach(pid => {
    const opt = document.createElement('option'); opt.value = pid; opt.textContent = state.profiles[pid].name || 'Profil';
    if(pid === state.currentProfileId) opt.selected = true; sel.appendChild(opt);
  });
}

function render(){
  ensurePeriodCounters(); const p = profile();
  $('#pointsDisplay').textContent = p.points;
  $('#streakCount').textContent = p.streak.count || 0;
  $('#todayPoints').textContent = p.counters.dailyPoints || 0;
  $('#weekPoints').textContent = p.counters.weeklyPoints || 0;
  $('#maxDay').textContent = p.limits.maxPointsPerDay;
  $('#maxWeek').textContent = p.limits.maxPointsPerWeek;

  renderProfileSelector();
  $('#intro').classList.toggle('hidden', !p.showIntro);

  // Haustier
  const pet = computePetStage();
  $('#petEmoji').textContent = pet.emoji; $('#petStatus').textContent = pet.text;

  // Aufgaben
  const tasksUl = $('#tasksList'); tasksUl.innerHTML = '';
  state.tasks.forEach(t => {
    const approvedToday = p.counters.dailyTaskCounts[t.id] || 0;
    const pendingToday = p.pending.filter(x => x.taskId === t.id && dayKeyOf(x.date) === todayKey()).length;
    const used = approvedToday + pendingToday; const remaining = Math.max(0, (t.limitPerDay || 1) - used);
    const li = document.createElement('li'); li.className = 'card';
    const icon = document.createElement('span'); icon.className='icon'; icon.textContent = iconForTaskTitle(t.title);
    const left = document.createElement('div'); left.innerHTML = `<div class="title">${t.title}</div><div class="sub">+${t.points} Punkte · Heute: ${used}/${t.limitPerDay||1}</div>`;
    const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = remaining>0 ? 'Markieren' : 'Limit erreicht'; if(remaining<=0){ btn.classList.add('disabled'); }
    btn.onclick = () => { if(remaining>0) markTask(t.id); };
    li.append(icon, left, btn); tasksUl.appendChild(li);
  });

  // Pending
  const pendUl = $('#pendingList'); pendUl.innerHTML = '';
  p.pending.forEach(item => { const li = document.createElement('li'); li.className = 'card'; li.innerHTML = `<div><div class="title">${item.title}</div><div class="sub">+${item.points} Punkte · markiert ${new Date(item.date).toLocaleString()}</div></div><span class="sub">Wartet auf Bestätigung</span>`; pendUl.appendChild(li); });

  // Rewards
  const rewardsUl = $('#rewardsList'); rewardsUl.innerHTML = '';
  state.rewards.forEach(r => { const li = document.createElement('li'); li.className = 'card'; li.innerHTML = `<div><div class="title">${r.title}</div><div class="sub">${r.cost} Punkte</div></div>`; const btn = document.createElement('button'); btn.className='btn secondary'; btn.textContent='Einlösen'; btn.onclick = () => redeemReward(r.id); li.appendChild(btn); rewardsUl.appendChild(li); });

  // Badges
  const badgesUl = $('#badgesList'); badgesUl.innerHTML = '';
  const defs = [ { key:'points100', title:'Punktesammler 100', desc:'Erreiche 100 Punkte gesamt.' }, { key:'tasks10', title:'Aufgabenheld 10', desc:'10 bestätigte Aufgaben.' }, { key:'streak7', title:'Streak 7', desc:'7 Tage in Folge aktiv.' }, ];
  defs.forEach(b => { const li = document.createElement('li'); li.className = 'badge'+(p.badges[b.key]?'':' locked'); li.innerHTML = `<div class="medal">★</div><div><div class="title">${b.title}</div><div class="sub">${b.desc}</div></div>`; badgesUl.appendChild(li); });

  // Erfolge
  const achUl = $('#achievementsList'); achUl.innerHTML = '';
  ACHIEVEMENTS.forEach(a => { const unlocked = !!p.achievements[a.key]; const li = document.createElement('li'); li.className = 'achievement'+(unlocked?' unlocked':' locked'); li.innerHTML = `<div class="icon">${a.icon}</div><div><div class="name">${a.name}</div><div class="sub">${a.desc}</div></div>`; achUl.appendChild(li); });

  // History
  const histUl = $('#historyList'); histUl.innerHTML = '';
  p.history.forEach(h => { const li = document.createElement('li'); li.className = 'card'; const deltaClass = h.delta > 0 ? 'plus' : (h.delta < 0 ? 'minus' : ''); li.innerHTML = `<div><div class="title">${h.type === 'task' ? 'Aufgabe' : h.type === 'reward' ? 'Belohnung' : 'Erfolg'}: ${h.title}</div><div class="sub">${new Date(h.date).toLocaleString()}</div></div><div class="delta ${deltaClass}">${h.delta>0?'+':''}${h.delta||''}</div>`; histUl.appendChild(li); });

  // Admin limits
  $('#adminTodayPoints').textContent = p.counters.dailyPoints; $('#adminWeekPoints').textContent = p.counters.weeklyPoints; $('#adminMaxDay').textContent = p.limits.maxPointsPerDay; $('#adminMaxWeek').textContent = p.limits.maxPointsPerWeek;
}

// --- Actions ---
function markTask(taskId){ ensurePeriodCounters(); const p = profile(); const t = state.tasks.find(x=>x.id===taskId); if(!t) return; const approvedToday = p.counters.dailyTaskCounts[taskId] || 0; const pendingToday = p.pending.filter(x => x.taskId === taskId && dayKeyOf(x.date) === todayKey()).length; const totalToday = approvedToday + pendingToday; if(totalToday >= (t.limitPerDay||1)) return showToast('Tageslimit erreicht'); p.pending.unshift({ id:'p'+Date.now(), taskId, title:t.title, points:t.points, date:nowIso() }); save(); render(); showToast('Zur Freigabe markiert'); }

function approveTask(pendingId){ ensurePeriodCounters(); const p = profile(); const idx = p.pending.findIndex(x=>x.id===pendingId); if(idx<0) return; const item = p.pending[idx]; const t = state.tasks.find(x=>x.id===item.taskId);
  const approvedToday = p.counters.dailyTaskCounts[item.taskId] || 0; if(approvedToday >= (t.limitPerDay||1)) return showToast('Tageslimit für Aufgabe erreicht');
  const wouldDaily = p.counters.dailyPoints + item.points; if(wouldDaily > p.limits.maxPointsPerDay) return showToast('Tageslimit Punkte erreicht');
  const wouldWeekly = p.counters.weeklyPoints + item.points; if(wouldWeekly > p.limits.maxPointsPerWeek) return showToast('Wochenlimit Punkte erreicht');
  p.pending.splice(idx,1);
  p.points += item.points; p.counters.dailyPoints += item.points; p.counters.weeklyPoints += item.points; p.counters.dailyTaskCounts[item.taskId] = (p.counters.dailyTaskCounts[item.taskId]||0) + 1; p.stats.totalEarned += item.points;
  p.history.unshift({ id:Date.now()+'', type:'task', title:item.title, delta:item.points, date:nowIso() });
  updateStreakOnAction(); checkBadges(); checkAchievements(); save(); render(); showToast('Bestätigt: +'+item.points+' Punkte'); }

function rejectTask(pendingId){ const p = profile(); p.pending = p.pending.filter(x=>x.id!==pendingId); save(); render(); showToast('Abgelehnt'); }

function redeemReward(rewardId){ const p = profile(); const r = state.rewards.find(x=>x.id===rewardId); if(!r) return; if(p.points < r.cost) return showToast('Nicht genug Punkte'); p.points -= r.cost; p.stats.totalSpent += r.cost; p.stats.rewardsRedeemed += 1; p.history.unshift({ id:Date.now()+'', type:'reward', title:r.title, delta:-r.cost, date:nowIso() }); checkAchievements(); save(); render(); showToast('Belohnung eingelöst'); }

function addTask(title, pts, limit){ state.tasks.unshift({ id:'t'+Date.now(), title, points:pts, limitPerDay: (limit||1) }); save(); render(); }
function removeTask(id){ state.tasks = state.tasks.filter(t=>t.id!==id); save(); render(); }
function addReward(title, cost){ state.rewards.unshift({ id:'r'+Date.now(), title, cost }); save(); render(); }
function removeReward(id){ state.rewards = state.rewards.filter(r=>r.id!==id); save(); render(); }

// Profiles
function addProfile(name){ const pid = 'p'+Date.now(); state.profiles[pid] = defaultProfile(); state.profiles[pid].name = name || 'Profil'; state.currentProfileId = pid; save(); render(); showToast('Profil erstellt'); }
function renameCurrentProfile(name){ if(!name) return; state.profiles[state.currentProfileId].name = name; save(); render(); showToast('Profil umbenannt'); }
function deleteCurrentProfile(){ const keys = Object.keys(state.profiles); if(keys.length<=1) return showToast('Mindestens 1 Profil benötigt'); delete state.profiles[state.currentProfileId]; state.currentProfileId = Object.keys(state.profiles)[0]; save(); render(); showToast('Profil gelöscht'); }

// Theme
function setTheme(mode){ state.theme = mode; document.body.classList.toggle('dark', mode==='dark'); localStorage.setItem(THEMEKEY, mode); }

// Admin Lock
const adminLock = $('#adminLock'); const adminPanel = $('#adminPanel');
$('#unlockBtn').onclick = () => { const pin = $('#pinInput').value.trim(); if(pin === state.adminPin){ adminLock.classList.add('hidden'); adminPanel.classList.remove('hidden'); } else { showToast('Falscher PIN'); } };

// Tabs
$$('.tabs button').forEach(btn => { btn.addEventListener('click', () => { $$('.tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const tab = btn.getAttribute('data-tab'); $$('.tab-content').forEach(sec=>sec.classList.remove('visible')); document.getElementById(tab).classList.add('visible'); }); });

document.addEventListener('click', (e) => { const add = e.target.getAttribute('data-add'); if(add){ const delta = parseInt(add,10); const p = profile(); p.points = Math.max(0, p.points + delta); checkBadges(); checkAchievements(); save(); render(); showToast((delta>0?'+':'')+delta+' Punkte'); } });

// Admin Forms
$('#addTaskBtn').onclick = () => { const title = $('#taskTitle').value.trim(); const pts = parseInt($('#taskPoints').value,10); let limit = parseInt($('#taskLimit').value,10); if(!title || isNaN(pts)) return showToast('Titel & Punkte angeben'); if(isNaN(limit) || limit<=0) limit=1; addTask(title, pts, limit); $('#taskTitle').value=''; $('#taskPoints').value=''; $('#taskLimit').value=''; };
$('#addRewardBtn').onclick = () => { const title = $('#rewardTitle').value.trim(); const cost = parseInt($('#rewardCost').value,10); if(!title || isNaN(cost)) return showToast('Titel & Kosten angeben'); addReward(title, cost); $('#rewardTitle').value=''; $('#rewardCost').value=''; };
$('#savePinBtn').onclick = () => { const np = $('#newPin').value.trim(); if(!np) return showToast('PIN angeben'); state.adminPin = np; save(); showToast('PIN aktualisiert'); $('#newPin').value=''; };
$('#saveLimitsBtn').onclick = () => { const p = profile(); const d = parseInt($('#limitDay').value,10); const w = parseInt($('#limitWeek').value,10); if(!isNaN(d)) p.limits.maxPointsPerDay = Math.max(1,d); if(!isNaN(w)) p.limits.maxPointsPerWeek = Math.max(1,w); save(); render(); showToast('Limits gespeichert'); };

// Profiles UI
$('#createProfileBtn').onclick = () => { const name = $('#newProfileName').value.trim(); addProfile(name || 'Profil'); $('#newProfileName').value=''; };
$('#renameProfileBtn').onclick = () => { const name = $('#renameProfileName').value.trim(); if(!name) return showToast('Name angeben'); renameCurrentProfile(name); $('#renameProfileName').value=''; };
$('#deleteProfileBtn').onclick = () => { deleteCurrentProfile(); };
$('#profileSelect').onchange = (e) => { state.currentProfileId = e.target.value; save(); render(); };

// Theme toggle
$('#themeToggle').onclick = () => { setTheme(state.theme==='dark' ? 'light' : 'dark'); };

// Intro overlay
$('#introOkBtn').onclick = () => { const p = profile(); p.showIntro = false; save(); render(); };

// Initial
render();
