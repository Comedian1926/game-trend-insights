(() => {
  const html = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') preference = saved;
  } catch {
    // The theme still works when browser storage is unavailable.
  }

  function applyTheme(theme) {
    html.dataset.theme = theme;
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      const label = theme === 'dark' ? '切换到浅色主题' : '切换到深色主题';
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', String(theme === 'dark'));
      toggle.title = label;
      toggle.textContent = theme === 'dark' ? '日间阅读' : '夜间阅读';
    }
  }

  applyTheme(preference || (systemTheme.matches ? 'dark' : 'light'));
  systemTheme.addEventListener('change', (event) => {
    if (!preference) applyTheme(event.matches ? 'dark' : 'light');
  });

  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.theme-toggle');
    if (!toggle) return;
    applyTheme(html.dataset.theme);
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      preference = html.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(preference);
      try {
        localStorage.setItem('theme', preference);
      } catch {
        // Keep the selected theme for this page even without persistence.
      }
    });
  });
})();
