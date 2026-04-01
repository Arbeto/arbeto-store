// ===== Global Variables =====
let offerImageData = null;
let offerImageFile = null;
let selectedProductsData = [];
let allProducts = window.allProducts || [];
let currentOffer = window.currentOffer || null;

// ===== Load Current Offer =====
function loadCurrentOffer() {
    if (!currentOffer) {
        alert("لم يتم العثور على العرض");
        window.location.href = "/dashboard-admin/categories-offers";
        return;
    }

    // Pre-fill form (Blade handles most of this, but we need products)
    offerImageData = currentOffer.img;

    // Load products
    selectedProductsData = currentOffer.products.map((p) => ({
        ...p,
        discount: p.pivot ? p.pivot.discount : 0,
    }));
    updateSelectedProducts();
}

// ===== Offer Image Upload =====
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
                const wrapper = document.getElementById("imgHoverWrapper");
                const placeholder = document.querySelector("#offerImageArea .upload-placeholder");
                preview.src = event.target.result;
                if (wrapper) wrapper.style.display = "inline-block";
                if (placeholder) placeholder.style.display = "none";
            };
            reader.readAsDataURL(file);
        }
    });

// ===== Product Modal Functions =====
const modal = document.getElementById("productModal");
const openModalBtn = document.getElementById("openProductModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

openModalBtn.addEventListener("click", function () {
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

    // Check if product already added
    if (selectedProductsData.find((p) => p.id === productId)) {
        alert("هذا المنتج مضاف بالفعل");
        return;
    }

    selectedProductsData.push({
        ...product,
        discount: discount,
    });

    updateSelectedProducts();
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

// ===== Update Offer =====
document
    .getElementById("updateOfferBtn")
    .addEventListener("click", async function () {
        const title = document.getElementById("offerTitle").value.trim();
        const urlPath = document.getElementById("offerUrlPath").value.trim();

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
        formData.append("slug", urlPath);
        if (offerImageFile) {
            formData.append("img", offerImageFile);
        }
        formData.append("location", locations.join(","));

        selectedProductsData.forEach((product, index) => {
            formData.append(`products[${index}][id]`, product.id);
            formData.append(`products[${index}][discount]`, product.discount);
        });

        try {
            const response = await fetch(`/api/offers/${currentOffer.id}`, {
                method: "POST", // Use POST with _method if needed, but we implemented updateOffers for any POST to {id}
                body: formData,
            });

            if (response.ok) {
                showToast("تم تحديث العرض بنجاح");
                setTimeout(() => {
                    window.location.href = "/dashboard-admin/categories-offers";
                }, 2000);
            } else {
                const errorData = await response.json();
                alert(errorData.error || "حدث خطأ أثناء التحديث");
            }
        } catch (error) {
            console.error("Error updating offer:", error);
            showToast("حدث خطأ في الاتصال بالسيرفر");
        }
    });

// ===== Delete Offer =====
document
    .getElementById("deleteOfferBtn")
    .addEventListener("click", async function () {
        if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
            try {
                const response = await fetch(`/api/offers/${currentOffer.id}`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    showToast("تم حذف العرض بنجاح");
                    setTimeout(() => {
                        window.location.href =
                            "/dashboard-admin/categories-offers";
                    }, 1500);
                } else {
                    showToast("حدث خطأ أثناء الحذف");
                }
            } catch (error) {
                console.error("Error deleting offer:", error);
                showToast("حدث خطأ في الاتصال بالسيرفر");
            }
        }
    });

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

// ===== Initialize on Page Load =====
document.addEventListener("DOMContentLoaded", function () {
    console.log("Edit Offer page loaded successfully");
    loadCurrentOffer();
});
