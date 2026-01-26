const API_BASE = '/api';
let currentUser = null;
let authToken = localStorage.getItem('bloodsuite_token');

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadDashboardData();
  loadBloodTypeData();
});

function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(`page-${pageName}`).classList.add('active');

  if (pageName === 'dashboard') {
    loadDashboardData();
  } else if (pageName === 'inventory') {
    loadInventoryData();
  } else if (pageName === 'home') {
    loadBloodTypeData();
  }
}

async function checkAuth() {
  if (authToken) {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        currentUser = await response.json();
        updateNavForLoggedIn();
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  }
}

function updateNavForLoggedIn() {
  const navAuth = document.getElementById('nav-auth');
  navAuth.innerHTML = `
    <span class="user-name">Welcome, ${currentUser.first_name}</span>
    <button onclick="logout()" class="btn btn-outline">Logout</button>
  `;
}

function logout() {
  localStorage.removeItem('bloodsuite_token');
  authToken = null;
  currentUser = null;
  location.reload();
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('bloodsuite_token', authToken);
      showToast('Login successful!', 'success');
      updateNavForLoggedIn();
      showPage('dashboard');
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    showToast('Login failed. Please try again.', 'error');
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const formData = {
    firstName: document.getElementById('reg-firstname').value,
    lastName: document.getElementById('reg-lastname').value,
    email: document.getElementById('reg-email').value,
    phone: document.getElementById('reg-phone').value,
    password: document.getElementById('reg-password').value,
    bloodType: document.getElementById('reg-bloodtype').value,
    district: document.getElementById('reg-district').value,
    role: 'donor'
  };

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('bloodsuite_token', authToken);
      showToast('Registration successful! Welcome to Blood Suite.', 'success');
      updateNavForLoggedIn();
      showPage('dashboard');
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    showToast('Registration failed. Please try again.', 'error');
  }
}

async function loadDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });

    if (response.ok) {
      const data = await response.json();
      
      document.getElementById('stat-donors').textContent = data.stats.totalDonors;
      document.getElementById('stat-hospitals').textContent = data.stats.totalHospitals;
      document.getElementById('stat-units').textContent = data.stats.availableUnits;
      document.getElementById('stat-urgent').textContent = data.stats.urgentRequests;

      document.getElementById('dash-donors').textContent = data.stats.totalDonors;
      document.getElementById('dash-units').textContent = data.stats.availableUnits;
      document.getElementById('dash-pending').textContent = data.stats.pendingRequests;
      document.getElementById('dash-urgent').textContent = data.stats.urgentRequests;
      document.getElementById('dash-expiring').textContent = data.stats.expiringUnits;
      document.getElementById('dash-donations').textContent = data.stats.recentDonations;

      renderBloodChart(data.bloodTypeStock);
    }
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}

async function loadBloodTypeData() {
  try {
    const response = await fetch(`${API_BASE}/inventory/summary`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });

    if (response.ok) {
      const data = await response.json();
      renderBloodTypeGrid(data.byBloodType);
    }
  } catch (error) {
    console.error('Failed to load blood type data:', error);
    renderBloodTypeGrid([]);
  }
}

function renderBloodTypeGrid(bloodTypes) {
  const grid = document.getElementById('blood-type-grid');
  const types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  const typeData = {};
  bloodTypes.forEach(bt => {
    typeData[bt.blood_type] = bt.available || 0;
  });

  grid.innerHTML = types.map(type => {
    const count = typeData[type] || 0;
    const statusClass = count < 5 ? 'low' : 'ok';
    return `
      <div class="blood-card">
        <div class="blood-type">${type}</div>
        <div class="blood-count ${statusClass}">${count} units</div>
      </div>
    `;
  }).join('');
}

function renderBloodChart(bloodTypeStock) {
  const chart = document.getElementById('blood-chart');
  const types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  const typeData = {};
  let maxValue = 10;
  bloodTypeStock.forEach(bt => {
    typeData[bt.blood_type] = parseInt(bt.available) || 0;
    if (typeData[bt.blood_type] > maxValue) maxValue = typeData[bt.blood_type];
  });

  chart.innerHTML = types.map(type => {
    const count = typeData[type] || 0;
    const height = maxValue > 0 ? (count / maxValue) * 100 : 0;
    return `
      <div class="chart-bar">
        <div class="bar-container">
          <div class="bar-fill" style="height: ${height}%"></div>
        </div>
        <div class="bar-label">${type}</div>
        <div class="bar-value">${count}</div>
      </div>
    `;
  }).join('');
}

async function loadInventoryData() {
  try {
    const response = await fetch(`${API_BASE}/inventory/summary`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });

    if (response.ok) {
      const data = await response.json();
      renderInventoryTable(data.byBloodType);
    }
  } catch (error) {
    console.error('Failed to load inventory:', error);
  }
}

function renderInventoryTable(inventory) {
  const tbody = document.getElementById('inventory-tbody');
  const types = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  const typeData = {};
  inventory.forEach(item => {
    typeData[item.blood_type] = item;
  });

  tbody.innerHTML = types.map(type => {
    const data = typeData[type] || { available: 0, reserved: 0, expiring_soon: 0 };
    return `
      <tr>
        <td><strong>${type}</strong></td>
        <td>${data.available || 0}</td>
        <td>${data.reserved || 0}</td>
        <td style="color: ${data.expiring_soon > 0 ? 'var(--warning)' : 'inherit'}">${data.expiring_soon || 0}</td>
      </tr>
    `;
  }).join('');
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

function filterRequests() {
  const filter = document.getElementById('request-filter').value;
  console.log('Filtering requests by:', filter);
}

function filterDonors() {
  const filter = document.getElementById('blood-type-filter').value;
  console.log('Filtering donors by:', filter);
}
