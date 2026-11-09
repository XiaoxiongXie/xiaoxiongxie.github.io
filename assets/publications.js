// Progressive enhancement: all publications remain readable without JavaScript.
(() => {
  const controls = document.querySelector('#publication-controls');
  if (!controls) return;
  const search = document.querySelector('#publication-search');
  const year = document.querySelector('#publication-year');
  const topic = document.querySelector('#publication-topic');
  const entries = [...document.querySelectorAll('.publication')];
  const status = document.querySelector('#publication-count');
  const empty = document.querySelector('#publication-empty');
  const normalise = text => text.normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '');
  const texts = entries.map(entry => normalise(`${entry.textContent} ${JSON.parse(entry.dataset.topics).join(' ')}`));
  function filter() {
    const words = normalise(search.value.trim()).split(/\s+/).filter(Boolean);
    let count = 0;
    entries.forEach((entry, index) => {
      const show = words.every(word => texts[index].includes(word)) &&
        (!year.value || entry.dataset.year === year.value) &&
        (!topic.value || JSON.parse(entry.dataset.topics).includes(topic.value));
      entry.hidden = !show;
      if (show) count++;
    });
    status.textContent = `${count} of ${entries.length} publications`;
    empty.hidden = count !== 0;
  }
  controls.hidden = false;
  controls.addEventListener('input', filter);
  document.querySelector('#publication-reset').addEventListener('click', () => {
    search.value = year.value = topic.value = '';
    filter();
    search.focus();
  });
  // A topic link from another page can preselect a filter without hiding content from crawlers.
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  if ([...topic.options].some(option => option.value === requestedTopic)) topic.value = requestedTopic;
  filter();
})();
