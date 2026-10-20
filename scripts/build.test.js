const test = require('node:test');
const assert = require('node:assert/strict');
const { renderIssuePage, renderArchivePage, renderTemplate } = require('./build');
const sample = require('../issues/2026-10-20.json');

test('a different daily issue renders its own content without a daily cover dependency', () => {
  const issue = structuredClone(sample);
  issue.date = '2026-10-21';
  issue.ideas = [{
    ...issue.ideas[0], id: 'next-day', name: '完全不同的新选题（New idea）',
    coreGameplay: '下一期的核心玩法', adHook: '下一期的开场', difficulty: '高',
  }];
  issue.recommendations = [{ id: 'next-day', name: '完全不同的新选题', reason: '下一期推荐理由' }];
  issue.hotTopics = [{ title: '下一期热点', description: '', links: [] }];
  const html = renderIssuePage(issue, true);
  assert.match(html, /10 月 21 日/);
  assert.match(html, /2026 · 星期三/);
  assert.match(html, /游戏选题 <span>1<\/span>/);
  assert.match(html, /下一期的核心玩法/);
  assert.match(html, /下一期推荐理由/);
  assert.doesNotMatch(html, /<img|game-editorial\.png/);
  assert.doesNotMatch(html, /倍增门打砖块|brick-breaker-engraving|2026-10-20/);
  assert.equal((html.match(/data-entry="idea"/g) || []).length, 1);
});

test('game details remain available without the removed topics section', () => {
  const html = renderIssuePage(sample, true);
  for (const idea of sample.ideas) {
    for (const key of ['name', 'coreGameplay', 'adHook', 'failSuccessPoint', 'whyFitUA']) {
      const escaped = idea[key].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      assert.ok(html.includes(escaped), `${idea.id}: ${key} missing`);
    }
  }
  assert.equal((html.match(/data-entry="idea"/g) || []).length, sample.ideas.length);
  assert.doesNotMatch(html, /热点与来源|id="topics"|href="#topics"|class="topic-item"/);
  assert.doesNotMatch(html, /{{[A-Z_]+}}/);
});

test('empty sections and unmatched recommendation IDs render without broken links', () => {
  const empty = { ...sample, ideas: [], recommendations: [], hotTopics: [], notes: [] };
  const html = renderIssuePage(empty);
  assert.match(html, /本期暂无游戏选题/);
  assert.match(html, /游戏选题 <span>0<\/span>/);
  const unmatched = renderIssuePage({ ...empty, recommendations: [{ id: 'gone', name: '编辑观察', reason: '独立的一条观察' }] });
  assert.doesNotMatch(unmatched, /href="#idea-gone"/);
});

test('input remains literal text, unsupported URL protocols never become links', () => {
  const issue = structuredClone(sample);
  issue.ideas[0].name = '<script>alert("x")</script> $&';
  issue.ideas[0].inspiration.url = 'javascript:alert(1)';
  issue.memes[0].links[0].url = 'data:text/html,unsafe';
  const html = renderIssuePage(issue);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; \$&amp;/);
  assert.doesNotMatch(html, /href="(?:javascript|data):/);
  const literal = "$& $` $' \\n";
  assert.equal(renderTemplate('{{COPY}}', { COPY: literal }), literal);
});

test('archive and nested issue URLs remain relative for GitHub Pages', () => {
  const html = renderIssuePage(sample);
  assert.match(html, /src="\.\.\/site\.js"/);
  assert.match(html, /href="\.\.\/newspaper-serif\.woff2"/);
  assert.match(renderArchivePage([sample]), /href="\.\/issues\/2026-10-20\.html"/);
  const noRecommendations = renderArchivePage([{ ...sample, recommendations: [] }]);
  assert.match(noRecommendations, /倍增门打砖块/);
});

test('legacy issues and empty meme arrays have no empty column or navigation entry', () => {
  const legacy = structuredClone(sample);
  delete legacy.memes;
  for (const issue of [legacy, { ...legacy, memes: [] }]) {
    const html = renderIssuePage(issue);
    assert.doesNotMatch(html, /id="memes"|href="#memes"|今日热梗/);
    assert.doesNotMatch(html, /{{[A-Z_]+}}/);
  }
});

test('memes render full copy, source stats and only nonempty playable angles', () => {
  const memes = [
    { title: '测试梗 <一>', description: '是什么、为什么火 & 原因', links: [
      { label: '原帖', url: 'https://x.com/example/status/123', stats: '4.9 万赞 / 3,589 转 / 99.4 万曝光' },
    ], playableAngle: '用反转做素材开场。' },
    { title: '没有借用方向的梗', description: '第二条说明', links: [], playableAngle: '' },
    { title: '仅有空白方向', description: '', links: [
      { label: '不能执行的链接', url: 'javascript:alert(1)', stats: '' },
    ], playableAngle: '  ' },
  ];
  const html = renderIssuePage({ ...sample, memes }, true);
  assert.match(html, /data-collection="memes">Meme <span>3<\/span>/);
  assert.equal((html.match(/data-entry="meme"/g) || []).length, 3);
  assert.equal((html.match(/Playable 借用方向/g) || []).length, 1);
  assert.match(html, /测试梗 &lt;一&gt;/);
  assert.match(html, /是什么、为什么火 &amp; 原因/);
  assert.match(html, /4.9 万赞 \/ 3,589 转 \/ 99.4 万曝光/);
  assert.match(html, /用反转做素材开场。/);
  assert.doesNotMatch(html, /href="javascript:/);
  assert.ok(html.indexOf('id="ideas"') < html.indexOf('id="memes"'));
  assert.match(renderArchivePage([{ ...sample, memes }]), /3 条热梗/);
});

test('featured recommendations honor editorial order and never duplicate entries', () => {
  const issue = structuredClone(sample);
  issue.recommendations = [
    { ...issue.recommendations[0], id: '3' },
    { ...issue.recommendations[1], id: '1' },
    { ...issue.recommendations[2], id: '3' },
  ];
  const original = JSON.stringify(issue);
  const html = renderIssuePage(issue);
  assert.ok(html.indexOf('id="idea-3"') < html.indexOf('id="idea-1"'));
  assert.equal((html.match(/id="idea-3"/g) || []).length, 1);
  assert.equal((html.match(/data-entry="idea"/g) || []).length, issue.ideas.length);
  assert.equal(JSON.stringify(issue), original);
  assert.match(html, /<details class="entry idea-entry/);
  assert.match(html, /<div class="entry-body">/);
});

test('edition selection is data driven and preserves relative paths on nested pages', () => {
  const earlier = { ...sample, date: '2026-10-19', memes: [] };
  const html = renderIssuePage(sample, false, [sample, earlier]);
  assert.match(html, /value="\.\.\/issues\/2026-10-20\.html" selected/);
  assert.match(html, /value="\.\.\/issues\/2026-10-19\.html"/);
  assert.doesNotMatch(html, / disabled/);
  assert.match(renderIssuePage(sample, true), /disabled title="目前仅收录本期"/);
});
