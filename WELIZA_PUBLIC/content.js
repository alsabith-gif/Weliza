/**
 * ============================================================
 *  WELIZA WEBSITE CONTENT FILE
 * ============================================================
 *  EDIT THIS FILE TO CHANGE ANYTHING ON THE WEBSITE.
 *  Text, phone numbers, images, catalog items, partner logos —
 *  it all lives here. You do NOT need to touch index.html,
 *  app.js, or style.css to make normal content changes.
 *
 *  HOW TO EDIT:
 *  - Text: just change the words between the quotes " "
 *  - Images: change the path/URL between the quotes
 *      - Local image -> put the file inside /assets/... and
 *        write the path like: "assets/partners/myphoto.png"
 *      - Online image -> paste the full link like:
 *        "https://example.com/photo.jpg"
 *  - Do NOT delete commas (,) or quotes (" ") — only change
 *    what's INSIDE the quotes.
 * ============================================================
 */

const SITE_CONTENT = {

  // ------------------------------------------------------------
  // 1. BUSINESS INFO (used across navbar, footer, contact, WhatsApp links)
  // ------------------------------------------------------------
  business: {
    name: "Weliza",
    tagline: "Prayer wear & Custome stitching. GST-compliant, wedding-center trusted.",
    phoneDisplay: "+91 75929 45893",
    phoneWhatsApp: "917592945893",   // no + or spaces, used for wa.me links
    email: "info@weliza.in",
    address: "Koyilandy, Kozhikode, Kerala",
    gstin: "GSTIN: 32HRJPS4251J1ZF",
    year: "2026"
  },

  // ------------------------------------------------------------
  // 2. LOGOS & BRAND IMAGES
  // ------------------------------------------------------------
  brand: {
    navbarLogo: "assets/logo/logo_word_emerald.png",
    heroMark: "assets/logo/logo_mark_white.png",
    ctaBandMark: "assets/logo/logo_mark_white.png",
    footerLogo: "assets/logo/logo_full_white.png",
    favicon: "favicon.png",
    appleTouchIcon: "apple-touch-icon.png"
  },

  // ------------------------------------------------------------
  // 3. BROWSER TAB (title + description shown in Google search)
  // ------------------------------------------------------------
  meta: {
    pageTitle: "Weliza | Premium Prayer Dresses & Custom Clothing Stitching",
    pageDescription: "Weliza is a premium GST-registered clothing stitching brand. We specialize in prayer dresses and custom B2B stitching for leading wedding centers."
  },

  // ------------------------------------------------------------
  // 4. NAVIGATION MENU
  // ------------------------------------------------------------
  nav: [
    { label: "Home", href: "#home" },
    { label: "Catalog", href: "#catalog" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" }
  ],

  // ------------------------------------------------------------
  // 5. HERO SECTION (top banner)
  // ------------------------------------------------------------
  hero: {
    subtitle: "Stitched to Order",
    titleLine1: "Prayer Wear & Custome Stitching,",
    titleHighlight: "Perfected",
    description: "GST-registered. Trusted by leading wedding centers.",
    primaryButtonText: "Explore Catalog",
    secondaryButtonText: "Get in Touch"
  },

  // ------------------------------------------------------------
  // 6. CATALOG SECTION
  // ------------------------------------------------------------
  catalogSection: {
    subtitle: "The Collection",
    title: "Signature Stitching",
    filters: [
      { label: "All Designs", value: "all" },
      { label: "Prayer Dresses", value: "prayer" },
      { label: "Custom Stitching", value: "custom" }
    ]
  },

  // Catalog products — add, remove, or edit items freely.
  // "image" can be a local path (assets/catalog/xxx.jpg) or an online URL.
  // "category" must match one of the filter "value"s above (e.g. "prayer" or "custom").
  catalogItems: [
    {
      id: 1,
      title: "Weliza Classic White Cotton Prayer Dress",
      category: "prayer",
      desc: "Pure cotton. Pure white.Soft against the skin, light through long hours of wear.Made for comfort that stays with you, prayer after prayer.",
      spec: "100% Organic Cotton| All Size",
      image: "assets/catalog/White cotton prayer dresss.png"
    },
    {
      id: 2,
      title: "Weliza Crepe Prayer Dress — Simple & Elegant",
      category: "prayer",
      desc: "Soft crepe. Clean drape.A relaxed fit that moves with you, not against you.Simple, quiet, and made to feel effortless every time.",
      spec: " Premium Crepe| All Size",
      image: "assets/catalog/Crepe prayer dress.png"
    },
    {
      id: 4,
      title: "Weliza Printed Crepe Prayer Dress, Premium Style",
      category: "prayer",
      desc: "Subtle print. Flowing crepe.Designed to look as good as it feels.Elegant enough for everyday, comfortable enough for prayer",
      spec: "Printed Crepe | All Size",
      image: "assets/catalog/Crepe print prayer dress.png"
    },
    {
      id: 6,
      title: "Weliza Custom Stitching — Made to Measure",
      category: "custom",
      desc: "No two bodies are the same. No two dresses should be either.Every measurement taken with care, every stitch made to fit you.Made-to-measure — because comfort starts with the right fit.",
      spec: " Made-to-Measure | All Sizes",
      image: "assets/catalog/sewing machine.png"
    }
  ],

  // ------------------------------------------------------------
  // 7. ABOUT SECTION
  // ------------------------------------------------------------
  about: {
    subtitle: "Our Legacy",
    title: "Traditional Grace, Professional Scale",
    description: "GST-registered stitching for prayer wear, trusted by leading companies.",
    image1: "assets/about_image_1.png",
    image2: "assets/about_image_2.png",
    badgeNumber: "GST",
    badgeText: "Registered Partner",
    features: [
      { title: "Wedding Mall Supply" },
      { title: "Premium Fabric" },
      { title: "Transparent Billing" },
      { title: "Individual Orders" }
    ]
  },

  // ------------------------------------------------------------
  // 8. PARTNERS / TRUST STRIP
  // ------------------------------------------------------------
  //  Add a "logo" image and it will be shown instead of text.
  //  Leave logo as "" (empty) to show the plain text name instead.
  //  Recommended logo size: roughly 480x160px, transparent background.
  // ------------------------------------------------------------
  partnersSection: {
    eyebrow: "Trusted by leading wedding centers"
  },
  partners: [
    { name: "Al-Ameen", logo: "assets/partners/al-ameen.png" },
    { name: "Rose Manor", logo: "assets/partners/rose-manor.png" },
    { name: "Zafraan", logo: "assets/partners/zafraan.png" },
    { name: "The Grand Court", logo: "assets/partners/grand-court.png" }
  ],

  // ------------------------------------------------------------
  // 9. PROCESS SECTION ("How Every Piece Is Made")
  // ------------------------------------------------------------
  processSection: {
    subtitle: "Our Process",
    title: "How Every Piece Is Made",
    steps: [
      { number: "1", label: "Fabric Selection" },
      { number: "2", label: "Hand Stitching" },
      { number: "3", label: "Embroidery" },
      { number: "4", label: "Quality Check" }
    ]
  },

  // ------------------------------------------------------------
  // 10. CONTACT SECTION
  // ------------------------------------------------------------
  contact: {
    heading: "Let's Collaborate",
    subheading: "For wholesale, retail, or custom stitching inquiries.",
    formTitle: "Send an Inquiry",
    formSubmitText: "Send Inquiry via WhatsApp",
    interestOptions: [
      "Wedding Mall Representative",
      "Wholesale Distributor",
      "Individual Client"
    ]
  },

  // ------------------------------------------------------------
  // 11. QUICK-VIEW MODAL BUTTONS
  // ------------------------------------------------------------
  modal: {
    whatsAppButtonText: "WhatsApp Inquiry",
    emailButtonText: "Email"
  },

  // ------------------------------------------------------------
  // 12. CALL-TO-ACTION BAND (before footer)
  // ------------------------------------------------------------
  ctaBand: {
    title: "Ready to Stitch Your Next Order?",
    description: "Wholesale, retail, or bespoke — reach out on WhatsApp for a quick quote.",
    buttonText: "Chat on WhatsApp",
    whatsAppMessage: "Hi Weliza, I'd like a stitching quote."
  },

  floatingWhatsApp: {
    message: "Hi Weliza, I'd like to know more about your Products & services."
  },

  // ------------------------------------------------------------
  // 13. FOOTER
  // ------------------------------------------------------------
  footer: {
    socials: [
      { platform: "Instagram", url: "https://instagram.com/weliza" },
      { platform: "Facebook", url: "https://facebook.com/weliza" },
      { platform: "YouTube", url: "https://youtube.com/@weliza" },
      { platform: "WhatsApp", url: "https://wa.me/917592945893" },
      { platform: "LinkedIn", url: "https://linkedin.com/company/weliza" }
    ],
    navigationLinks: [
      { label: "Home", href: "#home" },
      { label: "Catalog", href: "#catalog" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" }
    ],
    collectionsTitle: "Collections",
    collectionsLinks: [
      { label: "Premium Prayer Dress", href: "#catalog" },
      { label: "Custom Stitching", href: "#catalog" },
      { label: "Wholesale Supply", href: "#catalog" }
    ],
    businessTitle: "Business",
    copyrightText: "Weliza Stitching Company. All rights reserved.",
    bottomLinks: [
      { label: "Privacy Policy", href: "/privacy-policy.html" },
      { label: "Terms of Service", href: "/terms-of-service.html" }
    ]
  }
};
