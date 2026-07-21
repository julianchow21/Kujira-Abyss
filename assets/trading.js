/* Trading miniature: canvas candlestick chart for MU, seeded synthetic OHLC,
   toggleable VWAP, EMA, RSI and MACD overlays. Read-only, no order execution. */
(function () {
  'use strict';

  function fmtUSD(n) { return '$' + n.toFixed(2); }

  function init() {
    const root = document.getElementById('tr-widget');
    if (!root) return;
    const canvas = root.querySelector('.tr-canvas');
    const rsiCanvas = root.querySelector('.tr-rsi');
    const macdCanvas = root.querySelector('.tr-macd');
    const rsiRow = root.querySelector('.tr-rsi-row');
    const macdRow = root.querySelector('.tr-macd-row');
    const priceEl = root.querySelector('.tr-price .p');
    const chgEl = root.querySelector('.tr-price .chg');
    const toggles = Array.from(root.querySelectorAll('.tr-toolbar input[type="checkbox"]'));

    const candles = window.ABYSS_DATA.candles;
    const closes = candles.map(c => c.close);
    const ind = window.ABYSS_DATA.indicators;
    const ema9 = ind.ema(closes, 9);
    const ema21 = ind.ema(closes, 21);
    const vwap = ind.vwapSeries(candles);
    const rsi = ind.rsiSeries(closes, 14);
    const macd = ind.macdSeries(closes);

    const state = { vwap: true, ema: true, rsi: false, macd: false };

    function drawMain() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      canvas.width = w * dpr; canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const allVals = candles.flatMap(c => [c.high, c.low]).concat(state.vwap ? vwap : []).concat(state.ema ? ema9.concat(ema21) : []);
      const max = Math.max(...allVals) * 1.01;
      const min = Math.min(...allVals) * 0.99;
      const range = max - min || 1;
      const n = candles.length;
      const slot = w / n;
      const candleW = Math.max(2, slot * 0.6);

      function y(v) { return h - ((v - min) / range) * h; }

      // gridlines
      ctx.strokeStyle = 'rgba(238,244,242,0.06)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const gy = (h / 4) * i;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      candles.forEach((c, i) => {
        const x = i * slot + slot / 2;
        const up = c.close >= c.open;
        ctx.strokeStyle = up ? '#35f0b4' : '#ff6d6d';
        ctx.fillStyle = up ? '#35f0b4' : '#ff6d6d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y(c.high));
        ctx.lineTo(x, y(c.low));
        ctx.stroke();
        const bodyTop = y(Math.max(c.open, c.close));
        const bodyBot = y(Math.min(c.open, c.close));
        ctx.fillRect(x - candleW / 2, bodyTop, candleW, Math.max(1, bodyBot - bodyTop));
      });

      function line(series, color) {
        ctx.beginPath();
        series.forEach((v, i) => {
          const x = i * slot + slot / 2;
          const yy = y(v);
          if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      if (state.vwap) line(vwap, 'rgba(255,210,122,0.9)');
      if (state.ema) { line(ema9, 'rgba(109,255,206,0.95)'); line(ema21, 'rgba(143,208,255,0.9)'); }
    }

    function drawRsi() {
      if (!state.rsi) return;
      const w = rsiCanvas.clientWidth, h = rsiCanvas.clientHeight;
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      rsiCanvas.width = w * dpr; rsiCanvas.height = h * dpr;
      const ctx = rsiCanvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const n = rsi.length, slot = w / n;
      function y(v) { return h - (v / 100) * h; }
      [30, 70].forEach(level => {
        ctx.strokeStyle = 'rgba(238,244,242,0.14)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(0, y(level)); ctx.lineTo(w, y(level)); ctx.stroke();
        ctx.setLineDash([]);
      });
      ctx.beginPath();
      rsi.forEach((v, i) => {
        const x = i * slot + slot / 2;
        if (i === 0) ctx.moveTo(x, y(v)); else ctx.lineTo(x, y(v));
      });
      ctx.strokeStyle = '#8fd0ff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    function drawMacd() {
      if (!state.macd) return;
      const w = macdCanvas.clientWidth, h = macdCanvas.clientHeight;
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      macdCanvas.width = w * dpr; macdCanvas.height = h * dpr;
      const ctx = macdCanvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const n = macd.hist.length, slot = w / n;
      const maxAbs = Math.max(0.01, ...macd.hist.map(Math.abs), ...macd.macd.map(Math.abs), ...macd.signal.map(Math.abs));
      function y(v) { return h / 2 - (v / maxAbs) * (h / 2 - 2); }
      macd.hist.forEach((v, i) => {
        const x = i * slot + slot / 2;
        ctx.fillStyle = v >= 0 ? 'rgba(53,240,180,0.55)' : 'rgba(255,109,109,0.55)';
        const zero = y(0), top = y(v);
        ctx.fillRect(x - slot * 0.3, Math.min(zero, top), Math.max(1, slot * 0.6), Math.abs(top - zero));
      });
      function line(series, color) {
        ctx.beginPath();
        series.forEach((v, i) => {
          const x = i * slot + slot / 2;
          const yy = y(v);
          if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        });
        ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.stroke();
      }
      line(macd.macd, '#6dffce');
      line(macd.signal, '#ffd27a');
    }

    function renderPrice() {
      const last = candles[candles.length - 1];
      const prev = candles[candles.length - 2];
      priceEl.textContent = fmtUSD(last.close);
      const chg = last.close - prev.close;
      const pct = (chg / prev.close) * 100;
      chgEl.textContent = (chg >= 0 ? '+' : '') + chg.toFixed(2) + ' (' + (chg >= 0 ? '+' : '') + pct.toFixed(2) + '%)';
      chgEl.classList.toggle('up', chg >= 0);
      chgEl.classList.toggle('down', chg < 0);
    }

    function renderAll() {
      drawMain();
      rsiRow.classList.toggle('show', state.rsi);
      macdRow.classList.toggle('show', state.macd);
      if (state.rsi) drawRsi();
      if (state.macd) drawMacd();
    }

    toggles.forEach(t => {
      t.addEventListener('change', () => {
        state[t.dataset.indicator] = t.checked;
        renderAll();
      });
    });

    window.addEventListener('resize', renderAll);
    renderPrice();
    renderAll();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
