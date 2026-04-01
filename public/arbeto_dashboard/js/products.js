document.addEventListener("DOMContentLoaded", () => {
    // ============================================================
    // حالة عامة
    // ============================================================
    let currentViewType = "normal";
    let loadedItems = [];
    let currentEditId = null;
    let currentActiveImgSrc = null;
    let currentEditNewImgs = [];
    let deleteTargetId = null;
    let editSuggestedProduct = [];
    let editSuggestedSearch = [];
    let isDataShowing = false;

    // ============================================================
    // تعطيل الحقول عند تحميل الصفحة
    // ============================================================
    function disableFormFields(formPrefix) {
        const form = formPrefix === '' ? normalForm : boxForm;
        if (!form) return;

        // تعطيل جميع inputs و textareas و selects
        form.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea, select').forEach(el => {
            el.disabled = true;
            el.style.cursor = 'not-allowed';
        });

        // تعطيل أزرار إضافة الجمل والتلميحات (ما عدا زر المخزن)
        form.querySelectorAll('.add-small-btn, .submit-btn, .add-option-group-btn, .add-spec-row-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.5';
        });

        // تعطيل حاوية رفع الصور
        const imgContainer = form.querySelector('.image-upload-container');
        if (imgContainer) {
            imgContainer.style.pointerEvents = 'none';
            imgContainer.style.opacity = '0.6';
            imgContainer.style.cursor = 'not-allowed';
        }

        // التأكد من أن زر المخزن يبقى مفعلاً
        form.querySelectorAll('.inv-pick-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        });
    }

    function enableFormFields(formPrefix) {
        const form = formPrefix === '' ? normalForm : boxForm;
        if (!form) return;

        // تفعيل جميع inputs و textareas و selects
        form.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea, select').forEach(el => {
            el.disabled = false;
            el.style.cursor = '';
        });

        // تفعيل الأزرار
        form.querySelectorAll('.add-small-btn, .submit-btn, .add-option-group-btn, .add-spec-row-btn').forEach(btn => {
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.opacity = '1';
        });

        // تفعيل حاوية رفع الصور
        const imgContainer = form.querySelector('.image-upload-container');
        if (imgContainer) {
            imgContainer.style.pointerEvents = '';
            imgContainer.style.opacity = '1';
            imgContainer.style.cursor = 'pointer';
        }
    }

    function resetFormToDisabled(formPrefix) {
        disableFormFields(formPrefix);

        // مسح الاختيارات
        if (formPrefix === '') {
            invState.normal.ids = [];
            invState.normal.items = [];
            document.getElementById('normal-inv-tags').innerHTML = '';
            document.getElementById('normal-inventory_item_ids').value = '[]';
        } else if (formPrefix === 'box-') {
            invState.box.id = null;
            invState.box.item = null;
            document.getElementById('box-inv-tags').innerHTML = '';
            document.getElementById('box-inventory_item_id').value = '';

            // إعادة تعيين حقل الكمية
            const qtyEl = document.getElementById('box-productQuantity');
            const note  = document.getElementById('box-qty-note');
            if (qtyEl) {
                qtyEl.value = '1';
                qtyEl.readOnly = false;
                qtyEl.style.cursor = '';
                qtyEl.style.backgroundColor = '';
            }
            if (note) note.textContent = '';
        }
    }

    // ============================================================
    // حالة أداة اختيار المخزن
    // ============================================================
    let invPickerMode   = null; // 'single' | 'multi' | 'edit-single' | 'edit-multi'
    let invPickerForm   = null; // 'normal' | 'box' | 'edit'
    let invItemsCache   = { product: [], box: [] };   // قائمة عناصر المخزن حسب النوع (منفصلة للفلترة)
    let invPickerSel    = [];   // المعرّفات المحددة حالياً في المودال
    // حالة الاختيار الحالي لكل فورم
    const invState = {
        normal: { ids: [], items: [] },  // بوكس — متعدد
        box:    { id: null, item: null }, // منتج منفرد
        edit:   { ids: [], items: [], id: null, item: null },
    };

    const viewConfig = {
        normal: { apiType: "box", endpoint: "/api/products" },
        box: { apiType: "product", endpoint: "/api/products" },
        "new-box": { apiType: null, endpoint: "/api/categories" },
        "discount-code": { apiType: null, endpoint: "/api/discount-codes" },
    };

    const tagsData = {
        "": { suggested_product: [], suggested_search: [] },
        "box-": { suggested_product: [], suggested_search: [] },
    };

    // ============================================================
    // عناصر الصفحة
    // ============================================================
    const addToggleBtns = document.querySelectorAll(".toggle-btn");
    const formsContainer = document.getElementById("formsContainer");
    const normalForm = document.getElementById("normalForm");
    const boxForm = document.getElementById("boxForm");
    const newBoxForm = document.getElementById("newBoxForm");
    const viewDataBtn = document.getElementById("viewDataBtn");
    const viewDataBtnLabel = document.getElementById("viewDataBtnLabel");
    const dataSection = document.getElementById("dataSection");
    const itemsGrid = document.getElementById("itemsGrid");
    const editSection = document.getElementById("editSection");
    const deleteModal = document.getElementById("deleteModal");
    const discountCodeForm = document.getElementById("discountCodeForm");

    // تعطيل الحقول عند تحميل الصفحة
    disableFormFields(''); // normalForm (بوكس)
    disableFormFields('box-'); // boxForm (منتج)

    // ============================================================
    // 1. أزرار تبديل نوع الإضافة
    // ============================================================
    addToggleBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const newType = btn.dataset.type;
            // لو نوع مختلف أو البيانات ظاهرة — أغلق البيانات وأرجع الفورم
            if (isDataShowing || newType !== currentViewType) {
                if (isDataShowing) {
                    animateHideData(() => {
                        showFormsContainer();
                    });
                    isDataShowing = false;
                    viewDataBtn.innerHTML =
                        '<i class="bi bi-eye"></i> <span id="viewDataBtnLabel">عرض البيانات</span>';
                }
            }
            addToggleBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentViewType = newType;
            handleFormSwitch(currentViewType);
        });
    });

    function handleFormSwitch(type) {
        formsContainer.classList.remove("show-all");
        normalForm.style.display = "none";
        boxForm.style.display = "none";
        if (newBoxForm) newBoxForm.style.display = "none";
        if (discountCodeForm) discountCodeForm.style.display = "none";
        setTimeout(() => {
            if (type === "normal") normalForm.style.display = "block";
            else if (type === "box") boxForm.style.display = "block";
            else if (type === "new-box" && newBoxForm)
                newBoxForm.style.display = "block";
            else if (type === "discount-code" && discountCodeForm)
                discountCodeForm.style.display = "block";
        }, 10);
    }

    // ============================================================
    // 2. زر عرض / إخفاء البيانات (Toggle)
    // ============================================================
    viewDataBtn.addEventListener("click", async () => {
        if (isDataShowing) {
            // ← إغلاق البيانات وإعادة الفورم
            animateHideData(() => {
                showFormsContainer();
            });
            isDataShowing = false;
            viewDataBtn.innerHTML =
                '<i class="bi bi-eye"></i> <span id="viewDataBtnLabel">عرض البيانات</span>';
            return;
        }

        // ← إخفاء الفورم وجلب البيانات
        await animateHideForm();
        await fetchAndShowData();
    });

    function animateHideData(callback) {
        dataSection.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        dataSection.style.opacity = "0";
        dataSection.style.transform = "translateY(12px)";
        setTimeout(() => {
            dataSection.style.display = "none";
            dataSection.style.transform = "";
            itemsGrid.innerHTML = "";
            editSection.style.display = "none";
            if (callback) callback();
        }, 300);
    }

    function animateHideForm() {
        return new Promise((resolve) => {
            formsContainer.style.transition =
                "opacity 0.3s ease, transform 0.3s ease";
            formsContainer.style.opacity = "0";
            formsContainer.style.transform = "translateY(-12px)";
            setTimeout(() => {
                formsContainer.style.display = "none";
                resolve();
            }, 310);
        });
    }

    function showFormsContainer() {
        formsContainer.style.display = "block";
        formsContainer.style.opacity = "0";
        formsContainer.style.transform = "translateY(-12px)";
        setTimeout(() => {
            formsContainer.style.transition =
                "opacity 0.35s ease, transform 0.35s ease";
            formsContainer.style.opacity = "1";
            formsContainer.style.transform = "translateY(0)";
        }, 10);
    }

    async function fetchAndShowData() {
        const cfg = viewConfig[currentViewType];
        if (!cfg) return;

        viewDataBtn.disabled = true;
        viewDataBtn.innerHTML =
            '<i class="bi bi-hourglass-split"></i> جاري التحميل...';

        try {
            const res = await fetch(cfg.endpoint, {
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                },
            });
            const data = await res.json();

            loadedItems = cfg.apiType
                ? data.filter((item) => item.type === cfg.apiType)
                : data;

            editSection.style.display = "none";
            renderGrid(loadedItems);
            dataSection.style.display = "block";
            dataSection.style.opacity = "0";
            dataSection.style.transform = "translateY(14px)";
            setTimeout(() => {
                dataSection.style.transition =
                    "opacity 0.4s ease, transform 0.4s ease";
                dataSection.style.opacity = "1";
                dataSection.style.transform = "translateY(0)";
            }, 10);
            dataSection.scrollIntoView({ behavior: "smooth", block: "start" });
            isDataShowing = true;
        } catch (err) {
            showToast("❌ خطأ في تحميل البيانات: " + err.message, "error");
            showFormsContainer();
        } finally {
            viewDataBtn.disabled = false;
            viewDataBtn.innerHTML =
                '<i class="bi bi-eye-slash"></i> <span id="viewDataBtnLabel">إخفاء البيانات</span>';
        }
    }

    // ============================================================
    // 3. عرض الشبكة (Grid)
    // ============================================================
    function renderGrid(items) {
        itemsGrid.innerHTML = "";
        if (currentViewType === "discount-code") {
            renderDiscountCodesTable(items);
            return;
        }
        if (!items || items.length === 0) {
            itemsGrid.innerHTML = `<div class="no-data-msg"><i class="bi bi-inbox"></i><p>لا توجد بيانات بعد</p></div>`;
            return;
        }
        items.forEach((item, i) => {
            const card = buildCard(item);
            itemsGrid.appendChild(card);
            setTimeout(() => card.classList.add("card-visible"), 40 * i + 20);
        });
    }

    function getCardImgSrc(item) {
        if (item._activeImgSrc) return item._activeImgSrc;
        if (item.img) {
            const arr = Array.isArray(item.img) ? item.img : [item.img];
            if (arr.length > 0)
                return arr[0].startsWith("http") ? arr[0] : "/" + arr[0];
        }
        return "https://placehold.co/200x160?text=No+Image";
    }

    function buildCard(item) {
        const card = document.createElement("div");
        card.className = "product-card";
        card.dataset.id = item.id;

        card.innerHTML = `
      <div class="product-card-img">
        <img src="${getCardImgSrc(item)}" alt="${item.name || ""}"
          onerror="this.src='https://placehold.co/200x160?text=No+Image'">
      </div>
      <div class="product-card-body">
        <div class="product-card-name">${item.name || "بدون اسم"}</div>
        <button class="edit-card-btn" data-id="${item.id}">
          <i class="bi bi-pencil"></i> تعديل
        </button>
      </div>
    `;
        card.querySelector(".edit-card-btn").addEventListener("click", () =>
            openEditForm(item),
        );
        return card;
    }

    // ============================================================
    // 4. فتح نموذج التعديل بانيميشن
    // ============================================================
    function openEditForm(item) {
        const cards = itemsGrid.querySelectorAll(".product-card");
        cards.forEach((c) => {
            if (c.dataset.id != item.id) {
                c.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                c.style.opacity = "0";
                c.style.transform = "scale(0.82)";
            } else {
                c.style.transition =
                    "transform 0.45s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s";
                c.style.transform = "scale(1.06)";
                c.style.boxShadow = "0 14px 40px rgba(0,0,0,0.18)";
            }
        });

        setTimeout(() => {
            itemsGrid.style.display = "none";
            fillEditForm(item);
            editSection.style.display = "block";
            editSection.style.opacity = "0";
            editSection.style.transform = "translateY(32px)";
            setTimeout(() => {
                editSection.style.transition =
                    "opacity 0.5s ease, transform 0.5s ease";
                editSection.style.opacity = "1";
                editSection.style.transform = "translateY(0)";
            }, 20);
            editSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 460);
    }

    // ============================================================
    // 5. تعبئة نموذج التعديل
    // ============================================================
    function fillEditForm(item) {
        currentEditId = item.id;
        currentEditNewImgs = [];
        currentActiveImgSrc = null;

        document.getElementById("editItemId").value = item.id;
        document.getElementById("editItemType").value = currentViewType;

        const isProductOrBox = currentViewType !== "new-box";
        const isProduct = currentViewType === "box";

        // إظهار/إخفاء الحقول
        document.querySelectorAll(".product-field").forEach((el) => {
            el.style.display = isProductOrBox ? "" : "none";
        });
        document.getElementById("edit-type_product-wrap").style.display =
            isProduct ? "" : "none";
        document.getElementById("edit-category-wrap").style.display = isProduct
            ? ""
            : "none";

        // العنوان والحقول الأساسية
        document.getElementById("editFormTitle").textContent =
            currentViewType === "new-box"
                ? `تعديل الفئة: ${item.name}`
                : `تعديل: ${item.name}`;
        document.getElementById("edit-name").value = item.name || "";
        document.getElementById("edit-description").value =
            item.description || "";

        if (isProductOrBox) {
            document.getElementById("edit-quantity").value =
                item.quantity ?? "";
            document.getElementById("edit-discount").value = item.discount ?? 0;
            document.getElementById("edit-price_sell").value =
                item.price_sell ?? "";

            // ← السعر الإجمالي: احسبه وأضف listeners
            setupEditPriceCalc();

            // ← تعبئة ربط المخزن في التعديل
            const isBox = currentViewType === 'normal'; // box type = 'normal' toggle
            const isSingleProduct = currentViewType === 'box';
            const editInvWrap = document.getElementById('edit-inv-wrap');
            const editInvBtnSingle = document.getElementById('edit-inv-pick-btn-single');
            const editInvBtnMulti  = document.getElementById('edit-inv-pick-btn-multi');
            if (editInvWrap) editInvWrap.style.display = '';
            if (editInvBtnSingle) editInvBtnSingle.style.display = isSingleProduct ? '' : 'none';
            if (editInvBtnMulti)  editInvBtnMulti.style.display  = isBox ? '' : 'none';

            // إعادة تعيين حالة التعديل
            invState.edit.id    = item.inventory_item_id  || null;
            invState.edit.item  = item.inventory_item      || null;
            invState.edit.ids   = Array.isArray(item.inventory_item_ids) ? [...item.inventory_item_ids] : [];
            invState.edit.items = Array.isArray(item.inventory_items)     ? [...item.inventory_items]     : [];

            if (isSingleProduct) {
                const tags = invState.edit.item ? [invState.edit.item] : [];
                renderInvTags('edit-inv-tags', tags, 'edit-single');
            } else {
                renderInvTags('edit-inv-tags', invState.edit.items, 'edit-multi');
            }
        }
        if (isProduct) {
            document.getElementById("edit-type_product").value =
                item.type_product || "";
            document.getElementById("edit-category_id").value =
                item.category_id || "";
        }

        // ← معرض الصور
        fillImagesGallery(item);

        // ← العلامات
        editSuggestedProduct = Array.isArray(item.suggested_product)
            ? [...item.suggested_product]
            : [];
        editSuggestedSearch = Array.isArray(item.suggested_search)
            ? [...item.suggested_search]
            : [];
        renderEditTags("edit-sentenceContainer", editSuggestedProduct);
        renderEditTags("edit-hintContainer", editSuggestedSearch);
        setupEditTagInput(
            "edit-sentenceInput",
            "edit-addSentenceBtn",
            "edit-sentenceContainer",
            editSuggestedProduct,
        );
        setupEditTagInput(
            "edit-hintInput",
            "edit-addHintBtn",
            "edit-hintContainer",
            editSuggestedSearch,
        );

        // ← Slug (فقط للفئات)
        const editSlugWrap = document.getElementById("edit-slug-wrap");
        if (editSlugWrap) editSlugWrap.style.display = (currentViewType === "new-box") ? "" : "none";
        if (currentViewType === "new-box") {
            const slugEl = document.getElementById("edit-slug");
            if (slugEl) slugEl.value = item.slug || "";
        }

        // ← خيارات ومواصفات (فقط للمنتجات)
        if (isProductOrBox) {
            fillEditOptionGroups(item);
            fillEditSpecs(item);
        } else {
            const oc = document.getElementById("edit-optionGroupsContainer");
            const sb = document.getElementById("edit-specsTableBody");
            if (oc) oc.innerHTML = "";
            if (sb) sb.innerHTML = "";
        }
    }

    // ============================================================
    // حساب السعر الإجمالي في فورم التعديل
    // ============================================================
    function setupEditPriceCalc() {
        const sellEl = document.getElementById("edit-price_sell");
        const discEl = document.getElementById("edit-discount");
        const totalEl = document.getElementById("edit-totalPrice");
        if (!sellEl || !discEl || !totalEl) return;

        const calc = () => {
            const sell = parseFloat(sellEl.value) || 0;
            const disc = parseFloat(discEl.value) || 0;
            totalEl.value = Math.max(0, sell - (sell * disc) / 100).toFixed(2);
        };

        // استبدل العناصر لمسح الـ listeners السابقة
        const newSell = sellEl.cloneNode(true);
        const newDisc = discEl.cloneNode(true);
        sellEl.parentNode.replaceChild(newSell, sellEl);
        discEl.parentNode.replaceChild(newDisc, discEl);

        newSell.addEventListener("input", calc);
        newDisc.addEventListener("input", calc);
        calc(); // احسب فوراً بناءً على القيم الموجودة
    }

    // ============================================================
    // معرض الصور في التعديل
    // ============================================================
    function fillImagesGallery(item) {
        const gallery = document.getElementById("edit-imagesGallery");
        const newImgInput = document.getElementById("edit-img");
        if (!gallery) return;

        gallery.innerHTML = "";
        currentActiveImgSrc = null;
        currentEditNewImgs = []; // قائمة الملفات الجديدة

        // مصفوفة لتتبع الصور الحالية (الموجودة مسبقاً)
        let existingImgs = item.img
            ? Array.isArray(item.img)
                ? [...item.img]
                : [item.img]
            : [];

        // دالة لإضافة صورة للمعرض (سواء قديمة أو جديدة)
        const addThumbToGallery = (src, isNew, fileObj = null) => {
            const thumb = document.createElement("div");
            thumb.className = "edit-img-thumb" + (isNew ? " new-thumb" : "");
            if (!currentActiveImgSrc) thumb.classList.add("active");
            thumb.dataset.src = src;

            thumb.innerHTML = `
                <img src="${src}" onerror="this.src='https://placehold.co/80x80?text=X'">
                <div class="thumb-options-wrap">
                    <button type="button" class="thumb-options-btn"><i class="bi bi-x"></i></button>
                    <div class="thumb-dropdown">
                        <button type="button" class="thumb-dropdown-btn delete-img-trigger">
                            <i class="bi bi-trash"></i> حذف
                        </button>
                    </div>
                </div>
                ${!currentActiveImgSrc ? '<div class="thumb-badge"><i class="bi bi-check-circle-fill"></i></div>' : ""}
            `;

            if (!currentActiveImgSrc) currentActiveImgSrc = src;

            // خيارات الحذف (Dropdown)
            const optionsBtn = thumb.querySelector(".thumb-options-btn");
            const dropdown = thumb.querySelector(".thumb-dropdown");
            const deleteBtn = thumb.querySelector(".delete-img-trigger");

            optionsBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                // إغلاق أي دروب داون مفتوح آخر
                document
                    .querySelectorAll(".thumb-dropdown.active")
                    .forEach((d) => {
                        if (d !== dropdown) d.classList.remove("active");
                    });
                dropdown.classList.toggle("active");
            });

            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (isNew) {
                    const idx = currentEditNewImgs.indexOf(fileObj);
                    if (idx > -1) currentEditNewImgs.splice(idx, 1);
                } else {
                    const idx = existingImgs.indexOf(src.replace(/^\//, ""));
                    if (idx > -1) existingImgs.splice(idx, 1);
                    // يمكنك أيضاً تتبع الصور المحذوفة في مصفوفة منفصلة لو لزم الأمر للـ API
                }
                thumb.remove();
                if (thumb.classList.contains("active")) {
                    const firstThumb = gallery.querySelector(".edit-img-thumb");
                    if (firstThumb)
                        setActiveThumb(
                            gallery,
                            firstThumb,
                            firstThumb.dataset.src,
                            item,
                        );
                    else currentActiveImgSrc = null;
                }
                // تحديث بيانات الـ item محلياً لو أردت
                item.img = [...existingImgs];
            });

            thumb.addEventListener("click", () =>
                setActiveThumb(gallery, thumb, src, item),
            );
            gallery.appendChild(thumb);
        };

        // عرض الصور القديمة
        existingImgs.forEach((imgPath, index) => {
            const src = imgPath.startsWith("http") ? imgPath : "/" + imgPath;
            addThumbToGallery(src, false);

            // تحديد الصورة الرئيسية بناءً على primary_image_index
            const primaryIndex = item.primary_image_index || 0;
            if (index === primaryIndex && !currentActiveImgSrc) {
                const thumb = gallery.lastElementChild;
                if (thumb) {
                    setTimeout(() => setActiveThumb(gallery, thumb, src, item), 10);
                }
            }
        });

        // رفع صورة جديدة - دمجها مع الحالي
        const freshInput = newImgInput.cloneNode(true);
        newImgInput.parentNode.replaceChild(freshInput, newImgInput);

        freshInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            files.forEach((file) => {
                if (currentEditNewImgs.length + existingImgs.length >= 8) {
                    showToast("أقصى حد 8 صور", "error");
                    return;
                }
                currentEditNewImgs.push(file);
                const reader = new FileReader();
                reader.onload = (ev) => {
                    addThumbToGallery(ev.target.result, true, file);
                };
                reader.readAsDataURL(file);
            });
            freshInput.value = "";
        });

        // إغلاق الدروب داون عند الضغط خارجاً
        document.addEventListener(
            "click",
            () => {
                document
                    .querySelectorAll(".thumb-dropdown.active")
                    .forEach((d) => d.classList.remove("active"));
            },
            { once: false },
        );
    }

    function setActiveThumb(gallery, clickedThumb, src, item) {
        gallery.querySelectorAll(".edit-img-thumb").forEach((t) => {
            t.classList.remove("active");
            t.querySelector(".thumb-badge")?.remove();
        });
        clickedThumb.classList.add("active");
        const badge = document.createElement("div");
        badge.className = "thumb-badge";
        badge.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
        clickedThumb.appendChild(badge);
        currentActiveImgSrc = src;

        // تحديث الصورة في الـ card مباشرةً
        item._activeImgSrc = src;
        const cardImg = itemsGrid?.querySelector(
            `.product-card[data-id="${item.id}"] img`,
        );
        // (الـ grid مخفي لكن نحدث الـ data للما يرجع)
    }

    // ============================================================
    // 6. حفظ التعديلات
    // ============================================================
    document
        .getElementById("editForm")
        .addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("editItemId").value;
            const type = document.getElementById("editItemType").value;
            const isProductOrBox = type !== "new-box";

            const saveBtn = e.target.querySelector(".submit-btn");
            saveBtn.disabled = true;
            saveBtn.innerHTML =
                '<i class="bi bi-hourglass-split"></i> جاري الحفظ...';

            try {
                const formData = new FormData();
                formData.append(
                    "name",
                    document.getElementById("edit-name").value,
                );
                formData.append(
                    "description",
                    document.getElementById("edit-description").value,
                );

                // الاحتفاظ بـ added_by الأصلي (في التعديل لا نغيره)
                // إذا أردت تغيير البائع، فك التعليق عن السطر التالي:
                // formData.append("added_by", "{{ auth()->id() }}");

                if (isProductOrBox) {
                    formData.append(
                        "quantity",
                        document.getElementById("edit-quantity").value,
                    );
                    formData.append(
                        "discount",
                        document.getElementById("edit-discount").value,
                    );
                    formData.append(
                        "price_sell",
                        document.getElementById("edit-price_sell").value,
                    );
                    editSuggestedProduct.forEach((v, i) =>
                        formData.append(`suggested_product[${i}]`, v),
                    );
                    editSuggestedSearch.forEach((v, i) =>
                        formData.append(`suggested_search[${i}]`, v),
                    );

                    // ← ربط المخزن في التعديل
                    if (type === 'box') {
                        // منتج منفرد
                        formData.append('inventory_item_id', invState.edit.id ?? '');
                    } else {
                        // بوكس
                        formData.append('inventory_item_ids_json', JSON.stringify(invState.edit.ids));
                    }

                    // ← خيارات ومواصفات
                    const editOptGroups = collectEditOptionGroupsData();
                    formData.append("option_groups_json", JSON.stringify(editOptGroups));
                    appendEditOptionImages(formData);
                    const editSpecs = collectEditSpecsData();
                    formData.append("specs_json", JSON.stringify(editSpecs));
                }

                // ← Slug للفئة
                if (type === "new-box") {
                    const slugEl = document.getElementById("edit-slug");
                    if (slugEl && slugEl.value.trim()) formData.append("slug", slugEl.value.trim());
                }
                if (type === "box") {
                    formData.append(
                        "type_product",
                        document.getElementById("edit-type_product").value,
                    );
                    formData.append(
                        "category_id",
                        document.getElementById("edit-category_id").value,
                    );
                }

                // التعامل مع قائمة الصور النهائية (القديمة المتبقية + الجديدة)
                const itemIdx = loadedItems.findIndex((it) => it.id == id);
                const currentItem = loadedItems[itemIdx];
                if (currentItem && currentItem.img) {
                    const finalExistingImgs = Array.isArray(currentItem.img)
                        ? currentItem.img
                        : [currentItem.img];
                    finalExistingImgs.forEach((path, i) => {
                        formData.append(`existing_imgs[${i}]`, path);
                    });
                }

                // الصور الجديدة المرفوعة
                currentEditNewImgs.forEach((file, i) =>
                    formData.append(`img[${i}]`, file),
                );

                // تحديد رقم الصورة الرئيسية
                const gallery = document.getElementById("edit-imagesGallery");
                if (gallery) {
                    const allThumbs = Array.from(gallery.querySelectorAll('.edit-img-thumb'));
                    const activeThumb = gallery.querySelector('.edit-img-thumb.active');
                    const primaryIndex = activeThumb ? allThumbs.indexOf(activeThumb) : 0;
                    formData.append('primary_image_index', primaryIndex);
                }

                // تحديد أي صورة ستكون الرئيسية (لو تم تغييرها) - للتوافق مع النظام القديم
                if (currentActiveImgSrc) {
                    formData.append("primary_img", currentActiveImgSrc);
                }

                const endpoint =
                    type === "new-box"
                        ? `/api/categories/${id}`
                        : `/api/products/${id}`;

                const res = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN": getCsrfToken(),
                        Accept: "application/json",
                    },
                    body: formData,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "فشل التحديث");

                showToast("✅ تم حفظ التغييرات بنجاح!", "success");

                // مسح cache المخزون لإعادة جلب القائمة المحدثة
                invItemsCache = { product: [], box: [] };

                const idx = loadedItems.findIndex((it) => it.id == id);
                if (idx > -1)
                    loadedItems[idx] = { ...loadedItems[idx], ...data };
                backToGrid();
            } catch (err) {
                showToast("❌ خطأ: " + err.message, "error");
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerHTML =
                    '<i class="bi bi-check-circle"></i> حفظ التغييرات';
            }
        });

    // ============================================================
    // 7. الرجوع للـ Grid
    // ============================================================
    document
        .getElementById("backToGridBtn")
        .addEventListener("click", backToGrid);

    function backToGrid() {
        editSection.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        editSection.style.opacity = "0";
        editSection.style.transform = "translateY(18px)";
        setTimeout(() => {
            editSection.style.display = "none";
            itemsGrid.style.display = "";
            renderGrid(loadedItems);
        }, 300);
    }

    // ============================================================
    // 8. حذف — مودال التأكيد
    // ============================================================
    document.getElementById("deleteItemBtn").addEventListener("click", () => {
        deleteTargetId = currentEditId;
        deleteModal.style.display = "flex";
        const box = deleteModal.querySelector(".delete-modal-box");
        box.style.animation =
            "modalPopIn 0.35s cubic-bezier(.34,1.56,.64,1) forwards";
    });

    document
        .getElementById("cancelDeleteBtn")
        .addEventListener("click", closeDeleteModal);
    deleteModal.addEventListener("click", (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    function closeDeleteModal() {
        const box = deleteModal.querySelector(".delete-modal-box");
        box.style.animation = "modalPopOut 0.2s ease forwards";
        setTimeout(() => {
            deleteModal.style.display = "none";
        }, 210);
    }

    document
        .getElementById("confirmDeleteBtn")
        .addEventListener("click", async () => {
            if (!deleteTargetId) return;
            const btn = document.getElementById("confirmDeleteBtn");
            btn.disabled = true;
            btn.innerHTML =
                '<i class="bi bi-hourglass-split"></i> جاري الحذف...';

            try {
                const type = document.getElementById("editItemType").value;
                const endpoint =
                    type === "new-box"
                        ? `/api/categories/${deleteTargetId}`
                        : `/api/products/${deleteTargetId}`;

                const res = await fetch(endpoint, {
                    method: "DELETE",
                    headers: {
                        "X-CSRF-TOKEN": getCsrfToken(),
                        Accept: "application/json",
                    },
                });
                if (!res.ok) {
                    const d = await res.json();
                    throw new Error(d.message || "فشل الحذف");
                }

                showToast("🗑️ تم حذف العنصر بنجاح", "success");

                // مسح cache المخزون لإعادة جلب القائمة المحدثة (العنصر أصبح متاحاً)
                invItemsCache = { product: [], box: [] };

                loadedItems = loadedItems.filter(
                    (it) => it.id != deleteTargetId,
                );
                closeDeleteModal();

                editSection.style.transition =
                    "opacity 0.3s ease, transform 0.35s ease";
                editSection.style.opacity = "0";
                editSection.style.transform = "scale(0.9)";
                setTimeout(() => {
                    editSection.style.display = "none";
                    itemsGrid.style.display = "";
                    renderGrid(loadedItems);
                }, 360);
            } catch (err) {
                showToast("❌ خطأ: " + err.message, "error");
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-trash3"></i> تأكيد الحذف';
            }
        });

    // ============================================================
    // 9. نماذج الإضافة (Add forms)
    // ============================================================
    initFormLogic("");
    initFormLogic("box-");
    initCategoryForm();

    function initFormLogic(prefix) {
        const imageInput = document.getElementById(`${prefix}productImages`);
        const imagePreviewContainer = document.getElementById(
            `${prefix}imagePreviewContainer`,
        );
        let uploadedImages = [];

        if (imageInput && imagePreviewContainer) {
            imageInput.addEventListener("change", (e) => {
                const files = Array.from(e.target.files);
                if (uploadedImages.length + files.length > 8) {
                    showToast("أقصى حد للصور هو 8 صور فقط", "error");
                    imageInput.value = "";
                    return;
                }
                files.forEach((file) => {
                    if (uploadedImages.length >= 8) return;
                    uploadedImages.push(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const item = document.createElement("div");
                        item.classList.add("preview-item");
                        // إضافة صورة
                        const img = document.createElement("img");
                        img.src = ev.target.result;
                        // إضافة زر الحذف
                        const rmBtn = document.createElement("button");
                        rmBtn.classList.add("remove-btn");
                        rmBtn.innerHTML = "×";
                        rmBtn.type = "button";
                        rmBtn.onclick = () => {
                            const idx = uploadedImages.indexOf(file);
                            if (idx > -1) uploadedImages.splice(idx, 1);

                            // إذا كانت الصورة المحذوفة هي الرئيسية، اختر الأولى
                            if (item.classList.contains('primary-image') && imagePreviewContainer.children.length > 1) {
                                const firstImage = imagePreviewContainer.querySelector('.preview-item:not([style*="display: none"])');
                                if (firstImage && firstImage !== item) {
                                    firstImage.classList.add('primary-image');
                                }
                            }

                            item.style.animation = "fadeOut 0.3s forwards";
                            setTimeout(() => item.remove(), 300);
                        };

                        // إضافة زر جعل الصورة رئيسية
                        const primaryBtn = document.createElement("button");
                        primaryBtn.classList.add("primary-btn");
                        primaryBtn.innerHTML = "★";
                        primaryBtn.type = "button";
                        primaryBtn.title = "جعل هذه الصورة الرئيسية";
                        primaryBtn.onclick = () => {
                            // إزالة الكلاس من جميع الصور
                            imagePreviewContainer.querySelectorAll('.preview-item').forEach(prevItem => {
                                prevItem.classList.remove('primary-image');
                            });
                            // إضافة الكلاس للصورة المختارة
                            item.classList.add('primary-image');
                        };

                        // إذا كانت أول صورة، اجعلها رئيسية
                        if (uploadedImages.length === 1) {
                            item.classList.add('primary-image');
                        }

                        item.appendChild(img);
                        item.appendChild(rmBtn);
                        item.appendChild(primaryBtn);
                        imagePreviewContainer.appendChild(item);
                    };
                    reader.readAsDataURL(file);
                });
                imageInput.value = "";
            });

            // دالة للحصول على رقم الصورة الرئيسية
            window[`get${prefix}PrimaryImageIndex`] = () => {
                const items = Array.from(imagePreviewContainer.children);
                const primaryItem = imagePreviewContainer.querySelector('.preview-item.primary-image');
                return primaryItem ? items.indexOf(primaryItem) : 0;
            };

            // دالة للحصول على الصور المرفوعة
            window[`get${prefix}UploadedImages`] = () => uploadedImages;
        }

        // حساب الأسعار
        const priceInput = document.getElementById(`${prefix}priceInput`);
        const discountInput = document.getElementById(`${prefix}discountInput`);
        const totalInput = document.getElementById(`${prefix}totalPriceInput`);
        if (priceInput && discountInput && totalInput) {
            const calcT = () => {
                const p = parseFloat(priceInput.value) || 0;
                const d = parseFloat(discountInput.value) || 0;
                totalInput.value = Math.max(0, p - (p * d) / 100).toFixed(2);
            };
            const calcD = () => {
                const p = parseFloat(priceInput.value) || 0;
                const t = parseFloat(totalInput.value) || 0;
                if (p > 0)
                    discountInput.value = Math.max(
                        0,
                        ((p - t) / p) * 100,
                    ).toFixed(1);
            };
            priceInput.addEventListener("input", calcT);
            discountInput.addEventListener("input", calcT);
            totalInput.addEventListener("input", calcD);
            calcT();
        }

        // العلامات
        setupTagInput(
            `${prefix}sentenceInput`,
            `${prefix}addSentenceBtn`,
            `${prefix}sentencePreviewContainer`,
            tagsData[prefix].suggested_product,
        );
        setupTagInput(
            `${prefix}hintInput`,
            `${prefix}addHintBtn`,
            `${prefix}hintPreviewContainer`,
            tagsData[prefix].suggested_search,
        );

        // إرسال الفورم
        const formId = prefix ? "boxForm" : "normalForm";
        const form = document.querySelector(`#${formId} .add-new-product`);
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (uploadedImages.length === 0) {
                showToast("الرجاء رفع صورة واحدة على الأقل", "error");
                return;
            }

            const submitBtn = form.querySelector(".submit-btn");
            submitBtn.disabled = true;
            submitBtn.innerHTML =
                '<i class="bi bi-hourglass-split"></i> جاري الحفظ...';

            try {
                const fd = new FormData();
                [
                    "type",
                    "added_by",
                    "name",
                    "type_product",
                    "description",
                    "quantity",
                    "price_sell",
                    "discount",
                    "category_id",
                ].forEach((f) => {
                    const el = form.querySelector(`[name="${f}"]`);
                    if (el && el.value !== "") fd.append(f, el.value);
                });
                uploadedImages.forEach((file, i) =>
                    fd.append(`img[${i}]`, file),
                );

                // إضافة رقم الصورة الرئيسية
                const primaryIndex = window[`get${prefix}PrimaryImageIndex`] ? window[`get${prefix}PrimaryImageIndex`]() : 0;
                fd.append('primary_image_index', primaryIndex);
                tagsData[prefix].suggested_product.forEach((v, i) =>
                    fd.append(`suggested_product[${i}]`, v),
                );
                tagsData[prefix].suggested_search.forEach((v, i) =>
                    fd.append(`suggested_search[${i}]`, v),
                );

                // ربط المخزن
                if (prefix === 'box-') {
                    // منتج منفرد
                    const invId = invState.box.id;
                    if (invId) fd.append('inventory_item_id', invId);
                } else {
                    // بوكس — متعدد
                    const invIds = invState.normal.ids;
                    fd.append('inventory_item_ids_json', JSON.stringify(invIds));
                }

                // الخيارات والمواصفات
                const optGroups = collectOptionGroupsData(prefix);
                fd.append("option_groups_json", JSON.stringify(optGroups));
                appendOptionImages(fd, prefix);

                const specs = collectSpecsData(prefix);
                fd.append("specs_json", JSON.stringify(specs));

                const res = await fetch("/api/products", {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN": getCsrfToken(),
                        Accept: "application/json",
                    },
                    body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "فشل الحفظ");

                showToast("✅ تم حفظ المنتج بنجاح!", "success");

                // مسح cache المخزون لإعادة جلب القائمة المحدثة
                invItemsCache = { product: [], box: [] };

                form.reset();
                if (imagePreviewContainer) imagePreviewContainer.innerHTML = "";
                uploadedImages = [];
                tagsData[prefix].suggested_product.length = 0;
                tagsData[prefix].suggested_search.length = 0;
                clearTagContainers(prefix);
                // مسح الخيارات والمواصفات
                const ogCont = document.getElementById(`${prefix}optionGroupsContainer`);
                if (ogCont) ogCont.innerHTML = "";
                const sbTbody = document.getElementById(`${prefix}specsTableBody`);
                if (sbTbody) sbTbody.innerHTML = "";

                // إعادة تعطيل النموذج
                resetFormToDisabled(prefix);
            } catch (err) {
                showToast("❌ خطأ: " + err.message, "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML =
                    '<i class="bi bi-check-circle"></i> حفظ المنتج';
            }
        });
    }

    // ============================================================
    // 10. نموذج إضافة الفئة
    // ============================================================
    function initCategoryForm() {
        const imageInput = document.getElementById("cat-productImage");
        const imagePreview = document.getElementById(
            "cat-imagePreviewContainer",
        );
        let categoryImage = null;

        if (imageInput && imagePreview) {
            imageInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;
                categoryImage = file;
                imagePreview.innerHTML = "";
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const item = document.createElement("div");
                    item.classList.add("preview-item");
                    const img = document.createElement("img");
                    img.src = ev.target.result;
                    const rmBtn = document.createElement("button");
                    rmBtn.classList.add("remove-btn");
                    rmBtn.innerHTML = "×";
                    rmBtn.type = "button";
                    rmBtn.onclick = () => {
                        categoryImage = null;
                        imagePreview.innerHTML = "";
                        imageInput.value = "";
                    };
                    item.appendChild(img);
                    item.appendChild(rmBtn);
                    imagePreview.appendChild(item);
                };
                reader.readAsDataURL(file);
                imageInput.value = "";
            });
        }

        // Auto-generate slug from name
        const nameInput = document.getElementById("new-box-productName");
        const slugInput = document.getElementById("new-box-slug");
        if (nameInput && slugInput) {
            nameInput.addEventListener("input", () => {
                if (!slugInput._userEdited) {
                    slugInput.value = slugify(nameInput.value);
                }
            });
            slugInput.addEventListener("input", () => {
                slugInput._userEdited = slugInput.value.trim() !== "";
            });
        }

        const form = document.querySelector("#newBoxForm .add-new-product");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector(".submit-btn");
            submitBtn.disabled = true;
            submitBtn.innerHTML =
                '<i class="bi bi-hourglass-split"></i> جاري الحفظ...';

            try {
                const nameEl = form.querySelector('[name="name"]');
                const descEl = form.querySelector('[name="description"]');
                const slugEl = document.getElementById("new-box-slug");
                if (!nameEl?.value.trim()) {
                    showToast("الرجاء إدخال اسم الفئة", "error");
                    return;
                }

                const fd = new FormData();
                fd.append("name", nameEl.value.trim());
                if (descEl?.value.trim())
                    fd.append("description", descEl.value.trim());
                if (categoryImage) fd.append("img", categoryImage);
                if (slugEl?.value.trim()) fd.append("slug", slugEl.value.trim());

                const res = await fetch("/api/categories", {
                    method: "POST",
                    headers: {
                        "X-CSRF-TOKEN": getCsrfToken(),
                        Accept: "application/json",
                    },
                    body: fd,
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "فشل الحفظ");

                showToast("✅ تم حفظ الفئة بنجاح!", "success");
                form.reset();
                if (imagePreview) imagePreview.innerHTML = "";
                categoryImage = null;
                if (slugInput) slugInput._userEdited = false;
                addCategoryOption(data);
            } catch (err) {
                showToast("❌ خطأ: " + err.message, "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML =
                    '<i class="bi bi-check-circle"></i> حفظ الفئة';
            }
        });
    }

    // ============================================================
    // مساعدات مشتركة
    // ============================================================
    function addCategoryOption(category) {
        document
            .querySelectorAll('[name="category_id"], #edit-category_id')
            .forEach((select) => {
                const opt = document.createElement("option");
                opt.value = category.id;
                opt.textContent = category.name;
                if (category.slug) opt.dataset.slug = category.slug;
                select.appendChild(opt);
            });
    }

    function renderEditTags(containerId, arr) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = "";
        arr.forEach((text) => addTagToContainer(container, text, arr));
    }

    function addTagToContainer(container, text, arr) {
        const tagItem = document.createElement("div");
        tagItem.className = "tag-item";
        const span = document.createElement("span");
        span.textContent = text;
        const rmBtn = document.createElement("button");
        rmBtn.type = "button";
        rmBtn.className = "tag-remove-btn";
        rmBtn.innerHTML = '<i class="bi bi-x"></i>';
        rmBtn.onclick = () => {
            const idx = arr.indexOf(text);
            if (idx > -1) arr.splice(idx, 1);
            tagItem.remove();
        };
        tagItem.appendChild(span);
        tagItem.appendChild(rmBtn);
        container.appendChild(tagItem);
    }

    function setupEditTagInput(inputId, btnId, containerId, arr) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(btnId);
        const cont = document.getElementById(containerId);
        if (!input || !btn || !cont) return;
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        const addTag = () => {
            const text = input.value.trim();
            if (!text) return;
            arr.push(text);
            addTagToContainer(cont, text, arr);
            input.value = "";
            input.focus();
        };
        newBtn.addEventListener("click", addTag);
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addTag();
            }
        });
    }

    function setupTagInput(inputId, btnId, containerId, tagsArray) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(btnId);
        const cont = document.getElementById(containerId);
        if (!input || !btn || !cont) return;
        const addTag = () => {
            const text = input.value.trim();
            if (!text) return;
            tagsArray.push(text);
            const tagItem = document.createElement("div");
            tagItem.classList.add("tag-item");
            const span = document.createElement("span");
            span.textContent = text;
            const rmBtn = document.createElement("button");
            rmBtn.classList.add("tag-remove-btn");
            rmBtn.innerHTML = '<i class="bi bi-x"></i>';
            rmBtn.type = "button";
            rmBtn.onclick = () => {
                const idx = tagsArray.indexOf(text);
                if (idx > -1) tagsArray.splice(idx, 1);
                tagItem.style.animation = "fadeOut 0.3s forwards";
                setTimeout(() => tagItem.remove(), 300);
            };
            tagItem.appendChild(span);
            tagItem.appendChild(rmBtn);
            cont.appendChild(tagItem);
            input.value = "";
            input.focus();
        };
        btn.addEventListener("click", addTag);
        input.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addTag();
            }
        });
    }

    function clearTagContainers(prefix) {
        const s = document.getElementById(`${prefix}sentencePreviewContainer`);
        const h = document.getElementById(`${prefix}hintPreviewContainer`);
        if (s) s.innerHTML = "";
        if (h) h.innerHTML = "";
    }

    function getCsrfToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute("content") : "";
    }

    // ============================================================
    // 11. لوجيك الخيارات (Option Groups)
    // ============================================================
    function initOptionGroups(prefix) {
        const container = document.getElementById(`${prefix}optionGroupsContainer`);
        const addBtn    = document.getElementById(`${prefix}addOptionGroupBtn`);
        if (!container || !addBtn) return;

        let groupCount = 0;

        addBtn.addEventListener("click", () => addOptionGroup(prefix, container));

        function addOptionGroup(prefix, container) {
            groupCount++;
            const gIdx = groupCount;
            const groupDiv = document.createElement("div");
            groupDiv.className = "option-group-block";
            groupDiv.dataset.gidx = gIdx;
            groupDiv.innerHTML = `
                <div class="option-group-header">
                    <input type="text" class="form-control option-group-title" placeholder="عنوان المجموعة (مثال: اللون، المقاس...)" data-gidx="${gIdx}">
                    <button type="button" class="remove-group-btn" title="حذف المجموعة"><i class="bi bi-x-circle"></i></button>
                </div>
                <div class="option-items-container" data-gidx="${gIdx}"></div>
                <button type="button" class="add-option-item-btn" data-gidx="${gIdx}"><i class="bi bi-plus-lg"></i> إضافة خيار</button>
            `;
            groupDiv.querySelector(".remove-group-btn").addEventListener("click", () => {
                groupDiv.style.animation = "fadeOut 0.25s forwards";
                setTimeout(() => groupDiv.remove(), 250);
            });
            groupDiv.querySelector(".add-option-item-btn").addEventListener("click", () => {
                addOptionItem(prefix, groupDiv.querySelector(".option-items-container"), gIdx);
            });
            container.appendChild(groupDiv);
            // Add first option item automatically
            addOptionItem(prefix, groupDiv.querySelector(".option-items-container"), gIdx);
        }

        function addOptionItem(prefix, itemsContainer, gIdx) {
            const oIdx = itemsContainer.children.length;
            const itemDiv = document.createElement("div");
            itemDiv.className = "option-item-row";
            itemDiv.dataset.oidx = oIdx;
            itemDiv.innerHTML = `
                <div class="option-item-fields">
                    <input type="text"   class="form-control opt-name"         placeholder="الاسم">
                    <input type="number" class="form-control opt-price"        placeholder="سعر مخصص (اختياري)" step="0.01" min="0">
                    <input type="number" class="form-control opt-qty"          placeholder="الكمية (اختياري)"  min="0">
                    <div class="opt-images-wrap">
                        <label class="opt-img-label">
                            <i class="bi bi-image"></i> صور (حد أقصى 4)
                            <input type="file" class="opt-img-input" name="opt_img_${gIdx}_${oIdx}" multiple accept="image/*" style="display:none;" data-max="4">
                        </label>
                        <div class="opt-img-preview"></div>
                    </div>
                </div>
                <button type="button" class="remove-option-item-btn" title="حذف الخيار"><i class="bi bi-trash"></i></button>
            `;
            // Image preview
            const imgInput   = itemDiv.querySelector(".opt-img-input");
            const imgPreview = itemDiv.querySelector(".opt-img-preview");
            let optImages = [];
            imgInput.addEventListener("change", (e) => {
                const files = Array.from(e.target.files);
                if (optImages.length + files.length > 4) {
                    showToast("أقصى عدد صور للخيار هو 4", "error");
                    imgInput.value = "";
                    return;
                }
                files.forEach((file) => {
                    if (optImages.length >= 4) return;
                    optImages.push(file);
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const wrap = document.createElement("div");
                        wrap.className = "opt-img-thumb-wrap";
                        wrap.innerHTML = `<img src="${ev.target.result}" class="opt-img-thumb"><button type="button" class="opt-img-remove"><i class="bi bi-x"></i></button><button type="button" class="opt-img-primary" title="جعل هذه الصورة الرئيسية للخيار">★</button>`;
                        wrap.querySelector(".opt-img-remove").addEventListener("click", () => {
                            const fi = optImages.indexOf(file);
                            if (fi > -1) optImages.splice(fi, 1);

                            // إذا كانت الصورة المحذوفة رئيسية، اختر الأولى
                            if (wrap.classList.contains('primary-option-image') && imgPreview.children.length > 1) {
                                const firstWrap = imgPreview.querySelector('.opt-img-thumb-wrap:not([style*="display: none"])');
                                if (firstWrap && firstWrap !== wrap) {
                                    firstWrap.classList.add('primary-option-image');
                                }
                            }

                            wrap.remove();
                        });

                        wrap.querySelector(".opt-img-primary").addEventListener("click", () => {
                            // إزالة الكلاس من جميع صور هذا الخيار
                            imgPreview.querySelectorAll('.opt-img-thumb-wrap').forEach(w => {
                                w.classList.remove('primary-option-image');
                            });
                            // إضافة الكلاس للصورة المختارة
                            wrap.classList.add('primary-option-image');
                        });

                        // إذا كانت أول صورة للخيار، اجعلها رئيسية
                        if (optImages.length === 1) {
                            wrap.classList.add('primary-option-image');
                        }
                        imgPreview.appendChild(wrap);
                    };
                    reader.readAsDataURL(file);
                });
                imgInput.value = "";
            });
            itemDiv.querySelector(".remove-option-item-btn").addEventListener("click", () => {
                itemDiv.style.animation = "fadeOut 0.2s forwards";
                setTimeout(() => itemDiv.remove(), 220);
            });
            // Store reference to optImages on the element for later serialization
            itemDiv._optImages = optImages;
            itemsContainer.appendChild(itemDiv);
        }
    }

    // ============================================================
    // 12. لوجيك المواصفات (Specs Table)
    // ============================================================
    function initSpecsTable(prefix) {
        const tbody  = document.getElementById(`${prefix}specsTableBody`);
        const addBtn = document.getElementById(`${prefix}addSpecRowBtn`);
        if (!tbody || !addBtn) return;

        function addSpecRow() {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td><input type="text" class="form-control spec-value-input" placeholder="القيمة"></td>
            <td><input type="text" class="form-control spec-title-input" placeholder="العنوان"></td>
                <td><button type="button" class="remove-spec-row-btn"><i class="bi bi-x"></i></button></td>
            `;
            tr.querySelector(".remove-spec-row-btn").addEventListener("click", () => {
                tr.style.animation = "fadeOut 0.2s forwards";
                setTimeout(() => tr.remove(), 220);
            });
            tbody.appendChild(tr);
        }

        addBtn.addEventListener("click", addSpecRow);
    }

    // ============================================================
    // مساعد: جمع بيانات option groups من form محدد
    // ============================================================
    function collectOptionGroupsData(prefix) {
        const container = document.getElementById(`${prefix}optionGroupsContainer`);
        if (!container) return [];
        const groups = [];
        container.querySelectorAll(".option-group-block").forEach((groupDiv) => {
            const title = groupDiv.querySelector(".option-group-title")?.value.trim() || "";
            const options = [];
            groupDiv.querySelectorAll(".option-item-row").forEach((itemDiv) => {
                const name  = itemDiv.querySelector(".opt-name")?.value.trim()  || "";
                const price = itemDiv.querySelector(".opt-price")?.value.trim() || "";
                const qty   = itemDiv.querySelector(".opt-qty")?.value.trim()   || "";

                // العثور على الصورة الرئيسية للخيار
                const primaryImageIndex = (() => {
                    const imgPreview = itemDiv.querySelector(".opt-img-preview");
                    if (!imgPreview) return 0;
                    const wraps = Array.from(imgPreview.querySelectorAll('.opt-img-thumb-wrap'));
                    const primaryWrap = imgPreview.querySelector('.opt-img-thumb-wrap.primary-option-image');
                    return primaryWrap ? wraps.indexOf(primaryWrap) : 0;
                })();

                options.push({
                    name,
                    custom_price: price,
                    quantity: qty,
                    primary_image_index: primaryImageIndex
                });
            });
            groups.push({ title, options });
        });
        return groups;
    }

    // ============================================================
    // مساعد: جمع ملفات الصور لكل الخيارات
    // ============================================================
    function appendOptionImages(fd, prefix) {
        const container = document.getElementById(`${prefix}optionGroupsContainer`);
        if (!container) return;
        let gIdx = 0;
        container.querySelectorAll(".option-group-block").forEach((groupDiv) => {
            let oIdx = 0;
            groupDiv.querySelectorAll(".option-item-row").forEach((itemDiv) => {
                const imgs = itemDiv._optImages || [];
                imgs.forEach((file, iIdx) => {
                    fd.append(`opt_img_${gIdx}_${oIdx}`, file);
                });
                oIdx++;
            });
            gIdx++;
        });
    }

    // ============================================================
    // مساعد: جمع بيانات المواصفات من form محدد
    // ============================================================
    function collectSpecsData(prefix) {
        const tbody = document.getElementById(`${prefix}specsTableBody`);
        if (!tbody) return [];
        const specs = [];
        tbody.querySelectorAll("tr").forEach((tr) => {
            const title = tr.querySelector(".spec-title-input")?.value.trim() || "";
            const value = tr.querySelector(".spec-value-input")?.value.trim() || "";
            if (title || value) specs.push({ title, value });
        });
        return specs;
    }

    // Initialize option groups and specs for all forms including edit
    initOptionGroups("");
    initOptionGroups("box-");
    initOptionGroups("edit-");
    initSpecsTable("");
    initSpecsTable("box-");
    initSpecsTable("edit-");

    // ============================================================
    // slugify helper
    // ============================================================
    function slugify(text) {
        return (text || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9\-\u0600-\u06ff]/g, "")
            .replace(/--+/g, "-")
            .replace(/^-+|-+$/g, "") || "category";
    }

    // ============================================================
    // تعبئة خيارات المنتج في نموذج التعديل
    // ============================================================
    function fillEditOptionGroups(item) {
        const container = document.getElementById("edit-optionGroupsContainer");
        if (!container) return;
        container.innerHTML = "";
        if (!item.option_groups || !item.option_groups.length) return;
        item.option_groups.forEach((group, gIdx) => {
            const groupDiv = document.createElement("div");
            groupDiv.className = "option-group-block";
            groupDiv.dataset.gidx = gIdx;
            groupDiv.innerHTML = `
                <div class="option-group-header">
                    <input type="text" class="form-control option-group-title" placeholder="عنوان المجموعة" data-gidx="${gIdx}" value="${escAttr(group.title || '')}">
                    <button type="button" class="remove-group-btn" title="حذف المجموعة"><i class="bi bi-x-circle"></i></button>
                </div>
                <div class="option-items-container" data-gidx="${gIdx}"></div>
                <button type="button" class="add-option-item-btn" data-gidx="${gIdx}"><i class="bi bi-plus-lg"></i> إضافة خيار</button>
            `;
            groupDiv.querySelector(".remove-group-btn").addEventListener("click", () => {
                groupDiv.style.animation = "fadeOut 0.25s forwards";
                setTimeout(() => groupDiv.remove(), 250);
            });
            const itemsContainer = groupDiv.querySelector(".option-items-container");
            groupDiv.querySelector(".add-option-item-btn").addEventListener("click", () => {
                addEditOptionItem(itemsContainer, gIdx);
            });
            container.appendChild(groupDiv);
            (group.options || []).forEach((opt) => {
                addEditOptionItem(itemsContainer, gIdx, opt);
            });
            if (!group.options || !group.options.length) {
                addEditOptionItem(itemsContainer, gIdx);
            }
        });
    }

    function addEditOptionItem(itemsContainer, gIdx, opt) {
        const oIdx = itemsContainer.children.length;
        const itemDiv = document.createElement("div");
        itemDiv.className = "option-item-row";
        itemDiv.dataset.oidx = oIdx;
        const nameVal  = opt ? escAttr(opt.name || "")  : "";
        const priceVal = opt ? escAttr(opt.custom_price != null ? opt.custom_price : "") : "";
        const qtyVal   = opt ? escAttr(opt.quantity   != null ? opt.quantity   : "") : "";
        itemDiv.innerHTML = `
            <div class="option-item-fields">
                <input type="text"   class="form-control opt-name"  placeholder="الاسم" value="${nameVal}">
                <input type="number" class="form-control opt-price" placeholder="سعر مخصص (اختياري)" step="0.01" min="0" value="${priceVal}">
                <input type="number" class="form-control opt-qty"   placeholder="الكمية (اختياري)"  min="0" value="${qtyVal}">
                <div class="opt-images-wrap">
                    <label class="opt-img-label">
                        <i class="bi bi-image"></i> صور جديدة (حد أقصى 4)
                        <input type="file" class="opt-img-input" multiple accept="image/*" style="display:none;" data-max="4">
                    </label>
                    <div class="opt-img-preview"></div>
                </div>
            </div>
            <button type="button" class="remove-option-item-btn" title="حذف الخيار"><i class="bi bi-trash"></i></button>
        `;
        const imgInput   = itemDiv.querySelector(".opt-img-input");
        const imgPreview = itemDiv.querySelector(".opt-img-preview");
        let optImages = [];
        imgInput.addEventListener("change", (e) => {
            const files = Array.from(e.target.files);
            if (optImages.length + files.length > 4) {
                showToast("أقصى عدد صور للخيار هو 4", "error");
                imgInput.value = "";
                return;
            }
            files.forEach((file) => {
                if (optImages.length >= 4) return;
                optImages.push(file);
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const wrap = document.createElement("div");
                    wrap.className = "opt-img-thumb-wrap";
                    wrap.innerHTML = `<img src="${ev.target.result}" class="opt-img-thumb"><button type="button" class="opt-img-remove"><i class="bi bi-x"></i></button><button type="button" class="opt-img-primary" title="جعل هذه الصورة الرئيسية للخيار">★</button>`;
                    wrap.querySelector(".opt-img-remove").addEventListener("click", () => {
                        const fi = optImages.indexOf(file);
                        if (fi > -1) optImages.splice(fi, 1);

                        // إذا كانت الصورة المحذوفة رئيسية، اختر الأولى
                        if (wrap.classList.contains('primary-option-image') && imgPreview.children.length > 1) {
                            const firstWrap = imgPreview.querySelector('.opt-img-thumb-wrap:not([style*="display: none"])');
                            if (firstWrap && firstWrap !== wrap) {
                                firstWrap.classList.add('primary-option-image');
                            }
                        }

                        wrap.remove();
                    });

                    wrap.querySelector(".opt-img-primary").addEventListener("click", () => {
                        // إزالة الكلاس من جميع صور هذا الخيار
                        imgPreview.querySelectorAll('.opt-img-thumb-wrap').forEach(w => {
                            w.classList.remove('primary-option-image');
                        });
                        // إضافة الكلاس للصورة المختارة
                        wrap.classList.add('primary-option-image');
                    });

                    // إذا كانت أول صورة للخيار، اجعلها رئيسية
                    if (optImages.length === 1) {
                        wrap.classList.add('primary-option-image');
                    }
                    imgPreview.appendChild(wrap);
                };
                reader.readAsDataURL(file);
            });
            imgInput.value = "";
        });
        itemDiv.querySelector(".remove-option-item-btn").addEventListener("click", () => {
            itemDiv.style.animation = "fadeOut 0.2s forwards";
            setTimeout(() => itemDiv.remove(), 220);
        });
        itemDiv._optImages = optImages;
        itemsContainer.appendChild(itemDiv);
    }

    // ============================================================
    // تعبئة مواصفات المنتج في نموذج التعديل
    // ============================================================
    function fillEditSpecs(item) {
        const tbody = document.getElementById("edit-specsTableBody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (!item.specs || !item.specs.length) return;
        item.specs.forEach((spec) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
            <td><button type="button" class="remove-spec-row-btn"><i class="bi bi-x"></i></button></td>
            <td><input type="text" class="form-control spec-value-input" placeholder="القيمة" value="${escAttr(spec.value || '')}"></td>
            <td><input type="text" class="form-control spec-title-input" placeholder="العنوان" value="${escAttr(spec.title || '')}"></td>
            `;
            tr.querySelector(".remove-spec-row-btn").addEventListener("click", () => {
                tr.style.animation = "fadeOut 0.2s forwards";
                setTimeout(() => tr.remove(), 220);
            });
            tbody.appendChild(tr);
        });
    }

    // ============================================================
    // جمع بيانات الخيارات من نموذج التعديل
    // ============================================================
    function collectEditOptionGroupsData() {
        return collectOptionGroupsData("edit-");
    }

    // ============================================================
    // إرفاق صور الخيارات الجديدة من نموذج التعديل
    // ============================================================
    function appendEditOptionImages(fd) {
        appendOptionImages(fd, "edit-");
    }

    // ============================================================
    // جمع بيانات المواصفات من نموذج التعديل
    // ============================================================
    function collectEditSpecsData() {
        return collectSpecsData("edit-");
    }

    // ============================================================
    // مساعد: تهريب قيم الـ attributes
    // ============================================================
    function escAttr(str) {
        return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function showToast(message, type = "success") {
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.style.cssText =
                "position:fixed;top:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:center;";
            document.body.appendChild(container);
        }
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.cssText = `
      padding:12px 28px;border-radius:12px;font-size:14px;font-weight:600;color:#fff;
      background:${type === "success" ? "#2d7a4f" : "#c0392b"};
      box-shadow:0 6px 20px rgba(0,0,0,0.22);
      animation:toastIn 0.35s cubic-bezier(.34,1.56,.64,1) forwards;
      opacity:1;transition:opacity 0.3s;
    `;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ============================================================
    // أكواد الخصم — إضافة
    // ============================================================
    function initDiscountCodeForm() {
        const form = document.getElementById("addDiscountCodeForm");
        if (!form) return;
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const code         = document.getElementById("dc-code")?.value.trim();
            const discountType = document.getElementById("dc-type")?.value || "percentage";
            const isFixed      = discountType === "fixed";
            const discount     = isFixed ? null : document.getElementById("dc-discount")?.value.trim();
            const discountAmt  = isFixed ? document.getElementById("dc-discount-amount")?.value.trim() : null;
            const type         = document.querySelector('input[name="dc-expiry-type"]:checked')?.value;
            const expiresAt    = (type === "date") ? document.getElementById("dc-expires-at")?.value : null;

            if (!code)           { showToast("الرجاء إدخال اسم الكود", "error"); return; }
            if (!isFixed && !discount)  { showToast("الرجاء إدخال نسبة الخصم", "error"); return; }
            if (isFixed && !discountAmt){ showToast("الرجاء إدخال مبلغ الخصم", "error"); return; }
            if (type === "date" && !expiresAt) { showToast("الرجاء اختيار تاريخ الانتهاء", "error"); return; }

            const submitBtn = form.querySelector(".submit-btn");
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> جاري الحفظ...';

            try {
                const body = { code, discount_type: discountType };
                if (isFixed) { body.discount_amount = parseFloat(discountAmt); }
                else         { body.discount = parseInt(discount); }
                if (expiresAt) body.expires_at = expiresAt;

                const res = await fetch("/api/discount-codes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Accept": "application/json", "X-CSRF-TOKEN": getCsrfToken() },
                    body: JSON.stringify(body),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || "فشل الحفظ");

                showToast("✅ تم حفظ الكود بنجاح!");
                form.reset();
                document.getElementById("dc-date-wrap").style.display = "none";
                dcSetType("percentage");
                // refresh table if visible
                if (isDataShowing && currentViewType === "discount-code") {
                    loadedItems.push(data);
                    renderDiscountCodesTable(loadedItems);
                }
            } catch (err) {
                showToast("❌ " + err.message, "error");
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> حفظ الكود';
            }
        });
    }
    initDiscountCodeForm();

    // ============================================================
    // أكواد الخصم — عرض جدول
    // ============================================================
    function renderDiscountCodesTable(items) {
        if (!items || items.length === 0) {
            itemsGrid.innerHTML = `<div class="no-data-msg"><i class="bi bi-ticket-perforated"></i><p>لا توجد أكواد خصم بعد</p></div>`;
            return;
        }
        const rows = items.map(dc => {
            const statusLabel = dc.status === "active" ? "جاري" : "منتهي الصلاحية";
            const badgeClass  = dc.status === "active" ? "active" : "expired";
            const expiryLabel = dc.expires_at
                ? new Date(dc.expires_at).toLocaleDateString("ar-EG")
                : '<span class="dc-badge permanent">دائم</span>';
            const isFixed = dc.discount_type === 'fixed';
            const discountLabel = isFixed
                ? `${parseFloat(dc.discount_amount || 0).toFixed(0)} جنيه`
                : `${dc.discount}%`;
            return `
            <tr>
                <td>${dc.code}</td>
                <td>${discountLabel}</td>
                <td>${expiryLabel}</td>
                <td><span class="dc-badge ${badgeClass}">${statusLabel}</span></td>
                <td style="display:flex;gap:6px;justify-content:flex-end;">
                    <button class="btn-dc-edit" onclick="openDcEditModal(${dc.id})" title="تعديل"><i class="bi bi-pencil"></i></button>
                    <button class="btn-dc-del"  onclick="deleteDcCode(${dc.id})"    title="حذف"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join("");
        itemsGrid.innerHTML = `
        <table class="dc-table">
            <thead>
                <tr>
                    <th>اسم الكود</th>
                    <th>الخصم</th>
                    <th>تاريخ الانتهاء</th>
                    <th>الصلاحية</th>
                    <th style="text-align:left;">إجراءات</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
    }

    // ============================================================
    // أكواد الخصم — تبديل نوع الخصم (add form)
    window.dcSetType = function(type) {
        document.getElementById("dc-type").value = type;
        const percentBtn = document.getElementById("dc-type-percent-btn");
        const fixedBtn   = document.getElementById("dc-type-fixed-btn");
        const percentWrap = document.getElementById("dc-percent-wrap");
        const amountWrap  = document.getElementById("dc-amount-wrap");
        if (type === 'fixed') {
            fixedBtn.style.background   = '#596d52'; fixedBtn.style.color   = '#fff';
            percentBtn.style.background = '#fff';    percentBtn.style.color = '#596d52';
            percentWrap.style.display = 'none';  amountWrap.style.display = 'flex';
        } else {
            percentBtn.style.background = '#596d52'; percentBtn.style.color = '#fff';
            fixedBtn.style.background   = '#fff';    fixedBtn.style.color   = '#596d52';
            amountWrap.style.display = 'none';  percentWrap.style.display = 'flex';
        }
    };

    // أكواد الخصم — تبديل نوع الخصم (edit modal)
    window.dcEditSetType = function(type) {
        document.getElementById("dc-edit-type").value = type;
        const percentBtn = document.getElementById("dc-edit-type-percent-btn");
        const fixedBtn   = document.getElementById("dc-edit-type-fixed-btn");
        const percentWrap = document.getElementById("dc-edit-percent-wrap");
        const amountWrap  = document.getElementById("dc-edit-amount-wrap");
        if (type === 'fixed') {
            fixedBtn.style.background   = '#596d52'; fixedBtn.style.color   = '#fff';
            percentBtn.style.background = '#fff';    percentBtn.style.color = '#596d52';
            percentWrap.style.display = 'none';  amountWrap.style.display = 'block';
        } else {
            percentBtn.style.background = '#596d52'; percentBtn.style.color = '#fff';
            fixedBtn.style.background   = '#fff';    fixedBtn.style.color   = '#596d52';
            amountWrap.style.display = 'none';  percentWrap.style.display = 'block';
        }
    };

    // أكواد الخصم — تبديل تاريخ الانتهاء (add form)
    // ============================================================
    window.dcToggleDate = function(input) {
        const wrap = document.getElementById("dc-date-wrap");
        if (wrap) wrap.style.display = input.value === "date" ? "flex" : "none";
    };

    // أكواد الخصم — تبديل تاريخ الانتهاء (edit modal)
    window.dcEditToggleDate = function(input) {
        const wrap = document.getElementById("dc-edit-date-wrap");
        if (wrap) wrap.style.display = input.value === "date" ? "flex" : "none";
    };

    // أكواد الخصم — فتح مودال التعديل
    window.openDcEditModal = function(id) {
        const dc = loadedItems.find(x => x.id === id);
        if (!dc) return;
        document.getElementById("dc-edit-id").value   = dc.id;
        document.getElementById("dc-edit-code").value = dc.code;

        const isFixed = dc.discount_type === 'fixed';
        dcEditSetType(isFixed ? 'fixed' : 'percentage');
        if (isFixed) {
            document.getElementById("dc-edit-discount-amount").value = dc.discount_amount || '';
        } else {
            document.getElementById("dc-edit-discount").value = dc.discount;
        }

        const isPermanent = !dc.expires_at;
        const radios = document.querySelectorAll('input[name="dc-edit-expiry-type"]');
        radios.forEach(r => r.checked = (r.value === (isPermanent ? "permanent" : "date")));
        const dateWrap = document.getElementById("dc-edit-date-wrap");
        if (dateWrap) dateWrap.style.display = isPermanent ? "none" : "block";
        if (!isPermanent && dc.expires_at) {
            document.getElementById("dc-edit-expires-at").value = dc.expires_at.slice(0, 10);
        }
        const modal = document.getElementById("dcEditModal");
        modal.style.display = "flex";
    };

    // أكواد الخصم — إغلاق مودال التعديل
    window.closeDcEditModal = function() {
        document.getElementById("dcEditModal").style.display = "none";
    };

    // أكواد الخصم — حفظ التعديل
    window.submitDcEdit = async function() {
        const id           = document.getElementById("dc-edit-id")?.value;
        const code         = document.getElementById("dc-edit-code")?.value.trim();
        const discountType = document.getElementById("dc-edit-type")?.value || "percentage";
        const isFixed      = discountType === "fixed";
        const discount     = isFixed ? null : document.getElementById("dc-edit-discount")?.value.trim();
        const discountAmt  = isFixed ? document.getElementById("dc-edit-discount-amount")?.value.trim() : null;
        const type         = document.querySelector('input[name="dc-edit-expiry-type"]:checked')?.value;
        const expiresAt    = (type === "date") ? document.getElementById("dc-edit-expires-at")?.value : null;

        if (!code)           { showToast("الرجاء إدخال اسم الكود", "error"); return; }
        if (!isFixed && !discount)  { showToast("الرجاء إدخال نسبة الخصم", "error"); return; }
        if (isFixed && !discountAmt){ showToast("الرجاء إدخال مبلغ الخصم", "error"); return; }
        if (type === "date" && !expiresAt) { showToast("الرجاء اختيار تاريخ الانتهاء", "error"); return; }

        try {
            const body = { code, discount_type: discountType, expires_at: expiresAt || null };
            if (isFixed) { body.discount_amount = parseFloat(discountAmt); }
            else         { body.discount = parseInt(discount); }

            const res = await fetch(`/api/discount-codes/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json", "X-CSRF-TOKEN": getCsrfToken() },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "فشل التحديث");

            showToast("✅ تم تحديث الكود بنجاح!");
            window.closeDcEditModal();
            const idx = loadedItems.findIndex(x => x.id == id);
            if (idx > -1) loadedItems[idx] = { ...loadedItems[idx], ...data };
            renderDiscountCodesTable(loadedItems);
        } catch (err) {
            showToast("❌ " + err.message, "error");
        }
    };

    // أكواد الخصم — حذف
    window.deleteDcCode = async function(id) {
        if (!confirm("هل أنت متأكد من حذف هذا الكود؟")) return;
        try {
            const res = await fetch(`/api/discount-codes/${id}`, {
                method: "DELETE",
                headers: { "Accept": "application/json", "X-CSRF-TOKEN": getCsrfToken() },
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.message || "فشل الحذف");
            }
            showToast("🗑️ تم حذف الكود");
            loadedItems = loadedItems.filter(x => x.id != id);
            renderDiscountCodesTable(loadedItems);
        } catch (err) {
            showToast("❌ " + err.message, "error");
        }
    };

    // إغلاق مودال التعديل بالضغط خارجه
    document.getElementById("dcEditModal")?.addEventListener("click", function(e) {
        if (e.target === this) window.closeDcEditModal();
    });

    // ============================================================
    // مودال اختيار عناصر المخزن
    // ============================================================

    /**
     * renderInvTags — يرسم العلامات (tags) لعناصر المخزن المختارة داخل حاوية التاجز.
     * @param {string} containerId  — معرف الـ div
     * @param {Array}  items        — مصفوفة عناصر { id, item_name, quantity, image_url }
     * @param {string} context      — 'single'|'multi'|'edit-single'|'edit-multi'
     */
    function renderInvTags(containerId, items, context) {
        const wrap = document.getElementById(containerId);
        if (!wrap) return;
        wrap.innerHTML = '';
        items.forEach(item => {
            const tag = document.createElement('div');
            tag.className = 'inv-tag';
            tag.innerHTML = `<span>${item.item_name}</span><small style="color:#596d52;margin-right:4px;">(${item.quantity})</small>`;
            // زر الإزالة
            const rm = document.createElement('button');
            rm.type = 'button';
            rm.innerHTML = '<i class="bi bi-x"></i>';
            rm.onclick = () => removeInvItem(item.id, context, containerId);
            tag.appendChild(rm);
            wrap.appendChild(tag);
        });
    }

    function removeInvItem(itemId, context, containerId) {
        if (context === 'single' || context === 'edit-single') {
            if (context === 'single') {
                invState.box.id = null; invState.box.item = null;
                renderInvTags(containerId, [], context);

                // أعد تعطيل النموذج
                resetFormToDisabled('box-');

                // تحديث الـ hidden input
                document.getElementById('box-inventory_item_id').value = '';
            } else {
                invState.edit.id = null; invState.edit.item = null;
                renderInvTags(containerId, [], context);
            }
        } else {
            const stateKey = context === 'multi' ? 'normal' : 'edit';
            invState[stateKey].ids   = invState[stateKey].ids.filter(i => i !== itemId);
            invState[stateKey].items = invState[stateKey].items.filter(i => i.id !== itemId);
            renderInvTags(containerId, invState[stateKey].items, context);

            // إذا تم إزالة جميع العناصر، أعد تعطيل النموذج
            if (context === 'multi' && invState[stateKey].ids.length === 0) {
                resetFormToDisabled('');
            }

            // تحديث الـ hidden input
            if (context === 'multi') {
                document.getElementById('normal-inventory_item_ids').value = JSON.stringify(invState[stateKey].ids);
            }
        }
    }

    /**
     * openInventoryPicker — يفتح مودال الاختيار.
     * @param {string} mode  — 'single'|'multi'|'edit-single'|'edit-multi'
     * @param {string} form  — 'normal'|'box'|'edit'
     */
    window.openInventoryPicker = async function(mode, form) {
        invPickerMode = mode;
        invPickerForm = form;

        const isMulti = mode.includes('multi');
        const title = document.getElementById('invPickerTitle');
        const note  = document.getElementById('invMultiNote');
        if (title) title.textContent = isMulti ? 'اختر عناصر من المخزن (متعدد)' : 'اختر المنتج من المخزن';
        if (note)  note.style.display = isMulti ? 'block' : 'none';

        // حدد التحديد المسبق
        if (mode === 'single')       invPickerSel = invState.box.id   ? [invState.box.id]   : [];
        else if (mode === 'multi')   invPickerSel = [...invState.normal.ids];
        else if (mode === 'edit-single') invPickerSel = invState.edit.id ? [invState.edit.id] : [];
        else if (mode === 'edit-multi')  invPickerSel = [...invState.edit.ids];

        const modal = document.getElementById('invPickerModal');
        if (modal) { modal.style.display = 'flex'; }

        // تحديد نوع المنتج للفلترة
        let productType;
        if (form === 'normal') {
            productType = 'box'; // بوكس يسمح بتكرار
        } else if (form === 'edit') {
            // في التعديل، تحديد النوع حسب المنتج المحرر
            const editItemType = document.getElementById('editItemType')?.value;
            productType = (editItemType === 'box') ? 'box' : 'product';
        } else {
            productType = 'product'; // منتج منفرد لا يسمح بتكرار
        }

        // جلب البيانات مع cache منفصل لكل نوع
        if (!invItemsCache[productType] || invItemsCache[productType].length === 0) {
            document.getElementById('invItemsGrid').innerHTML = '<div style="padding:30px;text-align:center;color:#888;"><i class="bi bi-hourglass-split"></i> جاري التحميل...</div>';
            try {
                const res = await fetch(`/api/inventory/selectable?type=${productType}`, {
                    headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrfToken() }
                });
                const data = await res.json();
                invItemsCache[productType] = data.items || [];

                // عرض رسالة إذا تم إخفاء عناصر (للمنتجات المنفردة فقط)
                if (data.filtered_count > 0 && productType === 'product') {
                    console.log(`تم إخفاء ${data.filtered_count} عنصر مستخدم من الاختيارات`);
                }
            } catch(err) {
                document.getElementById('invItemsGrid').innerHTML = '<div style="padding:20px;color:red;">فشل تحميل المخزن</div>';
                return;
            }
        }

        // استخدام العناصر المخزنة حسب النوع
        const currentItems = invItemsCache[productType];
        renderInvPickerGrid(currentItems);
        updateInvSelCount();
    };

    window.closeInventoryPicker = function() {
        const modal = document.getElementById('invPickerModal');
        if (modal) modal.style.display = 'none';
        invPickerMode = null;
        invPickerForm = null;
        invPickerSel  = [];
    };

    window.filterInvItems = function() {
        // تحديد نوع المنتج للفلترة
        let productType;
        if (invPickerForm === 'normal') {
            productType = 'box';
        } else if (invPickerForm === 'edit') {
            const editItemType = document.getElementById('editItemType')?.value;
            productType = (editItemType === 'box') ? 'box' : 'product';
        } else {
            productType = 'product';
        }

        const q = (document.getElementById('invSearchInput')?.value || '').toLowerCase().trim();
        const items = invItemsCache[productType] || [];
        const filtered = q ? items.filter(it => it.item_name.toLowerCase().includes(q)) : items;
        renderInvPickerGrid(filtered);
    };

    function renderInvPickerGrid(items) {
        const grid = document.getElementById('invItemsGrid');
        if (!grid) return;
        if (!items || items.length === 0) {
            grid.innerHTML = '<div style="padding:30px;text-align:center;color:#888;">لا توجد عناصر</div>';
            return;
        }
        grid.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'inv-item-card' + (invPickerSel.includes(item.id) ? ' selected' : '');
            card.dataset.id = item.id;
            const imgHtml = item.has_image
                ? `<img class="inv-item-img" src="${item.image_url}" onerror="this.style.display='none'" alt="">`
                : `<div class="inv-item-img" style="display:flex;align-items:center;justify-content:center;background:#f0ede3;"><i class="bi bi-box-seam" style="font-size:1.8rem;color:#aaa;"></i></div>`;
            card.innerHTML = `${imgHtml}<div class="inv-item-name">${item.item_name}</div><div class="inv-item-qty">متوفر: ${item.quantity}</div>`;
            card.addEventListener('click', () => toggleInvPickerItem(item));
            grid.appendChild(card);
        });
    }

    function toggleInvPickerItem(item) {
        const isMulti = invPickerMode && invPickerMode.includes('multi');
        if (isMulti) {
            const idx = invPickerSel.indexOf(item.id);
            if (idx > -1) invPickerSel.splice(idx, 1);
            else invPickerSel.push(item.id);
        } else {
            invPickerSel = [item.id];
        }
        // تحديث مظهر الكروت
        document.querySelectorAll('#invItemsGrid .inv-item-card').forEach(card => {
            card.classList.toggle('selected', invPickerSel.includes(Number(card.dataset.id)));
        });
        updateInvSelCount();
    }

    function updateInvSelCount() {
        const el = document.getElementById('invPickerSelCount');
        if (el) el.textContent = invPickerSel.length > 0 ? `تم اختيار ${invPickerSel.length} عنصر` : '';
    }

    window.confirmInventoryPicker = function() {
        // تحديد نوع المنتج للحصول على العناصر الصحيحة من الـ cache
        let productType;
        if (invPickerForm === 'normal') {
            productType = 'box'; // بوكس يسمح بتكرار
        } else if (invPickerForm === 'edit') {
            // في التعديل، تحديد النوع حسب المنتج المحرر
            const editItemType = document.getElementById('editItemType')?.value;
            productType = (editItemType === 'box') ? 'box' : 'product';
        } else {
            productType = 'product'; // منتج منفرد لا يسمح بتكرار
        }

        const allItems = invItemsCache[productType] || [];
        const selectedItems = allItems.filter(it => invPickerSel.includes(it.id));

        if (invPickerMode === 'single') {
            const item = selectedItems[0] || null;
            invState.box.id   = item ? item.id   : null;
            invState.box.item = item;
            renderInvTags('box-inv-tags', item ? [item] : [], 'single');

            // تفعيل جميع حقول النموذج
            if (item) {
                enableFormFields('box-');
            }

            // اجعل حقل الكمية readonly وضع قيمة المخزن
            const qtyEl = document.getElementById('box-productQuantity');
            const note  = document.getElementById('box-qty-note');
            if (qtyEl && item) {
                qtyEl.value    = item.quantity;
                qtyEl.readOnly = true;
                qtyEl.style.cursor = 'not-allowed';
                qtyEl.style.backgroundColor = '#f5f5f5';
            } else if (qtyEl) {
                qtyEl.readOnly = false;
                qtyEl.style.cursor = '';
                qtyEl.style.backgroundColor = '';
            }
            if (note) note.textContent = item ? '(مأخوذة من المخزن)' : '';

            // تحديث الـ hidden input
            document.getElementById('box-inventory_item_id').value = item ? item.id : '';
        } else if (invPickerMode === 'multi') {
            invState.normal.ids   = selectedItems.map(i => i.id);
            invState.normal.items = selectedItems;
            renderInvTags('normal-inv-tags', selectedItems, 'multi');

            // تفعيل جميع حقول النموذج
            if (selectedItems.length > 0) {
                enableFormFields('');

                // في حالة البوكس، حقل الكمية يكون قابل للتعديل
                const qtyEl = document.getElementById('productQuantity');
                if (qtyEl) {
                    qtyEl.readOnly = false;
                    qtyEl.style.cursor = '';
                    qtyEl.style.backgroundColor = '';
                }
            }

            // تحديث الـ hidden input
            document.getElementById('normal-inventory_item_ids').value = JSON.stringify(selectedItems.map(i => i.id));
        } else if (invPickerMode === 'edit-single') {
            const item = selectedItems[0] || null;
            invState.edit.id   = item ? item.id   : null;
            invState.edit.item = item;
            renderInvTags('edit-inv-tags', item ? [item] : [], 'edit-single');
        } else if (invPickerMode === 'edit-multi') {
            invState.edit.ids   = selectedItems.map(i => i.id);
            invState.edit.items = selectedItems;
            renderInvTags('edit-inv-tags', selectedItems, 'edit-multi');
        }

        window.closeInventoryPicker();
    };

    // إغلاق مودال المخزن بالضغط خارجه
    document.getElementById('invPickerModal')?.addEventListener('click', function(e) {
        if (e.target === this) window.closeInventoryPicker();
    });

});
// note: closing brace above is the end of DOMContentLoaded
