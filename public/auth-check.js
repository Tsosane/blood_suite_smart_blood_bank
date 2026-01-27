// Authentication Check Script
// This script should be included in all protected pages

function checkAuthentication() {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  const userRole = localStorage.getItem('userRole');
  
  // If no authentication data, redirect to login
  if (!token || !user || !userRole) {
    window.location.href = '/login.html';
    return false;
  }
  
  // Parse user data
  try {
    const userData = JSON.parse(user);
    return {
      token: token,
      user: userData,
      role: userRole
    };
  } catch (error) {
    // Invalid user data, redirect to login
    localStorage.clear();
    window.location.href = '/login.html';
    return false;
  }
}

function logout() {
  localStorage.clear();
  window.location.href = '/login.html';
}

function getCurrentUser() {
  const auth = checkAuthentication();
  return auth ? auth.user : null;
}

function getCurrentUserRole() {
  const auth = checkAuthentication();
  return auth ? auth.role : null;
}

function requireRole(requiredRole) {
  const auth = checkAuthentication();
  if (!auth) return false;
  
  // Check if user has required role
  if (requiredRole && auth.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    const redirects = {
      admin: '/web-app.html',
      hospital: '/web-app.html',
      bloodbank: '/web-app.html',
      donor: '/donor-mobile.html'
    };
    
    const targetUrl = redirects[auth.role] || '/web-app.html';
    window.location.href = targetUrl;
    return false;
  }
  
  return true;
}

// Auto-logout on token expiry (30 minutes for demo)
function setupAutoLogout() {
  const loginTime = localStorage.getItem('loginTime');
  if (loginTime) {
    const elapsed = Date.now() - parseInt(loginTime);
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    if (elapsed > maxAge) {
      logout();
    } else {
      // Set timeout for remaining time
      setTimeout(logout, maxAge - elapsed);
    }
  }
}

// Initialize authentication check
document.addEventListener('DOMContentLoaded', function() {
  const auth = checkAuthentication();
  if (auth) {
    // Store login time if not already stored
    if (!localStorage.getItem('loginTime')) {
      localStorage.setItem('loginTime', Date.now().toString());
    }
    
    setupAutoLogout();
    
    // Display user info in UI if elements exist
    const userNameElement = document.getElementById('user-name');
    const userRoleElement = document.getElementById('user-role');
    const userAvatarElement = document.getElementById('user-avatar');
    
    if (userNameElement && auth.user) {
      userNameElement.textContent = auth.user.name || auth.user.email;
    }
    
    if (userRoleElement) {
      const roleNames = {
        admin: 'Administrator',
        hospital: 'Hospital Staff',
        bloodbank: 'Blood Bank Staff',
        donor: 'Donor'
      };
      userRoleElement.textContent = roleNames[auth.role] || auth.role;
    }
    
    if (userAvatarElement && auth.user) {
      const initials = (auth.user.name || auth.user.email || 'U').substring(0, 2).toUpperCase();
      userAvatarElement.textContent = initials;
    }
  }
});
