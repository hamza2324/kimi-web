#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content');
const DATA_DIR = path.join(ROOT, 'data');
const SITE_URL = 'https://hjtrending.site';

const categoryRoute = {
  fifa: '/fifa/world-cup-2026/',
  sports: '/sports/articles/',
  entertainment: '/entertainment/articles/',
  trending: '/trending/articles/',
  gaming: '/gaming/articles/',
  news: '/news/articles/'
};

const defaults = {
  author: 'HJTrending Editorial Team',
  schemaType: 'NewsArticle',
  thumbnail: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&q=85&auto=format',
  thumbnailAlt: 'Breaking trend coverage on HJTrending',
  excerpt: 'Latest trending coverage from HJTrending.',
  readTime: '4 min',
  wordCount: 800
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith('.md') ? [full] : [];
  });
}

function parseFrontmatter(raw) {
  raw = raw.replace(/^\uFEFF/, '');
  const match = raw.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---[\r\n]*/);
  if (!match) return { meta: {}, body: raw };
  const fm = match[1].trim().replace(/\r\n/g, '\n');
  const body = raw.slice(match[0].length);
  const meta = {};
  for (const line of fm.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (/^\[.*\]$/.test(val)) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);
    } else if (val === 'true' || val === 'false') {
      val = val === 'true';
    } else {
      val = val.replace(/^"|"$/g, '');
    }
    meta[key] = val;
  }
  return { meta, body };
}

function slugify(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function titleFromBody(body, fallback) {
  const m = body.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function excerptFromBody(body) {
  const clean = body
    .replace(/^#.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[>*_`#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.slice(0, 155);
}

function words(body) {
  return body.split(/\s+/).filter(Boolean).length;
}

const posts = walk(CONTENT_DIR).map((file, idx) => {
  const raw = fs.readFileSync(file, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const rel = '/' + path.relative(ROOT, file).replace(/\\/g, '/');
  const category = meta.category || path.basename(path.dirname(file));
  const title = meta.title || titleFromBody(body, path.basename(file, '.md'));
  const slug = meta.slug || slugify(title);
  const wordCount = Number(meta.wordCount || words(body));
  const route = categoryRoute[category] || '/blog/';
  const url = meta.url || `${route}${slug}.html`;
  const date = meta.date || new Date().toISOString().slice(0, 10);

  return {
    id: meta.id || `${category}-${String(idx + 1).padStart(3, '0')}`,
    title,
    slug,
    category,
    subcategory: meta.subcategory || '',
    file: rel,
    url,
    tags: Array.isArray(meta.tags) ? meta.tags : [category, 'trending news'],
    date,
    modified: meta.modified || date,
    author: meta.author || defaults.author,
    thumbnail: meta.thumbnail || defaults.thumbnail,
    thumbnailAlt: meta.thumbnailAlt || defaults.thumbnailAlt,
    excerpt: meta.excerpt || excerptFromBody(body),
    readTime: meta.readTime || `${Math.max(1, Math.round(wordCount / 220))} min`,
    wordCount,
    featured: Boolean(meta.featured),
    trending: Boolean(meta.trending),
    breaking: Boolean(meta.breaking),
    views: Number(meta.views || 0),
    schemaType: meta.schemaType || defaults.schemaType
  };
}).sort((a, b) => b.date.localeCompare(a.date));

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(path.join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2) + '\n');

const cats = [...new Set(posts.map((p) => p.category))];
for (const cat of cats) {
  fs.writeFileSync(path.join(DATA_DIR, `${cat}-posts.json`), JSON.stringify(posts.filter((p) => p.category === cat), null, 2) + '\n');
}

const breaking = {
  updated: new Date().toISOString(),
  items: posts.filter((p) => p.breaking || p.trending).slice(0, 8).map((p) => ({
    title: p.title,
    url: `/blog-post.html?slug=${encodeURIComponent(p.slug)}`
  }))
};
fs.writeFileSync(path.join(DATA_DIR, 'breaking-news.json'), JSON.stringify(breaking, null, 2) + '\n');

const staticUrls = [
  '/', '/fifa/', '/sports/', '/entertainment/', '/trending/', '/gaming/',
  '/news/', '/about/', '/contact/', '/privacy-policy/', '/disclaimer/', '/terms-of-service/', '/cookie-policy/', '/editorial-policy/', '/blog-post.html'
];
const postUrls = posts.map((p) => `/blog-post.html?slug=${encodeURIComponent(p.slug)}`);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticUrls, ...postUrls].map((u) => `  <url><loc>${SITE_URL}${u}</loc><changefreq>daily</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

const newsItems = posts.slice(0, 20).map((p) => `  <url>\n    <loc>${SITE_URL}/blog-post.html?slug=${encodeURIComponent(p.slug)}</loc>\n    <news:news>\n      <news:publication><news:name>HJTrending</news:name><news:language>en</news:language></news:publication>\n      <news:publication_date>${p.date}</news:publication_date>\n      <news:title>${p.title.replace(/[&<>]/g, '')}</news:title>\n    </news:news>\n  </url>`).join('\n');
const newsXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${newsItems}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap-news.xml'), newsXml);

console.log(`Generated ${posts.length} posts and SEO sitemaps.`);
