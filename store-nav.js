// Weliza top bar: scrolling announcement bar, centred logo, icon menu (search, wishlist, track order, account, cart)
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const SEARCH = svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>');
  const HEART = svg('<path d="M12 20.500s-7.8-4.7-9.4-9.600C1.5 7.6 3.4 4.5 6.6 4.500c2 0 3.5 1.1 5.4 3.2 1.9-2.1 3.4-3.2 5.4-3.2 3.2 0 5.1 3.1 4 6.4-1.6 4.9-9.4 9.6-9.4 9.600z"/>');
  const BOX = svg('<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>');
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.500l4.5 4.500L19 7.5"/></svg>';

  function announce() {
    const items = ['Cash on Delivery', '6-day returns', 'Made to measure', 'Delivery across India'];
    const chunk = items.map(t => `<span>${CHECK}${t}</span>`).join('');
    const bar = document.createElement('div'); bar.className = 'ann-bar';
    bar.innerHTML = `<div class="ann-track">${chunk}${chunk}${chunk}${chunk}</div>`;
    document.body.prepend(bar);
    const nav = $('navbar'); if (!nav) return;
    const place = () => { nav.style.top = Math.max(0, (bar.offsetHeight || 34) - window.scrollY) + 'px'; };
    place(); window.addEventListener('scroll', place, { passive: true }); window.addEventListener('resize', place);
  }

  function menu() {
    const n = $('navbar'); if (!n) return;
    const left = document.createElement('div'); left.className = 'nv-left';
    left.innerHTML = `<button class="nv-ic" id="nvWish" type="button" aria-label="Wishlist" title="Wishlist">${HEART}<b class="st-wcount" style="display:none">0</b></button>
      <a class="nv-ic" href="track.html" aria-label="Track order" title="Track order">${BOX}</a>`;
    const right = document.createElement('div'); right.className = 'nv-right';
    right.innerHTML = `<button class="nv-ic" id="nvSearch" type="button" aria-label="Search" title="Search">${SEARCH}</button>`;
    const acct = n.querySelector('.st-acct'), cart = n.querySelector('.st-cart');
    if (acct) right.appendChild(acct);
    if (cart) right.appendChild(cart);
    n.prepend(left); n.appendChild(right);
    $('nvWish').onclick = () => { if (window.WelizaStore) window.WelizaStore.openWish(); };
    $('nvSearch').onclick = openSearch;
    if (window.WelizaStore) window.WelizaStore.paintWish();
  }

  function openSearch() {
    let ov = $('snOv');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'snOv'; ov.className = 'sn-ov'; ov.hidden = true;
      ov.innerHTML = '<div class="sn-box"><div class="sn-row"><input id="snQ" type="search" placeholder="Search for a dress…" autocomplete="off" aria-label="Search"><button class="sn-x" type="button" aria-label="Close">✕</button></div><div id="snRes"></div></div>';
      document.body.appendChild(ov);
      const close = () => { ov.hidden = true; document.body.style.overflow = ''; };
      ov.querySelector('.sn-x').onclick = close;
      ov.onclick = e => { if (e.target === ov) close(); };
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
      $('snQ').oninput = results;
      $('snQ').onkeydown = e => { if (e.key === 'Enter' && window.WelizaStore && $('snQ').value.trim()) { const t = $('snQ').value; close(); window.WelizaStore.searchAll(t); } };
      $('snRes').onclick = e => {
        const r = e.target.closest('[data-id]'), all = e.target.closest('[data-all]');
        if (r) { close(); window.WelizaStore.openProduct(r.dataset.id); }
        if (all) { const t = $('snQ').value; close(); window.WelizaStore.searchAll(t); }
      };
    }
    ov.hidden = false; document.body.style.overflow = 'hidden'; $('snQ').value = ''; results(); setTimeout(() => $('snQ').focus(), 50);
  }

  function results() {
    const S = window.WelizaStore, box = $('snRes'), q = $('snQ').value.trim().toLowerCase();
    if (!S || !S.products().length) { box.innerHTML = '<p class="sn-empty">Our dresses are coming soon.</p>'; return; }
    const terms = q.split(/\s+/).filter(Boolean);
    const list = S.products().filter(p => terms.every(t => (p.name + ' ' + (p.description || '') + ' ' + S.catName(p.category_id)).toLowerCase().includes(t)));
    if (!list.length) { box.innerHTML = `<p class="sn-empty">No dresses found for “${esc(q)}”.</p>`; return; }
    box.innerHTML = (q ? '' : '<p class="sn-hint">Popular right now</p>') + list.slice(0, 6).map(p => `<div class="sn-item" data-id="${p.id}">
      ${(p.image_urls || [])[0] ? `<img src="${esc(p.image_urls[0])}" alt="">` : '<div class="sn-ph"></div>'}
      <div class="sn-info"><div class="sn-name">${esc(p.name)}</div><div class="sn-cat">${esc(S.catName(p.category_id))}</div></div><strong>${S.money(p.price)}</strong></div>`).join('') +
      (q && list.length > 6 ? `<button class="sn-all" type="button" data-all="1">See all ${list.length} results →</button>` : '');
  }

  function init() { announce(); menu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else setTimeout(init, 0);
})();
