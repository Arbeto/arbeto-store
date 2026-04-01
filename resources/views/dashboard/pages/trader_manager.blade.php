@include('dashboard.include.head')
<link rel="stylesheet" href="{{asset('arbeto_dashboard/css/customers.css')}}">

<style>
  .dashboard-container {
    width: 80%;
    margin-left: 3%;
  }

  /* ===== Pyramid Layout ===== */
  .tm-page {
    padding: 28px 24px;
    direction: rtl;
  }

  .tm-section {
    margin-bottom: 40px;
  }

  .tm-section-title {
    font-size: 1.05rem;
    font-weight: 800;
    margin-bottom: 18px;
    padding: 10px 18px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .tm-section-title.ceo-title {
    background: linear-gradient(135deg, #f5c518 0%, #e6a817 100%);
    color: #5a3e00;
  }

  .tm-section-title.mgr-title {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: #fff;
  }

  .tm-section-title.tdr-title {
    background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
    color: #fff;
  }

  .tm-row {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .tm-row.ceo-row {
    max-width: 380px;
    margin: 0 auto;
  }

  .tm-row.mgr-row {
    max-width: 820px;
    margin: 0 auto;
  }

  .tm-row.tdr-row {
    max-width: 100%;
  }

  .tm-card {
    border-radius: 18px;
    padding: 22px 20px 18px;
    width: 320px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, .13);
    transition: transform .22s, box-shadow .22s;
    flex-shrink: 0;
  }

  .tm-card.clickable {
    cursor: pointer;
  }

  .tm-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 42px rgba(0, 0, 0, .18);
  }

  .tm-card.ceo {
    background: linear-gradient(135deg, #fdf3c0 0%, #f9e04b 40%, #e6b800 100%);
    border: 2.5px solid #d4a017;
  }

  .tm-card.ceo::before {
    content: '★';
    position: absolute;
    top: -18px;
    right: -18px;
    font-size: 90px;
    color: rgba(255, 255, 255, .22);
    pointer-events: none;
  }

  .tm-card.ceo .tm-badge {
    background: #b8860b;
    color: #fff8dc;
  }

  .tm-card.ceo .tm-name {
    color: #5a3e00;
  }

  .tm-card.ceo .tm-stat-value {
    color: #7a5200;
  }

  .tm-card.manager {
    background: linear-gradient(135deg, #fff5f5 0%, #fde8e8 100%);
    border: 2px solid #e74c3c;
  }

  .tm-card.manager .tm-badge {
    background: #e74c3c;
    color: #fff;
  }

  .tm-card.manager .tm-name {
    color: #7b1d1d;
  }

  .tm-card.manager .tm-stat-value {
    color: #c0392b;
  }

  .tm-card.trader {
    background: linear-gradient(135deg, #f5fbf0 0%, #e8f5e1 100%);
    border: 2px solid #27ae60;
  }

  .tm-card.trader .tm-badge {
    background: #27ae60;
    color: #fff;
  }

  .tm-card.trader .tm-name {
    color: #1a4a28;
  }

  .tm-card.trader .tm-stat-value {
    color: #1e8449;
  }

  .tm-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .tm-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 800;
    flex-shrink: 0;
  }

  .tm-card.ceo .tm-avatar {
    background: #b8860b;
    color: #fff8dc;
  }

  .tm-card.manager .tm-avatar {
    background: #e74c3c;
    color: #fff;
  }

  .tm-card.trader .tm-avatar {
    background: #27ae60;
    color: #fff;
  }

  .tm-info {
    flex: 1;
    min-width: 0;
  }

  .tm-name {
    font-size: 1rem;
    font-weight: 800;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tm-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: .72rem;
    font-weight: 700;
    margin-top: 4px;
  }

  .tm-divider {
    height: 1px;
    background: rgba(0, 0, 0, .08);
    margin: 12px 0;
  }

  .tm-stats {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tm-stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    border-radius: 9px;
    background: rgba(255, 255, 255, .55);
  }

  .tm-stat-label {
    font-size: .84rem;
    font-weight: 600;
    color: #555;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tm-stat-value {
    font-size: .95rem;
    font-weight: 800;
  }

  .tm-loading {
    text-align: center;
    padding: 40px;
    color: #7d9a72;
    font-size: 1rem;
  }

  .tm-empty {
    text-align: center;
    padding: 20px;
    color: #aaa;
    font-style: italic;
    width: 100%;
  }

  .tm-pyramid-connector {
    display: flex;
    justify-content: center;
    margin: -10px 0 6px;
  }

  .tm-pyramid-connector::before {
    content: '';
    display: block;
    width: 2px;
    height: 28px;
    background: linear-gradient(to bottom, #d4a017, #e74c3c);
  }

  .tm-pyramid-connector.second::before {
    background: linear-gradient(to bottom, #e74c3c, #27ae60);
  }

  .tm-role-label {
    font-size: .75rem;
    font-weight: 700;
    opacity: .85;
    margin-right: auto;
    background: rgba(255, 255, 255, .25);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .tm-role-action-btn {
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: opacity .2s;
  }

  .tm-role-action-btn:hover {
    opacity: 1;
  }

  .tm-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .45);
    z-index: 9999;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .tm-modal-overlay.active {
    display: flex;
  }

  .tm-modal {
    width: min(760px, 95vw);
    max-height: 90vh;
    overflow: hidden;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 14px 50px rgba(0, 0, 0, .22);
    display: flex;
    flex-direction: column;
  }

  .tm-modal-header {
    padding: 16px 18px;
    border-bottom: 1px solid #edf2ea;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .tm-modal-header h3 {
    margin: 0;
    font-size: 1rem;
    color: #2d4a1e;
    font-weight: 800;
  }

  .tm-modal-close {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background: #f1f5ee;
    color: #466236;
    font-size: 1.2rem;
    cursor: pointer;
  }

  .tm-modal-body {
    padding: 14px 18px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tm-search-box {
    display: flex;
    gap: 8px;
  }

  .tm-search-input {
    flex: 1;
    border: 2px solid #e6efe0;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: .9rem;
    outline: none;
  }

  .tm-search-input:focus {
    border-color: #596d52;
  }

  .tm-search-btn {
    border: none;
    background: #596d52;
    color: #fff;
    border-radius: 10px;
    padding: 0 14px;
    font-size: .88rem;
    font-weight: 700;
    cursor: pointer;
  }

  .tm-modal-subtitle {
    font-size: .88rem;
    font-weight: 800;
    color: #3a5c28;
    margin-bottom: 8px;
  }

  .tm-users-box {
    border: 1px solid #e8efe3;
    border-radius: 12px;
    min-height: 110px;
    max-height: 230px;
    overflow: auto;
    background: #fcfefb;
  }

  .tm-user-item {
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid #edf3e9;
  }

  .tm-user-item:last-child {
    border-bottom: none;
  }

  .tm-user-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tm-user-name {
    font-weight: 700;
    color: #2d4a1e;
    font-size: .9rem;
  }

  .tm-user-meta {
    color: #6f8364;
    font-size: .78rem;
  }

  .tm-user-roles {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tm-role-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: .73rem;
    font-weight: 800;
    line-height: 1.25;
  }

  .tm-role-pill.ceo {
    background: #f8e7b2;
    color: #7a5700;
  }

  .tm-role-pill.manager {
    background: #fde5e5;
    color: #a72727;
  }

  .tm-role-pill.trader {
    background: #e3f4e8;
    color: #1f7a45;
  }

  .tm-role-arrow {
    color: #758b69;
    font-size: .85rem;
  }

  .tm-selected-group {
    padding: 8px 10px;
  }

  .tm-selected-group+.tm-selected-group {
    border-top: 1px dashed #dfe8da;
  }

  .tm-selected-group-title {
    font-size: .8rem;
    font-weight: 800;
    color: #4f6a41;
    margin: 2px 0 8px;
    padding: 0 2px;
  }

  .tm-user-item.same-role {
    background: #f9fcf7;
  }

  .tm-existing-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #eef6ea;
    color: #4f6a41;
    border: 1px solid #d5e6ce;
    border-radius: 8px;
    font-size: .74rem;
    font-weight: 800;
    padding: 6px 9px;
    white-space: nowrap;
  }

  .tm-user-downgrade-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #fde8e8;
    border: 1px solid #f5b7b1;
    border-radius: 8px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    color: #c0392b;
    font-size: .9rem;
    transition: background .15s;
  }

  .tm-user-downgrade-btn:hover {
    background: #f5b7b1;
  }

  .tm-user-downgrade-btn:disabled {
    opacity: .75;
    cursor: not-allowed;
  }

  .tm-avatar i {
    font-size: 1.35rem;
    line-height: 1;
  }

  .tm-user-add-btn,
  .tm-user-remove-btn {
    border: none;
    border-radius: 8px;
    font-size: .78rem;
    font-weight: 700;
    cursor: pointer;
    padding: 7px 10px;
    white-space: nowrap;
  }

  .tm-user-add-btn {
    background: #2d6a4f;
    color: #fff;
  }

  .tm-user-add-btn:disabled {
    background: #d3ddd0;
    color: #7b8f71;
    cursor: default;
  }

  .tm-user-remove-btn {
    background: #fceaea;
    color: #bf2f2f;
  }

  .tm-modal-footer {
    padding: 14px 18px;
    border-top: 1px solid #edf2ea;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .tm-btn {
    border: none;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: .88rem;
    font-weight: 700;
    cursor: pointer;
  }

  .tm-btn.cancel {
    background: #eef3ec;
    color: #4f6a41;
  }

  .tm-btn.update {
    background: #2d6a4f;
    color: #fff;
  }

  .tm-btn.update:disabled {
    background: #b7c8bf;
    cursor: default;
  }
</style>
</head>

<body>
  @include('dashboard.include.sidebar')

  <div class="dashboard-container">
    <div class="page-header">
      <h1><i class="bi bi-person-badge-fill"></i> المشرفون والتجار</h1>
      <p>هيكل فريق العمل وإحصائياتهم</p>
    </div>

    <div class="tm-page">
      <!-- CEO Row -->
      <div class="tm-section">
        <div class="tm-section-title ceo-title">
          <i class="bi bi-crown-fill"></i> المدير التنفيذي (CEO)
          <span class="tm-role-label">المستوى الأول</span>
        </div>
        <div class="tm-row ceo-row" id="ceoRow">
          <div class="tm-loading"><i class="bi bi-arrow-repeat rotating"></i> جاري التحميل...</div>
        </div>
      </div>

      <div class="tm-pyramid-connector"></div>

      <!-- Manager Row -->
      <div class="tm-section">
        <div class="tm-section-title mgr-title">
          <i class="bi bi-shield-fill"></i> المشرفون (Managers)
          <button type="button" class="tm-role-label tm-role-action-btn" onclick="openRoleModal('manager')">
            <i class="bi bi-person-plus-fill"></i> إضافة مشرفين
          </button>
        </div>
        <div class="tm-row mgr-row" id="mgrRow">
          <div class="tm-loading"><i class="bi bi-arrow-repeat rotating"></i> جاري التحميل...</div>
        </div>
      </div>

      <div class="tm-pyramid-connector second"></div>

      <!-- Trader Row -->
      <div class="tm-section">
        <div class="tm-section-title tdr-title">
          <i class="bi bi-pc-display-horizontal"></i> التجار (Traders)
          <button type="button" class="tm-role-label tm-role-action-btn" onclick="openRoleModal('trader')">
            <i class="bi bi-person-plus-fill"></i> إضافة تجار
          </button>
        </div>
        <div class="tm-row tdr-row" id="tdrRow">
          <div class="tm-loading"><i class="bi bi-arrow-repeat rotating"></i> جاري التحميل...</div>
        </div>
      </div>
    </div>
  </div>

  <div id="roleAssignModal" class="tm-modal-overlay">
    <div class="tm-modal">
      <div class="tm-modal-header">
        <h3 id="roleModalTitle">إضافة مستخدمين</h3>
        <button class="tm-modal-close" type="button" onclick="closeRoleModal()">&times;</button>
      </div>
      <div class="tm-modal-body">
        <div class="tm-search-box">
          <input id="roleSearchInput" class="tm-search-input" type="text" placeholder="ابحث بالاسم أو ID المستخدم" oninput="debouncedSearchUsers()">
          <button class="tm-search-btn" type="button" onclick="searchUsersForRole()">بحث</button>
        </div>

        <div>
          <div class="tm-modal-subtitle">نتائج البحث</div>
          <div id="roleSearchResults" class="tm-users-box">
            <div class="tm-empty">ابدأ الكتابة للبحث عن المستخدمين</div>
          </div>
        </div>

        <div>
          <div class="tm-modal-subtitle">المستخدمون المختارون</div>
          <div id="roleSelectedUsers" class="tm-users-box">
            <div class="tm-empty">لم يتم اختيار مستخدمين بعد</div>
          </div>
        </div>
      </div>
      <div class="tm-modal-footer">
        <button class="tm-btn cancel" type="button" onclick="closeRoleModal()">إلغاء</button>
        <button id="roleUpdateBtn" class="tm-btn update" type="button" onclick="submitRoleUpdate()" disabled>تحديث البيانات</button>
      </div>
    </div>
  </div>

  <!-- ==== مودال تأكيد إزالة الصلاحية ==== -->
  <div id="downgradeConfirmModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:3000;align-items:center;justify-content:center;">
    <div style="background:#fff;border-radius:16px;padding:28px 26px;width:100%;max-width:400px;box-shadow:0 12px 50px rgba(0,0,0,.2);direction:rtl;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="width:56px;height:56px;border-radius:50%;background:#fde8e8;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
          <i class="bi bi-trash3-fill" style="font-size:1.6rem;color:#c0392b;"></i>
        </div>
        <h3 style="margin:0 0 10px;font-size:1.05rem;font-weight:700;color:#2d1a1a;">تأكيد إزالة الصلاحية</h3>
        <p id="downgradeConfirmText" style="margin:0;font-size:.88rem;color:#555;line-height:1.6;"></p>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:20px;">
        <button onclick="closeDowngradeConfirm()" style="flex:1;padding:9px;border-radius:9px;border:1.5px solid #ccc;background:#fff;color:#555;font-size:.88rem;cursor:pointer;">إلغاء</button>
        <button id="downgradeConfirmBtn" onclick="submitDowngrade()" style="flex:1;padding:9px;border-radius:9px;border:none;background:#c0392b;color:#fff;font-size:.88rem;font-weight:600;cursor:pointer;">
          <i class="bi bi-trash3-fill"></i> تأكيد الإزالة
        </button>
      </div>
    </div>
  </div>

  @include('dashboard.include.toast')

  <script>
    let roleTarget = null;
    let roleSearchResults = [];
    let selectedRoleUsers = [];
    let sameRoleUsers = [];
    let isLoadingSameRoleUsers = false;
    let roleSearchTimer = null;
    let downgradeTargetId = null;
    let downgradeTargetName = '';

    function getRoleLabel(type) {
      if (type === 'ceo') return 'CEO';
      if (type === 'manager') return 'Manager';
      if (type === 'trader') return 'Trader';
      return type;
    }

    function getInitials(first, last) {
      return ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase() || '?';
    }

    function notify(message, type = 'success') {
      if (typeof showToast === 'function') {
        showToast(message, type);
      }
    }

    function roleTitle(role) {
      return role === 'manager' ? 'إضافة مستخدمين إلى المشرفين' : 'إضافة مستخدمين إلى التجار';
    }

    function roleTargetLabel() {
      return roleTarget === 'manager' ? 'مشرف' : 'تاجر';
    }

    function openRoleModal(role) {
      roleTarget = role;
      roleSearchResults = [];
      selectedRoleUsers = [];
      sameRoleUsers = [];
      isLoadingSameRoleUsers = true;
      document.getElementById('roleModalTitle').textContent = roleTitle(role);
      document.getElementById('roleSearchInput').value = '';
      renderRoleSearchResults();
      renderSelectedRoleUsers();
      document.getElementById('roleAssignModal').classList.add('active');
      document.body.style.overflow = 'hidden';
      loadSameRoleUsers();
      setTimeout(() => document.getElementById('roleSearchInput')?.focus(), 0);
    }

    function closeRoleModal() {
      roleTarget = null;
      roleSearchResults = [];
      selectedRoleUsers = [];
      sameRoleUsers = [];
      isLoadingSameRoleUsers = false;
      document.getElementById('roleAssignModal').classList.remove('active');
      document.body.style.overflow = '';
    }

    function isAlreadySelected(userId) {
      return selectedRoleUsers.some(user => Number(user.id) === Number(userId));
    }

    function renderRoleSearchResults() {
      const box = document.getElementById('roleSearchResults');
      if (!box) return;

      if (!roleSearchResults.length) {
        box.innerHTML = '<div class="tm-empty">لا توجد نتائج</div>';
        return;
      }

      box.innerHTML = roleSearchResults.map(user => {
        const fullName = user.full_name?.trim() || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'بدون اسم';
        const disabled = isAlreadySelected(user.id) || user.user_type === roleTarget;
        const btnText = isAlreadySelected(user.id) ? 'تمت الإضافة' : (user.user_type === roleTarget ? 'يملك الصلاحية' : 'إضافة');
        return `
          <div class="tm-user-item">
            <div class="tm-user-main">
              <span class="tm-user-name">${fullName}</span>
              <span class="tm-user-meta">ID: ${user.id} | ${user.phone || 'بدون هاتف'} | ${user.email || 'بدون بريد'}</span>
            </div>
            <button type="button" class="tm-user-add-btn" onclick="addUserToSelection(${user.id})" ${disabled ? 'disabled' : ''}>${btnText}</button>
          </div>
        `;
      }).join('');
    }

    function renderSelectedRoleUsers() {
      const box = document.getElementById('roleSelectedUsers');
      const updateBtn = document.getElementById('roleUpdateBtn');
      if (!box || !updateBtn) return;

      updateBtn.disabled = !selectedRoleUsers.length;

      const selectedUsersHtml = selectedRoleUsers.length ? selectedRoleUsers.map(user => {
        const fullName = user.full_name?.trim() || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'بدون اسم';
        const currentRole = getRoleLabel(user.user_type);
        const targetRole = roleTargetLabel();
        const currentRoleClass = user.user_type || 'trader';
        const targetRoleClass = roleTarget || 'trader';
        return `
          <div class="tm-user-item">
            <div class="tm-user-main">
              <span class="tm-user-name">${fullName}</span>
              <span class="tm-user-meta">ID: ${user.id} | ${user.phone || 'بدون هاتف'} | ${user.email || 'بدون بريد'}</span>
              <div class="tm-user-roles">
                <span class="tm-role-pill ${currentRoleClass}">الحالية: ${currentRole}</span>
                <i class="bi bi-arrow-left tm-role-arrow"></i>
                <span class="tm-role-pill ${targetRoleClass}">الجديدة: ${targetRole}</span>
              </div>
            </div>
            <button type="button" class="tm-user-remove-btn" onclick="removeUserFromSelection(${user.id})">حذف</button>
          </div>
        `;
      }).join('') : '<div class="tm-empty">لم يتم اختيار مستخدمين بعد</div>';

      const sameRoleUsersHtml = isLoadingSameRoleUsers ?
        '<div class="tm-loading"><i class="bi bi-arrow-repeat rotating"></i> جاري تحميل أصحاب نفس الصلاحية...</div>' :
        (sameRoleUsers.length ? sameRoleUsers.map(user => {
          const fullName = user.full_name?.trim() || [user.first_name, user.last_name].filter(Boolean).join(' ') || 'بدون اسم';
          const roleClass = user.user_type || 'trader';
          const roleLabel = getRoleLabel(user.user_type);
          return `
            <div class="tm-user-item same-role">
              <div class="tm-user-main">
                <span class="tm-user-name">${fullName}</span>
                <span class="tm-user-meta">ID: ${user.id} | ${user.phone || 'بدون هاتف'} | ${user.email || 'بدون بريد'}</span>
                <div class="tm-user-roles">
                  <span class="tm-role-pill ${roleClass}">${roleLabel}</span>
                  <span class="tm-role-pill ${roleClass}">يملك الصلاحية</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="tm-existing-tag">موجود</span>
                <button type="button" class="tm-user-downgrade-btn" data-user-id="${Number(user.id)}" data-user-name="${encodeURIComponent(fullName)}" data-role-label="${encodeURIComponent(roleLabel)}" title="إزالة الصلاحية وتحويله إلى عميل">
                  <i class="bi bi-trash3-fill"></i>
                </button>
              </div>
            </div>
          `;
        }).join('') : '<div class="tm-empty">لا يوجد مستخدمون حالياً بنفس الصلاحية</div>');

      box.innerHTML = `
        <div class="tm-selected-group">
          <div class="tm-selected-group-title">المستخدمون المختارون (${selectedRoleUsers.length})</div>
          ${selectedUsersHtml}
        </div>
        <div class="tm-selected-group">
          <div class="tm-selected-group-title">المستخدمون بنفس الصلاحية (${sameRoleUsers.length})</div>
          ${sameRoleUsersHtml}
        </div>
      `;
    }

    async function loadSameRoleUsers() {
      if (!roleTarget) return;

      isLoadingSameRoleUsers = true;
      renderSelectedRoleUsers();

      try {
        const url = `/dashboard-admin/users/search?target_role=${encodeURIComponent(roleTarget)}&include_same_role=1&q=`;
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'تعذر تحميل أصحاب نفس الصلاحية');

        sameRoleUsers = Array.isArray(data) ? data.filter(user => user.user_type === roleTarget) : [];
      } catch (error) {
        sameRoleUsers = [];
        notify(error?.message || 'حدث خطأ أثناء تحميل أصحاب نفس الصلاحية', 'error');
      } finally {
        isLoadingSameRoleUsers = false;
        renderSelectedRoleUsers();
      }
    }

    function addUserToSelection(userId) {
      const user = roleSearchResults.find(item => Number(item.id) === Number(userId));
      if (!user || user.user_type === roleTarget || isAlreadySelected(userId)) return;
      selectedRoleUsers.push(user);
      renderSelectedRoleUsers();
      renderRoleSearchResults();
    }

    function removeUserFromSelection(userId) {
      selectedRoleUsers = selectedRoleUsers.filter(user => Number(user.id) !== Number(userId));
      renderSelectedRoleUsers();
      renderRoleSearchResults();
    }

    function debouncedSearchUsers() {
      clearTimeout(roleSearchTimer);
      roleSearchTimer = setTimeout(searchUsersForRole, 300);
    }

    async function searchUsersForRole() {
      if (!roleTarget) return;
      const queryText = (document.getElementById('roleSearchInput')?.value || '').trim();
      const box = document.getElementById('roleSearchResults');
      if (box) box.innerHTML = '<div class="tm-loading"><i class="bi bi-arrow-repeat rotating"></i> جاري البحث...</div>';

      try {
        const url = `/dashboard-admin/users/search?target_role=${encodeURIComponent(roleTarget)}&q=${encodeURIComponent(queryText)}`;
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'تعذر البحث');

        roleSearchResults = Array.isArray(data) ? data : [];
        renderRoleSearchResults();
      } catch (error) {
        roleSearchResults = [];
        if (box) box.innerHTML = '<div class="tm-empty" style="color:#d9534f">حدث خطأ أثناء البحث</div>';
      }
    }

    async function submitRoleUpdate() {
      if (!roleTarget || !selectedRoleUsers.length) return;

      const updateBtn = document.getElementById('roleUpdateBtn');
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
      const originalText = updateBtn.textContent;

      updateBtn.disabled = true;
      updateBtn.textContent = 'جاري التحديث...';

      try {
        const res = await fetch('/dashboard-admin/users/update-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
          },
          body: JSON.stringify({
            target_role: roleTarget,
            user_ids: selectedRoleUsers.map(user => user.id),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'تعذر تحديث الصلاحية');

        notify(data?.message || 'تم تحديث الصلاحيات بنجاح', 'success');
        closeRoleModal();
        await loadStaff();
      } catch (error) {
        notify(error?.message || 'حدث خطأ أثناء تحديث الصلاحية', 'error');
        updateBtn.disabled = false;
        updateBtn.textContent = originalText;
        return;
      }

      updateBtn.textContent = originalText;
    }

    function getRoleIcon(type) {
      if (type === 'ceo')     return '<i class="bi bi-crown-fill"></i>';
      if (type === 'manager') return '<i class="bi bi-shield-fill"></i>';
      return '<i class="bi bi-pc-display-horizontal"></i>';
    }

    function openUserDetails(userId) {
      if (!userId) return;
      localStorage.setItem('viewCustomerId', String(userId));
      window.location.href = '/dashboard-admin/customer-details';
    }

    function buildCard(member) {
      const type = member.user_type || 'trader';
      const fullName = [member.first_name, member.last_name].filter(Boolean).join(' ') || 'بدون اسم';
      return `
        <div class="tm-card ${type} clickable" role="button" tabindex="0" onclick="openUserDetails(${Number(member.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openUserDetails(${Number(member.id)})}">
            <div class="tm-card-header">
            <div class="tm-avatar">${getRoleIcon(type)}</div>
                <div class="tm-info">
                    <div class="tm-name">${fullName}</div>
                    <span class="tm-badge">${getRoleLabel(type)}</span>
                </div>
            </div>
            <div class="tm-divider"></div>
            <div class="tm-stats">
                <div class="tm-stat-row">
                    <span class="tm-stat-label"><i class="bi bi-box-seam"></i> المنتجات المضافة</span>
                    <span class="tm-stat-value">${member.product_count ?? 0}</span>
                </div>
                <div class="tm-stat-row">
                    <span class="tm-stat-label"><i class="bi bi-cart-check"></i> الطلبات المُباعة</span>
                    <span class="tm-stat-value">${member.order_count ?? 0}</span>
                </div>
                <div class="tm-stat-row">
                    <span class="tm-stat-label"><i class="bi bi-cash-coin"></i> الأرباح المحققة</span>
                    <span class="tm-stat-value">${parseFloat(member.profit ?? 0).toFixed(2)} جنيه</span>
                </div>
            </div>
        </div>`;
    }
    async function loadStaff() {
      try {
        const res = await fetch('/api/staff-members');
        const data = await res.json();
        const ceos = data.filter(m => m.user_type === 'ceo');
        const managers = data.filter(m => m.user_type === 'manager');
        const traders = data.filter(m => m.user_type === 'trader');
        document.getElementById('ceoRow').innerHTML = ceos.length ?
          ceos.map(buildCard).join('') :
          '<div class="tm-empty">لا يوجد مدير تنفيذي مسجل بعد</div>';
        document.getElementById('mgrRow').innerHTML = managers.length ?
          managers.map(buildCard).join('') :
          '<div class="tm-empty">لا يوجد مشرفون مسجلون بعد</div>';
        document.getElementById('tdrRow').innerHTML = traders.length ?
          traders.map(buildCard).join('') :
          '<div class="tm-empty">لا يوجد تجار مسجلون بعد</div>';
      } catch (e) {
        ['ceoRow', 'mgrRow', 'tdrRow'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.innerHTML = '<div class="tm-empty" style="color:#e74c3c">حدث خطأ أثناء تحميل البيانات</div>';
        });
      }
    }
    document.addEventListener('DOMContentLoaded', loadStaff);
    document.getElementById('roleAssignModal')?.addEventListener('click', function(e) {
      if (e.target === this) closeRoleModal();
    });

    function openDowngradeConfirm(userId, userName, roleLabel) {
      downgradeTargetId = userId;
      downgradeTargetName = userName;
      const modal = document.getElementById('downgradeConfirmModal');
      document.getElementById('downgradeConfirmText').textContent =
        `هل أنت متأكد من إزالة صلاحية "${roleLabel}" من المستخدم "${userName}"؟ سيتم تحويله إلى عميل (customer).`;
      if (modal) modal.style.display = 'flex';
    }

    function closeDowngradeConfirm() {
      downgradeTargetId = null;
      downgradeTargetName = '';
      const modal = document.getElementById('downgradeConfirmModal');
      if (modal) modal.style.display = 'none';
    }

    async function submitDowngrade() {
      if (!downgradeTargetId) return;
      const btn = document.getElementById('downgradeConfirmBtn');
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      btn.disabled = true;
      btn.innerHTML = '<i class="bi bi-hourglass-split"></i> جاري التنفيذ...';

      try {
        const res = await fetch('/dashboard-admin/users/downgrade-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': csrfToken
          },
          body: JSON.stringify({ user_id: downgradeTargetId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'فشل الحذف');

        notify(data?.message || 'تمت الإزالة بنجاح', 'success');
        sameRoleUsers = sameRoleUsers.filter(u => Number(u.id) !== Number(downgradeTargetId));
        closeDowngradeConfirm();
        renderSelectedRoleUsers();
        await loadStaff();
      } catch (error) {
        notify(error?.message || 'حدث خطأ أثناء الإزالة', 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-trash3-fill"></i> تأكيد الإزالة';
      }
    }

    document.addEventListener('click', function(e) {
      const downgradeBtn = e.target.closest('.tm-user-downgrade-btn');
      if (downgradeBtn) {
        const userId = Number(downgradeBtn.dataset.userId || 0);
        const userName = decodeURIComponent(downgradeBtn.dataset.userName || '');
        const roleLabel = decodeURIComponent(downgradeBtn.dataset.roleLabel || '');
        if (userId) openDowngradeConfirm(userId, userName, roleLabel);
      }

      const downgradeModal = document.getElementById('downgradeConfirmModal');
      if (downgradeModal && e.target === downgradeModal) {
        closeDowngradeConfirm();
      }
    });

    document.addEventListener('keydown', function(e) {
      const roleModal = document.getElementById('roleAssignModal');
      const downgradeModal = document.getElementById('downgradeConfirmModal');

      if (e.key === 'Escape' && roleModal?.classList.contains('active')) {
        closeRoleModal();
        return;
      }

      if (e.key === 'Escape' && downgradeModal?.style.display === 'flex') {
        closeDowngradeConfirm();
      }
    });
  </script>

  @include('dashboard.include.footer')