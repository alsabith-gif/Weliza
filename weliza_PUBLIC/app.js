/**
 * Weliza Web App - Public Website Logic
 * Handles catalog display, filtering, contact form actions, and WhatsApp linking.
 */

// Sample detailed catalog items
const CATALOG_ITEMS = [
  {
    id: 1,
    title: 'Premium Emerald Silk Prayer Dress',
    category: 'prayer',
    desc: 'Bespoke two-piece modest prayer wear stitched with ultra-soft satin silk, featuring delicate gold wrist embroidery.',
    spec: 'Premium Satin Silk | Free Size',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    title: 'Classic Pearl White Cotton Prayer Dress',
    category: 'prayer',
    desc: 'Lightweight, highly breathable organic cotton prayer dress designed with pure French lace borders. Perfect for daily use.',
    spec: '100% Organic Cotton | Medium/Large',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    title: 'Gold Embellished Bridal Gown Stitching',
    category: 'wedding',
    desc: 'Expert bridal stitching with intricate Zardozi hand-embroidery. Customized for high-end wedding mall showcases.',
    spec: 'Custom Tailoring | Custom Fit',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    title: 'Floral Pastel Embroidered Prayer Set',
    category: 'prayer',
    desc: 'Soft pastel pink rayon prayer dress decorated with hand-stitched floral borders on the hood and sleeves.',
    spec: 'Premium Rayon | Free Size',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    title: 'Custom Velvet Lehenga Stitching',
    category: 'wedding',
    desc: 'High-density micro-velvet stitching for wedding wear, featuring heavy border linings and double-cancan attachments.',
    spec: 'Bespoke Lehenga | Made-to-measure',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    title: 'Royal Silk Kurti & Salwar Suit Stitching',
    category: 'custom',
    desc: 'Premium Banarasi silk tailoring with contemporary necklines and precise seam finishes for individual boutiques.',
    spec: 'Raw Banarasi Silk | All Sizes',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80'
  }
];

document.addEventListener('DOMContentLoaded', () => {
  // Render Catalog
  renderCatalog('all');

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

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
});

// Setup Mobile Navigation Menu
function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const spans = menuToggle.querySelectorAll('span');
      spans[0].style.transform = navLinks.classList.contains('active') ? 'rotate(45deg) translate(6px, 6px)' : 'none';
      spans[1].style.opacity = navLinks.classList.contains('active') ? '0' : '1';
      spans[2].style.transform = navLinks.classList.contains('active') ? 'rotate(-45deg) translate(5deg, -5px)' : 'none';
      
      // Fix transform translation details
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

    // Close menu when link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      });
    });
  }
}

// Render catalog items to the grid
function renderCatalog(filter) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  grid.innerHTML = '';

  const filteredItems = filter === 'all' 
    ? CATALOG_ITEMS 
    : CATALOG_ITEMS.filter(item => item.category === filter);

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
            <i data-lucide="eye" style="width:16px;height:16px;"></i>
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
          <button class="btn catalog-action-btn" onclick="inquireWhatsApp('${item.title}')">
            <span>Inquire</span>
            <i data-lucide="chevron-right" style="width:16px;height:16px;"></i>
          </button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
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
  const navLinks = document.querySelectorAll('.nav-links a');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// Inquiry WhatsApp Handler
window.inquireWhatsApp = function(productTitle) {
  const phone = '919876543210';
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

      // Build WhatsApp message
      const whatsappPhone = '919876543210';
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
    const product = CATALOG_ITEMS.find(p => p.id === productId);
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

      // WhatsApp link
      const phone = '919876543210';
      const text = encodeURIComponent(`Hello Weliza! I saw "${product.title}" in your catalog and would like to get a quote.`);
      modalWhatsAppBtn.href = `https://wa.me/${phone}?text=${text}`;

      // Email link
      const emailSubject = encodeURIComponent(`Catalog Inquiry: ${product.title}`);
      const emailBody = encodeURIComponent(`Hello Weliza team,\n\nI want to inquire about the stitching pricing and wholesale timelines for "${product.title}".\n\nKind regards,\n[Your Name]`);
      modalEmailBtn.href = `mailto:info@weliza.in?subject=${emailSubject}&body=${emailBody}`;

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
