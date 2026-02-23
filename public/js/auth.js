import { auth, supabase } from './supabase.js';
import { ADMIN_BOOTSTRAP_EMAIL, USER_STATUS_ACTIVE, USER_STATUS_PENDING } from './config.js';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

function isBootstrapAdminEmail(email) {
  return normalizeEmail(email) === ADMIN_BOOTSTRAP_EMAIL;
}

async function ensureUserProfile(user, fullName = '') {
  if (!user?.id || !user?.email) {
    return null;
  }

  const normalizedEmail = normalizeEmail(user.email);
  const shouldBeAdmin = isBootstrapAdminEmail(normalizedEmail);
  const defaultName = normalizedEmail.split('@')[0];
  const resolvedName = (fullName || defaultName).trim();

  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!existingProfile) {
    const profilePayload = {
      id: user.id,
      full_name: resolvedName,
      email: normalizedEmail,
      role: shouldBeAdmin ? 'admin' : 'user',
      status: shouldBeAdmin ? USER_STATUS_ACTIVE : USER_STATUS_PENDING
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert([profilePayload]);

    if (insertError) {
      throw insertError;
    }

    return profilePayload;
  }

  const profileUpdates = {};

  if (existingProfile.email !== normalizedEmail) {
    profileUpdates.email = normalizedEmail;
  }
  if (!existingProfile.full_name && resolvedName) {
    profileUpdates.full_name = resolvedName;
  }
  if (!existingProfile.status) {
    profileUpdates.status = shouldBeAdmin ? USER_STATUS_ACTIVE : USER_STATUS_PENDING;
  }
  if (shouldBeAdmin) {
    if (existingProfile.role !== 'admin') {
      profileUpdates.role = 'admin';
    }
    if (existingProfile.status !== USER_STATUS_ACTIVE) {
      profileUpdates.status = USER_STATUS_ACTIVE;
    }
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }
  }

  return { ...existingProfile, ...profileUpdates };
}

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const regPassword = registerForm ? registerForm.querySelector('input[type="password"]') : null;
  const strengthBar = document.getElementById('strengthBar');
  const strengthText = document.getElementById('strengthText');
  const strengthContainer = document.getElementById('passwordStrength');

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

        const signedInUser = data?.user || await auth.getUser();
        const profile = await ensureUserProfile(signedInUser);
        const isAdmin = profile?.role === 'admin' || isBootstrapAdminEmail(signedInUser?.email);

        if (isAdmin) {
          window.location.href = '/admin.html';
          return;
        }

        if (profile?.status !== USER_STATUS_ACTIVE) {
          await auth.signOut();
          alert('Your account is pending admin approval. Please wait until your status is activated.');
          return;
        }

        window.location.href = '/dashboard.html';
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Password Strength Oracle (Feature 4)
  if (regPassword && strengthBar && strengthText && strengthContainer) {
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
      const passwordInput = registerForm.querySelector('input[type="password"]');
      const password = passwordInput ? passwordInput.value : '';

      try {
        // Security Audit: Log attempt (Feature 3 Mock)
        console.log(`Security Audit: Registration attempt for ${email}`);
        const { data, error } = await auth.signUp(email, password);
        if (error) throw error;

        if (data.user) {
          const profile = await ensureUserProfile(data.user, fullName);
          if (profile?.role === 'admin') {
            alert('Admin account created successfully. You can log in and open the Admin Console.');
            window.location.href = '/auth/login.html';
            return;
          }
        }

        alert('Account created successfully. Your access is pending admin approval.');
        window.location.href = '/auth/login.html';
      } catch (error) {
        alert(error.message);
      }
    });
  }
});
