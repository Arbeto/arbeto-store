// ===== Global Variables =====
let currentCustomer = null;

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", function () {
    initBackButton();
    loadCustomerData();
});

function initBackButton() {
    const backButton = document.getElementById("backButton");
    if (!backButton) return;

    backButton.addEventListener("click", function () {
        const target = this.dataset.target || "/dashboard-admin/customers";
        window.location.href = target;
    });
}

function updateBackButtonByRole() {
    const backButton = document.getElementById("backButton");
    const backButtonText = document.getElementById("backButtonText");
    if (!backButton || !backButtonText || !currentCustomer) return;

    const role = (currentCustomer.user_type || "").toLowerCase();
    backButton.classList.remove("role-ceo", "role-manager", "role-trader");

    if (["ceo", "manager", "trader"].includes(role)) {
        backButtonText.textContent = "العودة للإدارة";
        backButton.dataset.target = "/dashboard-admin/trader-manager";

        if (role === "ceo") {
            backButton.classList.add("role-ceo");
        } else if (role === "manager") {
            backButton.classList.add("role-manager");
        } else if (role === "trader") {
            backButton.classList.add("role-trader");
        }
        return;
    }

    backButtonText.textContent = "العودة للعملاء";
    backButton.dataset.target = "/dashboard-admin/customers";
}

function applyCardsThemeByRole() {
    const detailsContainer = document.getElementById("customerDetailsContainer");
    if (!detailsContainer) return;

    detailsContainer.classList.remove("role-ceo", "role-manager", "role-trader");

    if (!currentCustomer || !currentCustomer.user_type) return;

    const role = currentCustomer.user_type.toLowerCase();

    if (role === "ceo") {
        detailsContainer.classList.add("role-ceo");
    } else if (role === "manager") {
        detailsContainer.classList.add("role-manager");
    } else if (role === "trader") {
        detailsContainer.classList.add("role-trader");
    }
}

// ===== Load Customer Data =====
async function loadCustomerData() {
    const customerId = localStorage.getItem("viewCustomerId");
    if (!customerId) {
        showToast("لم يتم العثور على بيانات العميل", "error");
        setTimeout(
            () => (window.location.href = "/dashboard-admin/customers"),
            2000,
        );
        return;
    }

    try {
        const response = await fetch(`/api/customer-details/${customerId}`);
        if (!response.ok) throw new Error("فشل تحميل البيانات");
        currentCustomer = await response.json();

        updateBackButtonByRole();
        applyCardsThemeByRole();
        displayPersonalInfo();
        displayCartItems();
        displayFavorites();
        displayOrders();
        displayReviews();
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحميل بيانات العميل", "error");
    }
}

// ===== Display Personal Info =====
function displayPersonalInfo() {
    const container = document.getElementById("personalInfo");
    if (!currentCustomer) return;

    let lastSeenText = "غير معروف";
    if (currentCustomer.last_seen) {
        const lastSeen = new Date(currentCustomer.last_seen);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

        if (diffMinutes < 2) {
            lastSeenText = '<span class="status-online">متصل الآن</span>';
        } else if (diffMinutes < 60) {
            lastSeenText = `منذ ${diffMinutes} دقيقة`;
        } else if (diffMinutes < 2880) {
            const hours = Math.floor(diffMinutes / 60);
            lastSeenText = `منذ ${hours} ساعة`;
        } else {
            lastSeenText = lastSeen.toLocaleString("ar-EG", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
    }

    const addr = currentCustomer.shipping_address_detail;
    const addressText = addr
        ? `${addr.governorate || ''}, ${addr.city || ''}, ${addr.street || ''}`
        : 'لا يوجد عنوان مسجل';

    const genderText = currentCustomer.gender === 'male' ? 'ذكر'
        : (currentCustomer.gender === 'female' ? 'أنثى' : (currentCustomer.gender || ''));

    const orders = currentCustomer.orders || [];
    const failedStatuses = ['failed-delivery', 'cancelled', 'rejected'];
    const totalPurchasesAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_price || 0), 0).toFixed(2);
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const failedCount   = orders.filter(o => failedStatuses.includes(o.status)).length;
    const ongoingCount  = orders.filter(o =>
        !['delivered', 'failed-delivery', 'cancelled', 'rejected'].includes(o.status)
    ).length;

    container.innerHTML = `
    <div class="info-field">
      <span class="field-label">كود المستخدم</span>
      <span class="field-value">${currentCustomer.id || ""}</span>
    </div>
    <div class="info-field">
      <span class="field-label">الاسم الأول</span>
      <span class="field-value">${currentCustomer.first_name || ""}</span>
    </div>
    <div class="info-field">
      <span class="field-label">اسم العائلة</span>
      <span class="field-value">${currentCustomer.last_name || ""}</span>
    </div>
    <div class="info-field">
      <span class="field-label">رقم الهاتف</span>
      <span class="field-value">${currentCustomer.phone || ""}</span>
    </div>
    <div class="info-field">
      <span class="field-label">البريد الإلكتروني</span>
      <span class="field-value">${currentCustomer.email || ""}</span>
    </div>
    <div class="info-field">
      <span class="field-label">النوع</span>
      <span class="field-value">${genderText}</span>
    </div>
    <div class="info-field">
      <span class="field-label">عنوان الشحن</span>
      <span class="field-value">${addressText}</span>
    </div>
    <div class="info-field" style="cursor:pointer;" onclick="openWalletModal()" title="اضغط لتعديل الرصيد">
      <span class="field-label">رصيد المحفظة <i class="bi bi-pencil-square" style="font-size:.8rem;color:#2563eb;"></i></span>
      <span class="field-value" style="color:#2563eb;text-decoration:underline;">${currentCustomer.wallet_balance || 0} جنيه</span>
    </div>
    <div class="info-field">
      <span class="field-label">مجموع مبالغ المشتريات</span>
      <span class="field-value">${totalPurchasesAmount} جنيه</span>
    </div>
    <div class="info-field">
      <span class="field-label">عدد المشتريات الجارية</span>
      <span class="field-value">${ongoingCount}</span>
    </div>
    <div class="info-field">
      <span class="field-label">عدد المشتريات الناجحة</span>
      <span class="field-value">${deliveredCount}</span>
    </div>
    <div class="info-field">
      <span class="field-label">عدد المشتريات الفاشلة</span>
      <span class="field-value">${failedCount}</span>
    </div>
    <div class="info-field">
      <span class="field-label">آخر ظهور</span>
      <span class="field-value">${lastSeenText}</span>
    </div>
  `;
}

// ===== Display Cart Items =====
function displayCartItems() {
    const container = document.getElementById("cartItems");
    const section = container.closest(".info-section");
    const cart = currentCustomer.carts || [];

    if (cart.length === 0) {
        if (section) section.style.display = "none";
        return;
    }

    if (section) section.style.display = "block";
    container.innerHTML = cart
        .map((item) => {
            const product = item.product || {};
            const images = Array.isArray(product.img)
                ? product.img
                : typeof product.img === "string"
                  ? JSON.parse(product.img || "[]")
                  : [];
            const mainImage =
                images.length > 0
                    ? images[0].startsWith("http")
                        ? images[0]
                        : "/" + images[0]
                    : "https://via.placeholder.com/150";

            return `
            <div class="product-card">
              <img src="${mainImage}" alt="${product.name}">
              <div class="product-name">${product.name}</div>
              <div class="product-price">${product.price_sell} جنيه (الكمية: ${item.quantity})</div>
            </div>
        `;
        })
        .join("");
}

// ===== Display Favorites =====
function displayFavorites() {
    const container = document.getElementById("favoriteItems");
    const section = container.closest(".info-section");
    const favorites = currentCustomer.favorites || [];

    if (favorites.length === 0) {
        if (section) section.style.display = "none";
        return;
    }

    if (section) section.style.display = "block";
    container.innerHTML = favorites
        .map((item) => {
            const product = item.product || {};
            const images = Array.isArray(product.img)
                ? product.img
                : typeof product.img === "string"
                  ? JSON.parse(product.img || "[]")
                  : [];
            const mainImage =
                images.length > 0
                    ? images[0].startsWith("http")
                        ? images[0]
                        : "/" + images[0]
                    : "https://via.placeholder.com/150";

            return `
            <div class="product-card">
              <img src="${mainImage}" alt="${product.name}">
              <div class="product-name">${product.name}</div>
              <div class="product-price">${product.price_sell} جنيه</div>
            </div>
        `;
        })
        .join("");
}

// ===== Display Orders =====
function displayOrders() {
    const container = document.getElementById("ordersHistory");
    const section = container.closest(".info-section");
    const orders = currentCustomer.orders || [];

    if (orders.length === 0) {
        if (section) section.style.display = "none";
        return;
    }

    if (section) section.style.display = "block";
    const statusMap = {
        delivered: "تم التوصيل",
        shipped: "في الشحن",
        pending: "قيد الانتظار",
        cancelled: "ملغي",
        rejected: "مرفوض",
    };

    container.innerHTML = orders
        .map(
            (order) => `
    <div class="order-item">
      <div class="order-header">
        <span class="order-id">طلب #${order.id}</span>
        <span class="order-status ${order.status}">${statusMap[order.status] || order.status}</span>
      </div>
      <div class="order-details">
        <div class="order-detail-item">
          <span class="detail-label">التاريخ</span>
          <span class="detail-value">${new Date(order.created_at).toLocaleDateString("ar-EG")}</span>
        </div>
        <div class="order-detail-item">
          <span class="detail-label">الإجمالي</span>
          <span class="detail-value">${order.total_price} جنيه</span>
        </div>
        <div class="order-detail-item">
          <span class="detail-label">طريقة الدفع</span>
          <span class="detail-value">${order.payment_method}</span>
        </div>
        <div class="order-detail-item">
          <span class="detail-label">المنتجات</span>
          <span class="detail-value">
            ${(order.items || []).map((item) => `${item.name} (${item.quantity})`).join(", ")}
          </span>
        </div>
      </div>
    </div>
  `,
        )
        .join("");
}

// ===== Display Reviews =====
function displayReviews() {
    const container = document.getElementById("productReviews");
    const section = container.closest(".info-section");
    const reviews = currentCustomer.reviews || [];

    if (reviews.length === 0) {
        if (section) section.style.display = "none";
        return;
    }

    if (section) section.style.display = "block";
    container.innerHTML = reviews
        .map(
            (review) => `
    <div class="review-item">
      <div class="review-header">
        <span class="product-name-review">${review.product ? review.product.name : "منتج محذوف"}</span>
        <div class="rating-stars">
          ${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}
        </div>
      </div>
      <p class="review-text">${review.review || ""}</p>
    </div>
  `,
        )
        .join("");
}

// ===== Wallet Modal =====
function openWalletModal() {
    document.getElementById("currentWalletDisplay").textContent =
        currentCustomer ? (currentCustomer.wallet_balance || 0) : 0;
    document.getElementById("newWalletBalance").value = "";
    document.getElementById("walletModal").classList.add("active");
}

function closeWalletModal() {
    document.getElementById("walletModal").classList.remove("active");
    document.getElementById("newWalletBalance").value = "";
}

async function confirmWalletUpdate() {
    const input = document.getElementById("newWalletBalance");
    const value = parseFloat(input.value);

    if (isNaN(value) || value < 0) {
        showToast("الرجاء إدخال رصيد صحيح", "error");
        return;
    }

    const btn      = document.getElementById("submitWalletBtn");
    const btnText  = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");
    btn.classList.add("loading");
    btnText.style.display  = "none";
    btnLoader.style.display = "inline-block";

    try {
        const response = await fetch(
            `/api/customer-details/${currentCustomer.id}/update-wallet`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet_balance: value }),
            }
        );
        if (!response.ok) throw new Error("فشل تحديث الرصيد");
        const data = await response.json();

        currentCustomer.wallet_balance = data.wallet_balance;
        closeWalletModal();
        displayPersonalInfo();
        showToast("تم تحديث رصيد المحفظة بنجاح");
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تحديث الرصيد", "error");
    } finally {
        btn.classList.remove("loading");
        btnText.style.display  = "inline";
        btnLoader.style.display = "none";
    }
}

// ===== Password Change Modal =====
document
    .getElementById("changePasswordBtn")
    .addEventListener("click", function () {
        document.getElementById("passwordModal").classList.add("active");
    });

function closePasswordModal() {
    document.getElementById("passwordModal").classList.remove("active");
    document.getElementById("newPassword").value = "";
}

async function changePassword() {
    const newPassword = document.getElementById("newPassword").value.trim();

    if (!newPassword) {
        showToast("الرجاء إدخال كلمة المرور الجديدة", "error");
        return;
    }

    if (newPassword.length < 6) {
        showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", "error");
        return;
    }

    const btn = document.getElementById("submitPasswordBtn");
    const btnText = btn.querySelector(".btn-text");
    const btnLoader = btn.querySelector(".btn-loader");

    // Show loading
    btn.classList.add("loading");
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";

    try {
        const response = await fetch(
            `/api/customer-details/${currentCustomer.id}/change-password`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            },
        );

        if (!response.ok) throw new Error("فشل تغيير كلمة المرور");

        closePasswordModal();
        showToast("تم تغيير كلمة المرور بنجاح");
    } catch (error) {
        console.error(error);
        showToast("حدث خطأ أثناء تغيير كلمة المرور", "error");
    } finally {
        btn.classList.remove("loading");
        btnText.style.display = "inline";
        btnLoader.style.display = "none";
    }
}

// ===== Show Toast =====
function showToast(message, type = "success") {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    toast.className = `toast-container ${type === "error" ? "error" : ""} show`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ===== Close modal on overlay click =====
document
    .getElementById("passwordModal")
    .addEventListener("click", function (e) {
        if (e.target === this) {
            closePasswordModal();
        }
    });

document
    .getElementById("walletModal")
    .addEventListener("click", function (e) {
        if (e.target === this) {
            closeWalletModal();
        }
    });
