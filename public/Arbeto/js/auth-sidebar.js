/**
 * auth-sidebar.js
 * Handles: Login sidebar, Register sidebar, Guest modal, Cart localStorage, last_seen
 */

document.addEventListener("DOMContentLoaded", function () {
    // ── CSRF Token ────────────────────────────────────────────────
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || "";
    const isAuth = document.querySelector('meta[name="is-auth"]')?.content === "1";

    // ── DOM Refs ──────────────────────────────────────────────────
    const overlay = document.getElementById("authOverlay");
    const loginSidebar = document.getElementById("loginSidebar");
    const registerSidebar = document.getElementById("registerSidebar");

    const openLoginBtns = document.querySelectorAll(
        "#openLoginSidebar, #guestLoginBtn, #switchToRegister"
    );
    const openRegisterBtns = document.querySelectorAll(
        "#openRegisterSidebar, #guestRegisterBtn, #switchToLogin"
    );

    const closeLoginBtn = document.getElementById("closeLoginSidebar");
    const closeRegisterBtn = document.getElementById("closeRegisterSidebar");

    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");

    const loginSubmitBtn = document.getElementById("loginSubmitBtn");
    const registerSubmitBtn = document.getElementById("registerSubmitBtn");

    const guestModalOverlay = document.getElementById("guestModalOverlay");
    const closeGuestModal = document.getElementById("closeGuestModal");
    const guestModalMsg = document.getElementById("guestModalMsg");

    const cartCountBadge = document.getElementById("cartCount");

    // ── Sidebar helpers ───────────────────────────────────────────
    function openSidebar(sidebar) {
        closeSidebars();
        sidebar.classList.add("open");
        overlay.classList.add("active");
        document.body.classList.add("auth-open");
    }

    function closeSidebars() {
        if (loginSidebar) loginSidebar.classList.remove("open");
        if (registerSidebar) registerSidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
        document.body.classList.remove("auth-open");
        closeGuestModalFn();
    }

    function closeGuestModalFn() {
        if (guestModalOverlay) guestModalOverlay.classList.remove("active");
    }

    // Overlay does NOTHING on click (only X button closes)
    if (overlay) {
        overlay.addEventListener("click", function (e) {
            e.stopPropagation();
            // intentionally no action
        });
    }

    // Open login side bar
    document.querySelectorAll("#openLoginSidebar, #guestLoginBtn").forEach((btn) => {
        btn?.addEventListener("click", function (e) {
            e.preventDefault();
            closeGuestModalFn();
            if (loginSidebar) openSidebar(loginSidebar);
        });
    });

    // Open register sidebar
    document.querySelectorAll("#openRegisterSidebar, #guestRegisterBtn").forEach((btn) => {
        btn?.addEventListener("click", function (e) {
            e.preventDefault();
            closeGuestModalFn();
            if (registerSidebar) openSidebar(registerSidebar);
        });
    });

    // Switch between login ↔ register
    document.getElementById("switchToRegister")?.addEventListener("click", function (e) {
        e.preventDefault();
        if (registerSidebar) openSidebar(registerSidebar);
    });

    document.getElementById("switchToLogin")?.addEventListener("click", function (e) {
        e.preventDefault();
        if (loginSidebar) openSidebar(loginSidebar);
    });

    // Close buttons (X) only
    closeLoginBtn?.addEventListener("click", closeSidebars);
    closeRegisterBtn?.addEventListener("click", closeSidebars);
    closeGuestModal?.addEventListener("click", closeGuestModalFn);

    // ── Spinner helpers ───────────────────────────────────────────
    function showSpinner(btn) {
        btn.disabled = true;
        btn.querySelector(".btn-text").style.display = "none";
        btn.querySelector(".btn-spinner").style.display = "inline-flex";
    }

    function hideSpinner(btn) {
        btn.disabled = false;
        btn.querySelector(".btn-text").style.display = "inline";
        btn.querySelector(".btn-spinner").style.display = "none";
    }

    function showError(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.classList.add("visible");
    }

    function clearError(el) {
        if (!el) return;
        el.textContent = "";
        el.classList.remove("visible");
    }

    // ── localStorage cart ─────────────────────────────────────────
    const CART_KEY = "arbeto_guest_cart";

    function getLocalCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch {
            return [];
        }
    }

    function clearLocalCart() {
        localStorage.removeItem(CART_KEY);
    }

    // Add to local cart (used by product-interactions)
    window.addToLocalCart = function (productId, quantity) {
        const cart = getLocalCart();
        const existing = cart.find((i) => i.product_id == productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            cart.push({ product_id: productId, quantity: quantity });
        }
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateLocalCartBadge();
    };

    function updateLocalCartBadge() {
        if (isAuth) return; // server-side count already set
        const cart = getLocalCart();
        const total = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);
        if (cartCountBadge) cartCountBadge.textContent = total > 0 ? total : "";
    }

    updateLocalCartBadge();

    // ── Login ─────────────────────────────────────────────────────
    loginSubmitBtn?.addEventListener("click", async function () {
        clearError(loginError);
        const identifier = document.getElementById("loginIdentifier")?.value.trim();
        const password = document.getElementById("loginPassword")?.value;

        if (!identifier || !password) {
            showError(loginError, "يرجى تعبئة جميع الحقول");
            return;
        }

        showSpinner(loginSubmitBtn);

        try {
            const res = await fetch("/web-auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    identifier,
                    password,
                    cart_items: getLocalCart(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                clearLocalCart();
                // brief pause for spinner visibility then reload
                setTimeout(() => window.location.reload(), 600);
            } else {
                hideSpinner(loginSubmitBtn);
                showError(loginError, data.message || "البيانات التي ادخلتها غير صحيحة");
            }
        } catch (err) {
            hideSpinner(loginSubmitBtn);
            showError(loginError, "حدث خطأ في الاتصال، حاول مرة أخرى");
        }
    });

    // Allow Enter key for login
    ["loginIdentifier", "loginPassword"].forEach((id) => {
        document.getElementById(id)?.addEventListener("keydown", function (e) {
            if (e.key === "Enter") loginSubmitBtn?.click();
        });
    });

    // ── Register ──────────────────────────────────────────────────
    registerSubmitBtn?.addEventListener("click", async function () {
        clearError(registerError);

        const first_name = document.getElementById("regFirstName")?.value.trim();
        const last_name = document.getElementById("regLastName")?.value.trim();
        const phone = document.getElementById("regPhone")?.value.trim();
        const email = document.getElementById("regEmail")?.value.trim();
        const password = document.getElementById("regPassword")?.value;
        const gender = document.querySelector('input[name="regGender"]:checked')?.value || null;
        const address = document.getElementById("regAddress")?.value.trim();

        if (!first_name || !last_name || !phone || !email || !password) {
            showError(registerError, "يرجى تعبئة جميع الحقول المطلوبة");
            return;
        }

        if (password.length < 6) {
            showError(registerError, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            return;
        }

        showSpinner(registerSubmitBtn);

        try {
            const res = await fetch("/web-auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": csrfToken,
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    first_name,
                    last_name,
                    phone,
                    email,
                    password,
                    gender,
                    address,
                    cart_items: getLocalCart(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                clearLocalCart();
                setTimeout(() => window.location.reload(), 600);
            } else {
                hideSpinner(registerSubmitBtn);
                // Laravel validation errors
                if (data.errors) {
                    const msgs = Object.values(data.errors).flat().join(" | ");
                    showError(registerError, msgs);
                } else {
                    showError(registerError, data.message || "حدث خطأ أثناء إنشاء الحساب");
                }
            }
        } catch (err) {
            hideSpinner(registerSubmitBtn);
            showError(registerError, "حدث خطأ في الاتصال، حاول مرة أخرى");
        }
    });

    // ── Logout ────────────────────────────────────────────────────
    document.getElementById("logoutBtn")?.addEventListener("click", async function (e) {
        e.preventDefault();
        try {
            await fetch("/web-auth/logout", {
                method: "POST",
                headers: { "X-CSRF-TOKEN": csrfToken, Accept: "application/json" },
            });
        } finally {
            window.location.href = "/";
        }
    });

    // ── last_seen: Track online / offline ─────────────────────────
    if (isAuth) {
        // When user leaves the page → update last_seen timestamp
        window.addEventListener("beforeunload", function () {
            const formData = new FormData();
            formData.append("_token", csrfToken);
            navigator.sendBeacon("/web-auth/update-last-seen", formData);
        });
    }

    // ── Guest Modal (favorites / cart) ────────────────────────────
    window.showGuestModal = function (message) {
        if (guestModalMsg) guestModalMsg.textContent = message || "يجب تسجيل الدخول أولاً";
        if (guestModalOverlay) guestModalOverlay.classList.add("active");
    };

    // ── Cart icon click for guests: show notice ───────────────────
    const cartIconLink = document.querySelector(".cart-icon-link");
    if (cartIconLink && !isAuth) {
        cartIconLink.addEventListener("click", function (e) {
            e.preventDefault();
            showGuestModal("سجّل الدخول للمتابعة وإتمام الطلب");
        });
    }

    // ── Favorite icon click for guests ───────────────────────────
    const favoriteIcon = document.querySelector(".favorite-icon");
    if (favoriteIcon && !isAuth) {
        favoriteIcon.addEventListener("click", function (e) {
            e.preventDefault();
            showGuestModal("سجّل الدخول لحفظ المنتجات في المفضلة");
        });
    }
});
