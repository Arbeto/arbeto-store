let weeklyChart = null;
let yearlyChart = null;
let currentReportData = null;
let bootstrapPayload = null;
let analyticsState = {
  summary: null,
  weekly: { labels: [], datasets: {} },
  yearly: { labels: [], datasets: {} },
  orders: [],
};

const CHART_META = {
  revenue: { label: "الإيرادات", color: "#2c4b2c", bg: "rgba(44, 75, 44, 0.1)" },
  profit: { label: "الأرباح", color: "#3f6b3f", bg: "rgba(63, 107, 63, 0.12)" },
  orders: { label: "الطلبات", color: "#779e63", bg: "rgba(119, 158, 99, 0.2)" },
};

document.addEventListener("DOMContentLoaded", async function () {
  bootstrapPayload = readBootstrapPayload();
  bindEvents();
  await loadAnalysisData();
  await updateMonthOptions(); // تحميل الأشهر المتاحة
});

function bindEvents() {
  const weeklyFilter = document.getElementById("weeklyFilter");
  const yearlyFilter = document.getElementById("yearlyFilter");

  if (weeklyFilter) {
    weeklyFilter.addEventListener("change", updateWeeklyChart);
  }

  if (yearlyFilter) {
    yearlyFilter.addEventListener("change", updateYearlyChart);
  }
}

async function loadAnalysisData() {
  const yearSelect = document.getElementById("yearSelect");
  const selectedYear = yearSelect ? Number(yearSelect.value) : null;

  const bootstrap = bootstrapPayload;
  if (bootstrap && (!selectedYear || Number(bootstrap.chart_year) === selectedYear)) {
    applyAnalysisState(bootstrap);
    initializeCharts();
    return;
  }

  try {
    const selectedYearValue = yearSelect ? yearSelect.value : "";
    const baseUrl = window.analysisConfig?.dataUrl || "";

    if (!baseUrl) {
      throw new Error("Missing analysis endpoint configuration");
    }

    const url = selectedYearValue
      ? `${baseUrl}?year=${encodeURIComponent(selectedYearValue)}`
      : baseUrl;

    const response = await fetch(url, {
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch analysis data");
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error("Invalid response content type");
    }

    const data = await response.json();
    applyAnalysisState(data);
    initializeCharts();
  } catch (error) {
    if (bootstrap) {
      applyAnalysisState(bootstrap);
      initializeCharts();
      return;
    }

    showToast("تعذر تحميل بيانات التقارير حالياً");
  }
}

function readBootstrapPayload() {
  const node = document.getElementById("analysisBootstrapData");
  if (!node) return null;

  try {
    const text = (node.textContent || "").trim();
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    return null;
  }
}

function applyAnalysisState(data) {
  analyticsState.summary = data.summary || {};
  analyticsState.weekly = data.weekly || { labels: [], datasets: {} };
  analyticsState.yearly = data.yearly || { labels: [], datasets: {} };
  analyticsState.orders = Array.isArray(data.orders) ? data.orders : [];
  renderSummaryCards();
}

function renderSummaryCards() {
  const summary = analyticsState.summary || {};

  setText("totalShippingPaid", formatMoney(summary.total_shipping_paid || 0));
  setText("totalBills", formatMoney(summary.total_bills || summary.total_purchase_cost || 0));
  setText("totalProfit", formatMoney(summary.gross_profit || 0));
  setText("netProfit", formatMoney(summary.net_profit || 0));
  setText("returnsTotal", formatMoney(summary.returns_total || 0));
}

function initializeCharts() {
  renderWeeklyChart();
  renderYearlyChart();
}

function renderWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const filter = getSelectedFilter("weeklyFilter", "revenue");

  if (weeklyChart) {
    weeklyChart.destroy();
  }

  weeklyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: analyticsState.weekly.labels || [],
      datasets: [buildChartDataset(filter, analyticsState.weekly.datasets || {}, true)],
    },
    options: getChartOptions(),
  });
}

function renderYearlyChart() {
  const canvas = document.getElementById("yearlyChart");
  const noDataMessage = document.getElementById("noYearlyDataMessage");

  if (!canvas || !noDataMessage) return;

  const filter = getSelectedFilter("yearlyFilter", "revenue");
  const datasets = analyticsState.yearly.datasets || {};
  const values = Array.isArray(datasets[filter]) ? datasets[filter] : [];

  // التحقق من وجود بيانات
  const hasData = values.some(v => v > 0);

  if (!hasData) {
    canvas.style.display = "none";
    noDataMessage.style.display = "block";
    if (yearlyChart) {
      yearlyChart.destroy();
      yearlyChart = null;
    }
    return;
  }

  canvas.style.display = "block";
  noDataMessage.style.display = "none";

  const ctx = canvas.getContext("2d");

  if (yearlyChart) {
    yearlyChart.destroy();
  }

  yearlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: analyticsState.yearly.labels || [],
      datasets: [buildChartDataset(filter, analyticsState.yearly.datasets || {}, false)],
    },
    options: getChartOptions(),
  });
}

function buildChartDataset(filter, datasets, isLine) {
  const meta = CHART_META[filter] || CHART_META.revenue;
  const values = Array.isArray(datasets[filter]) ? datasets[filter] : [];

  return {
    label: meta.label,
    data: values,
    borderColor: meta.color,
    backgroundColor: meta.bg,
    borderWidth: 2,
    tension: isLine ? 0.35 : 0,
    fill: isLine,
  };
}

function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        rtl: true,
        labels: {
          font: { family: "Alexandria" },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { family: "Alexandria" },
        },
      },
      x: {
        ticks: {
          font: { family: "Alexandria" },
        },
      },
    },
  };
}

function updateWeeklyChart() {
  if (!weeklyChart) {
    renderWeeklyChart();
    return;
  }

  const filter = getSelectedFilter("weeklyFilter", "revenue");
  weeklyChart.data.datasets[0] = buildChartDataset(
    filter,
    analyticsState.weekly.datasets || {},
    true
  );
  weeklyChart.update();
}

function updateYearlyChart() {
  if (!yearlyChart) {
    renderYearlyChart();
    return;
  }

  const filter = getSelectedFilter("yearlyFilter", "revenue");
  yearlyChart.data.datasets[0] = buildChartDataset(
    filter,
    analyticsState.yearly.datasets || {},
    false
  );
  yearlyChart.update();
}

function generateReport() {
  const year = parseInt(getInputValue("yearSelect", new Date().getFullYear()), 10);
  const month = getInputValue("monthSelect", "all");

  const monthNames = {
    1: "يناير",
    2: "فبراير",
    3: "مارس",
    4: "أبريل",
    5: "مايو",
    6: "يونيو",
    7: "يوليو",
    8: "أغسطس",
    9: "سبتمبر",
    10: "أكتوبر",
    11: "نوفمبر",
    12: "ديسمبر",
  };

  const reportOrders = filterOrdersForPeriod(year, month);
  const totalSales = reportOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const totalShipping = reportOrders.reduce((sum, order) => sum + Number(order.express_price || 0), 0);
  const netProfit = reportOrders.reduce((sum, order) => sum + Number(order.product_profit || 0), 0);

  const title =
    month === "all"
      ? `تقرير مالي لسنة ${year}`
      : `تقرير مالي لشهر ${monthNames[Number(month)]} ${year}`;

  currentReportData = {
    year,
    month,
    title,
    totalOrders: reportOrders.length,
    totalSales,
    totalShipping,
    netProfit,
  };

  setText("reportTitle", title);
  const preview = document.getElementById("reportPreview");
  if (preview) {
    preview.style.display = "block";
  }

  showToast(`تم إصدار ${title}`);
}

function filterOrdersForPeriod(year, month) {
  return (analyticsState.orders || []).filter((order) => {
    if (!order.date) return false;
    const date = new Date(order.date);
    if (Number.isNaN(date.getTime())) return false;

    if (month === "all") {
      return date.getFullYear() === year;
    }

    return date.getFullYear() === year && date.getMonth() + 1 === Number(month);
  });
}

function viewPDF() {
  if (!currentReportData || !window.jspdf) return;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(currentReportData.title, 105, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("ar-EG")}`, 105, 30, {
    align: "center",
  });

  let yPos = 50;
  doc.setFontSize(12);
  doc.text("Financial Summary:", 20, yPos);
  yPos += 10;
  doc.setFontSize(10);
  doc.text(`Total Orders: ${currentReportData.totalOrders}`, 20, yPos);
  yPos += 7;
  doc.text(`Total Sales: ${Number(currentReportData.totalSales).toLocaleString()} EGP`, 20, yPos);
  yPos += 7;
  doc.text(`Shipping Paid: ${Number(currentReportData.totalShipping).toLocaleString()} EGP`, 20, yPos);
  yPos += 7;
  doc.text(`Net Profit: ${Number(currentReportData.netProfit).toLocaleString()} EGP`, 20, yPos);

  window.open(doc.output("bloburl"), "_blank");
}

function showToast(message) {
  const toast = document.getElementById("toastNotification");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function updateMonthFilter() {
  loadAnalysisData();
}

/**
 * تحديث خيارات الأشهر بناءً على السنة المختارة
 */
async function updateMonthOptions() {
  const yearSelect = document.getElementById("reportYearSelect");
  const monthSelect = document.getElementById("reportMonthSelect");

  if (!yearSelect || !monthSelect) return;

  const selectedYear = yearSelect.value;

  try {
    const url = `${window.analysisConfig.availableMonthsUrl}?year=${encodeURIComponent(selectedYear)}`;
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available months");
    }

    const data = await response.json();
    const months = data.months || [];

    const monthNames = {
      1: "يناير", 2: "فبراير", 3: "مارس", 4: "أبريل",
      5: "مايو", 6: "يونيو", 7: "يوليو", 8: "أغسطس",
      9: "سبتمبر", 10: "أكتوبر", 11: "نوفمبر", 12: "ديسمبر",
    };

    monthSelect.innerHTML = '<option value="all">الكل</option>';

    months.forEach(month => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = monthNames[month] || month;
      monthSelect.appendChild(option);
    });

  } catch (error) {
    console.error("Error loading available months:", error);
    showToast("تعذر تحميل الأشهر المتاحة", "error");
  }
}

/**
 * توليد التقرير المتقدم
 */
async function generateAdvancedReport() {
  const year = parseInt(getInputValue("reportYearSelect", new Date().getFullYear()), 10);
  const month = getInputValue("reportMonthSelect", "all");

  try {
    const url = month === "all"
      ? `${window.analysisConfig.reportDataUrl}?year=${year}`
      : `${window.analysisConfig.reportDataUrl}?year=${year}&month=${month}`;

    const response = await fetch(url, {
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch report data");
    }

    const data = await response.json();
    currentReportData = data;

    setText("reportTitle", data.title);

    const preview = document.getElementById("reportPreview");
    if (preview) {
      preview.style.display = "block";
    }

    showToast(`تم تجهيز ${data.title} - اضغط على زر عرض PDF`);

  } catch (error) {
    console.error("Error generating report:", error);
    showToast("تعذر إنشاء التقرير", "error");
  }
}

/**
 * ملء جدول شركات الشحن
 */
function fillShippingCompaniesTable(companies) {
  const tbody = document.getElementById("shippingCompaniesTableBody");
  if (!tbody) return;

  if (!companies || companies.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">لا توجد بيانات</td></tr>';
    return;
  }

  tbody.innerHTML = companies.map(company => {
    // إذا كانت الشركة أوتوماتيكي (fixed) = اجعل المصروفات والأرباح = 0
    // إذا كانت الشركة يدوي (manual) = اعرض القيم الفعلية
    const isManual = company.shipping_type === 'manual';
    const totalShipping = isManual ? company.total_shipping : 0;
    const netProfit = isManual ? company.net_profit : 0;

    return `
      <tr>
        <td>
          ${company.name}
          <small style="display:block;color:#666;font-size:11px;">
            ${company.shipping_type === 'fixed' ? '(أوتوماتيكي)' : '(يدوي)'}
          </small>
        </td>
        <td>${company.total_orders}</td>
        <td>${company.delivered_orders}</td>
        <td style="${!isManual ? 'color:#999;font-style:italic;' : ''}">${formatMoney(totalShipping)}</td>
        <td style="${!isManual ? 'color:#999;font-style:italic;' : ''}">${formatMoney(netProfit)}</td>
      </tr>
    `;
  }).join("");
}

/**
 * ملء جدول الطلبات
 */
function fillOrdersTable(ordersData) {
  const tbody = document.getElementById("ordersTableBody");
  if (!tbody) return;

  if (!ordersData) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;">لا توجد بيانات</td></tr>';
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td>${ordersData.total_orders}</td>
      <td>${ordersData.delivered}</td>
      <td>${ordersData.cancelled}</td>
      <td>${ordersData.returned}</td>
      <td>${formatMoney(ordersData.total_amount)}</td>
    </tr>
  `;
}

/**
 * ملء جدول الفواتير
 */
function fillBillsTable(bills) {
  const tbody = document.getElementById("billsTableBody");
  if (!tbody) return;

  if (!bills || bills.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">لا توجد بيانات</td></tr>';
    return;
  }

  tbody.innerHTML = bills.map(bill => `
    <tr>
      <td>${bill.invoice_number}</td>
      <td>${bill.products_count}</td>
      <td>${bill.supplier_name}</td>
      <td>${formatMoney(bill.total_price)}</td>
    </tr>
  `).join("");
}

/**
 * ملء الإحصائيات الكتابية
 */
function fillStatistics(statistics) {
  if (!statistics) return;

  setText("statExpenses", statistics.expenses);
  setText("statProductRevenue", formatMoney(statistics.product_revenue));
  setText("statShippingProfit", formatMoney(statistics.shipping_profit));
  setText("statNetProfit", formatMoney(statistics.net_profit));
}

/**
 * عرض التقرير بصيغة PDF مع دعم العربية
 */
function viewAdvancedPDF() {
  if (!currentReportData) {
    showToast("لا توجد بيانات تقرير متاحة", "error");
    return;
  }

  // إنشاء HTML للتقرير
  const pdfContent = generatePDFHTML(currentReportData);

  // فتح نافذة جديدة مع التقرير
  const printWindow = window.open('', '_blank');
  printWindow.document.write(pdfContent);
  printWindow.document.close();
}

/**
 * إنشاء HTML للتقرير PDF
 */
function generatePDFHTML(data) {
  const shippingCompanies = data.shipping_companies || [];
  const orders = data.orders || {};
  const bills = data.bills || [];
  const statistics = data.statistics || {};

  // جدول شركات الشحن
  let shippingTableRows = '';
  if (shippingCompanies.length > 0) {
    shippingCompanies.forEach(company => {
      // إذا كانت الشركة أوتوماتيكي (fixed) = اجعل المصروفات والأرباح = 0
      // إذا كانت الشركة يدوي (manual) = اعرض القيم الفعلية
      const isManual = company.shipping_type === 'manual';
      const totalShipping = isManual ? company.total_shipping : 0;
      const netProfit = isManual ? company.net_profit : 0;

      shippingTableRows += `
        <tr>
          <td>
            ${company.name}
            <small style="display:block;color:#666;font-size:10px;margin-top:2px;">
              ${company.shipping_type === 'fixed' ? '(أوتوماتيكي)' : '(يدوي)'}
            </small>
          </td>
          <td>${company.total_orders}</td>
          <td>${company.delivered_orders}</td>
          <td style="${!isManual ? 'color:#999;font-style:italic;' : ''}">${formatMoneyAr(totalShipping)}</td>
          <td class="${netProfit >= 0 ? 'profit' : 'loss'}" style="${!isManual ? 'color:#999!important;font-style:italic;' : ''}">${formatMoneyAr(netProfit)}</td>
        </tr>
      `;
    });
  } else {
    shippingTableRows = '<tr><td colspan="5" class="no-data">لا توجد بيانات</td></tr>';
  }

  // جدول الفواتير
  let billsTableRows = '';
  if (bills.length > 0) {
    bills.forEach(bill => {
      billsTableRows += `
        <tr>
          <td>${bill.invoice_number}</td>
          <td>${bill.products_count}</td>
          <td>${bill.supplier_name}</td>
          <td>${formatMoneyAr(bill.total_price)}</td>
        </tr>
      `;
    });
  } else {
    billsTableRows = '<tr><td colspan="4" class="no-data">لا توجد بيانات</td></tr>';
  }

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || 'تقرير مالي'}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      font-size: 14px;
    }

    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
      direction: rtl;
      text-align: right;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
    }

    #pdf-content {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
      padding: 20mm;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }

    .header {
      background: linear-gradient(135deg, #2c4b2c 0%, #3f6b3f 100%);
      color: white;
      padding: 25px;
      text-align: center;
      border-radius: 12px;
      margin-bottom: 25px;
    }

    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .header .date {
      font-size: 14px;
      opacity: 0.9;
    }

    .section {
      margin-bottom: 25px;
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .section-title {
      background: linear-gradient(135deg, #2c4b2c 0%, #3f6b3f 100%);
      color: white;
      padding: 12px 20px;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    table thead {
      background: #596d52;
      color: white;
    }

    table th {
      padding: 12px 15px;
      font-weight: 600;
      text-align: right;
      font-size: 13px;
    }

    table td {
      padding: 10px 15px;
      border-bottom: 1px solid #e8f5e9;
      font-size: 13px;
    }

    table tbody tr:nth-child(even) {
      background: #f9fdf9;
    }

    table tbody tr:hover {
      background: #e8f5e9;
    }

    .no-data {
      text-align: center;
      color: #999;
      padding: 20px;
      font-style: italic;
    }

    .profit {
      color: #2e7d32;
      font-weight: 600;
    }

    .loss {
      color: #c62828;
      font-weight: 600;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      padding: 20px;
    }

    .stat-box {
      background: linear-gradient(135deg, #f5f9f3 0%, #e8f5e9 100%);
      border-radius: 10px;
      padding: 18px;
      text-align: center;
    }

    .stat-box.highlight {
      background: linear-gradient(135deg, #2c4b2c 0%, #3f6b3f 100%);
      color: white;
      grid-column: span 2;
    }

    .stat-box .label {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      opacity: 0.85;
    }

    .stat-box.highlight .label {
      color: #a8d08d;
    }

    .stat-box .value {
      font-size: 20px;
      font-weight: 700;
    }

    .footer {
      text-align: center;
      padding: 20px;
      color: #999;
      font-size: 12px;
      border-top: 2px solid #e8f5e9;
      margin-top: 20px;
    }

    .print-btn {
      position: fixed;
      top: 20px;
      left: 20px;
      background: linear-gradient(135deg, #2c4b2c 0%, #3f6b3f 100%);
      color: white;
      border: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      font-family: 'Cairo', sans-serif;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.25);
      z-index: 1000;
      transition: all 0.2s ease;
    }

    .print-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    }

    .print-btn:active {
      transform: translateY(0);
    }

    @media screen and (max-width: 250mm) {
      body {
        padding: 10px;
      }

      #pdf-content {
        width: 100%;
        min-height: auto;
        padding: 15px;
      }
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      html, body {
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        font-size: 11pt !important;
      }

      .print-btn {
        display: none !important;
      }

      #pdf-content {
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }

      .header {
        padding: 18px !important;
        margin-bottom: 18px !important;
        border-radius: 8px !important;
      }

      .header h1 {
        font-size: 20pt !important;
        margin-bottom: 8px !important;
      }

      .header .date {
        font-size: 10pt !important;
      }

      .section {
        break-inside: avoid;
        page-break-inside: avoid;
        margin-bottom: 15px !important;
        box-shadow: none !important;
        border: 1px solid #ccc !important;
        border-radius: 6px !important;
        overflow: hidden !important;
      }

      .section-title {
        padding: 10px 15px !important;
        font-size: 12pt !important;
        border-radius: 0 !important;
      }

      table {
        width: 100% !important;
      }

      table th {
        padding: 8px 10px !important;
        font-size: 9pt !important;
        font-weight: bold !important;
      }

      table td {
        padding: 6px 10px !important;
        font-size: 9pt !important;
      }

      .stats-grid {
        padding: 15px !important;
        gap: 12px !important;
      }

      .stat-box {
        padding: 12px !important;
        border-radius: 6px !important;
      }

      .stat-box .label {
        font-size: 9pt !important;
      }

      .stat-box .value {
        font-size: 13pt !important;
      }

      .footer {
        padding: 12px !important;
        font-size: 8pt !important;
        margin-top: 15px !important;
      }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">
    <span>🖨️</span>
    <span>طباعة / تحميل PDF</span>
  </button>

  <div id="pdf-content">
    <!-- Header -->
    <div class="header">
      <h1>${data.title || 'تقرير مالي'}</h1>
      <div class="date">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>

    <!-- جدول شركات الشحن -->
    <div class="section">
      <div class="section-title">
        <span>📦</span>
        <span>شركات الشحن</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>اسم الشركة</th>
            <th>عدد الأوردرات المستلمة</th>
            <th>تم التوصيل</th>
            <th>مصروفات الشركة</th>
            <th>أرباح</th>
          </tr>
        </thead>
        <tbody>
          ${shippingTableRows}
        </tbody>
      </table>
    </div>

    <!-- جدول الطلبات -->
    <div class="section">
      <div class="section-title">
        <span>🛒</span>
        <span>الطلبات</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>عدد الطلبات</th>
            <th>تم التوصيل</th>
            <th>تم الإلغاء</th>
            <th>مرتجع</th>
            <th>إجمالي المبلغ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${orders.total_orders || 0}</td>
            <td class="profit">${orders.delivered || 0}</td>
            <td class="loss">${orders.cancelled || 0}</td>
            <td>${orders.returned || 0}</td>
            <td><strong>${formatMoneyAr(orders.total_amount || 0)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- جدول الفواتير -->
    <div class="section">
      <div class="section-title">
        <span>🧾</span>
        <span>الفواتير</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>عدد المنتجات</th>
            <th>التاجر</th>
            <th>قيمة الفاتورة</th>
          </tr>
        </thead>
        <tbody>
          ${billsTableRows}
        </tbody>
      </table>
    </div>

    <!-- الإحصائيات الكتابية -->
    <div class="section">
      <div class="section-title">
        <span>📊</span>
        <span>الإحصائيات</span>
      </div>
      <div class="stats-grid">
        <div class="stat-box">
          <div class="label">مصروفات (عدد الفواتير)</div>
          <div class="value">${statistics.expenses || 0}</div>
        </div>
        <div class="stat-box">
          <div class="label">أرباح المنتجات</div>
          <div class="value">${formatMoneyAr(statistics.product_revenue || 0)}</div>
        </div>
        <div class="stat-box">
          <div class="label">أرباح شركات التوصيل</div>
          <div class="value">${formatMoneyAr(statistics.shipping_profit || 0)}</div>
        </div>
        <div class="stat-box highlight">
          <div class="label">صافي الربح</div>
          <div class="value">${formatMoneyAr(statistics.net_profit || 0)}</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© ${new Date().getFullYear()} Arbeto Store - جميع الحقوق محفوظة</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * تنسيق المبلغ بالعربية
 */
function formatMoneyAr(value) {
  return Number(value || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' جنيه';
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("ar-EG", {
    maximumFractionDigits: 2,
  })} جنيه`;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function getInputValue(id, fallback) {
  const element = document.getElementById(id);
  return element ? element.value : fallback;
}

function getSelectedFilter(id, fallback) {
  const element = document.getElementById(id);
  return element && element.value ? element.value : fallback;
}
