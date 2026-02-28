(function () {
  function sitePath(path) {
    const clean = String(path || '').replace(/^\//, '');

    if (window.location.protocol === 'file:') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const depth = Math.max(0, segments.length - 1);
      return `${'../'.repeat(depth)}${clean}`;
    }

    if (window.location.hostname.endsWith('github.io')) {
      const parts = window.location.pathname.split('/').filter(Boolean);
      const base = parts.length ? `/${parts[0]}/` : '/';
      return `${base}${clean}`.replace(/\/{2,}/g, '/');
    }

    return `/${clean}`;
  }

  const nav = document.getElementById('site-nav');
  const backTop = document.getElementById('back-to-top');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  const openMenuMobile = document.getElementById('open-menu-mobile');
  const moneyFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

  window.addEventListener('scroll', () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 100);
    if (backTop) backTop.classList.toggle('show', window.scrollY > 600);
  });

  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  function toggleMenu(force) {
    if (!mobileMenu || !hamburger) return;
    const open = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', open);
    hamburger.classList.toggle('active', open);
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (hamburger) hamburger.addEventListener('click', () => toggleMenu());
  if (openMenuMobile) openMenuMobile.addEventListener('click', () => toggleMenu(true));
  if (mobileMenu) mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggleMenu(false)));

  function relativeFrom(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return rtf.format(-diffHour, 'hour');
    return rtf.format(-Math.floor(diffHour / 24), 'day');
  }

  function withImage(post) {
    return post.thumbnail || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=85&auto=format';
  }

  function categoryColor(category) {
    return {
      fifa: '#FF2D55',
      kpop: '#BF5FFF',
      sports: '#FF6B00',
      entertainment: '#00C4FF',
      gaming: '#00FF87',
      trending: '#FFD700'
    }[category] || '#FF2D55';
  }

  function renderWithData(posts, breaking) {
    const tickerTrack = document.getElementById('ticker-track');
    if (tickerTrack) {
      tickerTrack.innerHTML = [...breaking.items, ...breaking.items]
        .map((item) => `<a class="ticker-item" href="${sitePath(item.url)}">${item.title}<span class="ticker-sep">◆</span></a>`)
        .join('');
    }

    const fifaGrid = document.getElementById('fifa-grid');
    if (fifaGrid) {
      fifaGrid.innerHTML = posts.filter((p) => p.category === 'fifa').slice(0, 4)
        .map((p) => `<article class="article-card"><h3>${p.title}</h3><p class="card-meta">${p.author} - ${relativeFrom(p.modified || p.date)}</p></article>`)
        .join('');
    }

    const trendingGrid = document.getElementById('trending-grid');
    if (trendingGrid) {
      trendingGrid.innerHTML = posts.slice(0, 7).map((p, i) => {
        const cardClass = i === 0 ? 'trending-card article-card large' : 'trending-card article-card';
        const views = moneyFormatter.format((p.views || 0) + 1200);
        return `<article class="${cardClass}" data-cat="${p.category}" style="background:linear-gradient(180deg,rgba(8,8,8,.1),rgba(8,8,8,.92)),url('${withImage(p)}') center/cover">
          <span class="rank">${String(i + 1).padStart(2, '0')}</span>
          <span class="mono" style="color:${categoryColor(p.category)}">${p.category.toUpperCase()}</span>
          <h3>${p.title}</h3>
          <p class="card-meta">${p.author} - ${p.readTime} - views ${views}</p>
        </article>`;
      }).join('');
    }

    const sportsRow = document.getElementById('sports-scroll');
    if (sportsRow) {
      const badges = ['badge-hot', 'badge-just', 'badge-viral'];
      const labels = ['HOT', 'JUST IN', 'VIRAL'];
      sportsRow.innerHTML = posts.filter((p) => p.category === 'sports').slice(0, 6).map((p, i) => `
        <article class="sport-card article-card" style="background:linear-gradient(180deg,rgba(8,8,8,.1),rgba(8,8,8,.94)),url('${withImage(p)}') center/cover">
          <span class="${badges[i % badges.length]}">${labels[i % labels.length]}</span>
          <h3>${p.title}</h3>
          <p class="card-meta">${relativeFrom(p.date)}</p>
        </article>
      `).join('');
    }

    const updatedTime = document.getElementById('updated-time');
    if (updatedTime && posts[0]) updatedTime.textContent = `Updated ${relativeFrom(posts[0].modified || posts[0].date)}`;
  }

  async function renderDynamicSections() {
    try {
      const [postsRes, breakingRes] = await Promise.all([
        fetch(sitePath('/data/posts.json'), { cache: 'no-store' }),
        fetch(sitePath('/data/breaking-news.json'), { cache: 'no-store' })
      ]);
      const posts = await postsRes.json();
      const breaking = await breakingRes.json();
      renderWithData(posts, breaking);
    } catch (err) {
      const fallbackPosts = [
        { title: 'FIFA World Cup 2026 Complete Guide', category: 'fifa', author: 'HJTrending Sports Desk', readTime: '8 min', date: '2026-02-23', modified: '2026-02-25', views: 12400, thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=85&auto=format' },
        { title: 'KPop Demon Hunters Hidden Lore Explained', category: 'kpop', author: 'HJTrending Culture Lab', readTime: '7 min', date: '2026-02-22', modified: '2026-02-24', views: 15600, thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=85&auto=format' },
        { title: 'Viral Sports Moments 2026 Timeline', category: 'sports', author: 'Highlights Desk', readTime: '6 min', date: '2026-02-19', modified: '2026-02-24', views: 13400, thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=85&auto=format' }
      ];
      const fallbackBreaking = {
        items: [
          { title: 'World Cup 2026 schedule windows confirmed', url: '/fifa/' },
          { title: 'Demon Hunters soundtrack surges globally', url: '/kpop/' },
          { title: 'Viral sports clips rewrite fan culture', url: '/sports/' }
        ]
      };
      renderWithData(fallbackPosts, fallbackBreaking);
      console.warn('Using fallback data. Run with a local server for full data loading.', err);
    }
  }

  const tabs = document.getElementById('filter-tabs');
  if (tabs) {
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      tabs.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('#trending-grid .trending-card').forEach((card, i) => {
        const show = filter === 'all' || card.dataset.cat === filter;
        card.style.opacity = show ? '1' : '0';
        card.style.transform = show ? `translateY(${Math.min(i * 4, 20)}px)` : 'translateY(15px)';
        card.style.pointerEvents = show ? 'auto' : 'none';
      });
    });
  }

  if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register(sitePath('/assets/js/sw.js')).catch(() => {}));
  }

  renderDynamicSections();
})();
