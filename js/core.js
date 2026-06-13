/* ===================================
   RunJS v2.1 - Core System
   Theme • Auth • Toasts • State
   =================================== */

// === 1. Global State ===
const RunJS = {
  state: {
    theme: 'dark',
    user: null,
    xp: 0,
    level: 1,
    streak: 0,
    lastLogin: null,
    sidebarCollapsed: false,
    completedLessons: [],
    bookmarks: [],
    settings: {
      editorTheme: 'vs-dark',
      fontSize: 14,
      keybinds: 'default'
    }
  },

  init() {
    this.loadState();
    this.initTheme();
    this.initAuth();
    this.initToasts();
    this.initSidebar();
    this.updateStreak();
    console.log('⚡ RunJS Core initialized');
  },

  // === 2. State Management ===
  loadState() {
    const saved = localStorage.getItem('runjs_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = {...this.state,...parsed };
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    }
  },

  saveState() {
    localStorage.setItem('runjs_state', JSON.stringify(this.state));
  },

  updateState(key, value) {
    this.state[key] = value;
    this.saveState();
  },

  addXP(amount) {
    this.state.xp += amount;
    this.state.level = Math.floor(this.state.xp / 100) + 1;
    this.saveState();
    this.updateUserUI();
    this.toast(`+${amount} XP earned!`, 'success');
  },

  // === 3. Theme System ===
  initTheme() {
    const savedTheme = this.state.theme || 'dark';
    this.setTheme(savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const newTheme = this.state.theme === 'dark'? 'light' : 'dark';
        this.setTheme(newTheme);
      });
    }
  },

  setTheme(theme) {
    this.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.saveState();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark'? '🌙' : '☀️';
      themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark'? 'light' : 'dark'} mode`);
    }
  },

  // === 4. Auth + Guest Mode ===
  initAuth() {
    const guestBtn = document.getElementById('guestBtn');
    const loginBtn = document.getElementById('loginBtn');
    const startBtn = document.getElementById('startLearningBtn');

    if (guestBtn) {
      guestBtn.addEventListener('click', () => this.loginAsGuest());
    }

    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        if (!this.state.user) {
          e.preventDefault();
          this.loginAsGuest();
        }
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
      });
    }

    this.updateUserUI();
  },

  loginAsGuest() {
    this.state.user = {
      id: 'guest',
      name: 'Guest',
      email: null,
      isGuest: true
    };
    this.saveState();
    this.toast('Welcome! Progress will be saved locally.', 'success');
    setTimeout(() => {
      window.location.href = 'lessons.html';
    }, 500);
  },

  updateUserUI() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    if (this.state.user) {
      // Update nav to show user state if needed
      const userLevel = document.querySelector('.user-level');
      const userName = document.querySelector('.user-name');
      const xpBarFill = document.querySelector('.xp-bar-fill');
      
      if (userName) userName.textContent = this.state.user.name;
      if (userLevel) userLevel.textContent = `Level ${this.state.level}`;
      if (xpBarFill) {
        const xpInLevel = this.state.xp % 100;
        xpBarFill.style.width = `${xpInLevel}%`;
      }
    }
  },

  // === 5. Streak System ===
  updateStreak() {
    const today = new Date().toDateString();
    const lastLogin = this.state.lastLogin;

    if (!lastLogin) {
      this.state.streak = 1;
      this.state.lastLogin = today;
    } else if (lastLogin!== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastLogin === yesterday.toDateString()) {
        this.state.streak += 1;
        this.addXP(10);
        this.toast(`🔥 ${this.state.streak} day streak! +10 XP`, 'warning');
      } else {
        if (this.state.streak > 0) {
          this.toast('Streak reset. Start a new one today!', 'warning');
        }
        this.state.streak = 1;
      }
      this.state.lastLogin = today;
    }
    
    this.saveState();
  },

  // === 6. Sidebar ===
  initSidebar() {
    const appLayout = document.getElementById('appLayout');
    if (appLayout && this.state.sidebarCollapsed) {
      appLayout.classList.add('collapsed');
    }

    // Mobile sidebar toggle
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-sidebar-toggle]')) {
        this.toggleSidebar();
      }
    });
  },

  toggleSidebar() {
    const appLayout = document.getElementById('appLayout');
    const sidebar = document.getElementById('sidebar');
    
    if (window.innerWidth <= 1024) {
      sidebar?.classList.toggle('open');
    } else {
      appLayout?.classList.toggle('collapsed');
      this.state.sidebarCollapsed = appLayout?.classList.contains('collapsed');
      this.saveState();
    }
  },

  // === 7. Toast System ===
  initToasts() {
    if (!document.getElementById('toastContainer')) {
      const container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  },

  toast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // === 8. Utilities ===
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// === 9. Auto-init on DOM ready ===
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => RunJS.init());
} else {
  RunJS.init();
}

// Export for other modules
window.RunJS = RunJS;
