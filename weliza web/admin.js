/**
 * Weliza Web App - Admin Control Panel Logic
 * Manages database states, authentication, ChartJS rendering, PDF generation, and CRM.
 */

const { getAll, add, update, remove, getById } = window.WelizaDB;

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

  form.onsubmit = (e) => {
    e.preventDefault();
    const pass = document.getElementById('authPassword').value;

    if (pass === ADMIN_PASS) {
      window.welizaLoggedIn = true;
      errorMsg.style.display = 'none';
      checkAuthentication();
   } else {
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
  const menuButtons = document.querySelectorAll('.menu-item[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');
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
    window.print();
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
      document.querySelector('.menu-item[data-tab="invoices-list"]').click();
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
    <td><input type="text" class="col-desc" placeholder="Product name/stitching service..." value="${desc}" required></td>
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
    <td style="text-align: center;"><button type="button" class="btn btn-row-del" onclick="this.closest('tr').remove(); calculateInvoiceTotals();"><i data-lucide="trash-2"></i></button></td>
  `;

  tbody.appendChild(tr);
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
  const dateVal = document.getElementById('invDate').value;
  const dueDateVal = document.getElementById('invDueDate').value;

  let clientName = 'Select Client';
  let clientGstin = '---';
  let clientAddress = '---';

  if (clientVal) {
    const client = await getById('clients', parseInt(clientVal));
    if (client) {
      clientName = client.name;
      clientGstin = client.gstin || 'Unregistered';
      clientAddress = client.address;
    }
  }

  // Draw invoice template
  let itemsHtml = '';
  if (items.length === 0) {
    itemsHtml = `<tr><td colspan="6" style="text-align: center; color: #999;">No items added</td></tr>`;
  } else {
    items.forEach((it, idx) => {
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
  }

  sheet.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #1a4735; padding-bottom: 20px; margin-bottom: 20px;">
      <div>
        <h2 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: #1e4735; margin: 0;">WELIZA</h2>
        <p style="font-size: 0.85rem; margin: 5px 0 0 0; color: #4a5568;">Prayer Dresses & Tailoring Boutique</p>
        <p style="font-size: 0.85rem; margin: 2px 0 0 0; color: #4a5568;">GSTIN: 32ABCDE1234F1Z5</p>
        <p style="font-size: 0.85rem; margin: 2px 0 0 0; color: #4a5568;">Kochi, Kerala, India | info@weliza.com</p>
      </div>
      <div style="text-align: right;">
        <h3 style="font-size: 1.4rem; color: #1e4735; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Tax Invoice</h3>
        <p style="font-size: 0.9rem; margin: 5px 0 0 0;">Invoice #: <strong>${invNumber}</strong></p>
        <p style="font-size: 0.9rem; margin: 2px 0 0 0;">Date: ${dateVal}</p>
        <p style="font-size: 0.9rem; margin: 2px 0 0 0;">Due Date: ${dueDateVal}</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-bottom: 30px;">
      <div style="background-color: #f7fafc; padding: 15px; border-radius: 4px; border: 1px solid #edf2f7;">
        <h4 style="margin: 0 0 8px 0; font-size: 0.85rem; text-transform: uppercase; color: #718096; letter-spacing: 0.5px;">Billed To:</h4>
        <h3 style="margin: 0 0 5px 0; font-size: 1.15rem; color: #1e4735;">${clientName}</h3>
        <p style="font-size: 0.85rem; margin: 2px 0 0 0; color: #4a5568;">GSTIN: <strong>${clientGstin}</strong></p>
        <p style="font-size: 0.85rem; margin: 4px 0 0 0; color: #4a5568; line-height: 1.4;">Address: ${clientAddress}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background-color: #1e4735; color: #ffffff;">
          <th style="border: 1px solid #1e4735; padding: 10px; text-align: center; font-size: 0.9rem;">SL</th>
          <th style="border: 1px solid #1e4735; padding: 10px; text-align: left; font-size: 0.9rem;">Description of Service/Goods</th>
          <th style="border: 1px solid #1e4735; padding: 10px; text-align: right; font-size: 0.9rem;">Qty</th>
          <th style="border: 1px solid #1e4735; padding: 10px; text-align: right; font-size: 0.9rem;">Rate (₹)</th>
          <th style="border: 1px solid #1e4735; padding: 10px; text-align: center; font-size: 0.9rem;">GST</th>
          <th style="border: 1px solid #1e4735; padding: 10px; text-align: right; font-size: 0.9rem;">Total (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="display: flex; justify-content: space-between; align-items: start; margin-top: 30px;">
      <div style="font-size: 0.8rem; color: #718096; max-width: 320px;">
        <p style="margin: 0 0 5px 0;"><strong>Terms & Conditions:</strong></p>
        <p style="margin: 0; line-height: 1.4;">1. Goods/Stitching are delivered as per order specification.</p>
        <p style="margin: 2px 0 0 0; line-height: 1.4;">2. Payments should be routed directly to Weliza's bank account.</p>
        <p style="margin: 2px 0 0 0; line-height: 1.4;">3. All disputes subject to Kochi jurisdiction.</p>
      </div>
      <div style="min-width: 250px;">
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7; font-size: 0.9rem;">
          <span style="color: #718096;">Taxable Total:</span>
          <span>${formatCurrency(taxableTotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #edf2f7; font-size: 0.9rem;">
          <span style="color: #718096;">GST Total (Output):</span>
          <span>${formatCurrency(gstTotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 1.15rem; font-weight: bold; color: #1e4735;">
          <span>Grand Total:</span>
          <span>${formatCurrency(grandTotal)}</span>
        </div>
        
        <div style="margin-top: 40px; text-align: center; border-top: 1px dashed #cbd5e0; padding-top: 10px;">
          <p style="font-size: 0.8rem; margin: 0; color: #718096;">For <strong>Weliza Stitching Co.</strong></p>
          <div style="height: 40px;"></div>
          <p style="font-size: 0.8rem; font-weight: bold; margin: 0; color: #4a5568;">Authorized Signatory</p>
        </div>
      </div>
    </div>
  `;
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

  // Temporarily switch print view details
  await renderInvoicePreviewSheet(inv.items, inv.taxableTotal, inv.gstTotal, inv.grandTotal);
  
  // Trigger system print
  window.print();
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
    const phone = document.getElementById('cliPhone').value.trim();
    const email = document.getElementById('cliEmail').value.trim();
    const address = document.getElementById('cliAddress').value.trim();

    if (hiddenId) {
      // Edit mode
      const client = await getById('clients', parseInt(hiddenId));
      if (client) {
        client.name = name;
        client.gstin = gstin;
        client.phone = phone;
        client.email = email;
        client.address = address;

        await update('clients', client);
        alert('Client updated successfully');
      }
    } else {
      // Add mode
      await add('clients', {
        name, gstin, phone, email, address, createdAt: new Date().toISOString()
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
      <td style="font-size:0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${c.address}</td>
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
    document.getElementById('cliPhone').value = c.phone;
    document.getElementById('cliEmail').value = c.email || '';
    document.getElementById('cliAddress').value = c.address;

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


// 9. CURRENCY FORMATTING UTILITIES
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
