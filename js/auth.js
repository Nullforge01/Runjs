// js/auth.js - mobile guest auth
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.querySelector('button:contains("Log In")');
  const signupBtn = document.querySelector('button:contains("Sign Up")'); 
  const guestBtn = document.querySelector('button:contains("Continue as Guest")');
  const startBtn = document.querySelector('button:contains("Start Learning")');

  const goToLessons = () => {
    localStorage.setItem('runjs_user', JSON.stringify({id:'guest', name:'Guest'}));
    location.href = '/lessons.html';
  };

  [loginBtn, signupBtn, guestBtn, startBtn].forEach(btn => {
    if(btn) btn.onclick = (e) => {
      e.preventDefault();
      if(btn === loginBtn || btn === signupBtn) {
        alert('Accounts coming soon. Using Guest mode for now.');
      }
      goToLessons();
    };
  });
});
