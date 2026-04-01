// ===== Mobile Menu Toggle =====
function toggleSidebar() {
  const sidebar = document.querySelector("nav.sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");
}

function closeSidebar() {
  const sidebar = document.querySelector("nav.sidebar");
  const overlay = document.querySelector(".sidebar-overlay");

  sidebar.classList.remove("active");
  overlay.classList.remove("active");
}

// Close sidebar when clicking on overlay
document.addEventListener("DOMContentLoaded", function () {
  const overlay = document.querySelector(".sidebar-overlay");
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  // Close sidebar when clicking on a link (mobile only)
  const sidebarLinks = document.querySelectorAll("nav.sidebar a");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        closeSidebar();
      }
    });
  });
});
