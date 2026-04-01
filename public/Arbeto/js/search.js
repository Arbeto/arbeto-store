/**
 * search.js — Professional live search: autocomplete dropdown + search results page
 */

/* ───────────── helpers ───────────── */
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return escapeHtml(text).replace(regex, '<span class="search-suggestion-highlight">$1</span>');
}

/* ───────────── product card builder ───────────── */
function buildProductCard(p) {
    const id        = p.id;
    const name      = escapeHtml(p.name ?? '');
    const imgSrc    = p.primary_image ? escapeHtml(p.primary_image) :
                      ((p.img && p.img.length) ? escapeHtml(p.img[0]) : '/Arbeto/images/placeholder.png');
    const price     = parseFloat(p.price_sell ?? 0);
    const discount  = parseFloat(p.discount ?? 0);
    const oldPrice  = discount > 0 ? Math.round(price / (1 - discount / 100)) : 0;
    const qty       = parseInt(p.inventory_quantity ?? p.quantity ?? 0);
    const suggested = (p.suggested_product && p.suggested_product.length) ? escapeHtml(p.suggested_product[0]) : '';

    let priceHtml = '';
    if (discount > 0) {
        priceHtml = `
            <div>
                <span class="discount">${discount}%</span>
                <span class="last-price">جنية ${oldPrice}</span>
            </div>
            <span class="now-price">جنية ${price}</span>`;
    } else {
        priceHtml = `<span class="now-price">جنية ${price}</span>`;
    }

    return `
    <div class="card-product" data-product-id="${id}">
        <a href="/product/${id}" class="card-img">
            <img src="${imgSrc}" alt="${name}" loading="lazy" />
        </a>
        <a href="/product/${id}" class="title">${name}</a>
        <div class="price">${priceHtml}</div>
        ${suggested ? `<a class="text-box-page">"${suggested}"</a>` : ''}
        <div class="text-qountity">${qty > 0 ? `متبقي ( ${qty} ) قطع فقط` : '<span style="color:#c0392b;">نفذت الكمية</span>'}</div>
        <div class="add-cart">
            <div class="btns">
                <button class="share"><i class="bi bi-share"></i></button>
                <button class="favorite" data-product-id="${id}">
                    <i class="bi bi-heart"></i>
                </button>
            </div>
            <button class="add" data-product-id="${id}">أضف للحقيبة</button>
        </div>
    </div>`;
}

/* ───────────── search results page ───────────── */
window.runSearchPage = async function (query) {
    const heading = document.getElementById('searchResultHeading');
    const grid    = document.getElementById('searchResultsGrid');
    const spinner = document.getElementById('searchLoadingSpinner');
    const emptyMsg = document.getElementById('searchEmptyMsg');

    if (!grid) return;

    // show spinner
    spinner.style.display = 'block';
    emptyMsg.style.display = 'none';
    // clear existing cards (keep spinner + emptyMsg)
    Array.from(grid.children).forEach(c => {
        if (c.id !== 'searchLoadingSpinner' && c.id !== 'searchEmptyMsg') c.remove();
    });

    try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const products = await res.json();

        spinner.style.display = 'none';

        if (!products.length) {
            emptyMsg.style.display = 'block';
            heading.textContent = `لا توجد نتائج مطابقة لـ "${query}"`;
            return;
        }

        heading.textContent = `نتائج البحث عن "${query}" (${products.length} منتج)`;
        const fragment = document.createDocumentFragment();
        products.forEach(p => {
            const wrapper = document.createElement('div');
            wrapper.innerHTML = buildProductCard(p);
            fragment.appendChild(wrapper.firstElementChild);
        });
        grid.appendChild(fragment);

        // Re-wire product-interactions for dynamically added cards
        if (typeof window.initProductInteractions === 'function') {
            window.initProductInteractions();
        }
    } catch (e) {
        spinner.style.display = 'none';
        heading.textContent = 'حدث خطأ أثناء البحث، يرجى المحاولة مرة أخرى';
    }
};

/* ───────────── autocomplete dropdown ───────────── */
document.addEventListener('DOMContentLoaded', function () {
    const input      = document.getElementById('globalSearchInput');
    const dropdown   = document.getElementById('searchSuggestions');
    if (!input || !dropdown) return;

    function hideSuggestions() {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    }

    function showSeeAll(query) {
        dropdown.innerHTML = '';
        const seeAll = document.createElement('div');
        seeAll.className = 'search-suggestion-see-all';
        seeAll.innerHTML = `<i class="bi bi-search"></i> عرض جميع النتائج لـ "${escapeHtml(query)}"`;
        seeAll.addEventListener('mousedown', function (e) {
            e.preventDefault();
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        });
        dropdown.appendChild(seeAll);
        dropdown.style.display = 'block';
    }

    input.addEventListener('input', function () {
        const q = this.value.trim();
        if (q) {
            showSeeAll(q);
        } else {
            hideSuggestions();
        }
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const q = this.value.trim();
            if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
            hideSuggestions();
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            hideSuggestions();
        }
    });

    // If we're on the search page, pre-fill the input
    const urlQ = new URLSearchParams(window.location.search).get('q');
    if (urlQ && window.location.pathname === '/search') {
        input.value = urlQ;
    }
});
