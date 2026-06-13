// js/auth.js - mobile guest auth, integrated with RunJS core
document.addEventListener('DOMContentLoaded', () => {
  // Wait for RunJS to init first
  if (!window.RunJS) {
    setTimeout(arguments.callee, 50);
    return;
  }

  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.querySelector('a[href="signup.html"]');
  const guestBtn = document.getElementById('guestBtn');
  const startBtn = document.getElementById('startLearningBtn');

  const goToLessons = () => {
    // Use RunJS state system, not raw localStorage
    RunJS.state.user = {
      id: 'guest',
      name: 'Guest',
      email: null,
      isGuest: true
    };
    RunJS.saveState();
    RunJS.updateUserUI();
    RunJS.toast('Welcome! Progress will be saved locally.', 'success');
    setTimeout(() => location.href = 'lessons.html', 500);
  };

  const handleAuthClick = (e) => {
    e.preventDefault();
    const btn = e.currentTarget;
    
    if (btn === loginBtn || btn === signupBtn) {
      RunJS.toast('Accounts coming soon. Using Guest mode for now.', 'warning');
    }
    goToLessons();
  };

  [loginBtn, signupBtn, guestBtn, startBtn].forEach(btn => {
    if (btn) btn.addEventListener('click', handleAuthClick);
  });

  // Auto-redirect if already logged in as guest
  if (RunJS.state.user && location.pathname.endsWith('index.html')) {
    const skipBtn = document.createElement('div');
    skipBtn.innerHTML = `<div style="text-align:center;margin-top:16px;"><a href="lessons.html" class="btn-ghost">Continue to Dashboard →</a></div>`;
    document.querySelector('.hero-cta')?.appendChild(skipBtn);
  }
});
