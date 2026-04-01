// معلومات الأحجام
const sizeInfo = {
  small: {
    description:
      "الحجم الصغير: مناسب للأشياء الصغيرة مثل المجوهرات والأقلام. أبعاد: 30 × 22 سم",
    class: "small",
    maxItems: 6,
    price: 32,
  },
  medium: {
    description:
      "الحجم المتوسط: مناسب لتخزين الكتب والأدوات المكتبية. أبعاد: 40 × 28 سم",
    class: "medium",
    maxItems: 10,
    price: 40,
  },
  large: {
    description:
      "الحجم الكبير: مناسب للأشياء الكبيرة مثل الملابس والألعاب. أبعاد: 50 × 35 سم",
    class: "large",
    maxItems: 16,
    price: 55,
  },
};

// حالة التطبيق
const state = {
  currentSize: "medium",
  boxItems: [], // مصفوفة تحتوي على المنتجات المضافة
  totalPrice: 0,
  uniqueProducts: new Set(), // لتتبع المنتجات المختلفة بالأسماء لأننا سنعتمد على الاسم كمعرف
};

// عناصر DOM
const openBox = document.getElementById("openBox");
const boxContent = document.getElementById("boxContent");
const smallBtn = document.getElementById("small-btn");
const mediumBtn = document.getElementById("medium-btn");
const largeBtn = document.getElementById("large-btn");
const sizeDescription = document.getElementById("size-description");
const capacityInfo = document.getElementById("capacityInfo");
const totalItemsCount = document.getElementById("totalItemsCount");
const uniqueProductsCount = document.getElementById("uniqueProductsCount");
const totalPriceElement = document.getElementById("totalPrice");
const alertMessage = document.getElementById("alertMessage");
const alertText = document.getElementById("alertText");
const boxPriceNote = document.getElementById("box-price-note");

// عناصر المودل
const messageModalOverlay = document.getElementById("messageModalOverlay");
const closeMessageModal = document.getElementById("closeMessageModal");
const confirmAddMessage = document.getElementById("confirmAddMessage");
const messageTextArea = document.getElementById("messageTextArea");
const currentCharCount = document.getElementById("currentCharCount");

// للتخزين المؤقت لبيانات منتج الرسالة قبل التأكيد
let pendingMessageProduct = null;

// دالة تنسيق الأرقام مع فواصل الآلاف
function formatNumber(num) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

// دالة فتح الصندوق تلقائياً
function openBoxFunction() {
  if (!openBox.classList.contains("opened")) {
    openBox.classList.add("opened");
  }
}

// دالة إغلاق الصندوق تلقائياً
function closeBoxFunction() {
  if (openBox.classList.contains("opened")) {
    openBox.classList.remove("opened");
  }
}

// تهيئة التطبيق
function init() {
  updateBoxSize();
  updateSummary();
  initMobileMenu();
  initEventListeners();
}

// تهيئة قائمة الجوال
function initMobileMenu() {
  const menuToggle = document.getElementById("mobileMenuToggle");
  const menuClose = document.getElementById("mobileMenuClose");
  const menuOverlay = document.getElementById("mobileMenuOverlay");
  const menuContainer = document.getElementById("mobileMenuContainer");

  if (menuToggle && menuClose && menuOverlay && menuContainer) {
    menuToggle.addEventListener("click", () => {
      menuContainer.classList.add("active");
      menuOverlay.classList.add("active");
      document.body.style.overflow = "hidden";
    });

    const closeMenu = () => {
      menuContainer.classList.remove("active");
      menuOverlay.classList.remove("active");
      document.body.style.overflow = "";
    };

    menuClose.addEventListener("click", closeMenu);
    menuOverlay.addEventListener("click", closeMenu);

    const menuHint = document.getElementById("menuHint");
    if (menuHint) {
      const isMobile = window.getComputedStyle(menuToggle).display !== "none";
      if (isMobile) {
        menuHint.classList.add("active");
        setTimeout(() => {
          menuHint.style.opacity = "0";
          setTimeout(() => {
            menuHint.classList.remove("active");
          }, 500);
        }, 5000);
      }
    }
  }
}

// استخراج السعر من نص أو من الخاصية data-price
function parsePrice(priceText, element = null) {
  // أولاً نحاول القراءة من data-price إذا وُجد العنصر
  if (element && element.hasAttribute("data-price")) {
    return parseFloat(element.getAttribute("data-price"));
  }

  if (!priceText) return 0;
  const priceMatch = priceText.match(/\d+[.,]?\d*/);
  if (priceMatch) {
    return parseFloat(priceMatch[0].replace(",", "."));
  }
  return 0;
}

// ربط الأحداث (Event Delegation)
function initEventListeners() {
  // استخدام Event Delegation لزر الإضافة
  document.addEventListener("click", function (e) {
    // زر أضف للبوكس أو كتابة رسالة
    const addBtn = e.target.closest(".product .add");
    if (addBtn) {
      const productEl = addBtn.closest(".product");
      if (productEl) {
        const img = productEl.querySelector("img");
        const title = productEl.querySelector(".title");
        const priceEl = productEl.querySelector(".now-price");
        const isDecoration = productEl.hasAttribute("data-decoration");
        const isMessageBtn = addBtn.classList.contains("message-btn");

        const product = {
          name: title ? title.textContent.trim() : "منتج",
          price: parsePrice(priceEl ? priceEl.textContent : "", productEl),
          image: img ? img.src : "",
          isDecoration: isDecoration,
        };

        // إذا كان زر رسالة، نفتح المودل
        if (isMessageBtn) {
          openMessageModal(product);
        } else {
          addItemToBox(product, 1);
        }
      }
    }

    // زر الإزالة من البوكس
    const removeBtn = e.target.closest(".remove-item");
    if (removeBtn) {
      e.stopPropagation();
      const productName = removeBtn.dataset.name;
      removeItemFromBoxByName(productName);
    }
  });

  // الأحداث الخاصة بالمودل
  if (closeMessageModal) {
    closeMessageModal.addEventListener("click", closeMessageModalFunction);
  }

  if (messageModalOverlay) {
    messageModalOverlay.addEventListener("click", function (e) {
      if (e.target === messageModalOverlay) {
        closeMessageModalFunction();
      }
    });
  }

  if (confirmAddMessage) {
    confirmAddMessage.addEventListener("click", function () {
      if (pendingMessageProduct) {
        // الحصول على نص الرسالة (اختياري، يمكن تخزينه في المنتج)
        const message = messageTextArea.value.trim();
        // يمكننا إضافة الرسالة لاسم المنتج لتمييزه
        const finalProduct = { ...pendingMessageProduct };
        if (message) {
          finalProduct.note = message; // تخزين الرسالة في خصائص المنتج
        }

        addItemToBox(finalProduct, 1);
        closeMessageModalFunction();
      }
    });
  }

  if (messageTextArea) {
    messageTextArea.addEventListener("input", function () {
      const length = this.value.length;
      if (currentCharCount) {
        currentCharCount.textContent = length;

        // تحديث الألوان بناءً على طول النص
        const parent = currentCharCount.parentElement;
        if (parent) {
          parent.classList.remove("warning", "danger");
          if (length >= 110) {
            parent.classList.add("danger");
          } else if (length >= 90) {
            parent.classList.add("warning");
          }
        }
      }
    });
  }

  // تغيير حجم العلبة
  if (smallBtn) smallBtn.addEventListener("click", () => changeSize("small"));
  if (mediumBtn)
    mediumBtn.addEventListener("click", () => changeSize("medium"));
  if (largeBtn) largeBtn.addEventListener("click", () => changeSize("large"));

  // Template buttons
  const ramadanBtn = document.getElementById("ramadanBoxBtn");
  const motherDayBtn = document.getElementById("motherDayBoxBtn");
  const openCustomModalBtn = document.getElementById("openCustomModal");
  const closeCustomModalBtn = document.getElementById("closeCustomModal");
  const applyCustomBoxBtn = document.getElementById("applyCustomBox");
  const customBoxModal = document.getElementById("customBoxModal");

  if (ramadanBtn) {
    ramadanBtn.addEventListener("click", () => applyTemplate("ramadan"));
  }

  if (motherDayBtn) {
    motherDayBtn.addEventListener("click", () => applyTemplate("motherDay"));
  }

  if (openCustomModalBtn) {
    openCustomModalBtn.addEventListener("click", () => {
      if (customBoxModal) customBoxModal.classList.add("active");
    });
  }

  if (closeCustomModalBtn) {
    closeCustomModalBtn.addEventListener("click", () => {
      if (customBoxModal) customBoxModal.classList.remove("active");
    });
  }

  if (customBoxModal) {
    customBoxModal.addEventListener("click", (e) => {
      if (e.target === customBoxModal) {
        customBoxModal.classList.remove("active");
      }
    });
  }

  if (applyCustomBoxBtn) {
    applyCustomBoxBtn.addEventListener("click", applyCustomization);
  }

  // Category checkbox limit
  const categoryCheckboxes = document.querySelectorAll(
    '#categoryGrid input[type="checkbox"]'
  );
  categoryCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const checkedCount = document.querySelectorAll(
        '#categoryGrid input[type="checkbox"]:checked'
      ).length;
      if (checkedCount > 3) {
        checkbox.checked = false;
        showAlert("يمكنك اختيار 3 فئات كحد أقصى", "error");
      }
    });
  });
}

// وظائف المودل
function openMessageModal(product) {
  pendingMessageProduct = product;
  if (messageModalOverlay) {
    messageModalOverlay.classList.add("show");
  }
  if (messageTextArea) {
    messageTextArea.value = "";
    if (currentCharCount) currentCharCount.textContent = "0";
    messageTextArea.focus();
  }
}

function closeMessageModalFunction() {
  if (messageModalOverlay) {
    messageModalOverlay.classList.remove("show");
  }
  pendingMessageProduct = null;
}

function changeSize(size) {
  state.currentSize = size;
  updateBoxSize();

  smallBtn.classList.remove("active");
  mediumBtn.classList.remove("active");
  largeBtn.classList.remove("active");

  if (size === "small") smallBtn.classList.add("active");
  if (size === "medium") mediumBtn.classList.add("active");
  if (size === "large") largeBtn.classList.add("active");

  const maxItems = sizeInfo[size].maxItems;
  const regularItemsCount = state.boxItems.filter(
    (item) => !item.isDecoration
  ).length;

  if (regularItemsCount > maxItems) {
    // إزالة المنتجات العادية الزائدة من نهاية المصفوفة
    let countToRemove = regularItemsCount - maxItems;
    for (let i = state.boxItems.length - 1; i >= 0 && countToRemove > 0; i--) {
      if (!state.boxItems[i].isDecoration) {
        state.boxItems.splice(i, 1);
        countToRemove--;
      }
    }

    // تحديث المنتجات الفريدة
    state.uniqueProducts.clear();
    state.boxItems.forEach((item) => state.uniqueProducts.add(item.name));

    renderBoxItems();
    updateSummary();
    showAlert(
      `تم تقليل العناصر إلى ${maxItems} عنصر لتناسب حجم العلبة الجديد`,
      "error"
    );
  }

  updateCapacityInfo();
}

// تحديث مظهر العلبة
function updateBoxSize() {
  const size = sizeInfo[state.currentSize];
  if (sizeDescription) sizeDescription.textContent = size.description;

  if (openBox) {
    openBox.classList.remove("small", "medium", "large");
    openBox.classList.add(size.class);
  }

  if (boxPriceNote) {
    boxPriceNote.textContent = `ملاحظة: سعر البوكس (حجم ${
      state.currentSize === "small"
        ? " صغير"
        : state.currentSize === "medium"
        ? "متوسط"
        : "كبير"
    }) هو ${size.price} جنية `;
  }

  updateCapacityInfo();
  updateSummary();
}

// تحديث معلومات السعة
function updateCapacityInfo() {
  const maxItems = sizeInfo[state.currentSize].maxItems;
  const regularItems = state.boxItems.filter((item) => !item.isDecoration);
  if (capacityInfo)
    capacityInfo.textContent = `السعة: ${regularItems.length}/${maxItems} عناصر`;
}

// إضافة عنصر إلى العلبة
function addItemToBox(product, quantity = 1) {
  const maxItems = sizeInfo[state.currentSize].maxItems;

  if (!product.isDecoration) {
    const regularItems = state.boxItems.filter((item) => !item.isDecoration);
    const availableSpace = maxItems - regularItems.length;

    if (availableSpace <= 0) {
      showAlert(`لا يمكن إضافة المزيد من العناصر. العلبة ممتلئة`, "error");
      return;
    }

    state.boxItems.push(product);
    state.uniqueProducts.add(product.name);

    openBoxFunction();
    renderBoxItems();
    updateSummary();
    updateCapacityInfo();
    showAlert(`تمت إضافة "${product.name}" إلى العلبة`);
  } else {
    state.boxItems.push(product);
    state.uniqueProducts.add(product.name);

    openBoxFunction();
    renderBoxItems();
    updateSummary();
    updateCapacityInfo();
    showAlert(`تمت إضافة "${product.name}" (عنصر تزييني)`);
  }
}

// عرض العناصر داخل العلبة
function renderBoxItems() {
  if (!boxContent) return;
  boxContent.innerHTML = "";

  // فصل الرسائل عن باقي المنتجات
  const messages = state.boxItems.filter((item) => item.name === "رسالة مميزة");
  const otherProducts = state.boxItems.filter(
    (item) => item.name !== "رسالة مميزة"
  );

  // تجميع المنتجات العادية حسب الاسم (ماعدا الرسائل)
  const productCounts = {};
  otherProducts.forEach((product) => {
    if (!productCounts[product.name]) {
      productCounts[product.name] = {
        count: 0,
        product: product,
      };
    }
    productCounts[product.name].count++;
  });

  // عرض المنتجات المجمعة
  Object.values(productCounts).forEach((item) => {
    const boxItem = document.createElement("div");
    boxItem.className = "box-item";

    boxItem.innerHTML = `
                    <div class="remove-item" data-name="${item.product.name}">×</div>
                    <img src="${item.product.image}" alt="${item.product.name}" />
                    <div class="item-count">${item.count}</div>
                `;

    boxContent.appendChild(boxItem);
  });

  // عرض كل رسالة كعنصر منفصل
  messages.forEach((message) => {
    const boxItem = document.createElement("div");
    boxItem.className = "box-item message-item";
    boxItem.style.cursor = "pointer";
    boxItem.title = "اضغط لعرض الرسالة";

    boxItem.innerHTML = `
                    <div class="remove-item" data-name="${
                      message.name
                    }" data-note="${message.note || ""}">×</div>
                    <img src="${message.image}" alt="${message.name}" />
                `;

    // إضافة حدث النقر لعرض محتوى الرسالة
    if (message.note) {
      boxItem.addEventListener("click", (e) => {
        // تجنب فتح المودل عند الضغط على زر الحذف
        if (!e.target.classList.contains("remove-item")) {
          console.log("Showing message:", message.note);
          showMessagePreview(message.note);
        }
      });
    }

    boxContent.appendChild(boxItem);
  });
}

// عرض محتوى الرسالة
function showMessagePreview(messageText) {
  const modal = document.getElementById("messagePreviewModal");
  const messagePreviewText = document.getElementById("messagePreviewText");

  if (modal && messagePreviewText) {
    messagePreviewText.textContent = messageText;
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// إغلاق مودل عرض الرسالة
function closeMessagePreview() {
  const modal = document.getElementById("messagePreviewModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// إضافة event listeners لمودل عرض الرسالة
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeMessagePreview");
  const modal = document.getElementById("messagePreviewModal");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeMessagePreview);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeMessagePreview();
      }
    });
  }
});

// إزالة عنصر من العلبة
function removeItemFromBoxByName(productName) {
  // للرسائل، نحتاج لإزالة رسالة واحدة فقط
  if (productName === "رسالة مميزة") {
    // البحث عن أول رسالة وإزالتها
    const index = state.boxItems.findIndex((item) => item.name === productName);
    if (index !== -1) {
      const removedItem = state.boxItems.splice(index, 1)[0];

      const hasMoreItems = state.boxItems.some(
        (item) => item.name === productName
      );
      if (!hasMoreItems) {
        state.uniqueProducts.delete(productName);
      }

      if (state.boxItems.length === 0) {
        closeBoxFunction();
      }

      renderBoxItems();
      updateSummary();
      updateCapacityInfo();
      showAlert(`تمت إزالة "${removedItem.name}" من العلبة`, "error");
    }
  } else {
    // للمنتجات العادية، نزيل واحدة من آخر المصفوفة
    const index = state.boxItems.findLastIndex(
      (item) => item.name === productName
    );
    if (index !== -1) {
      const removedItem = state.boxItems.splice(index, 1)[0];

      const hasMoreItems = state.boxItems.some(
        (item) => item.name === productName
      );
      if (!hasMoreItems) {
        state.uniqueProducts.delete(productName);
      }

      if (state.boxItems.length === 0) {
        closeBoxFunction();
      }

      renderBoxItems();
      updateSummary();
      updateCapacityInfo();
      showAlert(`تمت إزالة "${removedItem.name}" من العلبة`, "error");
    }
  }
}

// تحديث ملخص الطلب
function updateSummary() {
  const productsTotal = state.boxItems.reduce(
    (sum, item) => sum + item.price,
    0
  );
  const boxPrice = sizeInfo[state.currentSize].price;
  state.totalPrice = productsTotal + boxPrice;

  if (totalItemsCount) totalItemsCount.textContent = state.boxItems.length;
  if (uniqueProductsCount)
    uniqueProductsCount.textContent = state.uniqueProducts.size;
  if (totalPriceElement)
    totalPriceElement.textContent = formatNumber(state.totalPrice);
}

// عرض رسالة تنبيه
function showAlert(message, type = "success") {
  if (!alertText || !alertMessage) return;
  alertText.textContent = message;

  if (type === "error") {
    alertMessage.classList.add("error");
    const icon = alertMessage.querySelector("i");
    if (icon) icon.className = "fas fa-exclamation-circle";
  } else {
    alertMessage.classList.remove("error");
    const icon = alertMessage.querySelector("i");
    if (icon) icon.className = "fas fa-check-circle";
  }
  alertMessage.classList.add("show");
  setTimeout(() => {
    alertMessage.classList.remove("show");
  }, 3000);
}

// Apply predefined templates
function applyTemplate(type) {
  const templates = {
    ramadan: [
      {
        name: "شنطة جلدية فاخرة",
        price: 250,
        image: "../images/bag-product.jpg",
        isDecoration: false,
      },
      {
        name: "ساعة يد راقية",
        price: 450,
        image: "../images/bag-product.jpg",
        isDecoration: false,
      },
      {
        name: "فراشات مميزة",
        price: 15,
        image: "../images/fly.png",
        isDecoration: true,
        count: 5,
      },
      {
        name: "رسالة مميزة",
        price: 10,
        image: "../images/papper.png",
        isDecoration: true,
        note: "رمضان نور يلمس القلب قبل اليوم. كل رمضان وانت معايا",
      },
    ],
    motherDay: [
      {
        name: "شنطة جلدية فاخرة",
        price: 250,
        image: "../images/bag-product.jpg",
        isDecoration: false,
      },
      {
        name: "فراشات مميزة",
        price: 15,
        image: "../images/fly.png",
        isDecoration: true,
        count: 2,
      },
      {
        name: "رسالة مميزة",
        price: 10,
        image: "../images/papper.png",
        isDecoration: true,
        note: "أمي دعوة حلوة، وحُب ملوش بديل.",
      },
    ],
  };

  const template = templates[type];
  if (!template) return;

  // Clear existing items
  state.boxItems = [];
  state.uniqueProducts.clear();

  // Add template items with animation delay
  template.forEach((item, index) => {
    setTimeout(() => {
      const count = item.count || 1;
      for (let i = 0; i < count; i++) {
        addItemToBox(item, 1);
      }
    }, index * 300);
  });

  showAlert(
    `تم تطبيق ${type === "ramadan" ? "بوكس رمضاني" : "بوكس عيد الأم"} بنجاح`
  );
}

// Apply customization based on budget and categories
function applyCustomization() {
  const budgetInput = document.getElementById("budgetInput");
  const budget = parseFloat(budgetInput.value);

  if (!budget || budget < 50) {
    showAlert("الرجاء إدخال ميزانية صحيحة (50 جنية على الأقل)", "error");
    return;
  }

  const selectedCategories = Array.from(
    document.querySelectorAll('#categoryGrid input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  if (selectedCategories.length === 0) {
    showAlert("الرجاء اختيار فئة واحدة على الأقل", "error");
    return;
  }

  // Extract products from HTML
  const availableProducts = [];
  const productElements = document.querySelectorAll(
    ".product:not([data-decoration])"
  );

  productElements.forEach((productEl) => {
    const img = productEl.querySelector("img");
    const title = productEl.querySelector(".title");
    const price = parseFloat(productEl.getAttribute("data-price")) || 0;
    const categoriesAttr = productEl.getAttribute("data-categories");

    if (title && price > 0 && categoriesAttr) {
      availableProducts.push({
        name: title.textContent.trim(),
        price: price,
        image: img ? img.src : "../images/bag-product.jpg",
        categories: categoriesAttr.split(",").map((cat) => cat.trim()),
        isDecoration: false,
      });
    }
  });

  // Add decoration products (except messages - they need manual input)
  const decorationElements = document.querySelectorAll(
    '.product[data-decoration="true"]'
  );
  decorationElements.forEach((productEl) => {
    const img = productEl.querySelector("img");
    const title = productEl.querySelector(".title");
    const price = parseFloat(productEl.getAttribute("data-price")) || 0;
    const productName = title ? title.textContent.trim() : "";

    // استبعاد "رسالة مميزة" من التخصيص العشوائي
    if (title && price > 0 && productName !== "رسالة مميزة") {
      availableProducts.push({
        name: productName,
        price: price,
        image: img ? img.src : "../images/fly.png",
        categories: ["بسيط", "فاخر", "صداقة", "ام", "حب", "رمضاني", "عيد"], // Decorations match all
        isDecoration: true,
      });
    }
  });

  // Filter products by categories
  const matchingProducts = availableProducts.filter((product) =>
    product.categories.some((cat) => selectedCategories.includes(cat))
  );

  if (matchingProducts.length === 0) {
    showAlert("لا توجد منتجات متاحة للفئات المختارة", "error");
    return;
  }

  // Clear existing items
  state.boxItems = [];
  state.uniqueProducts.clear();

  // Pick random products within budget
  let remainingBudget = budget;
  const selectedProducts = [];
  const shuffled = [...matchingProducts].sort(() => 0.5 - Math.random());

  for (const product of shuffled) {
    if (product.price <= remainingBudget) {
      selectedProducts.push(product);
      remainingBudget -= product.price;
    }
    if (
      !product.isDecoration &&
      selectedProducts.filter((p) => !p.isDecoration).length >=
        sizeInfo[state.currentSize].maxItems
    )
      break;
  }

  if (selectedProducts.length === 0) {
    showAlert("الميزانية غير كافية لإضافة أي منتجات", "error");
    return;
  }

  // Add selected products with animation
  selectedProducts.forEach((product, index) => {
    setTimeout(() => {
      addItemToBox(product, 1);
    }, index * 300);
  });

  // Close modal
  const customBoxModal = document.getElementById("customBoxModal");
  if (customBoxModal) customBoxModal.classList.remove("active");

  showAlert(
    `تم إضافة ${selectedProducts.length} منتج بإجمالي ${
      budget - remainingBudget
    } جنية`
  );
}

// بدء التطبيق
window.addEventListener("DOMContentLoaded", init);
