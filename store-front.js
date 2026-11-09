// Weliza single-page store: live catalog, search, product pop-up and cart (inside the home page)
(function () {
  const API = 'https://gnvmqtoakysrhfetwnra.supabase.co/rest/v1/';
  const KEY = 'sb_publishable__OycmvH5Og0XZ-jrco2o2A_BbZ_Usje';
  const CART_KEY = 'weliza_cart_v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>';
  let products = [], cats = [], cat = 'all', cart = [], q = '', sort = 'new';
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }

  const vs = p => (p.store_product_variants || []).filter(v => v.is_active);
  const vPrice = (p, v) => v.price_override ?? p.price;
  const vLabel = v => v.size + (v.color ? ' / ' + v.color : '');
  const soldOut = p => !vs(p).length || (p.track_stock && vs(p).every(v => v.stock <= 0));
  const img0 = p => (p.image_urls || [])[0];
  const catName = id => (cats.find(c => c.id === id) || {}).name || 'Prayer Dress';

  async function api(path) {
    const r = await fetch(API + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (!r.ok) throw new Error('load');
    return r.json();
  }
  function toast(msg) { const t = $('stToast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    const n = cart.reduce((a, i) => a + i.qty, 0);
    document.querySelectorAll('.st-count').forEach(e => { e.textContent = n; e.style.display = n ? '' : 'none'; });
  }

  function mount() {
    const b = document.createElement('button');
    b.className = 'st-cart'; b.type = 'button'; b.setAttribute('aria-label', 'Open cart');
    b.innerHTML = BAG + '<b class="st-count">0</b>'; b.onclick = openCart;
    const t = $('menuToggle'); if (t) t.before(b); else $('navbar').appendChild(b);
    document.body.insertAdjacentHTML('beforeend', `<div id="stPm" class="sh-ov" hidden><div class="sh-modal"><button class="sh-x" id="stPmX" type="button" aria-label="Close">✕</button><div id="stPmBody"></div></div></div>
      <aside id="stCart" class="sh-drawer" hidden><div class="sh-drawer-in"><div class="sh-drawer-head"><strong>Your cart</strong><button class="sh-x2" id="stCartX" type="button" aria-label="Close">✕</button></div><div id="stCartBody"></div></div></aside><div id="stToast" class="sh-toast"></div>`);
    $('stPmX').onclick = closeProduct; $('stPm').onclick = e => { if (e.target === $('stPm')) closeProduct(); };
    $('stCartX').onclick = closeCart; $('stCart').onclick = e => { if (e.target === $('stCart')) closeCart(); };
    $('stCartBody').onclick = e => {
      const d = e.target.dataset;
      if (d.m !== undefined) { const i = cart[+d.m]; i.qty--; if (i.qty < 1) cart.splice(+d.m, 1); }
      if (d.a !== undefined) { const i = cart[+d.a]; if (i.qty < Math.min(i.max, 20)) i.qty++; else toast('No more available'); }
      if (d.r !== undefined) cart.splice(+d.r, 1);
      if (d.m !== undefined || d.a !== undefined || d.r !== undefined) { saveCart(); drawCart(); }
    };
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProduct(); closeCart(); } });
    saveCart();
  }

  function buildStore() {
    const grid = $('catalogGrid'), filt = $('catalogFilterContainer');
    if (!grid) return;
    grid.style.display = 'none'; if (filt) filt.style.display = 'none';
    const w = document.createElement('div'); w.id = 'stStore';
    w.innerHTML = `<div class="st-tools"><input id="stQ" type="search" placeholder="Search dresses…" aria-label="Search dresses" autocomplete="off">
      <select id="stSort" aria-label="Sort"><option value="new">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div>
      <div class="st-chips" id="stChips"></div><p class="st-count-txt" id="stCountTxt"></p><div class="catalog-grid" id="stGrid"></div><div id="stCustom"></div>`;
    grid.after(w);
    $('stQ').oninput = e => { q = e.target.value.trim(); drawGrid(); };
    $('stSort').onchange = e => { sort = e.target.value; drawGrid(); };
    $('stChips').onclick = e => { if (e.target.dataset.c) { cat = e.target.dataset.c; drawChips(); drawGrid(); } };
    $('stGrid').onclick = e => {
      const add = e.target.closest('[data-add]');
      if (add) { const p = products.find(x => x.id === add.dataset.add), v = vs(p); if (v.length === 1) { addToCart(p, v[0], 1); toast('Added to cart'); } else openProduct(p); return; }
      const c = e.target.closest('[data-p]'); if (c) openProduct(products.find(p => p.id === c.dataset.p));
    };
    $('stCustom').onclick = e => { const b = e.target.closest('[data-inq]'); if (b && typeof inquireWhatsApp === 'function') inquireWhatsApp(b.dataset.inq); };
    drawChips(); drawGrid();
  }

  function drawChips() {
    const used = cats.filter(c => products.some(p => p.category_id === c.id));
    $('stChips').innerHTML = used.length < 2 ? '' : [{ id: 'all', name: 'All' }, ...used].map(c => `<button class="filter-btn ${cat === c.id ? 'active' : ''}" data-c="${c.id}" type="button">${esc(c.name)}</button>`).join('');
  }
  function view() {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const l = products.filter(p => (cat === 'all' || p.category_id === cat) && terms.every(t => (p.name + ' ' + (p.description || '') + ' ' + catName(p.category_id)).toLowerCase().includes(t)));
    if (sort === 'low') l.sort((a, b) => a.price - b.price);
    if (sort === 'high') l.sort((a, b) => b.price - a.price);
    return l;
  }
  function drawGrid() {
    const list = view();
    $('stCountTxt').textContent = list.length + (list.length === 1 ? ' product' : ' products');
    $('stGrid').innerHTML = list.length ? list.map(p => {
      const one = vs(p).length === 1, out = soldOut(p), d = p.description || '';
      return `<div class="catalog-card" data-p="${p.id}"><div class="catalog-image-container">
        ${out ? '<span class="sh-badge">Sold out</span>' : ''}${img0(p) ? `<img src="${esc(img0(p))}" alt="${esc(p.name)}" loading="lazy">` : ''}
        <div class="catalog-overlay"><button class="btn catalog-overlay-btn" type="button">Quick View</button></div></div>
        <div class="catalog-info"><span class="catalog-category">${esc(catName(p.category_id))}</span><h3 class="catalog-title">${esc(p.name)}</h3>
          <p class="catalog-desc">${esc(d.length > 90 ? d.slice(0, 90) + '…' : d)}</p>
          <div class="catalog-footer"><span class="catalog-spec"><strong>${money(p.price)}</strong>${p.compare_price > p.price ? `<span class="sh-old">${money(p.compare_price)}</span>` : ''}</span>
          ${out ? '<span class="catalog-spec">Sold out</span>' : `<button class="btn catalog-action-btn" type="button" data-add="${p.id}"><span>${one ? 'Add to cart' : 'Select size'}</span></button>`}</div></div></div>`;
    }).join('') : `<p class="sh-msg" style="grid-column:1/-1">No dresses found${q ? ' for “' + esc(q) + '”' : ''}. Try another word.</p>`;
    drawCustom();
  }
  function drawCustom() {
    const items = (typeof SITE_CONTENT !== 'undefined' && Array.isArray(SITE_CONTENT.catalogItems) ? SITE_CONTENT.catalogItems : []).filter(i => i.category !== 'prayer');
    $('stCustom').innerHTML = items.length && cat === 'all' && !q ? `<h3 class="st-sub">Made to Order</h3><p class="st-subp">Custom stitching to your measurements. Send us an enquiry on WhatsApp.</p><div class="catalog-grid">` +
      items.map(i => `<div class="catalog-card"><div class="catalog-image-container"><img src="${esc(i.image)}" alt="${esc(i.title)}" loading="lazy"></div>
        <div class="catalog-info"><span class="catalog-category">${i.category === 'wedding' ? 'Wedding Center' : 'Custom Work'}</span><h3 class="catalog-title">${esc(i.title)}</h3><p class="catalog-desc">${esc(i.desc)}</p>
        <div class="catalog-footer"><span class="catalog-spec">${esc(i.spec)}</span><button class="btn catalog-action-btn" type="button" data-inq="${esc(i.title)}"><span>Inquire</span></button></div></div></div>`).join('') + '</div>' : '';
  }

  function openProduct(p) {
    const list = vs(p), imgs = p.image_urls || [];
    let sel = list.find(v => !p.track_stock || v.stock > 0) || list[0], qty = 1, im = 0;
    $('stPm').hidden = false; document.body.style.overflow = 'hidden';
    const draw = () => {
      const out = !sel || (p.track_stock && sel.stock <= 0);
      $('stPmBody').innerHTML = `<div class="sh-pm"><div>${imgs.length ? `<img class="sh-pm-img" src="${esc(imgs[im])}" alt="${esc(p.name)}">` : '<div class="sh-pm-img"></div>'}
        ${imgs.length > 1 ? `<div class="sh-thumbs">${imgs.map((u, i) => `<img src="${esc(u)}" data-i="${i}" class="${i === im ? 'on' : ''}" alt="">`).join('')}</div>` : ''}</div>
        <div><h2>${esc(p.name)}</h2><div><span class="sh-price" style="font-size:1.3rem">${money(sel ? vPrice(p, sel) : p.price)}</span>${p.compare_price > p.price ? `<span class="sh-old">${money(p.compare_price)}</span>` : ''}</div>
        <p class="sh-note">${esc(p.description || '')}</p>
        ${list.length ? `<div class="sh-opts">${list.map(v => `<button type="button" class="sh-opt ${sel && v.id === sel.id ? 'on' : ''}" data-v="${v.id}" ${p.track_stock && v.stock <= 0 ? 'disabled' : ''}>${esc(vLabel(v))}</button>`).join('')}</div>` : ''}
        ${sel && p.track_stock && sel.stock > 0 && sel.stock <= 5 ? `<p class="sh-low">Only ${sel.stock} left</p>` : ''}
        ${p.is_made_to_measure ? '<p class="sh-note">Made to measure. You can add your measurements at checkout.</p>' : ''}
        <div class="sh-qty"><button type="button" data-q="-1">−</button><strong>${qty}</strong><button type="button" data-q="1">+</button></div>
        <button class="sh-btn" type="button" data-add="1" ${out ? 'disabled' : ''}>${out ? 'Sold out' : 'Add to cart'}</button></div></div>`;
    };
    draw();
    $('stPmBody').onclick = e => {
      const t = e.target;
      if (t.dataset.i) im = +t.dataset.i;
      if (t.dataset.v) { sel = list.find(v => v.id === t.dataset.v); qty = 1; }
      if (t.dataset.q) { const max = p.track_stock && sel ? sel.stock : 20; qty = Math.max(1, Math.min(max, 20, qty + +t.dataset.q)); }
      if (t.dataset.add && sel) { addToCart(p, sel, qty); closeProduct(); openCart(); return; }
      draw();
    };
  }
  function closeProduct() { $('stPm').hidden = true; document.body.style.overflow = ''; }

  function addToCart(p, v, qty) {
    const ex = cart.find(i => i.id === v.id), max = p.track_stock ? v.stock : 20;
    const want = (ex ? ex.qty : 0) + qty, total = Math.min(want, max, 20);
    if (want > total) toast('Only ' + total + ' available');
    if (ex) { ex.qty = total; ex.price = vPrice(p, v); ex.max = max; }
    else cart.push({ id: v.id, pid: p.id, name: p.name, label: vLabel(v), price: vPrice(p, v), qty: total, img: img0(p) || '', max });
    saveCart();
  }
  function openCart() { drawCart(); $('stCart').hidden = false; document.body.style.overflow = 'hidden'; }
  function closeCart() { $('stCart').hidden = true; document.body.style.overflow = ''; }
  function drawCart() {
    if (!cart.length) { $('stCartBody').innerHTML = '<p class="sh-msg">Your cart is empty.</p>'; return; }
    const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
    $('stCartBody').innerHTML = cart.map((i, n) => `<div class="sh-item">${i.img ? `<img src="${esc(i.img)}" alt="">` : '<div class="sh-ph" style="width:64px;height:64px"></div>'}
      <div><div>${esc(i.name)}</div><small>${esc(i.label)} · ${money(i.price)}</small>
        <div class="sh-qty" style="margin:6px 0 0"><button type="button" data-m="${n}">−</button><strong>${i.qty}</strong><button type="button" data-a="${n}">+</button></div></div>
      <div><strong>${money(i.price * i.qty)}</strong><br><button class="sh-rm" type="button" data-r="${n}">Remove</button></div></div>`).join('') +
      `<div class="sh-sub"><span>Subtotal</span><span>${money(sub)}</span></div><p class="sh-note">Shipping and the final total are shown at checkout.</p>
       <a class="sh-btn" href="checkout.html" style="display:block;text-align:center;text-decoration:none;box-sizing:border-box">Checkout</a>`;
  }

  async function init() {
    mount();
    try {
      [cats, products] = await Promise.all([
        api('store_categories?select=*&is_active=eq.true&order=sort_order'),
        api('store_products?select=*,store_product_variants(*)&is_active=eq.true&order=sort_order,created_at.desc')
      ]);
      if (products.length) buildStore();   // no products yet: the original showcase catalog stays
    } catch (e) { /* keep the original showcase catalog */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
