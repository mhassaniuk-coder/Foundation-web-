// Lightweight client-side auth simulation for UI flows
(function(){
  function showAlert(msg){
    alert(msg);
  }

  // Login form
  var loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = document.getElementById('loginEmail').value;
      // Simulate login
      showAlert('Logged in as ' + email + ' (simulation)');
      window.location.href = '/dashboard.html';
    });
  }

  // Signup form
  var signupForm = document.getElementById('signupForm');
  if(signupForm){
    signupForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = document.getElementById('signupEmail').value;
      // Basic validation
      var pwd = document.getElementById('signupPassword').value;
      var confirm = document.getElementById('signupConfirm').value;
      if(pwd !== confirm){
        return showAlert('Passwords do not match');
      }
      showAlert('Account created for ' + email + ' (simulation)');
      window.location.href = '/dashboard.html';
    });
  }

  // Reset form
  var resetForm = document.getElementById('resetForm');
  if(resetForm){
    resetForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = document.getElementById('resetEmail').value;
      showAlert('If an account exists for ' + email + ', a reset link has been sent (simulation).');
      window.location.href = '/auth/login.html';
    });
  }
})();
