/* ABYSS data layer. Seeded PRNG plus synthetic datasets for the four widgets.
   All numbers are clearly plausible synthetic figures, not real data. */
(function (global) {
  'use strict';

  // Mulberry32 seeded PRNG, deterministic across reloads.
  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- Collectibles: synthetic card inventory ----------
  const collSeries = ['Tidal Set', 'Rift Edition', 'Foil Run', 'Base Print', 'Vault Reserve'];
  const collNames = [
    'Fathom Serpent', 'Undertow Sprite', 'Brine Warden', 'Kelp Sentinel', 'Abyssal Kite',
    'Glasswing Ray', 'Trench Hopper', 'Current Weaver', 'Pale Anemone', 'Driftling',
    'Lanternjaw', 'Saltmark Fox'
  ];
  const rarities = ['Common', 'Uncommon', 'Rare', 'Holo Rare', 'Grail'];
  const conditions = ['NM', 'LP', 'MP'];
  const grades = [null, null, '9', '9.5', '10']; // null = ungraded single
  const kinds = ['single', 'single', 'single', 'graded', 'graded', 'sealed'];

  function buildCollectibles(seed) {
    const rng = makeRng(seed);
    const items = [];
    const n = 12;
    for (let i = 0; i < n; i++) {
      const kind = kinds[Math.floor(rng() * kinds.length)];
      const rarity = rarities[Math.floor(rng() * rarities.length)];
      const name = collNames[i % collNames.length];
      const series = collSeries[Math.floor(rng() * collSeries.length)];
      const basePrice = Math.round((8 + rng() * 220) * (rarity === 'Grail' ? 3.4 : rarity === 'Holo Rare' ? 1.8 : 1));
      const graded = kind === 'graded';
      const grade = graded ? grades[3 + Math.floor(rng() * 2)] : (kind === 'sealed' ? null : grades[Math.floor(rng() * 3)]);
      const condition = kind === 'sealed' ? 'Factory sealed' : (graded ? null : conditions[Math.floor(rng() * conditions.length)]);
      const value = graded ? Math.round(basePrice * (grade === '10' ? 2.6 : 1.7)) : (kind === 'sealed' ? Math.round(basePrice * 4.2) : basePrice);
      const hue = Math.floor(rng() * 360);
      items.push({
        id: 'c' + i,
        name: name,
        series: series,
        kind: kind, // single | graded | sealed
        rarity: rarity,
        condition: condition,
        grade: grade,
        value: value,
        hue: hue
      });
    }
    return items;
  }

  // ---------- Portfolio: asset classes ----------
  const portfolioClasses = [
    { key: 'sgx', label: 'SGX stocks', pct: 22 },
    { key: 'us', label: 'US stocks', pct: 26 },
    { key: 'crypto', label: 'Crypto', pct: 10 },
    { key: 'reit', label: 'Real estate', pct: 18 },
    { key: 'cash', label: 'Cash', pct: 9 },
    { key: 'cpf', label: 'CPF', pct: 15 }
  ];
  const PORTFOLIO_BASE_SGD = 480000; // plausible synthetic net worth figure, illustrative only

  // ---------- Trading: synthetic OHLC candles for MU ----------
  function buildCandles(seed, count) {
    const rng = makeRng(seed);
    const candles = [];
    let price = 96 + rng() * 8;
    for (let i = 0; i < count; i++) {
      const drift = (rng() - 0.48) * 2.4;
      const open = price;
      const close = Math.max(4, open + drift);
      const high = Math.max(open, close) + rng() * 1.4;
      const low = Math.min(open, close) - rng() * 1.4;
      const volume = Math.round(400000 + rng() * 900000);
      candles.push({ open: open, close: close, high: high, low: low, volume: volume });
      price = close;
    }
    return candles;
  }

  function ema(values, period) {
    const k = 2 / (period + 1);
    const out = [];
    let prev = values[0];
    for (let i = 0; i < values.length; i++) {
      const v = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
      out.push(v);
      prev = v;
    }
    return out;
  }

  function vwapSeries(candles) {
    let cumPV = 0, cumV = 0;
    return candles.map(c => {
      const typical = (c.high + c.low + c.close) / 3;
      cumPV += typical * c.volume;
      cumV += c.volume;
      return cumPV / cumV;
    });
  }

  function rsiSeries(closes, period) {
    const out = new Array(closes.length).fill(50);
    let gains = 0, losses = 0;
    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      const gain = Math.max(diff, 0);
      const loss = Math.max(-diff, 0);
      if (i <= period) {
        gains += gain; losses += loss;
        if (i === period) {
          const rs = losses === 0 ? 100 : gains / (losses || 1e-6);
          out[i] = 100 - 100 / (1 + rs);
        }
      } else {
        gains = (gains * (period - 1) + gain) / period;
        losses = (losses * (period - 1) + loss) / period;
        const rs = losses === 0 ? 100 : gains / (losses || 1e-6);
        out[i] = 100 - 100 / (1 + rs);
      }
    }
    for (let i = 1; i < out.length; i++) if (out[i] === undefined) out[i] = out[i - 1];
    return out;
  }

  function macdSeries(closes) {
    const ema12 = ema(closes, 12);
    const ema26 = ema(closes, 26);
    const macd = closes.map((_, i) => ema12[i] - ema26[i]);
    const signal = ema(macd, 9);
    const hist = macd.map((v, i) => v - signal[i]);
    return { macd: macd, signal: signal, hist: hist };
  }

  global.ABYSS_DATA = {
    makeRng: makeRng,
    collectibles: buildCollectibles(20260721),
    portfolioClasses: portfolioClasses,
    portfolioBase: PORTFOLIO_BASE_SGD,
    candles: buildCandles(20260721, 64),
    indicators: { ema, vwapSeries, rsiSeries, macdSeries }
  };
})(window);
