document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("cancelModal");
  const cancelBtns = document.querySelectorAll(".cancel-btn");
  const closeBtn = modal.querySelector(".close-modal");
  const footerCloseBtn = document.getElementById("closeCancelModal");
  const confirmBtn = document.getElementById("confirmCancel");
  const toastContainer = document.getElementById("toastContainer");

  // Open Modal
  cancelBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  // Close Modal
  const closeModal = () => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  };

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (footerCloseBtn) footerCloseBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Submission Logic
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      // Simulate API call
      confirmBtn.innerText = "جاري الإرسال...";
      confirmBtn.disabled = true;

      setTimeout(() => {
        showToast("تم الغاء الطلبية بنجاح");
        closeModal();
        confirmBtn.innerText = "موافق";
        confirmBtn.disabled = false;
        // Optional: clear textarea
        const reasonArea = document.getElementById("cancelReason");
        if (reasonArea) {
          reasonArea.value = "";
        }
      }, 1500);
    });
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast success";
    toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${message}`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
});
