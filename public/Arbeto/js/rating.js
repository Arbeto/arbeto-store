document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('ratingModal');
    const rateBtns = document.querySelectorAll('.rate-btn');
    const closeBtn = document.querySelector('.close-modal');
    const stars = document.querySelectorAll('.star');
    const submitBtn = document.getElementById('submitRating');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const uploadBtn = document.querySelector('.upload-btn');
    const toastContainer = document.getElementById('toastContainer');

    let currentRating = 0;
    let selectedFiles = [];

    // Open Modal
    rateBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; 
        });
    });

    // Close Modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetForm();
    };

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Star Rating Interactivity
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const val = parseInt(this.getAttribute('data-value'));
            highlightStars(val, 'hover');
        });

        star.addEventListener('mouseleave', function() {
            resetStarsHighlight();
        });

        star.addEventListener('click', function() {
            currentRating = parseInt(this.getAttribute('data-value'));
            highlightStars(currentRating, 'active');
            validateForm();
        });
    });

    function highlightStars(val, className) {
        stars.forEach(star => {
            const starVal = parseInt(star.getAttribute('data-value'));
            if (starVal <= val) {
                star.classList.add(className);
            } else {
                star.classList.remove(className);
            }
        });
    }

    function resetStarsHighlight() {
        stars.forEach(star => {
            star.classList.remove('hover');
            const starVal = parseInt(star.getAttribute('data-value'));
            if (starVal <= currentRating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Image Upload Logic
    imageUpload.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        const remainingSpace = 4 - selectedFiles.length;
        
        if (remainingSpace <= 0) return;

        const filesToAdd = files.slice(0, remainingSpace);
        
        filesToAdd.forEach(file => {
            if (file.type.startsWith('image/')) {
                selectedFiles.push(file);
                createPreview(file);
            }
        });

        imageUpload.value = ''; // Reset input for next selection
        checkUploadBtnVisibility();
    });

    function createPreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'img-preview';
            previewDiv.innerHTML = `
                <img src="${e.target.result}" alt="preview">
                <button class="remove-img"><i class="bi bi-x"></i></button>
            `;

            const removeBtn = previewDiv.querySelector('.remove-img');
            removeBtn.addEventListener('click', () => {
                const index = selectedFiles.indexOf(file);
                if (index > -1) {
                    selectedFiles.splice(index, 1);
                }
                previewDiv.remove();
                checkUploadBtnVisibility();
            });

            // Insert before the upload button
            imagePreviewContainer.insertBefore(previewDiv, uploadBtn);
            checkUploadBtnVisibility();
        };
        reader.readAsDataURL(file);
    }

    function checkUploadBtnVisibility() {
        if (selectedFiles.length >= 4) {
            uploadBtn.style.display = 'none';
        } else {
            uploadBtn.style.display = 'flex';
        }
    }

    function validateForm() {
        if (currentRating > 0) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    }

    function resetForm() {
        currentRating = 0;
        selectedFiles = [];
        stars.forEach(s => s.classList.remove('active', 'hover'));
        document.getElementById('productComment').value = '';
        const previews = imagePreviewContainer.querySelectorAll('.img-preview');
        previews.forEach(p => p.remove());
        checkUploadBtnVisibility();
        validateForm();
    }

    // Submission Logic
    submitBtn.addEventListener('click', () => {
        // Simulate API call
        submitBtn.innerText = 'جاري الإرسال...';
        submitBtn.disabled = true;

        setTimeout(() => {
            showToast('تم اضافة ملاحظتك للمنتج بنجاح');
            closeModal();
            submitBtn.innerText = 'إرسال';
            submitBtn.disabled = false;
        }, 1500);
    });

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${message}`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});
