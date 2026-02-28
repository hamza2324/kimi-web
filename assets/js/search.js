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

  const overlay = document.getElementById('search-overlay');
  const open = document.getElementById('open-search');
  const openMobile = document.getElementById('open-search-mobile');
  const close = document.getElementById('close-search');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');

  let allPosts = [];
  let timer;

  async function loadPosts() {
    if (allPosts.length) return;
    try {
      const res = await fetch(sitePath('/data/posts.json'), { cache: 'no-store' });
      allPosts = await res.json();
    } catch {
      allPosts = [
        { slug: 'fifa-world-cup-2026-complete-guide', title: 'FIFA World Cup 2026 Complete Guide', excerpt: 'Format, venues, teams and predictions', tags: ['fifa'] },
        { slug: 'kpop-demon-hunters-hidden-lore-soda-pop', title: 'KPop Demon Hunters Hidden Lore', excerpt: 'Why Soda Pop exploded globally', tags: ['kpop'] },
        { slug: 'viral-sports-moments-2026', title: 'Viral Sports Moments 2026', excerpt: 'Top clips changing fan culture', tags: ['sports'] }
      ];
    }
  }

  function esc(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, q) {
    const re = new RegExp(`(${esc(q)})`, 'ig');
    return text.replace(re, '<mark>$1</mark>');
  }

  function setOpen(state) {
    if (!overlay) return;
    overlay.classList.toggle('open', state);
    overlay.setAttribute('aria-hidden', String(!state));
    document.body.style.overflow = state ? 'hidden' : '';
    if (state) setTimeout(() => input && input.focus(), 80);
  }

  [open, openMobile].forEach((b) => b && b.addEventListener('click', () => setOpen(true)));
  if (close) close.addEventListener('click', () => setOpen(false));
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) setOpen(false); });

  if (input) {
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await loadPosts();
        const q = input.value.trim().toLowerCase();
        if (!q) { results.innerHTML = ''; return; }
        const found = allPosts.filter((p) => (`${p.title} ${p.excerpt} ${(p.tags || []).join(' ')}`).toLowerCase().includes(q)).slice(0, 8);
        if (!found.length) {
          results.innerHTML = '<p class="search-result">No matches yet. Try FIFA 2026, KPop, or trending sports.</p>';
          return;
        }
        results.innerHTML = found.map((p) => `
          <a class="search-result" href="${sitePath(`/post/?slug=${encodeURIComponent(p.slug)}`)}">
            <strong>${highlight(p.title, q)}</strong>
            <p>${highlight(p.excerpt, q)}</p>
          </a>
        `).join('');
      }, 300);
    });
  }
})();
