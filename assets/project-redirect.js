// Preserve the former award bookmark while keeping Projects for funded research.
(() => {
  const redirectAward = () => {
    if (window.location.hash === '#cibse-award') {
      window.location.replace(new URL('../background/#cibse-award', window.location.href).href);
    }
  };
  redirectAward();
  window.addEventListener('hashchange', redirectAward);
})();
