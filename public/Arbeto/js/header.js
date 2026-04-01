document.addEventListener("DOMContentLoaded", function () {
  const userIcon = document.getElementById("userIcon");
  const userDropdown = document.getElementById("userDropdown");

  if (userIcon && userDropdown) {
    userIcon.addEventListener("click", function (e) {
      e.preventDefault();
      userDropdown.classList.toggle("active");
    });

    // Close when clicking outside
    document.addEventListener("click", function (e) {
      if (!userIcon.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.classList.remove("active");
      }
    });
  }

  // Scroll to Top Logic
  const upBtn = document.querySelector(".up");

  if (upBtn) {
    window.addEventListener("scroll", () => {
      // Show/Hide button based on scroll position
      if (window.scrollY > 300) {
        upBtn.classList.add("show");
      } else {
        upBtn.classList.remove("show");
      }

      // Calculate scroll progress percentage
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercentage = (window.scrollY / totalHeight) * 100;

      // Update the CSS variable for the conic-gradient progress
      upBtn.style.setProperty("--progress", `${progressPercentage}%`);
    });

    // Smooth scroll to top on click
    upBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  // Global Search Redirect
  const searchSections = document.querySelectorAll(".search");
  searchSections.forEach((section) => {
    const input = section.querySelector("input");
    const icon = section.querySelector(".bi-search");

    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && input.value.trim() !== "") {
          window.location.href = `search.html?q=${encodeURIComponent(
            input.value.trim()
          )}`;
        }
      });
    }

    if (icon && input) {
      icon.addEventListener("click", () => {
        if (input.value.trim() !== "") {
          window.location.href = `search.html?q=${encodeURIComponent(
            input.value.trim()
          )}`;
        }
      });
    }
  });
});
