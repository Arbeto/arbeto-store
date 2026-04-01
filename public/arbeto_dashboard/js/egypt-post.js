// ===== Global Variables =====
let arexOrders = [];
let currentFilter = "ongoing";
let searchQuery = "";
let currentResetOrderId = null;

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", function () {
  loadOrders();
  displayOrders();
  updateStatistics();
});

// ===== Load Orders from LocalStorage =====
function loadOrders() {
  const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");
  // Filter orders shipped via Egypt Post
  arexOrders = allOrders
    .filter(
      (order) =>
        order.shippingCompany === "البريد المصري" && order.status === "shipped"
    )
    .map((order) => ({
      ...order,
      driverNotes: order.driverNotes || [],
      delivered: order.delivered || false,
      additionalCost: order.additionalCost || 0,
      customerRating: order.customerRating || null,
      ratingNotes: order.ratingNotes || "",
    }));
}

// ===== Save Orders =====
function saveOrders() {
  const allOrders = JSON.parse(localStorage.getItem("orders") || "[]");

  arexOrders.forEach((arexOrder) => {
    const index = allOrders.findIndex((o) => o.id === arexOrder.id);
    if (index !== -1) {
      allOrders[index] = arexOrder;
    }
  });

  localStorage.setItem("orders", JSON.stringify(allOrders));
}

// ===== Display Orders =====
function displayOrders() {
  const container = document.getElementById("ordersContainer");

  // Filter orders based on current filter
  let filteredOrders = arexOrders.filter((order) => {
    if (currentFilter === "delivered") {
      return order.delivered === true;
    } else {
      return !order.delivered; // Show only non-delivered for 'ongoing'
    }
  });

  // Search orders
  if (searchQuery) {
    filteredOrders = filteredOrders.filter((order) =>
      order.id.toString().includes(searchQuery)
    );
  }

  if (filteredOrders.length === 0) {
    container.innerHTML = '<p class="empty-message">لا توجد طلبات</p>';
    return;
  }

  container.innerHTML = filteredOrders
    .map(
      (order) => `
    <div class="order-card ${order.delivered ? "delivered" : ""}" id="card-${
        order.id
      }">
      <div class="order-header">
        <div>
          <div class="order-id">طلب #${order.id}</div>
          <div class="order-customer">${order.customerName}</div>
        </div>
        ${order.delivered ? "<span class='stauts-txt'>تم التوصيل</span>" : ""}
        <button class="btn-toggle-card" onclick="toggleCard(${order.id})">
          <i class="bi bi-chevron-${
            order.delivered ? "down" : "up"
          }" id="toggle-icon-${order.id}"></i>
        </button>
      </div>
      
      <div class="order-content ${
        order.delivered ? "collapsed" : ""
      }" id="content-${order.id}">
      <div class="order-details">
        <div class="detail-item">
          <span class="detail-label">العنوان</span>
          <span class="detail-value">${order.address}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">رقم الهاتف</span>
          <span class="detail-value">${order.phone}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">إجمالي مبلغ الطلبية المستحق</span>
          <span class="detail-value">${order.totalAmount} جنيه</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">قيمة الشحن</span>
          <span class="detail-value">${order.shippingCost} جنيه</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">وسيلة الدفع</span>
          <span class="detail-value">${order.paymentMethod}</span>
        </div>
      </div>
      
      <!-- Driver Notes Section -->
      <div class="notes-section">
        <div class="notes-title">
          <i class="bi bi-chat-left-dots"></i>
          ملاحظات الشركة
        </div>
        <div class="add-note-form">
          <input type="text" class="note-input" id="noteInput-${
            order.id
          }" placeholder="اكتب ملاحظة الشركة...">
          <button class="btn-add-note" onclick="addDriverNote(${order.id})">
            <i class="bi bi-send"></i>
            إرسال
          </button>
        </div>
        <div class="notes-list" id="notesList-${order.id}">
          ${order.driverNotes
            .map(
              (note, index) => `
            <div class="note-item">
              <span class="note-text">${note}</span>
              <button class="btn-delete-note" onclick="deleteDriverNote(${order.id}, ${index})">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      
      <!-- Shipping Cost Section -->
          
      <!-- Rating Section -->
      <div class="rating-section">
        <div class="rating-title">تقييم التوصيل للشحنة</div>
        <div class="stars-container" id="stars-${order.id}">
          ${[5, 4, 3, 2, 1]
            .map(
              (star) => `
            <div class="star-wrapper ${
              order.customerRating >= star ? "active" : ""
            }" 
                 data-order="${order.id}" 
                 data-rating="${star}"
                 onmouseover="hoverStars(${order.id}, ${star})"
                 onmouseout="resetStars(${order.id})"
                 onclick="setRating(${order.id}, ${star})">
              <i class="bi bi-star-fill"></i>
              <span class="star-number">${star}</span>
            </div>
          `
            )
            .join("")}
        </div>
        <div class="rating-notes">
          <textarea class="rating-textarea" 
                    id="ratingNotes-${order.id}" 
                    placeholder="ملاحظات التقييم...">${
                      order.ratingNotes || ""
                    }</textarea>
        </div>
        <button class="btn-submit-rating" onclick="submitRating(${order.id})">
          <i class="bi bi-send"></i>
          إرسال التقييم
        </button>
      </div>
      
      <!-- Delivery Confirmation Button -->
      ${
        !order.delivered
          ? `
        <button class="btn-confirm-delivery" onclick="openDeliveryModal(${order.id})">
          <i class="bi bi-check-circle"></i>
          تم التوصيل
        </button>
      `
          : ""
      }
      </div>
    </div>
  `
    )
    .join("");
}

// ===== Add Driver Note =====
function addDriverNote(orderId) {
  const input = document.getElementById(`noteInput-${orderId}`);
  const note = input.value.trim();

  if (!note) {
    alert("الرجاء كتابة ملاحظة");
    return;
  }

  const order = arexOrders.find((o) => o.id === orderId);
  if (order) {
    order.driverNotes.push(note);
    saveOrders();
    displayOrders();
    showToast("تم إضافة الملاحظة بنجاح");
  }
}

// ===== Delete Driver Note =====
function deleteDriverNote(orderId, noteIndex) {
  const order = arexOrders.find((o) => o.id === orderId);
  if (order) {
    order.driverNotes.splice(noteIndex, 1);
    saveOrders();
    displayOrders();
    showToast("تم حذف الملاحظة بنجاح");
  }
}

// ===== Add Shipping Cost =====
function addShippingCost(orderId) {
  const input = document.getElementById(`costInput-${orderId}`);
  const additionalAmount = parseFloat(input.value) || 0;

  if (additionalAmount <= 0) {
    alert("الرجاء إدخال مبلغ صحيح");
    return;
  }

  const order = arexOrders.find((o) => o.id === orderId);
  if (order) {
    order.additionalCost += additionalAmount;
    saveOrders();

    // Update display
    const costValue = document.getElementById(`costValue-${orderId}`);
    costValue.textContent = order.additionalCost;

    input.value = "";
    updateStatistics();
    showToast("تم إضافة المبلغ بنجاح");
  }
}

// ===== Set Rating =====
function setRating(orderId, rating) {
  const order = arexOrders.find((o) => o.id === orderId);
  if (order) {
    order.customerRating = rating;
    saveOrders();

    // Update stars display
    const starsContainer = document.getElementById(`stars-${orderId}`);
    const stars = starsContainer.querySelectorAll(".star-wrapper");
    stars.forEach((star) => {
      const starRating = parseInt(star.dataset.rating);
      if (starRating <= rating) {
        star.classList.add("active");
      } else {
        star.classList.remove("active");
      }
    });
  }
}

// ===== Submit Rating =====
function submitRating(orderId) {
  const order = arexOrders.find((o) => o.id === orderId);
  if (!order) return;

  if (!order.customerRating) {
    alert("الرجاء اختيار تقييم");
    return;
  }

  const notesTextarea = document.getElementById(`ratingNotes-${orderId}`);
  order.ratingNotes = notesTextarea.value.trim();

  saveOrders();
  showToast("تم إرسال التقييم بنجاح");
}

// ===== Update Statistics =====
function updateStatistics() {
  const totalOrders = arexOrders.length;

  // Total paid (sum of all order totals + shipping costs + additional costs)
  const totalPaid = arexOrders.reduce(
    (sum, order) => sum + order.totalAmount + order.shippingCost,
    0
  );

  // Total shipping cost (original shipping + additional)
  const totalShipping = arexOrders.reduce(
    (sum, order) => sum + order.shippingCost,
    0
  );

  // Net profit (total paid - total shipping)
  // Assuming the company keeps the product cost and pays only shipping
  const netProfit = totalPaid - totalShipping;

  document.getElementById("totalOrders").textContent = totalOrders;
  document.getElementById("totalPaid").textContent = totalPaid + " جنيه";
  document.getElementById("totalShipping").textContent =
    totalShipping + " جنيه";

  const profitElement = document.getElementById("netProfit");
  profitElement.textContent = netProfit + " جنيه";

  // Update profit card color and icon based on value
  const profitCard = profitElement.closest(".stat-card");
  const profitIcon = profitCard.querySelector(".stat-icon i");

  if (netProfit < 0) {
    profitCard.classList.add("negative");
    profitCard.classList.remove("profit");
    if (profitIcon) profitIcon.style.transform = "rotate(180deg)";
  } else {
    profitCard.classList.add("profit");
    profitCard.classList.remove("negative");
    if (profitIcon) profitIcon.style.transform = "rotate(0deg)";
  }
}

// ===== Toggle Card Collapse =====
function toggleCard(orderId) {
  const content = document.getElementById(`content-${orderId}`);
  const icon = document.getElementById(`toggle-icon-${orderId}`);

  content.classList.toggle("collapsed");

  if (content.classList.contains("collapsed")) {
    icon.className = "bi bi-chevron-down";
  } else {
    icon.className = "bi bi-chevron-up";
  }
}

// ===== Hover Stars =====
function hoverStars(orderId, rating) {
  const stars = document.querySelectorAll(`#stars-${orderId} .star-wrapper`);
  stars.forEach((star) => {
    const starRating = parseInt(star.dataset.rating);
    if (starRating <= rating) {
      star.classList.add("hover");
    } else {
      star.classList.remove("hover");
    }
  });
}

// ===== Reset Stars =====
function resetStars(orderId) {
  const stars = document.querySelectorAll(`#stars-${orderId} .star-wrapper`);
  stars.forEach((star) => {
    star.classList.remove("hover");
  });
}

// ===== Open Delivery Modal =====
let currentDeliveryOrderId = null;

function openDeliveryModal(orderId) {
  currentDeliveryOrderId = orderId;
  document.getElementById("deliveryModal").classList.add("active");
}

function closeDeliveryModal() {
  document.getElementById("deliveryModal").classList.remove("active");
  currentDeliveryOrderId = null;
}

// ===== Confirm Delivery =====
function confirmDelivery() {
  const btn = document.getElementById("confirmDeliveryBtn");
  const btnText = btn.querySelector(".btn-text");
  const btnLoader = btn.querySelector(".btn-loader");

  // Show loading
  btn.classList.add("loading");
  btnText.style.display = "none";
  btnLoader.style.display = "inline-block";

  setTimeout(() => {
    const order = arexOrders.find((o) => o.id === currentDeliveryOrderId);
    if (order) {
      order.delivered = true;
      saveOrders();
      displayOrders();
      closeDeliveryModal();
      showToast("تم تأكيد التوصيل بنجاح");
    }

    // Reset button
    btn.classList.remove("loading");
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }, 2000);
}

// ===== Filter Orders =====
function filterOrders(filter) {
  currentFilter = filter;

  // Update button states
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");

  displayOrders();
}

// ===== Search Orders =====
function searchOrders(query) {
  searchQuery = query.trim();
  displayOrders();
}

// ===== Open Reset Modal =====
function openResetModal(orderId) {
  currentResetOrderId = orderId;
  document.getElementById("resetModal").classList.add("active");
}

function closeResetModal() {
  document.getElementById("resetModal").classList.remove("active");
  currentResetOrderId = null;
}

// ===== Confirm Reset =====
function confirmReset() {
  const order = arexOrders.find((o) => o.id === currentResetOrderId);
  if (order) {
    order.additionalCost = 0;
    saveOrders();

    // Update display
    const costValue = document.getElementById(
      `costValue-${currentResetOrderId}`
    );
    costValue.textContent = 0;

    updateStatistics();
    closeResetModal();
    showToast("تم إعادة تعيين المبلغ بنجاح");
  }
}

// ===== Show Toast =====
function showToast(message) {
  const toast = document.getElementById("toastNotification");
  const toastMessage = document.getElementById("toastMessage");

  toastMessage.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}
