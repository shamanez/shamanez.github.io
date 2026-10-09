/* Motion only adds emphasis. Native details provide the interactive examples. */
(() => {
  'use strict';
  const figures = [...document.querySelectorAll('.essay-figure')];
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.target.classList.toggle('ef-is-visible', entry.isIntersecting));
  }, { rootMargin: '30px', threshold: 0.05 });
  figures.forEach(figure => observer.observe(figure));
})();
