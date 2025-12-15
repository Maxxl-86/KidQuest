
// --- Persistenz ---
const KEY = 'familypoints_state_v1';
const defaultState = {
  points: 0,
  adminPin: '1234',
  tasks: [
    { id: 't1', title: 'Hausaufgaben erledigt', points: 10 },
    { id: 't2', title: 'Zimmer aufräumen', points: 8 },
    { id: 't3', title: 'Müll rausbringen', points: 6 },
    { id: 't4', title: 'Zähne putzen (morgens/abends)', points: 4 },
    { id: 't5', title: 'Freundlich & respektvoll', points: 5 },
  ],
  rewards: [
    { id: 'r1', title: '30 Min. Tablet-Zeit', cost: 30 },
    { id: 'r2', title: 'Filmabend aussuchen', cost: 50 },
    { id: 'r3', title: 'Kleines Eis', cost: 25 },
    { id: 'r4', title: 'Ausflug am Wochenende', cost: 120 },
  ],
  history: [] // {id,type,title,delta,date}
};

function load(){
  try{ return JSON.parse(localStorage.getItem(KEY)) || defaultState; }catch(e){ return defaultState; }
}
function save(state){ localStorage.setItem(KEY, JSON.stringify(state)); }

let state = load();

// --- UI helpers ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function render(){
  // Punkte
  $('#pointsDisplay').textContent = state.points;

  // Aufgaben
  const tasksUl = $('#tasksList');
  tasksUl.innerHTML = '';
  state.tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<div><div class="title">${t.title}</div><div class="sub">+${t.points} Punkte</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Gemacht!';
    btn.onclick = () => awardTask(t.id);
    li.appendChild(btn);
    tasksUl.appendChild(li);
  });

  // Belohnungen
  const rewardsUl = $('#rewardsList');
  rewardsUl.innerHTML = '';
  state.rewards.forEach(r => {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `<div><div class="title">${r.title}</div><div class="sub">${r.cost} Punkte</div></div>`;
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    btn.textContent = 'Einlösen';
    btn.onclick = () => redeemReward(r.id);
    li.appendChild(btn);
    rewardsUl.appendChild(li);
  });

  // Verlauf
  const histUl = $('#historyList');
  histUl.innerHTML = '';
  state.history.forEach(h => {
    const li = document.createElement('li');
    li.className = 'card';
    const deltaClass = h.delta > 0 ? 'plus' : 'minus';
    li.innerHTML = `<div>
      <div class="title">${h.type === 'task' ? 'Aufgabe' : 'Belohnung'}: ${h.title}</div>
      <div class="sub">${new Date(h.date).toLocaleString()}</div>
    </div>
    <div class="delta ${deltaClass}">${h.delta > 0 ? '+' : ''}${h.delta}</div>`;
    histUl.appendChild(li);
  });

  // Admin-Listen
  const aTasks = $('#adminTasks');
  aTasks.innerHTML = '';
  state.tasks.forEach(t => {
    const li = document.createElement('li');
    li.className = 'card';
    const title = document.createElement('div');
    title.innerHTML = `<div class="title">${t.title}</div><div class="sub">+${t.points}</div>`;
    const rm = document.createElement('button');
    rm.textContent = 'Entfernen';
    rm.className = 'btn danger';
    rm.onclick = () => removeTask(t.id);
    li.append(title, rm);
    aTasks.appendChild(li);
  });

  const aRewards = $('#adminRewards');
  aRewards.innerHTML = '';
  state.rewards.forEach(r => {
    const li = document.createElement('li');
    li.className = 'card';
    const title = document.createElement('div');
    title.innerHTML = `<div class="title">${r.title}</div><div class="sub">${r.cost}</div>`;
    const rm = document.createElement('button');
    rm.textContent = 'Entfernen';
    rm.className = 'btn danger';
    rm.onclick = () => removeReward(r.id);
    li.append(title, rm);
    aRewards.appendChild(li);
  });
}

// --- Actions ---
function addHistory(entry){
  state.history.unshift(entry);
}

function awardTask(id){
  const t = state.tasks.find(x => x.id === id);
  if(!t) return;
  state.points += t.points;
  addHistory({ id: Date.now()+'' , type:'task', title:t.title, delta:t.points, date:new Date().toISOString() });
  save(state); render();
}

function redeemReward(id){
  const r = state.rewards.find(x => x.id === id);
  if(!r) return;
  if(state.points < r.cost){ alert('Nicht genug Punkte'); return; }
  state.points -= r.cost;
  addHistory({ id: Date.now()+'' , type:'reward', title:r.title, delta:-r.cost, date:new Date().toISOString() });
  save(state); render();
}

function addTask(title, pts){
  const id = 't'+Date.now();
  state.tasks.unshift({ id, title, points: pts });
  save(state); render();
}

function removeTask(id){
  state.tasks = state.tasks.filter(t => t.id !== id);
  save(state); render();
}

function addReward(title, cost){
  const id = 'r'+Date.now();
  state.rewards.unshift({ id, title, cost });
  save(state); render();
}

function removeReward(id){
  state.rewards = state.rewards.filter(r => r.id !== id);
  save(state); render();
}

// --- Admin Lock ---
const adminLock = $('#adminLock');
const adminPanel = $('#adminPanel');

$('#unlockBtn').onclick = () => {
  const pin = $('#pinInput').value.trim();
  if(pin === state.adminPin){
    adminLock.classList.add('hidden');
    adminPanel.classList.remove('hidden');
  } else {
    alert('Falscher PIN');
  }
};

document.addEventListener('click', (e) => {
  const add = e.target.getAttribute('data-add');
  if(add){
    const delta = parseInt(add, 10);
    state.points = Math.max(0, state.points + delta);
    save(state); render();
  }
});

$('#addTaskBtn').onclick = () => {
  const title = $('#taskTitle').value.trim();
  const pts = parseInt($('#taskPoints').value, 10);
  if(!title || isNaN(pts)) return alert('Titel und Punkte angeben');
  addTask(title, pts);
  $('#taskTitle').value = ''; $('#taskPoints').value = '';
};

$('#addRewardBtn').onclick = () => {
  const title = $('#rewardTitle').value.trim();
  const cost = parseInt($('#rewardCost').value, 10);
  if(!title || isNaN(cost)) return alert('Titel und Kosten angeben');
  addReward(title, cost);
  $('#rewardTitle').value = ''; $('#rewardCost').value = '';
};

$('#savePinBtn').onclick = () => {
  const np = $('#newPin').value.trim();
  if(!np) return alert('PIN angeben');
  state.adminPin = np; save(state);
  alert('PIN aktualisiert');
  $('#newPin').value = '';
};

// --- Tabs ---
$$('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tabs button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.getAttribute('data-tab');
    $$('.tab-content').forEach(sec => sec.classList.remove('visible'));
    document.getElementById(tab).classList.add('visible');
  });
});

// Initial
render();
