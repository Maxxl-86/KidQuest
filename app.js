
// KidQuest v5.3 – stabile Intro-Logik, Konfetti, Profil-UX, Admin-Freigaben mit data-id
(function(){
  const APPKEY = 'kidquest_app_v5';
  const THEMEKEY = 'kidquest_theme';

  const ACHIEVEMENTS = [
    { key:'firstStreak', name:'Erster Streak', icon:'🥇', desc:'Halte mindestens 1 Tag Streak.', check: (p)=> p.streak.count >= 1 },
    { key:'thousandPoints', name:'1000 Punkte insgesamt', icon:'🏆', desc:'Sammle insgesamt 1000 Punkte (bestätigt).', check: (p)=> p.stats.totalEarned >= 1000 },
    { key:'tenRewards', name:'10 Belohnungen eingelöst', icon:'🎖️', desc:'Löse 10 Belohnungen ein.', check: (p)=> p.stats.rewardsRedeemed >= 10 },
  ];

  const defaultProfile = () => ({
    points: 0,
    pending: [],
    history: [],
    badges: { points100:false, tasks10:false, streak7:false },
    streak: { count:0, lastDay:null, bonusEvery:7, lastBonusAt:0 },
    limits: { maxPointsPerDay:50, maxPointsPerWeek:250 },
    counters: { lastDayKey:null, dailyPoints:0, weekStart:null, weeklyPoints:0, dailyTaskCounts:{} },
    stats: { totalEarned:0, totalSpent:0, rewardsRedeemed:0 },
    achievements: { firstStreak:false, thousandPoints:false, tenRewards:false },
    pet: { wilted:false, lastUpdate:null },
    showIntro: true,
    name: 'Profil',
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
  if(!state.currentProfileId || !state.profiles[state.currentProfileId]){ const pid = 'p'+Date.now(); state.profiles[pid] = defaultProfile(); state.currentProfileId = pid; save(); }

  // Theme init
  const savedTheme = localStorage.getItem(THEMEKEY);
  if(savedTheme){ state.theme = savedTheme; }
  document.body.classList.toggle('dark', state.theme === 'dark');

  // Helpers
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const nowIso = () => new Date().toISOString();
  const dayKeyOf = (date) => { const d = new Date(date); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); };
  const todayKey = () => dayKeyOf(new Date());
  const weekStartOf = (date) => { const d = new Date(date); const day = d.getDay(); const diff = (day===0? -6 : 1 - day); d.setDate(d.getDate()+diff); d.setHours(0,0,0,0); return d.toISOString(); };
  function showToast(msg){ const el = $('#toast'); if(!el) return; el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'), 1600); }
  function profile(){ return state.profiles[state.currentProfileId]; }

  function ensurePeriodCounters(){ const p = profile(); const tKey = todayKey(); if(p.counters.lastDayKey !== tKey){ p.counters.lastDayKey = tKey; p.counters.dailyPoints = 0; p.counters.dailyTaskCounts = {}; } const wStart = weekStartOf(new Date()); if(p.counters.weekStart !== wStart){ p.counters.weekStart = wStart; p.counters.weeklyPoints = 0; } }

  function computePetStage(){ const p = profile(); if(p.pet.wilted) return { emoji:'🥀', text:'Oh nein, verwelkt! Halte wieder deinen Streak, um sie zu erholen.' }; const earned = p.stats.totalEarned; if(earned < 50) return { emoji:'🌱', text:'Ein kleiner Keimling! Weiter so.' }; if(earned < 150) return { emoji:'🌿', text:'Deine Pflanze wächst.' }; if(earned < 300) return { emoji:'🪴', text:'Schon richtig kräftig!' }; if(earned < 600) return { emoji:'🌳', text:'Stark wie ein Baum.' }; return { emoji:'🌼', text:'In voller Blüte! Mega Leistung.' }; }

  function updateStreakOnAction(){ const p = profile(); const today = new Date(); today.setHours(0,0,0,0); const last = p.streak.lastDay ? new Date(p.streak.lastDay) : null; if(!last){ p.streak.count = 1; p.streak.lastDay = today.toISOString(); p.pet.wilted = false; } else { const diffDays = Math.round((today - last)/86400000); if(diffDays === 0){ p.streak.lastDay = today.toISOString(); } else if(diffDays === 1){ p.streak.count += 1; p.streak.lastDay = today.toISOString(); p.pet.wilted = false; } else if(diffDays > 1){ p.streak.count = 1; p.streak.lastDay = today.toISOString(); p.pet.wilted = true; } } if(p.streak.count > 0 && p.streak.count % p.streak.bonusEvery === 0 && p.streak.lastBonusAt !== p.streak.count){ p.points += 10; p.streak.lastBonusAt = p.streak.count; p.history.unshift({ id:Date.now()+'', type:'task', title:'Streak-Bonus', delta:10, date:nowIso() }); showToast('Streak-Bonus +10'); } checkBadges(); checkAchievements(); }

  function checkBadges(){ const p = profile(); if(!p.badges.points100 && p.points >= 100) p.badges.points100 = true; const confirmedTasks = p.history.filter(h => h.type==='task' && h.title !== 'Streak-Bonus').length; if(!p.badges.tasks10 && confirmedTasks >= 10) p.badges.tasks10 = true; if(!p.badges.streak7 && p.streak.count >= 7) p.badges.streak7 = true; }

  // --- Konfetti ---
  function fireConfetti(){ const cont = $('#confetti'); if(!cont) return; cont.innerHTML=''; cont.classList.remove('hidden'); const colors = ['#f44336','#e91e63','#9c27b0','#3f51b5','#2196f3','#03a9f4','#00bcd4','#009688','#4caf50','#ff9800','#ffc107','#ffeb3b']; const N = 100; const w = window.innerWidth; for(let i=0;i<N;i++){ const d = document.createElement('div'); d.className='p'; d.style.left = Math.random()*w + 'px'; d.style.background = colors[(Math.random()*colors.length)|0]; d.style.animationDelay = (Math.random()*0.25)+'s'; d.style.transform = 'translateY(-20px) rotate('+((Math.random()*360)|0)+'deg)'; cont.appendChild(d); }
    setTimeout(()=>cont.classList.add('hidden'), 1500);
  }

  function checkAchievements(){ const p = profile(); let unlocked = false; ACHIEVEMENTS.forEach(a => { if(!p.achievements[a.key] && a.check(p)){ p.achievements[a.key] = true; unlocked = true; p.history.unshift({ id:Date.now()+'', type:'achievement', title:a.name, delta:0, date:nowIso() }); } }); if(unlocked){ showToast('Neuer Erfolg freigeschaltet!'); fireConfetti(); } }

  function iconForTaskTitle(title){ const map = { 'Hausaufgaben erledigt':'🏫','Zimmer aufräumen':'🧹','Müll rausbringen':'🗑️','Zähne putzen (morgens/abends)':'🦷','Freundlich & respektvoll':'🙂','Pünktlich ins Bett':'🛏️','Schultasche packen':'🎒','Esstisch decken':'🍽️','Esstisch abräumen':'🧼', }; return map[title] || '⭐'; }

  function renderProfileSelector(){ const sel = $('#profileSelect'); if(!sel) return; sel.innerHTML = ''; Object.keys(state.profiles).forEach(pid => { const opt = document.createElement('option'); opt.value = pid; opt.textContent = state.profiles[pid].name || 'Profil'; if(pid === state.currentProfileId) opt.selected = true; sel.appendChild(opt); }); }

  function render(){ ensurePeriodCounters(); const p = profile(); if($('#pointsDisplay')) $('#pointsDisplay').textContent = p.points; if($('#streakCount')) $('#streakCount').textContent = p.streak.count || 0; if($('#todayPoints')) $('#todayPoints').textContent = p.counters.dailyPoints || 0; if($('#weekPoints')) $('#weekPoints').textContent = p.counters.weeklyPoints || 0; if($('#maxDay')) $('#maxDay').textContent = p.limits.maxPointsPerDay; if($('#maxWeek')) $('#maxWeek').textContent = p.limits.maxPointsPerWeek; renderProfileSelector(); const intro = $('#intro'); if(intro) intro.classList.toggle('hidden', !p.showIntro);
    const pet = computePetStage(); if($('#petEmoji')) $('#petEmoji').textContent = pet.emoji; if($('#petStatus')) $('#petStatus').textContent = pet.text;
    const tasksUl = $('#tasksList'); if(tasksUl){ tasksUl.innerHTML = ''; state.tasks.forEach(t => { const approvedToday = p.counters.dailyTaskCounts[t.id] || 0; const pendingToday = p.pending.filter(x => x.taskId === t.id && dayKeyOf(x.date) === todayKey()).length; const used = approvedToday + pendingToday; const remaining = Math.max(0, (t.limitPerDay || 1) - used); const li = document.createElement('li'); li.className = 'card'; const icon = document.createElement('span'); icon.className='icon'; icon.textContent = iconForTaskTitle(t.title); const left = document.createElement('div'); left.innerHTML = `<div class="title">${t.title}</div><div class="sub">+${t.points} Punkte · Heute: ${used}/${t.limitPerDay||1}</div>`; const btn = document.createElement('button'); btn.className = 'btn'; btn.textContent = remaining>0 ? 'Markieren' : 'Limit erreicht'; if(remaining<=0){ btn.classList.add('disabled'); } btn.onclick = () => { if(remaining>0) markTask(t.id); }; li.append(icon, left, btn); tasksUl.appendChild(li); }); }
    const pendUl = $('#pendingList'); if(pendUl){ pendUl.innerHTML=''; p.pending.forEach(item => { const li = document.createElement('li'); li.className='card'; li.innerHTML = `<div><div class="title">${item.title}</div><div class="sub">+${item.points} Punkte · markiert ${new Date(item.date).toLocaleString()}</div></div><span class="sub">Wartet auf Bestätigung</span>`; pendUl.appendChild(li); }); }
    const rewardsUl = $('#rewardsList'); if(rewardsUl){ rewardsUl.innerHTML=''; state.rewards.forEach(r => { const li = document.createElement('li'); li.className='card'; li.innerHTML = `<div><div class="title">${r.title}</div><div class="sub">${r.cost} Punkte</div></div>`; const btn = document.createElement('button'); btn.className='btn secondary'; btn.textContent='Einlösen'; btn.onclick = () => redeemReward(r.id); li.appendChild(btn); rewardsUl.appendChild(li); }); }
    const badgesUl = $('#badgesList'); if(badgesUl){ badgesUl.innerHTML=''; const defs = [ { key:'points100', title:'Punktesammler 100', desc:'Erreiche 100 Punkte gesamt.' }, { key:'tasks10', title:'Aufgabenheld 10', desc:'10 bestätigte Aufgaben.' }, { key:'streak7', title:'Streak 7', desc:'7 Tage in Folge aktiv.' }, ]; defs.forEach(b => { const li = document.createElement('li'); li.className = 'badge'+(p.badges[b.key]?'':' locked'); li.innerHTML = `<div class="medal">★</div><div><div class="title">${b.title}</div><div class="sub">${b.desc}</div></div>`; badgesUl.appendChild(li); }); }
    const achUl = $('#achievementsList'); if(achUl){ achUl.innerHTML=''; ACHIEVEMENTS.forEach(a => { const unlocked = !!p.achievements[a.key]; const li = document.createElement('li'); li.className = 'achievement'+(unlocked?' unlocked':' locked'); li.innerHTML = `<div class="icon">${a.icon}</div><div><div class="name">${a.name}</div><div class="sub">${a.desc}</div></div>`; achUl.appendChild(li); }); }
    const histUl = $('#historyList'); if(histUl){ histUl.innerHTML=''; p.history.forEach(h => { const li = document.createElement('li'); li.className='card'; const deltaClass = h.delta > 0 ? 'plus' : (h.delta < 0 ? 'minus' : ''); li.innerHTML = `<div><div class="title">${h.type === 'task' ? 'Aufgabe' : h.type === 'reward' ? 'Belohnung' : 'Erfolg'}: ${h.title}</div><div class="sub">${new Date(h.date).toLocaleString()}</div></div><div class="delta ${deltaClass}">${h.delta>0?'+':''}${h.delta||''}</div>`; histUl.appendChild(li); }); }
    if($('#adminTodayPoints')) $('#adminTodayPoints').textContent = p.counters.dailyPoints; if($('#adminWeekPoints')) $('#adminWeekPoints').textContent = p.counters.weeklyPoints; if($('#adminMaxDay')) $('#adminMaxDay').textContent = p.limits.maxPointsPerDay; if($('#adminMaxWeek')) $('#adminMaxWeek').textContent = p.limits.maxPointsPerWeek;

    // Admin Pending (mit data-id)
    const adminPend = $('#adminPending'); if(adminPend){ adminPend.innerHTML=''; p.pending.forEach(item => { const li = document.createElement('li'); li.className='card'; li.innerHTML = `<div class="title">${item.title}</div><div class="sub">+${item.points} · markiert ${new Date(item.date).toLocaleString()}</div>`; const approve = document.createElement('button'); approve.className='btn'; approve.textContent='Bestätigen'; approve.dataset.pid = item.id; const reject = document.createElement('button'); reject.className='btn danger'; reject.textContent='Ablehnen'; reject.dataset.pid = item.id; li.append(approve, reject); adminPend.appendChild(li); }); }
  }

  // Actions
  function markTask(taskId){ ensurePeriodCounters(); const p = profile(); const t = state.tasks.find(x=>x.id===taskId); if(!t) return; const approvedToday = p.counters.dailyTaskCounts[taskId] || 0; const pendingToday = p.pending.filter(x => x.taskId === taskId && dayKeyOf(x.date) === todayKey()).length; const totalToday = approvedToday + pendingToday; if(totalToday >= (t.limitPerDay||1)) return showToast('Tageslimit erreicht'); p.pending.unshift({ id:'p'+Date.now(), taskId, title:t.title, points:t.points, date:nowIso() }); save(); render(); showToast('Zur Freigabe markiert'); }
  function approveTaskById(pid){ ensurePeriodCounters(); const p = profile(); const idx = p.pending.findIndex(x=>x.id===pid); if(idx<0) return; const item = p.pending[idx]; const t = state.tasks.find(x=>x.id===item.taskId); const approvedToday = p.counters.dailyTaskCounts[item.taskId] || 0; if(approvedToday >= (t.limitPerDay||1)) return showToast('Tageslimit für Aufgabe erreicht'); const wouldDaily = p.counters.dailyPoints + item.points; if(wouldDaily > p.limits.maxPointsPerDay) return showToast('Tageslimit Punkte erreicht'); const wouldWeekly = p.counters.weeklyPoints + item.points; if(wouldWeekly > p.limits.maxPointsPerWeek) return showToast('Wochenlimit Punkte erreicht'); p.pending.splice(idx,1); p.points += item.points; p.counters.dailyPoints += item.points; p.counters.weeklyPoints += item.points; p.counters.dailyTaskCounts[item.taskId] = (p.counters.dailyTaskCounts[item.taskId]||0) + 1; p.stats.totalEarned += item.points; p.history.unshift({ id:Date.now()+'', type:'task', title:item.title, delta:item.points, date:nowIso() }); updateStreakOnAction(); checkBadges(); checkAchievements(); save(); render(); showToast('Bestätigt: +'+item.points+' Punkte'); }
  function rejectTaskById(pid){ const p = profile(); p.pending = p.pending.filter(x=>x.id!==pid); save(); render(); showToast('Abgelehnt'); }
  function redeemReward(rewardId){ const p = profile(); const r = state.rewards.find(x=>x.id===rewardId); if(!r) return; if(p.points < r.cost) return showToast('Nicht genug Punkte'); p.points -= r.cost; p.stats.totalSpent += r.cost; p.stats.rewardsRedeemed += 1; p.history.unshift({ id:Date.now()+'', type:'reward', title:r.title, delta:-r.cost, date:nowIso() }); checkAchievements(); save(); render(); showToast('Belohnung eingelöst'); }
  function addTask(title, pts, limit){ state.tasks.unshift({ id:'t'+Date.now(), title, points:pts, limitPerDay: (limit||1) }); save(); render(); }
  function removeTask(id){ state.tasks = state.tasks.filter(t=>t.id!==id); save(); render(); }
  function addReward(title, cost){ state.rewards.unshift({ id:'r'+Date.now(), title, cost }); save(); render(); }
  function removeReward(id){ state.rewards = state.rewards.filter(r=>r.id!==id); save(); render(); }

  // Profiles
  function addProfile(name){ const pid = 'p'+Date.now(); state.profiles[pid] = defaultProfile(); state.profiles[pid].name = (name||'Profil'); state.currentProfileId = pid; save(); render(); showToast('Profil erstellt'); }
  function renameCurrentProfile(name){ if(!name) return; state.profiles[state.currentProfileId].name = name; save(); render(); showToast('Profil umbenannt'); }
  function deleteCurrentProfile(){ const keys = Object.keys(state.profiles); if(keys.length<=1) return showToast('Mindestens 1 Profil benötigt'); delete state.profiles[state.currentProfileId]; state.currentProfileId = Object.keys(state.profiles)[0]; save(); render(); showToast('Profil gelöscht'); }

  // Delegation & Bindings after DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    $$('.tabs button').forEach(btn => { btn.addEventListener('click', () => { $$('.tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const tab = btn.getAttribute('data-tab'); $$('.tab-content').forEach(sec=>sec.classList.remove('visible')); const target = document.getElementById(tab); if(target) target.classList.add('visible'); }); });

    // Admin Lock
    const unlockBtn = $('#unlockBtn'); if(unlockBtn){ unlockBtn.onclick = () => { const pinInput = $('#pinInput'); const pin = pinInput ? pinInput.value.trim() : ''; if(pin === state.adminPin){ $('#adminLock').classList.add('hidden'); $('#adminPanel').classList.remove('hidden'); } else { showToast('Falscher PIN'); } }; }

    // Punkte Buttons (delegation)
    document.addEventListener('click', (e) => { const add = e.target.getAttribute && e.target.getAttribute('data-add'); if(add){ const delta = parseInt(add,10); const p = profile(); p.points = Math.max(0, p.points + delta); checkBadges(); checkAchievements(); save(); render(); showToast((delta>0?'+':'')+delta+' Punkte'); } });

    // Admin forms
    const addTaskBtn = $('#addTaskBtn'); if(addTaskBtn){ addTaskBtn.onclick = () => { const title = $('#taskTitle').value.trim(); const pts = parseInt($('#taskPoints').value,10); let limit = parseInt($('#taskLimit').value,10); if(!title || isNaN(pts)) return showToast('Titel & Punkte angeben'); if(isNaN(limit) || limit<=0) limit=1; addTask(title, pts, limit); $('#taskTitle').value=''; $('#taskPoints').value=''; $('#taskLimit').value=''; }; }
    const addRewardBtn = $('#addRewardBtn'); if(addRewardBtn){ addRewardBtn.onclick = () => { const title = $('#rewardTitle').value.trim(); const cost = parseInt($('#rewardCost').value,10); if(!title || isNaN(cost)) return showToast('Titel & Kosten angeben'); addReward(title, cost); $('#rewardTitle').value=''; $('#rewardCost').value=''; }; }
    const savePinBtn = $('#savePinBtn'); if(savePinBtn){ savePinBtn.onclick = () => { const np = $('#newPin').value.trim(); if(!np) return showToast('PIN angeben'); state.adminPin = np; save(); showToast('PIN aktualisiert'); $('#newPin').value=''; }; }
    const saveLimitsBtn = $('#saveLimitsBtn'); if(saveLimitsBtn){ saveLimitsBtn.onclick = () => { const p = profile(); const d = parseInt($('#limitDay').value,10); const w = parseInt($('#limitWeek').value,10); if(!isNaN(d)) p.limits.maxPointsPerDay = Math.max(1,d); if(!isNaN(w)) p.limits.maxPointsPerWeek = Math.max(1,w); save(); render(); showToast('Limits gespeichert'); }; }

    // Admin Pending actions via data-id
    const adminPend = $('#adminPending'); if(adminPend){ adminPend.addEventListener('click', (e) => { const t = e.target; if(t.tagName==='BUTTON'){ const pid = t.dataset.pid; if(!pid) return; if(t.textContent==='Bestätigen') approveTaskById(pid); else if(t.textContent==='Ablehnen') rejectTaskById(pid); } }); }

    // Header controls
    const themeToggle = $('#themeToggle'); if(themeToggle){ themeToggle.onclick = () => { state.theme = (state.theme==='dark' ? 'light' : 'dark'); document.body.classList.toggle('dark', state.theme==='dark'); localStorage.setItem(THEMEKEY, state.theme); }; }
    const addProfileBtn = $('#addProfileBtn'); if(addProfileBtn){ addProfileBtn.onclick = () => { const name = prompt('Neuer Profilname?', 'Profil'); if(name===null) return; addProfile(name.trim()); }; }
    const profileSelect = $('#profileSelect'); if(profileSelect){ profileSelect.onchange = (e) => { state.currentProfileId = e.target.value; save(); render(); }; }

    // Intro schließen (Delegation + Fallback)
    function closeIntro(){ const p = profile(); if(!p) return; p.showIntro = false; save(); render(); const introEl = $('#intro'); if(introEl) introEl.classList.add('hidden'); }
    document.addEventListener('click', (e) => {
      const t = e.target;
      if(t && t.id === 'introOkBtn'){ e.preventDefault(); e.stopPropagation(); closeIntro(); return; }
      const introCard = t && t.closest && t.closest('.intro-card');
      if(introCard && t.tagName !== 'A' && t.tagName !== 'INPUT' && t.tagName !== 'BUTTON'){ closeIntro(); }
      const introEl = $('#intro'); if(introEl && t === introEl){ closeIntro(); }
    });

    // Admin Profile actions
    const createProfileBtn = $('#createProfileBtn'); if(createProfileBtn){ createProfileBtn.onclick = () => { const name = $('#newProfileName').value.trim(); addProfile(name || 'Profil'); $('#newProfileName').value=''; }; }
    const renameProfileBtn = $('#renameProfileBtn'); if(renameProfileBtn){ renameProfileBtn.onclick = () => { const name = $('#renameProfileName').value.trim(); if(!name) return showToast('Name angeben'); renameCurrentProfile(name); $('#renameProfileName').value=''; }; }
    const deleteProfileBtn = $('#deleteProfileBtn'); if(deleteProfileBtn){ deleteProfileBtn.onclick = () => { deleteCurrentProfile(); }; }

    // Intro erneut anzeigen Checkbox
    const reShowChk = $('#reShowIntroChk'); if(reShowChk){ reShowChk.onchange = () => { const p = profile(); p.showIntro = reShowChk.checked; save(); render(); }; reShowChk.checked = profile().showIntro; }

    // Initial render after bindings
    render();
  });
})();
