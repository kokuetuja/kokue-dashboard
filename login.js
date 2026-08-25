// ============================================
// KOKUE TUJA — Sistema de acceso v4.0
// ============================================
(function(){
  'use strict';

  const CONFIG = {
    user: 'kokue',
    pass: 'kokue2026tuja',
    sessionKey: 'kokue_auth',
    inactivityMs: 15 * 60 * 1000,
    warningMs:    13 * 60 * 1000,
  };

  let inactivityTimer = null;
  let warningTimer    = null;
  let sessionBarTimer = null;

  // ---- SESSION ----
  function getSession(){ try{ return JSON.parse(sessionStorage.getItem(CONFIG.sessionKey)||'null'); }catch(e){ return null; } }
  function saveSession(){ sessionStorage.setItem(CONFIG.sessionKey, JSON.stringify({ok:true, lastActivity:Date.now()})); }
  function clearSession(){ sessionStorage.removeItem(CONFIG.sessionKey); }

  function isAuth(){
    const s = getSession();
    if(!s||!s.ok) return false;
    if((Date.now() - s.lastActivity) > CONFIG.inactivityMs){ clearSession(); return false; }
    return true;
  }

  function updateActivity(){
    const s = getSession();
    if(s&&s.ok){ s.lastActivity = Date.now(); sessionStorage.setItem(CONFIG.sessionKey, JSON.stringify(s)); }
  }

  // ---- FIND NAV (works for both .nav and .topbar structures) ----
  function findNav(){
    return document.querySelector('.topbar') ||
           document.querySelector('nav.nav') ||
           document.querySelector('nav') ||
           document.querySelector('[class*="topbar"]') ||
           document.querySelector('header');
  }

  function findNavRight(){
    // First try the injected id (most reliable)
    const byId = document.getElementById('kokue-nav-right');
    if(byId) return byId;
    const nav = findNav();
    if(!nav) return null;
    return nav.querySelector('.topbar-right') ||
           nav.querySelector('.nav-right') ||
           nav.querySelector('[style*="flex"]') ||
           nav.lastElementChild;
  }

  // ---- INACTIVITY ----
  function resetTimers(){
    updateActivity();
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    hideWarning();

    warningTimer = setTimeout(()=>{ showWarning(); }, CONFIG.warningMs);
    inactivityTimer = setTimeout(()=>{
      clearSession();
      stopSessionBar();
      showTimeoutLogin();
    }, CONFIG.inactivityMs);
  }

  function startListeners(){
    ['mousemove','keydown','click','scroll','touchstart'].forEach(ev=>{
      document.addEventListener(ev, resetTimers, {passive:true});
    });
    resetTimers();
  }

  // ---- WARNING ----
  function showWarning(){
    if(document.getElementById('kokue-warning')) return;
    const el = document.createElement('div');
    el.id = 'kokue-warning';
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#3d2410;color:#f5e8d8;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;z-index:99998;font-family:Barlow,sans-serif;font-size:13px;gap:12px;box-shadow:0 -4px 20px rgba(0,0,0,0.3);';
    el.innerHTML = '<span>⏱ Tu sesión cierra en <strong>2 minutos</strong> por inactividad.</span><button id="kokue-warning-btn" style="background:#c8941e;border:none;color:#fff;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;">Seguir conectado</button>';
    document.body.appendChild(el);
    document.getElementById('kokue-warning-btn').addEventListener('click',()=>{ el.remove(); resetTimers(); });
  }
  function hideWarning(){ document.getElementById('kokue-warning')?.remove(); }

  // ---- SESSION BAR ----
  function startSessionBar(){
    updateSessionBar();
    sessionBarTimer = setInterval(updateSessionBar, 1000);
  }
  function stopSessionBar(){ clearInterval(sessionBarTimer); }
  function updateSessionBar(){
    const bar = document.getElementById('kokue-session-bar');
    if(!bar) return;
    const s = getSession();
    if(!s) return;
    const elapsed = Date.now() - s.lastActivity;
    const pct = Math.max(0, 100 - (elapsed / CONFIG.inactivityMs * 100));
    bar.style.width = pct + '%';
    bar.style.background = pct > 50 ? '#2e7d4f' : pct > 20 ? '#c8941e' : '#c0392b';
    const minLeft = Math.max(0, Math.ceil((CONFIG.inactivityMs - elapsed) / 60000));
    bar.title = `Sesión activa · cierra en ${minLeft} min sin actividad`;
  }

  // ---- DETECT CURRENT MODULE ----
  function detectModule(){
    const map = {'':'inicio','index':'inicio','facturacion':'facturacion','hacienda':'hacienda','stock':'stock','maiz':'maiz','creditos':'creditos','sueldos':'sueldos'};
    const page = window.location.pathname.split('/').pop().replace('.html','').toLowerCase();
    return map[page] || page;
  }

  // ---- INJECT GLOBAL NAV ----
  function injectGlobalNav(){
    // Remove existing duplicated nav-links injected by login before
    document.getElementById('kokue-global-nav')?.remove();

    const current = detectModule();
    const modules = [
      {id:'inicio',      label:'Inicio',       href:'index.html'},
      {id:'facturacion', label:'Facturación',   href:'facturacion.html'},
      {id:'hacienda',    label:'Hacienda',      href:'hacienda.html'},
      {id:'stock',       label:'Stock',         href:'stock.html'},
      {id:'maiz',        label:'Maíz',          href:'maiz.html'},
      {id:'creditos',    label:'Créditos',      href:'creditos.html'},
      {id:'sueldos',     label:'Sueldos',       href:'sueldos.html'},
    ];

    const nav = document.createElement('div');
    nav.id = 'kokue-global-nav';
    nav.style.cssText = 'display:flex;align-items:center;gap:2px;flex-wrap:nowrap;overflow-x:auto;';

    modules.forEach(m=>{
      const a = document.createElement('a');
      a.href = m.href;
      a.textContent = m.label;
      const isActive = m.id === current;
      a.style.cssText = `padding:4px 10px;font-size:9px;letter-spacing:0.08em;text-transform:uppercase;font-family:'DM Mono',monospace;text-decoration:none;border-radius:3px;white-space:nowrap;transition:all 0.15s;${isActive?'background:rgba(245,232,216,0.2);color:#f5e8d8;font-weight:600;border:0.5px solid rgba(245,232,216,0.35);':'color:rgba(245,232,216,0.65);border:0.5px solid transparent;'}`;
      if(!isActive){
        a.addEventListener('mouseenter',()=>{a.style.background='rgba(245,232,216,0.1)';a.style.color='#f5e8d8';});
        a.addEventListener('mouseleave',()=>{a.style.background='transparent';a.style.color='rgba(245,232,216,0.65)';});
      }
      nav.appendChild(a);
    });

    // HIDE the original static nav-links (they're duplicates)
    const staticNavLinks = document.querySelector('.nav-links');
    if(staticNavLinks) staticNavLinks.style.display='none';

    // Also hide any existing static nav injected links
    document.querySelectorAll('nav.nav .nav-links').forEach(el=>el.style.display='none');

    // Insert into the topbar/nav
    const navEl = findNav();
    if(!navEl) return;

    const right = findNavRight();
    if(right && right !== navEl){
      navEl.insertBefore(nav, right);
    } else {
      navEl.appendChild(nav);
    }
  }

  // ---- INJECT LOGOUT + USER + PRINT ----
  function injectControls(){
    if(document.getElementById('kokue-logout-btn')) return;

    // Session progress bar at very top
    if(!document.getElementById('kokue-session-bar-wrap')){
      const wrap = document.createElement('div');
      wrap.id = 'kokue-session-bar-wrap';
      wrap.style.cssText = 'position:fixed;top:0;left:0;right:0;height:2px;z-index:99997;background:rgba(0,0,0,0.15);pointer-events:none;';
      const bar = document.createElement('div');
      bar.id = 'kokue-session-bar';
      bar.style.cssText = 'height:100%;width:100%;background:#2e7d4f;transition:width 1s linear,background 0.5s;';
      wrap.appendChild(bar);
      document.body.insertAdjacentElement('afterbegin', wrap);
    }

    const right = findNavRight();
    if(!right) return;

    // User label
    const userLabel = document.createElement('span');
    userLabel.id = 'kokue-user-label';
    userLabel.textContent = '👤 kokue';
    userLabel.style.cssText = 'color:rgba(245,232,216,0.5);font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.08em;white-space:nowrap;';

    // Print button
    const printBtn = document.createElement('button');
    printBtn.id = 'kokue-print-btn';
    printBtn.innerHTML = '🖨️';
    printBtn.title = 'Imprimir / Exportar PDF';
    printBtn.style.cssText = 'background:transparent;border:0.5px solid rgba(245,232,216,0.2);color:rgba(245,232,216,0.6);font-size:13px;padding:3px 7px;border-radius:3px;cursor:pointer;transition:all 0.15s;line-height:1;';
    printBtn.addEventListener('mouseenter',()=>{printBtn.style.background='rgba(245,232,216,0.1)';printBtn.style.color='#f5e8d8';});
    printBtn.addEventListener('mouseleave',()=>{printBtn.style.background='transparent';printBtn.style.color='rgba(245,232,216,0.6)';});
    printBtn.addEventListener('click',()=>window.print());

    // Logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'kokue-logout-btn';
    logoutBtn.innerHTML = '🔴 Salir';
    logoutBtn.title = 'Cerrar sesión';
    logoutBtn.style.cssText = 'background:transparent;border:0.5px solid rgba(192,57,43,0.5);color:rgba(245,232,216,0.7);font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.06em;padding:4px 8px;border-radius:3px;cursor:pointer;transition:all 0.15s;white-space:nowrap;';
    logoutBtn.addEventListener('mouseenter',()=>{logoutBtn.style.background='rgba(192,57,43,0.25)';logoutBtn.style.color='#f5e8d8';});
    logoutBtn.addEventListener('mouseleave',()=>{logoutBtn.style.background='transparent';logoutBtn.style.color='rgba(245,232,216,0.7)';});
    logoutBtn.addEventListener('click',()=>{
      if(confirm('¿Cerrás la sesión?')){ clearSession(); stopSessionBar(); location.reload(); }
    });

    right.appendChild(userLabel);
    right.appendChild(printBtn);
    right.appendChild(logoutBtn);
  }

  // ---- MOBILE SIDEBAR ----
  function injectMobile(){
    if(document.getElementById('kokue-mobile-toggle')) return;
    const sidebar = document.querySelector('.sidebar,[class*="sidebar"]');
    if(!sidebar) return;

    const toggle = document.createElement('button');
    toggle.id = 'kokue-mobile-toggle';
    toggle.innerHTML = '☰';
    toggle.style.cssText = 'display:none;position:fixed;bottom:20px;right:20px;z-index:500;background:#3d2410;color:#f5e8d8;border:none;border-radius:50%;width:48px;height:48px;font-size:20px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.3);align-items:center;justify-content:center;';
    document.body.appendChild(toggle);

    const mOverlay = document.createElement('div');
    mOverlay.id = 'kokue-mobile-overlay';
    mOverlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:499;';
    document.body.appendChild(mOverlay);

    toggle.addEventListener('click',()=>{
      const open = sidebar.classList.toggle('mobile-open');
      toggle.innerHTML = open ? '✕' : '☰';
      mOverlay.style.display = open ? 'block' : 'none';
    });
    mOverlay.addEventListener('click',()=>{
      sidebar.classList.remove('mobile-open');
      toggle.innerHTML = '☰';
      mOverlay.style.display = 'none';
    });

    const style = document.createElement('style');
    style.id = 'kokue-mobile-styles';
    style.textContent = `
      @media print {
        nav.nav, .topbar, .sidebar, .tabs, .btn-toggle, .btn-reload,
        #kokue-global-nav, #kokue-logout-btn, #kokue-print-btn,
        #kokue-user-label, #kokue-session-bar-wrap, #kokue-mobile-toggle,
        #kokue-mobile-overlay, #kokue-warning, .chart-mode-btn,
        .filter-group, input[type=range], button { display:none !important; }
        .layout, body { display:block !important; grid-template-columns:1fr !important; }
        .kpi-strip,.kpi-grid,.comp-kpi-grid { grid-template-columns:repeat(4,1fr) !important; }
        .chart-row,.evol-grid { grid-template-columns:1fr 1fr !important; }
        .table-card, table { page-break-inside:avoid; }
        body { background:white !important; color:black !important; font-size:11px; }
        thead tr { background:#333 !important; }
        * { box-shadow:none !important; }
      }
      @media (max-width:768px){
        #kokue-mobile-toggle { display:flex !important; }
        .layout { grid-template-columns:1fr !important; }
        .sidebar {
          position:fixed !important; left:-280px !important; top:0 !important;
          height:100vh !important; width:260px !important; z-index:500 !important;
          transition:left 0.25s ease !important; opacity:1 !important;
          padding:1rem !important; pointer-events:auto !important;
          box-shadow:4px 0 20px rgba(0,0,0,0.15); overflow-y:auto;
        }
        .sidebar.mobile-open { left:0 !important; }
        .kpi-strip,.kpi-grid,.comp-kpi-grid { grid-template-columns:repeat(2,1fr) !important; }
        .chart-row,.evol-grid,.comp-selectors { grid-template-columns:1fr !important; }
        .chart-box.full { grid-column:1 !important; }
        .modal { width:96% !important; max-height:90vh !important; }
        .modal-kpis { grid-template-columns:repeat(2,1fr) !important; }
        #kokue-global-nav { overflow-x:auto; -webkit-overflow-scrolling:touch; }
        #kokue-global-nav::-webkit-scrollbar { height:2px; }
      }
      @media (max-width:480px){
        .kpi-strip,.kpi-grid { grid-template-columns:1fr 1fr !important; }
        .kpi-val, .modal-kpi-val { font-size:1.1rem !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // ---- LOGIN UI ----
  function buildLoginHTML(extraMsg=''){
    return `<div class="kokue-login-card">
      <div class="kokue-login-logo">
        <div class="kokue-login-brand">Kokue Tuja</div>
        <div class="kokue-login-sub">Sistema de Gestión</div>
      </div>
      <div class="kokue-login-form">
        ${extraMsg}
        <div class="kokue-login-field">
          <label class="kokue-login-label">Usuario</label>
          <input class="kokue-login-input" id="kl-user" type="text" placeholder="usuario" autocomplete="username"/>
        </div>
        <div class="kokue-login-field">
          <label class="kokue-login-label">Contraseña</label>
          <input class="kokue-login-input" id="kl-pass" type="password" placeholder="••••••••" autocomplete="current-password"/>
        </div>
        <div class="kokue-login-error" id="kl-error" style="display:none"></div>
        <button class="kokue-login-btn" id="kl-btn">Ingresar →</button>
      </div>
      <div class="kokue-login-footer">Kokue Tuja S.R.L. · Acceso restringido</div>
    </div>`;
  }

  function ensureLoginCSS(){
    if(!document.querySelector('link[href="login.css"]')){
      const l=document.createElement('link');l.rel='stylesheet';l.href='login.css';
      document.head.appendChild(l);
    }
  }

  function attachHandler(onSuccess){
    function attempt(){
      const u=(document.getElementById('kl-user').value||'').trim().toLowerCase();
      const p=document.getElementById('kl-pass').value||'';
      const err=document.getElementById('kl-error');
      const btn=document.getElementById('kl-btn');
      if(!u||!p){err.style.display='block';err.textContent='Completá usuario y contraseña';return;}
      btn.textContent='Verificando…';btn.disabled=true;
      setTimeout(()=>{
        if(u===CONFIG.user&&p===CONFIG.pass){
          saveSession(); onSuccess();
        } else {
          err.style.display='block';err.textContent='Usuario o contraseña incorrectos';
          document.getElementById('kl-pass').value='';
          document.getElementById('kl-pass').focus();
          btn.textContent='Ingresar →';btn.disabled=false;
        }
      },400);
    }
    document.getElementById('kl-btn').addEventListener('click',attempt);
    document.getElementById('kl-pass').addEventListener('keydown',e=>{if(e.key==='Enter')attempt();});
    document.getElementById('kl-user').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('kl-pass').focus();});
    setTimeout(()=>document.getElementById('kl-user')?.focus(),150);
  }

  function showLogin(extraMsg=''){
    ensureLoginCSS();
    const ov=document.createElement('div');
    ov.id='kokue-login-overlay';
    ov.innerHTML=buildLoginHTML(extraMsg);
    document.body.insertAdjacentElement('afterbegin',ov);
    attachHandler(()=>{
      ov.style.cssText+='opacity:0;transition:opacity 0.3s;';
      setTimeout(()=>{ov.remove();onAuthenticated();},300);
    });
  }

  function showTimeoutLogin(){
    document.getElementById('kokue-login-overlay')?.remove();
    showLogin('<div class="kokue-login-error" style="display:block;margin-bottom:.5rem">⏱ Sesión cerrada por inactividad (15 min)</div>');
  }

  // ---- ON AUTHENTICATED ----
  function onAuthenticated(){
    injectGlobalNav();
    injectControls();
    injectMobile();
    startListeners();
    startSessionBar();
  }

  // ---- INIT ----
  function init(){
    if(isAuth()){ onAuthenticated(); }
    else { showLogin(); }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  } else { init(); }
})();
