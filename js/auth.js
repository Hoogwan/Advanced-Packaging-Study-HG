// Auth module: Supabase Auth + owner check + login popover UI.
// Exposes window.auth = { isLoggedIn, isOwner, signIn, signOut, onAuthChange }
(function () {
  'use strict';

  const cfg = window.APP_CONFIG;
  if (!cfg || !window.supabase) {
    console.error('[auth] Missing APP_CONFIG or supabase-js. Check script load order.');
    return;
  }

  const client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON);
  window.supabaseClient = client; // shared with data-store.js

  let session = null;
  let ownerEmail = null;   // fetched once from public.app_config
  let isOwnerFlag = false;
  const listeners = [];

  function notify() {
    listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('[auth] listener error', e); }
    });
  }

  async function fetchOwnerEmail() {
    if (ownerEmail !== null) return ownerEmail;
    try {
      const { data, error } = await client
        .from('app_config')
        .select('value')
        .eq('key', 'owner_email')
        .maybeSingle();
      if (error) { console.error('[auth] owner_email fetch error', error); return null; }
      ownerEmail = data ? data.value : '';
      return ownerEmail;
    } catch (e) {
      console.error('[auth] owner_email fetch failed', e);
      return null;
    }
  }

  async function refreshOwnerFlag() {
    if (!session || !session.user || !session.user.email) {
      isOwnerFlag = false;
      return;
    }
    const email = await fetchOwnerEmail();
    isOwnerFlag = !!email && email.trim().toLowerCase() === session.user.email.trim().toLowerCase();
  }

  async function init() {
    const { data } = await client.auth.getSession();
    session = data && data.session ? data.session : null;
    await refreshOwnerFlag();
    renderWidget();
    notify();

    client.auth.onAuthStateChange(async (_event, newSession) => {
      session = newSession;
      await refreshOwnerFlag();
      renderWidget();
      notify();
    });
  }

  // ============ Public API ============
  window.auth = {
    isLoggedIn() { return !!session; },
    isOwner() { return isOwnerFlag; },
    getEmail() { return session && session.user ? session.user.email : null; },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    async signOut() {
      await client.auth.signOut();
    },
    onAuthChange(cb) {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    }
  };

  // ============ UI: login popover ============
  let widgetEl = null;

  function ensureWidget() {
    if (widgetEl) return widgetEl;
    const header = document.querySelector('.header-meta') || document.querySelector('header.site-header');
    if (!header) return null;
    widgetEl = document.createElement('div');
    widgetEl.id = 'auth-widget';
    widgetEl.className = 'auth-widget';
    header.parentElement.appendChild(widgetEl);
    document.addEventListener('click', (e) => {
      const popover = document.getElementById('auth-popover');
      if (!popover) return;
      if (!widgetEl.contains(e.target)) popover.remove();
    });
    return widgetEl;
  }

  function closePopover() {
    const p = document.getElementById('auth-popover');
    if (p) p.remove();
  }

  function openLoginPopover() {
    closePopover();
    const pop = document.createElement('div');
    pop.id = 'auth-popover';
    pop.className = 'auth-popover';
    pop.innerHTML = `
      <form id="auth-login-form">
        <div class="auth-popover-title">Owner Log In</div>
        <input type="email" name="email" placeholder="Email" autocomplete="username" required>
        <input type="password" name="password" placeholder="Password" autocomplete="current-password" required>
        <div class="auth-error" id="auth-error" style="display:none;"></div>
        <div class="auth-popover-actions">
          <button type="button" class="btn-secondary" id="auth-cancel">Cancel</button>
          <button type="submit" class="btn-primary" id="auth-submit">Log in</button>
        </div>
      </form>
    `;
    widgetEl.appendChild(pop);
    pop.querySelector('#auth-cancel').addEventListener('click', closePopover);
    const form = pop.querySelector('#auth-login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const errEl = pop.querySelector('#auth-error');
      const submitBtn = pop.querySelector('#auth-submit');
      errEl.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Logging in...';
      try {
        await window.auth.signIn(fd.get('email').trim(), fd.get('password'));
        closePopover();
      } catch (err) {
        errEl.textContent = (err && err.message) || 'Login failed';
        errEl.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log in';
      }
    });
    form.querySelector('input[name="email"]').focus();
  }

  function renderWidget() {
    const el = ensureWidget();
    if (!el) return;
    closePopover();
    if (session && session.user) {
      el.innerHTML = `
        <span class="auth-email" title="${session.user.email}">${session.user.email}</span>
        <button class="auth-btn" id="auth-logout-btn">Log out</button>
        ${isOwnerFlag ? '<span class="auth-owner-badge" title="Owner — edit mode">Owner</span>' : ''}
      `;
      el.querySelector('#auth-logout-btn').addEventListener('click', async () => {
        await window.auth.signOut();
      });
    } else {
      el.innerHTML = `<button class="auth-btn" id="auth-login-btn">Log in</button>`;
      el.querySelector('#auth-login-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openLoginPopover();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
