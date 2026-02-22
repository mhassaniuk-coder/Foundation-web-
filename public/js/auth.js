import { auth, supabase } from './supabase.js';

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
  if (loginForm) {
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
  }

  // Password Strength Oracle (Feature 4)
  const regPassword = document.getElementById('regPassword');
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const strengthContainer = document.getElementById('passwordStrength');

  if (regPassword) {
    regPassword.addEventListener('input', () => {
      const val = regPassword.value;
      if (!val) {
        strengthContainer.style.display = 'none';
        strengthText.style.display = 'none';
        return;
      }

      strengthContainer.style.display = 'block';
      strengthText.style.display = 'block';

      let score = 0;
      if (val.length > 7) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;

      const colors = ['#ef4444', '#f59e0b', '#10b981', '#10b981'];
      const texts = ['Weak', 'Fair', 'Strong', 'Kingly Power'];

      strengthBar.style.width = (score / 4) * 100 + '%';
      strengthBar.style.background = colors[score - 1] || colors[0];
      strengthText.innerText = texts[score - 1] || texts[0];
      strengthText.style.color = colors[score - 1] || colors[0];
    });
  }

  // Registration Handling
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = registerForm.querySelector('input[type="text"]').value;
      const email = registerForm.querySelector('input[type="email"]').value;
      const password = regPassword.value;

      try {
        // Security Audit: Log attempt (Feature 3 Mock)
        console.log(`Security Audit: Registration attempt for ${email}`);
        const { data, error } = await auth.signUp(email, password);
        if (error) throw error;

        if (data.user) {
          // Create profile entry
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{
              id: data.user.id,
              full_name: fullName,
              email: email
            }]);

          if (profileError) console.error("Profile creation error:", profileError);
        }

        alert('Welcome King! Account created. Please check your email to verify (if enabled) or sign in.');
        location.reload(); // Switch back to login view
      } catch (error) {
        alert(error.message);
      }
    });
  }
});
