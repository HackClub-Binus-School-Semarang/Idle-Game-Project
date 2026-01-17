"use strict";

/* ================= DATA & CONFIGURATION ================= */
const AGES = [
  { id: "stone", name: "Stone Age", currency: "Food", backgroundClass: "bg-stone", unlockCost: 0, 
    upgrades: [
      { id: "stick", name: "Sharp Stick", cost: 15, power: 1, icon: "px-plus" },
      { id: "fire", name: "Fire Pit", cost: 100, power: 5, icon: "px-sun" }
    ]
  },
  { id: "classical", name: "Classical Age", currency: "Olives", backgroundClass: "bg-classical", unlockCost: 1500, 
    upgrades: [
      { id: "press", name: "Olive Press", cost: 500, power: 25, icon: "px-archive" },
      { id: "scroll", name: "Philosophy", cost: 2500, power: 120, icon: "px-book" }
    ]
  },
  { id: "medieval", name: "Medieval Age", currency: "Gold", backgroundClass: "bg-medieval", unlockCost: 25000, 
    upgrades: [
      { id: "plow", name: "Iron Plow", cost: 8000, power: 500, icon: "px-checkbox-on" },
      { id: "mill", name: "Windmill", cost: 45000, power: 2500, icon: "px-wind" }
    ]
  },
  { id: "industrial", name: "Industrial Age", currency: "Coal", backgroundClass: "bg-industrial", unlockCost: 500000, 
    upgrades: [
      { id: "engine", name: "Steam Engine", cost: 150000, power: 12000, icon: "px-gear" },
      { id: "factory", name: "Assembly Line", cost: 800000, power: 65000, icon: "px-buildings" }
    ]
  },
  { id: "future", name: "Future Age", currency: "Credits", backgroundClass: "bg-future", unlockCost: 10000000, 
    upgrades: [
      { id: "ai", name: "Quantum AI", cost: 4000000, power: 400000, icon: "px-cpu" },
      { id: "dyson", name: "Dyson Swarm", cost: 25000000, power: 2500000, icon: "px-earth" }
    ]
  }
];

const MILESTONES = [
  { id: 'm1', name: "Discovery of Fire", requirement: { id: 'fire', count: 10 }, boost: 1.05 },
  { id: 'm2', name: "Ancient Literacy", requirement: { id: 'scroll', count: 10 }, boost: 1.05 },
  { id: 'm3', name: "Steam Revolution", requirement: { id: 'engine', count: 10 }, boost: 1.10 }
];

/* ================= GAME STATE (SAVE DATA) ================= */
let state = {
  ageIndex: 0,
  currency: 0,
  lifetimeEarnings: 0,
  shards: 0,
  ownedUpgrades: {},
  achievedMilestones: [],
  perSecond: 0
};

/* ================= UI ELEMENTS ================= */
const els = {
  welcome: document.getElementById("welcome-screen"),
  game: document.getElementById("game-screen"),
  ageName: document.getElementById("age-name"),
  curAmount: document.getElementById("currency-amount"),
  curName: document.getElementById("currency-name"),
  shop: document.getElementById("shop-list"),
  gather: document.getElementById("gather-btn"),
  advance: document.getElementById("advance-age-btn"),
  start: document.getElementById("start-btn"),
  milestones: document.getElementById("milestone-list"),
  prestigePanel: document.getElementById("prestige-panel"),
  prestigeInfo: document.getElementById("prestige-info"),
  bigBang: document.getElementById("big-bang-btn")
};

/* ================= CORE UTILITIES ================= */
function formatNumber(num) {
  if (num === 0) return "0";
  if (num < 1000) return Math.floor(num).toString();
  const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  if (tier >= suffixes.length) return num.toExponential(2);
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  return scaled.toFixed(2).replace(/\.00$/, "") + suffixes[tier];
}

/* ================= ENGINE LOGIC ================= */
function calculateIncome() {
  let base = 0;
  AGES.forEach(age => {
    age.upgrades.forEach(upg => {
      base += (state.ownedUpgrades[upg.id] || 0) * upg.power;
    });
  });

  let mult = 1 + (state.shards * 0.1);
  MILESTONES.forEach(m => {
    if (state.achievedMilestones.includes(m.id)) mult *= m.boost;
  });

  state.perSecond = base * mult;
}

function checkMilestones() {
  let changed = false;
  MILESTONES.forEach(m => {
    if (!state.achievedMilestones.includes(m.id)) {
      if ((state.ownedUpgrades[m.requirement.id] || 0) >= m.requirement.count) {
        state.achievedMilestones.push(m.id);
        changed = true;
      }
    }
  });
  if (changed) {
    calculateIncome();
    renderChronicle();
  }
}

function getPendingShards() {
  const potential = Math.floor(Math.sqrt(state.lifetimeEarnings / 1000000));
  return Math.max(0, potential - state.shards);
}

/* ================= VIEW RENDERING ================= */
function renderChronicle() {
  if (!els.milestones) return;
  els.milestones.innerHTML = state.achievedMilestones.length === 0 ? 
    "<p style='opacity:0.5'>No historical records yet...</p>" : "";
  
  MILESTONES.forEach(m => {
    if (state.achievedMilestones.includes(m.id)) {
      const el = document.createElement("div");
      el.innerHTML = `<i class="px px-check"></i> <strong>${m.name}</strong> (+${Math.round((m.boost-1)*100)}%)`;
      els.milestones.appendChild(el);
    }
  });
}

function renderShop() {
  const age = AGES[state.ageIndex];
  els.shop.innerHTML = "";
  age.upgrades.forEach(upg => {
    const count = state.ownedUpgrades[upg.id] || 0;
    const cost = Math.floor(upg.cost * Math.pow(1.15, count));
    const item = document.createElement("div");
    item.className = `shop-item ${state.currency < cost ? 'locked' : ''}`;
    item.innerHTML = `
      <div class="shop-info">
        <h4 class="pixel-text"><i class="px ${upg.icon}"></i> ${upg.name} (x${count})</h4>
        <p>+${formatNumber(upg.power)}/s | Cost: ${formatNumber(cost)}</p>
      </div>
      <button class="buy-btn" ${state.currency < cost ? 'disabled' : ''}>BUY</button>`;
    
    item.querySelector('.buy-btn').onclick = () => buyUpgrade(upg, cost);
    els.shop.appendChild(item);
  });
}

function updateUI() {
  els.curAmount.textContent = formatNumber(state.currency);
  const age = AGES[state.ageIndex];
  const next = AGES[state.ageIndex + 1];

  if (next) els.advance.disabled = state.currency < next.unlockCost;
  
  // Refresh button states without re-rendering whole shop
  const buttons = els.shop.querySelectorAll('.buy-btn');
  age.upgrades.forEach((upg, i) => {
    const cost = Math.floor(upg.cost * Math.pow(1.15, (state.ownedUpgrades[upg.id] || 0)));
    buttons[i].disabled = state.currency < cost;
    buttons[i].parentElement.classList.toggle('locked', state.currency < cost);
  });

  if (els.prestigePanel && !els.prestigePanel.hidden) {
    const pending = getPendingShards();
    els.prestigeInfo.innerHTML = `Shards: ${formatNumber(state.shards)} | Pending: <span style="color:#0f0">+${formatNumber(pending)}</span>`;
    els.bigBang.disabled = (pending <= 0);
  }
}

function applyAgeState() {
  const age = AGES[state.ageIndex];
  document.body.className = age.backgroundClass;
  els.ageName.textContent = age.name;
  els.curName.textContent = age.currency;
  
  const next = AGES[state.ageIndex + 1];
  if (next) {
    els.advance.hidden = false;
    els.advance.querySelector('span').textContent = `EVOLVE (${formatNumber(next.unlockCost)})`;
  } else {
    els.advance.hidden = true;
  }
  
  if (els.prestigePanel) els.prestigePanel.hidden = (state.ageIndex < 4);
  renderShop();
  renderChronicle();
}

/* ================= PLAYER ACTIONS ================= */
function buyUpgrade(upg, cost) {
  if (state.currency >= cost) {
    state.currency -= cost;
    state.ownedUpgrades[upg.id] = (state.ownedUpgrades[upg.id] || 0) + 1;
    calculateIncome();
    checkMilestones();
    renderShop();
    updateUI();
    saveGame();
  }
}

function gather() {
  const power = 1 + (state.perSecond * 0.1);
  state.currency += power;
  state.lifetimeEarnings += power;
  updateUI();
}

function evolve() {
  const next = AGES[state.ageIndex + 1];
  if (next && state.currency >= next.unlockCost) {
    state.currency -= next.unlockCost;
    state.ageIndex++;
    applyAgeState();
    updateUI();
    saveGame();
  }
}

function bigBang() {
  if (confirm("Trigger a Big Bang? Reset current progress for permanent Shards.")) {
    state.shards += getPendingShards();
    state.ageIndex = 0;
    state.currency = 0;
    state.ownedUpgrades = {};
    state.lifetimeEarnings = 0; 
    calculateIncome();
    applyAgeState();
    updateUI();
    saveGame();
  }
}

/* ================= SYSTEM: PERSISTENCE ================= */
function saveGame() {
  localStorage.setItem("agesIdleSave", JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem("agesIdleSave");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state = { ...state, ...data };
      calculateIncome();
    } catch(e) { console.error("Load failed."); }
  }
}

/* ================= INITIALIZATION & LOOPS ================= */
els.start.onclick = () => {
  els.welcome.hidden = true;
  els.game.hidden = false;
  applyAgeState();
};

els.gather.onclick = gather;
els.advance.onclick = evolve;
if (els.bigBang) els.bigBang.onclick = bigBang;

// Tick: 10hz
setInterval(() => {
  const gain = state.perSecond / 10;
  state.currency += gain;
  state.lifetimeEarnings += gain;
  updateUI();
}, 100);

// Auto-save: 30s
setInterval(saveGame, 30000);

// Bootstrap
loadGame();
if (state.ageIndex > 0) document.body.className = AGES[state.ageIndex].backgroundClass;
