// --- Simple game state ---
// === LOGIN & SAVE SYSTEM ===
let currentUser = null;

// Check if user is logged in on page load
function checkLogin() {
  console.log("🔐 Checking login status...");
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    // Ensure the account still exists; otherwise clear stale flag
    const exists = !!localStorage.getItem(`user_${savedUser}`);
    if (exists) {
      currentUser = savedUser;
      console.log("✅ User logged in:", currentUser);
      return true;
    }
    console.warn("⚠️ Found stale currentUser with no account; clearing");
    localStorage.removeItem('currentUser');
  }
  console.log("❌ No user logged in");
  return false;
}

// Load user's saved game data
function loadGameData() {
  console.log("💾 Loading game data for:", currentUser);
  const saveData = localStorage.getItem(`gameData_${currentUser}`);
  if (saveData) {
    try {
      const data = JSON.parse(saveData);
      coins = data.coins || 500;
      coinsDisplay = coins;
      inventory = data.inventory || [];
      console.log("✅ Game data loaded:", data);
      return true;
    } catch (e) {
      console.error("❌ Failed to parse save data:", e);
    }
  }
  console.log("ℹ️ No save data found, using defaults");
  return false;
}

// Save user's game data
function saveGameData() {
  if (!currentUser) {
    console.warn("⚠️ Cannot save: no user logged in");
    return;
  }
  const saveData = {
    coins: coins,
    inventory: inventory,
    lastSaved: new Date().toISOString()
  };
  localStorage.setItem(`gameData_${currentUser}`, JSON.stringify(saveData));
  console.log("💾 Game data saved for:", currentUser);
}

// Auto-save every 10 seconds
setInterval(() => {
  if (currentUser) {
    saveGameData();
  }
}, 10000);

// Save when page closes
window.addEventListener('beforeunload', () => {
  if (currentUser) {
    saveGameData();
  }
});

// Login system setup
function setupLoginSystem() {
  console.log("🔐 Setting up login system");
  
  const loginScreen = document.getElementById('loginScreen');
  const signinForm = document.getElementById('signinForm');
  const signupForm = document.getElementById('signupForm');
  const loginTabs = document.querySelectorAll('.login-tab');
  
  // Tab switching
  loginTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.loginTab;
      console.log("🔐 Switching to tab:", targetTab);
      
      loginTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.getElementById('signinForm').classList.remove('active');
      document.getElementById('signupForm').classList.remove('active');
      
      if (targetTab === 'signin') {
        signinForm.classList.add('active');
      } else {
        signupForm.classList.add('active');
      }
    });
  });
  
  // Sign In
  signinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("🔐 Sign in attempt");
    
    const username = document.getElementById('signinUsername').value.trim();
    const password = document.getElementById('signinPassword').value;
    const errorEl = document.getElementById('signinError');
    
    // Get stored user data
    const storedPassword = localStorage.getItem(`user_${username}`);
    
    if (!storedPassword) {
      showError(errorEl, "Account not found. Please sign up.");
      return;
    }
    
    if (storedPassword !== password) {
      showError(errorEl, "Incorrect password.");
      return;
    }
    
    // Success!
    console.log("✅ Login successful:", username);
    currentUser = username;
    localStorage.setItem('currentUser', username);
    loadGameData();
    hideLoginScreen();
    showLoadingScreen();
    start();
    // Refresh Settings tab state
    if (typeof updateSettingsAccount === 'function') updateSettingsAccount();
    if (typeof setupAdminPanel === 'function') setupAdminPanel();
  });
  
  // Sign Up
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("🔐 Sign up attempt");
    
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    const errorEl = document.getElementById('signupError');
    
    // Validation
    if (username.length < 3) {
      showError(errorEl, "Username must be at least 3 characters.");
      return;
    }
    
    if (password.length < 4) {
      showError(errorEl, "Password must be at least 4 characters.");
      return;
    }
    
    if (password !== passwordConfirm) {
      showError(errorEl, "Passwords don't match.");
      return;
    }
    
    // Check if username exists
    if (localStorage.getItem(`user_${username}`)) {
      showError(errorEl, "Username already exists.");
      return;
    }
    
    // Create account
    console.log("✅ Account created:", username);
    localStorage.setItem(`user_${username}`, password);
    const adminChecked = !!document.getElementById('signupAdminCheckbox')?.checked;
    if (adminChecked) localStorage.setItem(`user_isAdmin_${username}`, '1');
    currentUser = username;
    localStorage.setItem('currentUser', username);
    
    // Initialize with default game data
    coins = 500;
    coinsDisplay = 500;
    inventory = [];
    saveGameData();
    
    hideLoginScreen();
    showLoadingScreen();
    start();
    if (typeof updateSettingsAccount === 'function') updateSettingsAccount();
    if (typeof setupAdminPanel === 'function') setupAdminPanel();
  });
}

function showError(errorEl, message) {
  errorEl.textContent = message;
  errorEl.classList.add('show');
  setTimeout(() => errorEl.classList.remove('show'), 3000);
}

function hideLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  loginScreen.classList.add('hidden');
  setTimeout(() => {
    loginScreen.style.display = 'none';
  }, 500);
}

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  loginScreen.style.display = 'flex';
  loginScreen.classList.remove('hidden');
}

function showLoadingScreen() {
  console.log("🎬 Showing loading screen");
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'flex';
    loadingScreen.classList.remove('fade-out');
  }
}

// Settings dropdown functionality
function setupSettingsDropdown() {
  console.log("⚙️ Setting up settings dropdown");
  
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsDropdown = document.getElementById('settingsDropdown');
  const logoutBtn = document.getElementById('logoutBtn');
  const settingsUsername = document.getElementById('settingsUsername');
  
  if (!settingsBtn || !settingsDropdown || !logoutBtn || !settingsUsername) {
    console.warn("⚠️ Settings elements not found");
    return;
  }
  
  // Display username
  if (currentUser) {
    settingsUsername.textContent = currentUser;
  }
  
  // Remove any existing event listeners by cloning and replacing
  const newSettingsBtn = settingsBtn.cloneNode(true);
  settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
  
  const newLogoutBtn = logoutBtn.cloneNode(true);
  logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
  
  // Toggle dropdown
  newSettingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    settingsDropdown.classList.toggle('show');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!newSettingsBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
      settingsDropdown.classList.remove('show');
    }
  });
  
  // Logout functionality
  newLogoutBtn.addEventListener('click', () => {
    logout();
  });
}

// --- Settings tab helpers (Account + Admin) ---
function isAdmin() {
  if (!currentUser) return false;
  return localStorage.getItem(`user_isAdmin_${currentUser}`) === '1';
}

function updateSettingsAccount() {
  const nameEl = document.getElementById('accountUser');
  const roleEl = document.getElementById('accountRole');
  const adminBox = document.getElementById('adminPanel');
  if (!nameEl || !roleEl || !adminBox) return;
  if (currentUser) {
    nameEl.textContent = currentUser;
    const admin = isAdmin();
    roleEl.textContent = admin ? 'Admin' : 'Player';
    adminBox.style.display = admin ? 'block' : 'none';
  } else {
    nameEl.textContent = 'Guest';
    roleEl.textContent = 'Player';
    adminBox.style.display = 'none';
  }
}

function setupAdminPanel() {
  const adminBox = document.getElementById('adminPanel');
  if (!adminBox) return;
  const admin = isAdmin();
  adminBox.style.display = admin ? 'block' : 'none';
  if (!admin) return;
  if (!eggsData) return;

  const egSel = document.getElementById('adminEggSelect');
  const ptSel = document.getElementById('adminPetSelect');
  const chanceInput = document.getElementById('adminChanceInput');
  const coinsInput = document.getElementById('adminCoins');
  const applyCoins = document.getElementById('adminApplyCoins');
  const saveChance = document.getElementById('adminSaveChance');
  const givePet = document.getElementById('adminGivePet');
  if (!egSel || !ptSel || !chanceInput || !coinsInput || !applyCoins || !saveChance || !givePet) return;

  // Populate eggs
  egSel.innerHTML = '';
  Object.keys(eggsData).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name; opt.textContent = name; egSel.appendChild(opt);
  });

  function fillPets() {
    ptSel.innerHTML = '';
    const egg = eggsData[egSel.value];
    if (!egg) return;
    egg.pets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name; opt.textContent = `${p.name} (${p.rarity})`;
      ptSel.appendChild(opt);
    });
    const pet = egg.pets.find(p => p.name === ptSel.value) || egg.pets[0];
    if (pet) chanceInput.value = pet.chance ?? 0;
  }
  egSel.onchange = fillPets;
  ptSel.onchange = () => {
    const egg = eggsData[egSel.value];
    const pet = egg?.pets.find(p => p.name === ptSel.value);
    if (pet) chanceInput.value = pet.chance ?? 0;
  };
  fillPets();

  coinsInput.value = coins;
  applyCoins.onclick = () => {
    const v = parseInt(coinsInput.value, 10);
    if (!Number.isFinite(v) || v < 0) { toast('Enter valid coins'); return; }
    setCoins(v);
    toast('Coins updated');
  };

  saveChance.onclick = () => {
    const egg = eggsData[egSel.value];
    if (!egg) return;
    const pet = egg.pets.find(p => p.name === ptSel.value);
    if (!pet) return;
    let newChance = parseFloat(chanceInput.value);
    if (!Number.isFinite(newChance) || newChance < 0) newChance = 0;
    if (newChance > 1) newChance = 1;

    const others = egg.pets.filter(p => p !== pet);
    const othersSum = others.reduce((a, p) => a + (p.chance || 0), 0);
    const remaining = Math.max(1 - newChance, 0);
    if (othersSum > 0) {
      others.forEach(p => p.chance = (p.chance || 0) * (remaining / othersSum));
    } else if (others.length) {
      const even = remaining / others.length; others.forEach(p => p.chance = even);
    }
    pet.chance = newChance;
    toast('Chances updated');
  };

  givePet.onclick = () => {
    const egg = eggsData[egSel.value];
    const pet = egg?.pets.find(p => p.name === ptSel.value);
    if (!pet) return;
    inventory.unshift({ ...pet });
    renderInventory();
    toast(`Granted ${pet.name}`);
  };
}

function logout() {
  console.log("🔐 Logging out");
  if (confirm('Are you sure you want to logout? Progress will be saved.')) {
    saveGameData();
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    // Show login screen
    showLoginScreen();
    
    // Hide loading screen
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
    }
    
    // Reset form inputs
    document.getElementById('signinUsername').value = '';
    document.getElementById('signinPassword').value = '';
    if (typeof updateSettingsAccount === 'function') updateSettingsAccount();
    const adminBox = document.getElementById('adminPanel');
    if (adminBox) adminBox.style.display = 'none';
  }
}

let coins = 500; // Will be loaded from save data if user is logged in
let coinsDisplay = coins;
let coinAnimFrame = null;
let inventory = [];
let eggsData = null;

console.log("🎮 Game initializing...");
console.log("💰 Starting coins:", coins);

// --- Helpers ---
const elCoins = () => document.getElementById("coins");
const elEggs = () => document.getElementById("eggs");
const elInv = () => document.getElementById("inventory");
const elToast = () => document.getElementById("toast");

function setCoins(v) {
  console.log("💰 setCoins called:", { from: coins, to: v });
  const target = Math.max(0, Math.floor(v));
  const start = coinsDisplay;
  const diff = target - start;
  coins = target;

  if (coinAnimFrame) {
    console.log("⏸️ Canceling previous coin animation");
    cancelAnimationFrame(coinAnimFrame);
  }

  if (diff === 0) {
    console.log("💰 No coin change, updating immediately");
    coinsDisplay = target;
    elCoins().textContent = coinsDisplay.toLocaleString();
    return;
  }

  const duration = 520;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    coinsDisplay = Math.round(start + diff * eased);
    elCoins().textContent = coinsDisplay.toLocaleString();

    if (progress < 1) {
      coinAnimFrame = requestAnimationFrame(step);
    } else {
      console.log("💰 Coin animation complete. New balance:", coins);
    }
  }

  coinAnimFrame = requestAnimationFrame(step);
}


function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let h = hex.replace('#','');
  if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pickTextColor(hex) {
  if (!hex) return '#ffffff';
  let h = hex.replace('#','');
  if (h.length === 3) h = h.split('').map(c=>c+c).join('');
  const r = parseInt(h.slice(0,2),16) / 255;
  const g = parseInt(h.slice(2,4),16) / 255;
  const b = parseInt(h.slice(4,6),16) / 255;
  const f = (v) => (v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4));
  const L = 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
  return L > 0.6 ? '#0b0015' : '#ffffff';
}

//

function weightedPick(pool) {
  console.log("🎲 weightedPick called with pool of", pool.length, "items");
  const r = Math.random();
  console.log("🎲 Random value:", r);
  let acc = 0;
  for (const p of pool) {
    acc += p.chance;
    if (r <= acc) {
      console.log("🎲 Selected:", p.name, "at accumulated chance:", acc);
      return p;
    }
  }
  console.log("🎲 Fallback: returning last item");
  return pool[pool.length - 1];
}

const rarityColors = {
  Common: "#9aa0a6",
  Uncommon: "#6cc070",
  Rare: "#5ab0ff",
  Legendary: "#ffc84a",
  Mythical: "#834affff",
  Divine: "#ff6aa6", 
  Prismatic: "#c70000ff"
};

// Mutation outcomes
const MUTATIONS = [
  { name: '🧩 Stable Gene', chance: 0.25, color: '#8b8bff', mult: 1.2 },
  { name: '✨ Shiny Variant', chance: 0.20, color: '#ffd700', mult: 1.5 },
  { name: '⚡ Supercharged', chance: 0.15, color: '#00ffe1', mult: 2.0 },
  { name: '🌌 Celestial Form', chance: 0.08, color: '#c77dff', mult: 3.0 },
  { name: '🔥 Mythic Rebirth', chance: 0.03, color: '#ff6aa6', mult: 5.0 },
  { name: '💫 Quantum Rift', chance: 0.02, color: '#7df9ff', mult: 'random' },
  { name: '☠️ Corrupted Gene', chance: 0.10, color: '#a52a2a', mult: 0.5 },
  { name: '💀 Abyssal Failure', chance: 0.02, color: '#2b0f45', mult: 0.0 },
  { name: '🧬 No Effect', chance: 0.15, color: '#9aa0a6', mult: 1.0 }
];

function showOverlay() {
  console.log("🎬 Showing case opening overlay");
  const overlay = document.getElementById("caseOpening");
  const btn = document.getElementById("closeCase");
  const resultEl = document.getElementById("caseResult");
  const strip = document.getElementById("caseStrip");
  
  if (resultEl) resultEl.textContent = "";
  if (strip) {
    strip.querySelectorAll(".is-winning").forEach(node => node.classList.remove("is-winning"));
    strip.style.transition = "none";
    strip.style.transform = "translateX(0px)";
  }
  if (btn) {
    btn.disabled = true;
    btn.onclick = null;
  }
  
  overlay.classList.add("is-active");
  overlay.setAttribute("aria-hidden", "false");
  console.log("🎬 Overlay now active");
}

function hideOverlay() {
  console.log("🎬 Hiding case opening overlay");
  const overlay = document.getElementById("caseOpening");
  overlay.classList.remove("is-active");
  overlay.setAttribute("aria-hidden", "true");
}

async function animateCaseOpening(egg) {
  console.log("🎰 Starting case opening animation for egg:", egg);
  showOverlay();

  const strip = document.getElementById("caseStrip");
  const track = document.getElementById("caseTrack");
  
  if (!strip || !track) {
    console.error("❌ Case opening elements missing!");
    hideOverlay();
    return weightedPick(egg.pets);
  }

  console.log("🎰 Resetting strip");
  strip.innerHTML = "";
  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";

  const resultPet = weightedPick(egg.pets);
  console.log("🎰 Winning pet decided:", resultPet.name);

  const pool = egg.pets;
  const repeated = [];
  const leadCycles = 32;
  
  console.log("🎰 Building strip with", leadCycles, "lead cycles");
  for (let i = 0; i < leadCycles; i++) repeated.push(...pool);

  const resultIndex = repeated.length;
  repeated.push(resultPet);
  console.log("🎰 Result index:", resultIndex);

  const tailCycles = 12;
  for (let i = 0; i < tailCycles; i++) repeated.push(...pool);

  console.log("🎰 Total cards in strip:", repeated.length);
  repeated.forEach((p, idx) => {
    const cell = document.createElement("div");
    cell.className = "case-card";
    const rcol = rarityColors[p.rarity];
    if (rcol) {
      cell.style.background = rcol;
      cell.style.borderColor = rcol;
      cell.style.color = pickTextColor(rcol);
    }

    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;

    const label = document.createElement("div");
    label.textContent = p.name;
    label.style.webkitTextStroke = '1px #000';
    label.style.textShadow = '0 1px 2px #000, 1px 0 2px #000, 0 -1px 2px #000, -1px 0 2px #000';

    cell.appendChild(img);
    cell.appendChild(label);
    strip.appendChild(cell);
  });

  await new Promise(resolve => requestAnimationFrame(resolve));

  const pointerOffset = track.clientWidth / 2;
  const padLeft = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
  const firstCell = strip.children[0];
  let cellWidth = 0;

  if (firstCell) {
    const firstRect = firstCell.getBoundingClientRect();
    const secondCell = strip.children[1];
    if (secondCell) {
      const secondRect = secondCell.getBoundingClientRect();
      cellWidth = secondRect.left - firstRect.left;
    } else {
      cellWidth = firstRect.width;
    }
  }

  if (cellWidth === 0) cellWidth = 134;
  
  console.log("🎰 Cell width:", cellWidth);

  const targetOffset = padLeft + resultIndex * cellWidth + cellWidth / 2 - pointerOffset;
  const distance = Math.max(targetOffset, 0);
  const duration = 4300;

  console.log("🎰 Animation distance:", distance, "Duration:", duration);

  await new Promise(resolve => {
    if (distance <= 0) {
      strip.style.transform = "translateX(0px)";
      setTimeout(resolve, 80);
      return;
    }

    let settled = false;
    const cleanup = () => {
      if (settled) return;
      settled = true;
      strip.style.transition = "none";
      console.log("🎰 Animation complete");
      resolve();
    };

    const fallback = setTimeout(cleanup, duration + 120);
    strip.addEventListener("transitionend", () => {
      clearTimeout(fallback);
      cleanup();
    }, { once: true });

    requestAnimationFrame(() => {
      void strip.offsetWidth;
      strip.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.86, 0.32, 1)`;
      strip.style.transform = `translateX(${-distance}px)`;
      console.log("🎰 Strip animation started");
    });
  });

  const winningCard = strip.children[resultIndex];
  if (winningCard) {
    winningCard.classList.add("is-winning");
    console.log("🎰 Winning card highlighted");
  }

  const resultEl = document.getElementById("caseResult");
  const color = rarityColors[resultPet.rarity] || "#fff";
  resultEl.innerHTML = `<span style="color:${color}; text-shadow:0 0 12px ${color}66;">
    You got: ${resultPet.rarity} ${resultPet.name}
  </span>`;
  console.log("🎰 Result displayed:", resultPet.name);

  const btn = document.getElementById("closeCase");
  await new Promise(res => {
    btn.disabled = false;
    btn.onclick = () => {
      console.log("✅ Continue button clicked");
      res();
    };
  });

  hideOverlay();
  return resultPet;
}

// Mutation animation (colored boxes, no icons)
async function animateMutationOpening(pool) {
  showOverlay();

  const strip = document.getElementById("caseStrip");
  const track = document.getElementById("caseTrack");
  if (!strip || !track) {
    console.error("❌ Mutation elements missing!");
    hideOverlay();
    return pool[0];
  }

  // Reset strip
  strip.innerHTML = "";
  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";

  // Decide the winning mutation
  const result = weightedPick(pool);

  // Build long strip
  const repeated = [];
  const leadCycles = 32; for (let i = 0; i < leadCycles; i++) repeated.push(...pool);
  const resultIndex = repeated.length; repeated.push(result);
  const tailCycles = 12; for (let i = 0; i < tailCycles; i++) repeated.push(...pool);

  repeated.forEach(m => {
    const cell = document.createElement("div");
    cell.className = "case-card";
    cell.style.background = m.color;
    cell.style.borderColor = m.color;
    cell.style.color = '#0b0015';
    const name = document.createElement('div');
    name.textContent = m.name;
    name.style.fontWeight = '800';
    name.style.webkitTextStroke = '1px #000';
    name.style.textShadow = '0 1px 2px #000, 1px 0 2px #000, 0 -1px 2px #000, -1px 0 2px #000';
    cell.appendChild(name);
    strip.appendChild(cell);
  });

  // Layout before measuring
  await new Promise(r => requestAnimationFrame(r));
  const pointerOffset = track.clientWidth / 2;
  const padLeft = parseFloat(getComputedStyle(strip).paddingLeft) || 0;
  const firstCell = strip.children[0];
  let cellWidth = 0;
  if (firstCell) {
    const a = firstCell.getBoundingClientRect();
    const b = strip.children[1]?.getBoundingClientRect();
    cellWidth = b ? (b.left - a.left) : a.width;
  }
  if (!cellWidth) cellWidth = 134;
  const targetOffset = padLeft + resultIndex * cellWidth + cellWidth / 2 - pointerOffset;
  const distance = Math.max(targetOffset, 0);
  const duration = 4300;

  await new Promise(resolve => {
    if (distance <= 0) { strip.style.transform = 'translateX(0px)'; setTimeout(resolve, 80); return; }
    let settled = false;
    const cleanup = () => { if (settled) return; settled = true; strip.style.transition = 'none'; resolve(); };
    const fallback = setTimeout(cleanup, duration + 120);
    strip.addEventListener('transitionend', () => { clearTimeout(fallback); cleanup(); }, { once: true });
    requestAnimationFrame(() => {
      void strip.offsetWidth;
      strip.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.86, 0.32, 1)`;
      strip.style.transform = `translateX(${-distance}px)`;
    });
  });

  const winningCard = strip.children[resultIndex];
  if (winningCard) winningCard.classList.add('is-winning');

  const resultEl = document.getElementById('caseResult');
  resultEl.innerHTML = `<span style="color:#fff;">Mutation: ${result.name}</span>`;

  const btn = document.getElementById('closeCase');
  await new Promise(res => { btn.disabled = false; btn.onclick = () => res(); });
  hideOverlay();
  return result;
}

function renderEggShop() {
  console.log("🏪 renderEggShop called");
  console.log("🏪 eggsData:", eggsData);
  
  const wrap = elEggs();
  
  if (!eggsData) {
    console.error("❌ eggsData is null!");
    return;
  }
  
  wrap.innerHTML = "";
  
  const entries = Object.entries(eggsData);
  console.log("🏪 Number of eggs to render:", entries.length);
  
  entries.forEach(([eggName, egg], index) => {
    console.log(`🏪 Creating card ${index + 1}:`, eggName);
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `
      <img src="${egg.image}" alt="${eggName}">
      <div><strong>${eggName}</strong></div>
      <div class="price">${egg.price === 0 ? "Free" : egg.price + " coins"}</div>
      <button class="btn" data-egg="${eggName}">Open Egg</button>
    `;
    wrap.appendChild(card);
    
    const btn = card.querySelector("button[data-egg]");
    
    if (btn) {
      btn.addEventListener("click", () => {
        console.log("🥚 Egg button clicked:", eggName);
        openEgg(eggName);
      });
      console.log(`🏪 Event listener attached to button for: ${eggName}`);
    } else {
      console.error(`❌ Button not found in card for: ${eggName}`);
    }

    // Clicking card background opens egg info (not the Open button)
    card.addEventListener('click', (e) => {
      if (e.target.closest('button[data-egg]')) return;
      showEggInfo(eggName);
    });
  });
  
  console.log("🏪 Shop rendering complete. Total cards:", wrap.children.length);
}

function renderInventory() {
  console.log("🎒 renderInventory called. Items:", inventory.length);
  const wrap = elInv();
  
  if (inventory.length === 0) {
    console.log("🎒 Inventory empty, showing empty message");
    wrap.innerHTML = `<div class="inv-row inv-row--empty">You haven't hatched any pets yet.</div>`;
    return;
  }
  
  wrap.innerHTML = "";
  inventory.forEach((pet, i) => {
    console.log(`🎒 Rendering inventory item ${i}:`, pet.name);
    const row = document.createElement("div");
    row.className = "inv-row";
    row.style.animationDelay = `${i * 0.05}s`;
    const rcol = rarityColors[pet.rarity];
    if (rcol) {
      row.style.borderColor = rcol;
      row.style.background = hexToRgba(rcol, 0.18);
      row.style.color = pickTextColor(rcol);
    }
    row.innerHTML = `
      <div class="inv-item">
        <img src="${pet.image}" alt="${pet.name}">
        <div class="inv-details">
          <div><strong>${pet.name}</strong> <span class="rarity">(${pet.rarity})</span> ${pet.mutated ? `<span class="badge badge-mutation">${pet.mutationName || 'Mutated'}</span>` : ''}</div>
          <div class="value">Value: ${pet.value}</div>
        </div>
      </div>
      <div class="inv-actions">
        <button class="icon-btn" data-lock="${i}" aria-pressed="${pet.locked ? 'true' : 'false'}" title="${pet.locked ? 'Unlock' : 'Lock'}">${pet.locked ? '🔒' : '🔓'}</button>
        <button class="btn btn-sm" data-mutate="${i}" ${pet.mutated ? 'disabled' : ''}>Mutate</button>
        ${pet.mutated ? `<button class="btn btn-sm btn-secondary" data-unmutate="${i}">Remove Mutation (+30k)</button>` : ''}
        <button class="btn btn-sm" data-sell="${i}" ${pet.locked ? 'disabled' : ''}>Sell</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll("button[data-sell]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.dataset.sell, 10);
      const pet = inventory[idx];
      if (pet?.locked) { toast('Pet is locked'); return; }
      console.log("💵 Selling pet:", pet.name, "for", pet.value, "coins");
      inventory.splice(idx, 1);
      setCoins(coins + pet.value);
      renderInventory();
      toast(`Sold ${pet.name} for ${pet.value} coins`);
    });
  });

  // Lock/unlock toggle
  wrap.querySelectorAll('button[data-lock]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.lock, 10);
      const pet = inventory[idx];
      if (!pet) return;
      pet.locked = !pet.locked;
      renderInventory();
      toast(pet.locked ? 'Pet locked' : 'Pet unlocked');
    });
  });

  // Mutation actions per pet
  wrap.querySelectorAll('button[data-mutate]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = parseInt(btn.dataset.mutate, 10);
      const pet = inventory[idx];
      if (!pet) { toast('Pet not found'); return; }
      if (pet.mutated) { toast('This pet has already been mutated'); return; }
      const confirmed = await confirmMutation(pet);
      if (!confirmed) return;
      if (coins < 100000) { toast('Not enough coins (need 100,000)'); return; }

      setCoins(coins - 100000);
      const prevValue = pet.value;
      const outcome = await animateMutationOpening([
        { name: '🧩 Stable Gene', chance: 0.25, color: '#8b8bff', mult: 1.2 },
        { name: '✨ Shiny Variant', chance: 0.20, color: '#ffd700', mult: 1.5 },
        { name: '⚡ Supercharged', chance: 0.15, color: '#00ffe1', mult: 2.0 },
        { name: '🌌 Celestial Form', chance: 0.08, color: '#c77dff', mult: 3.0 },
        { name: '🔥 Mythic Rebirth', chance: 0.03, color: '#ff6aa6', mult: 5.0 },
        { name: '💫 Quantum Rift', chance: 0.02, color: '#7df9ff', mult: 'random' },
        { name: '☠️ Corrupted Gene', chance: 0.10, color: '#a52a2a', mult: 0.5 },
        { name: '💀 Abyssal Failure', chance: 0.02, color: '#2b0f45', mult: 0.0 },
        { name: '🧬 No Effect', chance: 0.15, color: '#9aa0a6', mult: 1.0 }
      ]);
      let factor;
      if (outcome.mult === 'random') {
        // Random between 0.5 and 10
        factor = Math.random() * (10 - 0.5) + 0.5;
      } else {
        factor = Number(outcome.mult) || 1.0;
      }

      if (factor <= 0) {
        // Destroy
        inventory.splice(idx, 1);
        renderInventory();
        toast(`${outcome.name}: Pet destroyed`);
        return;
      }

      pet.baseValue = prevValue;
      pet.mutated = true;
      pet.mutationName = outcome.name;
      pet.value = Math.max(0, Math.floor(pet.value * factor));
      renderInventory();
      toast(`${outcome.name}: New value ${pet.value}`);
    });
  });

  // Remove mutation actions
  wrap.querySelectorAll('button[data-unmutate]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.unmutate, 10);
      const pet = inventory[idx];
      if (!pet || !pet.mutated) return;
      // Refund 30k and revert to base value if stored
      setCoins(coins + 30000);
      if (typeof pet.baseValue === 'number') pet.value = pet.baseValue;
      delete pet.baseValue;
      delete pet.mutated;
      delete pet.mutationName;
      renderInventory();
      toast('Mutation removed (+30,000)');
    });
  });
  
  console.log("🎒 Inventory rendering complete");
}

function toast(msg) {
  const t = elToast();
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

async function openEgg(eggName) {
  console.log("🥚 openEgg called for:", eggName);
  const egg = eggsData[eggName];
  
  if (!egg) {
    console.error("❌ Egg not found:", eggName);
    return;
  }

  console.log("🥚 Egg data:", egg);
  console.log("🥚 Current coins:", coins, "Egg price:", egg.price);

  if (egg.price > coins) {
    console.warn("⚠️ Not enough coins!");
    toast("Not enough coins");
    return;
  }

  console.log("🥚 Opening egg...");
  setCoins(coins - egg.price);

  const pet = await animateCaseOpening(egg);

  console.log("🎉 Pet hatched:", pet);
  inventory.unshift(pet);
  console.log("🎒 Inventory updated. New length:", inventory.length);
  renderInventory();

  toast(`You hatched: ${pet.rarity} ${pet.name}!`);
}

function createRipple(target, event) {
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = `${size}px`;
  const clientX = event.clientX || rect.left + rect.width / 2;
  const clientY = event.clientY || rect.top + rect.height / 2;
  ripple.style.left = `${clientX - rect.left - size / 2}px`;
  ripple.style.top = `${clientY - rect.top - size / 2}px`;

  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

function triggerPulse(target) {
  if (!target) return;
  target.classList.remove("is-pulsing");
  void target.offsetWidth;
  target.classList.add("is-pulsing");
  setTimeout(() => target.classList.remove("is-pulsing"), 400);
}

function setupInteractiveEffects() {
  console.log("✨ Setting up interactive effects");
  
  document.addEventListener("click", event => {
    const btn = event.target.closest(".btn");
    if (btn) {
      console.log("✨ Button ripple effect triggered");
      createRipple(btn, event);
      triggerPulse(btn);
    }
  });

  document.addEventListener("pointerdown", event => {
    const card = event.target.closest(".card");
    if (card) {
      console.log("✨ Card pulse effect triggered");
      triggerPulse(card);
    }
  });
}

// Format percent with adaptive precision
function formatChance(c) {
  if (c == null || isNaN(c)) return "-";
  const pct = c * 100;
  if (pct >= 1) return pct.toFixed(2);
  if (pct >= 0.1) return pct.toFixed(3);
  return pct.toFixed(4);
}

function showEggInfo(eggName) {
  const egg = eggsData?.[eggName];
  const ov = document.getElementById('eggInfoOverlay');
  const list = document.getElementById('eggInfoList');
  const nameEl = document.getElementById('eggInfoName');
  const imgEl = document.getElementById('eggInfoImage');
  if (!egg || !ov || !list || !nameEl || !imgEl) return;
  nameEl.textContent = eggName;
  imgEl.src = egg.image; imgEl.alt = eggName;
  list.innerHTML = '';
  egg.pets.forEach(p => {
    const rcolor = rarityColors[p.rarity] || '#fff';
    const row = document.createElement('div');
    row.className = 'egginfo-row';
    row.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div>
        <div class="egginfo-name">${p.name}</div>
        <div class="egginfo-rarity" style="color:${rcolor}">${p.rarity}</div>
      </div>
      <div class="egginfo-value">Value: ${p.value}</div>
      <div class="egginfo-chance" style="color:${rcolor}">${formatChance(p.chance)}%</div>
    `;
    list.appendChild(row);
  });
  ov.classList.add('is-active');
  ov.setAttribute('aria-hidden','false');
  const closeBtn = document.getElementById('eggInfoClose');
  const close = () => { ov.classList.remove('is-active'); ov.setAttribute('aria-hidden','true'); };
  if (closeBtn) closeBtn.onclick = close;
  ov.onclick = (e) => { if (!e.target.closest('.egginfo-dialog')) close(); };
}

async function confirmMutation(pet) {
  const ov = document.getElementById('mutateConfirm');
  const yes = document.getElementById('mutateYes');
  const no = document.getElementById('mutateNo');
  const chancesBtn = document.getElementById('mutateChancesBtn');
  const petNameEl = document.getElementById('mutatePetName');
  const costEl = document.getElementById('mutateCost');
  if (!ov || !yes || !no || !chancesBtn || !petNameEl || !costEl) return false;
  petNameEl.textContent = pet?.name || 'this pet';
  costEl.textContent = '100,000';
  ov.classList.add('is-active');
  ov.setAttribute('aria-hidden','false');

  const showChances = () => {
    const cov = document.getElementById('mutateChances');
    const list = document.getElementById('mutateChancesList');
    const close = document.getElementById('mutateChancesClose');
    if (!cov || !list || !close) return;
    list.innerHTML = '';
    const toPct = n => (n*100).toFixed(n*100 >= 1 ? 2 : 3);
    const items = [
      { name:'🧩 Stable Gene', chance:0.25, mult:'×1.2', color:'#8b8bff' },
      { name:'✨ Shiny Variant', chance:0.20, mult:'×1.5', color:'#ffd700' },
      { name:'⚡ Supercharged', chance:0.15, mult:'×2.0', color:'#00ffe1' },
      { name:'🌌 Celestial Form', chance:0.08, mult:'×3.0', color:'#c77dff' },
      { name:'🔥 Mythic Rebirth', chance:0.03, mult:'×5.0', color:'#ff6aa6' },
      { name:'💫 Quantum Rift', chance:0.02, mult:'×0.5–×10', color:'#7df9ff' },
      { name:'☠️ Corrupted Gene', chance:0.10, mult:'×0.5', color:'#a52a2a' },
      { name:'💀 Abyssal Failure', chance:0.02, mult:'×0', color:'#2b0f45' },
      { name:'🧬 No Effect', chance:0.15, mult:'×1.0', color:'#9aa0a6' }
    ];
    items.forEach(m => {
      const row = document.createElement('div');
      row.className = 'egginfo-row';
      row.innerHTML = `
        <div style="width:56px;height:56px;border-radius:10px;background:${m.color}"></div>
        <div>
          <div class="egginfo-name">${m.name}</div>
          <div class="egginfo-rarity" style="color:${m.color}">Mutation</div>
        </div>
        <div class="egginfo-value">${m.mult}</div>
        <div class="egginfo-chance" style="color:${m.color}">${toPct(m.chance)}%</div>
      `;
      list.appendChild(row);
    });
    cov.classList.add('is-active'); cov.setAttribute('aria-hidden','false');
    close.onclick = () => { cov.classList.remove('is-active'); cov.setAttribute('aria-hidden','true'); };
    cov.onclick = (e) => { if (!e.target.closest('.egginfo-dialog')) close.onclick(); };
  };

  return await new Promise(resolve => {
    const cleanup = () => { ov.classList.remove('is-active'); ov.setAttribute('aria-hidden','true'); yes.onclick = no.onclick = chancesBtn.onclick = null; };
    no.onclick = () => { cleanup(); resolve(false); };
    yes.onclick = () => { cleanup(); resolve(true); };
    chancesBtn.onclick = () => { showChances(); };
  });
}

function setupTabs() {
  console.log("📑 Setting up tabs");
  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));

  console.log("📑 Found", tabButtons.length, "tab buttons and", panels.length, "panels");

  if (!tabButtons.length || !panels.length) {
    console.error("❌ Tab buttons or panels not found!");
    return;
  }

  function activate(tabName) {
    console.log("📑 Activating tab:", tabName);
    
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach(panel => {
      const isActive = panel.dataset.tabPanel === tabName;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
      if (isActive) {
        console.log("📑 Panel active:", panel.dataset.tabPanel);
      }
    });

    // Move tab indicator
    const indicator = document.getElementById('tabIndicator');
    const activeBtn = tabButtons.find(b => b.dataset.tab === tabName);
    const bar = document.querySelector('.tab-bar');
    if (indicator && activeBtn && bar) {
      const bRect = activeBtn.getBoundingClientRect();
      const barRect = bar.getBoundingClientRect();
      const left = bRect.left - barRect.left;
      indicator.style.width = `${bRect.width}px`;
      indicator.style.transform = `translateX(${left}px)`;
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("📑 Tab clicked:", btn.dataset.tab);
      activate(btn.dataset.tab);
    });
  });

  document.querySelectorAll("[data-nav-tab]").forEach(el => {
    el.addEventListener("click", evt => {
      evt.preventDefault();
      console.log("📑 Nav button clicked, switching to:", el.dataset.navTab);
      activate(el.dataset.navTab);
    });
  });

  const initial = tabButtons.find(btn => btn.classList.contains("is-active"))?.dataset.tab || tabButtons[0]?.dataset.tab;

  if (initial) {
    console.log("📑 Initial tab:", initial);
    activate(initial);
  }

  // Keep indicator aligned on resize
  window.addEventListener('resize', () => {
    const active = tabButtons.find(b => b.classList.contains('is-active'))?.dataset.tab;
    if (active) activate(active);
  });
}

async function start() {
  console.log("🚀 Starting game...");
  
  // Only run if user is logged in
  if (!currentUser) {
    console.log("⚠️ Cannot start game: no user logged in");
    return;
  }
  
  try {
    console.log("📥 Fetching eggs.json...");
    const res = await fetch("data/eggs.json");
    eggsData = await res.json();
    console.log("✅ Eggs data loaded:", eggsData);
  } catch (e) {
    console.error("❌ Failed to load eggs.json:", e);
    console.log("🔄 Using fallback egg data");
    eggsData = {
      "Common Egg": {
        price: 0,
        image: "assets/eggs/CommonEgg.webp",
        pets: [
          { name: "Bunny", rarity: "Common", chance: 0.4, value: 10, image: "assets/pets/BunnyPet.webp" },
          { name: "Dog", rarity: "Common", chance: 0.4, value: 12, image: "assets/pets/DogPet.webp" },
          { name: "Golden Lab", rarity: "Common", chance: 0.2, value: 8, image: "assets/pets/GoldenLabPet.webp" }
        ]
      },
      "Uncommon Egg": {
        price: 150,
        image: "assets/eggs/UncommonEgg.webp",
        pets: [
          { name: "BlackBunny", rarity: "Uncommon", chance: 0.30, value: 40, image: "assets/pets/BlackBunny.webp" },
          { name: "Chicken", rarity: "Uncommon", chance: 0.30, value: 60, image: "assets/pets/ChickenPet.webp" },
          { name: "Cat", rarity: "Uncommon", chance: 0.30, value: 90, image: "assets/pets/CatPet.webp" },
          { name: "Deer", rarity: "Uncommon", chance: 0.10, value: 300, image: "assets/pets/DeerPet.webp" }
        ]
      }
    };
  }

  console.log("⚙️ Initializing game components...");
  setupTabs();
  setCoins(coins);
  renderEggShop();
  renderInventory();
  setupInteractiveEffects();
  setupSettingsDropdown();
  console.log("✅ Game ready!");
  // Sync Settings tab state and admin panel
  if (typeof updateSettingsAccount === 'function') updateSettingsAccount();
  if (typeof setupAdminPanel === 'function') setupAdminPanel();
  // Egg info overlay removed
  
  // Hide loading screen
  setTimeout(() => {
    console.log("🎬 Hiding loading screen");
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 600);
    }
  }, 1500);
}

window.addEventListener("DOMContentLoaded", () => {
  setupLoginSystem();

  if (checkLogin()) {
    // ✅ Load saved data immediately
    loadGameData();

    // ✅ Hide login and go straight to game
    hideLoginScreen();
    start();
  } else {
    // Show login screen for new users
    const loginScreen = document.getElementById("loginScreen");
    loginScreen.style.display = "flex";

    // Hide loading screen so it doesn't block
    document.getElementById("loadingScreen").style.display = "none";
  }
  // Failsafe: if the loading screen is still visible after 5s, hide it
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    if (ls && ls.style.display !== 'none') {
      console.warn('⏱️ Loading screen timeout – hiding fallback');
      ls.style.display = 'none';
    }
  }, 5000);

  // Surface unexpected errors and unblock UI
  window.addEventListener('error', (e) => {
    console.error('Unhandled error:', e.error || e.message);
    try { toast('An error occurred. Check console.'); } catch {}
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.style.display = 'none';
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
    try { toast('A loading error occurred.'); } catch {}
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.style.display = 'none';
  });
});
