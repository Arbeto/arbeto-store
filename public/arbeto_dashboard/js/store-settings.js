/**
 * store-settings.js — Dashboard Store Settings Page
 * Handles: logo upload, favicon upload, contact info save, social links save
 */

const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

/* ──────────── helpers ──────────── */
function showStatus(el, message, isError = false) {
    el.textContent = message;
    el.className = 'upload-status' + (isError ? ' error' : '');
    setTimeout(() => { el.textContent = ''; el.className = 'upload-status'; }, 4000);
}

function showSaveStatus(el, message, isError = false) {
    el.textContent = message;
    el.className = 'save-status' + (isError ? ' error' : '');
    setTimeout(() => { el.textContent = ''; el.className = 'save-status'; }, 4000);
}

function setSpinner(btn, active) {
    btn.querySelector('.btn-text').style.display   = active ? 'none'         : '';
    btn.querySelector('.btn-spinner').style.display = active ? 'inline-flex' : 'none';
    btn.disabled = active;
}

/* ──────────── Logo ──────────── */
// Track selected file separately from the upload action
let pendingLogoFile = null;

document.getElementById('logoInput')?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    pendingLogoFile = file;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => { document.getElementById('logoPreview').src = e.target.result; };
    reader.readAsDataURL(file);

    // Enable the save button and show hint
    const btn = document.getElementById('saveLogoBtn');
    btn.disabled = false;
    showStatus(document.getElementById('logoStatus'), 'اختر "تحديث اللوجو" لحفظ التغيير');
});

async function uploadLogo() {
    if (!pendingLogoFile) return;

    const btn      = document.getElementById('saveLogoBtn');
    const statusEl = document.getElementById('logoStatus');
    setSpinner(btn, true);

    const formData = new FormData();
    formData.append('logo', pendingLogoFile);
    formData.append('_token', csrfToken);

    try {
        const res  = await fetch('/api/store-settings/logo', { method: 'POST', body: formData });
        const data = await res.json();
        setSpinner(btn, false);
        if (data.success) {
            document.getElementById('logoPreview').src = data.logo_url + '?t=' + Date.now();
            pendingLogoFile = null;
            btn.disabled = true;
            showStatus(statusEl, '✔ تم تحديث اللوجو بنجاح');
        } else {
            showStatus(statusEl, data.message || 'حدث خطأ أثناء الرفع', true);
        }
    } catch {
        setSpinner(btn, false);
        showStatus(statusEl, 'حدث خطأ في الاتصال', true);
    }
}

/* ──────────── Favicon ──────────── */
let pendingFaviconFile = null;

document.getElementById('faviconInput')?.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    pendingFaviconFile = file;

    const reader = new FileReader();
    reader.onload = (e) => { document.getElementById('faviconPreview').src = e.target.result; };
    reader.readAsDataURL(file);

    const btn = document.getElementById('saveFaviconBtn');
    btn.disabled = false;
    showStatus(document.getElementById('faviconStatus'), 'اختر "تحديث الأيقونة" لحفظ التغيير');
});

async function uploadFavicon() {
    if (!pendingFaviconFile) return;

    const btn      = document.getElementById('saveFaviconBtn');
    const statusEl = document.getElementById('faviconStatus');
    setSpinner(btn, true);

    const formData = new FormData();
    formData.append('favicon', pendingFaviconFile);
    formData.append('_token', csrfToken);

    try {
        const res  = await fetch('/api/store-settings/favicon', { method: 'POST', body: formData });
        const data = await res.json();
        setSpinner(btn, false);
        if (data.success) {
            document.getElementById('faviconPreview').src = data.favicon_url + '?t=' + Date.now();
            pendingFaviconFile = null;
            btn.disabled = true;
            showStatus(statusEl, '✔ تم تحديث الأيقونة بنجاح');
        } else {
            showStatus(statusEl, data.message || 'حدث خطأ أثناء الرفع', true);
        }
    } catch {
        setSpinner(btn, false);
        showStatus(statusEl, 'حدث خطأ في الاتصال', true);
    }
}

/* ──────────── Save Contact Info ──────────── */
async function saveContact() {
    const btn      = document.getElementById('saveContactBtn');
    const statusEl = document.getElementById('contactStatus');
    setSpinner(btn, true);

    const body = {
        support_email: document.getElementById('supportEmail')?.value.trim() || null,
        support_phone: document.getElementById('supportPhone')?.value.trim() || null,
    };

    try {
        const res  = await fetch('/api/store-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        setSpinner(btn, false);
        if (data.success) {
            showSaveStatus(statusEl, '✔ تم حفظ بيانات التواصل بنجاح');
        } else {
            const msg = data.errors ? Object.values(data.errors).flat().join(' | ') : (data.message || 'حدث خطأ');
            showSaveStatus(statusEl, msg, true);
        }
    } catch {
        setSpinner(btn, false);
        showSaveStatus(statusEl, 'حدث خطأ في الاتصال', true);
    }
}

/* ──────────── Save Social Links ──────────── */
async function saveSocial() {
    const btn      = document.getElementById('saveSocialBtn');
    const statusEl = document.getElementById('socialStatus');
    setSpinner(btn, true);

    const body = {
        facebook_url:  document.getElementById('facebookUrl')?.value.trim()  || null,
        instagram_url: document.getElementById('instagramUrl')?.value.trim() || null,
        twitter_url:   document.getElementById('twitterUrl')?.value.trim()   || null,
        whatsapp_url:  document.getElementById('whatsappUrl')?.value.trim()   || null,
        youtube_url:   document.getElementById('youtubeUrl')?.value.trim()   || null,
        tiktok_url:    document.getElementById('tiktokUrl')?.value.trim()    || null,
    };

    try {
        const res  = await fetch('/api/store-settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        setSpinner(btn, false);
        if (data.success) {
            showSaveStatus(statusEl, '✔ تم حفظ روابط السوشيال بنجاح');
        } else {
            const msg = data.errors ? Object.values(data.errors).flat().join(' | ') : (data.message || 'حدث خطأ');
            showSaveStatus(statusEl, msg, true);
        }
    } catch {
        setSpinner(btn, false);
        showSaveStatus(statusEl, 'حدث خطأ في الاتصال', true);
    }
}
