(() => {
  const normalize = (text) => text.normalize('NFKC').toLocaleLowerCase().trim();
  const matches = (text, query) => normalize(query).split(/\s+/).every((word) => text.includes(word));
  const plainClick = (event) => !event.defaultPrevented && event.button === 0
    && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey;
  const hashTarget = () => {
    const raw = location.hash.slice(1);
    try { return document.getElementById(raw) || document.getElementById(decodeURIComponent(raw)); } catch { return null; }
  };
  const setHash = (hash, replace = false) => {
    if (location.hash !== hash) history[replace ? 'replaceState' : 'pushState'](null, '', hash);
  };
  document.querySelectorAll('[data-enhanced]').forEach((element) => { element.hidden = false; });

  const archiveSearch = document.getElementById('archive-search');
  if (archiveSearch) {
    const editions = [...document.querySelectorAll('.archive-entry')].map((entry) => ({ entry, text: normalize(entry.textContent) }));
    const filterArchive = () => {
      editions.forEach(({ entry, text }) => { entry.hidden = !matches(text, archiveSearch.value.replaceAll('-', '.')); });
      document.getElementById('archive-empty').hidden = editions.some(({ entry }) => !entry.hidden);
    };
    archiveSearch.addEventListener('input', filterArchive);
    window.addEventListener('pageshow', filterArchive);
    filterArchive();
  }

  const search = document.getElementById('collection-search');
  if (!search) return;
  const difficulty = document.getElementById('difficulty-filter');
  const recommended = document.getElementById('recommended-filter');
  const reset = document.getElementById('reset-filters');
  const feedback = document.querySelector('.filter-feedback');
  const empty = document.getElementById('no-results');
  const reader = document.getElementById('entry-reader');
  const content = document.getElementById('reader-content');
  const readerScroll = document.querySelector('.reader-scroll');
  const previous = document.getElementById('reader-prev');
  const next = document.getElementById('reader-next');
  const close = document.querySelector('.reader-close');
  const supportsReader = typeof reader.showModal === 'function';
  const collections = {};
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    const key = panel.dataset.panel;
    collections[key] = {
      panel, tab: document.querySelector(`[data-collection="${key}"]`),
      entries: [...panel.querySelectorAll('.entry')].map((entry) => ({ entry, text: normalize(entry.textContent) })),
      query: '', difficulty: '', recommended: false, visible: [],
    };
    panel.setAttribute('role', 'tabpanel');
  });
  const keys = Object.keys(collections);
  const tabs = document.querySelector('.collection-tabs');
  tabs.setAttribute('role', 'tablist');
  Object.values(collections).forEach(({ tab, panel }) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
  });
  let activeKey = 'ideas';
  let currentEntry;
  let opener;
  let restoreFocus = true;
  if (supportsReader) document.documentElement.classList.add('enhanced');

  function filterCollection() {
    const state = collections[activeKey];
    const filtering = Boolean(normalize(state.query) || state.difficulty || state.recommended);
    state.visible = state.entries.filter(({ entry, text }) => matches(text, state.query)
      && (!state.difficulty || entry.dataset.difficulty === state.difficulty)
      && (!state.recommended || entry.dataset.recommended === 'true')).map(({ entry }) => entry);
    state.entries.forEach(({ entry }) => { entry.hidden = !state.visible.includes(entry); });
    state.panel.querySelectorAll('.entry-group').forEach((group) => {
      group.hidden = ![...group.querySelectorAll('.entry')].some((entry) => !entry.hidden);
      const count = group.querySelector('.group-count');
      if (count) count.textContent = [...group.querySelectorAll('.entry')].filter((entry) => !entry.hidden).length;
    });
    feedback.hidden = !filtering;
    reset.hidden = !filtering;
    document.getElementById('result-status').textContent = `找到 ${state.visible.length} / ${state.entries.length} ${activeKey === 'ideas' ? '个选题' : '条 Meme'}`;
    empty.hidden = state.visible.length > 0 || !filtering;
  }

  function activateCollection(key, updateHistory = false) {
    if (!collections[key]) key = 'ideas';
    activeKey = key;
    Object.entries(collections).forEach(([collectionKey, state]) => {
      const active = collectionKey === key;
      state.panel.hidden = !active;
      state.tab.setAttribute('aria-selected', String(active));
      state.tab.tabIndex = active ? 0 : -1;
    });
    const state = collections[key];
    search.value = state.query;
    difficulty.value = state.difficulty;
    recommended.checked = state.recommended;
    document.querySelector('.game-filters').hidden = key !== 'ideas';
    search.placeholder = key === 'ideas' ? '搜索选题、玩法…' : '搜索 Meme、关键词…';
    document.querySelector('label[for="collection-search"]').textContent = key === 'ideas' ? '搜索本期游戏选题' : '搜索本期 Meme';
    filterCollection();
    if (updateHistory) setHash(`#${key}`);
  }

  function clearFilters() {
    Object.assign(collections[activeKey], { query: '', difficulty: '', recommended: false });
    activateCollection(activeKey);
  }

  function closeReader(keepHash = false, focus = true) {
    restoreFocus = focus;
    if (reader.open) reader.close();
    if (!keepHash && hashTarget()?.matches('.entry')) setHash(`#${activeKey}`, true);
  }

  function openEntry(entry, trigger, updateHistory = false, replaceHistory = false) {
    const collectionKey = entry.dataset.entry === 'idea' ? 'ideas' : 'memes';
    activateCollection(collectionKey);
    if (entry.hidden) clearFilters();
    currentEntry = entry;
    if (trigger || !reader.open) opener = trigger || entry.querySelector('summary');
    restoreFocus = true;
    if (updateHistory) setHash(`#${entry.id}`, replaceHistory);
    if (!supportsReader) {
      entry.open = true;
      entry.scrollIntoView({ block: 'start' });
      return;
    }
    content.replaceChildren(...[...entry.querySelector('.entry-body').children].map((child) => child.cloneNode(true)));
    const title = content.querySelector('.full-title');
    title.id = 'reader-title';
    title.tabIndex = -1;
    document.getElementById('reader-category').textContent = collectionKey === 'ideas' ? '游戏选题' : '今日热梗 · Meme';
    const sequence = collections[activeKey].visible;
    const index = sequence.indexOf(entry);
    previous.disabled = index <= 0;
    next.disabled = index >= sequence.length - 1;
    document.getElementById('reader-position').textContent = `${index + 1} / ${sequence.length}`;
    document.body.classList.add('reader-open');
    if (!reader.open) reader.showModal();
    readerScroll.scrollTop = 0;
    title.focus({ preventScroll: true });
  }

  function routeHash() {
    const target = hashTarget();
    if (target?.matches('.entry')) {
      openEntry(target);
    } else {
      closeReader(true, false);
      if (target?.matches('[data-panel]')) activateCollection(target.dataset.panel);
      else if (!location.hash) activateCollection('ideas');
    }
  }

  function updateFilters() {
    Object.assign(collections[activeKey], { query: search.value, difficulty: activeKey === 'ideas' ? difficulty.value : '', recommended: activeKey === 'ideas' && recommended.checked });
    filterCollection();
  }
  search.addEventListener('input', updateFilters);
  difficulty.addEventListener('change', updateFilters);
  recommended.addEventListener('change', updateFilters);
  document.querySelector('.filter-bar').addEventListener('submit', (event) => event.preventDefault());
  reset.addEventListener('click', () => { clearFilters(); search.focus(); });
  document.querySelectorAll('[data-reset]').forEach((button) => button.addEventListener('click', () => { clearFilters(); search.focus(); }));

  Object.entries(collections).forEach(([key, { tab, entries }]) => {
    tab.addEventListener('click', (event) => {
      if (!plainClick(event)) return;
      event.preventDefault();
      closeReader(true, false);
      activateCollection(key, true);
    });
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = keys.indexOf(key);
      const nextKey = event.key === 'Home' ? keys[0] : event.key === 'End' ? keys.at(-1) : keys[(index + (event.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length];
      activateCollection(nextKey, true);
      collections[nextKey].tab.focus();
    });
    entries.forEach(({ entry }) => {
      const summary = entry.querySelector('summary');
      if (supportsReader) {
        summary.setAttribute('role', 'button');
        summary.setAttribute('aria-haspopup', 'dialog');
        summary.setAttribute('aria-controls', reader.id);
      }
      summary.addEventListener('click', (event) => {
        if (!supportsReader || !plainClick(event)) return;
        event.preventDefault();
        openEntry(entry, event.currentTarget, true);
      });
    });
  });

  close.addEventListener('click', () => closeReader());
  reader.addEventListener('cancel', (event) => { event.preventDefault(); closeReader(); });
  reader.addEventListener('close', () => {
    document.body.classList.remove('reader-open');
    if (restoreFocus) {
      const target = opener?.isConnected && !opener.closest('[hidden]') ? opener : collections[activeKey].tab;
      target?.focus({ preventScroll: true });
    }
  });
  let backdropPress = false;
  reader.addEventListener('pointerdown', (event) => { backdropPress = event.target === reader && event.clientX < reader.getBoundingClientRect().left; });
  reader.addEventListener('click', (event) => {
    if (backdropPress && event.target === reader && event.clientX < reader.getBoundingClientRect().left) closeReader();
    backdropPress = false;
  });
  reader.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = [...reader.querySelectorAll('a[href],button:not(:disabled),[tabindex="0"]')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement.id === 'reader-title')) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  const stepReader = (offset) => {
    const sequence = collections[activeKey].visible;
    const entry = sequence[sequence.indexOf(currentEntry) + offset];
    if (entry) openEntry(entry, null, true, true);
  };
  previous.addEventListener('click', () => stepReader(-1));
  next.addEventListener('click', () => stepReader(1));
  document.getElementById('edition-select').addEventListener('change', (event) => { location.href = `${event.target.value}#${activeKey}`; });
  window.addEventListener('hashchange', routeHash);
  window.addEventListener('pageshow', () => {
    // Browsers may restore form values after loading or returning from an edition.
    updateFilters();
    routeHash();
  });
  activateCollection('ideas');
  routeHash();
})();
