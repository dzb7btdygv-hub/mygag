// === FIREBASE INITIALIZATION ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAddsMBY1q_v2HHlNx1HVWzy5Fvf2tSYqM",
  authDomain: "growing-66465.firebaseapp.com",
  projectId: "growing-66465",
  storageBucket: "growing-66465.appspot.com",
  messagingSenderId: "955134046533",
  appId: "1:955134046533:web:f698163f83f143d750ce2c",
  measurementId: "G-W79B45JSZ8"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === GAME STATE ===
let currentUser = null;
let coins = 500;
let coinsDisplay = coins;
let inventory = [];
let eggsData = null;
let coinAnimFrame = null;
let tabsInitialized = false;

// === ADMIN UI TOGGLE ===
function updateAdminUI() {
  const adminBox = document.getElementById("adminPanel");
  if (!adminBox) return;
  if (currentUser?.isAdmin) {
    adminBox.style.display = "block";
    console.log("🛠️ Admin privileges detected for:", currentUser.email);
  } else {
    adminBox.style.display = "none";
  }
}

// === SAVE / LOAD ===
async function saveGameData() {
  if (!currentUser) return;
  try {
    const docRef = doc(db, "users", currentUser.uid);
    const payload = {
      coins,
      inventory: inventory.map(p => ({ ...p })),
      lastSaved: new Date().toISOString(),
      isAdmin: !!currentUser.isAdmin // keep admin flag if already set
    };
    await setDoc(docRef, payload, { merge: true });
    console.log("💾 Cloud save complete for", currentUser.email);
  } catch (err) {
    console.error("❌ Error saving data:", err);
  }
}

async function loadGameData() {
  if (!currentUser) return;
  try {
    const snap = await getDoc(doc(db, "users", currentUser.uid));
    if (snap.exists()) {
      const data = snap.data();
      coins = Number.isFinite(data.coins) ? data.coins : 500;
      coinsDisplay = coins;
      inventory = Array.isArray(data.inventory) ? data.inventory.slice() : [];
      currentUser.isAdmin = data.isAdmin === true;
      console.log("✅ Cloud data loaded:", data);
      updateAdminUI();
    } else {
      console.log("ℹ️ No cloud save found; using defaults");
    }
  } catch (err) {
    console.error("❌ Failed to load data:", err);
  }
}

// Auto-save every 10s
setInterval(() => {
  if (currentUser) saveGameData();
}, 10000);
window.addEventListener("beforeunload", () => {
  if (currentUser) saveGameData();
});

// === AUTHENTICATION ===
function setupLoginSystem() {
  console.log("🔐 Setting up Firebase login system");

  const signinForm = document.getElementById("signinForm");
  const signupForm = document.getElementById("signupForm");
  const loginTabs = document.querySelectorAll(".login-tab");

  // Tabs
  loginTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.loginTab;
      loginTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("signinForm").classList.toggle("active", target === "signin");
      document.getElementById("signupForm").classList.toggle("active", target === "signup");
    });
  });

  // Sign Up
  signupForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirm = document.getElementById("signupPasswordConfirm").value;
    const errorEl = document.getElementById("signupError");

    if (password !== confirm) {
      showError(errorEl, "Passwords don't match");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      currentUser = cred.user;
      currentUser.isAdmin = false;
      console.log("✅ Registered:", email);
      await saveGameData();
      hideLoginScreen();
      showLoadingScreen();
      start();
    } catch (err) {
      console.error(err);
      showError(errorEl, err.message);
    }
  });

  // Sign In
  signinForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("signinUsername").value.trim();
    const password = document.getElementById("signinPassword").value;
    const errorEl = document.getElementById("signinError");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      currentUser = cred.user;
      await loadGameData();
      hideLoginScreen();
      showLoadingScreen();
      start();
    } catch (err) {
      console.error(err);
      showError(errorEl, err.message);
    }
  });
}

// Auth state persistence
onAuthStateChanged(auth, async user => {
  if (user) {
    currentUser = user;
    await loadGameData();
    hideLoginScreen();
    showLoadingScreen();
    start();
  } else {
    currentUser = null;
    showLoginScreen();
    updateAdminUI();
  }
});

// Logout
async function logout() {
  console.log("🔐 Logging out");
  if (currentUser) await saveGameData();
  await signOut(auth);
  currentUser = null;
  showLoginScreen();
  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) loadingScreen.style.display = "none";
  updateAdminUI();
}

// === UI HELPERS ===
function showError(el, msg) {
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 3000);
}

function hideLoginScreen() {
  const scr = document.getElementById("loginScreen");
  scr.classList.add("hidden");
  setTimeout(() => (scr.style.display = "none"), 500);
}

function showLoginScreen() {
  const scr = document.getElementById("loginScreen");
  scr.style.display = "flex";
  scr.classList.remove("hidden");
}

function showLoadingScreen() {
  const s = document.getElementById("loadingScreen");
  if (s) {
    s.style.display = "flex";
    s.classList.remove("fade-out");
  }
}

function setupTabs() {
  if (tabsInitialized) return;
  tabsInitialized = true;

  const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
  const panels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  const indicator = document.getElementById("tabIndicator");
  const bar = document.querySelector(".tab-bar");

  if (!tabButtons.length || !panels.length || !indicator || !bar) return;

  const activate = tabName => {
    tabButtons.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach(panel => {
      const isActive = panel.dataset.tabPanel === tabName;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    const activeBtn = tabButtons.find(btn => btn.dataset.tab === tabName);
    if (!activeBtn) return;
    const rect = activeBtn.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    const width = rect.width;
    const offset = rect.left - barRect.left;
    indicator.style.width = `${width}px`;
    indicator.style.transform = `translateX(${offset}px)`;
    indicator.style.opacity = "1";
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => activate(btn.dataset.tab));
  });

  document.querySelectorAll("[data-nav-tab]").forEach(trigger => {
    trigger.addEventListener("click", evt => {
      evt.preventDefault();
      activate(trigger.dataset.navTab);
    });
  });

  const initial =
    tabButtons.find(btn => btn.classList.contains("is-active"))?.dataset.tab ||
    tabButtons[0]?.dataset.tab;
  if (initial) {
    requestAnimationFrame(() => activate(initial));
  }

  window.addEventListener("resize", () => {
    const current =
      tabButtons.find(btn => btn.classList.contains("is-active"))?.dataset.tab;
    if (current) activate(current);
  });
}

// === SETTINGS DROPDOWN ===
function setupSettingsDropdown() {
  const settingsBtn = document.getElementById("settingsBtn");
  const dropdown = document.getElementById("settingsDropdown");
  const logoutBtn = document.getElementById("logoutBtn");
  const logoutBtn2 = document.getElementById("logoutBtn2");
  const nameEl = document.getElementById("settingsUsername");
  const accUser = document.getElementById("accountUser");

  if (currentUser) {
    nameEl.textContent = currentUser.email;
    accUser.textContent = currentUser.email;
  }

  updateAdminUI();

  const toggle = e => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  };
  settingsBtn.addEventListener("click", toggle);
  document.addEventListener("click", e => {
    if (!settingsBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });
  logoutBtn.addEventListener("click", logout);
  logoutBtn2.addEventListener("click", logout);
}

// === GAME LOGIC ===
const rarityColors = {
  Common: "#9aa0a6",
  Uncommon: "#6cc070",
  Rare: "#5ab0ff",
  Legendary: "#ffc84a",
  Mythical: "#834affff",
  Divine: "#ff6aa6", 
  Prismatic: "#c70000ff"
};

// (all your gameplay functions follow unchanged)


function easeOutCubic(t){return 1-Math.pow(1-t,3)}
function elCoins(){return document.getElementById("coins")}
function elEggs(){return document.getElementById("eggs")}
function elInv(){return document.getElementById("inventory")}
function elToast(){return document.getElementById("toast")}

function setCoins(v){
  const target=Math.max(0,Math.floor(v));
  const start=coinsDisplay;
  const diff=target-start;
  coins=target;
  if(coinAnimFrame)cancelAnimationFrame(coinAnimFrame);
  if(diff===0){
    coinsDisplay=target;
    elCoins().textContent=coinsDisplay.toLocaleString();
    return;
  }
  const dur=520;
  const startT=performance.now();
  function step(now){
    const prog=Math.min((now-startT)/dur,1);
    const eased=easeOutCubic(prog);
    coinsDisplay=Math.round(start+diff*eased);
    elCoins().textContent=coinsDisplay.toLocaleString();
    if(prog<1){coinAnimFrame=requestAnimationFrame(step);}
  }
  coinAnimFrame=requestAnimationFrame(step);
}

function toast(msg){
  const t=elToast();
  t.textContent=msg;
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2000);
}

function renderInventory(){
  const wrap=elInv();
  if(inventory.length===0){
    wrap.innerHTML=`<div class="inv-row inv-row--empty">You haven't hatched any pets yet.</div>`;
    return;
  }
  wrap.innerHTML="";
  inventory.forEach((pet,i)=>{
    const row=document.createElement("div");
    row.className="inv-row";
    const rcol=rarityColors[pet.rarity];
    if(rcol){
      row.style.borderColor=rcol;
      row.style.background=`${rcol}30`;
    }
    row.innerHTML=`
      <div class="inv-item">
        <img src="${pet.image}" alt="${pet.name}">
        <div class="inv-details">
          <div><strong>${pet.name}</strong> <span class="rarity">(${pet.rarity})</span></div>
          <div class="value">Value: ${pet.value}</div>
        </div>
      </div>
      <div class="inv-actions">
        <button class="btn btn-sm" data-sell="${i}">Sell</button>
      </div>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll("button[data-sell]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const idx=parseInt(btn.dataset.sell,10);
      const pet=inventory[idx];
      if(!pet)return;
      inventory.splice(idx,1);
      setCoins(coins+pet.value);
      renderInventory();
      toast(`Sold ${pet.name} for ${pet.value} coins`);
      saveGameData();
    });
  });
}

async function openEgg(eggName){
  const egg=eggsData[eggName];
  if(!egg)return;
  if(egg.price>coins){toast("Not enough coins");return;}
  setCoins(coins-egg.price);
  const pet=await animateCaseOpening(egg);
  inventory.unshift({ ...pet });
  renderInventory();
  toast(`You hatched: ${pet.rarity} ${pet.name}!`);
  await saveGameData();
}

function weightedPick(pool){
  const r=Math.random();let acc=0;
  for(const p of pool){acc+=p.chance;if(r<=acc)return p;}
  return pool[pool.length-1];
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function pickTextColor(hex) {
  if (!hex) return "#ffffff";
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const f = v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const L = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  return L > 0.6 ? "#0b0015" : "#ffffff";
}

function formatChance(c) {
  if (c == null || isNaN(c)) return "-";
  const pct = c * 100;
  if (pct >= 1) return pct.toFixed(2);
  if (pct >= 0.1) return pct.toFixed(3);
  return pct.toFixed(4);
}

function showOverlay() {
  const overlay = document.getElementById("caseOpening");
  const btn = document.getElementById("closeCase");
  const resultEl = document.getElementById("caseResult");
  const strip = document.getElementById("caseStrip");

  if (!overlay) return;
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
}

function hideOverlay() {
  const overlay = document.getElementById("caseOpening");
  if (!overlay) return;
  overlay.classList.remove("is-active");
  overlay.setAttribute("aria-hidden", "true");
}

async function animateCaseOpening(egg) {
  const overlay = document.getElementById("caseOpening");
  const strip = document.getElementById("caseStrip");
  const track = document.getElementById("caseTrack");
  const closeBtn = document.getElementById("closeCase");
  const resultEl = document.getElementById("caseResult");

  if (!overlay || !strip || !track || !closeBtn) {
    return weightedPick(egg.pets);
  }

  showOverlay();
  strip.innerHTML = "";
  strip.style.transition = "none";
  strip.style.transform = "translateX(0px)";

  const resultPet = weightedPick(egg.pets);
  const repeated = [];
  const leadCycles = 32;
  for (let i = 0; i < leadCycles; i++) repeated.push(...egg.pets);
  const resultIndex = repeated.length;
  repeated.push(resultPet);
  const tailCycles = 12;
  for (let i = 0; i < tailCycles; i++) repeated.push(...egg.pets);

  repeated.forEach(p => {
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
    label.style.webkitTextStroke = "1px #000";
    label.style.textShadow = "0 1px 2px #000, 1px 0 2px #000, 0 -1px 2px #000, -1px 0 2px #000";

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
    const a = firstCell.getBoundingClientRect();
    const b = strip.children[1]?.getBoundingClientRect();
    cellWidth = b ? b.left - a.left : a.width;
  }
  if (!cellWidth) cellWidth = 134;

  const targetOffset = padLeft + resultIndex * cellWidth + cellWidth / 2 - pointerOffset;
  const distance = Math.max(targetOffset, 0);
  const duration = 4300;

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
      resolve();
    };
    const fallback = setTimeout(cleanup, duration + 120);
    strip.addEventListener(
      "transitionend",
      () => {
        clearTimeout(fallback);
        cleanup();
      },
      { once: true }
    );
    requestAnimationFrame(() => {
      void strip.offsetWidth;
      strip.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.86, 0.32, 1)`;
      strip.style.transform = `translateX(${-distance}px)`;
    });
  });

  const winningCard = strip.children[resultIndex];
  if (winningCard) winningCard.classList.add("is-winning");

  if (resultEl) {
    const color = rarityColors[resultPet.rarity] || "#fff";
    resultEl.innerHTML = `<span style="color:${color}; text-shadow:0 0 12px ${color}66;">You got: ${resultPet.rarity} ${resultPet.name}</span>`;
  }

  await new Promise(resolve => {
    closeBtn.disabled = false;
    closeBtn.onclick = () => resolve();
  });

  hideOverlay();
  return resultPet;
}

function showEggInfo(eggName) {
  const egg = eggsData?.[eggName];
  const ov = document.getElementById("eggInfoOverlay");
  const list = document.getElementById("eggInfoList");
  const nameEl = document.getElementById("eggInfoName");
  const imgEl = document.getElementById("eggInfoImage");
  if (!egg || !ov || !list || !nameEl || !imgEl) return;

  nameEl.textContent = eggName;
  imgEl.src = egg.image;
  imgEl.alt = eggName;
  list.innerHTML = "";
  egg.pets.forEach(p => {
    const rcolor = rarityColors[p.rarity] || "#fff";
    const row = document.createElement("div");
    row.className = "egginfo-row";
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
  ov.classList.add("is-active");
  ov.setAttribute("aria-hidden", "false");
  const closeBtn = document.getElementById("eggInfoClose");
  const close = () => {
    ov.classList.remove("is-active");
    ov.setAttribute("aria-hidden", "true");
  };
  if (closeBtn) closeBtn.onclick = close;
  ov.onclick = e => {
    if (!e.target.closest(".egginfo-dialog")) close();
  };
}

async function start(){
  if(!currentUser)return;
  try{
    const res=await fetch("data/eggs.json");
    eggsData=await res.json();
  }catch{
    eggsData={"Common Egg":{price:0,image:"assets/eggs/CommonEgg.webp",pets:[
      {name:"Bunny",rarity:"Common",chance:0.4,value:10,image:"assets/pets/BunnyPet.webp"},
      {name:"Dog",rarity:"Common",chance:0.4,value:12,image:"assets/pets/DogPet.webp"},
      {name:"Golden Lab",rarity:"Common",chance:0.2,value:8,image:"assets/pets/GoldenLabPet.webp"}
    ]}};
  }
  setCoins(coins);
  renderInventory();
  renderEggShop();
  setupSettingsDropdown();
  setupTabs();
  const loading=document.getElementById("loadingScreen");
  setTimeout(()=>{loading.classList.add("fade-out");setTimeout(()=>loading.style.display="none",600)},1500);
}

function renderEggShop(){
  const wrap=elEggs();
  wrap.innerHTML="";
  Object.entries(eggsData).forEach(([name,egg])=>{
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`
      <img src="${egg.image}" alt="${name}">
      <div><strong>${name}</strong></div>
      <div class="price">${egg.price===0?"Free":egg.price+" coins"}</div>
      <button class="btn" data-egg="${name}">Open Egg</button>`;
    wrap.appendChild(card);
    card.querySelector("button").addEventListener("click",()=>openEgg(name));
  });
}

// === STARTUP ===
window.addEventListener("DOMContentLoaded",()=>{
  setupLoginSystem();
  setupTabs();
});
