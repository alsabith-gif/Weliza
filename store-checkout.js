// Weliza single-page store: checkout and order tracking open on top of the home page (no page change)
(function () {
  const API = 'https://gnvmqtoakysrhfetwnra.supabase.co/rest/v1/';
  const KEY = 'sb_publishable__OycmvH5Og0XZ-jrco2o2A_BbZ_Usje';
  const CART_KEY = 'weliza_cart_v1';
  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const STATES = ['Kerala', 'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
  const STEPS = [['new', 'Order placed'], ['confirmed', 'Confirmed'], ['packed', 'Packed'], ['shipped', 'Shipped'], ['delivered', 'Delivered']];
  let cart = [], S = null, disc = 0, code = '';

  async function get(path) { const r = await fetch(API + path, { headers: H }); if (!r.ok) throw new Error('load'); return r.json(); }
  async function rpc(fn, body) {
    const r = await fetch(API + 'rpc/' + fn, { method: 'POST', headers: H, body: JSON.stringify(body) });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error((d && d.message) || 'Something went wrong. Please try again.');
    return d;
  }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} window.dispatchEvent(new Event('weliza-cart')); };

  function ensure(id, width) {
    let ov = $(id); if (ov) return ov;
    ov = document.createElement('div'); ov.id = id; ov.className = 'sh-ov'; ov.hidden = true;
    ov.innerHTML = `<div class="sh-modal" style="max-width:${width}px"><button class="sh-x" type="button" aria-label="Close">✕</button><div class="ov-body"></div></div>`;
    document.body.appendChild(ov);
    const close = () => { ov.hidden = true; document.body.style.overflow = ''; };
    ov.querySelector('.sh-x').onclick = close;
    ov.onclick = e => { if (e.target === ov || e.target.closest('[data-close]')) close(); };
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
    return ov;
  }
  const show = ov => { const c = $('stCart'); if (c) c.hidden = true; ov.hidden = false; document.body.style.overflow = 'hidden'; ov.scrollTop = 0; };

  /* ---------- CHECKOUT ---------- */
  async function refresh() {
    try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }
    if (!cart.length) return [];
    const rows = await get('store_product_variants?select=id,size,color,stock,price_override,is_active,store_products(id,name,price,track_stock,is_active,image_urls)&id=in.(' + cart.map(i => i.id).join(',') + ')');
    const by = {}; rows.forEach(r => by[r.id] = r);
    const msgs = [];
    cart = cart.map(i => {
      const r = by[i.id], p = r && r.store_products;
      if (!r || !r.is_active || !p || !p.is_active || (p.track_stock && r.stock <= 0)) { msgs.push(i.name + ' is no longer available and was removed.'); return null; }
      const max = p.track_stock ? r.stock : 20, q = Math.min(i.qty, max, 20);
      if (q < i.qty) msgs.push('Only ' + q + ' of ' + p.name + ' available.');
      return { ...i, qty: q, price: r.price_override ?? p.price, name: p.name, img: (p.image_urls || [])[0] || '', max };
    }).filter(Boolean);
    saveCart();
    return msgs;
  }
  function totals() {
    const sub = cart.reduce((a, i) => a + i.price * i.qty, 0), after = sub - disc;
    const ship = Number(S.free_shipping_above) > 0 && after >= Number(S.free_shipping_above) ? 0 : Number(S.shipping_flat);
    const cod = Number(S.cod_fee);
    return { sub, ship, cod, total: after + ship + cod };
  }
  function drawSum() {
    const t = totals();
    $('coSum').innerHTML = cart.map(i => `<div class="sh-item" style="grid-template-columns:52px 1fr auto">
      ${i.img ? `<img src="${esc(i.img)}" alt="" style="width:52px;height:52px">` : '<div></div>'}
      <div>${esc(i.name)}<br><small>${esc(i.label)} × ${i.qty}</small></div><strong>${money(i.price * i.qty)}</strong></div>`).join('') +
      `<div class="ck-line"><span>Subtotal</span><span>${money(t.sub)}</span></div>` +
      (disc ? `<div class="ck-line"><span>Discount</span><span>− ${money(disc)}</span></div>` : '') +
      `<div class="ck-line"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>` +
      (t.cod ? `<div class="ck-line"><span>Cash on Delivery fee</span><span>${money(t.cod)}</span></div>` : '') +
      `<div class="ck-line ck-total"><span>Total</span><span>${money(t.total)}</span></div>`;
  }

  async function openCheckout() {
    const ov = ensure('coOv', 980), body = ov.querySelector('.ov-body'); disc = 0; code = '';
    body.innerHTML = '<h2 class="sh-title" style="margin:0 0 14px">Checkout</h2><p class="sh-msg">Loading…</p>'; show(ov);
    try {
      [S] = await get('store_settings?id=eq.1&select=*');
      const msgs = await refresh();
      if (!cart.length) { body.innerHTML = '<h2 class="sh-title" style="margin:0 0 14px">Checkout</h2><p class="sh-msg">Your cart is empty. <a href="#catalog" data-close>Browse the catalog</a></p>'; return; }
      body.innerHTML = `<h2 class="sh-title" style="margin:0 0 14px">Checkout</h2><div class="ck-grid">
      <form id="coForm" class="ck-card"><h2>Delivery details</h2>
        <label>Full name *<input name="name" required maxlength="80" autocomplete="name"></label>
        <label>Phone number *<input name="phone" required inputmode="tel" pattern="[0-9+ ]{10,15}" maxlength="15" autocomplete="tel" placeholder="10 digit mobile number"></label>
        <label>Email (optional)<input name="email" type="email" maxlength="80" autocomplete="email"></label>
        <label>Address *<textarea name="address_line" required rows="2" maxlength="250" autocomplete="street-address" placeholder="House name / number, street, area"></textarea></label>
        <div class="ck-row"><label>City / Town *<input name="city" required maxlength="60" autocomplete="address-level2"></label>
          <label>Pincode *<input name="pincode" required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="postal-code"></label></div>
        <label>State *<select name="state" required>${STATES.map(x => `<option>${x}</option>`).join('')}</select></label>
        <label>Note to seller (optional)<textarea name="note" rows="2" maxlength="500" placeholder="Measurements for made-to-measure items, or any request"></textarea></label>
        <h2>Payment</h2>
        ${S.cod_enabled ? '<label class="ck-radio"><input type="radio" checked> Cash on Delivery <small>Pay when your order arrives</small></label>' : '<p class="ck-err">Cash on Delivery is not available right now.</p>'}
        <label class="ck-radio" style="opacity:.5"><input type="radio" disabled> Net banking <small>Coming soon</small></label>
        <p class="ck-err" id="coErr" ${msgs.length ? '' : 'hidden'}>${esc(msgs.join(' '))}</p>
        <button class="sh-btn" id="coBtn" type="submit" ${S.cod_enabled ? '' : 'disabled'}>Place order</button>
        <p class="sh-note" style="margin-top:10px">By placing your order you agree to our <a href="terms-of-service.html" target="_blank">Terms</a>, <a href="return-policy.html" target="_blank">Return Policy</a> and <a href="shipping-policy.html" target="_blank">Shipping Policy</a>.</p></form>
      <aside class="ck-card"><h2>Order summary</h2><div id="coSum"></div>
        <div class="ck-coupon"><input id="coCode" placeholder="Coupon code"><button type="button" id="coApply" class="sh-quick" style="width:auto;margin:0">Apply</button></div><p class="sh-note" id="coMsg"></p></aside></div>`;
      drawSum();
      $('coApply').onclick = async () => {
        const c = $('coCode').value.trim(); if (!c) return;
        try {
          const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
          const r = await rpc('store_check_coupon', { p_code: c, p_subtotal: sub });
          disc = r.valid ? Number(r.discount) : 0; code = r.valid ? c : '';
          $('coMsg').textContent = r.message; drawSum();
        } catch (e) { $('coMsg').textContent = e.message; }
      };
      $('coForm').onsubmit = async e => {
        e.preventDefault();
        const f = new FormData($('coForm')), btn = $('coBtn');
        $('coErr').hidden = true; btn.disabled = true; btn.textContent = 'Placing your order…';
        try {
          const res = await rpc('store_place_order', {
            p_customer: Object.fromEntries(f.entries()),
            p_items: cart.map(i => ({ variant_id: i.id, qty: i.qty })),
            p_payment_method: 'cod', p_coupon: code || null
          });
          cart = []; saveCart();
          body.innerHTML = `<div style="text-align:center;max-width:520px;margin:10px auto"><h2 class="sh-title">Thank you! 🎉</h2><p>Your order has been placed.</p>
            <p style="font-size:1.3rem"><strong>Order number: ${esc(res.order_no)}</strong></p>
            <p>Total to pay on delivery: <strong>${money(res.total)}</strong></p>
            <p class="sh-note">Please keep your order number and phone number. You can track your order any time.</p>
            <button class="sh-btn" id="coTrack" type="button" style="margin-bottom:10px">Track my order</button>
            <a href="#catalog" data-close>Continue shopping</a></div>`;
          $('coTrack').onclick = () => { ov.querySelector('.sh-x').click(); openTrack(res.order_no); };
          ov.scrollTop = 0;
        } catch (ex) { $('coErr').hidden = false; $('coErr').textContent = ex.message; btn.disabled = false; btn.textContent = 'Place order'; }
      };
    } catch (e) { body.innerHTML = '<h2 class="sh-title" style="margin:0 0 14px">Checkout</h2><p class="sh-msg">Sorry, checkout could not load. Please try again.</p>'; }
  }

  /* ---------- TRACK ORDER ---------- */
  function openTrack(no) {
    const ov = ensure('tkOv', 620), body = ov.querySelector('.ov-body');
    body.innerHTML = `<h2 class="sh-title" style="margin:0 0 14px">Track your order</h2>
      <form id="tkForm" class="ck-card"><label>Order number<input id="tkNo" required placeholder="WL-1001" value="${esc(no || '')}"></label>
      <label>Phone number used for the order<input id="tkPh" required inputmode="tel" placeholder="10 digit mobile number"></label>
      <button class="sh-btn" type="submit">Track</button></form><div id="tkOut"></div>`;
    show(ov); if (no) $('tkPh').focus();
    $('tkForm').onsubmit = async e => {
      e.preventDefault(); $('tkOut').innerHTML = '<p class="sh-msg">Checking…</p>';
      try {
        const d = await rpc('store_track_order', { p_order_no: $('tkNo').value, p_phone: $('tkPh').value });
        if (!d || !d.found) { $('tkOut').innerHTML = '<p class="ck-err">We could not find this order. Please check the order number and phone number.</p>'; return; }
        const idx = STEPS.map(s => s[0]).indexOf(d.order_status);
        const bar = d.order_status === 'cancelled' ? '<p class="ck-err">This order was cancelled.</p>' :
          '<div class="tk-steps">' + STEPS.map((s, i) => `<div class="tk-step ${i <= idx ? 'on' : ''}"><span></span>${s[1]}</div>`).join('') + '</div>';
        $('tkOut').innerHTML = `<div class="ck-card" style="margin-top:16px"><h2>Order ${esc(d.order_no)}</h2>${bar}
          ${d.courier || d.tracking_no ? `<p>Courier: <strong>${esc(d.courier || '-')}</strong><br>Tracking number: <strong>${esc(d.tracking_no || '-')}</strong></p>` : ''}
          ${d.items.map(i => `<div class="ck-line"><span>${esc(i.name)} (${esc(i.size)}${i.color ? ' / ' + esc(i.color) : ''}) × ${i.qty}</span><span>${money(i.line_total)}</span></div>`).join('')}
          <div class="ck-line ck-total"><span>Total${d.payment_method === 'cod' ? ' (pay on delivery)' : ''}</span><span>${money(d.total)}</span></div></div>`;
      } catch (ex) { $('tkOut').innerHTML = `<p class="ck-err">${esc(ex.message)}</p>`; }
    };
  }

  // Links to the old checkout / track pages now open the pop-ups on this same page
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a) return;
    const h = a.getAttribute('href');
    if (h === 'checkout.html') { e.preventDefault(); openCheckout(); }
    else if (h === 'track.html') { e.preventDefault(); openTrack(); }
  });
  // Links like index.html#track or index.html#checkout open the pop-ups
  function hashOpen() {
    const h = location.hash;
    if (h === '#track') { history.replaceState(null, '', location.pathname); openTrack(); }
    else if (h === '#checkout') { history.replaceState(null, '', location.pathname); openCheckout(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hashOpen); else hashOpen();
  window.addEventListener('hashchange', hashOpen);
})();
