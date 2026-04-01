/**
 * Governorates & Cities — Egypt (Arbeto)
 * Provides a searchable custom-select widget for governorate/city cascading dropdowns.
 */

const EGYPT_REGIONS = {
  'القاهرة': [
    'القاهرة', 'مدينة نصر', 'مصر الجديدة', 'النزهة', 'عين شمس', 'المطرية', 'المرج',
    'السلام أول', 'السلام ثان', 'الشروق', 'بدر', 'القاهرة الجديدة', 'التجمع الأول',
    'التجمع الثالث', 'التجمع الخامس', 'الرحاب', 'مدينتي', 'مدينة 15 مايو', 'حلوان',
    'التبين', 'المعصرة', 'المعادي', 'طرة', 'دار السلام', 'البساتين', 'المقطم',
    'الخليفة', 'السيدة زينب', 'مصر القديمة', 'عابدين', 'الموسكي', 'باب الشعرية',
    'الأزبكية', 'بولاق', 'قصر النيل', 'روض الفرج', 'شبرا', 'الساحل', 'الشرابية',
    'الزاوية الحمراء', 'الوايلي', 'حدائق القبة', 'الزيتون', 'الأميرية', 'منشأة ناصر',
    'العاصمة الإدارية الجديدة'
  ],

  'الجيزة': [
    'الجيزة', 'الدقي', 'العجوزة', 'إمبابة', 'الوراق', 'بولاق الدكرور', 'الهرم',
    'فيصل', 'العمرانية', 'الطالبية', 'الصف', 'أطفيح', 'العياط', 'البدرشين',
    'الواحات البحرية', 'الواحات', 'الحي السادس أكتوبر', 'الحوامدية', 'أبو النمرس',
    'كرداسة', 'أوسيم', 'منشأة القناطر', 'مدينة 6 أكتوبر', 'الشيخ زايد', 'حدائق أكتوبر',
    'أكتوبر الجديدة', 'المنيب', 'الكيت كات', 'المهندسين'
  ],

  'القليوبية': [
    'بنها', 'قليوب', 'شبرا الخيمة', 'القناطر الخيرية', 'الخانكة', 'كفر شكر', 'طوخ',
    'قها', 'الخصوص', 'شبين القناطر', 'العبور', 'العبور الجديدة'
  ],

  'الإسكندرية': [
    'الإسكندرية', 'المنتزه أول', 'المنتزه ثان', 'شرق', 'وسط', 'الجمرك', 'غرب',
    'العجمي', 'برج العرب', 'برج العرب الجديدة', 'العامرية أول', 'العامرية ثان',
    'محرم بك', 'سيدي جابر', 'العطارين', 'باب شرق', 'اللبان', 'الرمل أول', 'الرمل ثان',
    'المعمورة', 'أبو قير'
  ],

  'البحيرة': [
    'دمنهور', 'كفر الدوار', 'رشيد', 'إدكو', 'أبو حمص', 'أبو المطامير', 'الدلنجات',
    'المحمودية', 'الرحمانية', 'إيتاي البارود', 'حوش عيسى', 'شبراخيت', 'كوم حمادة',
    'بدر', 'وادي النطرون', 'النوبارية الجديدة'
  ],

  'كفر الشيخ': [
    'كفر الشيخ', 'دسوق', 'فوه', 'مطوبس', 'بلطيم', 'مصيف بلطيم', 'الحامول', 'بيلا',
    'الرياض', 'سيدي سالم', 'قلين', 'برج البرلس', 'سيدي غازي'
  ],

  'الدقهلية': [
    'المنصورة', 'طلخا', 'ميت غمر', 'دكرنس', 'أجا', 'منية النصر', 'السنبلاوين',
    'بلقاس', 'شربين', 'المنزلة', 'المطرية', 'الجمالية', 'تمي الأمديد', 'بني عبيد',
    'نبروه', 'محلة دمنة', 'جمصة'
  ],

  'الغربية': [
    'طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'السنطة', 'قطور', 'بسيون', 'سمنود'
  ],

  'المنوفية': [
    'شبين الكوم', 'منوف', 'سرس الليان', 'أشمون', 'الباجور', 'قويسنا', 'بركة السبع',
    'تلا', 'الشهداء', 'مدينة السادات'
  ],

  'الشرقية': [
    'الزقازيق', 'بلبيس', 'منيا القمح', 'أبو حماد', 'أبو كبير', 'فاقوس', 'الحسينية',
    'ديرب نجم', 'كفر صقر', 'أولاد صقر', 'مشتول السوق', 'الإبراهيمية', 'ههيا',
    'القنايات', 'القرين', 'العاشر من رمضان', 'الصالحية الجديدة', 'صان الحجر'
  ],

  'دمياط': [
    'دمياط', 'دمياط الجديدة', 'رأس البر', 'فارسكور', 'الزرقا', 'كفر سعد', 'كفر البطيخ',
    'السرو', 'ميت أبو غالب', 'عزبة البرج', 'الروضة'
  ],

  'بورسعيد': [
    'حي الشرق', 'حي العرب', 'حي المناخ', 'حي الضواحي', 'حي الزهور', 'حي الجنوب',
    'حي غرب', 'بورفؤاد', 'بورفؤاد ثان'
  ],

  'الإسماعيلية': [
    'الإسماعيلية', 'فايد', 'القنطرة شرق', 'القنطرة غرب', 'التل الكبير', 'أبو صوير',
    'القصاصين الجديدة'
  ],

  'السويس': [
    'حي السويس', 'حي الأربعين', 'حي فيصل', 'حي عتاقة', 'حي الجناين'
  ],

  'الفيوم': [
    'الفيوم', 'الفيوم الجديدة', 'سنورس', 'إطسا', 'إبشواي', 'يوسف الصديق', 'طامية'
  ],

  'بني سويف': [
    'بني سويف', 'بني سويف الجديدة', 'الواسطى', 'ناصر', 'إهناسيا', 'ببا', 'سمسطا', 'الفشن'
  ],

  'المنيا': [
    'المنيا', 'المنيا الجديدة', 'العدوة', 'مغاغة', 'بني مزار', 'مطاي', 'سمالوط',
    'أبو قرقاص', 'ملوي', 'دير مواس'
  ],

  'أسيوط': [
    'أسيوط', 'أسيوط الجديدة', 'ديروط', 'القوصية', 'منفلوط', 'أبنوب', 'أبو تيج',
    'الغنايم', 'ساحل سليم', 'البداري', 'صدفا', 'الفتح'
  ],

  'سوهاج': [
    'سوهاج', 'سوهاج الجديدة', 'أخميم', 'أخميم الجديدة', 'البلينا', 'المراغة', 'المنشأة',
    'دار السلام', 'جرجا', 'جهينة', 'ساقلته', 'طما', 'طهطا'
  ],

  'قنا': [
    'قنا', 'قنا الجديدة', 'أبو تشت', 'فرشوط', 'نجع حمادي', 'دشنا', 'الوقف', 'قفط',
    'قوص', 'نقادة'
  ],

  'الأقصر': [
    'الأقصر', 'الأقصر الجديدة', 'الزينية', 'البياضية', 'القرنة', 'أرمنت', 'الطود', 'إسنا'
  ],

  'أسوان': [
    'أسوان', 'أسوان الجديدة', 'دراو', 'كوم أمبو', 'نصر النوبة', 'إدفو', 'أبو سمبل السياحية'
  ],

  'البحر الأحمر': [
    'الغردقة', 'رأس غارب', 'سفاجا', 'القصير', 'مرسى علم', 'الشلاتين', 'حلايب'
  ],

  'الوادي الجديد': [
    'الخارجة', 'الداخلة', 'الفرافرة', 'باريس', 'بلاط', 'موط'
  ],

  'مطروح': [
    'مرسى مطروح', 'الحمام', 'العلمين', 'الضبعة', 'النجيلة', 'سيدي براني', 'السلوم', 'سيوة'
  ],

  'شمال سيناء': [
    'العريش', 'الشيخ زويد', 'رفح', 'بئر العبد', 'الحسنة', 'نخل'
  ],

  'جنوب سيناء': [
    'الطور', 'شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'رأس سدر', 'أبو زنيمة', 'أبو رديس',
    'سانت كاترين'
  ]
};

// ─────────────────────────────────────────────────────────
// Searchable Select Widget
// ─────────────────────────────────────────────────────────

/**
 * Converts a plain <select> element into a searchable dropdown.
 * @param {HTMLSelectElement} selectEl
 * @param {string} placeholder - hint text shown in the trigger button
 * @returns {{ setValue: (val: string) => void, getValue: () => string, resetOptions: (options: string[], placeholder: string) => void }}
 */
function makeSearchableSelect(selectEl, placeholder) {
  if (!selectEl || selectEl.dataset.searchable === 'done') return null;
  selectEl.dataset.searchable = 'done';
  selectEl.style.display = 'none';

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'ss-wrapper';

  // Trigger button
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'ss-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');

  const triggerText = document.createElement('span');
  triggerText.className = 'ss-trigger-text ss-placeholder';
  triggerText.textContent = placeholder;
  const triggerArrow = document.createElement('span');
  triggerArrow.className = 'ss-arrow';
  triggerArrow.innerHTML = '<i class="bi bi-chevron-down"></i>';
  trigger.appendChild(triggerText);
  trigger.appendChild(triggerArrow);

  // Dropdown panel
  const panel = document.createElement('div');
  panel.className = 'ss-panel';
  panel.setAttribute('role', 'listbox');

  // Search input
  const searchWrap = document.createElement('div');
  searchWrap.className = 'ss-search-wrap';
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ss-search';
  searchInput.placeholder = 'بحث...';
  searchInput.setAttribute('autocomplete', 'off');
  searchWrap.appendChild(searchInput);
  panel.appendChild(searchWrap);

  // Options list
  const list = document.createElement('ul');
  list.className = 'ss-list';
  panel.appendChild(list);

  wrapper.appendChild(trigger);
  wrapper.appendChild(panel);
  selectEl.parentNode.insertBefore(wrapper, selectEl);
  wrapper.appendChild(selectEl); // keep hidden select inside wrapper

  let currentValue = '';

  function renderOptions(filter) {
    list.innerHTML = '';
    const opts = Array.from(selectEl.options);
    const q = (filter || '').trim().toLowerCase();
    opts.forEach((opt) => {
      if (opt.value === '') return; // skip placeholder option
      if (q && !opt.textContent.toLowerCase().includes(q)) return;
      const li = document.createElement('li');
      li.className = 'ss-option';
      li.setAttribute('role', 'option');
      li.dataset.value = opt.value;
      li.textContent = opt.textContent;
      if (opt.value === currentValue) li.classList.add('selected');
      li.addEventListener('click', () => {
        currentValue = opt.value;
        selectEl.value = opt.value;
        triggerText.textContent = opt.textContent;
        triggerText.classList.remove('ss-placeholder');
        closePanel();
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        renderOptions('');
      });
      list.appendChild(li);
    });
    if (!list.children.length) {
      const empty = document.createElement('li');
      empty.className = 'ss-empty';
      empty.textContent = 'لا توجد نتائج';
      list.appendChild(empty);
    }
  }

  function openPanel() {
    panel.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    searchInput.value = '';
    renderOptions('');
    searchInput.focus();
  }

  function closePanel() {
    panel.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isDisabled = trigger.classList.contains('ss-disabled');
    if (isDisabled) return;
    panel.classList.contains('open') ? closePanel() : openPanel();
  });

  searchInput.addEventListener('input', () => renderOptions(searchInput.value));
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) closePanel();
  });

  renderOptions('');

  return {
    getValue() { return currentValue; },
    setValue(val) {
      const opt = Array.from(selectEl.options).find((o) => o.value === val);
      if (opt) {
        currentValue = val;
        selectEl.value = val;
        triggerText.textContent = opt.textContent;
        triggerText.classList.remove('ss-placeholder');
        renderOptions('');
      }
    },
    setDisabled(disabled) {
      trigger.classList.toggle('ss-disabled', disabled);
      if (disabled) {
        triggerText.textContent = placeholder;
        triggerText.classList.add('ss-placeholder');
        currentValue = '';
        selectEl.value = '';
        closePanel();
      }
    },
    resetOptions(options, newPlaceholder) {
      // rebuild the underlying <select> options
      selectEl.innerHTML = `<option value="">${newPlaceholder || placeholder}</option>`;
      options.forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        selectEl.appendChild(o);
      });
      currentValue = '';
      selectEl.value = '';
      triggerText.textContent = newPlaceholder || placeholder;
      triggerText.classList.add('ss-placeholder');
      renderOptions('');
    },
  };
}

// ─────────────────────────────────────────────────────────
// Cascading Governorate / City init
// ─────────────────────────────────────────────────────────

/**
 * Initialises the governorate → city cascade on a container.
 * @param {HTMLElement} container - element that holds both selects
 * @param {object} opts
 * @param {string} opts.govSelectId  - id of the governorate <select>
 * @param {string} opts.citySelectId - id of the city <select>
 * @param {string} [opts.initGov]    - pre-selected governorate value
 * @param {string} [opts.initCity]   - pre-selected city value
 */
function initGovCityCascade(container, opts) {
  const govEl  = container.querySelector('#' + opts.govSelectId);
  const cityEl = container.querySelector('#' + opts.citySelectId);
  if (!govEl || !cityEl) return;

  const govWidget  = makeSearchableSelect(govEl,  'اختر المحافظة');
  const cityWidget = makeSearchableSelect(cityEl, 'اختر المدينة');

  // City starts disabled
  cityWidget.setDisabled(true);

  govEl.addEventListener('change', () => {
    const gov = govEl.value;
    const cities = EGYPT_REGIONS[gov] || [];
    if (cities.length) {
      cityWidget.resetOptions(cities, 'اختر المدينة');
      cityWidget.setDisabled(false);
    } else {
      cityWidget.resetOptions([], 'اختر المدينة');
      cityWidget.setDisabled(true);
    }
  });

  // Pre-select if values provided (e.g. from server)
  if (opts.initGov && EGYPT_REGIONS[opts.initGov]) {
    govWidget.setValue(opts.initGov);
    const cities = EGYPT_REGIONS[opts.initGov];
    cityWidget.resetOptions(cities, 'اختر المدينة');
    cityWidget.setDisabled(false);
    if (opts.initCity) {
      cityWidget.setValue(opts.initCity);
    }
  }

  return { govWidget, cityWidget };
}
