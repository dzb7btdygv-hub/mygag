// === FIREBASE INITIALIZATION ===
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

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

// === SAVE / LOAD ===
async function saveGameData() {
  if (!currentUser) return;
  try {
    await setDoc(doc(db, "users", currentUser.uid), {
      coins,
      inventory,
      lastSaved: new Date().toISOString()
    });
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
      coins = data.coins ?? 500;
      inventory = data.inventory ?? [];
      console.log("✅ Cloud data loaded:", data);
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
      console.log("✅ Logged in:", email);
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
    console.log("✅ Auth active:", user.email);
    await loadGameData();
    hideLoginScreen();
    showLoadingScreen();
    start();
  } else {
    currentUser = null;
    showLoginScreen();
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
// (Everything below remains the same from your original version)
const rarityColors = {
  Common: "#9aa0a6",
  Uncommon: "#6cc070",
  Rare: "#5ab0ff",
  Legendary: "#ffc84a",
  Mythical: "#834affff",
  Divine: "#ff6aa6", 
  Prismatic: "#c70000ff"
};

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
  const pet=weightedPick(egg.pets);
  inventory.unshift(pet);
  renderInventory();
  toast(`You hatched: ${pet.rarity} ${pet.name}!`);
  saveGameData();
}

function weightedPick(pool){
  const r=Math.random();let acc=0;
  for(const p of pool){acc+=p.chance;if(r<=acc)return p;}
  return pool[pool.length-1];
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
});
