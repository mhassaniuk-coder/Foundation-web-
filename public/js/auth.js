import { auth } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Tab Switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.target;

      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });

  // Login Handling
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('input[type="email"]').value;
    const password = loginForm.querySelector('input[type="password"]').value;

    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;

      window.location.href = '/dashboard.html';
    } catch (error) {
      alert(error.message);
    }
  });

  // Registration Handling
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = registerForm.querySelector('input[type="text"]').value;
    const email = registerForm.querySelector('input[type="email"]').value;
    const password = registerForm.querySelector('input[type="password"]').value;

    try {
      const { data, error } = await auth.signUp(email, password);
      if (error) throw error;

      alert('Welcome King! Please check your email to verify your account.');
    } catch (error) {
      alert(error.message);
    }
  });
});
