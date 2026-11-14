// Weliza emails (sent through EmailJS).
// STEP: paste your 3 EmailJS values between the quotes below, save, and upload this file.
// Leave them empty to keep emails switched off. The site works either way.
window.WELIZA_MAIL = {
  serviceId: '',    // EmailJS "Service ID", looks like service_abc123
  templateId: '',   // EmailJS "Template ID", looks like template_abc123
  publicKey: '',    // EmailJS "Public Key"
  ownerEmail: 'welizafashions@gmail.com'
};
window.WelizaMail = {
  ready() { const m = window.WELIZA_MAIL; return !!(m.serviceId && m.templateId && m.publicKey); },
  async send(to, subject, message) {
    if (!this.ready() || !to) return false;
    const m = window.WELIZA_MAIL;
    try {
      const r = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: m.serviceId, template_id: m.templateId, user_id: m.publicKey, template_params: { to_email: to, subject, message } })
      });
      return r.ok;
    } catch (e) { return false; }
  }
};
