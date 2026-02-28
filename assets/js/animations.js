(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    nodes.forEach((n, i) => { n.style.transitionDelay = `${i * 100}ms`; io.observe(n); });
  }

  function animateCounters() {
    const grid = document.getElementById('stats-grid');
    if (!grid) return;
    const counters = grid.querySelectorAll('[data-counter]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        counters.forEach((el) => {
          const target = Number(el.dataset.counter || 0);
          const start = performance.now();
          const duration = 2000;
          function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(target * eased);
            el.textContent = target >= 1000000000 ? `$${Math.round(value / 1000000000)}B` : new Intl.NumberFormat('en-US').format(value);
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
        io.disconnect();
      });
    }, { threshold: 0.25 });
    io.observe(grid);
  }

  function initParticles() {
    if (reduceMotion) return;
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const COUNT = 80;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.8,
        vy: Math.random() * 0.5 + 0.2,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.vy;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,45,85,${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(loop);
    }
    loop();
  }

  function parallax() {
    if (reduceMotion) return;
    const heroVideo = document.querySelector('.hero-video');
    const heroText = document.querySelector('.hero-content');
    const heroCards = document.querySelector('.hero-cards');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (heroVideo) heroVideo.style.transform = `translateY(${y * 0.2}px)`;
      if (heroText) heroText.style.transform = `translateY(${y * 0.5}px)`;
      if (heroCards) heroCards.style.transform = `translate(-50%, ${y * 0.08}px)`;
    }, { passive: true });
  }

  initReveal();
  animateCounters();
  initParticles();
  parallax();
})();
