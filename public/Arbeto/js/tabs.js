// وظيفة التبديل بين التبويبات
document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const optButtons = document.querySelectorAll('.opt-btn');
  const sizeButtons = document.querySelectorAll('.size-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');

      // إزالة الحالة النشطة من جميع الأزرار
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });

      // إضافة الحالة النشطة للزر المضغوط
      this.classList.add('active');

      // إخفاء جميع المحتويات
      tabContents.forEach(content => {
        content.classList.remove('active');
      });

      // إظهار المحتوى المطلوب
      const targetContent = document.querySelector(`[data-content="${targetTab}"]`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  optButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');

      // إزالة الحالة النشطة من جميع الأزرار
      optButtons.forEach(btn => {
        btn.classList.remove('active');
      });

      // إضافة الحالة النشطة للزر المضغوط
      this.classList.add('active');
    });
  });

  sizeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');

      // إزالة الحالة النشطة من جميع الأزرار
      sizeButtons.forEach(btn => {
        btn.classList.remove('active');
      });

      // إضافة الحالة النشطة للزر المضغوط
      this.classList.add('active');
    });
  });
});
