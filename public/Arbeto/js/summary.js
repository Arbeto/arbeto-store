document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("summaryModal");
  const rateBtns = document.querySelectorAll(".summary-btn");
  const closeBtn = document.getElementById("close-modal");
  const footerCloseBtn = document.getElementById("closeSummaryModal");

  // Open Modal
  rateBtns.forEach((btn) => {
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
});
