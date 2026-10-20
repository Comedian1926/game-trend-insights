const fs = require('fs');
const path = require('path');

const ISSUES_DIR = path.join(__dirname, '..', 'issues');
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DIST_DIR = path.join(__dirname, '..', 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, `${name}.html`), 'utf-8');
}

function loadIssues() {
  const files = fs.readdirSync(ISSUES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
  
  return files.map(f => {
    const content = fs.readFileSync(path.join(ISSUES_DIR, f), 'utf-8');
    return JSON.parse(content);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${dateStr} ${weekdays[d.getDay()]}`;
}

function getDifficultyClass(difficulty) {
  const map = { '低': 'easy', '中': 'medium', '高': 'hard' };
  return map[difficulty] || 'medium';
}

function renderRecommendations(recs, ideas) {
  return recs.map((rec, i) => {
    const idea = ideas.find(idea => idea.id === rec.id);
    return `
      <div class="recommendation-card">
        <div class="rec-rank">#${i + 1}</div>
        <div class="rec-content">
          <h3>${escapeHtml(rec.name)}</h3>
          <p>${escapeHtml(rec.reason)}</p>
          ${idea ? `<a href="#idea-${idea.id}" class="rec-link">查看详情 →</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderIdeas(ideas) {
  return ideas.map(idea => `
    <article class="idea-card" id="idea-${idea.id}">
      <header class="idea-header">
        <h3 class="idea-title">${escapeHtml(idea.name)}</h3>
        <span class="difficulty-badge ${getDifficultyClass(idea.difficulty)}">${escapeHtml(idea.difficulty)}</span>
      </header>
      
      <div class="idea-body">
        <div class="idea-field">
          <span class="field-label">灵感来源</span>
          <span class="field-value">
            ${idea.inspiration.url 
              ? `<a href="${escapeHtml(idea.inspiration.url)}" target="_blank" rel="noopener">${escapeHtml(idea.inspiration.text)} ↗</a>` 
              : escapeHtml(idea.inspiration.text)}
          </span>
        </div>
        
        <div class="idea-field">
          <span class="field-label">核心玩法</span>
          <span class="field-value">${escapeHtml(idea.coreGameplay)}</span>
        </div>
        
        <div class="idea-field hook">
          <span class="field-label">🎣 广告钩子（前3秒）</span>
          <span class="field-value">${escapeHtml(idea.adHook)}</span>
        </div>
        
        <div class="idea-field">
          <span class="field-label">失败/爽点</span>
          <span class="field-value">${escapeHtml(idea.failSuccessPoint)}</span>
        </div>
        
        <div class="idea-field">
          <span class="field-label">为什么适合买量</span>
          <span class="field-value">${escapeHtml(idea.whyFitUA)}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function renderHotTopics(topics) {
  return topics.map((topic, i) => `
    <div class="topic-item">
      <div class="topic-number">${i + 1}</div>
      <div class="topic-content">
        <h4 class="topic-title">${escapeHtml(topic.title)}</h4>
        ${topic.description ? `<p class="topic-desc">${escapeHtml(topic.description)}</p>` : ''}
        <div class="topic-links">
          ${topic.links.map(link => `
            <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="topic-link">
              <span class="link-label">${escapeHtml(link.label)}</span>
              ${link.stats ? `<span class="link-stats">${escapeHtml(link.stats)}</span>` : ''}
            </a>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function renderNotes(notes) {
  if (!notes || notes.length === 0) return '';
  return `
    <section class="notes-section">
      <h2>数据说明</h2>
      <ul class="notes-list">
        ${notes.map(n => `<li>${escapeHtml(n)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function renderIssuePage(issue, isHome = false) {
  const template = loadTemplate('issue');
  const baseUrl = isHome ? '.' : '..';
  
  return template
    .replace(/{{BASE_URL}}/g, baseUrl)
    .replace(/{{DATE}}/g, formatDate(issue.date))
    .replace('{{DATA_WINDOW}}', escapeHtml(issue.dataWindow))
    .replace('{{RECOMMENDATIONS}}', renderRecommendations(issue.recommendations, issue.ideas))
    .replace('{{IDEAS}}', renderIdeas(issue.ideas))
    .replace('{{HOT_TOPICS}}', renderHotTopics(issue.hotTopics))
    .replace('{{NOTES}}', renderNotes(issue.notes))
    .replace('{{ISSUE_LINK}}', isHome ? `<a href="./issues/${issue.date}.html" class="permalink">永久链接</a>` : '')
    .replace('{{HOME_LINK}}', isHome ? '' : '<a href="../index.html" class="back-link">← 返回首页</a>');
}

function renderArchivePage(issues) {
  const template = loadTemplate('archive');
  
  const issuesList = issues.map(issue => `
    <li class="archive-item">
      <a href="./issues/${issue.date}.html">
        <span class="archive-date">${formatDate(issue.date)}</span>
        <span class="archive-stats">
          ${issue.ideas.length} 个选题 · ${issue.recommendations.length} 个推荐
        </span>
      </a>
    </li>
  `).join('');
  
  return template
    .replace('{{ISSUES_LIST}}', issuesList)
    .replace('{{TOTAL_ISSUES}}', issues.length.toString());
}

function build() {
  console.log('🚀 开始构建...');
  
  ensureDir(DIST_DIR);
  ensureDir(path.join(DIST_DIR, 'issues'));
  
  const publicFiles = fs.readdirSync(PUBLIC_DIR);
  for (const file of publicFiles) {
    fs.copyFileSync(
      path.join(PUBLIC_DIR, file),
      path.join(DIST_DIR, file)
    );
  }
  console.log('✓ 复制静态资源');
  
  const issues = loadIssues();
  console.log(`✓ 加载 ${issues.length} 期内容`);
  
  if (issues.length > 0) {
    const homeHtml = renderIssuePage(issues[0], true);
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homeHtml);
    console.log('✓ 生成首页');
  }
  
  for (const issue of issues) {
    const issueHtml = renderIssuePage(issue, false);
    fs.writeFileSync(
      path.join(DIST_DIR, 'issues', `${issue.date}.html`),
      issueHtml
    );
  }
  console.log('✓ 生成期刊页面');
  
  const archiveHtml = renderArchivePage(issues);
  fs.writeFileSync(path.join(DIST_DIR, 'archive.html'), archiveHtml);
  console.log('✓ 生成归档页');
  
  console.log('\n✨ 构建完成！输出目录: dist/');
}

build();
