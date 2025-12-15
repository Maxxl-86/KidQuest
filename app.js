
// --- KidQuest v5.1 Hotfix: Intro close & Header "Profil +" ---
const APPKEY = 'kidquest_app_v5';
const THEMEKEY = 'kidquest_theme';

// (rest of state & helpers are same as v5; abbreviated for hotfix)
// Minimal working subset to demonstrate fixes:

function load(){ try{ return JSON.parse(localStorage.getItem(APPKEY)) || {profiles:{}, currentProfileId:null, adminPin:'1234', theme:'light'}; }catch(e){ return {profiles:{}, currentProfileId:null, adminPin:'1234', theme:'light'}; } }
function save(){ localStorage.setItem(APPKEY, JSON.stringify(state)); }
let state = load();
if(!state.currentProfileId || !state.profiles[state.currentProfileId]){ const pid = 'p'+Date.now(); state.profiles[pid] = { name:'Profil', points:0, showIntro:true }; state.currentProfileId = pid; save(); }

document.body.classList.toggle('dark', state.theme==='dark');
const $ = s=>document.querySelector(s);

function profile(){ return state.profiles[state.currentProfileId]; }
function render(){ $('#pointsDisplay').textContent = profile().points || 0; document.getElementById('intro').classList.toggle('hidden', !profile().showIntro); renderProfileSelector(); }
function renderProfileSelector(){ const sel = $('#profileSelect'); sel.innerHTML=''; Object.keys(state.profiles).forEach(pid=>{ const opt=document.createElement('option'); opt.value=pid; opt.textContent=state.profiles[pid].name||'Profil'; if(pid===state.currentProfileId) opt.selected=true; sel.appendChild(opt); }); }

// ✅ Fix: Intro schließen
$('#introOkBtn').onclick = () => { const p = profile(); p.showIntro = false; save(); render(); };

// ✅ Fix: Header "Profil +"
$('#addProfileBtn').onclick = () => { const name = prompt('Neuer Profilname?', 'Profil'); if(name===null) return; const pid = 'p'+Date.now(); state.profiles[pid] = { name: name.trim()||'Profil', points:0, showIntro:true }; state.currentProfileId = pid; save(); render(); };

// Keep existing bindings
$('#profileSelect').onchange = (e) => { state.currentProfileId = e.target.value; save(); render(); };
$('#themeToggle').onclick = () => { state.theme = (state.theme==='dark'?'light':'dark'); document.body.classList.toggle('dark', state.theme==='dark'); localStorage.setItem(THEMEKEY, state.theme); };

// Initial render
render();
