/* ABYSS core: boot sequence, nav, scroll depth, particle field, hero crossfade, stat counters. */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MAX_DEPTH_M = 6200;

  // ---------- boot sequence ----------
  function runBoot() {
    const boot = document.getElementById('boot');
    if (!boot) return;
    const depthEl = boot.querySelector('.boot-depth');
    const barSpan = boot.querySelector('.boot-bar span');
    const skipBtn = boot.querySelector('.boot-skip');

    function finish() {
      boot.classList.add('hidden');
      document.body.classList.remove('boot-lock');
      window.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter') finish(); }

    if (reduceMotion) { finish(); return; }

    document.body.classList.add('boot-lock');
    skipBtn.addEventListener('click', finish);
    boot.addEventListener('click', finish);
    window.addEventListener('keydown', onKey);

    const duration = 1400;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const depth = Math.round(p * 4200);
      depthEl.textContent = depth.toLocaleString('en-SG') + 'm';
      barSpan.style.width = (p * 100).toFixed(1) + '%';
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(finish, 260);
      }
    }
    requestAnimationFrame(tick);
  }

  // ---------- nav ----------
  function setupNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
        if (open) {
          const first = nav.querySelector('a');
          if (first) first.focus();
        } else {
          toggle.focus();
        }
      });
      nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    const links = Array.from(document.querySelectorAll('nav.site-nav a[href^="#"]'));
    const targets = links
      .map(a => ({ a: a, el: document.querySelector(a.getAttribute('href')) }))
      .filter(x => x.el);

    if ('IntersectionObserver' in window && targets.length) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const match = targets.find(t => t.el === entry.target);
          if (!match) return;
          if (entry.isIntersecting) {
            links.forEach(a => a.classList.remove('active'));
            match.a.classList.add('active');
          }
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      targets.forEach(t => io.observe(t.el));
    }
  }

  // ---------- scroll depth readout + zone shift ----------
  function setupDepth() {
    const readout = document.getElementById('depth-readout');
    const zoneSections = Array.from(document.querySelectorAll('[data-zone]'));
    let ticking = false;

    function apply() {
      ticking = false;
      const doc = document.documentElement;
      const max = Math.max(1, doc.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));
      const depth = Math.round(p * MAX_DEPTH_M);
      if (readout) readout.textContent = 'DEPTH ' + depth.toLocaleString('en-SG') + 'm';

      let currentZone = 'surface';
      zoneSections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.5) currentZone = sec.dataset.zone;
      });
      document.body.setAttribute('data-zone', currentZone);
    }

    function onScroll() {
      if (!ticking) { requestAnimationFrame(apply); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply();
  }

  // ---------- hero pinned crossfade ----------
  function setupHero() {
    const pin = document.getElementById('hero-pin');
    if (!pin) return;
    const lines = Array.from(pin.querySelectorAll('.hero-line'));
    const final = pin.querySelector('.hero-final');
    if (reduceMotion) {
      lines.forEach(l => l.style.display = 'none');
      if (final) final.classList.add('show');
      return;
    }
    const segLen = 1 / (lines.length + 1);
    let ticking = false;

    function apply() {
      ticking = false;
      const rect = pin.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

      lines.forEach((line, i) => {
        const segStart = i * segLen;
        const segEnd = segStart + segLen;
        const local = (p - segStart) / (segEnd - segStart);
        let opacity = 0, translate = 24, scale = 0.96;
        if (local >= 0 && local <= 1) {
          const fadeIn = i === 0 ? 1 : Math.min(1, local / 0.3);
          const fadeOut = local > 0.7 ? Math.min(1, (local - 0.7) / 0.3) : 0;
          opacity = Math.max(0, fadeIn - fadeOut);
          translate = 24 * (1 - fadeIn) - 10 * fadeOut;
          scale = 0.96 + 0.04 * fadeIn;
        } else if (i === 0 && p < segStart) {
          // before scrolling starts, keep the first line fully visible
          opacity = 1; translate = 0; scale = 1;
        }
        line.style.opacity = opacity.toFixed(3);
        line.style.transform = 'translateY(' + translate.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
      });

      if (final) {
        if (p >= 1 - segLen * 0.9) final.classList.add('show');
        else final.classList.remove('show');
      }
    }

    function onScroll() { if (!ticking) { requestAnimationFrame(apply); ticking = true; } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    apply();
  }

  // ---------- stat counters ----------
  function setupCounters() {
    const stats = Array.from(document.querySelectorAll('.stat .num[data-target]'));
    if (!stats.length) return;

    function animate(el) {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
      if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
      const duration = 900;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = val.toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.6 });
      stats.forEach(s => io.observe(s));
    } else {
      stats.forEach(animate);
    }
  }

  // ---------- particle field ----------
  function setupParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    // Reduced motion is a permanent bail, this is intentional and does not re-evaluate.
    if (reduceMotion) {
      canvas.style.display = 'none';
      return;
    }

    const MIN_WIDTH = 900;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(1.75, window.devicePixelRatio || 1);
    let w, h, particles;
    let rafId = null;
    let active = false;

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticles() {
      const rng = window.ABYSS_DATA.makeRng(4471);
      const count = 54;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: rng() * w,
          y: rng() * h,
          r: 0.6 + rng() * 1.8,
          vy: 0.06 + rng() * 0.18,
          vx: (rng() - 0.5) * 0.06,
          glow: rng() > 0.86,
          phase: rng() * Math.PI * 2
        });
      }
    }

    let t = 0;
    function draw() {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.y -= p.vy;
        p.x += p.vx;
        if (p.y < -4) p.y = h + 4;
        if (p.x < -4) p.x = w + 4;
        if (p.x > w + 4) p.x = -4;
        const pulse = p.glow ? (Math.sin(t + p.phase) * 0.3 + 0.7) : 1;
        ctx.beginPath();
        ctx.fillStyle = p.glow
          ? 'rgba(53,240,180,' + (0.35 * pulse).toFixed(2) + ')'
          : 'rgba(238,244,242,0.16)';
        ctx.arc(p.x, p.y, p.r * (p.glow ? pulse + 0.6 : 1), 0, Math.PI * 2);
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (active) return;
      active = true;
      canvas.style.display = '';
      resize();
      makeParticles();
      rafId = requestAnimationFrame(draw);
    }

    function stop() {
      active = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      canvas.style.display = 'none';
    }

    function evaluate() {
      if (window.innerWidth >= MIN_WIDTH) {
        if (active) { resize(); makeParticles(); }
        else start();
      } else {
        stop();
      }
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(evaluate, 150);
    });

    evaluate();
  }

  document.addEventListener('DOMContentLoaded', function () {
    runBoot();
    setupNav();
    setupDepth();
    setupHero();
    setupCounters();
    setupParticles();

    const yearEl = document.getElementById('boot-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
