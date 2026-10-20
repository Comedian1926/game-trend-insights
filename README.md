# Meme & Game Repo

每天收集游戏选题与热门 Meme，为 Playable 买量素材寻找灵感。以日期组织内容，游戏选题和 Meme 分开浏览。

**在线访问**: https://comedian1926.github.io/game-trend-insights/

## 阅读与检索

- 现代报纸式首页：衬线标题、细分隔线、灰白纸色与少量焦橙色，配色参考 [Comedian.dev / Lab Notes](https://www.comedian.dev/lab-notes)。
- 首页默认游戏选题，三条优先推荐与紧凑选题列表；独立 Meme 标签展示「今日热梗」。首页展示摘要，完整分析通过侧边阅读面板展开。
- 日期、推荐、摘要和数量全部读取当期 JSON；不依赖每日封面或 X 预览图。日期选择器来自实际收录期刊，切换日期保留当前分类。
- 阅读面板支持当前筛选结果内前后切换、Esc 关闭、键盘焦点管理；`#idea-ID` 与 `#meme-N` 永久锚点直接打开条目。
- 可选 `memes` 保留完整说明、原帖、互动数据与 Playable 借用方向；空方向不展示，旧期刊没有该字段或为空数组时不显示 Meme 标签。
- 两类内容分别保留搜索状态，关键词匹配完整正文。游戏支持制作难度与「只看推荐」组合筛选；原帖链接保留在各条目的阅读详情中。
- 历史归档显示每期推荐选题，可按日期或推荐名称搜索。
- 支持浅色 / 深色主题、手机阅读和键盘导航；关闭 JavaScript 后仍可阅读全部内容。

字体使用本地托管的 Noto Serif SC 常用汉字子集，保留可变字重；版权与许可证见 `public/FONT-NOTICE.txt` 和 `public/OFL.txt`，冷僻字回退到系统宋体。

上述功能直接使用现有 JSON 字段，不需要修改 `issues/` 的数据格式。

## 项目结构

```
├── issues/              # 每日内容（JSON 格式）
│   └── YYYY-MM-DD.json
├── scripts/
│   └── build.js         # 静态站点构建脚本
├── templates/           # HTML 模板
├── public/              # 静态资源（CSS 等）
├── dist/                # 构建输出（自动生成）
└── .github/workflows/   # GitHub Actions 部署配置
```

## 添加新一期内容

1. 在 `issues/` 目录下创建新的 JSON 文件，命名格式为 `YYYY-MM-DD.json`
2. 提交并推送到 `main` 分支
3. GitHub Actions 会自动构建并部署

### JSON 文件格式

```json
{
  "date": "2026-10-21",
  "dataWindow": "数据采集时间窗口描述",
  "source": "数据来源说明",

  "memes": [
    {
      "title": "梗名",
      "description": "是什么、为什么火",
      "links": [
        {
          "label": "原帖",
          "url": "https://x.com/...",
          "stats": "4.9 万赞 / 3,589 转 / 99.4 万曝光"
        }
      ],
      "playableAngle": "可借用到 Playable 素材的方向，也可以为空字符串"
    }
  ],
  
  "recommendations": [
    {
      "id": "1",
      "name": "推荐选题名称",
      "reason": "推荐理由"
    }
  ],
  
  "hotTopics": [
    {
      "title": "热点标题",
      "description": "热点描述",
      "links": [
        {
          "label": "链接标签",
          "url": "https://x.com/...",
          "stats": "互动数据（赞/转/回复/曝光）"
        }
      ]
    }
  ],
  
  "ideas": [
    {
      "id": "1",
      "name": "选题名称",
      "inspiration": {
        "text": "灵感来源描述",
        "url": "https://x.com/..."
      },
      "coreGameplay": "核心玩法描述",
      "adHook": "广告钩子（前3秒）",
      "failSuccessPoint": "失败/爽点描述",
      "difficulty": "低/中/高",
      "whyFitUA": "为什么适合买量"
    }
  ],
  
  "notes": [
    "数据说明1",
    "数据说明2"
  ]
}
```

### 字段说明

| 字段 | 说明 | 必填 |
|------|------|------|
| `date` | 日期，格式 YYYY-MM-DD | ✓ |
| `dataWindow` | 数据采集时间窗口 | ✓ |
| `source` | 数据来源 | |
| `memes` | 今日热梗，可省略或为空数组 | |
| `memes[].title` | 梗名 | 提供热梗时 |
| `memes[].description` | 是什么、为什么火 | 提供热梗时 |
| `memes[].links` | 原帖链接，结构与热点的 `links` 相同 | 提供热梗时 |
| `memes[].playableAngle` | Playable 借用方向，可为空字符串 | |
| `recommendations` | 优先推荐列表（2-3个） | ✓ |
| `recommendations[].id` | 关联的选题 ID | ✓ |
| `recommendations[].name` | 选题名称 | ✓ |
| `recommendations[].reason` | 推荐理由 | ✓ |
| `hotTopics` | 今日热点列表 | ✓ |
| `hotTopics[].title` | 热点标题 | ✓ |
| `hotTopics[].description` | 热点描述 | |
| `hotTopics[].links` | 相关链接列表 | ✓ |
| `ideas` | 选题清单（6-10个） | ✓ |
| `ideas[].id` | 选题 ID（用于推荐关联） | ✓ |
| `ideas[].name` | 选题名称 | ✓ |
| `ideas[].inspiration` | 灵感来源 | ✓ |
| `ideas[].coreGameplay` | 核心玩法 | ✓ |
| `ideas[].adHook` | 广告钩子（前3秒） | ✓ |
| `ideas[].failSuccessPoint` | 失败/爽点 | ✓ |
| `ideas[].difficulty` | 制作难度：低/中/高 | ✓ |
| `ideas[].whyFitUA` | 为什么适合买量 | ✓ |
| `notes` | 数据说明 | |

## 本地开发

```bash
# 构建站点
npm run build

# 检查每日换稿、原文保留及静态链接
npm test

# 本地预览
npm run serve
```

## 部署

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

**首次部署前需要手动启用 GitHub Pages**：
1. 进入仓库 Settings → Pages
2. Source 选择 "GitHub Actions"
3. 保存后，下次推送会自动触发部署

## 自动化生成

可以通过脚本或 AI 工具自动生成每日 JSON 文件，只需要：
1. 抓取 X/Twitter 游戏相关热点
2. 按照上述 JSON 格式生成文件
3. 提交到 `issues/` 目录

## License

MIT
