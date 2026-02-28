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

  async function getAllPosts() {
    try {
      const res = await fetch(sitePath('/data/posts.json'), { cache: 'no-store' });
      return res.json();
    } catch {
      return [
        {
          slug: 'fifa-world-cup-2026-complete-guide',
          title: 'FIFA World Cup 2026 Complete Guide',
          category: 'fifa',
          author: 'HJTrending Sports Desk',
          date: '2026-02-23',
          readTime: '8 min',
          thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=85&auto=format',
          thumbnailAlt: 'FIFA World Cup 2026 stadium',
          excerpt: 'Complete World Cup 2026 guide.',
          file: '/content/fifa/world-cup-2026-guide.md',
          tags: ['fifa'],
          schemaType: 'NewsArticle'
        }
      ];
    }
  }

  function articleSchema(post, canonical) {
    return {
      '@context': 'https://schema.org',
      '@type': post.schemaType || 'NewsArticle',
      headline: post.title,
      image: post.thumbnail,
      datePublished: post.date,
      dateModified: post.modified || post.date,
      author: { '@type': 'Person', name: post.author },
      publisher: { '@type': 'NewsMediaOrganization', name: 'HJTrending' },
      articleSection: post.category,
      keywords: (post.tags || []).join(', '),
      wordCount: post.wordCount || 1200,
      description: post.excerpt,
      mainEntityOfPage: canonical
    };
  }

  function breadcrumbSchema(post, canonical) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://hjtrending.site/' },
        { '@type': 'ListItem', position: 2, name: post.category.toUpperCase(), item: `https://hjtrending.site/${post.category}/` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical }
      ]
    };
  }

  function addJsonLd(obj) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(obj);
    document.head.appendChild(script);
  }

  function updateMeta(post, canonical) {
    document.title = `${post.title} | HJTrending`;
    const desc = document.querySelector('meta[name="description"]');
    const canon = document.querySelector('link[rel="canonical"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (desc) desc.setAttribute('content', post.excerpt);
    if (canon) canon.setAttribute('href', canonical);
    if (ogTitle) ogTitle.setAttribute('content', post.title);
    if (ogDesc) ogDesc.setAttribute('content', post.excerpt);
    if (ogImage) ogImage.setAttribute('content', post.thumbnail);
  }

  function readProgress() {
    const bar = document.getElementById('read-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const max = document.body.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (scrolled / max) * 100 : 0;
      bar.style.width = `${pct}%`;
    }, { passive: true });
  }

  async function renderPostPage() {
    const host = document.getElementById('post-content');
    if (!host) return;

    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug');
    const posts = await getAllPosts();
    const post = posts.find((p) => p.slug === slug) || posts[0];
    if (!post) return;

    let md = '';
    try {
      md = await fetch(sitePath(post.file), { cache: 'no-store' }).then((r) => r.text());
    } catch {
      md = '# Local preview mode\n\nStart a local server to load full markdown articles and JSON data.';
    }

    const parser = window.marked ? window.marked.parse : (s) => s.replace(/\n/g, '<br>');

    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-author').textContent = post.author;
    document.getElementById('post-date').textContent = new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.getElementById('post-read').textContent = post.readTime;
    document.getElementById('post-category').textContent = post.category.toUpperCase();
    document.getElementById('post-image').src = post.thumbnail;
    document.getElementById('post-image').alt = post.thumbnailAlt;
    host.innerHTML = parser(md);

    const canonical = `https://hjtrending.site/post/?slug=${post.slug}`;
    updateMeta(post, canonical);
    addJsonLd(articleSchema(post, canonical));
    addJsonLd(breadcrumbSchema(post, canonical));

    const related = posts.filter((p) => p.category === post.category && p.slug !== post.slug).slice(0, 3);
    const relatedHost = document.getElementById('related-grid');
    if (relatedHost) {
      relatedHost.innerHTML = related.map((r) => `<a class="article-card" href="${sitePath(`/post/?slug=${r.slug}`)}"><h3>${r.title}</h3><p class="card-meta">${r.readTime}</p></a>`).join('');
    }

    const idx = posts.findIndex((p) => p.slug === post.slug);
    const prev = posts[idx - 1];
    const next = posts[idx + 1];
    const prevLink = document.getElementById('prev-post');
    const nextLink = document.getElementById('next-post');
    if (prevLink) prevLink.href = prev ? sitePath(`/post/?slug=${prev.slug}`) : '#';
    if (prevLink) prevLink.textContent = prev ? `Previous: ${prev.title}` : 'No previous post';
    if (nextLink) nextLink.href = next ? sitePath(`/post/?slug=${next.slug}`) : '#';
    if (nextLink) nextLink.textContent = next ? `Next: ${next.title}` : 'No next post';

    const shareUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(post.title);
    const sx = document.getElementById('share-x');
    const sf = document.getElementById('share-fb');
    const sw = document.getElementById('share-wa');
    if (sx) sx.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
    if (sf) sf.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
    if (sw) sw.href = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;

    const copy = document.getElementById('copy-link');
    if (copy) {
      copy.addEventListener('click', async () => {
        await navigator.clipboard.writeText(window.location.href);
        copy.textContent = 'Copied';
      });
    }

    readProgress();
  }

  renderPostPage().catch(console.error);
})();
