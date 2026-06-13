/* ===================================
   RunJS v2.1 - Sidebar System
   Renders sidebar DOM + navigation
   =================================== */

const Sidebar = {
  init() {
    if (!RunJS.state.user) return; // Only show for logged in users
    
    this.render();
    this.bindEvents();
    this.updateActiveLesson();
    console.log('Sidebar initialized');
  },

  // === 1. Render Sidebar HTML ===
  render() {
    const sidebar = document.getElementById('sidebar');
    const appLayout = document.getElementById('appLayout');
    
    if (!sidebar ||!appLayout) return;

    appLayout.classList.add('has-sidebar');
    sidebar.removeAttribute('hidden');
    
    sidebar.innerHTML = `
      <div class="sidebar-inner">
        ${this.renderHeader()}
        ${this.renderUserCard()}
        ${this.renderLessonNav()}
        ${this.renderQuickAccess()}
        ${this.renderDailyChallenge()}
      </div>
    `;

    if (RunJS.state.sidebarCollapsed) {
      appLayout.classList.add('collapsed');
    }
  },

  // === 2. Header ===
  renderHeader() {
    return `
      <div class="sidebar-header">
        <div class="sidebar-brand">
          Run<span>JS</span>
        </div>
        <button class="sidebar-toggle" data-sidebar-toggle aria-label="Toggle sidebar">
          [<]
        </button>
      </div>
    `;
  },

  // === 3. User Card ===
  renderUserCard() {
    const { user, level, xp, streak } = RunJS.state;
    const xpInLevel = xp % 100;
    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();

    return `
      <div class="user-card">
        <div class="user-card-top">
          <div class="user-avatar">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-level">Level ${level}</div>
          </div>
        </div>
        <div class="xp-bar">
          <div class="xp-bar-fill" style="width: ${xpInLevel}%"></div>
        </div>
        <div class="streak-badge">
          🔥 ${streak} day streak
        </div>
      </div>
    `;
  },

  // === 4. Lesson Navigator ===
  renderLessonNav() {
    const lessons = this.getLessonsData();
    const completed = RunJS.state.completedLessons || [];
    
    const lessonItems = lessons.map((lesson, i) => {
      const lessonNum = i + 1;
      const isCompleted = completed.includes(lessonNum);
      const isLocked = lessonNum > 1 &&!completed.includes(lessonNum - 1);
      const isCurrent = this.getCurrentLesson() === lessonNum;
      const isBookmarked = RunJS.state.bookmarks.includes(lessonNum);
      
      let icon = '📄';
      if (isCompleted) icon = '✓';
      else if (isLocked) icon = '🔒';
      else if (isCurrent) icon = '▶';
      if (isBookmarked) icon = '⭐';

      const classes = ['sidebar-link'];
      if (isCompleted) classes.push('completed');
      if (isLocked) classes.push('locked');
      if (isCurrent) classes.push('active');

      return `
        <a href="${isLocked? '#' : `lesson-${String(lessonNum).padStart(2,'0')}.html`}" 
           class="${classes.join(' ')}" 
           data-lesson="${lessonNum}"
           ${isLocked? 'aria-disabled="true"' : ''}>
          <span class="sidebar-link-icon">${icon}</span>
          <span>${String(lessonNum).padStart(2,'0')}. ${lesson.title}</span>
        </a>
      `;
    }).join('');

    return `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Lessons</div>
        <nav class="sidebar-nav">
          ${lessonItems}
        </nav>
      </div>
    `;
  },

  // === 5. Quick Access ===
  renderQuickAccess() {
    const allComplete = RunJS.state.completedLessons.length >= 25;
    
    return `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Quick Access</div>
        <nav class="sidebar-nav">
          <a href="playground.html" class="sidebar-link">
            <span class="sidebar-link-icon">📝</span>
            <span>Playground</span>
          </a>
          <a href="leaderboard.html" class="sidebar-link">
            <span class="sidebar-link-icon">🏆</span>
            <span>Leaderboard</span>
          </a>
          <a href="bookmarks.html" class="sidebar-link">
            <span class="sidebar-link-icon">⭐</span>
            <span>Bookmarks</span>
            ${RunJS.state.bookmarks.length > 0? `<span class="sidebar-link-badge">${RunJS.state.bookmarks.length}</span>` : ''}
          </a>
          <a href="settings.html" class="sidebar-link">
            <span class="sidebar-link-icon">⚙️</span>
            <span>Settings</span>
          </a>
          ${allComplete? `
          <a href="exam.html" class="sidebar-link">
            <span class="sidebar-link-icon">📜</span>
            <span>Final Exam</span>
          </a>` : ''}
        </nav>
      </div>
    `;
  },

  // === 6. Daily Challenge ===
  renderDailyChallenge() {
    const challenge = this.getTodaysChallenge();
    if (!challenge) return '';

    const completed = this.isChallengeCompleted();

    return `
      <div class="sidebar-section">
        <div class="sidebar-section-title">Daily Challenge</div>
        <a href="playground.html?challenge=${challenge.id}" class="sidebar-link ${completed? 'completed' : ''}">
          <span class="sidebar-link-icon">${completed? '✓' : '🎯'}</span>
          <span>${challenge.title}</span>
          ${!completed? '<span class="sidebar-link-badge">+150</span>' : ''}
        </a>
      </div>
    `;
  },

  // === 7. Event Binding ===
  bindEvents() {
    // Toggle sidebar
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-sidebar-toggle]')) {
        RunJS.toggleSidebar();
        this.updateToggleIcon();
      }
    });

    // Close mobile sidebar on outside click
    document.addEventListener('click', (e) => {
      const sidebar = document.getElementById('sidebar');
      if (window.innerWidth <= 1024 && 
          sidebar?.classList.contains('open') && 
        !sidebar.contains(e.target) &&
        !e.target.closest('[data-sidebar-toggle]')) {
        sidebar.classList.remove('open');
      }
    });

    // ESC to close mobile sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar?.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      }
    });
  },

  updateToggleIcon() {
    const toggle = document.querySelector('[data-sidebar-toggle]');
    const collapsed = document.getElementById('appLayout')?.classList.contains('collapsed');
    if (toggle) {
      toggle.textContent = collapsed? '[>]' : '[<]';
    }
  },

  // === 8. Active Lesson Highlight ===
  updateActiveLesson() {
    const current = this.getCurrentLesson();
    if (!current) return;

    document.querySelectorAll('[data-lesson]').forEach(link => {
      link.classList.remove('active');
      if (parseInt(link.dataset.lesson) === current) {
        link.classList.add('active');
        link.scrollIntoView({ block: 'nearest' });
      }
    });
  },

  getCurrentLesson() {
    const path = window.location.pathname;
    const match = path.match(/lesson-(\d+)\.html/);
    return match? parseInt(match[1]) : null;
  },

  // === 9. Data Helpers ===
  getLessonsData() {
    // Fallback data until lessons.json loads
    return [
      { title: 'Variables' }, { title: 'Functions' }, { title: 'Arrays' },
      { title: 'Objects' }, { title: 'Loops' }, { title: 'Conditionals' },
      { title: 'Scope' }, { title: 'Closures' }, { title: 'This Keyword' },
      { title: 'Prototypes' }, { title: 'Classes' }, { title: 'Async/Await' },
      { title: 'Promises' }, { title: 'Fetch API' }, { title: 'DOM Basics' },
      { title: 'Events' }, { title: 'Local Storage' }, { title: 'Error Handling' },
      { title: 'Modules' }, { title: 'Array Methods' }, { title: 'String Methods' },
      { title: 'Numbers & Math' }, { title: 'Date & Time' }, { title: 'Regex' },
      { title: 'Final Project' }
    ];
  },

  getTodaysChallenge() {
    // Placeholder - will load from data/challenges.json later
    const challenges = [
      { id: 'two-sum', title: 'Two Sum II' },
      { id: 'reverse-string', title: 'Reverse String' },
      { id: 'palindrome', title: 'Valid Palindrome' }
    ];
    const day = new Date().getDate();
    return challenges[day % challenges.length];
  },

  isChallengeCompleted() {
    const today = new Date().toDateString();
    const completed = JSON.parse(localStorage.getItem('runjs_challenges_completed') || '{}');
    return completed[today] === true;
  },

  // === 10. Public Update Methods ===
  refresh() {
    this.render();
    this.updateActiveLesson();
  }
};

// Auto-init when RunJS core is ready
if (window.RunJS) {
  Sidebar.init();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.RunJS) Sidebar.init();
  });
}

window.Sidebar = Sidebar;
