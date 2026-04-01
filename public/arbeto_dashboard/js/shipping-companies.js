// ===== shipping-companies.js =====
// All Shipping Companies + Governorate Prices management.

let companies    = [];
let govPrices    = [];
let deleteTarget = null;      // company id pending deletion
let companyGovPricesCache = {};  // cache: companyId -> [{governorate_name, price}]

const ALL_GOVERNORATES = [
    'القاهرة','الجيزة','القليوبية','الإسكندرية','البحيرة','كفر الشيخ',
    'الدقهلية','الغربية','المنوفية','الشرقية','دمياط','بورسعيد',
    'الإسماعيلية','السويس','الفيوم','بني سويف','المنيا','أسيوط',
    'سوهاج','قنا','الأقصر','أسوان','البحر الأحمر','الوادي الجديد',
    'مطروح','شمال سيناء','جنوب سيناء'
];

// ===================================================================
// Bootstrap
// ===================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Tabs
    document.querySelectorAll(".sc-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".sc-tab").forEach((t) => t.classList.remove("active"));
            document.querySelectorAll(".sc-tab-panel").forEach((p) => p.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
        });
    });

    // Logo preview – registration form
    document.getElementById("reg-logo").addEventListener("change", (e) => {
        previewLogo(e.target, "regLogoPreview", "regLogoImg");
    });

    // Logo preview – edit modal
    document.getElementById("edit-logo").addEventListener("change", (e) => {
        previewLogo(e.target, "editLogoPreview", "editLogoImg");
    });

    // Close modals on overlay click
    document.getElementById("editModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("editModal")) closeEditModal();
    });
    document.getElementById("deleteModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("deleteModal")) closeDeleteModal();
    });
    document.getElementById("govPricesModal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("govPricesModal")) closeGovPricesModal();
    });

    loadCompanies();
    loadGovPrices();
});

// ===================================================================
// Helpers
// ===================================================================
function previewLogo(input, previewId, imgId) {
    const wrap = document.getElementById(previewId);
    const img  = document.getElementById(imgId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src   = e.target.result;
            wrap.style.display = "block";
        };
        reader.readAsDataURL(input.files[0]);
    }
}

 function togglePriceField() { /* no price field needed */ }

function showToast(message, type) {
    const toast = document.getElementById("toastNotification");
    const msg   = document.getElementById("toastMessage");
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.classList.remove("show");
    requestAnimationFrame(() => requestAnimationFrame(() => {
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }));
}

function updateStats() {
    const total  = companies.length;
    const fixed  = companies.filter((c) => c.shipping_type === "fixed").length;
    const manual = companies.filter((c) => c.shipping_type === "manual").length;
    document.getElementById("stat-companies").textContent = total;
    document.getElementById("stat-fixed").textContent     = fixed;
    document.getElementById("stat-manual").textContent    = manual;
}

// ===================================================================
// Companies – Load & Render
// ===================================================================
async function loadCompanies() {
    try {
        const res  = await fetch("/api/shipping-companies");
        if (!res.ok) throw new Error();
        companies  = await res.json();
        renderCompaniesTable();
        updateStats();
    } catch {
        document.getElementById("companiesTableWrap").innerHTML =
            `<div class="sc-empty"><span class="bi bi-exclamation-circle"></span><p>حدث خطأ أثناء تحميل الشركات</p></div>`;
    }
}

function renderCompaniesTable(filter = "") {
    const list = filter
        ? companies.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
        : companies;

    const wrap = document.getElementById("companiesTableWrap");

    if (list.length === 0) {
        wrap.innerHTML = `<div class="sc-empty"><span class="bi bi-inbox"></span><p>${filter ? "لا توجد نتائج" : "لا توجد شركات مسجّلة بعد"}</p></div>`;
        return;
    }

    const rows = list.map((c) => `
        <tr>
            <td>
                ${c.logo
                    ? `<img src="${c.logo}" class="co-logo-cell" alt="${c.name}" />`
                    : `<span class="co-no-logo"><span class="bi bi-building"></span></span>`}
            </td>
            <td><strong>${c.name}</strong></td>
            <td>
                <span class="type-badge ${c.shipping_type}">
                    <span class="bi bi-${c.shipping_type === "fixed" ? "lock-fill" : "pencil-fill"}"></span>
                    ${c.shipping_type === "fixed" ? "اوتوماتيكي" : "يدوي"}
                </span>
            </td>
            <td>
                ${c.shipping_type === "fixed"
                    ? `<button class="btn-gov-prices" onclick="openGovPricesModal(${c.id}, '${c.name.replace(/'/g, "\\'")}')"><span class="bi bi-geo-alt-fill"></span> أسعار الشحن</button>`
                    : `<span style="color:#aaa;font-size:13px;">— يدوي</span>`
                }
            </td>
            <td>
                <div class="td-actions">
                    <a href="/dashboard-admin/shipping-company/${c.id}" class="btn-td view" title="عرض الطلبات">
                        <span class="bi bi-eye"></span>
                    </a>
                    <button class="btn-td edit" title="تعديل" onclick="openEditModal(${c.id})">
                        <span class="bi bi-pencil"></span>
                    </button>
                    <button class="btn-td del" title="حذف" onclick="openDeleteModal(${c.id}, '${c.name.replace(/'/g, "\\'")}')">
                        <span class="bi bi-trash3"></span>
                    </button>
                </div>
            </td>
        </tr>`).join("");

    wrap.innerHTML = `
        <table class="sc-table">
            <thead>
                <tr>
                    <th>الشعار</th>
                    <th>الاسم</th>
                    <th>نوع الشحن</th>
                    <th>أسعار الشحن</th>
                    <th>الإجراءات</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>`;
}

function filterTable() {
    renderCompaniesTable(document.getElementById("scSearch").value);
}

// ===================================================================
// Companies – Register
// ===================================================================
async function registerCompany() {
    const name  = document.getElementById("reg-name").value.trim();
    const type  = document.querySelector('input[name="reg-type"]:checked')?.value;
    const logo  = document.getElementById("reg-logo").files[0];

    if (!name) { showToast("الرجاء إدخال اسم الشركة", "error"); return; }
    if (!type) { showToast("الرجاء اختيار نوع الشحن", "error"); return; }

    const btn = document.getElementById("regSubmitBtn");
    btn.classList.add("loading");

    try {
        const fd = new FormData();
        fd.append("name",          name);
        fd.append("shipping_type", type);
        if (logo) fd.append("logo", logo);

        const res = await fetch("/api/shipping-companies", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error || "فشل الحفظ");

        const company = await res.json();
        companies.push(company);
        renderCompaniesTable();
        updateStats();

        // Reset form
        document.getElementById("reg-name").value = "";
        document.getElementById("reg-logo").value = "";
        document.getElementById("regLogoPreview").style.display = "none";
        document.querySelector('input[name="reg-type"][value="fixed"]').checked = true;

        showToast("تم تسجيل الشركة بنجاح");
    } catch (err) {
        showToast(err.message || "حدث خطأ أثناء الحفظ", "error");
    } finally {
        btn.classList.remove("loading");
    }
}

// ===================================================================
// Companies – Edit Modal
// ===================================================================
function openEditModal(id) {
    const c = companies.find((x) => x.id === id);
    if (!c) return;

    document.getElementById("edit-id").value   = c.id;
    document.getElementById("edit-name").value = c.name;

    // Radio
    document.querySelectorAll('input[name="edit-type"]').forEach((r) => {
        r.checked = r.value === c.shipping_type;
    });

    // Current logo preview
    const preview = document.getElementById("editLogoPreview");
    const img     = document.getElementById("editLogoImg");
    if (c.logo) {
        img.src = c.logo;
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }

    // Clear file input
    document.getElementById("edit-logo").value = "";

    document.getElementById("editModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("active");
}

async function submitEditCompany() {
    const id   = document.getElementById("edit-id").value;
    const name = document.getElementById("edit-name").value.trim();
    const type = document.querySelector('input[name="edit-type"]:checked')?.value;
    const logo = document.getElementById("edit-logo").files[0];

    if (!name) { showToast("الرجاء إدخال اسم الشركة", "error"); return; }

    const btn = document.getElementById("editSubmitBtn");
    btn.classList.add("loading");

    try {
        const fd = new FormData();
        fd.append("name",          name);
        fd.append("shipping_type", type);
        if (logo) fd.append("logo", logo);

        const res = await fetch(`/api/shipping-companies/${id}`, { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error || "فشل التعديل");

        const updated = await res.json();
        const idx     = companies.findIndex((x) => x.id === updated.id);
        if (idx !== -1) companies[idx] = updated;

        renderCompaniesTable();
        updateStats();
        closeEditModal();
        showToast("تم تعديل بيانات الشركة بنجاح");
    } catch (err) {
        showToast(err.message || "حدث خطأ أثناء التعديل", "error");
    } finally {
        btn.classList.remove("loading");
    }
}

// ===================================================================
// Companies – Delete
// ===================================================================
function openDeleteModal(id, name) {
    deleteTarget = id;
    document.getElementById("deleteModalTxt").textContent =
        `هل أنت متأكد من حذف شركة "${name}"؟ سيتم إلغاء ارتباط جميع الطلبات المرتبطة بها.`;
    document.getElementById("deleteModal").classList.add("active");
}

function closeDeleteModal() {
    document.getElementById("deleteModal").classList.remove("active");
    deleteTarget = null;
}

async function confirmDelete() {
    if (!deleteTarget) return;

    const btn = document.getElementById("confirmDelBtn");
    btn.disabled = true;

    try {
        const res = await fetch(`/api/shipping-companies/${deleteTarget}`, { method: "DELETE" });
        if (!res.ok) throw new Error();

        companies = companies.filter((c) => c.id !== deleteTarget);
        renderCompaniesTable();
        updateStats();
        closeDeleteModal();
        showToast("تم حذف الشركة بنجاح");
    } catch {
        showToast("حدث خطأ أثناء الحذف", "error");
    } finally {
        btn.disabled = false;
    }
}

// ===================================================================
// Governorate Prices – Load & Render
// ===================================================================
async function loadGovPrices() {
    try {
        const res = await fetch("/api/governorate-prices");
        if (!res.ok) throw new Error();
        govPrices = await res.json();
        renderGovGrid();
    } catch {
        document.getElementById("govGrid").innerHTML =
            `<div class="sc-empty" style="grid-column:1/-1"><span class="bi bi-exclamation-circle"></span><p>حدث خطأ أثناء تحميل البيانات</p></div>`;
    }
}

// ===================================================================
// Company Governorate Prices Modal (for fixed/auto companies)
// ===================================================================
let currentGovPricesCompanyId = null;

async function openGovPricesModal(companyId, companyName) {
    currentGovPricesCompanyId = companyId;
    const modal = document.getElementById("govPricesModal");
    const title = document.getElementById("govPricesModalTitle");
    const grid  = document.getElementById("govPricesGrid");

    if (title) title.textContent = `أسعار شحن المحافظات – ${companyName}`;
    grid.innerHTML = `<div class="sc-loading"><span class="bi bi-hourglass-split"></span> جاري التحميل...</div>`;
    modal.classList.add("active");

    try {
        let prices = companyGovPricesCache[companyId];
        if (!prices) {
            const res = await fetch(`/api/shipping-companies/${companyId}/gov-prices`);
            if (!res.ok) throw new Error();
            prices = await res.json();
            companyGovPricesCache[companyId] = prices;
        }

        const priceMap = {};
        prices.forEach(p => priceMap[p.governorate_name] = p.price);

        grid.innerHTML = ALL_GOVERNORATES.map(gov => `
            <div class="co-gov-row">
                <span class="co-gov-name"><span class="bi bi-geo-alt-fill"></span> ${gov}</span>
                <input type="number" class="co-gov-input" data-gov="${gov}"
                       value="${priceMap[gov] !== undefined ? priceMap[gov] : ''}" min="0" step="1" placeholder="0" />
                <span class="co-gov-currency">جنيه</span>
            </div>`).join("");
    } catch {
        grid.innerHTML = `<div class="sc-empty" style="grid-column:1/-1"><span class="bi bi-exclamation-circle"></span><p>حدث خطأ</p></div>`;
    }
}

function closeGovPricesModal() {
    document.getElementById("govPricesModal").classList.remove("active");
    currentGovPricesCompanyId = null;
}

async function saveCompanyGovPrices() {
    if (!currentGovPricesCompanyId) return;

    const inputs = document.querySelectorAll(".co-gov-input");
    const prices = Array.from(inputs).map(inp => ({
        governorate_name: inp.dataset.gov,
        price: parseFloat(inp.value) || 0,
    }));

    const btn = document.getElementById("saveGovPricesBtn");
    btn.classList.add("loading");

    try {
        const res = await fetch(`/api/shipping-companies/${currentGovPricesCompanyId}/gov-prices/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prices }),
        });
        if (!res.ok) throw new Error();

        // Invalidate cache
        delete companyGovPricesCache[currentGovPricesCompanyId];
        showToast("تم حفظ أسعار المحافظات بنجاح");
        closeGovPricesModal();
    } catch {
        showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
        btn.classList.remove("loading");
    }
}

function renderGovGrid() {
    const grid = document.getElementById("govGrid");
    if (govPrices.length === 0) {
        grid.innerHTML = `<div class="sc-empty" style="grid-column:1/-1"><span class="bi bi-inbox"></span><p>لا توجد محافظات مسجّلة</p></div>`;
        return;
    }

    grid.innerHTML = govPrices.map((g) => `
        <div class="gov-row">
            <span class="gov-name"><span class="bi bi-geo-alt-fill" style="color:#596d52;margin-left:5px;"></span>${g.governorate_name}</span>
            <input type="number" class="gov-price-input" id="gov-${g.id}"
                   value="${g.price}" min="0" step="1"
                   data-id="${g.id}" data-name="${g.governorate_name}" />
            <span class="gov-currency">جنيه</span>
        </div>`).join("");
}

// ===================================================================
// Governorate Prices – Save All (Bulk)
// ===================================================================
async function saveAllGovPrices() {
    const inputs = document.querySelectorAll(".gov-price-input");
    const prices = Array.from(inputs).map((inp) => ({
        id:               parseInt(inp.dataset.id),
        governorate_name: inp.dataset.name,
        price:            parseFloat(inp.value) || 0,
    }));

    const btn = document.getElementById("saveGovBtn");
    btn.classList.add("loading");

    try {
        const res = await fetch("/api/governorate-prices/bulk-update", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ prices }),
        });
        if (!res.ok) throw new Error();
        showToast("تم حفظ أسعار المحافظات بنجاح");

        // Update local data
        prices.forEach((p) => {
            const idx = govPrices.findIndex((g) => g.id === p.id);
            if (idx !== -1) govPrices[idx].price = p.price;
        });
    } catch {
        showToast("حدث خطأ أثناء الحفظ", "error");
    } finally {
        btn.classList.remove("loading");
    }
}
