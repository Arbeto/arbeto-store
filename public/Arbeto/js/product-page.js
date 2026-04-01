
document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // Product Gallery Logic
  // ==========================================
  const mainImageContainer = document.getElementById('mainImageContainer');
  const mainImage = document.getElementById('mainImage');
  const thumbnailStrip = document.getElementById('thumbnailStrip');
  const thumbPrevBtn = document.querySelector('.thumb-nav-btn.prev');
  const thumbNextBtn = document.querySelector('.thumb-nav-btn.next');
  const thumbnails = thumbnailStrip ? thumbnailStrip.querySelectorAll('img') : [];

  // Zoom Effect
  if (mainImageContainer && mainImage) {
    mainImageContainer.addEventListener('mousemove', (e) => {
      const rect = mainImageContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Calculate percentage position
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      // Apply transformation
      mainImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
      mainImage.style.transform = 'scale(2.5)'; // Zoom level
    });

    mainImageContainer.addEventListener('mouseleave', () => {
      mainImage.style.transformOrigin = 'center center';
      mainImage.style.transform = 'scale(1)';
    });
  }

  // Thumbnail Click
  thumbnails.forEach(thumb => {
    thumb.addEventListener('click', function() {
      // Update main image source
      mainImage.src = this.src;

      // Update active class
      thumbnails.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Thumbnail Navigation (Scroll)
  const SCROLL_AMOUNT = 100; // px
  if (thumbPrevBtn) {
    thumbPrevBtn.addEventListener('click', () => {
      thumbnailStrip.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
    });
  }

  if (thumbNextBtn) {
    thumbNextBtn.addEventListener('click', () => {
      thumbnailStrip.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' }); // Scroll right
    });
  }

  // Reviews count quick jump (only when reviews_count > 0)
  const reviewsTriggerBtn = document.getElementById('reviewsCountTrigger');
  const reviewsTabBtn = document.querySelector('.tab-btn[data-tab="reviews"]');
  const reviewsContent = document.querySelector('.tab-content[data-content="reviews"]');

  function scrollToReviewsSection() {
    if (reviewsTabBtn) {
      reviewsTabBtn.click();
    } else if (reviewsContent) {
      document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));
      reviewsContent.classList.add('active');
    }

    const target = reviewsContent || document.querySelector('.det');
    if (!target) return;

    setTimeout(() => {
      const top = target.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
    }, 120);
  }

  if (reviewsTriggerBtn) {
    reviewsTriggerBtn.addEventListener('click', () => {
      const count = parseInt(reviewsTriggerBtn.dataset.reviewsCount || '0', 10);
      if (!Number.isFinite(count) || count < 1) return;
      scrollToReviewsSection();
    });
  }

  // ==========================================
  // Review Image Modal Logic
  // ==========================================
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  const closeModal = document.querySelector('.close-modal');
  const modalNext = document.querySelector('.modal-next');
  const modalPrev = document.querySelector('.modal-prev');

  // Collect all review images
  let currentImages = []; // Context: either review images or product images
  let currentIndex = 0;

  // Function to open modal with a specific set of images and index
  function openModal(imagesSet, index) {
    if (!modal) return;
    currentImages = imagesSet;
    currentIndex = index;
    modal.style.display = 'flex';
    updateModalImage();
  }

  function updateModalImage() {
    modalImg.src = currentImages[currentIndex];
  }

  function closeModalFunc() {
    modal.style.display = 'none';
  }

  // Setup Review Images
  const reviewImgElements = document.querySelectorAll('.review-images img');
  const reviewImagesPaths = Array.from(reviewImgElements).map(img => img.src);

  reviewImgElements.forEach((img, index) => {
    img.addEventListener('click', () => {
      openModal(reviewImagesPaths, index);
    });
  });

  // Setup Main Product Image click for gallery
  if (mainImage) {
    mainImage.addEventListener('click', (e) => {
      // If we are hovering (zooming), we might want to click to open modal
      // We'll collect all thumbnails as the gallery
      const productImagesPaths = Array.from(thumbnails).map(t => t.src);
      const activeThumbIndex = Array.from(thumbnails).findIndex(t => t.classList.contains('active'));
      openModal(productImagesPaths, activeThumbIndex !== -1 ? activeThumbIndex : 0);
    });
  }

  // Close Button
  if (closeModal) {
    closeModal.addEventListener('click', closeModalFunc);
  }

  // Close on Outside Click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModalFunc();
      }
    });
  }

  // Navigation
  if (modalNext) {
    modalNext.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent closing modal
      currentIndex = (currentIndex + 1) % currentImages.length;
      updateModalImage();
    });
  }

  if (modalPrev) {
    modalPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
      updateModalImage();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (modal.style.display === 'flex') {
      if (e.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % currentImages.length;
        updateModalImage();
      } else if (e.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        updateModalImage();
      } else if (e.key === 'Escape') {
        closeModalFunc();
      }
    }
  });

  // ==========================================
  // خيارات المنتج (اللون، المقاس، الخ) + تغيير الصور + Ajax
  // ==========================================
  const optionButtons = document.querySelectorAll('.options-item .btn-dev');
  const selectedOptions = {}; // { groupTitle: { optionId, optionName, price } }

  // Enhanced Ajax function to sync option selection with server
  async function syncOptionSelection(productId, selectedOptions) {
    if (!isAuth || !csrf) return;

    try {
      await fetch('/web/product-options/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrf
        },
        body: JSON.stringify({
          product_id: productId,
          selected_options: selectedOptions,
          current_price: getCurrentPrice()
        })
      });
    } catch (error) {
      console.log('Option sync failed (non-critical):', error);
    }
  }

  // Get current effective price including custom pricing
  function getCurrentPrice() {
    let effectivePrice = originalPrice;
    Object.values(selectedOptions).forEach(option => {
      const customPrice = parseFloat(option.price);
      if (option.price && !isNaN(customPrice) && customPrice > 0) {
        effectivePrice = customPrice;
      }
    });
    return effectivePrice;
  }

  // Get original product images from data attributes
  const productMain = document.querySelector('main.item');
  const originalImages = productMain ? JSON.parse(productMain.dataset.productImages || '[]') : [];
  const originalPrimaryIndex = productMain ? parseInt(productMain.dataset.primaryIndex || '0') : 0;

  // Get original product price from page
  const originalPriceElement = document.querySelector('.now-price h3');
  const originalPrice = originalPriceElement ? parseFloat(originalPriceElement.textContent.replace(/[^\d.]/g, '')) : 0;

  // Function to reset price to original when no options selected
  // Function to reset price to original when no options selected - Enhanced
  function resetToOriginalPrice() {
    const originalPriceElement = document.querySelector('.now-price h3');
    if (originalPriceElement) {
      originalPriceElement.style.transition = 'all 0.3s ease';
      originalPriceElement.textContent = originalPrice.toLocaleString('ar-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
      originalPriceElement.style.color = '';
      originalPriceElement.style.fontWeight = '';
    }
    removePriceIndicator();
  }

  // Function to update product price based on selected options - Enhanced
  function updateProductPrice() {
    const originalPriceElement = document.querySelector('.now-price h3');

    if (!originalPriceElement) return originalPrice;

    // إذا لم يتم اختيار أي خيارات، استخدم السعر الأساسي
    if (Object.keys(selectedOptions).length === 0) {
      resetToOriginalPrice();
      return originalPrice;
    }

    let finalPrice = originalPrice;
    let hasCustomPrice = false;
    let selectedOptionName = '';

    // البحث عن أول سعر مخصص من الاختيارات المحددة
    Object.values(selectedOptions).forEach(option => {
      const customPrice = parseFloat(option.price);
      if (option.price && !isNaN(customPrice) && customPrice > 0) {
        finalPrice = customPrice;
        hasCustomPrice = true;
        selectedOptionName = option.optionName;
      }
    });

    // تحديث عرض السعر مع تأثير بصري
    if (originalPriceElement) {
      // إضافة تأثير انتقال
      originalPriceElement.style.transition = 'all 0.3s ease';
      originalPriceElement.style.transform = 'scale(1.05)';

      setTimeout(() => {
        originalPriceElement.textContent = finalPrice.toLocaleString('ar-EG', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });

        // إضافة مؤشر للسعر المخصص
        if (hasCustomPrice) {
          showPriceIndicator(selectedOptionName);
          originalPriceElement.style.color = '#2c4b2c';
          originalPriceElement.style.fontWeight = '700';
        } else {
          removePriceIndicator();
          originalPriceElement.style.color = '';
          originalPriceElement.style.fontWeight = '';
        }

        originalPriceElement.style.transform = 'scale(1)';
      }, 150);
    }

    return finalPrice;
  }

  // إضافة مؤشر للسعر المخصص
  function showPriceIndicator(optionName) {
    removePriceIndicator(); // إزالة أي مؤشر موجود

    const priceContainer = document.querySelector('.price');
    if (priceContainer) {
      const indicator = document.createElement('div');
      indicator.className = 'custom-price-indicator';
      indicator.innerHTML = `
        <i class="bi bi-tag-fill"></i>
        <span>سعر ${optionName}</span>
      `;
      indicator.style.cssText = `
        color: #2c4b2c;
        font-size: 12px;
        font-weight: 600;
        margin-top: 5px;
        display: flex;
        align-items: center;
        gap: 5px;
        animation: fadeInUp 0.3s ease;
      `;
      priceContainer.appendChild(indicator);
    }
  }

  // إزالة مؤشر السعر المخصص
  function removePriceIndicator() {
    const existing = document.querySelector('.custom-price-indicator');
    if (existing) existing.remove();
  }

  // Function to update image gallery with new images - Enhanced
  function updateImageGallery(images, primaryIndex = 0) {
    // إذا لم يتم توفير صور أو كانت القائمة فارغة، استخدم الصور الأساسية
    if (!images || !images.length) {
      images = originalImages;
      primaryIndex = originalPrimaryIndex;
    }

    // إذا كانت الصور الأساسية أيضاً فارغة، اخرج من الوظيفة
    if (!images || !images.length) {
      return;
    }

    // تأكد من أن primaryIndex ضمن النطاق الصحيح
    if (primaryIndex >= images.length || primaryIndex < 0) {
      primaryIndex = 0;
    }

    // Add loading transition to main image
    if (mainImage) {
      mainImage.style.transition = 'opacity 0.3s ease';
      mainImage.style.opacity = '0.7';
    }

    // Update main image with smooth transition
    const primaryImage = images[primaryIndex] || images[0];
    if (mainImage && primaryImage) {
      const imageUrl = primaryImage.startsWith('http') ? primaryImage : `/${primaryImage}`;

      // Preload image to ensure smooth transition
      const preloadImg = new Image();
      preloadImg.onload = () => {
        mainImage.src = imageUrl;
        mainImage.style.opacity = '1';

        // Add visual indicator for option image change
        showImageChangeIndicator();
      };
      preloadImg.src = imageUrl;
    }

    // Clear and rebuild thumbnails with animation
    if (thumbnailStrip) {
      // Fade out existing thumbnails
      const existingThumbs = thumbnailStrip.querySelectorAll('img');
      existingThumbs.forEach(thumb => {
        thumb.style.transition = 'opacity 0.2s ease';
        thumb.style.opacity = '0';
      });

      setTimeout(() => {
        thumbnailStrip.innerHTML = '';

        images.forEach((img, idx) => {
          const thumb = document.createElement('img');
          thumb.src = img.startsWith('http') ? img : `/${img}`;
          thumb.alt = 'Product Image';
          thumb.classList.add(idx === primaryIndex ? 'active' : '');

          // Add fade-in animation to new thumbnails
          thumb.style.opacity = '0';
          thumb.style.transition = 'opacity 0.3s ease';

          // Add click handler for new thumbnails
          thumb.addEventListener('click', function() {
            mainImage.style.transition = 'opacity 0.2s ease';
            mainImage.style.opacity = '0.7';

            setTimeout(() => {
              mainImage.src = this.src;
              mainImage.style.opacity = '1';
            }, 100);

            // Update active class for all thumbnails in the current set
            const allThumbs = thumbnailStrip.querySelectorAll('img');
            allThumbs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
          });

          thumbnailStrip.appendChild(thumb);

          // Trigger fade-in
          setTimeout(() => {
            thumb.style.opacity = '1';
          }, 50 + (idx * 50));
        });
      }, 200);
    }
  }

  // Show visual indicator when images change due to option selection
  function showImageChangeIndicator() {
    const mainImageContainer = document.getElementById('mainImageContainer');
    if (!mainImageContainer) return;

    const indicator = document.createElement('div');
    indicator.className = 'image-change-indicator';
    indicator.innerHTML = '<i class="bi bi-images"></i>';
    indicator.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(65, 100, 65, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 10;
      animation: slideInLeft 0.3s ease, fadeOut 0.5s ease 2s forwards;
    `;

    mainImageContainer.style.position = 'relative';
    mainImageContainer.appendChild(indicator);

    setTimeout(() => {
      if (indicator.parentElement) {
        indicator.remove();
      }
    }, 2500);
  }

  // Function to show option quantity message - Enhanced
  function showOptionQuantityMessage(optionButton, quantity) {
    // Remove any existing quantity messages in the entire options container
    const optionsContainer = optionButton.closest('.options-item');
    const existingMessages = optionsContainer.querySelectorAll('.option-qty-message');
    existingMessages.forEach(msg => msg.remove());

    // Only show message if quantity has a value (not null, undefined, empty, or '0')
    if (quantity !== null && quantity !== undefined && quantity !== '' && quantity !== '0' && quantity != 0) {
      const quantityMessage = document.createElement('div');
      quantityMessage.className = 'option-qty-message';
      quantityMessage.innerHTML = `
        <i class="bi bi-exclamation-circle-fill" style="margin-left: 5px;"></i>
        المتبقى (<strong>${quantity}</strong>)
      `;
      quantityMessage.style.cssText = `
        color: #c0392b;
        font-size: 14px;
        font-weight: 600;
        margin-top: 8px;
        text-align: center;
        background: rgba(195, 57, 43, 0.1);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(195, 57, 43, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: slideInDown 0.3s ease-out;
      `;

      // Insert after the option button's parent container
      const buttonContainer = optionButton.parentElement;
      buttonContainer.insertAdjacentElement('afterend', quantityMessage);

      // Enhanced auto-hide with fade effect
      setTimeout(() => {
        if (quantityMessage.parentElement) {
          quantityMessage.style.transition = 'all 0.4s ease-out';
          quantityMessage.style.opacity = '0';
          quantityMessage.style.transform = 'translateY(-10px)';
          setTimeout(() => quantityMessage.remove(), 400);
        }
      }, 4000);
    }
  }

  optionButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // إيجاد مجموعة الخيار
      const optionGroup = this.closest('.options-item > div') || this.closest('.second-option');
      const groupContainer = this.closest('.options-item');

      if (!groupContainer) return;

      // إيجاد عنوان المجموعة
      const groupTitleEl = this.closest('.options-item').querySelector(':scope > span');
      const groupTitle = groupTitleEl ? groupTitleEl.textContent.trim() : 'خيار';

      // التحقق من إلغاء الاختيار (إذا كان الزر نشط بالفعل)
      const isCurrentlyActive = this.classList.contains('active');

      // إزالة الـ active من باقي الأزرار في نفس المجموعة
      const siblingBtns = this.closest('.second-option').querySelectorAll('.btn-dev');
      siblingBtns.forEach(sb => sb.classList.remove('active'));

      if (isCurrentlyActive) {
        // إلغاء الاختيار
        delete selectedOptions[groupTitle];
        // العودة للصور والسعر الأساسي
        updateImageGallery(originalImages, originalPrimaryIndex);
        updateProductPrice(); // هذا سيستدعي resetToOriginalPrice تلقائياً إذا لم تكن هناك اختيارات
        return;
      }

      // إضافة active للزر الحالي
      this.classList.add('active');

      // Get option data with enhanced null handling
      const optionQuantity = this.dataset.qty;
      const customPrice = this.dataset.price;
      const hasImages = this.dataset.hasImages === 'true';
      const optionImages = this.dataset.optionImages;
      const primaryImage = this.dataset.primaryImage;

      // Enhanced null value validation
      const isValidQuantity = optionQuantity && optionQuantity !== 'null' && optionQuantity !== '' && optionQuantity !== '0';
      const isValidPrice = customPrice && customPrice !== 'null' && customPrice !== '' && !isNaN(parseFloat(customPrice)) && parseFloat(customPrice) > 0;
      const isValidImages = hasImages && optionImages && optionImages !== 'null' && optionImages !== '[]' && optionImages !== '';

      // حفظ الاختيار مع معالجة محسنة للقيم الفارغة
      selectedOptions[groupTitle] = {
        optionId: this.dataset.optionId,
        optionName: this.textContent.trim(),
        price: isValidPrice ? customPrice : null
      };

      // عرض رسالة الكمية المتبقية فقط إذا كانت صحيحة
      if (isValidQuantity) {
        showOptionQuantityMessage(this, optionQuantity);
      }

      // تحديث السعر بناءً على الاختيار
      updateProductPrice();

      // Sync with server (non-blocking)
      const productId = document.querySelector('[data-product-id]')?.dataset.productId;
      if (productId) {
        syncOptionSelection(productId, selectedOptions);
      }

      // تغيير الصور إذا كان للخيار صور صحيحة
      if (isValidImages) {
        try {
          const parsedImages = JSON.parse(optionImages || '[]');

          if (parsedImages.length > 0) {
            // Find primary image index with better validation
            let primaryIndex = 0;
            if (primaryImage && primaryImage !== 'null' && primaryImage !== '') {
              const foundIndex = parsedImages.findIndex(img => img === primaryImage);
              if (foundIndex !== -1) {
                primaryIndex = foundIndex;
              }
            }

            // Update gallery with option images
            updateImageGallery(parsedImages, primaryIndex);
          } else {
            // إذا كان الاختيار مُعرف كأن له صور لكن القائمة فارغة، عرض الصور الأساسية
            updateImageGallery(originalImages, originalPrimaryIndex);
          }
        } catch (e) {
          console.error('Error parsing option images:', e);
          // في حالة خطأ، عرض الصور الأساسية
          updateImageGallery(originalImages, originalPrimaryIndex);
        }
      } else {
        // الاختيار ليس له صور صحيحة، الاحتفاظ بالصور الأساسية للمنتج
        updateImageGallery(originalImages, originalPrimaryIndex);
      }
    });
  });

  // دالة لجلب الخيارات المختارة
  function getSelectedOptions() {
    return Object.keys(selectedOptions).map(groupTitle => ({
      group: groupTitle,
      ...selectedOptions[groupTitle]
    }));
  }

  // ==========================================
  // Cart / Favorite / Buy-Now — Product Detail
  // ==========================================
  const isAuth   = document.querySelector('meta[name="is-auth"]')?.content === '1';
  const csrf     = document.querySelector('meta[name="csrf-token"]')?.content;
  const cartBadge = document.querySelector('#cartCount');

  function showProductToast(message, type = 'success') {
    let container = document.getElementById('productToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'productToastContainer';
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

  function showGuestAlert() {
    showProductToast('سجّل الدخول أولاً للقيام بهذا الإجراء', 'error');
  }

  // Favorite button
  const favBtn = document.querySelector('button.favorite[data-product-id]');
  if (favBtn) {
    favBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!isAuth) { showGuestAlert(); return; }

      const productId = favBtn.dataset.productId;
      const icon      = favBtn.querySelector('i');
      const isActive  = favBtn.classList.toggle('active');

      if (isActive) {
        if (icon) icon.className = 'bi bi-heart-fill';
        showProductToast('تمت إضافة المنتج إلى المفضلة');
        try {
          const res  = await fetch('/web/favorites', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
            body:    JSON.stringify({ product_id: productId }),
          });
          const data = await res.json();
          if (data.favorite_id) favBtn.dataset.favoriteId = data.favorite_id;
        } catch {
          favBtn.classList.remove('active');
          if (icon) icon.className = 'bi bi-heart';
          showProductToast('حدث خطأ', 'error');
        }
      } else {
        if (icon) icon.className = 'bi bi-heart';
        showProductToast('تم إزالة المنتج من المفضلة');
        const favId = favBtn.dataset.favoriteId;
        if (favId && csrf) {
          fetch(`/web/favorites/${favId}`, {
            method:  'DELETE',
            headers: { 'X-CSRF-TOKEN': csrf },
          }).catch(() => {});
        }
      }
    });
  }

  // ==========================================
  // أنيميشن سحب المنتج للسلة
  // ==========================================
  function flyToCartAnimation(sourceElement) {
    const cartIcon = document.querySelector('#cartCount') || document.querySelector('.bi-bag') || document.querySelector('[href*="bags"]');
    if (!cartIcon || !sourceElement) return;

    // إنشاء عنصر يطير
    const flyingEl = document.createElement('div');
    flyingEl.className = 'flying-product';
    flyingEl.innerHTML = '<i class="bi bi-bag-check-fill"></i>';
    document.body.appendChild(flyingEl);

    // موضع البداية
    const sourceRect = sourceElement.getBoundingClientRect();
    const cartRect = cartIcon.getBoundingClientRect();

    flyingEl.style.cssText = `
      position: fixed;
      z-index: 10000;
      left: ${sourceRect.left + sourceRect.width / 2}px;
      top: ${sourceRect.top}px;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #416441 0%, #5a8a5a 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      box-shadow: 0 4px 20px rgba(65, 100, 65, 0.5);
      pointer-events: none;
      transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    `;
 
    // تأخير صغير ثم التحريك
    setTimeout(() => {
      flyingEl.style.left = `${cartRect.left + cartRect.width / 2}px`;
      flyingEl.style.top = `${cartRect.top}px`;
      flyingEl.style.transform = 'scale(0.3)';
      flyingEl.style.opacity = '0';
    }, 50);

    // إزالة العنصر بعد الانتهاء
    setTimeout(() => {
      flyingEl.remove();
      // تأثير نبض على السلة
      if (cartIcon) {
        cartIcon.style.transform = 'scale(1.3)';
        setTimeout(() => {
          cartIcon.style.transform = 'scale(1)';
          cartIcon.style.transition = 'transform 0.2s ease';
        }, 200);
      }
    }, 850);
  }

  // ==========================================
  // شاشة التحميل للشراء الآن
  // ==========================================
  function showLoadingOverlay() {
    // إزالة أي overlay موجود
    const existing = document.getElementById('buyNowOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'buyNowOverlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner-modern">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <i class="bi bi-bag-check"></i>
        </div>
        <p class="loading-text">جاري التحويل لصفحة الشراء...</p>
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // أنيميشن ظهور
    setTimeout(() => overlay.classList.add('active'), 10);
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById('buyNowOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  // Shared: add product to cart مع الخيارات والسعر المخصص
  async function addProductToCart(productId, showAnimation = false, sourceBtn = null) {
    if (!isAuth) { showGuestAlert(); return false; }
    if (!productId || !csrf) return false;

    try {
      // جمع الخيارات المختارة مع السعر الحالي
      const options = getSelectedOptions();
      const currentPrice = getCurrentPrice();

      const res = await fetch('/web/cart', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf },
        body:    JSON.stringify({
          product_id: productId,
          quantity: 1,
          selected_options: options,
          custom_price: currentPrice !== originalPrice ? currentPrice : null
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        if (data.cart_count !== undefined && cartBadge) {
          cartBadge.textContent = data.cart_count;
        }
        // تشغيل الأنيميشن
        if (showAnimation && sourceBtn) {
          flyToCartAnimation(sourceBtn);
        }
        return true;
      }
      showProductToast(data.error || 'حدث خطأ', 'error');
      return false;
    } catch {
      showProductToast('حدث خطأ في الاتصال', 'error');
      return false;
    }
  }

  // Add to cart button
  const addBtn = document.querySelector('button.add[data-product-id]');
  if (addBtn) {
    addBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = addBtn.dataset.productId;
      const ok = await addProductToCart(productId, true, addBtn);
      if (ok) showProductToast('تمت إضافة المنتج إلى الحقيبة');
    });
  }

  // Buy Now button
  const buyNowBtn = document.querySelector('button.buy-now[data-product-id]');
  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const productId = buyNowBtn.dataset.productId;

      // إظهار شاشة التحميل
      showLoadingOverlay();

      const ok = await addProductToCart(productId, false, null);
      if (ok) {
        setTimeout(() => {
          window.location.href = '/my-bags';
        }, 1500);
      } else {
        hideLoadingOverlay();
      }
    });
  }

  // ==========================================
  // إخفاء التابات الفارغة
  // ==========================================
  function hideEmptyTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const separators = document.querySelectorAll('.container-dev-btn > span');

    let hasVisibleTabs = false;
    let lastVisibleTab = null;

    tabButtons.forEach((btn, index) => {
      const tabName = btn.dataset.tab;
      const content = document.querySelector(`.tab-content[data-content="${tabName}"]`);

      if (!content) return;

      let isEmpty = false;

      if (tabName === 'overview') {
        // فحص نظرة عامة
        const overviewText = content.querySelector('p')?.textContent?.trim() || '';
        isEmpty = !overviewText || overviewText === 'لا يوجد وصف متاح حالياً لهذا المنتج';
      } else if (tabName === 'specs') {
        // فحص المواصفات
        const specsTable = content.querySelector('.specs-table');
        const noSpecsMsg = specsTable?.querySelector('td[colspan]');
        isEmpty = !!noSpecsMsg;
      } else if (tabName === 'reviews') {
        // فحص المراجعات
        const reviewsList = content.querySelector('.reviews-list');
        const noReviewsMsg = reviewsList?.querySelector('p[style*="text-align:center"]');
        isEmpty = !!noReviewsMsg;
      }

      if (isEmpty) {
        btn.style.display = 'none';
        content.style.display = 'none';
        // إخفاء الفاصل
        if (separators[index]) separators[index].style.display = 'none';
      } else {
        hasVisibleTabs = true;
        lastVisibleTab = btn;
      }
    });

    // التأكد من وجود تاب واحد على الأقل نشط
    if (hasVisibleTabs) {
      const activeBtn = document.querySelector('.tab-btn.active:not([style*="display: none"])');
      if (!activeBtn && lastVisibleTab) {
        lastVisibleTab.click();
      }
    }

    // إخفاء القسم كاملاً إذا كل التابات فارغة
    const detailsSection = document.querySelector('.details-more-item');
    if (!hasVisibleTabs && detailsSection) {
      detailsSection.style.display = 'none';
    }
  }

  // تشغيل فحص التابات الفارغة
  hideEmptyTabs();
});

// ==========================================
// CSS للأنيميشن والتحميل (يُضاف ديناميكياً)
// ==========================================
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
/* أنيميشن الطيران للسلة */
.flying-product {
  animation: flyPulse 0.8s ease-out;
}

@keyframes flyPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(0.3); }
}

/* شاشة التحميل */
#buyNowOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

#buyNowOverlay.active {
  opacity: 1;
  pointer-events: all;
}

.loading-content {
  text-align: center;
  color: white;
}

.spinner-modern {
  width: 120px;
  height: 120px;
  position: relative;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  border-radius: 50%;
  border: 3px solid transparent;
  animation: spinRing 1.5s linear infinite;
}

.spinner-ring:nth-child(1) {
  width: 100%;
  height: 100%;
  border-top-color: #416441;
  border-bottom-color: #416441;
}

.spinner-ring:nth-child(2) {
  width: 80%;
  height: 80%;
  border-left-color: #5a8a5a;
  border-right-color: #5a8a5a;
  animation-direction: reverse;
  animation-duration: 1s;
}

.spinner-ring:nth-child(3) {
  width: 60%;
  height: 60%;
  border-top-color: #7ab87a;
  border-bottom-color: #7ab87a;
  animation-duration: 0.8s;
}

.spinner-modern i {
  font-size: 30px;
  color: #416441;
  animation: iconPulse 1s ease-in-out infinite;
}

@keyframes spinRing {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.loading-text {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 15px;
  font-family: 'Cairo', sans-serif;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.loading-dots span {
  width: 10px;
  height: 10px;
  background: white;
  border-radius: 50%;
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-15px); }
}

/* تحسين أزرار الخيارات */
.options-item .btn-dev.active {
  background: linear-gradient(135deg, #416441 0%, #5a8a5a 100%) !important;
  color: white !important;
  border-color: #416441 !important;
  box-shadow: 0 4px 12px rgba(65, 100, 65, 0.3);
  transform: scale(1.05);
}

.options-item .btn-dev {
  transition: all 0.3s ease;
  cursor: pointer;
}

.options-item .btn-dev:hover:not(.active) {
  border-color: #416441;
  background: rgba(65, 100, 65, 0.1);
}

/* أنيميشن الكمية المتبقية - Enhanced */
@keyframes slideInDown {
  0% {
    opacity: 0;
    transform: translateY(-15px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* أنيميشن مؤشر السعر المخصص */
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* أنيميشن تغيير الصور */
@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

/* تحسين أنيميشن الكمية */
.option-qty-message {
  animation: slideInDown 0.3s ease-out, fadeOutUp 0.4s ease-out 3.6s forwards;
}

@keyframes fadeOutUp {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
  }
}
`;
document.head.appendChild(dynamicStyles);
