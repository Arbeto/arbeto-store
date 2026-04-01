document.addEventListener('DOMContentLoaded', () => {
    const isAuth = document.querySelector('meta[name="is-auth"]')?.content === '1';
    const csrf   = document.querySelector('meta[name="csrf-token"]')?.content;

    // 0. Inject Share Modal HTML
    if (!document.getElementById('shareModal')) {
        const modalHTML = `
        <div class="share-modal" id="shareModal">
          <div class="share-content">
            <button class="close-share" id="closeShare">
              <i class="bi bi-x"></i>
            </button>
            <div class="share-header">
              <h3>مشاركة المنتج</h3>
              <p>انسخ الرابط أو شاركه عبر الوسائل التالية</p>
            </div>
            <div class="share-input-group">
              <input
                type="text"
                id="shareLink"
                readonly
                value=""
              />
              <button class="copy-btn" id="copyBtn">نسخ</button>
            </div>
            <div class="social-share-btns">
              <a href="#" target="_blank" class="social-btn facebook" id="shareFB"
                ><i class="bi bi-facebook"></i
              ></a>
              <a href="#" target="_blank" class="social-btn whatsapp" id="shareWA"
                ><i class="bi bi-whatsapp"></i
              ></a>
              <a href="#" target="_blank" class="social-btn twitter" id="shareTW"
                ><i class="bi bi-twitter-x"></i
              ></a>
            </div>
          </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Toast container
    const toastContainer = document.createElement('div');
    toastContainer.classList.add('toast-container');
    document.body.appendChild(toastContainer);

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.innerText = message;
        toastContainer.appendChild(toast);
        toast.offsetHeight; // force reflow
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Share modal references
    const shareModal     = document.getElementById('shareModal');
    const closeShare     = document.getElementById('closeShare');
    const copyBtn        = document.getElementById('copyBtn');
    const shareLinkInput = document.getElementById('shareLink');

    if (closeShare) {
        closeShare.addEventListener('click', () => shareModal.classList.remove('active'));
    }
    window.addEventListener('click', (e) => {
        if (e.target === shareModal) shareModal.classList.remove('active');
    });
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            shareLinkInput.select();
            document.execCommand('copy');
            const orig = copyBtn.innerText;
            copyBtn.innerText = 'تم النسخ!';
            copyBtn.style.background = '#05af25';
            setTimeout(() => {
                copyBtn.innerText = orig;
                copyBtn.style.background = '#2c4b2c';
            }, 2000);
            showToast('تم نسخ الرابط!');
        });
    }

    // Cart elements (resolved once, stable across page lifetime)
    const cartIcon      = document.querySelector('.bi-bag-fill.bag-order');
    const quantityBadge = document.querySelector('.quntity');

    function runFlyAnimation(productImg, isGuest) {
        if (!productImg || !cartIcon) return;
        const flyingImg = productImg.cloneNode();
        flyingImg.classList.add('flying-img');
        const imgRect  = productImg.getBoundingClientRect();
        const cartRect = cartIcon.getBoundingClientRect();
        flyingImg.style.width  = `${imgRect.width}px`;
        flyingImg.style.height = `${imgRect.height}px`;
        flyingImg.style.top    = `${imgRect.top}px`;
        flyingImg.style.left   = `${imgRect.left}px`;
        document.body.appendChild(flyingImg);
        setTimeout(() => {
            flyingImg.style.top        = `${cartRect.top + 10}px`;
            flyingImg.style.left       = `${cartRect.left + 10}px`;
            flyingImg.style.width      = '40px';
            flyingImg.style.height     = '40px';
            flyingImg.style.opacity    = '0';
            flyingImg.style.transform  = 'rotate(360deg)';
            flyingImg.style.transition = 'all 1s cubic-bezier(0.42, 0, 0.58, 1)';
        }, 10);
        setTimeout(() => {
            flyingImg.remove();
            cartIcon.classList.add('swallow-anim');
            setTimeout(() => cartIcon.classList.remove('swallow-anim'), 400);
            if (isGuest && quantityBadge) {
                quantityBadge.innerText = (parseInt(quantityBadge.innerText) || 0) + 1;
            }
            if (!isGuest) showToast('تمت إضافة المنتج إلى الحقيبة');
        }, 1000);
    }

    // ── Event delegation: .favorite ──
    // Works for both static and dynamically added cards
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.favorite');
        if (!btn) return;
        e.preventDefault();
        if (!isAuth) {
            if (typeof window.showGuestModal === 'function') {
                window.showGuestModal('سجّل الدخول لحفظ المنتجات في المفضلة');
            }
            return;
        }
        const productCard = btn.closest('.card-product');
        const productId   = btn.dataset.productId || productCard?.dataset?.productId;
        const isActive    = btn.classList.toggle('active');
        const icon        = btn.querySelector('i');
        if (isActive) {
            if (icon) icon.className = 'bi bi-heart-fill';
            showToast('تمت إضافة المنتج إلى المفضلة');
            if (productId && csrf) {
                fetch('/web/favorites', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                    body:    JSON.stringify({ product_id: productId }),
                })
                .then(r => r.json())
                .then(data => {
                    if (data.favorite_id) btn.dataset.favoriteId = data.favorite_id;
                })
                .catch(() => {
                    btn.classList.remove('active');
                    if (icon) icon.className = 'bi bi-heart';
                    showToast('حدث خطأ', 'error');
                });
            }
        } else {
            if (icon) icon.className = 'bi bi-heart';
            showToast('تمت إزالة المنتج من المفضلة');
            const favId = btn.dataset.favoriteId;
            if (favId && csrf) {
                fetch('/web/favorites/' + favId, {
                    method:  'DELETE',
                    headers: { 'X-CSRF-TOKEN': csrf },
                })
                .catch(() => {
                    btn.classList.add('active');
                    if (icon) icon.className = 'bi bi-heart-fill';
                });
            }
        }
    });

    // ── Event delegation: .share ──
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.share');
        if (!btn || !shareModal) return;
        e.preventDefault();
        // Use the product's own page URL when sharing from a card
        const card        = btn.closest('.card-product');
        const cardLink    = card?.querySelector('a[href]')?.getAttribute('href');
        const productUrl  = cardLink
            ? new URL(cardLink, window.location.origin).href
            : window.location.href;
        shareLinkInput.value = productUrl;
        const encoded    = encodeURIComponent(productUrl);
        const title      = encodeURIComponent('اكتشف هذا المنتج الرائع على Arbeto!');
        const fb = document.getElementById('shareFB');
        const wa = document.getElementById('shareWA');
        const tw = document.getElementById('shareTW');
        if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
        if (wa) wa.href = `https://api.whatsapp.com/send?text=${title}%20${encoded}`;
        if (tw) tw.href = `https://twitter.com/intent/tweet?url=${encoded}&text=${title}`;
        shareModal.classList.add('active');
    });

    // ── Event delegation: .add (add to cart) ──
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.add');
        if (!btn) return;
        e.preventDefault();
        const productCard = btn.closest('.card-product');
        const productImg  = productCard?.querySelector('img');
        const productId   = btn.dataset.productId || productCard?.dataset?.productId;
        if (!isAuth) {
            if (typeof window.addToLocalCart === 'function' && productId) {
                window.addToLocalCart(productId, 1);
            }
            runFlyAnimation(productImg, true);
            showToast('تمت إضافة المنتج إلى الحقيبة');
            return;
        }
        if (productId && csrf) {
            fetch('/web/cart', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
                body:    JSON.stringify({ product_id: productId, quantity: 1 }),
            })
            .then(async (r) => {
                const data = await r.json().catch(() => ({}));
                return { ok: r.ok, data };
            })
            .then(({ ok, data }) => {
                if (ok && (data.success || data.success === undefined)) {
                    if (data.cart_count !== undefined && quantityBadge) {
                        quantityBadge.textContent = data.cart_count;
                    }
                    runFlyAnimation(productImg, false);
                    showToast('تمت إضافة المنتج إلى الحقيبة');
                    return;
                }

                showToast(data.error || 'حدث خطأ أثناء الإضافة', 'error');
            })
            .catch(() => {
                showToast('حدث خطأ في الاتصال', 'error');
            });
            return;
        }
        showToast('حدث خطأ أثناء الإضافة', 'error');
    });

    // Expose no-op for backward compatibility (event delegation handles everything)
    window.initProductInteractions = function () {};
});