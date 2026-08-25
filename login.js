// ============================================
// KOKUE TUJA — Sistema de acceso
// ============================================
(function(){
  const USER = 'kokue';
  const PASS = 'kokue2026tuja';
  const SESSION_KEY = 'kokue_auth';
  const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutos
  let inactivityTimer = null;

  function isAuth(){
    const s = sessionStorage.getItem(SESSION_KEY);
    if(!s) return false;
    try{
      const d = JSON.parse(s);
      if(!d.ok) return false;
      // Check inactivity
      if((Date.now() - d.lastActivity) > INACTIVITY_MS) {
        sessionStorage.removeItem(SESSION_KEY);
        return false;
      }
      return true;
    }catch(e){ return false; }
  }

  function saveSession(){
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ok:true, lastActivity:Date.now()}));
  }

  function updateActivity(){
    const s = sessionStorage.getItem(SESSION_KEY);
    if(!s) return;
    try{
      const d = JSON.parse(s);
      if(d.ok){ d.lastActivity = Date.now(); sessionStorage.setItem(SESSION_KEY, JSON.stringify(d)); }
    }catch(e){}
  }

  function resetTimer(){
    updateActivity();
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(()=>{
      sessionStorage.removeItem(SESSION_KEY);
      showTimeoutMessage();
    }, INACTIVITY_MS);
  }

  function startActivityListeners(){
    ['mousemove','keydown','click','scroll','touchstart'].forEach(ev=>{
      document.addEventListener(ev, resetTimer, {passive:true});
    });
    resetTimer();
  }

  function showTimeoutMessage(){
    const overlay = document.createElement('div');
    overlay.id = 'kokue-login-overlay';
    overlay.innerHTML = `
      <div class="kokue-login-card">
        <div class="kokue-login-logo">
          <div class="kokue-login-brand">Kokue Tuja</div>
          <div class="kokue-login-sub">Sistema de Gestión</div>
        </div>
        <div class="kokue-login-form">
          <div class="kokue-login-error" style="display:block;margin-bottom:0.5rem">
            ⏱ Sesión cerrada por inactividad (15 min)
          </div>
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
    setTimeout(()=>document.getElementById('kl-user')?.focus(), 100);
    attachLoginHandler();
  }

  function doLogin(u, p){
    return u.trim().toLowerCase() === USER && p === PASS;
  }

  function attachLoginHandler(){
    function tryLogin(){
      const u = document.getElementById('kl-user').value;
      const p = document.getElementById('kl-pass').value;
      const err = document.getElementById('kl-error');
      const btn = document.getElementById('kl-btn');
      if(!u||!p){ err.style.display='block'; err.textContent='Completá usuario y contraseña'; return; }
      btn.textContent='Verificando…'; btn.disabled=true;
      setTimeout(()=>{
        if(doLogin(u,p)){
          saveSession();
          const overlay = document.getElementById('kokue-login-overlay');
          overlay.style.opacity='0';
          overlay.style.transition='opacity 0.3s';
          setTimeout(()=>{ overlay.remove(); startActivityListeners(); }, 300);
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

  function showLogin(){
    const link = document.createElement('link');
    link.rel='stylesheet'; link.href='login.css';
    document.head.appendChild(link);

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
    setTimeout(()=>document.getElementById('kl-user')?.focus(), 100);
    attachLoginHandler();
  }

  function init(){
    if(isAuth()){
      startActivityListeners();
    } else {
      showLogin();
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
