/* Portfolio miniature: allocation redistribution, net worth figure, FIRE projection curve. */
(function () {
  'use strict';

  const FIRE_TARGET = 2000000; // illustrative synthetic target, not real data

  function fmtSGD(n) {
    return 'S$' + Math.round(n).toLocaleString('en-SG');
  }

  function init() {
    const root = document.getElementById('pf-widget');
    if (!root) return;
    const rowsWrap = root.querySelector('.alloc-rows');
    const bar = root.querySelector('.alloc-bar');
    const netWorthEl = root.querySelector('.pf-networth');
    const yearsEl = root.querySelector('.pf-years');
    const emptyEl = root.querySelector('.pf-empty');
    const savingsInput = root.querySelector('#pf-savings');
    const savingsOut = root.querySelector('#pf-savings-out');
    const returnInput = root.querySelector('#pf-return');
    const returnOut = root.querySelector('#pf-return-out');
    const canvas = root.querySelector('.pf-canvas');
    const ctx = canvas.getContext('2d');

    const classes = window.ABYSS_DATA.portfolioClasses.map(c => Object.assign({ included: true }, c));
    const colors = ['#35f0b4', '#6dffce', '#8fd0ff', '#c9a8ff', '#ffd27a', '#ff9d9d'];

    classes.forEach((c, i) => {
      const row = document.createElement('div');
      row.className = 'alloc-row';
      row.dataset.key = c.key;
      row.innerHTML =
        '<label><input type="checkbox" checked data-role="toggle"><span>' + c.label + '</span></label>' +
        '<input type="range" min="0" max="100" value="' + c.pct + '" data-role="slider">' +
        '<span class="pct" data-role="pct">' + c.pct + '%</span>';
      row.style.setProperty('--dot', colors[i % colors.length]);
      rowsWrap.appendChild(row);
    });

    const rowEls = Array.from(rowsWrap.querySelectorAll('.alloc-row'));

    function included() { return classes.filter(c => c.included); }

    function normalize(changedKey) {
      const inc = included();
      if (!inc.length) return;
      const total = inc.reduce((s, c) => s + c.pct, 0);
      if (total === 0) {
        const even = 100 / inc.length;
        inc.forEach(c => c.pct = even);
        return;
      }
      const scale = 100 / total;
      inc.forEach(c => c.pct = c.pct * scale);
    }

    function renderRows() {
      rowEls.forEach((row, i) => {
        const c = classes[i];
        const slider = row.querySelector('[data-role="slider"]');
        const pctEl = row.querySelector('[data-role="pct"]');
        const toggle = row.querySelector('[data-role="toggle"]');
        row.classList.toggle('disabled', !c.included);
        slider.disabled = !c.included;
        slider.value = Math.round(c.pct);
        pctEl.textContent = Math.round(c.pct) + '%';
        toggle.checked = c.included;
      });
    }

    function renderBar() {
      bar.innerHTML = '';
      const inc = included();
      if (!inc.length) return;
      inc.forEach((c) => {
        const idx = classes.indexOf(c);
        const span = document.createElement('span');
        span.style.width = c.pct + '%';
        span.style.background = colors[idx % colors.length];
        span.title = c.label + ' ' + Math.round(c.pct) + '%';
        bar.appendChild(span);
      });
    }

    function currentNetWorth() {
      const inc = included();
      if (!inc.length) return 0;
      return window.ABYSS_DATA.portfolioBase;
    }

    function computeYearsToFire(netWorth, monthlySavings, annualReturn) {
      if (netWorth >= FIRE_TARGET) return 0;
      const r = annualReturn / 12;
      let balance = netWorth;
      for (let month = 1; month <= 12 * 60; month++) {
        balance = balance * (1 + r) + monthlySavings;
        if (balance >= FIRE_TARGET) return month / 12;
      }
      return null; // does not reach within 60 years
    }

    function drawCurve(netWorth, monthlySavings, annualReturn) {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (netWorth <= 0) return;

      const r = annualReturn / 12;
      const years = 30;
      const points = [];
      let balance = netWorth;
      for (let m = 0; m <= years * 12; m++) {
        if (m > 0) balance = balance * (1 + r) + monthlySavings;
        if (m % 3 === 0) points.push(balance);
      }
      const maxVal = Math.max(FIRE_TARGET, ...points) * 1.05;
      const pad = 8;

      // FIRE target line
      const targetY = h - pad - (FIRE_TARGET / maxVal) * (h - pad * 2);
      ctx.strokeStyle = 'rgba(238,244,242,0.25)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, targetY); ctx.lineTo(w, targetY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(238,244,242,0.4)';
      ctx.font = '10px monospace';
      ctx.fillText('target', 4, Math.max(10, targetY - 4));

      ctx.beginPath();
      points.forEach((v, i) => {
        const x = (i / (points.length - 1)) * w;
        const y = h - pad - Math.min(1, v / maxVal) * (h - pad * 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = '#35f0b4';
      ctx.lineWidth = 2;
      ctx.stroke();

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(53,240,180,0.28)');
      grad.addColorStop(1, 'rgba(53,240,180,0)');
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function renderAll() {
      renderRows();
      renderBar();
      const inc = included();
      const netWorth = currentNetWorth();

      if (!inc.length) {
        emptyEl.style.display = 'block';
        emptyEl.textContent = 'No asset classes selected. Net worth reads S$0. Include at least one class to project FIRE.';
        netWorthEl.textContent = fmtSGD(0);
        yearsEl.textContent = 'n/a';
        drawCurve(0, 0, 0);
        return;
      }
      emptyEl.style.display = 'none';

      netWorthEl.textContent = fmtSGD(netWorth);
      const monthlySavings = parseInt(savingsInput.value, 10);
      const annualReturn = parseInt(returnInput.value, 10) / 100;
      savingsOut.textContent = fmtSGD(monthlySavings) + '/mo';
      returnOut.textContent = returnInput.value + '%/yr';

      const yrs = computeYearsToFire(netWorth, monthlySavings, annualReturn);
      yearsEl.textContent = yrs === null ? '60+ yrs' : (yrs === 0 ? 'already there' : yrs.toFixed(1) + ' yrs');
      drawCurve(netWorth, monthlySavings, annualReturn);
    }

    rowsWrap.addEventListener('input', (e) => {
      const row = e.target.closest('.alloc-row');
      if (!row) return;
      const idx = rowEls.indexOf(row);
      const c = classes[idx];
      if (e.target.dataset.role === 'toggle') {
        c.included = e.target.checked;
        if (!c.included) c.pct = 0;
        else if (c.pct === 0) c.pct = 5;
        normalize();
      } else if (e.target.dataset.role === 'slider') {
        const newVal = parseFloat(e.target.value);
        const others = included().filter(x => x !== c);
        const remaining = 100 - newVal;
        const othersTotal = others.reduce((s, x) => s + x.pct, 0);
        if (others.length) {
          if (othersTotal === 0) {
            const even = remaining / others.length;
            others.forEach(x => x.pct = even);
          } else {
            others.forEach(x => x.pct = (x.pct / othersTotal) * remaining);
          }
        }
        c.pct = newVal;
      }
      renderAll();
    });

    savingsInput.addEventListener('input', renderAll);
    returnInput.addEventListener('input', renderAll);
    window.addEventListener('resize', renderAll);

    renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
