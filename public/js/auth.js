// Lightweight client-side auth simulation for UI flows
(function(){
  function showAlert(msg){
    try{ if(window.toastr) { toastr.info(msg); return; } }catch(e){}
    alert(msg);
  }

  function togglePassword(buttonId, inputId){
    var btn = document.getElementById(buttonId);
    var input = document.getElementById(inputId);
    if(!btn || !input) return;
    btn.addEventListener('click', function(){
      if(input.type === 'password'){
        input.type = 'text'; btn.textContent = 'Hide';
      } else { input.type = 'password'; btn.textContent = 'Show'; }
    });
  }

  function strengthScore(p){
    var score = 0;
    if(!p) return 0;
    if(p.length >= 8) score += 1;
    if(/[A-Z]/.test(p)) score += 1;
    if(/[0-9]/.test(p)) score += 1;
    if(/[^A-Za-z0-9]/.test(p)) score += 1;
    return score;
  }

  function updateStrength(inputId, barId){
    var input = document.getElementById(inputId);
    var bar = document.getElementById(barId);
    if(!input || !bar) return;
    input.addEventListener('input', function(){
      var score = strengthScore(input.value);
      var pct = (score / 4) * 100;
      bar.style.width = pct + '%';
      if(pct < 50) bar.style.background = '#e74c3c';
      else if(pct < 75) bar.style.background = '#f39c12';
      else bar.style.background = '#27ae60';
    });
  }

  // Login
  var loginForm = document.getElementById('loginForm');
  if(loginForm){
    togglePassword('toggleLoginPass','loginPassword');
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = (document.getElementById('loginEmail')||{}).value || '';
      showAlert('Logged in as ' + email + ' (simulation)');
      window.location.href = '/dashboard.html';
    });
  }

  // Signup
  var signupForm = document.getElementById('signupForm');
  if(signupForm){
    updateStrength('signupPassword','signupStrength');
    signupForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = (document.getElementById('signupEmail')||{}).value || '';
      var pwd = (document.getElementById('signupPassword')||{}).value || '';
      var confirm = (document.getElementById('signupConfirm')||{}).value || '';
      if(pwd !== confirm){ return showAlert('Passwords do not match'); }
      if(strengthScore(pwd) < 2){ return showAlert('Please choose a stronger password'); }
      showAlert('Account created for ' + email + ' (simulation)');
      window.location.href = '/dashboard.html';
    });
  }

  // Reset
  var resetForm = document.getElementById('resetForm');
  if(resetForm){
    resetForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = (document.getElementById('resetEmail')||{}).value || '';
      showAlert('If an account exists for ' + email + ', a reset link has been sent (simulation).');
      window.location.href = '/auth/login.html';
    });
  }

  // Social buttons (UI only)
  var socialButtons = ['socialGoogle','socialFacebook','socialGoogleSign','socialFacebookSign'];
  socialButtons.forEach(function(id){
    var el = document.getElementById(id); if(!el) return;
    el.addEventListener('click', function(){ showAlert('Social login coming soon (UI simulation).'); });
  });

})();
