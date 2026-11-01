// Weliza "Under Construction" notice.
// Clients see a Coming Soon page. You (the owner) open the real site with your private link.
//
//  TO OPEN THE SHOP TO EVERYONE:  change UNDER_CONSTRUCTION to false and upload this file again.
//  YOUR PRIVATE LINK:  your website address + ?preview=weliza-owner-2026
//    (open it once on each phone or computer you use; that device then sees the real site)
//  TO TURN PREVIEW OFF ON A DEVICE: open your website address + ?preview=off
//  Note: this is a notice for visitors, not a security lock.
(function () {
  var UNDER_CONSTRUCTION = true;
  var PREVIEW_CODE = 'weliza-owner-2026';
  var KEY = 'weliza_owner_preview';
  var WA = '917592945893';
  var PHONE = '+91 75929 45893';

  if (!UNDER_CONSTRUCTION) return;

  var p = new URLSearchParams(location.search).get('preview');
  try {
    if (p === PREVIEW_CODE) localStorage.setItem(KEY, '1');
    if (p === 'off') localStorage.removeItem(KEY);
  } catch (e) {}
  if (p !== null) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} }

  var owner = false;
  try { owner = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (p === PREVIEW_CODE) owner = true;

  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  if (owner) {
    ready(function () {
      var b = document.createElement('div');
      b.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483000;background:#14392A;color:#fff;font:13px Outfit,Arial,sans-serif;padding:8px 14px;border-radius:999px;box-shadow:0 4px 14px rgba(0,0,0,.3);';
      b.innerHTML = 'Owner preview &middot; clients see "Under Construction" &nbsp;<a href="#" style="color:#D9BE8E">Turn off</a>';
      b.querySelector('a').onclick = function (e) { e.preventDefault(); try { localStorage.removeItem(KEY); } catch (x) {} location.reload(); };
      document.body.appendChild(b);
    });
    return;
  }

  var st = document.createElement('style');
  st.textContent = 'body > *:not(#ucPage){display:none!important}body{overflow:hidden!important}';
  document.head.appendChild(st);
  document.title = 'Weliza | Coming Soon';

  ready(function () {
    var d = document.createElement('div');
    d.id = 'ucPage';
    d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:linear-gradient(135deg,#14392A,#307152);color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;overflow:auto;font-family:Outfit,Arial,sans-serif;';
    d.innerHTML =
      '<div style="max-width:520px;">' +
      '<img src="assets/logo/logo_full_white.png" alt="Weliza" style="width:min(240px,70vw);margin-bottom:26px;">' +
      '<div style="display:inline-block;background:#C09A59;color:#fff;border-radius:999px;padding:6px 16px;font-size:.8rem;letter-spacing:.12em;margin-bottom:18px;">UNDER CONSTRUCTION</div>' +
      '<h1 style="font-family:\'Playfair Display\',Georgia,serif;font-size:clamp(1.8rem,6vw,2.6rem);margin:0 0 14px;">Our online store is getting ready</h1>' +
      '<p style="opacity:.92;line-height:1.6;margin:0 0 26px;">We are building a new way to buy Weliza prayer dresses online. Please visit us again soon.</p>' +
      '<a href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello Weliza, I would like to know more.') + '" style="display:inline-block;background:#fff;color:#14392A;text-decoration:none;font-weight:600;border-radius:10px;padding:13px 24px;">Message us on WhatsApp</a>' +
      '<p style="opacity:.8;font-size:.9rem;margin-top:16px;">' + PHONE + '</p></div>';
    document.body.appendChild(d);
  });
})();
