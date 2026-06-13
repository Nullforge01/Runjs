if (RunJS.state.completedLessons.length === 12) {
  const examCard = document.createElement('div');
  examCard.className = 'lesson-card exam-card';
  examCard.innerHTML = `
    <h3>🎓 Final Exam</h3>
    <p>Test your knowledge across all 12 lessons</p>
    <p>50 questions · Certificate on completion</p>
    <a href="/final-exam.html" class="btn btn-primary">Start Exam →</a>
  `;
  document.getElementById('lessonsGrid').appendChild(examCard);
}

/* ===================================
   RunJS v2.1 - Lessons System
   Grid rendering • Filters • Progress
   =================================== */

const Lessons = {
  data: [],
  filteredData: [],
  activeFilter: 'all',

  async init() {
    await this.loadLessonsData();
    this.renderGrid();
    this.bindEvents();
    this.updateProgress();
    console.log('Lessons system initialized');
  },

  // === 1. Load Lesson Data ===
  async loadLessonsData() {
    try {
      const res = await fetch('data/lessons.json');
      if (res.ok) {
        this.data = await res.json();
      } else {
        throw new Error('Fetch failed');
      }
    } catch (e) {
      // Fallback data if JSON missing
      this.data = this.getFallbackLessons();
    }
    this.filteredData = [...this.data];
  },

  getFallbackLessons() {
    return [
      { id: 1, title: 'Variables & Data Types', desc: 'Learn let, const, strings, numbers, booleans', tag: 'fundamentals', difficulty: 'easy', xp: 25 },
      { id: 2, title: 'Functions', desc: 'Declare functions, parameters, return values, arrow functions', tag: 'fundamentals', difficulty: 'easy', xp: 25 },
      { id: 3, title: 'Arrays', desc: 'Create, access, and manipulate arrays with methods', tag: 'arrays', difficulty: 'easy', xp: 30 },
      { id: 4, title: 'Objects', desc: 'Key-value pairs, methods, dot vs bracket notation', tag: 'fundamentals', difficulty: 'easy', xp: 30 },
      { id: 5, title: 'Loops', desc: 'For, while, for...of, for...in iterations', tag: 'fundamentals', difficulty: 'easy', xp: 25 },
      { id: 6, title: 'Conditionals', desc: 'If/else, ternary, switch statements', tag: 'fundamentals', difficulty: 'easy', xp: 25 },
      { id: 7, title: 'Scope', desc: 'Global, function, block scope and hoisting', tag: 'fundamentals', difficulty: 'medium', xp: 35 },
      { id: 8, title: 'Closures', desc: 'Functions that remember their outer scope', tag: 'fundamentals', difficulty: 'medium', xp: 40 },
      { id: 9, title: 'This Keyword', desc: 'Context binding, call, apply, bind methods', tag: 'fundamentals', difficulty: 'medium', xp: 40 },
      { id: 10, title: 'Prototypes', desc: 'Prototype chain, inheritance, __proto__', tag: 'fundamentals', difficulty: 'hard', xp: 45 },
      { id: 11, title: 'Classes', desc: 'ES6 classes, constructors, extends, super', tag: 'fundamentals', difficulty: 'medium', xp: 35 },
      { id: 12, title: 'Async/Await', desc: 'Write asynchronous code that looks synchronous', tag: 'async', difficulty: 'medium', xp: 40 },
      { id: 13, title: 'Promises', desc: 'Handle async operations with .then and .catch', tag: 'async', difficulty: 'medium', xp: 40 },
      { id: 14, title: 'Fetch API', desc: 'Make HTTP requests to APIs', tag: 'async', difficulty: 'medium', xp: 35 },
      { id: 15, title: 'DOM Basics', desc: 'Select and modify HTML elements with JS', tag: 'dom', difficulty: 'easy', xp: 30 },
      { id: 16, title: 'Events', desc: 'Handle clicks, forms, keyboard events', tag: 'dom', difficulty: 'easy', xp: 30 },
      { id: 17, title: 'Local Storage', desc: 'Persist data in the browser', tag: 'dom', difficulty: 'easy', xp: 25 },
      { id: 18, title: 'Error Handling', desc: 'Try/catch blocks and custom errors', tag: 'fundamentals', difficulty: 'medium', xp: 35 },
      { id: 19, title: 'Modules', desc: 'Import/export between files', tag: 'fundamentals', difficulty: 'medium', xp: 35 },
      { id: 20, title: 'Array Methods', desc: 'Map, filter, reduce, find, some, every', tag: 'arrays', difficulty: 'medium', xp: 40 },
      { id: 21, title: 'String Methods', desc: 'Split, slice, replace, includes, regex basics', tag: 'fundamentals', difficulty: 'easy', xp: 30 },
      { id: 22, title: 'Numbers & Math', desc: 'Math object, parseInt, toFixed, random', tag: 'fundamentals', difficulty: 'easy', xp: 25 },
      { id: 23, title: 'Date & Time', desc: 'Date object, timestamps, formatting', tag: 'fundamentals', difficulty: 'easy', xp: 30 },
      { id: 24, title: 'Regex', desc: 'Pattern matching with regular expressions', tag: 'fundamentals', difficulty: 'hard', xp: 45 },
      { id: 25, title: 'Final Project', desc: 'Build a complete todo app using everything learned', tag: 'project', difficulty: 'hard', xp: 100 }
    ];
  },

  // === 2. Render Grid ===
  renderGrid() {
    const grid = document.getElementById('lessonsGrid');
    if (!grid) return;

    if (this.filteredData.length === 0) {
      grid.innerHTML = `<div class="empty-state">No lessons found for this filter.</div>`;
      return;
    }

    const completed = RunJS.state.completedLessons || [];
    const bookmarks = RunJS.state.bookmarks || [];

    grid.innerHTML = this.filteredData.map(lesson => {
      const isCompleted = completed.includes(lesson.id);
      const isLocked = lesson.id > 1 && !completed.includes(lesson.id - 1);
      const isBookmarked = bookmarks.includes(lesson.id);
      
      const statusIcon = isCompleted ? '✓' : isLocked ? '🔒' : '▶';
      const statusText = isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Start';
      
      const cardClasses = ['lesson-card'];
      if (isLocked) cardClasses.push('locked');

      return `
        <div class="${cardClasses.join(' ')}" data-lesson-id="${lesson.id}">
          <div class="lesson-card-header">
            <div class="lesson-number">Lesson ${String(lesson.id).padStart(2,'0')}</div>
            <button class="lesson-bookmark ${isBookmarked ? 'active' : ''}" 
                    data-bookmark="${lesson.id}" 
                    aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark lesson'}">
              ${isBookmarked ? '⭐' : '☆'}
            </button>
          </div>
          <h3 class="lesson-title">${lesson.title}</h3>
          <p class="lesson-desc">${lesson.desc}</p>
          <div class="lesson-meta">
            <span class="lesson-tag">${lesson.tag}</span>
            <span class="lesson-tag">${lesson.difficulty}</span>
            <span class="lesson-tag">+${lesson.xp} XP</span>
            <span class="lesson-status ${isCompleted ? 'completed' : isLocked ? 'locked' : ''}">
              ${statusIcon} ${statusText}
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  // === 3. Events ===
  bindEvents() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.activeFilter = e.target.dataset.filter;
        this.applyFilter();
      });
    });

    // Lesson card clicks
    document.getElementById('lessonsGrid')?.addEventListener('click', (e) => {
      const bookmarkBtn = e.target.closest('[data-bookmark]');
      if (bookmarkBtn) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleBookmark(parseInt(bookmarkBtn.dataset.bookmark));
        return;
      }

      const card = e.target.closest('.lesson-card');
      if (!card || card.classList.contains('locked')) return;
      
      const lessonId = parseInt(card.dataset.lessonId);
      const lessonFile = `lesson-${String(lessonId).padStart(2,'0')}.html`;
      window.location.href = lessonFile;
    });
  },

  // === 4. Filters ===
  applyFilter() {
    const completed = RunJS.state.completedLessons || [];
    const bookmarks = RunJS.state.bookmarks || [];

    switch (this.activeFilter) {
      case 'completed':
        this.filteredData = this.data.filter(l => completed.includes(l.id));
        break;
      case 'bookmarked':
        this.filteredData = this.data.filter(l => bookmarks.includes(l.id));
        break;
      case 'all':
        this.filteredData = [...this.data];
        break;
      default:
        this.filteredData = this.data.filter(l => l.tag === this.activeFilter);
    }
    
    this.renderGrid();
  },

  // === 5. Bookmarks ===
  toggleBookmark(lessonId) {
    const bookmarks = RunJS.state.bookmarks || [];
    const index = bookmarks.indexOf(lessonId);
    
    if (index > -1) {
      bookmarks.splice(index, 1);
      RunJS.toast('Bookmark removed', 'success');
    } else {
      bookmarks.push(lessonId);
      RunJS.toast('Lesson bookmarked', 'success');
    }
    
    RunJS.updateState('bookmarks', bookmarks);
    this.renderGrid();
    Sidebar.refresh();
  },

  // === 6. Progress ===
  updateProgress() {
    const completed = RunJS.state.completedLessons || [];
    const total = this.data.length;
    const percent = Math.round((completed.length / total) * 100);

    const completedEl = document.getElementById('completedCount');
    const percentEl = document.getElementById('progressPercent');
    const barEl = document.getElementById('overallProgressBar');

    if (completedEl) completedEl.textContent = completed.length;
    if (percentEl) percentEl.textContent = `${percent}%`;
    if (barEl) barEl.style.width = `${percent}%`;
  }
};

// Auto-init
if (window.RunJS) {
  Lessons.init();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.RunJS) Lessons.init();
  });
}

window.Lessons = Lessons;
