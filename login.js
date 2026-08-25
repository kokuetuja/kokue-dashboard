// ============================================
// KOKUE TUJA — Sistema de acceso
// ============================================
(function(){
  const USER = 'kokue';
  const PASS = 'kokue2026tuja';
  const SESSION_KEY = 'kokue_auth';
  const SESSION_HOURS = 8; // sesión dura 8 horas

  // Check if already authenticated
  function isAuth(){
    const s = sessionStorage.getItem(SESSION_KEY);
    if(!s) return false;
    try{
      const d = JSON.parse(s);
      return d.ok && (Date.now() - d.ts) < SESSION_HOURS * 3600000;
    }catch(e){ return false; }
  }

  function doLogin(u, p){
    return u.trim().toLowerCase() === USER && p === PASS;
  }

  function saveSession(){
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ok:true, ts:Date.now()}));
  }

  function showLogin(){
    // Inject CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'login.css';
    document.head.appendChild(link);

    // Hide page content
    document.body.style.display = 'none';

    // Build login screen
    const overlay = document.createElement('div');
    overlay.id = 'kokue-login-overlay';
    overlay.innerHTML = `
      <div class="kokue-login-card">
        <div class="kokue-login-logo">
          <div class="kokue-login-brand">Kokue Tuja</div>
          <div class="kokue-login-sub">Sistema de Gestión</div>
        </div>
        <div class="kokue-login-form">
          <div class="kokue-login-field">
            <label class="kokue-login-label">Usuario</label>
            <input class="kokue-login-input" id="kl-user" type="text" placeholder="usuario" autocomplete="username" />
          </div>
          <div class="kokue-login-field">
            <label class="kokue-login-label">Contraseña</label>
            <input class="kokue-login-input" id="kl-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <div class="kokue-login-error" id="kl-error" style="display:none">Usuario o contraseña incorrectos</div>
          <button class="kokue-login-btn" id="kl-btn">Ingresar →</button>
        </div>
        <div class="kokue-login-footer">Kokue Tuja S.R.L. · Acceso restringido</div>
      </div>
    `;
    document.body.insertAdjacentElement('afterbegin', overlay);
    document.body.style.display = '';

    // Focus user input
    setTimeout(()=>document.getElementById('kl-user').focus(), 100);

    // Login handler
    function tryLogin(){
      const u = document.getElementById('kl-user').value;
      const p = document.getElementById('kl-pass').value;
      const err = document.getElementById('kl-error');
      const btn = document.getElementById('kl-btn');
      if(!u||!p){ err.style.display='block'; err.textContent='Completá usuario y contraseña'; return; }
      btn.textContent = 'Verificando…'; btn.disabled = true;
      setTimeout(()=>{
        if(doLogin(u,p)){
          saveSession();
          overlay.style.opacity='0';
          overlay.style.transition='opacity 0.3s';
          setTimeout(()=>overlay.remove(), 300);
        } else {
          err.style.display='block';
          err.textContent='Usuario o contraseña incorrectos';
          document.getElementById('kl-pass').value='';
          document.getElementById('kl-pass').focus();
          btn.textContent='Ingresar →'; btn.disabled=false;
        }
      }, 400);
    }

    document.getElementById('kl-btn').addEventListener('click', tryLogin);
    document.getElementById('kl-pass').addEventListener('keydown', e=>{ if(e.key==='Enter') tryLogin(); });
    document.getElementById('kl-user').addEventListener('keydown', e=>{ if(e.key==='Enter') document.getElementById('kl-pass').focus(); });
  }

  // Run on DOM ready
  function init(){
    if(!isAuth()) showLogin();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
