# 游戏热点洞察 (Game Trend Insights)

每个工作日发布的游戏热点洞察，包含 X/Twitter 游戏热点概览、适合 Playable 买量的小游戏选题、以及优先推荐。

**在线访问**: https://comedian1926.github.io/game-trend-insights/

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
