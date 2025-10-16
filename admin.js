// Admin system for Grow a Garden RNG
// Admin credentials
const ADMIN_USERNAME = "JaydenAdmin";
const ADMIN_PASSWORD = "1234";

// Check if current user is admin
function isAdmin() {
  return currentUser === ADMIN_USERNAME;
}

// Check if user is banned
function isUserBanned(username) {
  const bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '{}');
  return bannedUsers.hasOwnProperty(username);
}

// Get ban info
function getBanInfo(username) {
  const bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '{}');
  return bannedUsers[username] || null;
}

// Ban a user
function banUser(username, reason = '') {
  if (username === ADMIN_USERNAME) {
    toast("Cannot ban admin account!");
    return false;
  }
  
  const bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '{}');
  bannedUsers[username] = {
    reason: reason,
    bannedAt: new Date().toISOString(),
    bannedBy: currentUser
  };
  localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
  console.log("🚫 User banned:", username);
  return true;
}

// Unban a user
function unbanUser(username) {
  const bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '{}');
  delete bannedUsers[username];
  localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
  console.log("✅ User unbanned:", username);
}

// Get all registered users
function getAllUsers() {
  const users = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('user_')) {
      const username = key.replace('user_', '');
      users.push(username);
    }
  }
  return users.sort();
}

// Get user's game data
function getUserGameData(username) {
  const saveData = localStorage.getItem(`gameData_${username}`);
  if (saveData) {
    try {
      return JSON.parse(saveData);
    } catch (e) {
      console.error("Failed to parse user data:", e);
      return null;
    }
  }
  return null;
}

// Set user's game data
function setUserGameData(username, data) {
  localStorage.setItem(`gameData_${username}`, JSON.stringify(data));
  console.log("💾 Admin modified data for:", username);
}

// Get user's luck multiplier
function getUserLuckMultiplier(username) {
  const data = getUserGameData(username);
  return data?.luckMultiplier || 1.0;
}

// Set user's luck multiplier
function setUserLuckMultiplier(username, multiplier) {
  let data = getUserGameData(username);
  if (!data) {
    data = { coins: 500, inventory: [], luckMultiplier: multiplier };
  } else {
    data.luckMultiplier = multiplier;
  }
  setUserGameData(username, data);
  
  // If modifying current user, update live
  if (username === currentUser) {
    window.luckMultiplier = multiplier;
  }
}

// Add coins to user
function addUserCoins(username, amount) {
  let data = getUserGameData(username);
  if (!data) {
    data = { coins: 500 + amount, inventory: [] };
  } else {
    data.coins = (data.coins || 500) + amount;
  }
  setUserGameData(username, data);
  
  // If modifying current user, update live
  if (username === currentUser) {
    setCoins(data.coins);
  }
}

// Set user coins
function setUserCoins(username, amount) {
  let data = getUserGameData(username);
  if (!data) {
    data = { coins: amount, inventory: [] };
  } else {
    data.coins = amount;
  }
  setUserGameData(username, data);
  
  // If modifying current user, update live
  if (username === currentUser) {
    setCoins(amount);
  }
}

// Give pet to user
function givePetToUser(username, pet) {
  let data = getUserGameData(username);
  if (!data) {
    data = { coins: 500, inventory: [pet] };
  } else {
    if (!data.inventory) data.inventory = [];
    data.inventory.unshift(pet);
  }
  setUserGameData(username, data);
  
  // If modifying current user, update live
  if (username === currentUser) {
    inventory.unshift(pet);
    renderInventory();
  }
}

// Get all available pets from eggs data
function getAllAvailablePets() {
  const pets = [];
  if (eggsData) {
    Object.values(eggsData).forEach(egg => {
      if (egg.pets) {
        egg.pets.forEach(pet => {
          // Avoid duplicates
          if (!pets.find(p => p.name === pet.name)) {
            pets.push(pet);
          }
        });
      }
    });
  }
  return pets;
}

// Setup admin panel
function setupAdminPanel() {
  if (!isAdmin()) return;
  
  console.log("👑 Setting up admin panel");
  
  // Show admin button in settings
  const adminBtn = document.getElementById('adminPanelBtn');
  if (adminBtn) {
    adminBtn.style.display = 'flex';
    adminBtn.addEventListener('click', openAdminPanel);
  }
  
  // Setup admin panel tabs
  const adminTabs = document.querySelectorAll('.admin-tab');
  adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.adminTab;
      
      // Update tabs
      adminTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update content
      document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.querySelector(`[data-admin-content="${targetTab}"]`).classList.add('active');
    });
  });
  
  // Close button
  document.getElementById('adminCloseBtn').addEventListener('click', closeAdminPanel);
  
  // Money actions
  document.getElementById('adminAddMoney').addEventListener('click', () => {
    const user = document.getElementById('adminMoneyUser').value;
    const amount = parseInt(document.getElementById('adminMoneyAmount').value);
    
    if (!user || isNaN(amount)) {
      toast("Please fill in all fields");
      return;
    }
    
    addUserCoins(user, amount);
    toast(`Added ${amount} coins to ${user}`);
    document.getElementById('adminMoneyAmount').value = '';
  });
  
  document.getElementById('adminSetMoney').addEventListener('click', () => {
    const user = document.getElementById('adminMoneyUser').value;
    const amount = parseInt(document.getElementById('adminMoneyAmount').value);
    
    if (!user || isNaN(amount)) {
      toast("Please fill in all fields");
      return;
    }
    
    setUserCoins(user, amount);
    toast(`Set ${user}'s coins to ${amount}`);
    document.getElementById('adminMoneyAmount').value = '';
  });
  
  // Luck actions
  document.getElementById('adminSetLuck').addEventListener('click', () => {
    const user = document.getElementById('adminLuckUser').value;
    const multiplier = parseFloat(document.getElementById('adminLuckMultiplier').value);
    
    if (!user || isNaN(multiplier) || multiplier < 1) {
      toast("Please enter a valid multiplier (minimum 1.0)");
      return;
    }
    
    setUserLuckMultiplier(user, multiplier);
    toast(`Set ${user}'s luck multiplier to ${multiplier}x`);
    updateLuckDisplay();
  });
  
  document.getElementById('adminResetLuck').addEventListener('click', () => {
    const user = document.getElementById('adminLuckUser').value;
    
    if (!user) {
      toast("Please select a user");
      return;
    }
    
    setUserLuckMultiplier(user, 1.0);
    toast(`Reset ${user}'s luck multiplier to 1.0x`);
    document.getElementById('adminLuckMultiplier').value = '';
    updateLuckDisplay();
  });
  
  // Update luck display when user changes
  document.getElementById('adminLuckUser').addEventListener('change', updateLuckDisplay);
  
  // Pet actions
  document.getElementById('adminGivePet').addEventListener('click', () => {
    const user = document.getElementById('adminPetUser').value;
    const petSelect = document.getElementById('adminPetSelect');
    const petIndex = petSelect.value;
    
    if (!user || petIndex === '') {
      toast("Please select a user and pet");
      return;
    }
    
    const pets = getAllAvailablePets();
    const pet = pets[petIndex];
    
    if (!pet) {
      toast("Invalid pet selected");
      return;
    }
    
    givePetToUser(user, pet);
    toast(`Gave ${pet.name} to ${user}`);
  });
  
  // Ban actions
  document.getElementById('adminBanUserBtn').addEventListener('click', () => {
    const user = document.getElementById('adminBanUser').value;
    const reason = document.getElementById('adminBanReason').value.trim();
    
    if (!user) {
      toast("Please select a user");
      return;
    }
    
    if (confirm(`Are you sure you want to ban ${user}?`)) {
      if (banUser(user, reason)) {
        toast(`Banned ${user}`);
        document.getElementById('adminBanReason').value = '';
        refreshBannedList();
        populateAdminDropdowns();
      }
    }
  });
}

function updateLuckDisplay() {
  const user = document.getElementById('adminLuckUser').value;
  if (user) {
    const multiplier = getUserLuckMultiplier(user);
    document.getElementById('currentLuckDisplay').textContent = `${multiplier.toFixed(1)}x`;
  }
}

function openAdminPanel() {
  console.log("👑 Opening admin panel");
  
  populateAdminDropdowns();
  refreshBannedList();
  
  const panel = document.getElementById('adminPanel');
  panel.style.display = 'flex';
  
  // Close settings dropdown
  document.getElementById('settingsDropdown').classList.remove('show');
}

function closeAdminPanel() {
  document.getElementById('adminPanel').style.display = 'none';
}

function populateAdminDropdowns() {
  const users = getAllUsers().filter(u => !isUserBanned(u));
  
  // Money dropdown
  const moneySelect = document.getElementById('adminMoneyUser');
  moneySelect.innerHTML = users.map(u => `<option value="${u}">${u}</option>`).join('');
  
  // Luck dropdown
  const luckSelect = document.getElementById('adminLuckUser');
  luckSelect.innerHTML = users.map(u => `<option value="${u}">${u}</option>`).join('');
  updateLuckDisplay();
  
  // Pet dropdown
  const petUserSelect = document.getElementById('adminPetUser');
  petUserSelect.innerHTML = users.map(u => `<option value="${u}">${u}</option>`).join('');
  
  // Pet selection dropdown
  const petSelect = document.getElementById('adminPetSelect');
  const pets = getAllAvailablePets();
  petSelect.innerHTML = pets.map((pet, i) => 
    `<option value="${i}">${pet.name} (${pet.rarity})</option>`
  ).join('');
  
  // Ban dropdown (all users except admin and already banned)
  const banSelect = document.getElementById('adminBanUser');
  const bannableUsers = getAllUsers().filter(u => u !== ADMIN_USERNAME && !isUserBanned(u));
  banSelect.innerHTML = bannableUsers.map(u => `<option value="${u}">${u}</option>`).join('');
}

function refreshBannedList() {
  const bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '{}');
  const bannedList = document.getElementById('bannedUsersList');
  
  if (Object.keys(bannedUsers).length === 0) {
    bannedList.innerHTML = '<div class="banned-empty">No banned users</div>';
    return;
  }
  
  bannedList.innerHTML = Object.entries(bannedUsers).map(([username, info]) => `
    <div class="banned-item">
      <div class="banned-info">
        <strong>${username}</strong>
        ${info.reason ? `<div class="banned-reason">Reason: ${info.reason}</div>` : ''}
        <div class="banned-date">Banned: ${new Date(info.bannedAt).toLocaleDateString()}</div>
      </div>
      <button class="btn btn-sm unban-btn" onclick="unbanUserAndRefresh('${username}')">Unban</button>
    </div>
  `).join('');
}

function unbanUserAndRefresh(username) {
  if (confirm(`Unban ${username}?`)) {
    unbanUser(username);
    toast(`Unbanned ${username}`);
    refreshBannedList();
    populateAdminDropdowns();
  }
}

// Initialize admin features when document loads
window.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for game.js to set up currentUser
  setTimeout(() => {
    if (isAdmin()) {
      setupAdminPanel();
    }
  }, 100);
});

// Export functions to window for use in other files
window.isUserBanned = isUserBanned;
window.getBanInfo = getBanInfo;
window.isAdmin = isAdmin;
window.unbanUserAndRefresh = unbanUserAndRefresh;
window.luckMultiplier = 1.0; // Default luck multiplier