// ===== Global Variables =====
let customers = [];
let currentPage = 1;
const customersPerPage = 9;

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", function () {
    loadCustomers();
});

// ===== Load Customers =====
async function loadCustomers() {
    try {
        const response = await fetch("/api/customers");
        if (!response.ok) throw new Error("فشل تحميل العملاء");
    const users = await response.json();
    customers = Array.isArray(users)
      ? users.filter((user) => (user?.user_type || "").toLowerCase() === "customer")
      : [];
    currentPage = 1;

        displayCustomers();
        displayPagination();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحميل العملاء", "error");
    }
}

// ===== Display Customers =====
function displayCustomers() {
    const container = document.getElementById("customersGrid");
    const startIndex = (currentPage - 1) * customersPerPage;
    const endIndex = startIndex + customersPerPage;
    const pageCustomers = customers.slice(startIndex, endIndex);

    if (pageCustomers.length === 0) {
        container.innerHTML =
            '<p class="empty-message">لا يوجد عملاء مسجلين</p>';
        return;
    }

    container.innerHTML = pageCustomers
        .map((customer) => {
            let isOnline = false;
            if (customer.last_seen) {
                const lastSeen = new Date(customer.last_seen);
                const now = new Date();
                isOnline = (now - lastSeen) / (1000 * 60) < 2;
            }

            const addr = customer.shipping_address_detail;
            const addressText = addr
                ? `${addr.governorate || ''}, ${addr.city || ''}, ${addr.street || ''}`
                : 'غير مسجل';

            return `
    <div class="customer-card">
      <div class="customer-header">
        <h3 class="customer-name">${customer.first_name || ""} ${customer.last_name || ""}</h3>
        <div class="status-indicator ${isOnline ? "online" : "offline"}">
          <span class="status-dot"></span>
          ${isOnline ? "متصل الآن" : "غير متصل"}
        </div>
      </div>
      
      <div class="customer-info">
        <div class="info-item">
          <span class="info-label">كود العميل</span>
          <span class="info-value">${customer.id || "غير مسجل"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">مجموع المشتريات</span>
          <span class="info-value">${customer.total_purchases || 0} جنيه</span>
        </div>
        <div class="info-item">
          <span class="info-label">رقم الهاتف</span>
          <span class="info-value">${customer.phone || "غير مسجل"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">عنوان الشحن</span>
          <span class="info-value">${addressText}</span>
        </div>
      </div>
      
      <button class="btn-view-details" onclick="viewCustomerDetails(${customer.id})">
        <i class="bi bi-eye"></i>
        عرض جميع التفاصيل
      </button>
    </div>
  `;
        })
        .join("");
}

// ===== Display Pagination =====
function displayPagination() {
    const container = document.getElementById("pagination");
    const totalPages = Math.ceil(customers.length / customersPerPage);

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let paginationHTML = `
    <button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${
        currentPage === 1 ? "disabled" : ""
    }>
      <i class="bi bi-chevron-right"></i>
    </button>
  `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
      <button class="pagination-btn ${
          i === currentPage ? "active" : ""
      }" onclick="changePage(${i})">
        ${i}
      </button>
    `;
    }

    paginationHTML += `
    <button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${
        currentPage === totalPages ? "disabled" : ""
    }>
      <i class="bi bi-chevron-left"></i>
    </button>
  `;

    container.innerHTML = paginationHTML;
}

// ===== Change Page =====
function changePage(page) {
    const totalPages = Math.ceil(customers.length / customersPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    displayCustomers();
    displayPagination();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== View Customer Details =====
function viewCustomerDetails(customerId) {
    localStorage.setItem("viewCustomerId", customerId);
    window.location.href = "/dashboard-admin/customer-details";
}
