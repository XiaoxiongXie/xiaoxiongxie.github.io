// Preserve bookmarks after moving the biography and contact details onto Home.
(() => {
  const destination = new URL('../', window.location.href);
  destination.hash = ['#contact', '#collaboration'].includes(window.location.hash)
    ? window.location.hash : '#about';
  window.location.replace(destination.href);
})();
