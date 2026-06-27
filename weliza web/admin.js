/**
 * Weliza Web App - Admin Control Panel Logic
 * Manages database states, authentication, ChartJS rendering, PDF generation, and CRM.
 */

const { getAll, add, update, remove, getById } = window.WelizaDB || {};

// Global variables to hold chart instances
let salesChartInstance = null;
let gstChartInstance = null;
let clientChartInstance = null;

// Default Admin Credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'weliza123';

document.addEventListener('DOMContentLoaded', () => {
  // Check auth state
  checkAuthentication();

  // Initialize Lucide Icons
  if (window.lucide) window.lucide.createIcons();
});

// Safe Session Storage Helpers (bypasses browser security locks on local files)
function setSessionItem(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    window[key] = value; // Fallback to global variable
  }
}

function getSessionItem(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    return window[key] || null;
  }
}

function removeSessionItem(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    delete window[key];
  }
}

// 1. AUTHENTICATION LOGIC
function checkAuthentication() {
  const authWrapper = document.getElementById('authWrapper');
  const adminPanel = document.getElementById('adminPanel');

  const isLoggedIn = window.welizaLoggedIn === true;

  if (isLoggedIn) {
    authWrapper.style.display = 'none';
    adminPanel.style.display = 'flex';
    initializeAdminWorkspace();
  } else {
    authWrapper.style.display = 'flex';
    adminPanel.style.display = 'none';
    setupAuthForm();
  }
}

function setupAuthForm() {
  const form = document.getElementById('authForm');
  const errorMsg = document.getElementById('authError');
  const passInput = document.getElementById('authPassword');
  form.onsubmit = (e) => {
    e.preventDefault();
    const pass = passInput.value;
    if (pass === ADMIN_PASS) {
      window.welizaLoggedIn = true;
      errorMsg.style.display = 'none';
      checkAuthentication();
    } else {
      errorMsg.style.display = 'block';
      passInput.value = '';
      passInput.focus();
      passInput.style.border = '1px solid red';
      setTimeout(() => { passInput.style.border = ''; }, 2000);
      errorMsg.textContent = '✕ Wrong password. Please try again.';
      errorMsg.style.display = 'block';
      document.getElementById('authPassword').value = '';
      document.getElementById('authPassword').focus();
    }
  };
}

// 2. ADMIN WORKSPACE INITIALIZATION
async function initializeAdminWorkspace() {
  // Seed Database if empty
  await seedDatabaseIfNeeded();

  // Setup Sidebar Tabs
  setupTabs();

  // Load Database Items
  await reloadDashboardData();

  // Setup Invoice Creator Logic
  setupInvoiceCreator();

  // Setup Purchase Log Logic
  setupPurchaseLog();

  // Setup Client CRM Logic
  setupClientCRM();

  // Setup Settings
  setupSettings();

  // Setup Attach PDF Modal
  setupAttachPdfModal();

  // Setup Hamburger Menu
  setupHamburger();

  // Setup CSV Bulk Import for Invoices
  setupCsvImport();

  // Setup Item Presets (auto-fill catalog)
  await setupItemPresets();

  // Setup Logout Button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    window.welizaLoggedIn = false;
    location.reload();
  });
}

// Seed Mock Data for beautiful visual display on first load
async function seedDatabaseIfNeeded() {
  const clients = await getAll('clients');
  const invoices = await getAll('invoices');
  const purchases = await getAll('purchases');

  if (clients.length === 0) {
    console.log('Seeding initial data...');
    // Seed Clients
    const c1 = await add('clients', {
      name: 'Jayalakshmi Wedding Center',
      gstin: '32AAAJW9876C1ZB',
      phone: '+91 94460 12345',
      email: 'purchase@jayalakshmi.com',
      address: 'MG Road, Ernakulam, Kochi - 682035',
      createdAt: new Date().toISOString()
    });

    const c2 = await add('clients', {
      name: 'Kalyan Silks Mall',
      gstin: '32AAAKM5432R2ZC',
      phone: '+91 98470 56789',
      email: 'billing@kalyansilks.com',
      address: 'Palakkad Road, Thrissur - 680001',
      createdAt: new Date().toISOString()
    });

    const c3 = await add('clients', {
      name: 'Aisha Fathima Boutique',
      gstin: '',
      phone: '+91 90480 98765',
      email: 'aisha@boutique.com',
      address: 'Calicut Bypass, Kozhikode - 673005',
      createdAt: new Date().toISOString()
    });

    // Seed Invoices (Sales)
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 15);
    const twoMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 10);

    await add('invoices', {
      invoiceNumber: 'WEL-2026-0001',
      clientId: c1,
      clientName: 'Jayalakshmi Wedding Center',
      clientGstin: '32AAAJW9876C1ZB',
      clientAddress: 'MG Road, Ernakulam, Kochi - 682035',
      date: twoMonthsAgo.toISOString().split('T')[0],
      dueDate: new Date(twoMonthsAgo.setDate(twoMonthsAgo.getDate() + 30)).toISOString().split('T')[0],
      items: [
        { desc: 'Bulk Stitching - Emerald Satin Silk Prayer Dress', qty: 100, rate: 850, gstRate: 5, taxable: 85000, gstAmount: 4250, total: 89250 },
        { desc: 'Custom Designer Bridal Lace Work', qty: 10, rate: 2500, gstRate: 12, taxable: 25000, gstAmount: 3000, total: 28000 }
      ],
      taxableTotal: 110000,
      gstTotal: 7250,
      grandTotal: 117250,
      status: 'Paid',
      createdAt: new Date().toISOString()
    });

    await add('invoices', {
      invoiceNumber: 'WEL-2026-0002',
      clientId: c2,
      clientName: 'Kalyan Silks Mall',
      clientGstin: '32AAAKM5432R2ZC',
      clientAddress: 'Palakkad Road, Thrissur - 680001',
      date: lastMonth.toISOString().split('T')[0],
      dueDate: new Date(lastMonth.setDate(lastMonth.getDate() + 30)).toISOString().split('T')[0],
      items: [
        { desc: 'Premium French Lace Prayer Wear Stitching', qty: 150, rate: 600, gstRate: 5, taxable: 90000, gstAmount: 4500, total: 94500 }
      ],
      taxableTotal: 90000,
      gstTotal: 4500,
      grandTotal: 94500,
      status: 'Paid',
      createdAt: new Date().toISOString()
    });

    await add('invoices', {
      invoiceNumber: 'WEL-2026-0003',
      clientId: c1,
      clientName: 'Jayalakshmi Wedding Center',
      clientGstin: '32AAAJW9876C1ZB',
      clientAddress: 'MG Road, Ernakulam, Kochi - 682035',
      date: today.toISOString().split('T')[0],
      dueDate: new Date(today.setDate(today.getDate() + 15)).toISOString().split('T')[0],
      items: [
        { desc: 'Bulk Tailoring - Cotton Daily Prayer Gowns', qty: 200, rate: 450, gstRate: 5, taxable: 90000, gstAmount: 4500, total: 94500 }
      ],
      taxableTotal: 90000,
      gstTotal: 4500,
      grandTotal: 94500,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    // Seed Purchases (Expenses)
    await add('purchases', {
      supplierName: 'Thirupur Cotton Textiles',
      supplierGstin: '33AAACT1234E1Z9',
      billNumber: 'TEX-9871',
      date: twoMonthsAgo.toISOString().split('T')[0],
      taxableAmount: 45000,
      gstRate: 5,
      gstAmount: 2250,
      totalAmount: 47250,
      pdfName: '',
      pdfData: '',
      createdAt: new Date().toISOString()
    });

    await add('purchases', {
      supplierName: 'Kochi Lace & Thread Emporium',
      supplierGstin: '32KLTE5432F1Z1',
      billNumber: 'BILL-431',
      date: lastMonth.toISOString().split('T')[0],
      taxableAmount: 15000,
      gstRate: 12,
      gstAmount: 1800,
      totalAmount: 16800,
      pdfName: '',
      pdfData: '',
      createdAt: new Date().toISOString()
    });
  }
}

// Tab navigation handler
function setupTabs() {
  const menuButtons = document.querySelectorAll('.nav-link[data-tab]');
  const tabContents = document.querySelectorAll('.view');
  const title = document.getElementById('currentTabTitle');
  const desc = document.getElementById('currentTabDesc');

  const tabDetails = {
    'dashboard': { title: 'Dashboard Stats', desc: 'Real-time business performance, GST logs, and charts.' },
    'invoice-creator': { title: 'Invoice Creator', desc: 'Generate customized professional GST invoices and download PDFs.' },
    'invoices-list': { title: 'Sales & Invoices Database', desc: 'Overview of all your client billing and invoice statuses.' },
    'purchases': { title: 'Purchases & Expenses', desc: 'Record raw material logs, operational expenses, and store receipt files.' },
    'clients': { title: 'Client CRM Directory', desc: 'Manage your wedding center buyers and individual client list.' }
  };

  menuButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      menuButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');

      // Update Header Text
      if (tabDetails[tabId]) {
        title.textContent = tabDetails[tabId].title;
        desc.textContent = tabDetails[tabId].desc;
      }

      // Actionable refreshes based on tab
      if (tabId === 'dashboard') {
        await reloadDashboardData();
      } else if (tabId === 'invoice-creator') {
        populateClientSelect();
        resetInvoiceForm();
      } else if (tabId === 'invoices-list') {
        await loadInvoicesList();
      } else if (tabId === 'purchases') {
        await loadPurchasesList();
      } else if (tabId === 'clients') {
        await loadClientsCRM();
      }

      // Re-trigger icon rendering
      if (window.lucide) window.lucide.createIcons();
    });
  });
}

// 3. STATS & ANALYTICS CALCULATOR
async function reloadDashboardData() {
  const invoices = await getAll('invoices');
  const purchases = await getAll('purchases');

  let grossSales = 0;
  let gstOutput = 0;
  let grossPurchases = 0;
  let gstInput = 0;
  let outstanding = 0;

  invoices.forEach(inv => {
    grossSales += inv.taxableTotal || 0;
    gstOutput += inv.gstTotal || 0;
    if (inv.status === 'Pending') {
      outstanding += inv.grandTotal || 0;
    }
  });

  purchases.forEach(pur => {
    grossPurchases += pur.taxableAmount || 0;
    gstInput += pur.gstAmount || 0;
  });

  const netGstPayable = gstOutput - gstInput;

  // Render text stats
  document.getElementById('statGrossSales').textContent = formatCurrency(grossSales);
  document.getElementById('statGstOutput').textContent = formatCurrency(gstOutput);
  document.getElementById('statGrossPurchases').textContent = formatCurrency(grossPurchases);
  document.getElementById('statGstInput').textContent = formatCurrency(gstInput);
  document.getElementById('statGstNet').textContent = formatCurrency(netGstPayable);
  document.getElementById('statOutstanding').textContent = formatCurrency(outstanding);

  // Render recent invoices table
  renderRecentInvoices(invoices);

  // Load Charts
  renderCharts(invoices, purchases);
}

function renderRecentInvoices(invoices) {
  const tbody = document.getElementById('recentInvoicesTableBody');
  tbody.innerHTML = '';

  // Sort by date descending, take top 5
  const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No invoices logged.</td></tr>';
    return;
  }

  sorted.forEach(inv => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${inv.invoiceNumber}</strong></td>
      <td>${inv.clientName}</td>
      <td>${inv.date}</td>
      <td>${formatCurrency(inv.grandTotal)}</td>
      <td>${formatCurrency(inv.gstTotal)}</td>
      <td><span class="badge ${inv.status === 'Paid' ? 'badge-paid' : 'badge-pending'}">${inv.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// 4. CHART RENDERING ENGINE
function renderCharts(invoices, purchases) {
  // Group sales & purchases by month
  const monthlyData = {};
  
  // Initialize last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    months.push(label);
    monthlyData[label] = { sales: 0, purchases: 0, gstOut: 0, gstIn: 0 };
  }

  // Map Sales (Invoices)
  invoices.forEach(inv => {
    const d = new Date(inv.date);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (monthlyData[label]) {
      monthlyData[label].sales += inv.taxableTotal || 0;
      monthlyData[label].gstOut += inv.gstTotal || 0;
    }
  });

  // Map Purchases
  purchases.forEach(pur => {
    const d = new Date(pur.date);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (monthlyData[label]) {
      monthlyData[label].purchases += pur.taxableAmount || 0;
      monthlyData[label].gstIn += pur.gstAmount || 0;
    }
  });

  const salesData = months.map(m => monthlyData[m].sales);
  const purchaseData = months.map(m => monthlyData[m].purchases);
  const gstOutData = months.map(m => monthlyData[m].gstOut);
  const gstInData = months.map(m => monthlyData[m].gstIn);

  // Group client shares for Sales Chart
  const clientShares = {};
  invoices.forEach(inv => {
    clientShares[inv.clientName] = (clientShares[inv.clientName] || 0) + inv.grandTotal;
  });
  const clientLabels = Object.keys(clientShares);
  const clientValues = Object.values(clientShares);

  // 1. Sales vs Purchases Chart
  if (salesChartInstance) salesChartInstance.destroy();
  const ctxSales = document.getElementById('salesChart').getContext('2d');
  salesChartInstance = new Chart(ctxSales, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Sales (Taxable)',
          data: salesData,
          backgroundColor: '#34a853',
          borderRadius: 4
        },
        {
          label: 'Purchases (Taxable)',
          data: purchaseData,
          backgroundColor: '#f15bb5',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ccc' } },
        x: { grid: { display: false }, ticks: { color: '#ccc' } }
      },
      plugins: {
        legend: { labels: { color: '#fff' } }
      }
    }
  });

  // 2. GST Chart
  if (gstChartInstance) gstChartInstance.destroy();
  const ctxGst = document.getElementById('gstChart').getContext('2d');
  gstChartInstance = new Chart(ctxGst, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Output GST (Collected)',
          data: gstOutData,
          borderColor: '#c5a059',
          backgroundColor: 'transparent',
          tension: 0.3,
          borderWidth: 3
        },
        {
          label: 'Input GST (Paid)',
          data: gstInData,
          borderColor: '#2ec4b6',
          backgroundColor: 'transparent',
          tension: 0.3,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ccc' } },
        x: { grid: { display: false }, ticks: { color: '#ccc' } }
      },
      plugins: {
        legend: { labels: { color: '#fff' } }
      }
    }
  });

  // 3. Client Share Chart
  if (clientChartInstance) clientChartInstance.destroy();
  const ctxClient = document.getElementById('clientChart').getContext('2d');
  clientChartInstance = new Chart(ctxClient, {
    type: 'doughnut',
    data: {
      labels: clientLabels,
      datasets: [{
        data: clientValues,
        backgroundColor: ['#c5a059', '#34a853', '#9b5de5', '#2ec4b6', '#e63946'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#fff', boxWidth: 12 } }
      }
    }
  });
}

// 5. INVOICE CREATOR MODULE
async function setupInvoiceCreator() {
  const form = document.getElementById('invoiceForm');
  const addRowBtn = document.getElementById('btnAddItemRow');
  const printPreviewBtn = document.getElementById('btnPrintPreviewBtn');
  const inlineAddClientBtn = document.getElementById('btnAddNewClientInline');
  
  // Set default dates
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('invDate').value = todayStr;
  const due = new Date();
  due.setDate(due.getDate() + 15);
  document.getElementById('invDueDate').value = due.toISOString().split('T')[0];

  // Auto invoice number generation
  const invoices = await getAll('invoices');
  const nextNum = invoices.length + 1;
  const zeroPadded = String(nextNum).padStart(4, '0');
  document.getElementById('invNumber').value = `WEL-${new Date().getFullYear()}-${zeroPadded}`;

  // Populate client select
  await populateClientSelect();

  // Handle Dynamic Rows
  addRowBtn.addEventListener('click', () => {
    addInvoiceRow();
  });

  // Add initial row
  addInvoiceRow();

  // Watch for changes to update Live Preview & calculations
  form.addEventListener('input', () => {
    calculateInvoiceTotals();
  });

  // Inline Client Creation
  inlineAddClientBtn.addEventListener('click', () => {
    const modal = document.getElementById('inlineClientModal');
    modal.style.display = 'flex';
  });

  document.getElementById('inlineModalClose').addEventListener('click', () => {
    document.getElementById('inlineClientModal').style.display = 'none';
  });

  document.getElementById('inlineClientForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('inlineName').value.trim();
    const gstin = document.getElementById('inlineGstin').value.trim();
    const phone = document.getElementById('inlinePhone').value.trim();
    const address = document.getElementById('inlineAddress').value.trim();

    const newId = await add('clients', {
      name, gstin, phone, address, createdAt: new Date().toISOString()
    });

    alert('Client Registered!');
    document.getElementById('inlineClientForm').reset();
    document.getElementById('inlineClientModal').style.display = 'none';
    
    await populateClientSelect();
    document.getElementById('invClientSelect').value = newId;
    calculateInvoiceTotals();
  });

  // Print/Download PDF action
  printPreviewBtn.addEventListener('click', () => {
    printInvoiceFromSheet();
  });

  // Submit/Save Form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const clientVal = document.getElementById('invClientSelect').value;
    if (!clientVal) {
      alert('Please select a client');
      return;
    }

    const client = await getById('clients', parseInt(clientVal));
    const invoiceNumber = document.getElementById('invNumber').value.trim();
    const date = document.getElementById('invDate').value;
    const dueDate = document.getElementById('invDueDate').value;
    const status = document.getElementById('invPaymentStatus').value;

    const rows = document.querySelectorAll('.item-edit-row');
    const items = [];
    rows.forEach(row => {
      const desc = row.querySelector('.col-desc').value.trim();
      const qty = parseFloat(row.querySelector('.col-qty').value) || 0;
      const rate = parseFloat(row.querySelector('.col-rate').value) || 0;
      const gstRate = parseFloat(row.querySelector('.col-gst-rate').value) || 0;

      if (desc && qty > 0) {
        const taxable = qty * rate;
        const gstAmount = (taxable * gstRate) / 100;
        const total = taxable + gstAmount;

        items.push({ desc, qty, rate, gstRate, taxable, gstAmount, total });
      }
    });

    if (items.length === 0) {
      alert('Please add at least one valid item');
      return;
    }

    // Totals
    let taxableTotal = 0;
    let gstTotal = 0;
    items.forEach(it => {
      taxableTotal += it.taxable;
      gstTotal += it.gstAmount;
    });
    const grandTotal = taxableTotal + gstTotal;

    const invoiceObj = {
      invoiceNumber,
      clientId: client.id,
      clientName: client.name,
      clientGstin: client.gstin,
      clientAddress: client.address,
      date,
      dueDate,
      items,
      taxableTotal,
      gstTotal,
      grandTotal,
      status,
      createdAt: new Date().toISOString()
    };

    try {
      await add('invoices', invoiceObj);
      alert('Invoice Stored Successfully in local database!');
      resetInvoiceForm();
      
      // Auto switch to list tab
      document.querySelector('.nav-link[data-tab="invoices-list"]').click();
    } catch(err) {
      console.error(err);
      alert('Invoice save failed. Check console or duplicate invoice number.');
    }
  });
}

function addInvoiceRow(desc = '', qty = '', rate = '', gstRate = '5') {
  const tbody = document.getElementById('invoiceItemsTbody');
  const tr = document.createElement('tr');
  tr.className = 'item-edit-row';

  tr.innerHTML = `
    <td><input type="text" class="col-desc" list="itemPresetsList" placeholder="Product name/stitching service..." value="${desc}" required></td>
    <td><input type="number" class="col-qty" placeholder="1" min="1" value="${qty}" required></td>
    <td><input type="number" step="0.01" class="col-rate" placeholder="0.00" value="${rate}" required></td>
    <td>
      <select class="col-gst-rate">
        <option value="0" ${gstRate === '0' ? 'selected' : ''}>0%</option>
        <option value="5" ${gstRate === '5' ? 'selected' : ''}>5%</option>
        <option value="12" ${gstRate === '12' ? 'selected' : ''}>12%</option>
        <option value="18" ${gstRate === '18' ? 'selected' : ''}>18%</option>
      </select>
    </td>
    <td style="text-align: center;"><button type="button" class="btn btn-del" onclick="this.closest('tr').remove(); calculateInvoiceTotals();"><i data-lucide="trash-2"></i></button></td>
  `;

  tbody.appendChild(tr);

  // Autofill rate/GST when typed description matches a saved preset name
  const descInput = tr.querySelector('.col-desc');
  descInput.addEventListener('input', () => {
    const match = (window.itemPresetsCache || []).find(
      p => p.name.trim().toLowerCase() === descInput.value.trim().toLowerCase()
    );
    if (match) {
      tr.querySelector('.col-rate').value = match.rate;
      tr.querySelector('.col-gst-rate').value = String(match.gstRate);
      calculateInvoiceTotals();
    }
  });

  if (window.lucide) window.lucide.createIcons();
  calculateInvoiceTotals();
}

async function populateClientSelect() {
  const select = document.getElementById('invClientSelect');
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Choose Client --</option>';

  const clients = await getAll('clients');
  clients.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name + (c.gstin ? ` (${c.gstin})` : ' (No GST)');
    select.appendChild(opt);
  });

  if (currentVal) select.value = currentVal;
}

// Live calculation & HTML preview rendering
window.calculateInvoiceTotals = async function() {
  const rows = document.querySelectorAll('.item-edit-row');
  let taxableTotal = 0;
  let gstTotal = 0;

  const itemDetails = [];

  rows.forEach(row => {
    const desc = row.querySelector('.col-desc').value;
    const qty = parseFloat(row.querySelector('.col-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.col-rate').value) || 0;
    const gstRate = parseFloat(row.querySelector('.col-gst-rate').value) || 0;

    const taxable = qty * rate;
    const gstAmt = (taxable * gstRate) / 100;
    const total = taxable + gstAmt;

    taxableTotal += taxable;
    gstTotal += gstAmt;

    if (desc) {
      itemDetails.push({ desc, qty, rate, gstRate, taxable, gstAmt, total });
    }
  });

  const grandTotal = taxableTotal + gstTotal;

  document.getElementById('summaryTaxable').textContent = formatCurrency(taxableTotal);
  document.getElementById('summaryGst').textContent = formatCurrency(gstTotal);
  document.getElementById('summaryGrand').textContent = formatCurrency(grandTotal);

  // Render Printable Invoice Sheet Live
  await renderInvoicePreviewSheet(itemDetails, taxableTotal, gstTotal, grandTotal);
};

async function renderInvoicePreviewSheet(items, taxableTotal, gstTotal, grandTotal) {
  const sheet = document.getElementById('invoicePrintSheet');

  const clientVal = document.getElementById('invClientSelect').value;
  const invNumber = document.getElementById('invNumber').value;
  const dateVal   = document.getElementById('invDate').value;

  let clientName    = 'Select Client';
  let clientGstin   = '---';
  let clientAddress = '---';
  let clientPhone   = '---';
  let clientPan     = '---';

  if (clientVal) {
    const client = await getById('clients', parseInt(clientVal));
    if (client) {
      clientName    = client.name;
      clientGstin   = client.gstin   || 'Unregistered';
      clientPan     = client.pan     || '---';
      clientPhone   = client.phone   || '---';

      const addressParts = [client.address];
      const cityLine = [client.city, client.state, client.postalCode].filter(Boolean).join(', ');
      if (cityLine) addressParts.push(cityLine);
      if (client.country) addressParts.push(client.country);
      clientAddress = addressParts.filter(Boolean).join(', ') || '---';
    }
  }

  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;

  let itemsHtml = '';
  if (items.length === 0) {
    itemsHtml = `<tr><td colspan="9" style="text-align:center;color:#999;padding:14px;">No items added</td></tr>`;
  } else {
    items.forEach((it, idx) => {
      const itemCgst = (it.taxable * it.gstRate / 100) / 2;
      const itemSgst = itemCgst;
      itemsHtml += `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 8px;text-align:center;border:1px solid #e2e8f0;">${idx + 1}</td>
          <td style="padding:10px 8px;border:1px solid #e2e8f0;">${it.desc}</td>
          <td style="padding:10px 8px;text-align:center;border:1px solid #e2e8f0;">${it.gstRate}%</td>
          <td style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0;">${it.qty}</td>
          <td style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0;">₹${formatCurrencyRaw(it.rate)}</td>
          <td style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0;">₹${formatCurrencyRaw(it.taxable)}</td>
          <td style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0;">₹${formatCurrencyRaw(itemCgst)}</td>
          <td style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0;">₹${formatCurrencyRaw(itemSgst)}</td>
          <td style="padding:10px 8px;text-align:right;border:1px solid #e2e8f0;font-weight:600;">₹${formatCurrencyRaw(it.total)}</td>
        </tr>`;
    });
  }

  const G = '#1e4735';
  const B = '#e8f5e9';

  // Load user settings (fallback to defaults)
  const _s = getSettings();
  const bizName    = _s.BizName    || 'WELIZA';
  const bizAddr    = _s.BizAddress || 'Kozhikode, Kerala, India — 673620';
  const bizGstin   = _s.BizGstin  || '32HRJPS4251J1ZF';
  const bizPan     = _s.BizPan    || 'HRJPS4251J';
  const bizEmail   = _s.BizEmail  || 'welizadesign@gmail.com';
  const bizPhone   = _s.BizPhone  || '+91 75929 45893';
  const bankAccName  = _s.BankAccName  || 'WELIZA DESIGN';
  const bankAccNum   = _s.BankAccNum   || '8230953768';
  const bankIfsc     = _s.BankIfsc     || 'IDIB000K213';
  const bankAccType  = _s.BankAccType  || 'Current';
  const bankName     = _s.BankName     || 'INDIAN BANK';

  const invoiceHTML = `
  <div style="width:210mm;min-height:297mm;margin:0 auto;background:#fff;color:#1a1a1a;font-family:'Inter',sans-serif;font-size:12px;line-height:1.5;padding:64px 28px 28px;box-sizing:border-box;position:relative;display:flex;flex-direction:column;">

    <div style="flex:1;">
      <!-- HEADER -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
        <div>
          <h2 style="font-size:1.8rem;font-weight:800;color:${G};margin:0;letter-spacing:2px;">${bizName}</h2>
          <p style="font-size:11px;color:#555;margin:3px 0 0;">${bizAddr}</p>
          <p style="font-size:11px;color:#555;margin:1px 0 0;">GSTIN: <strong>${bizGstin}</strong></p>
          <p style="font-size:11px;color:#555;margin:1px 0 0;">PAN: ${bizPan}</p>
          <p style="font-size:11px;color:#555;margin:1px 0 0;">Email: ${bizEmail}</p>
          <p style="font-size:11px;color:#555;margin:1px 0 0;">Phone: ${bizPhone}</p>
        </div>
        <div style="text-align:right;">
          <h3 style="font-size:1.4rem;font-weight:700;color:${G};margin:0;text-transform:uppercase;letter-spacing:1px;">Invoice</h3>
          <p style="font-size:12px;margin:6px 0 2px;"><strong>Invoice No #</strong> ${invNumber}</p>
          <p style="font-size:12px;margin:2px 0;"><strong>Invoice Date</strong> ${dateVal}</p>
        </div>
      </div>

      <!-- BILLED TO -->
      <div style="background:${B};border:1px solid #c8e6c9;border-radius:6px;padding:14px 16px;margin-bottom:20px;">
        <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#666;margin:0 0 6px;letter-spacing:0.5px;">Billed To</p>
        <h3 style="font-size:14px;font-weight:700;color:${G};margin:0 0 4px;">${clientName}</h3>
        <p style="font-size:11px;color:#444;margin:1px 0;">${clientAddress}</p>
        <p style="font-size:11px;color:#444;margin:1px 0;">GSTIN: <strong>${clientGstin}</strong></p>
        <p style="font-size:11px;color:#444;margin:1px 0;">PAN: ${clientPan}</p>
        <p style="font-size:11px;color:#444;margin:1px 0;">Phone: ${clientPhone}</p>
      </div>

      <!-- SUPPLY INFO -->
      <div style="display:flex;gap:16px;margin-bottom:16px;font-size:11px;color:#555;">
        <span><strong>Country of Supply:</strong> India</span>
        <span><strong>Place of Supply:</strong> Kerala (32)</span>
      </div>

      <!-- ITEMS TABLE -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:11.5px;">
        <thead>
          <tr style="background:${G};color:#fff;">
            <th style="padding:9px 8px;border:1px solid ${G};text-align:center;">Item</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:left;">Description</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:center;">GST Rate</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:right;">Qty</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:right;">Rate</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:right;">Amount</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:right;">CGST</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:right;">SGST</th>
            <th style="padding:9px 8px;border:1px solid ${G};text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <!-- BOTTOM: Bank + Totals -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-top:10px;">
        <div style="background:${B};border:1px solid #c8e6c9;border-radius:6px;padding:14px 16px;min-width:220px;font-size:11.5px;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;color:#666;margin:0 0 8px;letter-spacing:0.5px;">Bank Details</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#666;padding:2px 0;padding-right:12px;">Account Name</td><td style="font-weight:600;">${bankAccName}</td></tr>
            <tr><td style="color:#666;padding:2px 0;padding-right:12px;">Account Number</td><td style="font-weight:600;">${bankAccNum}</td></tr>
            <tr><td style="color:#666;padding:2px 0;padding-right:12px;">IFSC</td><td style="font-weight:600;">${bankIfsc}</td></tr>
            <tr><td style="color:#666;padding:2px 0;padding-right:12px;">Account Type</td><td style="font-weight:600;">${bankAccType}</td></tr>
            <tr><td style="color:#666;padding:2px 0;padding-right:12px;">Bank</td><td style="font-weight:600;">${bankName}</td></tr>
          </table>
        </div>
        <div style="min-width:220px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#555;">Amount</span><span>₹${formatCurrencyRaw(taxableTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#555;">CGST</span><span>₹${formatCurrencyRaw(cgst)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;">
            <span style="color:#555;">SGST</span><span>₹${formatCurrencyRaw(sgst)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:700;color:${G};border-top:2px solid ${G};margin-top:4px;">
            <span>Total (INR)</span><span>₹${formatCurrencyRaw(grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM NOTE — pinned to end of page -->
    <div style="margin-top:auto;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="font-size:10px;color:#888;margin:0;">This is an electronically generated document, no signature is required.</p>
    </div>

  </div>`;

  sheet.innerHTML = invoiceHTML;

  // Store HTML for PDF download
  sheet._invoiceHTML = invoiceHTML;
}

async function resetInvoiceForm() {
  document.getElementById('invoiceForm').reset();
  document.getElementById('invoiceItemsTbody').innerHTML = '';
  
  // Reset date settings
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('invDate').value = todayStr;
  const due = new Date();
  due.setDate(due.getDate() + 15);
  document.getElementById('invDueDate').value = due.toISOString().split('T')[0];

  // Regene Number
  const invoices = await getAll('invoices');
  const nextNum = invoices.length + 1;
  const zeroPadded = String(nextNum).padStart(4, '0');
  document.getElementById('invNumber').value = `WEL-${new Date().getFullYear()}-${zeroPadded}`;

  addInvoiceRow();
}

// 6. INVOICES LIST MODULE
async function loadInvoicesList() {
  const invoices = await getAll('invoices');
  const tbody = document.getElementById('invoicesTableBody');
  tbody.innerHTML = '';

  const searchVal = document.getElementById('searchInvoicesInput').value.toLowerCase();
  const statusFilter = document.getElementById('filterInvoiceStatus').value;

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchVal) || 
                          inv.clientName.toLowerCase().includes(searchVal);
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No invoices match the filters.</td></tr>';
    return;
  }

  // Sort newest first
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(inv => {
    const tr = document.createElement('tr');
    const hasPdf = inv.attachedPdfData && inv.attachedPdfData.length > 0;
    tr.innerHTML = `
      <td><strong>${inv.invoiceNumber}</strong></td>
      <td>${inv.clientName}</td>
      <td>${inv.date}</td>
      <td>${formatCurrency(inv.taxableTotal)}</td>
      <td>${formatCurrency(inv.gstTotal)}</td>
      <td><strong>${formatCurrency(inv.grandTotal)}</strong></td>
      <td>
        <select class="status-select-inline" onchange="toggleInvoiceStatus(${inv.id}, this.value)" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 4px;">
          <option value="Paid" ${inv.status === 'Paid' ? 'selected' : ''}>Paid</option>
          <option value="Pending" ${inv.status === 'Pending' ? 'selected' : ''}>Pending</option>
        </select>
      </td>
      <td style="text-align: center;">
        ${hasPdf
          ? `<span style="display:inline-flex;align-items:center;gap:4px;">
               <button class="btn btn-action" onclick="viewInvoicePdf(${inv.id})" title="View PDF" style="color:#1e4735;"><i data-lucide="eye"></i></button>
               <button class="btn btn-action btn-action-del" onclick="removeInvoicePdf(${inv.id})" title="Remove PDF" style="font-size:0.7rem;padding:3px 6px;"><i data-lucide="x"></i></button>
             </span>`
          : `<label class="btn btn-action" title="Upload PDF" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
               <i data-lucide="upload"></i>
               <input type="file" accept="application/pdf" style="display:none;" onchange="attachInvoicePdf(${inv.id}, this)">
             </label>`
        }
      </td>
      <td style="text-align: center;">
        <button class="btn btn-action" onclick="printInvoiceFromDb(${inv.id})" title="Print Invoice"><i data-lucide="printer"></i></button>
        <button class="btn btn-action btn-action-del" onclick="deleteInvoiceFromDb(${inv.id})" title="Delete"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Rebind triggers
  document.getElementById('searchInvoicesInput').oninput = loadInvoicesList;
  document.getElementById('filterInvoiceStatus').onchange = loadInvoicesList;

  if (window.lucide) window.lucide.createIcons();
}

window.toggleInvoiceStatus = async function(id, newStatus) {
  const inv = await getById('invoices', id);
  if (inv) {
    inv.status = newStatus;
    await update('invoices', inv);
    await loadInvoicesList();
  }
};

window.deleteInvoiceFromDb = async function(id) {
  if (confirm('Are you sure you want to permanently delete this invoice?')) {
    await remove('invoices', id);
    await loadInvoicesList();
  }
};

// Attach a PDF file to an invoice
window.attachInvoicePdf = async function(id, inputEl) {
  const file = inputEl.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') { alert('Please select a PDF file.'); return; }
  if (file.size > 5 * 1024 * 1024) { alert('PDF must be under 5MB.'); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const inv = await getById('invoices', id);
    if (!inv) return;
    inv.attachedPdfData = e.target.result;
    inv.attachedPdfName = file.name;
    await update('invoices', inv);
    renderInvoicesList();
  };
  reader.readAsDataURL(file);
};

// View attached PDF in new tab
window.viewInvoicePdf = async function(id) {
  const inv = await getById('invoices', id);
  if (!inv || !inv.attachedPdfData) return;
  const w = window.open();
  w.document.write(`<iframe src="${inv.attachedPdfData}" style="width:100%;height:100%;border:none;" title="${inv.attachedPdfName || 'Invoice PDF'}"></iframe>`);
};

// Remove attached PDF from invoice
window.removeInvoicePdf = async function(id) {
  if (!confirm('Remove the attached PDF from this invoice?')) return;
  const inv = await getById('invoices', id);
  if (!inv) return;
  inv.attachedPdfData = '';
  inv.attachedPdfName = '';
  await update('invoices', inv);
  renderInvoicesList();
};

// Print template dynamically populated from saved records
window.printInvoiceFromDb = async function(id) {
  const inv = await getById('invoices', id);
  if (!inv) return;

  const printSheet = document.getElementById('invoicePrintSheet');
  
  // Render invoice items
  let itemsHtml = '';
  inv.items.forEach((it, idx) => {
    itemsHtml += `
      <tr>
        <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #e2e8f0; padding: 10px;">${it.desc}</td>
        <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">${it.qty}</td>
        <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">${formatCurrencyRaw(it.rate)}</td>
        <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: center;">${it.gstRate}%</td>
        <td style="border: 1px solid #e2e8f0; padding: 10px; text-align: right;">${formatCurrencyRaw(it.total)}</td>
      </tr>
    `;
  });

  await renderInvoicePreviewSheet(inv.items, inv.taxableTotal, inv.gstTotal, inv.grandTotal);
  setTimeout(() => { printInvoiceFromSheet(); }, 300);
};


// 7. PURCHASES & FILE UPLOAD MODULE
function setupPurchaseLog() {
  const form = document.getElementById('purchaseForm');
  const taxableInput = document.getElementById('purTaxable');
  const gstRateSelect = document.getElementById('purGstRate');
  const gstAmtInput = document.getElementById('purGstAmount');
  const totalInput = document.getElementById('purTotal');
  const fileInput = document.getElementById('purPdfFile');
  const fileNameDisplay = document.getElementById('pdfFileNameDisplay');

  // Default date
  document.getElementById('purDate').value = new Date().toISOString().split('T')[0];

  // Auto calculate GST and Grand total on expense input
  taxableInput.addEventListener('input', calculatePurchaseTotals);
  gstRateSelect.addEventListener('change', calculatePurchaseTotals);

  function calculatePurchaseTotals() {
    const taxable = parseFloat(taxableInput.value) || 0;
    const rate = parseFloat(gstRateSelect.value) || 0;
    const gst = (taxable * rate) / 100;
    const total = taxable + gst;

    gstAmtInput.value = gst.toFixed(2);
    totalInput.value = total.toFixed(2);
  }

  // Handle PDF uploader
  let attachedPdfData = '';
  let attachedPdfName = '';

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a valid PDF file only.');
        fileInput.value = '';
        return;
      }

      attachedPdfName = file.name;
      fileNameDisplay.textContent = `Attached: ${file.name}`;

      const reader = new FileReader();
      reader.onload = (event) => {
        attachedPdfData = event.target.result; // Base64 encoding
      };
      reader.readAsDataURL(file);
    } else {
      attachedPdfData = '';
      attachedPdfName = '';
      fileNameDisplay.textContent = '';
    }
  });

  // Submit Expense Form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const supplierName = document.getElementById('purSupplier').value.trim();
    const supplierGstin = document.getElementById('purSupplierGstin').value.trim();
    const billNumber = document.getElementById('purBillNumber').value.trim();
    const date = document.getElementById('purDate').value;
    const gstRate = parseFloat(gstRateSelect.value);
    const taxableAmount = parseFloat(taxableInput.value);
    const gstAmount = parseFloat(gstAmtInput.value);
    const totalAmount = parseFloat(totalInput.value);

    await add('purchases', {
      supplierName,
      supplierGstin,
      billNumber,
      date,
      gstRate,
      taxableAmount,
      gstAmount,
      totalAmount,
      pdfName: attachedPdfName,
      pdfData: attachedPdfData, // base64 string
      createdAt: new Date().toISOString()
    });

    alert('Purchase Logged Successfully!');
    form.reset();
    attachedPdfData = '';
    attachedPdfName = '';
    fileNameDisplay.textContent = '';
    
    // Set default date again
    document.getElementById('purDate').value = new Date().toISOString().split('T')[0];
    
    await loadPurchasesList();
  });
}

async function loadPurchasesList() {
  const purchases = await getAll('purchases');
  const tbody = document.getElementById('purchasesTableBody');
  tbody.innerHTML = '';

  const searchVal = document.getElementById('searchPurchasesInput').value.toLowerCase();

  const filtered = purchases.filter(p => {
    return p.supplierName.toLowerCase().includes(searchVal) || 
           p.billNumber.toLowerCase().includes(searchVal);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No purchases logged.</td></tr>';
    return;
  }

  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(p => {
    const tr = document.createElement('tr');
    
    const attachmentBtn = p.pdfData 
      ? `<button class="btn btn-action" onclick="downloadPdfFile('${p.pdfName}', '${p.pdfData}')" title="Download: ${p.pdfName}"><i data-lucide="file-down"></i></button>`
      : `<span style="color:#777; font-size:0.8rem;">No file</span>`;

    tr.innerHTML = `
      <td><strong>${p.supplierName}</strong></td>
      <td>${p.billNumber}</td>
      <td>${p.date}</td>
      <td>${formatCurrency(p.taxableAmount)}</td>
      <td>${formatCurrency(p.gstAmount)} (${p.gstRate}%)</td>
      <td><strong>${formatCurrency(p.totalAmount)}</strong></td>
      <td style="text-align: center;">${attachmentBtn}</td>
      <td style="text-align: center;">
        <button class="btn btn-action btn-action-del" onclick="deletePurchaseFromDb(${p.id})"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('searchPurchasesInput').oninput = loadPurchasesList;
  if (window.lucide) window.lucide.createIcons();
}

window.deletePurchaseFromDb = async function(id) {
  if (confirm('Are you sure you want to delete this purchase entry?')) {
    await remove('purchases', id);
    await loadPurchasesList();
  }
};

// Decodes Base64 data back to PDF file download trigger
window.downloadPdfFile = function(fileName, base64Data) {
  const link = document.createElement('a');
  link.href = base64Data;
  link.download = fileName || 'invoice-bill.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


// 8. CLIENT CRM MODULE
function setupClientCRM() {
  const form = document.getElementById('clientForm');
  const cancelBtn = document.getElementById('btnCancelClientEdit');

  // Submit client (Add or Edit mode)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const hiddenId = document.getElementById('clientIdHidden').value;
    const name = document.getElementById('cliName').value.trim();
    const gstin = document.getElementById('cliGstin').value.trim();
    const pan = document.getElementById('cliPan').value.trim();
    const phone = document.getElementById('cliPhone').value.trim();
    const email = document.getElementById('cliEmail').value.trim();
    const address = document.getElementById('cliAddress').value.trim();
    const city = document.getElementById('cliCity').value.trim();
    const state = document.getElementById('cliState').value.trim();
    const postalCode = document.getElementById('cliPostalCode').value.trim();
    const country = document.getElementById('cliCountry').value.trim();

    if (hiddenId) {
      // Edit mode
      const client = await getById('clients', parseInt(hiddenId));
      if (client) {
        client.name = name;
        client.gstin = gstin;
        client.pan = pan;
        client.phone = phone;
        client.email = email;
        client.address = address;
        client.city = city;
        client.state = state;
        client.postalCode = postalCode;
        client.country = country;

        await update('clients', client);
        alert('Client updated successfully');
      }
    } else {
      // Add mode
      await add('clients', {
        name, gstin, pan, phone, email, address, city, state, postalCode, country, createdAt: new Date().toISOString()
      });
      alert('Client profile added successfully');
    }

    resetClientForm();
    await loadClientsCRM();
  });

  cancelBtn.addEventListener('click', () => {
    resetClientForm();
  });
}

async function loadClientsCRM() {
  const clients = await getAll('clients');
  const invoices = await getAll('invoices');
  const tbody = document.getElementById('clientsTableBody');
  tbody.innerHTML = '';

  const searchVal = document.getElementById('searchClientsInput').value.toLowerCase();

  const filtered = clients.filter(c => {
    return c.name.toLowerCase().includes(searchVal) || 
           (c.gstin && c.gstin.toLowerCase().includes(searchVal));
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No client profiles found.</td></tr>';
    return;
  }

  filtered.forEach(c => {
    // Calculate business metrics for client
    let volume = 0;
    let unpaid = 0;

    invoices.forEach(inv => {
      if (inv.clientId === c.id) {
        volume += inv.grandTotal;
        if (inv.status === 'Pending') {
          unpaid += inv.grandTotal;
        }
      }
    });

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td>${c.gstin || '<span style="color:#777; font-size:0.8rem;">Unregistered</span>'}</td>
      <td>${c.phone}</td>
      <td style="font-size:0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${c.address}
        ${(c.city || c.state || c.postalCode) ? `<br><span style="font-size:0.78rem;color:#999;">${[c.city, c.state, c.postalCode].filter(Boolean).join(', ')}${c.country ? ' · ' + c.country : ''}</span>` : ''}
      </td>
      <td>
        <span style="display:block;">Billing: <strong>${formatCurrency(volume)}</strong></span>
        ${unpaid > 0 ? `<span style="font-size:0.8rem; color:#f482c7;">Pending: ${formatCurrency(unpaid)}</span>` : '<span style="font-size:0.8rem; color:#2ec4b6;">Paid clear</span>'}
      </td>
      <td style="text-align: center;">
        <button class="btn btn-action" onclick="editClientProfile(${c.id})" title="Edit Profile"><i data-lucide="edit-3"></i></button>
        <button class="btn btn-action btn-action-del" onclick="deleteClientProfile(${c.id})" title="Delete"><i data-lucide="trash-2"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('searchClientsInput').oninput = loadClientsCRM;
  if (window.lucide) window.lucide.createIcons();
}

window.editClientProfile = async function(id) {
  const c = await getById('clients', id);
  if (c) {
    document.getElementById('clientIdHidden').value = c.id;
    document.getElementById('cliName').value = c.name;
    document.getElementById('cliGstin').value = c.gstin || '';
    document.getElementById('cliPan').value = c.pan || '';
    document.getElementById('cliPhone').value = c.phone;
    document.getElementById('cliEmail').value = c.email || '';
    document.getElementById('cliAddress').value = c.address;
    document.getElementById('cliCity').value = c.city || '';
    document.getElementById('cliState').value = c.state || '';
    document.getElementById('cliPostalCode').value = c.postalCode || '';
    document.getElementById('cliCountry').value = c.country || 'India';

    document.getElementById('crmFormHeading').textContent = 'Edit Client Profile';
    document.getElementById('btnClientSubmit').querySelector('span').textContent = 'Update Profile';
    document.getElementById('btnCancelClientEdit').style.display = 'block';
  }
};

window.deleteClientProfile = async function(id) {
  if (confirm('Deleting this client will remove their profile from the CRM. Saved invoices will remain in the billing log. Continue?')) {
    await remove('clients', id);
    await loadClientsCRM();
  }
};

function resetClientForm() {
  document.getElementById('clientForm').reset();
  document.getElementById('clientIdHidden').value = '';
  document.getElementById('crmFormHeading').textContent = 'Add New Client / Wedding Mall';
  document.getElementById('btnClientSubmit').querySelector('span').textContent = 'Add Client Profile';
  document.getElementById('btnCancelClientEdit').style.display = 'none';
}


// 8b. BULK CSV IMPORT FOR INVOICES
function setupCsvImport() {
  const templateBtn = document.getElementById('btnDownloadCsvTemplate');
  const importBtn = document.getElementById('btnImportCsvBtn');
  const fileInput = document.getElementById('importCsvFile');

  if (!templateBtn || !importBtn || !fileInput) return;

  templateBtn.addEventListener('click', downloadCsvTemplate);

  importBtn.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const result = await importInvoicesFromCsv(text);
      alert(
        `Import complete!\n\nAdded: ${result.added} invoice(s)\n` +
        (result.skipped > 0 ? `Skipped: ${result.skipped} row(s) — check console for details.` : '')
      );
      await loadInvoicesList();
      await reloadDashboardData();
    } catch (err) {
      console.error(err);
      alert('Could not read that CSV file. Please use the downloaded template format.');
    }
  });
}

function downloadCsvTemplate() {
  const headers = [
    'invoiceNumber', 'clientName', 'clientGstin', 'clientAddress',
    'date', 'dueDate', 'description', 'quantity', 'rate', 'gstRate', 'status'
  ];
  const example = [
    'WEL-2025-0001', 'Jayalakshmi Wedding Center', '32AAAJW9876C1ZB',
    'MG Road, Ernakulam, Kochi - 682035', '2025-04-10', '2025-04-25',
    'Bulk Stitching - Prayer Dress Order', '100', '850', '5', 'Paid'
  ];
  const csvContent = headers.join(',') + '\n' + example.join(',') + '\n';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'weliza-invoice-import-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Very small CSV line parser (handles simple quoted fields with commas inside)
function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur.trim());
  return result;
}

async function importInvoicesFromCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file appears empty.');
  }

  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const requiredCols = ['invoiceNumber', 'clientName', 'date', 'quantity', 'rate', 'gstRate'];
  const missing = requiredCols.filter(c => !headers.includes(c));
  if (missing.length > 0) {
    throw new Error('CSV missing required columns: ' + missing.join(', '));
  }

  const existingClients = await getAll('clients');
  const existingInvoices = await getAll('invoices');
  const existingInvoiceNumbers = new Set(existingInvoices.map(i => i.invoiceNumber));

  let added = 0;
  let skipped = 0;

  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]);
    if (cells.length === 0 || cells.every(c => c === '')) continue;

    const row = {};
    headers.forEach((h, idx) => { row[h] = (cells[idx] || '').trim(); });

    if (!row.invoiceNumber || !row.clientName || !row.date) {
      console.warn('Skipping row (missing invoiceNumber/clientName/date):', row);
      skipped++;
      continue;
    }

    if (existingInvoiceNumbers.has(row.invoiceNumber)) {
      console.warn('Skipping row (duplicate invoice number already in DB):', row.invoiceNumber);
      skipped++;
      continue;
    }

    // Find or create the client
    let client = existingClients.find(c => c.name.toLowerCase() === row.clientName.toLowerCase());
    if (!client) {
      const newClientId = await add('clients', {
        name: row.clientName,
        gstin: row.clientGstin || '',
        phone: row.clientPhone || '',
        email: row.clientEmail || '',
        address: row.clientAddress || '',
        createdAt: new Date().toISOString()
      });
      client = { id: newClientId, name: row.clientName, gstin: row.clientGstin || '', address: row.clientAddress || '' };
      existingClients.push(client);
    }

    const qty = parseFloat(row.quantity) || 0;
    const rate = parseFloat(row.rate) || 0;
    const gstRate = parseFloat(row.gstRate) || 0;
    const taxable = qty * rate;
    const gstAmount = (taxable * gstRate) / 100;
    const total = taxable + gstAmount;

    const item = {
      desc: row.description || 'Imported invoice item',
      qty, rate, gstRate, taxable, gstAmount, total
    };

    const status = (row.status && row.status.toLowerCase() === 'paid') ? 'Paid' : 'Pending';

    const invoiceObj = {
      invoiceNumber: row.invoiceNumber,
      clientId: client.id,
      clientName: client.name,
      clientGstin: client.gstin || '',
      clientAddress: client.address || '',
      date: row.date,
      dueDate: row.dueDate || row.date,
      items: [item],
      taxableTotal: taxable,
      gstTotal: gstAmount,
      grandTotal: total,
      status,
      createdAt: new Date().toISOString()
    };

    await add('invoices', invoiceObj);
    existingInvoiceNumbers.add(row.invoiceNumber);
    added++;
  }

  return { added, skipped };
}

// 9. CURRENCY FORMATTING UTILITIES
function printInvoiceFromSheet() {
  const sheet = document.getElementById('invoicePrintSheet');
  const html = sheet._invoiceHTML || sheet.innerHTML;
  if (!html || html.includes('Fill in the form')) {
    alert('Please fill in the invoice details first.');
    return;
  }
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>Weliza Invoice</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      * {
        margin:0; padding:0; box-sizing:border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      html, body { background:#fff; font-family:'Inter',sans-serif; }
      @page { size: A4 portrait; margin: 0; }
      @media print {
        body { margin:0; }
      }
    </style>
  </head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 600);
}

// 10. ITEM PRESETS CATALOG (auto-fill on description match)
window.itemPresetsCache = [];

const DEFAULT_ITEM_PRESETS = [
  { name: 'Prayer Dress',        rate: 800,  gstRate: 5 },
  { name: 'Abaya',               rate: 1500, gstRate: 5 },
  { name: 'Hijab',               rate: 300,  gstRate: 5 },
  { name: 'Burqa',               rate: 1800, gstRate: 5 },
  { name: 'Khimar',              rate: 900,  gstRate: 5 },
  { name: 'Stitching Charge',    rate: 500,  gstRate: 12 },
  { name: 'Alteration Charge',   rate: 200,  gstRate: 12 }
];

async function setupItemPresets() {
  // Seed defaults once if the catalog is empty
  const existing = await getAll('itemPresets');
  if (existing.length === 0) {
    for (const preset of DEFAULT_ITEM_PRESETS) {
      await add('itemPresets', preset);
    }
  }

  await refreshItemPresetsCache();

  const modal = document.getElementById('itemPresetsModal');
  const openBtn = document.getElementById('btnManagePresets');
  const closeBtn = document.getElementById('presetsModalClose');
  const addForm = document.getElementById('presetAddForm');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      renderPresetsModalList();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.style.display = 'none';
    });
  }
  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('presetName').value.trim();
      const rate = parseFloat(document.getElementById('presetRate').value) || 0;
      const gstRate = parseFloat(document.getElementById('presetGstRate').value) || 0;
      if (!name) return;

      await add('itemPresets', { name, rate, gstRate });
      addForm.reset();
      document.getElementById('presetGstRate').value = '5';
      await refreshItemPresetsCache();
      renderPresetsModalList();
    });
  }
}

async function refreshItemPresetsCache() {
  window.itemPresetsCache = await getAll('itemPresets');
  const datalist = document.getElementById('itemPresetsList');
  if (datalist) {
    datalist.innerHTML = window.itemPresetsCache
      .map(p => `<option value="${p.name}"></option>`)
      .join('');
  }
}

async function renderPresetsModalList() {
  const container = document.getElementById('presetsListContainer');
  if (!container) return;

  if (window.itemPresetsCache.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#888;font-size:0.85rem;">No presets yet.</p>';
    return;
  }

  container.innerHTML = window.itemPresetsCache.map(p => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,0.05);">
      <div>
        <strong style="font-size:0.9rem;">${p.name}</strong>
        <div style="font-size:0.78rem;color:#999;">₹${formatCurrencyRaw(p.rate)} &middot; GST ${p.gstRate}%</div>
      </div>
      <button type="button" class="btn btn-action btn-action-del" onclick="deleteItemPreset(${p.id})" title="Delete">
        <i data-lucide="trash-2"></i>
      </button>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.deleteItemPreset = async function(id) {
  await remove('itemPresets', id);
  await refreshItemPresetsCache();
  renderPresetsModalList();
};

function formatCurrency(value) {
  return '₹' + parseFloat(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatCurrencyRaw(value) {
  return parseFloat(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ─── SETTINGS MODULE ───────────────────────────────────────────
const SETTINGS_KEY = 'weliza_settings';

function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch { return {}; }
}

function saveSettings(patch) {
  const current = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...patch }));
}

function loadSettingsForm() {
  const s = getSettings();
  // Billed From
  const fields = ['BizName','BizAddress','BizGstin','BizPan','BizEmail','BizPhone',
                  'BankAccName','BankAccNum','BankIfsc','BankAccType','BankName'];
  fields.forEach(key => {
    const el = document.getElementById('set' + key);
    if (el && s[key] !== undefined) el.value = s[key];
  });
}

function setupSettings() {
  loadSettingsForm();

  document.getElementById('billedFromForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings({
      BizName: document.getElementById('setBizName').value.trim(),
      BizAddress: document.getElementById('setBizAddress').value.trim(),
      BizGstin: document.getElementById('setBizGstin').value.trim(),
      BizPan: document.getElementById('setBizPan').value.trim(),
      BizEmail: document.getElementById('setBizEmail').value.trim(),
      BizPhone: document.getElementById('setBizPhone').value.trim(),
    });
    showToast('Business details saved!');
  });

  document.getElementById('bankDetailsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings({
      BankAccName: document.getElementById('setBankAccName').value.trim(),
      BankAccNum: document.getElementById('setBankAccNum').value.trim(),
      BankIfsc: document.getElementById('setBankIfsc').value.trim(),
      BankAccType: document.getElementById('setBankAccType').value.trim(),
      BankName: document.getElementById('setBankName').value.trim(),
    });
    showToast('Bank details saved!');
  });
}

function showToast(msg) {
  let toast = document.getElementById('welizaToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'welizaToast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e4735;color:#fff;padding:12px 20px;border-radius:8px;font-size:0.9rem;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ─── ATTACH PDF MODAL ──────────────────────────────────────────
function setupAttachPdfModal() {
  const openBtn   = document.getElementById('btnAttachPdfBtn');
  const modal     = document.getElementById('attachPdfModal');
  const closeBtn  = document.getElementById('attachPdfModalClose');
  const select    = document.getElementById('attachPdfInvoiceSelect');
  const fileInput = document.getElementById('attachPdfFileInput');
  const fileLabel = document.getElementById('attachPdfFileName');
  const saveBtn   = document.getElementById('attachPdfSaveBtn');
  const errDiv    = document.getElementById('attachPdfError');

  if (!openBtn || !modal) return;

  let pendingPdfData = '';
  let pendingPdfName = '';

  async function openModal() {
    // Populate invoice dropdown
    const invoices = await getAll('invoices');
    invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
    select.innerHTML = invoices.length
      ? `<option value="">— Select an invoice —</option>` +
        invoices.map(inv => {
          const hasPdf = inv.attachedPdfData ? ' 📎' : '';
          return `<option value="${inv.id}">${inv.invoiceNumber} · ${inv.clientName} · ${inv.date}${hasPdf}</option>`;
        }).join('')
      : `<option value="">No invoices found</option>`;

    // Reset state
    pendingPdfData = '';
    pendingPdfName = '';
    fileLabel.textContent = 'Click to choose a PDF…';
    fileInput.value = '';
    errDiv.style.display = 'none';

    modal.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  }

  openBtn.addEventListener('click', openModal);

  closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    errDiv.style.display = 'none';
    if (!file) return;
    if (file.type !== 'application/pdf') {
      errDiv.textContent = 'Only PDF files are accepted.';
      errDiv.style.display = 'block';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      errDiv.textContent = 'File must be under 5 MB.';
      errDiv.style.display = 'block';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingPdfData = ev.target.result;
      pendingPdfName = file.name;
      fileLabel.textContent = '✓ ' + file.name;
    };
    reader.readAsDataURL(file);
  });

  saveBtn.addEventListener('click', async () => {
    errDiv.style.display = 'none';
    const invId = parseInt(select.value);
    if (!invId) { errDiv.textContent = 'Please select an invoice.'; errDiv.style.display = 'block'; return; }
    if (!pendingPdfData) { errDiv.textContent = 'Please choose a PDF file.'; errDiv.style.display = 'block'; return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const inv = await getById('invoices', invId);
    if (!inv) { errDiv.textContent = 'Invoice not found.'; errDiv.style.display = 'block'; saveBtn.disabled = false; saveBtn.innerHTML = '<i data-lucide="paperclip"></i> Attach PDF'; return; }

    inv.attachedPdfData = pendingPdfData;
    inv.attachedPdfName = pendingPdfName;
    await update('invoices', inv);

    modal.style.display = 'none';
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i data-lucide="paperclip"></i> Attach PDF';
    showToast('PDF attached to ' + inv.invoiceNumber);
    renderInvoicesList();
  });
}

// ─── HAMBURGER / MOBILE SIDEBAR ────────────────────────────────
function setupHamburger() {
  const hamburgerBtn   = document.getElementById('hamburgerBtn');
  const sidebar        = document.querySelector('.sidebar');
  const overlay        = document.getElementById('sidebarOverlay');

  if (!hamburgerBtn || !sidebar || !overlay) return;

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);

  // Close sidebar when a nav link is tapped on mobile
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 680) closeSidebar();
    });
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 680) closeSidebar();
  });
}
