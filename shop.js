(function () {
  const API = 'https://gnvmqtoakysrhfetwnra.supabase.co/rest/v1/';
  const KEY = 'sb_publishable__OycmvH5Og0XZ-jrco2o2A_BbZ_Usje';
  const CART_KEY = 'weliza_cart_v1';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  let products = [], cats = [], cat = 'all', cart = [], q = '', sort = 'new';
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { cart = []; }

  const vs = p => (p.store_product_variants || []).filter(v => v.is_active);
  const vPrice = (p, v) => v.price_override ?? p.price;
  const vLabel = v => v.size + (v.color ? ' / ' + v.color : '');
  const soldOut = p => !vs(p).length || (p.track_stock && vs(p).every(v => v.stock <= 0));
  const img0 = p => (p.image_urls || [])[0];

  async function api(path) {
    const r = await fetch(API + path, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    if (!r.ok) throw new Error('Could not load');
    return r.json();
  }
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); }
  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} $('cartCount').textContent = cart.reduce((a, i) => a + i.qty, 0); }

  async function init() {
    saveCart();
    try {
      [cats, products] = await Promise.all([
        api('store_categories?select=*&is_active=eq.true&order=sort_order'),
        api('store_products?select=*,store_product_variants(*)&is_active=eq.true&order=sort_order,created_at.desc')
      ]);
      drawChips(); drawGrid();
      const slug = location.hash.slice(1), p = products.find(x => x.slug === slug);
      if (p) openProduct(p);
    } catch (e) { $('grid').innerHTML = '<p class="sh-msg">Sorry, the shop could not load. Please refresh the page.</p>'; }
  }

  function drawChips() {
    const used = cats.filter(c => products.some(p => p.category_id === c.id));
    $('chips').innerHTML = used.length < 2 ? '' :
      [{ id: 'all', name: 'All' }, ...used].map(c => `<button class="sh-chip ${cat === c.id ? 'on' : ''}" data-c="${c.id}" type="button">${esc(c.name)}</button>`).join('');
  }
  const catName = id => (cats.find(c => c.id === id) || {}).name || '';
  function view() {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const l = products.filter(p => (cat === 'all' || p.category_id === cat) &&
      terms.every(t => (p.name + ' ' + (p.description || '') + ' ' + catName(p.category_id)).toLowerCase().includes(t)));
    if (sort === 'low') l.sort((a, b) => a.price - b.price);
    if (sort === 'high') l.sort((a, b) => b.price - a.price);
    return l;
  }
  function drawGrid() {
    const list = view();
    $('count').textContent = products.length ? list.length + (list.length === 1 ? ' product' : ' products') : '';
    $('grid').innerHTML = list.length ? list.map(p => { const one = vs(p).length === 1 && !soldOut(p); return `<div class="sh-card" data-p="${p.id}">
      ${soldOut(p) ? '<span class="sh-badge">Sold out</span>' : ''}
      ${img0(p) ? `<img src="${esc(img0(p))}" alt="${esc(p.name)}" loading="lazy">` : '<div class="sh-ph"></div>'}
      <div class="sh-card-b"><p class="sh-name">${esc(p.name)}</p>
      <span class="sh-price">${money(p.price)}</span>${p.compare_price > p.price ? `<span class="sh-old">${money(p.compare_price)}</span>` : ''}
      ${one ? `<button class="sh-quick" type="button" data-qa="${p.id}">Add to cart</button>` : ''}</div></div>`; }).join('')
      : (products.length ? `<p class="sh-msg">No dresses found${q ? ' for “' + esc(q) + '”' : ''}. Try another word.</p>` : '<p class="sh-msg">Our dresses are coming soon. Please check back shortly.</p>');
  }

  function openProduct(p) {
    const list = vs(p);
    let sel = list.find(v => !p.track_stock || v.stock > 0) || list[0], qty = 1, im = 0;
    const imgs = p.image_urls || [];
    history.replaceState(null, '', '#' + p.slug);
    $('pm').hidden = false; document.body.style.overflow = 'hidden';
    const draw = () => {
      const out = !sel || (p.track_stock && sel.stock <= 0);
      $('pmBody').innerHTML = `<div class="sh-pm"><div>
        ${imgs.length ? `<img class="sh-pm-img" src="${esc(imgs[im])}" alt="${esc(p.name)}">` : '<div class="sh-pm-img"></div>'}
        ${imgs.length > 1 ? `<div class="sh-thumbs">${imgs.map((u, i) => `<img src="${esc(u)}" data-i="${i}" class="${i === im ? 'on' : ''}" alt="">`).join('')}</div>` : ''}</div>
        <div><h2>${esc(p.name)}</h2>
        <div><span class="sh-price" style="font-size:1.3rem">${money(sel ? vPrice(p, sel) : p.price)}</span>${p.compare_price > p.price ? `<span class="sh-old">${money(p.compare_price)}</span>` : ''}</div>
        <p class="sh-note">${esc(p.description || '')}</p>
        ${list.length ? `<div class="sh-opts">${list.map(v => `<button type="button" class="sh-opt ${sel && v.id === sel.id ? 'on' : ''}" data-v="${v.id}" ${p.track_stock && v.stock <= 0 ? 'disabled' : ''}>${esc(vLabel(v))}</button>`).join('')}</div>` : ''}
        ${sel && p.track_stock && sel.stock > 0 && sel.stock <= 5 ? `<p class="sh-low">Only ${sel.stock} left</p>` : ''}
        ${p.is_made_to_measure ? '<p class="sh-note">Made to measure. You can add your measurements at checkout.</p>' : ''}
        <div class="sh-qty"><button type="button" data-q="-1">−</button><strong>${qty}</strong><button type="button" data-q="1">+</button></div>
        <button class="sh-btn" type="button" data-add="1" ${out ? 'disabled' : ''}>${out ? 'Sold out' : 'Add to cart'}</button></div></div>`;
    };
    draw();
    $('pmBody').onclick = e => {
      const t = e.target;
      if (t.dataset.i) im = +t.dataset.i;
      if (t.dataset.v) { sel = list.find(v => v.id === t.dataset.v); qty = 1; }
      if (t.dataset.q) { const max = p.track_stock && sel ? sel.stock : 20; qty = Math.max(1, Math.min(max, 20, qty + +t.dataset.q)); }
      if (t.dataset.add && sel) { addToCart(p, sel, qty); closeProduct(); openCart(); return; }
      draw();
    };
  }
  function closeProduct() { $('pm').hidden = true; document.body.style.overflow = ''; history.replaceState(null, '', location.pathname); }

  function addToCart(p, v, qty) {
    const ex = cart.find(i => i.id === v.id), max = p.track_stock ? v.stock : 20;
    const total = Math.min((ex ? ex.qty : 0) + qty, max, 20);
    if ((ex ? ex.qty : 0) + qty > total) toast('Only ' + total + ' available');
    if (ex) { ex.qty = total; ex.price = vPrice(p, v); ex.max = max; }
    else cart.push({ id: v.id, pid: p.id, name: p.name, label: vLabel(v), price: vPrice(p, v), qty: total, img: img0(p) || '', max });
    saveCart();
  }
  function openCart() { drawCart(); $('cart').hidden = false; document.body.style.overflow = 'hidden'; }
  function closeCart() { $('cart').hidden = true; document.body.style.overflow = ''; }
  function drawCart() {
    if (!cart.length) { $('cartBody').innerHTML = '<p class="sh-msg">Your cart is empty.</p>'; return; }
    const sub = cart.reduce((a, i) => a + i.price * i.qty, 0);
    $('cartBody').innerHTML = cart.map((i, n) => `<div class="sh-item">
      ${i.img ? `<img src="${esc(i.img)}" alt="">` : '<div class="sh-ph" style="width:64px;height:64px"></div>'}
      <div><div>${esc(i.name)}</div><small>${esc(i.label)} · ${money(i.price)}</small>
        <div class="sh-qty" style="margin:6px 0 0"><button type="button" data-m="${n}">−</button><strong>${i.qty}</strong><button type="button" data-a="${n}">+</button></div></div>
      <div><strong>${money(i.price * i.qty)}</strong><br><button class="sh-rm" type="button" data-r="${n}">Remove</button></div></div>`).join('') +
      `<div class="sh-sub"><span>Subtotal</span><span>${money(sub)}</span></div>
       <p class="sh-note">Shipping and the final total are shown at checkout.</p>
       <a class="sh-btn" href="checkout.html" style="display:block;text-align:center;text-decoration:none;box-sizing:border-box">Checkout</a>`;
  }

  $('chips').onclick = e => { if (e.target.dataset.c) { cat = e.target.dataset.c; drawChips(); drawGrid(); } };
  $('grid').onclick = e => {
    const qa = e.target.dataset.qa;
    if (qa) { const p = products.find(x => x.id === qa); addToCart(p, vs(p)[0], 1); toast('Added to cart'); return; }
    const c = e.target.closest('[data-p]'); if (c) openProduct(products.find(p => p.id === c.dataset.p));
  };
  $('q').oninput = e => { q = e.target.value.trim(); drawGrid(); };
  $('searchForm').onsubmit = e => { e.preventDefault(); $('grid').scrollIntoView({ behavior: 'smooth' }); };
  $('sort').onchange = e => { sort = e.target.value; drawGrid(); };
  $('pmX').onclick = closeProduct;
  $('pm').onclick = e => { if (e.target === $('pm')) closeProduct(); };
  $('cartBtn').onclick = openCart;
  $('cartX').onclick = closeCart;
  $('cart').onclick = e => { if (e.target === $('cart')) closeCart(); };
  $('cartBody').onclick = e => {
    const d = e.target.dataset;
    if (d.m !== undefined) { const i = cart[+d.m]; i.qty--; if (i.qty < 1) cart.splice(+d.m, 1); }
    if (d.a !== undefined) { const i = cart[+d.a]; if (i.qty < Math.min(i.max, 20)) i.qty++; else toast('No more available'); }
    if (d.r !== undefined) cart.splice(+d.r, 1);
    if (d.m !== undefined || d.a !== undefined || d.r !== undefined) { saveCart(); drawCart(); }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProduct(); closeCart(); } });
  init();
})();
