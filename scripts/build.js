const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const array = (value) => Array.isArray(value) ? value : [];
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const arrow = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function renderTemplate(template, values) {
  return template.replace(/{{([A-Z_]+)}}/g, (_, key) => values[key] ?? '');
}

function dateParts(date) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return { heading: date, meta: '', dotted: date };
  return {
    heading: `${parsed.getUTCMonth() + 1} 月 ${parsed.getUTCDate()} 日`,
    meta: `${parsed.getUTCFullYear()} · 星期${'日一二三四五六'[parsed.getUTCDay()]}`,
    dotted: date.replaceAll('-', '.'),
  };
}

function link(label, url, className = '') {
  const safe = safeUrl(url);
  return safe
    ? `<a class="${className}" href="${escapeHTML(safe)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)} <span aria-hidden="true">↗</span></a>`
    : `<span>${escapeHTML(label)}</span>`;
}

function sourceLinks(links) {
  return array(links).length ? `<ul class="source-links">${links.map((source) => `<li>${link(source.label || '查看原帖', source.url)}${source.stats ? `<span class="source-stats">${escapeHTML(source.stats)}</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted">本条未提供原帖链接。</p>';
}

function field(label, value) {
  return String(value ?? '').trim() ? `<div><dt>${label}</dt><dd>${escapeHTML(value)}</dd></div>` : '';
}

function shortName(value) {
  return String(value ?? '').replace(/\s*[（(][^（）()]*[）)]\s*$/, '');
}

function renderIdea(idea, index, recommendation, featured) {
  const anchor = `idea-${encodeURIComponent(idea.id)}`;
  return `<details class="entry idea-entry${featured ? ' featured-entry' : ''}" id="${escapeHTML(anchor)}" data-entry="idea" data-difficulty="${escapeHTML(idea.difficulty)}" data-recommended="${Boolean(recommendation)}">
    <summary aria-label="阅读选题：${escapeHTML(idea.name)}">
      <span class="entry-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="entry-heading"><span class="entry-title">${escapeHTML(shortName(idea.name))}</span>${featured ? '<span class="recommendation-mark">今日推荐</span>' : ''}</span>
      <span class="entry-excerpt">${escapeHTML(idea.coreGameplay)}</span>
      <span class="entry-meta">难度 <strong>${escapeHTML(idea.difficulty || '未标注')}</strong></span>
      <span class="entry-arrow">${arrow}</span>
    </summary>
    <div class="entry-body">
      <h3 class="full-title">${escapeHTML(idea.name)}</h3>
      <p class="reader-meta">游戏选题 <span>·</span> 制作难度：${escapeHTML(idea.difficulty || '未标注')}</p>
      <dl class="entry-fields">
        ${recommendation ? field('推荐理由', recommendation.reason) : ''}
        ${field('核心玩法', idea.coreGameplay)}
        ${field('广告钩子 · 前 3 秒', idea.adHook)}
        ${field('失败 / 爽点', idea.failSuccessPoint)}
        ${field('为什么适合买量', idea.whyFitUA)}
        ${idea.inspiration ? `<div><dt>灵感来源</dt><dd>${escapeHTML(idea.inspiration.text)}${idea.inspiration.url ? `<p>${link('查看原帖', idea.inspiration.url)}</p>` : ''}</dd></div>` : ''}
      </dl>
    </div>
  </details>`;
}

function renderMeme(meme, index) {
  return `<details class="entry meme-entry" id="meme-${index + 1}" data-entry="meme">
    <summary aria-label="阅读热梗：${escapeHTML(meme.title)}">
      <span class="entry-number">${String(index + 1).padStart(2, '0')}</span>
      <span class="entry-heading"><span class="entry-title">${escapeHTML(meme.title)}</span></span>
      <span class="entry-excerpt">${escapeHTML(meme.description)}</span>
      <span class="entry-meta">${array(meme.links).length} 个来源</span>
      <span class="entry-arrow">${arrow}</span>
    </summary>
    <div class="entry-body">
      <h3 class="full-title">${escapeHTML(meme.title)}</h3>
      <p class="reader-meta">今日热梗 <span>·</span> ${array(meme.links).length} 个来源</p>
      <dl class="entry-fields">
        ${field('这是什么 / 为什么火', meme.description)}
        ${field('Playable 借用方向', meme.playableAngle)}
        <div><dt>原帖与互动</dt><dd>${sourceLinks(meme.links)}</dd></div>
      </dl>
    </div>
  </details>`;
}

function renderIssuePage(issue, isHome = false, allIssues = [issue]) {
  const base = isHome ? '.' : '..';
  const ideas = array(issue.ideas);
  const memes = array(issue.memes);
  const recommendations = array(issue.recommendations);
  const dates = [...new Set([issue.date, ...allIssues.map((item) => item.date)])].sort().reverse();
  const recommendationById = new Map(recommendations.map((item) => [String(item.id), item]));
  const ideaById = new Map(ideas.map((item) => [String(item.id), item]));
  const featuredIds = [...new Set(recommendations.filter((item) => ideaById.has(String(item.id))).map((item) => String(item.id)))].slice(0, 3);
  const featured = featuredIds.map((id) => ideaById.get(id));
  const remaining = ideas.filter((idea) => !featuredIds.includes(String(idea.id)));
  const date = dateParts(issue.date);
  const template = fs.readFileSync(path.join(root, 'templates/issue.html'), 'utf8');
  const render = (idea, featuredEntry = false) => renderIdea(idea, ideas.indexOf(idea), recommendationById.get(String(idea.id)), featuredEntry);
  return renderTemplate(template, {
    BASE: base,
    TITLE: `${escapeHTML(issue.date)} · Meme &amp; Game Repo`,
    DATE: escapeHTML(issue.date),
    DATE_HEADING: escapeHTML(date.heading),
    DATE_META: escapeHTML(date.meta),
    DATE_PICKER: `<select id="edition-select" aria-label="选择期刊日期"${dates.length === 1 ? ' disabled title="目前仅收录本期"' : ''}>${dates.map((value) => `<option value="${base}/issues/${escapeHTML(value)}.html"${value === issue.date ? ' selected' : ''}>${escapeHTML(value.replaceAll('-', '.'))}</option>`).join('')}</select>`,
    IDEA_COUNT: ideas.length,
    MEME_TAB: memes.length ? `<a class="collection-tab" id="memes-tab" href="#memes" data-collection="memes">Meme <span>${memes.length}</span></a>` : '',
    FEATURED: featured.length ? `<section class="entry-group featured-group" aria-labelledby="featured-title"><div class="section-heading"><h2 id="featured-title">优先看看</h2></div><div class="featured-grid">${featured.map((idea) => render(idea, true)).join('')}</div></section>` : '',
    MORE_IDEAS: remaining.length ? `<section class="entry-group list-group" aria-labelledby="more-title"><div class="section-heading"><h2 id="more-title">${featured.length ? '更多选题' : '全部选题'} <span class="group-count">${remaining.length}</span></h2><span class="section-caption">点击阅读详情</span></div><div class="entry-list">${remaining.map((idea) => render(idea)).join('')}</div></section>` : '',
    IDEAS_EMPTY: ideas.length ? '' : '<p class="empty-state">本期暂无游戏选题。</p>',
    MEMES: memes.length ? `<section id="memes" class="collection-panel" aria-labelledby="memes-tab" data-panel="memes"><div class="section-heading"><h2>今日热梗 <span class="group-count">${memes.length}</span></h2><span class="section-caption">捕捉情绪，也寻找素材灵感</span></div><div class="entry-list">${memes.map(renderMeme).join('')}</div></section>` : '',
    PERMALINK: `${base}/issues/${escapeHTML(issue.date)}.html`,
    YEAR: escapeHTML(String(issue.date).slice(0, 4)),
  });
}

function renderArchivePage(issues) {
  const template = fs.readFileSync(path.join(root, 'templates/archive.html'), 'utf8');
  return renderTemplate(template, {
    COUNT: issues.length,
    EDITIONS: issues.map((issue) => {
      const titles = array(issue.recommendations).length ? issue.recommendations.map((item) => item.name) : array(issue.ideas).slice(0, 3).map((item) => item.name);
      return `<a class="archive-entry" href="./issues/${escapeHTML(issue.date)}.html">
        <time datetime="${escapeHTML(issue.date)}">${escapeHTML(issue.date.replaceAll('-', '.'))}</time>
        <span class="archive-copy"><strong>${escapeHTML(titles.map(shortName).join(' / ') || '本期日报')}</strong><span>${array(issue.ideas).length} 个游戏选题${array(issue.memes).length ? ` · ${issue.memes.length} 条热梗` : ''}</span></span>${arrow}
      </a>`;
    }).join('') || '<p class="empty-state">还没有收录期刊。</p>',
  });
}

function build() {
  const issues = fs.readdirSync(path.join(root, 'issues'))
    .filter((name) => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort().reverse()
    .map((name) => JSON.parse(fs.readFileSync(path.join(root, 'issues', name), 'utf8').replace(/^\uFEFF/, '')));
  if (!issues.length) throw new Error('No issue files found.');
  const output = path.join(root, 'dist');
  fs.mkdirSync(path.join(output, 'issues'), { recursive: true });
  fs.cpSync(path.join(root, 'public'), output, { recursive: true });
  for (const issue of issues) fs.writeFileSync(path.join(output, 'issues', `${issue.date}.html`), renderIssuePage(issue, false, issues));
  fs.writeFileSync(path.join(output, 'index.html'), renderIssuePage(issues[0], true, issues));
  fs.writeFileSync(path.join(output, 'archive.html'), renderArchivePage(issues));
  console.log(`Built ${issues.length} issue(s), latest: ${issues[0].date}`);
}

if (require.main === module) build();
module.exports = { renderIssuePage, renderArchivePage, renderTemplate, safeUrl };
