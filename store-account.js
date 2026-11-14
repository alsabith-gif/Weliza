// Weliza customer accounts: sign up, log in, profile and order history (inside the home page)
(function () {
  const BASE = 'https://gnvmqtoakysrhfetwnra.supabase.co';
  const KEY = 'sb_publishable__OycmvH5Og0XZ-jrco2o2A_BbZ_Usje';
  const SK = 'weliza_cust_session';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const fmt = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const STATES = ['Kerala', 'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
  const STEPS = [['new', 'Order placed'], ['confirmed', 'Confirmed'], ['packed', 'Packed'], ['shipped', 'Shipped'], ['delivered', 'Delivered']];
  const NAME = { new: 'Order placed', confirmed: 'Confirmed', packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', return_requested: 'Return requested', returned: 'Returned' };
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';
  let sess = null, prof, then = null, refreshing = null;
  try { sess = JSON.parse(localStorage.getItem(SK)); } catch (e) {}

  function toast(m) { const t = $('stToast'); if (!t) return; t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2400); }
  function friendly(d) {
    const m = d.error_description || d.msg || d.message || 'Something went wrong. Please try again.';
    if (/invalid login/i.test(m)) return 'Wrong email or password.';
    if (/already registered|already been registered/i.test(m)) return 'This email already has an account. Please log in.';
    if (/rate limit/i.test(m)) return 'Too many tries. Please wait a few minutes and try again.';
    if (/password/i.test(m) && /(6|least)/.test(m)) return 'Password must be at least 6 characters.';
    return m;
  }
  async function api(path, body) {
    const r = await fetch(BASE + '/auth/v1/' + path, { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(friendly(d));
    return d;
  }
  const pack = d => ({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
    uid: (d.user && d.user.id) || (sess && sess.uid), email: (d.user && d.user.email) || (sess && sess.email) });
  function save(s) { sess = s; if (!s) prof = undefined; try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch (e) {} paint(); }
  async function token() {
    if (!sess) return null;
    if (sess.expires_at - 60 > Date.now() / 1000) return sess.access_token;
    if (!refreshing) refreshing = api('token?grant_type=refresh_token', { refresh_token: sess.refresh_token }).then(d => { save(pack(d)); return sess.access_token; }).catch(() => { save(null); return null; }).finally(() => { refreshing = null; });
    return refreshing;
  }
  async function db(path, method = 'GET', body, prefer) {
    const t = await token(); if (!t) throw new Error('Please log in again.');
    const r = await fetch(BASE + '/rest/v1/' + path, { method, headers: { apikey: KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json', Prefer: prefer || 'return=representation' }, body: body ? JSON.stringify(body) : undefined });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error((d && d.message) || 'Request failed');
    return d;
  }
  async function profile(force) {
    if (!sess) return null;
    if (prof === undefined || force) { try { const r = await db('store_customers?user_id=eq.' + sess.uid + '&select=*'); prof = r[0] || null; } catch (e) { prof = null; } }
    return prof;
  }
  async function saveProfile(data) {
    const r = await db('store_customers?on_conflict=user_id', 'POST', { user_id: sess.uid, ...data }, 'resolution=merge-duplicates,return=representation');
    prof = r[0] || prof; return prof;
  }

  function ov(id, width) {
    let x = $(id); if (x) return x;
    x = document.createElement('div'); x.id = id; x.className = 'sh-ov'; x.hidden = true;
    x.innerHTML = `<div class="sh-modal" style="max-width:${width}px"><button class="sh-x" type="button" aria-label="Close">✕</button><div class="ov-body"></div></div>`;
    document.body.appendChild(x);
    const close = () => { x.hidden = true; document.body.style.overflow = ''; };
    x.querySelector('.sh-x').onclick = close;
    x.onclick = e => { if (e.target === x) close(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !x.hidden) close(); });
    return x;
  }
  const show = x => { const c = $('stCart'); if (c) c.hidden = true; x.hidden = false; document.body.style.overflow = 'hidden'; x.scrollTop = 0; };

  function openLogin(o = {}) {
    then = o.then || null;
    const x = ov('lgOv', 440), b = x.querySelector('.ov-body'); let mode = 'in';
    const draw = () => {
      if (mode === 'forgot') {
        b.innerHTML = `<h2 class="sh-title" style="margin:0 0 6px">Reset your password</h2><p class="sh-note" style="margin:0 0 12px">Enter your email and we will send you a link to choose a new password.</p>
          <form id="fgForm" class="ck-card" style="box-shadow:none;padding:0"><label>Email *<input name="email" type="email" required autocomplete="email"></label>
          <p class="ck-err" id="fgMsg" hidden></p><button class="sh-btn" id="fgBtn" type="submit">Send reset link</button></form>
          <p class="sh-note" style="text-align:center;margin-top:14px"><a href="#" id="fgBack">Back to log in</a></p>`;
        $('fgBack').onclick = e => { e.preventDefault(); mode = 'in'; draw(); };
        $('fgForm').onsubmit = async e => {
          e.preventDefault(); const m = $('fgMsg'), btn = $('fgBtn'); btn.disabled = true; m.hidden = false; m.style.color = '';
          try { await api('recover', { email: new FormData(e.target).get('email').trim() }); m.style.color = '#2e7d4f'; m.textContent = 'If this email has an account, a reset link is on its way. Please check your inbox and spam folder.'; }
          catch (ex) { m.textContent = ex.message; btn.disabled = false; }
        };
        return;
      }
      b.innerHTML = `<h2 class="sh-title" style="margin:0 0 6px">${mode === 'in' ? 'Log in' : 'Create your account'}</h2>
        ${o.message ? `<p class="sh-note" style="margin:0 0 12px">${esc(o.message)}</p>` : ''}
        <form id="lgForm" class="ck-card" style="box-shadow:none;padding:0">
          ${mode === 'up' ? '<label>Full name *<input name="name" required maxlength="80" autocomplete="name"></label><label>Phone number *<input name="phone" required inputmode="tel" pattern="[0-9+ ]{10,15}" maxlength="15" autocomplete="tel" placeholder="10 digit mobile number"></label>' : ''}
          <label>Email *<input name="email" type="email" required autocomplete="email"></label>
          <label>Password *<input name="password" type="password" required minlength="6" autocomplete="${mode === 'in' ? 'current-password' : 'new-password'}" ${mode === 'up' ? 'placeholder="At least 6 characters"' : ''}></label>
          ${mode === 'in' ? '<p style="text-align:right;margin:-4px 0 10px"><a href="#" data-fg="1">Forgot password?</a></p>' : ''}
          <p class="ck-err" id="lgErr" hidden></p><button class="sh-btn" id="lgBtn" type="submit">${mode === 'in' ? 'Log in' : 'Create account'}</button></form>
        <p class="sh-note" style="text-align:center;margin-top:14px">${mode === 'in' ? 'New here? <a href="#" data-sw="up">Create an account</a>' : 'Already have an account? <a href="#" data-sw="in">Log in</a>'}</p>`;
      const fg = b.querySelector('[data-fg]'); if (fg) fg.onclick = e => { e.preventDefault(); mode = 'forgot'; draw(); };
      b.querySelector('[data-sw]').onclick = e => { e.preventDefault(); mode = e.target.dataset.sw; draw(); };
      $('lgForm').onsubmit = submit;
    };
    async function submit(e) {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries()), btn = $('lgBtn'), err = $('lgErr');
      err.hidden = true; btn.disabled = true;
      try {
        if (mode === 'up') {
          const d = await api('signup', { email: f.email.trim(), password: f.password, data: { name: f.name.trim(), phone: f.phone.trim() } });
          if (!d.access_token) { err.hidden = false; err.textContent = 'Account created. Please check your email to confirm it, then log in.'; btn.disabled = false; return; }
          save(pack(d)); await saveProfile({ name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() }).catch(() => {});
        } else { save(pack(await api('token?grant_type=password', { email: f.email.trim(), password: f.password }))); await profile(true); }
        const cb = then; then = null; x.querySelector('.sh-x').click(); toast('Welcome to Weliza!'); if (cb) cb();
      } catch (ex) { err.hidden = false; err.textContent = ex.message; btn.disabled = false; }
    }
    draw(); show(x);
  }

  async function openAccount() {
    if (!sess) { openLogin(); return; }
    const x = ov('acOv', 760), b = x.querySelector('.ov-body');
    b.innerHTML = `<div class="ac-head"><div><h2 class="sh-title" style="margin:0">My Account</h2><small>${esc(sess.email)}</small></div><button class="sh-quick" id="acOut" type="button" style="width:auto;margin:0">Log out</button></div>
      <div class="al-chips"><button class="al-chip on" data-t="orders" type="button">My Orders</button><button class="al-chip" data-t="profile" type="button">My Profile</button></div><div id="acBody"></div>`;
    show(x);
    $('acOut').onclick = () => { save(null); x.querySelector('.sh-x').click(); toast('Logged out'); };
    b.querySelector('.al-chips').onclick = e => { const t = e.target.dataset.t; if (!t) return; b.querySelectorAll('.al-chip').forEach(c => c.classList.toggle('on', c === e.target)); (t === 'orders' ? orders : editProfile)(); };
    orders();
  }

  async function orders() {
    const body = $('acBody'); body.innerHTML = '<p class="sh-msg">Loading…</p>';
    try {
      const list = await db('store_orders?select=*,store_order_items(*)&order=created_at.desc&limit=50');
      body.innerHTML = list.length ? list.map(o => {
        const idx = STEPS.map(s => s[0]).indexOf(o.order_status);
        const bar = o.order_status === 'cancelled' ? '<p class="ck-err">This order was cancelled.</p>' : '<div class="tk-steps">' + STEPS.map((s, i) => `<div class="tk-step ${i <= idx ? 'on' : ''}"><span></span>${s[1]}</div>`).join('') + '</div>';
        return `<div class="ck-card" style="margin-bottom:14px"><div class="ck-line"><strong>${esc(o.order_no)}</strong><span>${NAME[o.order_status] || o.order_status}</span></div>
          <small>${fmt(o.created_at)} · ${o.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'}</small>${bar}
          ${o.courier || o.tracking_no ? `<p style="margin:0 0 8px">Courier: <strong>${esc(o.courier || '-')}</strong> · Tracking: <strong>${esc(o.tracking_no || '-')}</strong></p>` : ''}
          ${(o.store_order_items || []).map(i => `<div class="ck-line"><span>${esc(i.product_name)} (${esc(i.size || '')}${i.color ? ' / ' + esc(i.color) : ''}) × ${i.qty}</span><span>${money(i.line_total)}</span></div>`).join('')}
          <div class="ck-line ck-total"><span>Total</span><span>${money(o.total)}</span></div>
          ${['new', 'confirmed'].includes(o.order_status) ? `<button class="sh-quick" type="button" data-cx="${o.id}" style="margin-top:10px">Cancel this order</button>` : ''}</div>`;
      }).join('') : '<p class="sh-msg">You have not placed any orders yet.</p>';
      body.onclick = async e => {
        const id = e.target.dataset.cx; if (!id || !confirm('Cancel this order?')) return;
        try { await db('rpc/store_customer_cancel_order', 'POST', { p_order_id: id }); toast('Order cancelled'); orders(); } catch (ex) { toast(ex.message); }
      };
    } catch (e) { body.innerHTML = `<p class="ck-err">${esc(e.message)}</p>`; }
  }

  async function editProfile() {
    const body = $('acBody'), p = (await profile(true)) || {};
    body.innerHTML = `<form id="acForm" class="ck-card"><label>Full name *<input name="name" required maxlength="80" value="${esc(p.name)}"></label>
      <label>Phone number *<input name="phone" required inputmode="tel" pattern="[0-9+ ]{10,15}" maxlength="15" value="${esc(p.phone)}"></label>
      <label>Email<input value="${esc(sess.email)}" disabled></label><h2>Saved address</h2>
      <label>Address<textarea name="address_line" rows="2" maxlength="250">${esc(p.address_line)}</textarea></label>
      <div class="ck-row"><label>City / Town<input name="city" maxlength="60" value="${esc(p.city)}"></label><label>Pincode<input name="pincode" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" value="${esc(p.pincode)}"></label></div>
      <label>State<select name="state">${STATES.map(s => `<option ${s === (p.state || 'Kerala') ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <p class="ck-err" id="acErr" hidden></p><button class="sh-btn" type="submit">Save profile</button></form>`;
    $('acForm').onsubmit = async e => {
      e.preventDefault(); const f = Object.fromEntries(new FormData(e.target).entries());
      try { await saveProfile({ name: f.name.trim(), phone: f.phone.trim(), email: sess.email, address_line: f.address_line.trim() || null, city: f.city.trim() || null, state: f.state, pincode: f.pincode.trim() || null }); toast('Profile saved'); }
      catch (ex) { $('acErr').hidden = false; $('acErr').textContent = ex.message; }
    };
  }

  async function handleRecovery() {
    const h = new URLSearchParams(location.hash.slice(1));
    if (h.get('type') !== 'recovery' || !h.get('access_token')) return;
    const at = h.get('access_token'), rt = h.get('refresh_token'), ex = +h.get('expires_in') || 3600;
    history.replaceState(null, '', location.pathname);
    try {
      const u = await (await fetch(BASE + '/auth/v1/user', { headers: { apikey: KEY, Authorization: 'Bearer ' + at } })).json();
      if (!u.id) throw new Error('bad');
      save({ access_token: at, refresh_token: rt, expires_at: Math.floor(Date.now() / 1000) + ex, uid: u.id, email: u.email });
    } catch (e) { toast('This reset link has expired. Please try again.'); return; }
    const x = ov('npOv', 440), b = x.querySelector('.ov-body');
    b.innerHTML = `<h2 class="sh-title" style="margin:0 0 6px">Choose a new password</h2><form id="npForm" class="ck-card" style="box-shadow:none;padding:0">
      <label>New password *<input name="password" type="password" required minlength="6" autocomplete="new-password" placeholder="At least 6 characters"></label>
      <p class="ck-err" id="npErr" hidden></p><button class="sh-btn" type="submit">Save new password</button></form>`;
    show(x);
    $('npForm').onsubmit = async e => {
      e.preventDefault();
      try {
        const r = await fetch(BASE + '/auth/v1/user', { method: 'PUT', headers: { apikey: KEY, Authorization: 'Bearer ' + (await token()), 'Content-Type': 'application/json' }, body: JSON.stringify({ password: new FormData(e.target).get('password') }) });
        const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(friendly(d));
        x.querySelector('.sh-x').click(); toast('Password updated. You are logged in.');
      } catch (er) { $('npErr').hidden = false; $('npErr').textContent = er.message; }
    };
  }

  function paint() { document.querySelectorAll('.st-acct').forEach(b => { b.classList.toggle('on', !!sess); b.title = sess ? 'My account' : 'Log in'; }); }
  function init() {
    const b = document.createElement('button');
    b.className = 'st-acct'; b.type = 'button'; b.setAttribute('aria-label', 'Account'); b.innerHTML = ICON;
    b.onclick = () => (sess ? openAccount() : openLogin());
    const c = document.querySelector('.st-cart'), t = $('menuToggle');
    if (c) c.before(b); else if (t) t.before(b); else $('navbar').appendChild(b);
    paint(); handleRecovery();
  }
  window.WelizaAuth = { token, profile, saveProfile, openLogin, isIn: () => !!sess, email: () => sess && sess.email };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
