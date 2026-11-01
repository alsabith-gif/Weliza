(function () {
  const API = 'https://gnvmqtoakysrhfetwnra.supabase.co/rest/v1/';
  const KEY = 'sb_publishable__OycmvH5Og0XZ-jrco2o2A_BbZ_Usje';
  const CART_KEY = 'weliza_cart_v1';
  const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' };
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const STATES = ['Kerala', 'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
  let cart = [], S = null, disc = 0, code = '';

  async function get(path) { const r = await fetch(API + path, { headers: H }); if (!r.ok) throw new Error('load'); return r.json(); }
  async function rpc(fn, body) {
    const r = await fetch(API + 'rpc/' + fn, { method: 'POST', headers: H, body: JSON.stringify(body) });
    const d = await r.json().catch(() => null);
    if (!r.ok) throw new Error((d && d.message) || 'Something went wrong. Please try again.');
    return d;
  }
  const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} };

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
    $('ckSum').innerHTML = cart.map(i => `<div class="sh-item" style="grid-template-columns:52px 1fr auto">
      ${i.img ? `<img src="${esc(i.img)}" alt="" style="width:52px;height:52px">` : '<div></div>'}
      <div>${esc(i.name)}<br><small>${esc(i.label)} × ${i.qty}</small></div><strong>${money(i.price * i.qty)}</strong></div>`).join('') +
      `<div class="ck-line"><span>Subtotal</span><span>${money(t.sub)}</span></div>` +
      (disc ? `<div class="ck-line"><span>Discount</span><span>− ${money(disc)}</span></div>` : '') +
      `<div class="ck-line"><span>Shipping</span><span>${t.ship ? money(t.ship) : 'Free'}</span></div>` +
      (t.cod ? `<div class="ck-line"><span>Cash on Delivery fee</span><span>${money(t.cod)}</span></div>` : '') +
      `<div class="ck-line ck-total"><span>Total</span><span>${money(t.total)}</span></div>`;
  }

  async function init() {
    try {
      const [s] = await get('store_settings?id=eq.1&select=*'); S = s;
      const msgs = await refresh();
      if (!cart.length) { $('ckLoad').innerHTML = 'Your cart is empty. <a href="index.html">Go to the shop</a>'; return; }
      $('ckState').innerHTML = STATES.map(x => `<option>${x}</option>`).join('');
      $('ckPay').innerHTML = (S.cod_enabled
        ? `<label class="ck-radio"><input type="radio" checked> Cash on Delivery <small>Pay when your order arrives</small></label>`
        : '<p class="ck-err">Cash on Delivery is not available right now.</p>') +
        '<label class="ck-radio" style="opacity:.5"><input type="radio" disabled> Net banking <small>Coming soon</small></label>';
      if (!S.cod_enabled) $('ckBtn').disabled = true;
      $('ckLoad').hidden = true; $('ckGrid').hidden = false; drawSum();
      if (msgs.length) { $('ckErr').hidden = false; $('ckErr').textContent = msgs.join(' '); }
    } catch (e) { $('ckLoad').textContent = 'Sorry, checkout could not load. Please refresh the page.'; }
  }

  $('ckApply').onclick = async () => {
    const c = $('ckCode').value.trim(); if (!c) return;
    try {
      const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
      const r = await rpc('store_check_coupon', { p_code: c, p_subtotal: sub });
      disc = r.valid ? Number(r.discount) : 0; code = r.valid ? c : '';
      $('ckCouponMsg').textContent = r.message; drawSum();
    } catch (e) { $('ckCouponMsg').textContent = e.message; }
  };

  $('ckForm').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData($('ckForm')), btn = $('ckBtn');
    $('ckErr').hidden = true; btn.disabled = true; btn.textContent = 'Placing your order…';
    try {
      const res = await rpc('store_place_order', {
        p_customer: Object.fromEntries(f.entries()),
        p_items: cart.map(i => ({ variant_id: i.id, qty: i.qty })),
        p_payment_method: 'cod', p_coupon: code || null
      });
      try { localStorage.removeItem(CART_KEY); } catch (x) {}
      $('ckMain').innerHTML = `<div class="ck-card" style="text-align:center;max-width:520px;margin:30px auto">
        <h1 class="sh-title">Thank you! 🎉</h1><p>Your order has been placed.</p>
        <p style="font-size:1.3rem"><strong>Order number: ${esc(res.order_no)}</strong></p>
        <p>Total to pay on delivery: <strong>${money(res.total)}</strong></p>
        <p class="sh-note">Please keep your order number and phone number. You can track your order any time.</p>
        <a class="sh-btn" style="display:block;text-decoration:none;margin-bottom:10px" href="track.html?o=${encodeURIComponent(res.order_no)}">Track my order</a>
        <a href="index.html">Continue shopping</a></div>`;
      window.scrollTo(0, 0);
    } catch (ex) {
      $('ckErr').hidden = false; $('ckErr').textContent = ex.message;
      btn.disabled = false; btn.textContent = 'Place order';
    }
  };
  init();
})();
