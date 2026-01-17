"use strict";

const AGES = [
  { 
    id: "stone", name: "Stone Age", currency: "Food", backgroundClass: "bg-stone", unlockCost: 0, 
    upgrades: [
      { id: "stick", name: "Sharp Stick", cost: 15, power: 1, icon: "px-plus" },
      { id: "fire", name: "Fire Pit", cost: 100, power: 5, icon: "px-sun" }
    ]
  },
  { 
    id: "classical", name: "Classical Age", currency: "Olives", backgroundClass: "bg-classical", unlockCost: 1500, 
    upgrades: [
      { id: "press", name: "Olive Press", cost: 500, power: 25, icon: "px-archive" },
      { id: "scroll", name: "Philosophy", cost: 2500, power: 120, icon: "px-book" }
    ]
  },
  { 
    id: "medieval", name: "Medieval Age", currency: "Gold", backgroundClass: "bg-medieval", unlockCost: 25000, 
    upgrades: [
      { id: "plow", name: "Iron Plow", cost: 8000, power: 500, icon: "px-checkbox-on" },
      { id: "mill", name: "Windmill", cost: 45000, power: 2500, icon: "px-wind" }
    ]
  },
  { 
    id: "industrial", name: "Industrial Age", currency: "Coal", backgroundClass: "bg-industrial", unlockCost: 500000, 
    upgrades: [
      { id: "engine", name: "Steam Engine", cost: 150000, power: 12000, icon: "px-gear" },
      { id: "factory", name: "Assembly Line", cost: 800000, power: 65000, icon: "px-buildings" }
    ]
  },
  { 
    id: "future", name: "Future Age", currency: "Credits", backgroundClass: "bg-future", unlockCost: 10000000, 
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

let state = {
  ageIndex: 0,
  currency: 0,
  lifetimeEarnings: 0,
  shards: 0,
  ownedUpgrades: {},
  achievedMilestones: []
};

/* DOM ELEMENTS */
const welcomeScreen = document.getElementById("welcome-screen");
const gameScreen = document.getElementById("game-screen");
const ageNameEl = document.getElementById("age-name");
const currencyAmountEl = document.getElementById("currency-amount");
const currencyNameEl = document.getElementById("currency-name");
const shopListEl = document.getElementById("shop-list");
const gatherBtn = document.getElementById("gather-btn");
const advanceAgeBtn = document.getElementById("advance-age-btn");
const startBtn = document.getElementById("start-btn");
const milestoneListEl = document.getElementById("milestone-list");
const prestigePanel = document.getElementById("prestige-panel");
const prestigeInfo = document.getElementById("prestige-info");
const bigBangBtn = document.getElementById("big-bang-btn");

function formatNumber(num) {
    if (num === 0) return "0";
    if (num < 1000) return Math.floor(num).toString();
    
    const suffixes = ["", "k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
    
    const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
    
    if (tier >= suffixes.length) return num.toExponential(2);
    
    const suffix = suffixes[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = num / scale;
    
    return scaled.toFixed(2).replace(/\.00$/, "") + suffix;
}

function saveGame() {
  localStorage.setItem("agesIdleSave", JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem("agesIdleSave");
  if (saved) {
    try {
      const loadedState = JSON.parse(saved);
      state = { ...state, ...loadedState };
      calculateIncome();
    } catch(e) {
      console.error("Save corrupted.");
    }
  }
}

/* CORE LOGIC */
function calculateIncome() {
  let baseIncome = 0;
  AGES.forEach(age => {
    age.upgrades.forEach(upg => {
      const count = state.ownedUpgrades[upg.id] || 0;
      baseIncome += count * upg.power;
    });
  });

  let chronicleMult = 1;
  MILESTONES.forEach(m => {
      if (state.achievedMilestones.includes(m.id)) chronicleMult *= m.boost;
  });

  const prestigeMult = 1 + (state.shards * 0.1);
  state.perSecond = baseIncome * chronicleMult * prestigeMult;
}

function checkMilestones() {
    MILESTONES.forEach(m => {
        if (!state.achievedMilestones.includes(m.id)) {
            const count = state.ownedUpgrades[m.requirement.id] || 0;
            if (count >= m.requirement.count) {
                state.achievedMilestones.push(m.id);
                renderChronicle();
            }
        }
    });
}

function renderChronicle() {
    if (!milestoneListEl) return;
    milestoneListEl.innerHTML = state.achievedMilestones.length === 0 ? 
        "<p style='opacity:0.5'>No historical records yet...</p>" : "";
    
    MILESTONES.forEach(m => {
        if (state.achievedMilestones.includes(m.id)) {
            const el = document.createElement("div");
            el.style.marginBottom = "5px";
            el.innerHTML = `<i class="px px-check"></i> <strong>${m.name}</strong> (+${Math.round((m.boost-1)*100)}%)`;
            milestoneListEl.appendChild(el);
        }
    });
}

function calculatePendingShards() {
    const potential = Math.floor(Math.sqrt(state.lifetimeEarnings / 1000000));
    return Math.max(0, potential - state.shards);
}

/* UI FUNCTIONS */
function applyAge() {
  const age = AGES[state.ageIndex];
  if (!age) return;
  
  document.body.className = age.backgroundClass;
  ageNameEl.textContent = age.name;
  currencyNameEl.textContent = age.currency;
  
  const nextAge = AGES[state.ageIndex + 1];
  if (nextAge) {
    advanceAgeBtn.hidden = false;
    advanceAgeBtn.querySelector('span').textContent = `EVOLVE (${formatNumber(nextAge.unlockCost)})`;
  } else {
    advanceAgeBtn.hidden = true;
  }
  
  if (prestigePanel) prestigePanel.hidden = (state.ageIndex < 4);
  renderShop();
  renderChronicle();
}

function renderShop() {
  const age = AGES[state.ageIndex];
  if (!shopListEl || !age) return;
  
  shopListEl.innerHTML = ""; 
  
  age.upgrades.forEach(upgrade => {
    const count = state.ownedUpgrades[upgrade.id] || 0;
    const currentCost = Math.floor(upgrade.cost * Math.pow(1.15, count));
    const canAfford = state.currency >= currentCost;
    
    const item = document.createElement("div");
    item.className = `shop-item ${!canAfford ? 'locked' : ''}`;
    item.innerHTML = `
      <div class="shop-info">
        <h4 class="pixel-text"><i class="px ${upgrade.icon}"></i> ${upgrade.name} (x${count})</h4>
        <p>+${formatNumber(upgrade.power)}/s | Cost: ${formatNumber(currentCost)}</p>
      </div>
      <button class="buy-btn" ${!canAfford ? 'disabled' : ''}>BUY</button>
    `;

    item.querySelector('.buy-btn').addEventListener('click', () => {
      const liveCount = state.ownedUpgrades[upgrade.id] || 0;
      const liveCost = Math.floor(upgrade.cost * Math.pow(1.15, liveCount));
      
      if (state.currency >= liveCost) {
        state.currency -= liveCost;
        state.ownedUpgrades[upgrade.id] = liveCount + 1;
        calculateIncome();
        checkMilestones();
        renderShop();
        updateUI();
        saveGame();
      }
    });
    shopListEl.appendChild(item);
  });
}

function updateUI() {
  currencyAmountEl.textContent = formatNumber(state.currency);
  
  const age = AGES[state.ageIndex];
  const buttons = shopListEl.querySelectorAll('.buy-btn');
  buttons.forEach((btn, index) => {
    const upg = age.upgrades[index];
    const cost = Math.floor(upg.cost * Math.pow(1.15, (state.ownedUpgrades[upg.id] || 0)));
    const canAfford = state.currency >= cost;
    btn.disabled = !canAfford;
    btn.parentElement.classList.toggle('locked', !canAfford);
  });

  const nextAge = AGES[state.ageIndex + 1];
  if (nextAge) advanceAgeBtn.disabled = state.currency < nextAge.unlockCost;

  if (prestigePanel && !prestigePanel.hidden) {
      const pending = calculatePendingShards();
      prestigeInfo.innerHTML = `Shards: ${formatNumber(state.shards)} | Pending: <span style="color:#0f0">+${formatNumber(pending)}</span>`;
      bigBangBtn.disabled = (pending <= 0);
  }
}

/* EVENT LISTENERS */
startBtn.addEventListener("click", () => {
  loadGame();
  welcomeScreen.hidden = true;
  gameScreen.hidden = false;
  applyAge();
  updateUI();
});

gatherBtn.addEventListener("click", () => {
  const clickValue = 1 + (state.perSecond * 0.1);
  state.currency += clickValue;
  state.lifetimeEarnings += clickValue;
  updateUI();
});

advanceAgeBtn.addEventListener("click", () => {
  const nextAge = AGES[state.ageIndex + 1];
  if (nextAge && state.currency >= nextAge.unlockCost) {
    state.currency -= nextAge.unlockCost;
    state.ageIndex++;
    applyAge();
    updateUI();
    saveGame();
  }
});

if (bigBangBtn) {
    bigBangBtn.addEventListener("click", () => {
        if (confirm("Trigger a Big Bang?")) {
            const pending = calculatePendingShards();
            state.shards += pending;
            state.ageIndex = 0;
            state.currency = 0;
            state.ownedUpgrades = {};
            calculateIncome();
            applyAge();
            saveGame();
        }
    });
}

/* GAME LOOP */
setInterval(() => {
  const gain = state.perSecond / 10;
  state.currency += gain;
  state.lifetimeEarnings += gain;
  updateUI();
}, 100);

setInterval(saveGame, 30000);
