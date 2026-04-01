// Cart and Favorites page interactions

const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
let activePromoCode = null; // { code, discount }

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
  toast.innerHTML = `<i class="bi ${icon}"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function createParticleExplosion(element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 16; i++) {
    const particle = document.createElement('div');
    Object.assign(particle.style, {
      position: 'fixed',
      left: centerX + 'px',
      top: centerY + 'px',
      width: '8px',
      height: '8px',
      background: '#2ecc71',
      borderRadius: '50%',
      pointerEvents: 'none',
      zIndex: '9999',
      transition: 'all 0.8s cubic-bezier(0.25,0.46,0.45,0.94)',
    });

    document.body.appendChild(particle);

    const angle = (Math.PI * 2 * i) / 16;
    const distance = 80 + Math.random() * 80;

    setTimeout(() => {
      particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
      particle.style.opacity = '0';
    }, 10);

    setTimeout(() => particle.remove(), 900);
  }
}

function updateCartBadge(count) {
  const badge = document.querySelector('#cartCount');
  if (badge !== null && count !== undefined) {
    badge.textContent = count;
  }
}

function updateTotal() {
  let subtotal = 0;

  document.querySelectorAll('.cart-item[data-price]').forEach((item) => {
    const price = parseFloat(item.dataset.price) || 0;
    const qty = parseInt(item.querySelector('.qty-value')?.textContent, 10) || 1;
    const itemTotal = price * qty;

    subtotal += itemTotal;

    const totalEl = item.querySelector('.item-total-val');
    if (totalEl) {
      totalEl.textContent = itemTotal.toFixed(2);
    }
  });

  const shipping = currentShippingFee;
  const discountRow = document.querySelector('.discount-row');
  const discountVal  = document.querySelector('.discount-val');

  let discount = 0;
  if (activePromoCode) {
    const isFixed = activePromoCode.discount_type === 'fixed';
    if (isFixed) {
      discount = Math.min(parseFloat(activePromoCode.discount_amount || 0), subtotal);
    } else {
      discount = subtotal * (activePromoCode.discount / 100);
    }
    if (discountRow) discountRow.style.display = 'flex';
    if (discountVal) discountVal.textContent = `- ${discount.toFixed(2)} جنية`;
    // update promo applied UI
    const appliedCode    = document.getElementById('promoAppliedCode');
    const appliedPercent = document.getElementById('promoAppliedPercent');
    const promoApplied   = document.getElementById('promoApplied');
    if (appliedCode)    appliedCode.textContent    = activePromoCode.code;
    if (appliedPercent) appliedPercent.textContent = isFixed
      ? `(خصم ${parseFloat(activePromoCode.discount_amount).toFixed(0)} جنيه)`
      : `(خصم ${activePromoCode.discount}%)`;
    if (promoApplied)   promoApplied.style.display  = 'flex';
  } else {
    if (discountRow) discountRow.style.display = 'none';
    if (discountVal) discountVal.textContent   = '0.00 جنية';
    const promoApplied = document.getElementById('promoApplied');
    if (promoApplied) promoApplied.style.display = 'none';
  }

  const total = subtotal + shipping - discount;

  const subtotalVal = document.getElementById('subtotalVal');
  const totalVal = document.getElementById('totalVal');
  const shippingVal = document.getElementById('shippingPriceVal');

  if (subtotalVal) subtotalVal.textContent = `${subtotal.toFixed(2)} جنية`;
  if (totalVal)    totalVal.textContent    = `${total.toFixed(2)} جنية`;
  if (shippingVal) {
    if (shippingFeeResolved) {
      shippingVal.textContent = `${shipping.toFixed(2)} جنية`;
    } else {
      shippingVal.textContent = 'اختر المحافظة لتحديد القيمة';
    }
  }

  const cartCount = document.querySelectorAll('.cart-item[data-cart-id]').length;
  const title = document.querySelector('.cart-title');
  if (title && title.textContent.includes('عربة')) {
    title.textContent = `عربة التسوق (${cartCount} منتجات)`;
  }
}

async function removeCartItem(button) {
  const item = button.closest('.cart-item');
  const cartId = item?.dataset?.cartId;
  if (!cartId) return;

  try {
    const response = await fetch(`/web/cart/${cartId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-TOKEN': csrf },
    });

    const data = await response.json();

    if (data.success || response.ok) {
      createParticleExplosion(item);
      item.style.transition = 'all 0.5s ease';
      item.style.opacity = '0';
      item.style.transform = 'scale(0.8)';

      setTimeout(() => {
        item.remove();
        updateTotal();
      }, 500);

      showToast('تم إزالة المنتج من السلة');
      updateCartBadge(data.cart_count);
    } else {
      showToast(data.error || 'حدث خطأ', 'error');
    }
  } catch {
    showToast('حدث خطأ في الاتصال', 'error');
  }
}

async function updateQuantity(item, newQty) {
  const cartId = item?.dataset?.cartId;
  if (!cartId || newQty < 1) return;

  try {
    const response = await fetch(`/web/cart/${cartId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrf,
      },
      body: JSON.stringify({ quantity: newQty }),
    });

    const data = await response.json();
    const qtyEl = item.querySelector('.qty-value');

    if (data.success || response.ok) {
      const serverQty = parseInt(data.quantity, 10);
      const finalQty = Number.isFinite(serverQty) && serverQty > 0 ? serverQty : newQty;
      if (qtyEl) qtyEl.textContent = finalQty;
      updateTotal();
      updateCartBadge(data.cart_count);
      return;
    }

    if (data?.available_quantity !== undefined) {
      const availableQty = parseInt(data.available_quantity, 10);
      if (Number.isFinite(availableQty) && availableQty > 0 && qtyEl) {
        qtyEl.textContent = availableQty;
        updateTotal();
      }
    }

    showToast(data.error || 'تعذر تحديث الكمية', 'error');
  } catch {
    showToast('تعذر تحديث الكمية', 'error');
  }
}

async function toggleFavoriteOnCart(button) {
  const item = button.closest('.cart-item');
  const productId = button.dataset.productId || item?.dataset?.productId;
  const icon = button.querySelector('i');
  const isActive = button.classList.toggle('active');

  if (isActive) {
    if (icon) icon.className = 'bi bi-heart-fill';
    button.style.color = '#e74c3c';
    showToast('تمت إضافة المنتج إلى المفضلة');

    if (productId && csrf) {
      try {
        const response = await fetch('/web/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf,
          },
          body: JSON.stringify({ product_id: productId }),
        });

        const data = await response.json();
        if (data.favorite_id) {
          button.dataset.favoriteId = data.favorite_id;
        }
      } catch {
        button.classList.remove('active');
        if (icon) icon.className = 'bi bi-heart';
        button.style.color = '';
        showToast('تعذر الحفظ في المفضلة', 'error');
      }
    }
  } else {
    if (icon) icon.className = 'bi bi-heart';
    button.style.color = '';
    showToast('تمت إزالة المنتج من المفضلة');

    const favoriteId = button.dataset.favoriteId;
    if (favoriteId && csrf) {
      fetch(`/web/favorites/${favoriteId}`, {
        method: 'DELETE',
        headers: { 'X-CSRF-TOKEN': csrf },
      }).catch(() => {
        showToast('تعذر إزالة المنتج من المفضلة', 'error');
      });
    }
  }
}

async function removeFavoriteItem(button) {
  const item = button.closest('.cart-item');
  const favoriteId = item?.dataset?.favoriteId;
  if (!favoriteId) return;

  try {
    const response = await fetch(`/web/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: { 'X-CSRF-TOKEN': csrf },
    });

    const data = await response.json();

    if (data.success || response.ok) {
      createParticleExplosion(item);
      item.style.transition = 'all 0.5s ease';
      item.style.opacity = '0';
      item.style.transform = 'scale(0.8)';

      setTimeout(() => {
        item.remove();
        const remaining = document.querySelectorAll('.cart-item[data-favorite-id]').length;
        const title = document.querySelector('.cart-title');
        if (title) {
          title.textContent = `قائمة المفضلة (${remaining} منتجات)`;
        }
      }, 500);

      showToast('تمت إزالة المنتج من المفضلة');
    } else {
      showToast(data.error || 'حدث خطأ', 'error');
    }
  } catch {
    showToast('حدث خطأ في الاتصال', 'error');
  }
}

async function moveFavoriteToCart(button) {
  const item = button.closest('.cart-item');
  const favoriteId = item?.dataset?.favoriteId;
  if (!favoriteId) return;

  button.disabled = true;
  button.innerHTML = '<i class="bi bi-hourglass-split"></i> جاري الإضافة...';

  try {
    const response = await fetch(`/web/favorites/${favoriteId}/move-to-cart`, {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrf },
    });

    const data = await response.json();

    if (data.success || response.ok) {
      createParticleExplosion(item);
      item.style.transition = 'all 0.5s ease';
      item.style.opacity = '0';
      item.style.transform = 'scale(0.8)';

      setTimeout(() => {
        item.remove();
        const remaining = document.querySelectorAll('.cart-item[data-favorite-id]').length;
        const title = document.querySelector('.cart-title');
        if (title) {
          title.textContent = `قائمة المفضلة (${remaining} منتجات)`;
        }
      }, 500);

      showToast('تمت إضافة المنتج إلى الحقيبة');
      updateCartBadge(data.cart_count);
    } else {
      showToast(data.error || 'حدث خطأ', 'error');
      button.disabled = false;
      button.innerHTML = '<i class="bi bi-bag-plus"></i> أضف للحقيبة';
    }
  } catch {
    showToast('حدث خطأ في الاتصال', 'error');
    button.disabled = false;
    button.innerHTML = '<i class="bi bi-bag-plus"></i> أضف للحقيبة';
  }
}

let selectedPaymentProofFile = null;
let currentShippingFee = 0; // 0 means not determined yet
let shippingFeeResolved = false; // whether a governorate was selected

function setupPaymentMethods() {
  const methods = document.querySelectorAll('input[name="payment-method"]');
  const walletBox = document.getElementById('payment-info');
  const instapayBox = document.getElementById('payment-info-ip');
  const walletInput = document.getElementById('paymentProofWallet');
  const instapayInput = document.getElementById('paymentProofInstapay');

  if (!methods.length) return;

  methods.forEach((method) => {
    method.addEventListener('change', () => {
      selectedPaymentProofFile = null;
      if (walletBox) walletBox.style.display = 'none';
      if (instapayBox) instapayBox.style.display = 'none';
      if (method.value === 'wallet' && walletBox) walletBox.style.display = 'block';
      if (method.value === 'instapay' && instapayBox) instapayBox.style.display = 'block';
    });
  });

  if (walletInput) {
    walletInput.addEventListener('change', () => {
      selectedPaymentProofFile = walletInput.files[0] || null;
      const nameEl  = document.getElementById('walletFileName');
      const infoEl  = document.getElementById('walletFileInfo');
      const labelEl = walletInput.closest('.receipt-upload-area')?.querySelector('.receipt-upload-label');
      if (selectedPaymentProofFile) {
        if (nameEl)  nameEl.textContent = selectedPaymentProofFile.name;
        if (infoEl)  infoEl.style.display = 'flex';
        if (labelEl) labelEl.style.display = 'none';
      } else {
        if (infoEl)  infoEl.style.display = 'none';
        if (labelEl) labelEl.style.display = 'flex';
      }
    });
  }

  if (instapayInput) {
    instapayInput.addEventListener('change', () => {
      selectedPaymentProofFile = instapayInput.files[0] || null;
      const nameEl  = document.getElementById('instapayFileName');
      const infoEl  = document.getElementById('instapayFileInfo');
      const labelEl = instapayInput.closest('.receipt-upload-area')?.querySelector('.receipt-upload-label');
      if (selectedPaymentProofFile) {
        if (nameEl)  nameEl.textContent = selectedPaymentProofFile.name;
        if (infoEl)  infoEl.style.display = 'flex';
        if (labelEl) labelEl.style.display = 'none';
      } else {
        if (infoEl)  infoEl.style.display = 'none';
        if (labelEl) labelEl.style.display = 'flex';
      }
    });
  }
}

function clearReceiptFile(type) {
  selectedPaymentProofFile = null;
  const inputId  = type === 'wallet' ? 'paymentProofWallet' : 'paymentProofInstapay';
  const infoId   = type === 'wallet' ? 'walletFileInfo' : 'instapayFileInfo';
  const input    = document.getElementById(inputId);
  const infoEl   = document.getElementById(infoId);
  const labelEl  = input?.closest('.receipt-upload-area')?.querySelector('.receipt-upload-label');
  if (input)  input.value = '';
  if (infoEl) infoEl.style.display = 'none';
  if (labelEl) labelEl.style.display = 'flex';
}

async function handleCheckout() {
  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
  const address = document.getElementById('addressInput')?.value?.trim()
    || document.querySelector('.address-input')?.value?.trim();

  const governorate = document.getElementById('govSelect')?.value?.trim() || '';
  const city        = document.getElementById('citySelect')?.value?.trim() || '';

  if (!paymentMethod) {
    showToast('الرجاء اختيار طريقة الدفع', 'error');
    return;
  }

  if (!governorate) {
    showToast('الرجاء اختيار المحافظة', 'error');
    return;
  }

  if (!city) {
    showToast('الرجاء اختيار المدينة', 'error');
    return;
  }

  if (!address) {
    showToast('الرجاء إدخال عنوان الشحن بالتفصيل', 'error');
    return;
  }

  if ((paymentMethod === 'instapay' || paymentMethod === 'wallet') && !selectedPaymentProofFile) {
    showToast('الرجاء إرفاق صورة إيصال الدفع', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitOrder');
  const originalHtml = submitBtn.innerHTML;
  submitBtn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-left:6px;"></span> جاري المعالجة...';
  submitBtn.disabled = true;

  const formData = new FormData();
  formData.append('payment_method', paymentMethod);
  formData.append('address', address);
  formData.append('governorate', governorate);
  formData.append('city', city);
  formData.append('express_price', currentShippingFee);
  if (selectedPaymentProofFile) {
    formData.append('payment_proof', selectedPaymentProofFile);
  }
  if (activePromoCode) {
    formData.append('promo_code', activePromoCode.code);
  }

  try {
    const response = await fetch('/web/orders', {
      method: 'POST',
      headers: { 'X-CSRF-TOKEN': csrf },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      showToast('تم تقديم طلبك بنجاح');

      document.querySelectorAll('.cart-item').forEach((el) => el.remove());
      const title = document.querySelector('.cart-title');
      if (title) title.textContent = 'عربة التسوق (0 منتجات)';

      updateCartBadge(0);
      updateTotal();

      setTimeout(() => {
        window.location.href = '/';
      }, 2500);
    } else {
      showToast(data.error || 'حدث خطأ أثناء تقديم الطلب', 'error');
      submitBtn.innerHTML = originalHtml;
      submitBtn.disabled = false;
    }
  } catch {
    showToast('حدث خطأ في الاتصال', 'error');
    submitBtn.innerHTML = originalHtml;
    submitBtn.disabled = false;
  }
}

async function applyPromoCode() {
  const promoInput = document.querySelector('.promo-input');
  const code = promoInput?.value?.trim();

  if (!code) {
    showToast('الرجاء إدخال كود الخصم', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/discount-codes/validate?code=${encodeURIComponent(code)}`);
    const data = await res.json();

    if (!data.valid) {
      activePromoCode = null;
      updateTotal();
      if (data.error === 'expired') {
        showToast('الكود منتهي الصلاحية', 'error');
      } else {
        showToast('كود الخصم غير موجود', 'error');
      }
      return;
    }

    activePromoCode = {
      code: data.code,
      discount: data.discount,
      discount_type: data.discount_type || 'percentage',
      discount_amount: data.discount_amount,
    };
    const isFixed = activePromoCode.discount_type === 'fixed';
    const label = isFixed
      ? `✅ تم تفعيل كود الخصم – خصم ${parseFloat(data.discount_amount).toFixed(0)} جنيه`
      : `✅ تم تفعيل كود الخصم – خصم ${data.discount}%`;
    showToast(label);
    updateTotal();
  } catch {
    showToast('حدث خطأ في التحقق من الكود', 'error');
  }
}

function removePromoCode() {
  activePromoCode = null;
  const promoInput = document.querySelector('.promo-input');
  if (promoInput) promoInput.value = '';
  updateTotal();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('spinStyle')) {
    const style = document.createElement('style');
    style.id = 'spinStyle';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  updateTotal();
  setupPaymentMethods();

  // Dynamic shipping price: fetch from global gov prices table when governorate changes
  const govSelectEl = document.getElementById('govSelect');
  if (govSelectEl) {
    govSelectEl.addEventListener('change', async () => {
      const gov = govSelectEl.value;
      if (!gov) { currentShippingFee = 0; shippingFeeResolved = false; updateTotal(); return; }
      try {
        const res = await fetch(`/api/governorate-prices/shipping-cost?governorate=${encodeURIComponent(gov)}`);
        if (res.ok) {
          const data = await res.json();
          currentShippingFee = data.price > 0 ? data.price : 50;
        } else {
          currentShippingFee = 50;
        }
      } catch { currentShippingFee = 50; }
      shippingFeeResolved = true;
      updateTotal();
    });

    // Auto-trigger if governorate is already pre-selected (from saved address)
    // Use setTimeout to ensure initGovCityCascade has set the value first
    setTimeout(() => {
      if (govSelectEl.value) {
        govSelectEl.dispatchEvent(new Event('change'));
      }
    }, 100);
  }

  document.body.addEventListener('click', (e) => {
    const removeCartBtn = e.target.closest('.cart-item[data-cart-id] .action-btn.remove');
    if (removeCartBtn) {
      removeCartItem(removeCartBtn);
      return;
    }

    const favCartBtn = e.target.closest('.cart-item[data-cart-id] .action-btn.favorite');
    if (favCartBtn) {
      toggleFavoriteOnCart(favCartBtn);
      return;
    }

    const minusBtn = e.target.closest('.cart-item[data-cart-id] .qty-btn.minus');
    if (minusBtn) {
      const item = minusBtn.closest('.cart-item');
      const qty = parseInt(item.querySelector('.qty-value')?.textContent, 10) || 1;
      if (qty > 1) updateQuantity(item, qty - 1);
      return;
    }

    const plusBtn = e.target.closest('.cart-item[data-cart-id] .qty-btn.plus');
    if (plusBtn) {
      const item = plusBtn.closest('.cart-item');
      const qty = parseInt(item.querySelector('.qty-value')?.textContent, 10) || 1;
      updateQuantity(item, qty + 1);
      return;
    }

    const removeFavBtn = e.target.closest('.cart-item[data-favorite-id] .action-btn.remove');
    if (removeFavBtn) {
      removeFavoriteItem(removeFavBtn);
      return;
    }

    const moveBtn = e.target.closest('.cart-item[data-favorite-id] .action-btn.move-to-cart');
    if (moveBtn) {
      moveFavoriteToCart(moveBtn);
      return;
    }

    const promoBtn = e.target.closest('.apply-promo-btn');
    if (promoBtn) {
      applyPromoCode();
      return;
    }

    const checkoutBtn = e.target.closest('#submitOrder');
    if (checkoutBtn) {
      handleCheckout();
      return;
    }
  });

  const promoInput = document.querySelector('.promo-input');
  if (promoInput) {
    promoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') applyPromoCode();
    });
  }
});
