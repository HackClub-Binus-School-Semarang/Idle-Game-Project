"use strict";

/* ================= GAME DATA (LOADED FROM JSON) ================= */
let AGES = [];
let MILESTONES = [];

const GAME_DATA_URL =
  "https://raw.githubusercontent.com/HackClub-Binus-School-Semarang/Idle-Game-Project/refs/heads/main/gamedata.json";

async function loadGameData() {
  try {
    const res = await fetch(GAME_DATA_URL);
    if (!res.ok) throw new Error("Failed to load game data");

    const data = await res.json();
    AGES = data.ages;
    MILESTONES = data.milestones;

    console.log("Game data loaded");
  } catch (err) {
    console.error("Game data error:", err);
    alert("Failed to load game data.");
  }
}

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

  let mult = 1 + state.shards * 0.1;
  MILESTONES.forEach(m => {
    if (state.achievedMilestones.includes(m.id)) {
      mult *= m.boost;
    }
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
  const potential = Math.floor(Math.sqrt(state.lifetimeEarnings / 1_000_000));
  return Math.max(0, potential - state.shards);
}

/* ================= VIEW RENDERING ================= */
function renderChronicle() {
  if (!els.milestones) return;

  els.milestones.innerHTML =
    state.achievedMilestones.length === 0
      ? "<p style='opacity:0.5'>No historical records yet...</p>"
      : "";

  MILESTONES.forEach(m => {
    if (state.achievedMilestones.includes(m.id)) {
      const el = document.createElement("div");
      el.innerHTML = `<strong>${m.name}</strong> (+${Math.round(
        (m.boost - 1) * 100
      )}%)`;
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
    item.className = `shop-item ${state.currency < cost ? "locked" : ""}`;

    item.innerHTML = `
      <div class="shop-info">
        <h4><i class="px ${upg.icon}"></i> ${upg.name} (x${count})</h4>
        <p>+${formatNumber(upg.power)}/s | Cost: ${formatNumber(cost)}</p>
      </div>
      <button class="buy-btn" ${state.currency < cost ? "disabled" : ""}>BUY</button>
    `;

    item.querySelector(".buy-btn").onclick = () => buyUpgrade(upg, cost);
    els.shop.appendChild(item);
  });
}

function updateUI() {
  els.curAmount.textContent = formatNumber(state.currency);

  const age = AGES[state.ageIndex];
  const next = AGES[state.ageIndex + 1];

  if (next) els.advance.disabled = state.currency < next.unlockCost;

  const buttons = els.shop.querySelectorAll(".buy-btn");
  age.upgrades.forEach((upg, i) => {
    const cost = Math.floor(
      upg.cost * Math.pow(1.15, state.ownedUpgrades[upg.id] || 0)
    );
    buttons[i].disabled = state.currency < cost;
    buttons[i].parentElement.classList.toggle("locked", state.currency < cost);
  });

  if (els.prestigePanel && !els.prestigePanel.hidden) {
    const pending = getPendingShards();
    els.prestigeInfo.innerHTML = `Shards: ${formatNumber(
      state.shards
    )} | Pending: <span style="color:#0f0">+${formatNumber(pending)}</span>`;
    els.bigBang.disabled = pending <= 0;
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
    els.advance.querySelector("span").textContent = `EVOLVE (${formatNumber(
      next.unlockCost
    )})`;
  } else {
    els.advance.hidden = true;
  }

  if (els.prestigePanel) {
    els.prestigePanel.hidden = state.ageIndex < 4;
  }

  renderShop();
  renderChronicle();
}

/* ================= PLAYER ACTIONS ================= */
function buyUpgrade(upg, cost) {
  if (state.currency < cost) return;

  state.currency -= cost;
  state.ownedUpgrades[upg.id] = (state.ownedUpgrades[upg.id] || 0) + 1;

  calculateIncome();
  checkMilestones();
  renderShop();
  updateUI();
  saveGame();
}

function gather() {
  const power = 1 + state.perSecond * 0.1;
  state.currency += power;
  state.lifetimeEarnings += power;
  updateUI();
}

function evolve() {
  const next = AGES[state.ageIndex + 1];
  if (!next || state.currency < next.unlockCost) return;

  state.currency -= next.unlockCost;
  state.ageIndex++;

  applyAgeState();
  updateUI();
  saveGame();
}

function bigBang() {
  if (!confirm("Trigger a Big Bang? Reset progress for permanent Shards.")) return;

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

/* ================= SYSTEM: PERSISTENCE ================= */
function saveGame() {
  localStorage.setItem("agesIdleSave", JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem("agesIdleSave");
  if (!saved) return;

  try {
    state = { ...state, ...JSON.parse(saved) };
    calculateIncome();
  } catch {
    console.error("Save load failed");
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

// Tick (10 Hz)
setInterval(() => {
  const gain = state.perSecond / 10;
  state.currency += gain;
  state.lifetimeEarnings += gain;
  updateUI();
}, 100);

// Auto-save
setInterval(saveGame, 30000);

/* ================= BOOTSTRAP ================= */
async function bootstrap() {
  await loadGameData();
  loadGame();

  if (state.ageIndex > 0) {
    document.body.className = AGES[state.ageIndex].backgroundClass;
  }
}

bootstrap();
