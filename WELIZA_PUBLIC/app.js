/**
 * Weliza Web App - Public Website Logic
 * Reads everything from content.js (SITE_CONTENT) and renders it into the page.
 * Also handles catalog filtering, contact form, WhatsApp links, and animations.
 */

// SVG icon paths for known social platforms (used in footer + contact socials).
// If you add a new platform in content.js that isn't listed here, a generic
// circle icon is shown automatically so nothing breaks.
const SOCIAL_ICONS = {
  Instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/></svg>',
  Facebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M15 4h-2.5A3.5 3.5 0 0 0 9 7.5V10H7v3h2v7h3v-7h2.5l.5-3H12V7.8c0-.7.5-1.3 1.3-1.3H15V4z"/></svg>',
  YouTube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="4"/><path d="M11 9.8v4.4l4-2.2-4-2.2z" fill="currentColor" stroke="none"/></svg>',
  WhatsApp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.07-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.6 0-3.11-.43-4.4-1.18l-.31-.19-3.02.79.8-2.94-.2-.32A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm4.38-5.89c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.1-.18.05-.34-.03-.46-.08-.12-.5-1.2-.68-1.62-.18-.42-.36-.36-.5-.37-.13-.01-.28-.01-.43-.01-.15 0-.39.06-.6.28-.21.22-.8.79-.8 1.92s.82 2.23.94 2.39c.12.16 1.6 2.44 3.9 3.33 2.3.89 2.3.6 2.7.56.4-.04 1.3-.53 1.48-1.04.18-.51.18-.95.13-1.04-.05-.09-.19-.15-.43-.27z"/></svg>',
  LinkedIn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="7.5" y1="10.5" x2="7.5" y2="16.5"/><circle cx="7.5" cy="7.2" r="0.6" fill="currentColor" stroke="none"/><path d="M11.5 16.5v-4a2 2 0 0 1 4 0v4"/><line x1="11.5" y1="10.5" x2="11.5" y2="16.5"/></svg>',
  Twitter: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4l16 16M20 4L4 20"/></svg>'
};
const DEFAULT_SOCIAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/></svg>';

// Small helper: safely set text content only if the element exists.
function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.textContent = value;
}

// Small helper: safely set an image src only if the element exists.
function setImg(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.src = value;
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    renderAllContent();
  } catch (err) {
    console.error('Error rendering site content from content.js:', err);
  }

  // Render Catalog
  renderCatalog('all');

  // Setup Mobile Menu Toggle
  setupMobileMenu();

  // Setup Navigation Highlight on Scroll
  setupScrollHighlight();

  // Setup Filter Buttons
  setupFilters();

  // Setup Contact Form
  setupContactForm();

  // Setup Quick View Modal
  setupModal();

  // Setup Scroll Reveal
  setupScrollReveal();

  // Setup Hero Parallax
  setupHeroParallax();
});

// ============================================================
// Render all page content from SITE_CONTENT (content.js)
// ============================================================
function renderAllContent() {
  if (typeof SITE_CONTENT === 'undefined') {
    console.error('content.js not loaded / SITE_CONTENT is missing. Make sure content.js is included before app.js.');
    return;
  }
  const c = SITE_CONTENT;

  // --- Meta / Head ---
  if (c.meta) {
    if (c.meta.pageTitle) document.title = c.meta.pageTitle;
    const descTag = document.getElementById('pageDescription');
    if (descTag && c.meta.pageDescription) descTag.setAttribute('content', c.meta.pageDescription);
  }
  if (c.brand) {
    setImg('faviconLink', c.brand.favicon);
    setImg('appleTouchIconLink', c.brand.appleTouchIcon);
    setImg('navbarLogo', c.brand.navbarLogo);
    setImg('heroMark', c.brand.heroMark);
    setImg('ctaBandMark', c.brand.ctaBandMark);
    setImg('footerLogo', c.brand.footerLogo);
  }

  // --- Navbar links ---
  if (Array.isArray(c.nav)) {
    const navLinksEl = document.getElementById('navLinks');
    if (navLinksEl) {
      navLinksEl.innerHTML = c.nav.map((item, i) =>
        `<li><a href="${item.href}" class="${i === 0 ? 'active' : ''}">${item.label}</a></li>`
      ).join('');
    }
  }

  // --- Hero ---
  if (c.hero) {
    setText('heroSubtitle', c.hero.subtitle);
    const heroTitleEl = document.getElementById('heroTitle');
    if (heroTitleEl && c.hero.titleLine1 !== undefined && heroTitleEl.childNodes[0]) {
      heroTitleEl.childNodes[0].nodeValue = c.hero.titleLine1 + ' ';
    }
    setText('heroTitleHighlight', c.hero.titleHighlight);
    setText('heroDesc', c.hero.description);
    setText('heroPrimaryBtnText', c.hero.primaryButtonText);
    setText('heroSecondaryBtnText', c.hero.secondaryButtonText);
  }

  // --- Catalog section header + filters ---
  if (c.catalogSection) {
    setText('catalogSubtitle', c.catalogSection.subtitle);
    setText('catalogTitle', c.catalogSection.title);
    const filterContainer = document.getElementById('catalogFilterContainer');
    if (filterContainer && Array.isArray(c.catalogSection.filters)) {
      filterContainer.innerHTML = c.catalogSection.filters.map((f, i) =>
        `<button class="btn filter-btn${i === 0 ? ' active' : ''}" data-filter="${f.value}">${f.label}</button>`
      ).join('');
    }
  }

  // --- About section ---
  if (c.about) {
    setText('aboutSubtitle', c.about.subtitle);
    setText('aboutTitle', c.about.title);
    setText('aboutDesc', c.about.description);
    setImg('aboutImage1', c.about.image1);
    setImg('aboutImage2', c.about.image2);
    setText('aboutBadgeNum', c.about.badgeNumber);
    setText('aboutBadgeText', c.about.badgeText);
    if (Array.isArray(c.about.features)) {
      document.querySelectorAll('[data-feature]').forEach(el => {
        const idx = parseInt(el.getAttribute('data-feature'), 10);
        if (c.about.features[idx]) el.textContent = c.about.features[idx].title;
      });
    }
  }

  // --- Trust Strip / Partners ---
  if (c.partnersSection) {
    setText('trustEyebrow', c.partnersSection.eyebrow);
  }
  const trustRow = document.getElementById('trustRow');
  if (trustRow && Array.isArray(c.partners)) {
    trustRow.innerHTML = c.partners.map(p => {
      if (p.logo) {
        return `<div class="trust-logo"><img src="${p.logo}" alt="${p.name}" loading="lazy" onerror="this.parentElement.outerHTML='<span class=&quot;trust-name&quot;>${p.name}</span>'"></div>`;
      }
      return `<span class="trust-name">${p.name}</span>`;
    }).join('');
  }

  // --- Process Section ---
  if (c.processSection) {
    setText('processSubtitle', c.processSection.subtitle);
    setText('processTitle', c.processSection.title);
    const processRow = document.getElementById('processRow');
    if (processRow && Array.isArray(c.processSection.steps)) {
      processRow.innerHTML = c.processSection.steps.map(step =>
        `<div class="process-step">
          <div class="process-dot">${step.number}</div>
          <p class="process-step-label">${step.label}</p>
        </div>`
      ).join('');
    }
  }

  // --- Contact info panel ---
  if (c.contact) {
    setText('contactHeading', c.contact.heading);
    setText('contactSubheading', c.contact.subheading);
    setText('formTitle', c.contact.formTitle);
    setText('formSubmitText', c.contact.formSubmitText);
    const interestSelect = document.getElementById('formInterest');
    if (interestSelect && Array.isArray(c.contact.interestOptions)) {
      interestSelect.innerHTML = c.contact.interestOptions.map(opt =>
        `<option value="${opt}">${opt}</option>`
      ).join('');
    }
  }
  if (c.business) {
    setText('contactPhone', c.business.phoneDisplay);
    setText('contactEmail', c.business.email);
    setText('contactAddress', c.business.address);

    const waPhone = c.business.phoneWhatsApp;

    const waSocial = document.getElementById('contactSocialWhatsApp');
    if (waSocial) waSocial.href = `https://wa.me/${waPhone}`;
    const phoneSocial = document.getElementById('contactSocialPhone');
    if (phoneSocial) phoneSocial.href = `tel:+${waPhone}`;
    const emailSocial = document.getElementById('contactSocialEmail');
    if (emailSocial) emailSocial.href = `mailto:${c.business.email}`;
  }

  // --- Modal button labels ---
  if (c.modal) {
    setText('modalWhatsAppBtnText', c.modal.whatsAppButtonText);
    setText('modalEmailBtnText', c.modal.emailButtonText);
  }

  // --- CTA Band ---
  if (c.ctaBand && c.business) {
    setText('ctaBandTitle', c.ctaBand.title);
    setText('ctaBandDesc', c.ctaBand.description);
    setText('ctaBandBtnText', c.ctaBand.buttonText);
    const ctaBtn = document.getElementById('ctaBandBtn');
    if (ctaBtn) {
      const text = encodeURIComponent(c.ctaBand.whatsAppMessage || '');
      ctaBtn.href = `https://wa.me/${c.business.phoneWhatsApp}?text=${text}`;
    }
  }

  // --- Floating WhatsApp Button ---
  if (c.floatingWhatsApp && c.business) {
    const floatBtn = document.getElementById('floatingWhatsAppBtn');
    if (floatBtn) {
      const text = encodeURIComponent(c.floatingWhatsApp.message || '');
      floatBtn.href = `https://wa.me/${c.business.phoneWhatsApp}?text=${text}`;
    }
  }

  // --- Footer ---
  if (c.footer) {
    setText('footerTagline', c.business ? c.business.tagline : '');

    // Socials (footer)
    const footerSocials = document.getElementById('footerSocials');
    if (footerSocials && Array.isArray(c.footer.socials)) {
      footerSocials.innerHTML = c.footer.socials.map(s => {
        const icon = SOCIAL_ICONS[s.platform] || DEFAULT_SOCIAL_ICON;
        return `<a href="${s.url}" class="footer-social-btn" target="_blank" title="${s.platform}" aria-label="${s.platform}">${icon}</a>`;
      }).join('');
    }

    // Navigation links
    const footerNavLinks = document.getElementById('footerNavLinks');
    if (footerNavLinks && Array.isArray(c.footer.navigationLinks)) {
      footerNavLinks.innerHTML = c.footer.navigationLinks.map(l =>
        `<li><a href="${l.href}">${l.label}</a></li>`
      ).join('');
    }

    // Collections
    setText('footerCollectionsTitle', c.footer.collectionsTitle);
    const footerCollectionsLinks = document.getElementById('footerCollectionsLinks');
    if (footerCollectionsLinks && Array.isArray(c.footer.collectionsLinks)) {
      footerCollectionsLinks.innerHTML = c.footer.collectionsLinks.map(l =>
        `<li><a href="${l.href}">${l.label}</a></li>`
      ).join('');
    }

    // Business info
    setText('footerBusinessTitle', c.footer.businessTitle);
    if (c.business) {
      setText('footerGstin', c.business.gstin);
      setText('footerAddress', c.business.address);
    }

    // Copyright + bottom links
    const copyrightEl = document.getElementById('footerCopyright');
    if (copyrightEl && c.business) {
      copyrightEl.innerHTML = `&copy; ${c.business.year} ${c.footer.copyrightText}`;
    }
    const bottomLinksEl = document.getElementById('footerBottomLinks');
    if (bottomLinksEl && Array.isArray(c.footer.bottomLinks)) {
      bottomLinksEl.innerHTML = c.footer.bottomLinks.map(l =>
        `<a href="${l.href}">${l.label}</a>`
      ).join('');
    }
  }
}

// Setup Mobile Navigation Menu
function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const spans = menuToggle.querySelectorAll('span');
      if (navLinks.classList.contains('active')) {
        spans[0].style.transform = 'translateY(8px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-8px) rotate(-45deg)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });

    // Close menu when a link is clicked (works for dynamically-injected links too)
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }
}

// Render catalog items to the grid
function renderCatalog(filter) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const items = (typeof SITE_CONTENT !== 'undefined' && Array.isArray(SITE_CONTENT.catalogItems))
    ? SITE_CONTENT.catalogItems
    : [];

  grid.innerHTML = '';

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.category === filter);

  filteredItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `catalog-card animate-fade-in`;
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.opacity = '0';
    card.style.animationFillMode = 'forwards';

    const categoryText = item.category === 'prayer' ? 'Prayer Dress' : item.category === 'wedding' ? 'Wedding Center' : 'Custom Work';

    card.innerHTML = `
      <div class="catalog-image-container">
        <img src="${item.image}" alt="${item.title}" loading="lazy">
        <div class="catalog-overlay">
          <button class="btn catalog-overlay-btn" onclick="openQuickView(${item.id})">
            <svg class="icon-svg" style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            Quick View
          </button>
        </div>
      </div>
      <div class="catalog-info">
        <span class="catalog-category">${categoryText}</span>
        <h3 class="catalog-title">${item.title}</h3>
        <p class="catalog-desc">${item.desc}</p>
        <div class="catalog-footer">
          <span class="catalog-spec">${item.spec}</span>
          <button class="btn catalog-action-btn" onclick="inquireWhatsApp('${item.title.replace(/'/g, "\\'")}')">
            <span>Inquire</span>
            <svg class="icon-svg" style="width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Setup Catalog Filters
function setupFilters() {
  const filters = document.querySelectorAll('.filter-btn');
  filters.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filters.forEach(f => f.classList.remove('active'));
      e.target.classList.add('active');
      const filterValue = e.target.getAttribute('data-filter');
      renderCatalog(filterValue);
    });
  });
}

// Highlight navbar links on scroll
function setupScrollHighlight() {
  const sections = document.querySelectorAll('section');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (pageYOffset >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// Inquiry WhatsApp Handler
window.inquireWhatsApp = function(productTitle) {
  const phone = (typeof SITE_CONTENT !== 'undefined' && SITE_CONTENT.business) ? SITE_CONTENT.business.phoneWhatsApp : '';
  const text = encodeURIComponent(`Hello Weliza! I am interested in wholesale stitching/ordering details for: "${productTitle}". Please send me details.`);
  const url = `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank');
};

// Setup contact form submission
function setupContactForm() {
  const form = document.getElementById('inquiryForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('formName').value;
      const email = document.getElementById('formEmail').value;
      const phone = document.getElementById('formPhone').value;
      const interest = document.getElementById('formInterest').value;
      const message = document.getElementById('formMessage').value;

      const whatsappPhone = (typeof SITE_CONTENT !== 'undefined' && SITE_CONTENT.business) ? SITE_CONTENT.business.phoneWhatsApp : '';
      const text = encodeURIComponent(
        `Hello Weliza! New inquiry:\n\n` +
        `Name/Company: ${name}\n` +
        `Email: ${email}\n` +
        `Phone: ${phone}\n` +
        `I am a: ${interest}\n\n` +
        `Message: ${message}`
      );

      window.open(`https://wa.me/${whatsappPhone}?text=${text}`, '_blank');

      form.reset();
    });
  }
}

// Setup Quick View Modal
let currentProduct = null;
function setupModal() {
  const modal = document.getElementById('quickViewModal');
  const closeBtn = document.getElementById('modalClose');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Bind Quick View Buttons
  window.openQuickView = function(productId) {
    const items = (typeof SITE_CONTENT !== 'undefined' && Array.isArray(SITE_CONTENT.catalogItems))
      ? SITE_CONTENT.catalogItems
      : [];
    const product = items.find(p => p.id === productId);
    if (!product) return;

    currentProduct = product;

    const modal = document.getElementById('quickViewModal');
    const modalImg = document.getElementById('modalImg');
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
    const modalEmailBtn = document.getElementById('modalEmailBtn');

    if (modal) {
      modalImg.src = product.image;
      modalCategory.textContent = product.category === 'prayer' ? 'Prayer Dress' : product.category === 'wedding' ? 'Wedding Center' : 'Custom Work';
      modalTitle.textContent = product.title;
      modalDesc.textContent = product.desc;

      const business = (typeof SITE_CONTENT !== 'undefined' && SITE_CONTENT.business) ? SITE_CONTENT.business : { phoneWhatsApp: '', email: '' };

      // WhatsApp link
      const text = encodeURIComponent(`Hello Weliza! I saw "${product.title}" in your catalog and would like to get a quote.`);
      modalWhatsAppBtn.href = `https://wa.me/${business.phoneWhatsApp}?text=${text}`;

      // Email link
      const emailSubject = encodeURIComponent(`Catalog Inquiry: ${product.title}`);
      const emailBody = encodeURIComponent(`Hello Weliza team,\n\nI want to inquire about the stitching pricing and wholesale timelines for "${product.title}".\n\nKind regards,\n[Your Name]`);
      modalEmailBtn.href = `mailto:${business.email}?subject=${emailSubject}&body=${emailBody}`;

      modal.style.display = 'flex';
    }
  };
}

// Setup Scroll Reveal Observer
function setupScrollReveal() {
  const reveals = document.querySelectorAll('.scroll-reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, { threshold: 0.15 });

  reveals.forEach(el => observer.observe(el));
}

// Subtle parallax on hero elements + shrinking navbar on scroll
function setupHeroParallax() {
  const heroMark = document.querySelector('.hero-mark');
  const circle1 = document.querySelector('.circle-1');
  const circle2 = document.querySelector('.circle-2');
  const navbar = document.getElementById('navbar');
  let lastY = -1;

  function onScroll() {
    const y = window.scrollY;
    if (y === lastY) return;
    lastY = y;

    if (y < window.innerHeight) {
      if (heroMark) heroMark.style.transform = `translateY(${y * 0.15}px)`;
      if (circle1) circle1.style.transform = `translateY(${y * 0.08}px)`;
      if (circle2) circle2.style.transform = `translateY(${y * -0.06}px)`;
    }

    if (navbar) {
      navbar.classList.toggle('navbar-scrolled', y > 40);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
