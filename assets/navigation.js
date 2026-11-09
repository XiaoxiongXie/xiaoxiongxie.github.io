// Close the mobile menu before following an anchor on the current page.
// Quarto handles links to other pages; this covers Home -> Contact.
(() => {
  const menu = document.getElementById('navbarCollapse');
  const toggle = document.querySelector('.navbar-toggler');
  if (!menu || !toggle) return;
  const pagePath = path => path.replace(/index\.html$/, '');
  menu.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || toggle.getAttribute('aria-expanded') !== 'true') return;
    const destination = new URL(link.href, location.href);
    if (!destination.hash || destination.origin !== location.origin || pagePath(destination.pathname) !== pagePath(location.pathname)) return;
    const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
    if (!target) return;
    event.preventDefault();
    menu.addEventListener('hidden.bs.collapse', () => {
      location.hash = destination.hash;
      target.scrollIntoView({ block: 'start' });
    }, { once: true });
    toggle.click();
  });
})();
