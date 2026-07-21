/* Collectibles miniature: card grid, filters, value roll-up, slab detail view. */
(function () {
  'use strict';

  function hueBg(hue) {
    return 'linear-gradient(155deg, hsl(' + hue + ' 62% 30%) 0%, hsl(' + ((hue + 40) % 360) + ' 55% 16%) 100%)';
  }

  function gradeClass(item) {
    if (!item.grade) return 'grade-raw';
    return item.grade === '10' ? 'grade-10' : 'grade-9';
  }

  function fmtSGD(n) {
    return 'S$' + n.toLocaleString('en-SG');
  }

  function init() {
    const root = document.getElementById('coll-widget');
    if (!root) return;
    const items = window.ABYSS_DATA.collectibles;
    const grid = root.querySelector('.coll-grid');
    const valueEl = root.querySelector('.coll-value');
    const countEl = root.querySelector('.coll-count');
    const slab = root.querySelector('.slab-panel');
    const chips = Array.from(root.querySelectorAll('.chip'));

    let filter = 'all';
    let selectedId = null;

    function filtered() {
      if (filter === 'all') return items;
      return items.filter(i => i.kind === filter);
    }

    function renderGrid() {
      const list = filtered();
      grid.innerHTML = '';
      if (!list.length) {
        const empty = document.createElement('div');
        empty.className = 'coll-empty';
        empty.textContent = 'No items match this filter. Try All, or add stock to this category.';
        grid.appendChild(empty);
        return;
      }
      list.forEach(item => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'card-tile' + (item.id === selectedId ? ' selected' : '');
        btn.style.background = hueBg(item.hue);
        btn.setAttribute('aria-label', item.name + ', ' + item.rarity);
        btn.dataset.id = item.id;

        if (item.kind !== 'single') {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = item.kind === 'sealed' ? 'SEALED' : ('PSA ' + item.grade);
          btn.appendChild(badge);
        }
        const name = document.createElement('span');
        name.className = 'cname';
        name.textContent = item.name;
        btn.appendChild(name);

        btn.addEventListener('click', () => {
          selectedId = item.id;
          renderGrid();
          renderSlab(item);
        });
        grid.appendChild(btn);
      });
    }

    function renderSlab(item) {
      slab.classList.add('show');
      slab.innerHTML = '';
      const art = document.createElement('div');
      art.className = 'slab-art';
      art.style.background = hueBg(item.hue);
      slab.appendChild(art);

      const info = document.createElement('div');
      info.className = 'slab-info';
      const badgeHtml = item.kind === 'sealed'
        ? '<span class="grade-badge grade-raw">SEALED</span>'
        : (item.grade
          ? '<span class="grade-badge ' + gradeClass(item) + '">PSA ' + item.grade + '</span>'
          : '<span class="grade-badge grade-raw">' + item.condition + '</span>');
      info.innerHTML =
        '<div class="sname">' + item.name + '</div>' +
        '<div class="srow">' + item.series + ' · ' + item.rarity + '</div>' +
        '<div class="srow">' + badgeHtml + '</div>' +
        '<div class="srow">Value ' + fmtSGD(item.value) + '</div>';
      slab.appendChild(info);
    }

    function renderSummary() {
      const list = filtered();
      const total = list.reduce((sum, i) => sum + i.value, 0);
      valueEl.textContent = fmtSGD(total);
      countEl.textContent = list.length + (list.length === 1 ? ' item' : ' items');
    }

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.setAttribute('aria-pressed', 'false'));
        chip.setAttribute('aria-pressed', 'true');
        filter = chip.dataset.filter;
        selectedId = null;
        slab.classList.remove('show');
        renderGrid();
        renderSummary();
      });
    });

    renderGrid();
    renderSummary();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
