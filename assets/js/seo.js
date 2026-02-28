(function(){
  const title = document.title;
  if (!title.includes('HJTrending')) return;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) return;
  canonical.href = window.location.origin + window.location.pathname;
})();
