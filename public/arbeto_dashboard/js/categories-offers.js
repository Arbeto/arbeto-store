// ===== Global Variables =====
let sliderImageData = null;
let offerImageData = null;
let offerImageFile = null;
let selectedProductsData = [];
let allProducts = window.allProducts || [];
let savedOffers = window.initialOffers || [];
let currentOfferId = null;

// Fixed offer state
let fixedOfferId = null;
let fixedOfferCurrentProducts = [];
let modalContext = 'form'; // 'form' | 'fixed-regular' | 'fixed-decoration'

function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Slider Section Functions =====
let sliderFile = null;

// Preview for Add Slider
document
    .getElementById("sliderImageInput")
    .addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            sliderFile = file;
            const reader = new FileReader();
            reader.onload = function (event) {
                const previewContainer = document.getElementById(
                    "sliderAddPreviewContainer",
                );
                const previewImg = document.getElementById("sliderAddPreview");
                previewImg.src = event.target.result;
                previewContainer.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

document
    .getElementById("cancelSliderPreview")
    .addEventListener("click", function () {
        sliderFile = null;
        document.getElementById("sliderImageInput").value = "";
        document.getElementById("sliderAddPreviewContainer").style.display =
            "none";
    });

document
    .getElementById("addSliderBtn")
    .addEventListener("click", async function () {
        if (!sliderFile) {
            showToast("الرجاء اختيار صورة أولاً");
            return;
        }

        const link = document.getElementById("sliderLinkInput").value.trim();
        const formData = new FormData();
        formData.append("img", sliderFile);
        if (link) formData.append("link", link);

        try {
            const response = await fetch("/api/sliders", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                addSliderCard(data.img, data.link, data.id, data.position);
                showToast("تم إضافة السلايدر بنجاح");

                // Reset inputs
                sliderFile = null;
                document.getElementById("sliderImageInput").value = "";
                document.getElementById("sliderLinkInput").value = "";
                document.getElementById(
                    "sliderAddPreviewContainer",
                ).style.display = "none";
            } else {
                const errorData = await response.json();
                showToast(errorData.error || "حدث خطأ أثناء الإضافة");
            }
        } catch (error) {
            console.error("Error adding slider:", error);
            showToast("حدث خطأ في الاتصال بالسيرفر");
        }
    });

function addSliderCard(imageSrc, link, id, position) {
    const slidersPreview = document.getElementById("slidersPreview");
    const sliderCard = document.createElement("div");
    sliderCard.className = "slider-card";
    sliderCard.dataset.id = id;
    sliderCard.draggable = true;

    sliderCard.innerHTML = `
        <div class="slider-position-badge">#${position}</div>
        <div class="slider-img-container" onclick="triggerInlineImageEdit(${id})">
            <img src="${imageSrc}" id="img-${id}" alt="Slider Image">
            <div class="slider-img-overlay">
                <span>تغيير الصورة</span>
            </div>
            <input type="file" id="file-input-${id}" accept="image/*" style="display: none;" onchange="handleInlineImageChange(event, ${id})">
        </div>
        <div class="slider-card-content">
            <div class="slider-link-edit">
                <div class="link-display" id="link-display-${id}" onclick="activateLinkEdit(${id})">
                    ${link ? `Link: ${link}` : "بدون رابط"}
                </div>
                <input type="text" 
                       id="link-input-${id}" 
                       class="link-edit-input" 
                       style="display: none;" 
                       value="${link || ""}" 
                       oninput="detectLinkChange(${id}, '${link || ""}')"
                       onblur="deactivateLinkEdit(${id})">
                <button class="btn-save-inline" id="save-link-${id}" onclick="saveInlineLink(${id})">حفظ الرابط</button>
                <button class="btn-save-inline" id="save-img-${id}" onclick="saveInlineImage(${id})">حفظ الصورة</button>
            </div>
            <button class="btn-remove-slider" onclick="deleteSlider(${id})">
                <span class="bi bi-trash"></span> حذف
            </button>
        </div>
    `;

    // Drag and Drop Events
    sliderCard.addEventListener("dragstart", handleDragStart);
    sliderCard.addEventListener("dragend", handleDragEnd);
    sliderCard.addEventListener("dragover", handleDragOver);
    sliderCard.addEventListener("drop", handleDrop);

    slidersPreview.appendChild(sliderCard);
}

// Reordering Logic
let dragSrcEl = null;

function handleDragStart(e) {
    this.classList.add("dragging");
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
}

function handleDragEnd(e) {
    this.classList.remove("dragging");
    const cards = document.querySelectorAll(".slider-card");
    cards.forEach((card) => card.classList.remove("drag-over"));
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    this.classList.add("drag-over");
    return false;
}

async function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();

    if (dragSrcEl !== this) {
        const parent = this.parentNode;
        const allCards = Array.from(parent.children);
        const fromIndex = allCards.indexOf(dragSrcEl);
        const toIndex = allCards.indexOf(this);

        if (fromIndex < toIndex) {
            parent.insertBefore(dragSrcEl, this.nextSibling);
        } else {
            parent.insertBefore(dragSrcEl, this);
        }

        // Sync with database
        await syncSlidersOrder();
    }
    return false;
}

async function syncSlidersOrder() {
    const cards = document.querySelectorAll(".slider-card");
    const orders = Array.from(cards).map((card, index) => {
        const position = index + 1;
        // Update badge UI
        card.querySelector(".slider-position-badge").textContent =
            `#${position}`;
        return {
            id: card.dataset.id,
            position: position,
        };
    });

    try {
        await fetch("/api/sliders/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orders }),
        });
        showToast("تم تحديث الترتيب بنجاح");
    } catch (error) {
        console.error("Error reordering:", error);
    }
}

// Inline Image Editing
let tempImgFile = {};

function triggerInlineImageEdit(id) {
    document.getElementById(`file-input-${id}`).click();
}

function handleInlineImageChange(event, id) {
    const file = event.target.files[0];
    if (file) {
        tempImgFile[id] = file;
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById(`img-${id}`).src = e.target.result;
            document.getElementById(`save-img-${id}`).classList.add("show");
        };
        reader.readAsDataURL(file);
    }
}

async function saveInlineImage(id) {
    const file = tempImgFile[id];
    if (!file) return;

    const formData = new FormData();
    formData.append("img", file);

    try {
        const response = await fetch(`/api/sliders/${id}`, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            showToast("تم تحديث الصورة بنجاح");
            document.getElementById(`save-img-${id}`).classList.remove("show");
            delete tempImgFile[id];
        }
    } catch (error) {
        showToast("حدث خطأ أثناء التحديث");
    }
}

// Inline Link Editing
function activateLinkEdit(id) {
    document.getElementById(`link-display-${id}`).style.display = "none";
    const input = document.getElementById(`link-input-${id}`);
    input.style.display = "block";
    input.focus();
}

function deactivateLinkEdit(id) {
    const input = document.getElementById(`link-input-${id}`);
    const saveBtn = document.getElementById(`save-link-${id}`);

    // Only deactivate if no changes or save button not visible
    if (!saveBtn.classList.contains("show")) {
        document.getElementById(`link-display-${id}`).style.display = "block";
        input.style.display = "none";
    }
}

function detectLinkChange(id, originalLink) {
    const input = document.getElementById(`link-input-${id}`);
    const saveBtn = document.getElementById(`save-link-${id}`);
    if (input.value !== originalLink) {
        saveBtn.classList.add("show");
    } else {
        saveBtn.classList.remove("show");
    }
}

async function saveInlineLink(id) {
    const input = document.getElementById(`link-input-${id}`);
    const link = input.value.trim();

    try {
        const response = await fetch(`/api/sliders/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link }),
        });

        if (response.ok) {
            showToast("تم تحديث الرابط بنجاح");
            document.getElementById(`link-display-${id}`).textContent = link
                ? `Link: ${link}`
                : "بدون رابط";
            document.getElementById(`save-link-${id}`).classList.remove("show");
            deactivateLinkEdit(id);
            // Update the original link in detectLinkChange for next comparison
            const display = document.getElementById(`link-display-${id}`);
            display.onclick = () => activateLinkEdit(id);
        }
    } catch (error) {
        showToast("حدث خطأ أثناء التحديث");
    }
}

async function loadSliders() {
    try {
        const response = await fetch("/api/sliders");
        const sliders = await response.json();

        const slidersPreview = document.getElementById("slidersPreview");
        slidersPreview.innerHTML = "";

        sliders.forEach((slider) => {
            const fullImgPath = slider.img.startsWith("http")
                ? slider.img
                : "/" + slider.img;
            addSliderCard(fullImgPath, slider.link, slider.id, slider.position);
        });
    } catch (error) {
        console.error("Error loading sliders:", error);
    }
}

async function deleteSlider(id) {
    if (!confirm("هل أنت متأكد من حذف هذا السلايدر؟")) return;

    try {
        const response = await fetch(`/api/sliders/${id}`, {
            method: "DELETE",
        });

        if (response.ok) {
            document.querySelector(`.slider-card[data-id="${id}"]`).remove();
            showToast("تم حذف السلايدر بنجاح");
        } else {
            showToast("حدث خطأ أثناء الحذف");
        }
    } catch (error) {
        console.error("Error deleting slider:", error);
        showToast("حدث خطأ في الاتصال بالسيرفر");
    }
}

// ===== Offer Page Section Functions =====
document
    .getElementById("offerImageInput")
    .addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            offerImageFile = file;
            const reader = new FileReader();
            reader.onload = function (event) {
                offerImageData = event.target.result;
                const preview = document.getElementById("offerImagePreview");
                const placeholder = document.querySelector(
                    ".upload-placeholder",
                );

                preview.src = event.target.result;
                preview.style.display = "block";
                placeholder.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    });

// ===== Product Modal Functions =====
const modal = document.getElementById("productModal");
const openModalBtn = document.getElementById("openProductModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

openModalBtn.addEventListener("click", function () {
    modalContext = 'form';
    modal.classList.add("active");
    loadProducts(allProducts);
});

closeModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", function (e) {
    if (e.target === modal) {
        closeModal();
    }
});

function closeModal() {
    modal.classList.add("closing");
    setTimeout(() => {
        modal.classList.remove("active", "closing");
    }, 300);
}

// ===== Product Search =====
document
    .getElementById("productSearch")
    .addEventListener("input", function (e) {
        const searchTerm = e.target.value.toLowerCase().trim();

        if (searchTerm === "") {
            loadProducts(allProducts);
        } else {
            const filtered = allProducts.filter((product) =>
                product.name.toLowerCase().includes(searchTerm),
            );
            loadProducts(filtered);
        }
    });

// ===== Load Products into Grid =====
function loadProducts(products) {
    const productsGrid = document.getElementById("productsGrid");
    productsGrid.innerHTML = "";

    if (products.length === 0) {
        productsGrid.innerHTML =
            '<p style="text-align: center; color: #596d52; grid-column: 1/-1;">لا توجد منتجات</p>';
        return;
    }

    products.forEach((product) => {
        const productCard = document.createElement("div");
        productCard.className = "product-card";

        let mainImage = product.img;
        if (Array.isArray(product.img)) {
            mainImage = product.img[0];
        } else if (
            typeof product.img === "string" &&
            product.img.startsWith("[")
        ) {
            try {
                const imgs = JSON.parse(product.img);
                mainImage = imgs[0];
            } catch (e) {}
        }

        const imgSrc = mainImage
            ? mainImage.startsWith("http")
                ? mainImage
                : "/" + mainImage
            : "https://via.placeholder.com/200x150?text=No+Image";

        productCard.innerHTML = `
            <img src="${imgSrc}" alt="${product.name}">
            <h4>${product.name}</h4>
            <input type="number" 
                   class="discount-input" 
                   placeholder="نسبة الخصم %" 
                   min="0" 
                   max="100"
                   id="discount-${product.id}">
            <button class="btn-add-product" onclick="addProductToOffer(${product.id})">
                <span class="bi bi-plus-circle"></span> إضافة
            </button>
        `;

        productsGrid.appendChild(productCard);
    });
}

// ===== Add Product to Offer =====
function addProductToOffer(productId) {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;

    const discountInput = document.getElementById(`discount-${productId}`);
    const discount = parseInt(discountInput.value) || 0;

    if (discount < 0 || discount > 100) {
        alert("الرجاء إدخال نسبة خصم صحيحة (0-100)");
        return;
    }

    if (modalContext === 'form') {
        if (selectedProductsData.find((p) => p.id === productId)) {
            alert("هذا المنتج مضاف بالفعل");
            return;
        }
        selectedProductsData.push({ ...product, discount });
        updateSelectedProducts();
    } else {
        if (fixedOfferCurrentProducts.find((p) => p.id === productId)) {
            alert("هذا المنتج مضاف بالفعل");
            return;
        }
        const isDecoration = modalContext === 'fixed-decoration' ? 1 : 0;
        fixedOfferCurrentProducts.push({ ...product, discount, is_decoration: isDecoration });
        refreshFixedOfferProductsUI();
    }

    discountInput.value = "";
}

// ===== Update Selected Products Display =====
function updateSelectedProducts() {
    const selectedProductsContainer =
        document.getElementById("selectedProducts");
    selectedProductsContainer.innerHTML = "";

    if (selectedProductsData.length === 0) {
        return;
    }

    selectedProductsData.forEach((product) => {
        const productCard = document.createElement("div");
        productCard.className = "selected-product-card";

        let mainImage = product.img;
        if (Array.isArray(product.img)) {
            mainImage = product.img[0];
        }
        const imgSrc = mainImage
            ? mainImage.startsWith("http")
                ? mainImage
                : "/" + mainImage
            : "https://via.placeholder.com/200x150?text=No+Image";

        productCard.innerHTML = `
            <img src="${imgSrc}" alt="${product.name}">
            <h4>${product.name}</h4>
            <p>خصم: ${product.discount}%</p>
            <button class="btn-remove-slider" onclick="removeProductFromOffer(${product.id})" style="margin-top: 10px;">
                <span class="bi bi-trash"></span> حذف
            </button>
        `;

        selectedProductsContainer.appendChild(productCard);
    });
}

// ===== Remove Product from Offer =====
function removeProductFromOffer(productId) {
    selectedProductsData = selectedProductsData.filter(
        (p) => p.id !== productId,
    );
    updateSelectedProducts();
}

// ===== Submit Offer =====
document
    .getElementById("submitOfferBtn")
    .addEventListener("click", async function () {
        const title = document.getElementById("offerTitle").value.trim();
        const urlPath = document.getElementById("offerUrlPath").value.trim();

        if (!offerImageFile) {
            alert("الرجاء رفع صورة العرض");
            return;
        }

        if (!title) {
            alert("الرجاء إدخال عنوان العرض");
            return;
        }

        if (!urlPath) {
            alert("الرجاء إدخال رابط الصفحة");
            return;
        }

        // Get selected locations
        const locations = [];
        if (document.getElementById("header").checked) locations.push("header");
        if (document.getElementById("navbar").checked) locations.push("navbar");
        if (document.getElementById("footer").checked) locations.push("footer");
        if (document.getElementById("home").checked) locations.push("home");

        if (locations.length === 0) {
            alert("الرجاء اختيار موقع عرض واحد على الأقل");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", document.getElementById("offerDescription").value.trim());
        formData.append("btn_text", document.getElementById("offerBtnText").value.trim() || "ابدأ الان");
        formData.append("slug", urlPath);
        formData.append("img", offerImageFile);
        formData.append("location", locations.join(","));

        selectedProductsData.forEach((product, index) => {
            formData.append(`products[${index}][id]`, product.id);
            formData.append(`products[${index}][discount]`, product.discount);
        });

        try {
            const response = await fetch("/api/offers", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const newOffer = await response.json();
                savedOffers.push(newOffer);
                showToast("تم حفظ العرض بنجاح");
                resetOfferForm();
                displaySavedOffers();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "حدث خطأ أثناء الحفظ");
            }
        } catch (error) {
            console.error("Error submitting offer:", error);
            showToast("حدث خطأ في الاتصال بالسيرفر");
        }
    });

// ===== Reset Offer Form =====
function resetOfferForm() {
    offerImageData = null;
    offerImageFile = null;
    selectedProductsData = [];

    document.getElementById("offerTitle").value = "";
    document.getElementById("offerDescription").value = "";
    document.getElementById("offerBtnText").value = "ابدأ الان";
    document.getElementById("offerUrlPath").value = "";
    document.getElementById("offerImageInput").value = "";
    document.getElementById("offerImagePreview").style.display = "none";
    document.querySelector(".upload-placeholder").style.display = "flex";

    document.getElementById("header").checked = false;
    document.getElementById("navbar").checked = false;
    document.getElementById("footer").checked = false;
    document.getElementById("home").checked = false;

    updateSelectedProducts();
}

// ===== Show Toast Notification =====
function showToast(message) {
    const toast = document.getElementById("toastNotification");
    const toastMessage = document.getElementById("toastMessage");

    toastMessage.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ===== Display Saved Offers =====
function displaySavedOffers() {
    const offersGrid = document.getElementById("offersGrid");
    offersGrid.innerHTML = "";

    // Always render fixed offer first (pinned at top)
    const fixedOffer = savedOffers.find((o) => o.is_fixed);
    if (fixedOffer) renderFixedOfferCard(fixedOffer);

    const regularOffers = savedOffers.filter((o) => !o.is_fixed);

    if (regularOffers.length === 0 && !fixedOffer) {
        offersGrid.innerHTML =
            '<p style="text-align: center; color: #596d52; grid-column: 1/-1;">لا توجد عروض متاحة حاليًا</p>';
        return;
    }

    regularOffers.forEach((offer) => {
        const offerCard = document.createElement("div");
        offerCard.className = "offer-card";
        offerCard.onclick = () => openOfferEditPage(offer.id);

        const imgSrc = offer.img
            ? offer.img.startsWith("http")
                ? offer.img
                : "/" + offer.img
            : "https://via.placeholder.com/200x150?text=No+Image";

        offerCard.innerHTML = `
      <img src="${imgSrc}" alt="${esc(offer.title)}">
      <div class="offer-card-content">
        <h4>${esc(offer.title)}</h4>
      </div>
    `;
        offersGrid.appendChild(offerCard);
    });
}

// ===== Fixed Offer Card =====
function renderFixedOfferCard(offer) {
    fixedOfferId = offer.id;

    // Init products from DB (pivot data)
    fixedOfferCurrentProducts = (offer.products || []).map((p) => ({
        id: p.id,
        name: p.name,
        img: p.img,
        discount: p.pivot ? (p.pivot.discount || 0) : 0,
        is_decoration: p.pivot ? (p.pivot.is_decoration || 0) : 0,
    }));

    const currentLocations = (offer.location || '').split(',').filter(Boolean);
    const locNames = { header: 'الهيدر', navbar: 'الناف بار', footer: 'الفوتر', home: 'الرئيسية' };
    const imgSrc = offer.img
        ? (offer.img.startsWith('http') ? offer.img : '/' + offer.img)
        : '/arbeto_dashboard/image/logo-nunbg.png';

    const card = document.createElement('div');
    card.className = 'fixed-offer-card';
    card.dataset.id = offer.id;
    card.innerHTML = `
        <div class="fixed-offer-header">
            <span class="fixed-offer-badge"><i class="bi bi-pin-angle-fill"></i> عرض ثابت</span>
        </div>
        <div class="fixed-offer-body">
            <div class="fixed-offer-image-col">
                <div class="fixed-offer-image-wrap" onclick="document.getElementById('fixed-offer-img-input').click()">
                    <img src="${imgSrc}" id="fixed-offer-img" />
                    <div class="fixed-offer-img-overlay"><i class="bi bi-camera-fill"></i><span>تغيير الصورة</span></div>
                </div>
                <input type="file" id="fixed-offer-img-input" accept="image/*" style="display:none;">
            </div>
            <div class="fixed-offer-fields-col">
                <div class="fixed-field-row">
                    <label>عنوان العرض</label>
                    <input type="text" id="fixed-offer-title" class="fixed-field-input" value="${esc(offer.title || '')}">
                </div>
                <div class="fixed-field-row">
                    <label>وصف مختصر</label>
                    <input type="text" id="fixed-offer-desc" class="fixed-field-input" value="${esc(offer.description || '')}">
                </div>
                <div class="fixed-field-row">
                    <label>نص الزر</label>
                    <input type="text" id="fixed-offer-btn-text" class="fixed-field-input" value="${esc(offer.btn_text || 'ابدأ الآن')}">
                </div>
                <div class="fixed-field-row">
                    <label>رابط الصفحة</label>
                    <input type="text" id="fixed-offer-slug" class="fixed-field-input" value="${esc(offer.slug || '')}">
                </div>
                <div class="fixed-field-row">
                    <label>مواقع العرض</label>
                    <div class="fixed-offer-checkboxes">
                        ${['header','navbar','footer','home'].map(loc => `
                            <label class="checkbox-item">
                                <input type="checkbox" class="fixed-loc-cb" value="${loc}" ${currentLocations.includes(loc) ? 'checked' : ''}>
                                <span class="checkbox-label">${locNames[loc]}</span>
                            </label>`).join('')}
                    </div>
                </div>
            </div>
        </div>
        <div class="fixed-offer-products-section">
            <div class="fixed-products-col">
                <div class="fixed-products-col-label">
                    <i class="bi bi-box-seam"></i> المنتجات العادية
                    <button class="btn-fixed-add" onclick="openModalForFixedOffer(false)">
                        <i class="bi bi-bag-plus"></i> إضافة منتجات
                    </button>
                </div>
                <div id="fixed-offer-regular-products" class="fixed-products-list"></div>
            </div>
            <div class="fixed-products-col">
                <div class="fixed-products-col-label deco">
                    <i class="bi bi-stars"></i> منتجات التزيين
                    <button class="btn-fixed-add deco" onclick="openModalForFixedOffer(true)">
                        <i class="bi bi-bag-plus"></i> إضافة منتجات تزيين
                    </button>
                </div>
                <div id="fixed-offer-deco-products" class="fixed-products-list"></div>
            </div>
        </div>
        <div class="fixed-offer-footer">
            <button class="btn-save-fixed-offer" onclick="saveFixedOffer(${offer.id})">
                <i class="bi bi-floppy-fill"></i> حفظ التغييرات
            </button>
        </div>
    `;

    document.getElementById('offersGrid').appendChild(card);

    // Image change listener
    card.querySelector('#fixed-offer-img-input').addEventListener('change', function () {
        if (this.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => { document.getElementById('fixed-offer-img').src = ev.target.result; };
            reader.readAsDataURL(this.files[0]);
        }
    });

    refreshFixedOfferProductsUI();
}

function openModalForFixedOffer(isDecoration) {
    modalContext = isDecoration ? 'fixed-decoration' : 'fixed-regular';
    modal.classList.add('active');
    loadProducts(allProducts);
}

function refreshFixedOfferProductsUI() {
    const regular = fixedOfferCurrentProducts.filter((p) => !p.is_decoration);
    const deco    = fixedOfferCurrentProducts.filter((p) => p.is_decoration);
    const rEl = document.getElementById('fixed-offer-regular-products');
    const dEl = document.getElementById('fixed-offer-deco-products');
    if (rEl) rEl.innerHTML = renderFixedProductsList(regular);
    if (dEl) dEl.innerHTML = renderFixedProductsList(deco);
}

function renderFixedProductsList(products) {
    if (!products.length) return '<span class="fixed-empty-products">لا توجد منتجات</span>';
    return products.map((p) => `
        <div class="fixed-product-row">
            <span class="fixed-product-name">${esc(p.name)}</span>
            <span class="fixed-product-discount">خصم: ${p.discount}%</span>
            <button class="btn-remove-fixed-product" onclick="removeFixedOfferProduct(${p.id})">
                <i class="bi bi-x"></i>
            </button>
        </div>`).join('');
}

function removeFixedOfferProduct(productId) {
    fixedOfferCurrentProducts = fixedOfferCurrentProducts.filter((p) => p.id !== productId);
    refreshFixedOfferProductsUI();
}

async function saveFixedOffer(offerId) {
    const saveBtn = document.querySelector('.btn-save-fixed-offer');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="bi bi-arrow-repeat spin-save"></i> جاري الحفظ...'; }

    const checkedLocs = Array.from(document.querySelectorAll('.fixed-loc-cb:checked')).map((cb) => cb.value);
    const formData = new FormData();
    formData.append('title',       document.getElementById('fixed-offer-title').value.trim());
    formData.append('description', document.getElementById('fixed-offer-desc').value.trim());
    formData.append('btn_text',    document.getElementById('fixed-offer-btn-text').value.trim());
    formData.append('slug',        document.getElementById('fixed-offer-slug').value.trim());
    formData.append('location',    checkedLocs.join(','));

    const imgFile = document.getElementById('fixed-offer-img-input').files[0];
    if (imgFile) formData.append('img', imgFile);

    fixedOfferCurrentProducts.forEach((p, i) => {
        formData.append(`products[${i}][id]`,            p.id);
        formData.append(`products[${i}][discount]`,      p.discount);
        formData.append(`products[${i}][is_decoration]`, p.is_decoration);
    });

    try {
        const response = await fetch(`/api/offers/${offerId}`, { method: 'POST', body: formData });
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> حفظ التغييرات'; }
        if (response.ok) {
            showToast('✔ تم حفظ العرض الثابت بنجاح');
        } else {
            const err = await response.json();
            showToast(err.error || 'حدث خطأ أثناء الحفظ');
        }
    } catch {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-floppy-fill"></i> حفظ التغييرات'; }
        showToast('حدث خطأ في الاتصال بالسيرفر');
    }
}

// ===== Open Offer Edit Page =====
function openOfferEditPage(offerId) {
    window.location.href = `/dashboard-admin/edit-offer/${offerId}`;
}

// ===== Initialize on Page Load =====
document.addEventListener("DOMContentLoaded", function () {
    console.log("Categories & Offers page loaded successfully");

    // Load sliders from API
    loadSliders();

    // Display initial offers
    displaySavedOffers();
});
