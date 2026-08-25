// ============================================
// KOKUE TUJA — Sistema de acceso v3.0
// ============================================
(function(){
  'use strict';

  const CONFIG = {
    user: 'kokue',
    pass: 'kokue2026tuja',
    sessionKey: 'kokue_auth',
    inactivityMs: 15 * 60 * 1000,   // 15 min
    warningMs:    13 * 60 * 1000,   // aviso a los 13 min (2 min antes)
    sessionBarUpdate: 1000,          // actualizar barra cada 1s
  };

  let inactivityTimer = null;
  let warningTimer    = null;
  let sessionBarTimer = null;
  let sessionStart    = null;
  let warningShown    = false;

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

  // ---- INACTIVITY ----
  function resetTimers(){
    updateActivity();
    clearTimeout(inactivityTimer);
    clearTimeout(warningTimer);
    warningShown = false;
    hideWarning();

    warningTimer = setTimeout(()=>{
      if(!warningShown){ warningShown=true; showWarning(); }
    }, CONFIG.warningMs);

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
    startSessionBar();
  }

  // ---- WARNING BANNER ----
  function showWarning(){
    if(document.getElementById('kokue-warning')) return;
    const el = document.createElement('div');
    el.id = 'kokue-warning';
    el.innerHTML = `
      <span>⏱ Tu sesión cierra en <strong>2 minutos</strong> por inactividad.</span>
      <button onclick="(function(){document.getElementById('kokue-warning').remove();})(); return false;">Seguir conectado</button>
    `;
    el.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#3d2410;color:#f5e8d8;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;z-index:99998;font-family:Barlow,sans-serif;font-size:13px;gap:12px;';
    el.querySelector('button').style.cssText='background:#c8941e;border:none;color:#fff;padding:6px 16px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:600;white-space:nowrap;';
    el.querySelector('button').addEventListener('click', ()=>{ el.remove(); resetTimers(); });
    document.body.appendChild(el);
  }
  function hideWarning(){ document.getElementById('kokue-warning')?.remove(); }

  // ---- SESSION BAR ----
  function startSessionBar(){
    sessionStart = Date.now();
    updateSessionBar();
    sessionBarTimer = setInterval(updateSessionBar, CONFIG.sessionBarUpdate);
  }
  function stopSessionBar(){ clearInterval(sessionBarTimer); }

  function updateSessionBar(){
    const bar = document.getElementById('kokue-session-bar');
    if(!bar) return;
    const s = getSession();
    if(!s) return;
    const elapsed = Date.now() - s.lastActivity;
    const pct = Math.max(0, 100 - (elapsed / CONFIG.inactivityMs * 100));
    const color = pct > 50 ? '#2e7d4f' : pct > 20 ? '#c8941e' : '#c0392b';
    bar.style.width = pct + '%';
    bar.style.background = color;
    // tooltip
    const minLeft = Math.max(0, Math.ceil((CONFIG.inactivityMs - elapsed) / 60000));
    bar.title = `Sesión activa · cierra en ${minLeft} min sin actividad`;
  }

  // ---- NAV INJECTION ----
  function detectCurrentModule(){
    const path = window.location.pathname.split('/').pop().replace('.html','');
    const map = {
      'index':'inicio','':'inicio',
      'facturacion':'facturacion',
      'hacienda':'hacienda',
      'stock':'stock',
      'maiz':'maiz',
      'creditos':'creditos',
      'sueldos':'sueldos'
    };
    return map[path] || path;
  }

  function injectNav(){
    const current = detectCurrentModule();
    const modules = [
      {id:'inicio',    label:'Inicio',      href:'index.html'},
      {id:'facturacion',label:'Facturación', href:'facturacion.html'},
      {id:'hacienda',  label:'Hacienda',    href:'hacienda.html'},
      {id:'stock',     label:'Stock',       href:'stock.html'},
      {id:'maiz',      label:'Maíz',        href:'maiz.html'},
      {id:'creditos',  label:'Créditos',    href:'creditos.html'},
      {id:'sueldos',   label:'Sueldos',     href:'sueldos.html'},
    ];

    // Find existing topbar
    const topbar = document.querySelector('.topbar, [class*="topbar"], nav, header');
    if(!topbar) return;

    // Check if nav already exists
    if(document.getElementById('kokue-global-nav')) return;

    const nav = document.createElement('div');
    nav.id = 'kokue-global-nav';
    nav.style.cssText = 'display:flex;align-items:center;gap:2px;flex-wrap:wrap;';

    modules.forEach(m=>{
      const a = document.createElement('a');
      a.href = m.href;
      a.textContent = m.label;
      a.style.cssText = `
        padding:4px 10px;font-size:9px;letter-spacing:0.08em;text-transform:uppercase;
        font-family:'DM Mono',monospace;text-decoration:none;border-radius:3px;
        transition:background 0.15s,opacity 0.15s;white-space:nowrap;
        ${m.id===current
          ? 'background:rgba(245,232,216,0.2);color:#f5e8d8;opacity:1;font-weight:600;border:0.5px solid rgba(245,232,216,0.3);'
          : 'color:rgba(245,232,216,0.6);opacity:0.8;border:0.5px solid transparent;'}
      `;
      a.addEventListener('mouseenter',()=>{ if(m.id!==current) a.style.opacity='1'; a.style.background='rgba(245,232,216,0.1)'; });
      a.addEventListener('mouseleave',()=>{ if(m.id!==current){ a.style.opacity='0.8'; a.style.background='transparent'; } });
      nav.appendChild(a);
    });

    // Insert nav into topbar — try to find center or right area
    const topbarRight = topbar.querySelector('[class*="right"], [class*="nav"], [id*="nav"]');
    if(topbarRight){
      topbar.insertBefore(nav, topbarRight);
    } else {
      topbar.appendChild(nav);
    }
  }

  function injectLogoutBtn(){
    if(document.getElementById('kokue-logout-btn')) return;

    // Session bar
    const barWrap = document.createElement('div');
    barWrap.style.cssText = 'position:fixed;top:0;left:0;right:0;height:2px;z-index:99997;background:rgba(0,0,0,0.1);';
    const bar = document.createElement('div');
    bar.id = 'kokue-session-bar';
    bar.style.cssText = 'height:100%;width:100%;background:#2e7d4f;transition:width 1s linear,background 0.5s;';
    barWrap.appendChild(bar);
    document.body.insertAdjacentElement('afterbegin', barWrap);

    // Logout button — inject into topbar right area
    const topbar = document.querySelector('.topbar, [class*="topbar"]');
    if(!topbar) return;

    const btn = document.createElement('button');
    btn.id = 'kokue-logout-btn';
    btn.innerHTML = '🔴 Cerrar sesión';
    btn.title = 'Cerrar sesión';
    btn.style.cssText = `
      background:transparent;border:0.5px solid rgba(192,57,43,0.5);
      color:rgba(245,232,216,0.7);font-family:'DM Mono',monospace;
      font-size:9px;letter-spacing:0.08em;padding:4px 10px;border-radius:3px;
      cursor:pointer;transition:all 0.15s;white-space:nowrap;
    `;
    btn.addEventListener('mouseenter',()=>{ btn.style.background='rgba(192,57,43,0.2)'; btn.style.color='#f5e8d8'; });
    btn.addEventListener('mouseleave',()=>{ btn.style.background='transparent'; btn.style.color='rgba(245,232,216,0.7)'; });
    btn.addEventListener('click',()=>{
      if(confirm('¿Cerrás la sesión?')){ clearSession(); stopSessionBar(); location.reload(); }
    });

    // User label
    const userLabel = document.createElement('span');
    userLabel.style.cssText = 'color:rgba(245,232,216,0.5);font-family:"DM Mono",monospace;font-size:9px;letter-spacing:0.08em;white-space:nowrap;';
    userLabel.textContent = '👤 kokue';

    const topbarRight = topbar.querySelector('[class*="right"]') || topbar.lastElementChild;
    if(topbarRight){
      topbarRight.insertAdjacentElement('afterbegin', userLabel);
      topbarRight.insertAdjacentElement('beforeend', btn);
    } else {
      topbar.appendChild(userLabel);
      topbar.appendChild(btn);
    }
  }

  // ---- MOBILE SIDEBAR ----
  function injectMobileSidebar(){
    const sidebar = document.querySelector('.sidebar, [class*="sidebar"]');
    if(!sidebar) return;
    if(document.getElementById('kokue-mobile-toggle')) return;

    // Toggle button (mobile only)
    const toggle = document.createElement('button');
    toggle.id = 'kokue-mobile-toggle';
    toggle.innerHTML = '☰';
    toggle.style.cssText = `
      display:none;position:fixed;bottom:20px;right:20px;z-index:500;
      background:#3d2410;color:#f5e8d8;border:none;border-radius:50%;
      width:48px;height:48px;font-size:20px;cursor:pointer;
      box-shadow:0 4px 16px rgba(0,0,0,0.3);transition:background 0.15s;
    `;
    toggle.addEventListener('click',()=>{
      sidebar.classList.toggle('mobile-open');
      toggle.innerHTML = sidebar.classList.contains('mobile-open') ? '✕' : '☰';
    });
    document.body.appendChild(toggle);

    // Overlay to close sidebar on mobile
    const mobileOverlay = document.createElement('div');
    mobileOverlay.id = 'kokue-mobile-overlay';
    mobileOverlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:499;';
    mobileOverlay.addEventListener('click',()=>{
      sidebar.classList.remove('mobile-open');
      toggle.innerHTML = '☰';
    });
    document.body.appendChild(mobileOverlay);

    // CSS for mobile
    const style = document.createElement('style');
    style.textContent = `
      @media(max-width:768px){
        #kokue-mobile-toggle{ display:flex !important; align-items:center; justify-content:center; }
        .sidebar,.sidebar-hidden .sidebar{
          position:fixed !important; left:-280px !important; top:0 !important;
          height:100vh !important; width:260px !important; z-index:500 !important;
          transition:left 0.25s ease !important; opacity:1 !important;
          padding:1rem !important; pointer-events:auto !important;
          box-shadow:4px 0 20px rgba(0,0,0,0.2);
        }
        .sidebar.mobile-open{ left:0 !important; }
        .sidebar.mobile-open ~ #kokue-mobile-overlay,
        .sidebar.mobile-open + * + #kokue-mobile-overlay{ display:block !important; }
        #kokue-mobile-overlay{ display:none; }
        .layout{ grid-template-columns:1fr !important; }
        .kpi-strip,.kpi-grid,.comp-kpi-grid{ grid-template-columns:repeat(2,1fr) !important; }
        .chart-row,.evol-grid,.comp-selectors{ grid-template-columns:1fr !important; }
        .chart-box.full{ grid-column:1 !important; }
        .topbar{ flex-wrap:wrap; gap:4px; padding:0.5rem 1rem; }
        #kokue-global-nav{ order:3; width:100%; overflow-x:auto; padding-bottom:4px; }
        #kokue-global-nav::-webkit-scrollbar{ height:2px; }
        table{ font-size:11px; }
        thead th, tbody td, tfoot td{ padding:5px 8px !important; }
        .modal{ width:95% !important; max-height:92vh !important; }
        .modal-kpis{ grid-template-columns:repeat(2,1fr) !important; }
      }
      @media(max-width:480px){
        .kpi-strip,.kpi-grid,.comp-kpi-grid{ grid-template-columns:1fr !important; }
        .topbar-title{ display:none; }
      }
    `;
    document.head.appendChild(style);

    // Show mobile overlay when sidebar opens
    const obs = new MutationObserver(()=>{
      mobileOverlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
    });
    obs.observe(sidebar, {attributes:true, attributeFilter:['class']});
  }

  // ---- PRINT/PDF ----
  function injectPrintBtn(){
    const topbar = document.querySelector('.topbar, [class*="topbar"]');
    if(!topbar || document.getElementById('kokue-print-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'kokue-print-btn';
    btn.innerHTML = '🖨️';
    btn.title = 'Imprimir / Exportar PDF';
    btn.style.cssText = `
      background:transparent;border:0.5px solid rgba(245,232,216,0.2);
      color:rgba(245,232,216,0.6);font-size:14px;padding:4px 8px;border-radius:3px;
      cursor:pointer;transition:all 0.15s;
    `;
    btn.addEventListener('click',()=>window.print());
    const topbarRight = topbar.querySelector('[class*="right"]') || topbar.lastElementChild;
    if(topbarRight) topbarRight.insertAdjacentElement('afterbegin', btn);
  }

  // ---- LOGIN SCREEN ----
  function buildLoginHTML(extra=''){
    return `
      <div class="kokue-login-card">
        <div class="kokue-login-logo">
          <div class="kokue-login-brand">Kokue Tuja</div>
          <div class="kokue-login-sub">Sistema de Gestión</div>
        </div>
        <div class="kokue-login-form">
          ${extra}
          <div class="kokue-login-field">
            <label class="kokue-login-label">Usuario</label>
            <input class="kokue-login-input" id="kl-user" type="text" placeholder="usuario" autocomplete="username" />
          </div>
          <div class="kokue-login-field">
            <label class="kokue-login-label">Contraseña</label>
            <input class="kokue-login-input" id="kl-pass" type="password" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <div class="kokue-login-error" id="kl-error" style="display:none"></div>
          <button class="kokue-login-btn" id="kl-btn">Ingresar →</button>
        </div>
        <div class="kokue-login-footer">Kokue Tuja S.R.L. · Acceso restringido</div>
      </div>`;
  }

  function attachLoginHandler(onSuccess){
    function tryLogin(){
      const u = (document.getElementById('kl-user').value||'').trim().toLowerCase();
      const p = document.getElementById('kl-pass').value||'';
      const err = document.getElementById('kl-error');
      const btn = document.getElementById('kl-btn');
      if(!u||!p){ err.style.display='block'; err.textContent='Completá usuario y contraseña'; return; }
      btn.textContent='Verificando…'; btn.disabled=true;
      setTimeout(()=>{
        if(u===CONFIG.user && p===CONFIG.pass){
          saveSession();
          onSuccess();
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
    setTimeout(()=>document.getElementById('kl-user')?.focus(), 100);
  }

  function showLogin(){
    // Inject CSS if not already
    if(!document.querySelector('link[href="login.css"]')){
      const link = document.createElement('link');
      link.rel='stylesheet'; link.href='login.css';
      document.head.appendChild(link);
    }
    const overlay = document.createElement('div');
    overlay.id = 'kokue-login-overlay';
    overlay.innerHTML = buildLoginHTML();
    document.body.insertAdjacentElement('afterbegin', overlay);
    attachLoginHandler(()=>{
      overlay.style.opacity='0'; overlay.style.transition='opacity 0.3s';
      setTimeout(()=>{ overlay.remove(); onAuthenticated(); }, 300);
    });
  }

  function showTimeoutLogin(){
    // Remove existing overlay if any
    document.getElementById('kokue-login-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'kokue-login-overlay';
    overlay.innerHTML = buildLoginHTML(`<div class="kokue-login-error" style="display:block;margin-bottom:0.5rem">⏱ Sesión cerrada por inactividad (15 min)</div>`);
    document.body.insertAdjacentElement('afterbegin', overlay);
    attachLoginHandler(()=>{
      overlay.style.opacity='0'; overlay.style.transition='opacity 0.3s';
      setTimeout(()=>{ overlay.remove(); startListeners(); startSessionBar(); }, 300);
    });
  }

  function onAuthenticated(){
    injectNav();
    injectLogoutBtn();
    injectMobileSidebar();
    injectPrintBtn();
    startListeners();
  }

  // ---- INIT ----
  function init(){
    if(isAuth()){
      onAuthenticated();
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
