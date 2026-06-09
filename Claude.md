```markdown
# CLAUDE.md

## 项目概述

电气知识图谱可视化学习平台（Electrical Knowledge Graph Visualization Learning Platform）——一个轻量化、交互式的电气工程知识学习网站。核心是**网状知识图谱**（非简单金字塔），采用“金线深潜”策略，围绕高阶工程应用主线构建高质量知识内容。当前已建成**四条金线主干**：电机控制（永磁同步电机矢量控制）、储能 BMS、无线充电、光伏并网，四线共享电力电子、电磁学与数学底座并在图谱中自然交汇。平台以 2D 图谱为主要交互界面，强调知识关联的叙事性可视化，并提供多策略学习路径生成与 3D 路径复盘。

## 技术栈

- **前端框架**：Vue 3 (Composition API / `<script setup>`) + Vite 6
- **2D 图谱**：ECharts 5.x (Graph 图表，力导向/有向图)
- **3D 复盘视图**：Three.js 0.172 + OrbitControls（独立场景，用于学习路径依赖塔可视化）
- **公式渲染**：KaTeX 0.17（构建时渲染，仅在详情浮层内使用）
- **原理动图**：lottie-web 5.x（自制 SVG 矢量动画原型，按需懒加载、独立 chunk）
- **路由与状态**：Vue Router 4（Hash 模式）+ Pinia 2
- **UI 组件**：Element Plus（`unplugin-vue-components` 按需引入，仅用于浮层、搜索框、路径卡片等辅助元素）
- **离线 PWA**：vite-plugin-pwa（Workbox `generateSW`，全量预缓存 + 自动更新）
- **部署**：纯静态站点（GitHub Pages 或 Vercel）

## 核心设计原则

- **图谱即舞台**：所有交互以 2D 图谱为中心，节点聚焦、路径高亮、知识流动效为叙事核心
- **内容成熟度透明**：所有知识点标记 L1（骨架）、L2（核心）、L3（完备）。金线节点达到 L3，骨架节点均已补充独立详情达 L2
- **金线主干切换**：顶栏在「全部」与四条主干间切换；选中某条金线时，沿 `depends_on` 有向闭包仅聚焦该主干及共享基础节点
- **按需加载**：首页仅加载节点关系 JSON；详情（文字/公式/图片/动图）在用户交互时异步拉取
- **多路径学习**：针对一个目标生成理论驱动、应用驱动、控制优先三条不同路径，支持对比选择
- **移动端友好**：图谱支持手势缩放平移，详情浮层适配小屏；离线 PWA 可安装到主屏

## 项目目录结构（实际）

```
src/
  components/
    GraphCanvas.vue          // 2D 图谱主组件（ECharts）+ 视角持久化 + 触控手势
    TopbarControls.vue       // 顶栏控件（桌面横排 / 移动汉堡抽屉复用）
    ContextPanel.vue         // 右侧节点详情面板 + 探索历史时间轴
    DetailOverlay.vue        // 全屏详情浮层（KaTeX + 工程场景卡片 + 原理动图 + 推导步骤）
    AnimPlayer.vue           // Lottie 原理动图播放器（懒加载 lottie-web + 降级兜底）
    PathPlanner.vue          // 多策略路径生成 UI
    SavedPaths.vue           // 我的学习路径管理（加载高亮 / 3D 复盘 / 分享 / 重命名 / 删除）
    PathReview3D.vue         // Three.js 3D 复盘组件
    SearchBar.vue            // 全站搜索框（Ctrl+K 唤起）
    TourGuide.vue            // 新手分步引导浮层
  views/
    GraphView.vue            // 图谱主页面（顶栏：主线切换 / 过滤 / 主题 / 引导 + 移动汉堡抽屉）
  composables/
    useTheme.js              // 明暗主题切换（localStorage 持久化）
    useMediaQuery.js         // 响应式断点（useIsMobile，768px 移动适配）
  stores/
    graphStore.js            // 图谱状态（焦点节点、高亮路径、溯源模式、当前主线）
    contentStore.js          // 知识点详情缓存
    historyStore.js          // 探索历史与视角快照（localStorage 持久化）
    pathStore.js             // 已保存学习路径（localStorage 持久化）
  utils/
    graphBuilder.js          // ECharts option 构建器（含脚印标记）
    pathAlgorithm.js         // 三策略路径生成（Dijkstra + 偏置权重）
    pathLayout3D.js          // 3D 复盘布局算法（依赖深度作 Y / 学科方位作 XZ + 邻居语境）
    pathShare.js             // 学习路径编解码与分享 URL 构建
    maturityTags.js          // L1/L2/L3 颜色与语义配置
  data/
    goldThread.json          // 60 个 L3 金线节点（含公式、逐步推导、工程场景、原理动图）
    skeletonGraph.json       // 45 个 L2 骨架节点（id/name/category/level/summary/relations）
    details/                 // 45 个骨架节点详情文件（L2 半完备：概述 + 公式 + 场景，按需加载）
    threads.js               // 四金线主线配置与 depends_on 闭包计算
    lottie/                  // 29 个自制原理动图 Lottie 素材（由 scripts/gen_lottie.py 生成）
  styles/
    dark.css                 // 深色星空主题样式
  router/
    index.js                 // 仅两个路由：/ 图谱主页，/review 3D 复盘（Hash 模式）
  App.vue
  main.js

public/
  pwa-icon.svg               // PWA 安装图标（⚡ 渐变，any + maskable）
scripts/
  gen_lottie.py              // 原理动图生成器（生成 Lottie 原型 + 注入 anim 字段）
  check_latex.py             // KaTeX 公式合法性校验工具
vite.config.js               // 含 vite-plugin-pwa（manifest + Workbox 预缓存）
```

## 开发指南

- 使用 Composition API 和 `<script setup>` 语法。
- 图谱交互状态（当前焦点节点、高亮路径、溯源模式、当前主线）统一管理在 `graphStore` 中。
- 详情内容获取使用异步 `import()` 函数，结合 Vite 的代码分割。
- ECharts 图表选项通过 `graphBuilder.js` 生成，不要直接在组件内写大段 option。
- 公式用 KaTeX 在构建时渲染（非运行时常驻）；详情浮层内的 `DetailOverlay` 负责呈现。
- 原理动图统一经 `AnimPlayer.vue` 渲染：lottie-web 按需懒加载、独立 chunk，离开浮层即销毁实例，加载失败有降级兜底。
- 路径生成算法（`pathAlgorithm.js`）基于图谱边权重与语义关系（Dijkstra + 偏置权重），返回三条差异化的节点序列。
- 3D 复盘视图仅使用 BoxGeometry 和线条，不追求高精度模型；布局由 `pathLayout3D.js` 计算（依赖深度作 Y、学科方位作 XZ），场景提供旋转、缩放、沿路径漫游、节点点击高亮。
- Lottie 素材与节点 `anim` 字段的注入由 `scripts/gen_lottie.py` 程序化生成，不手写 Lottie JSON。

## 内容约定

- 金线节点数据格式（goldThread.json 示例）：
  ```json
  {
    "id": "svpwm",
    "name": "SVPWM调制",
    "level": "L3",
    "summary": "空间矢量脉宽调制...",
    "detail": {
      "formulas": ["..."],
      "description": "...",
      "scene": { "icon": "⚙️", "text": "工程场景描述..." },
      "anim": { "type": "lottie", "src": "原型名", "caption": "动图解说..." }
    },
    "relations": [
      { "target": "inverter", "type": "depends_on", "weight": 1.0 },
      { "target": "dq_transform", "type": "strong_related", "weight": 0.8 }
    ]
  }
  ```
- 骨架节点（skeletonGraph.json）含 `id`、`name`、`category`、`level`、`summary`、`relations`，本体无 detail；其详情独立存放于 `src/data/details/{id}.json`（整文件即 detail 对象，含 `description`/`formulas`/`scene`，部分含 `anim`），按需异步加载。
- 语义关系类型：`depends_on`、`strong_related`、`maps_to`、`suggest_sync`。

## 关键交互流程（实现时注意）

1. **图谱加载**：挂载时从 `skeletonGraph.json` 和 `goldThread.json` 合并构建 ECharts graph 数据。
2. **主线切换**：选中某条金线 → 按 `threads.js` 的 `depends_on` 闭包剪除他线专属节点，仅聚焦该主干及共享基础。
3. **节点点击**：设置该节点为焦点 → 重新计算并高亮上下游路径 → 右侧 `ContextPanel` 显示摘要。
4. **展开详情**：点击“展开详情”按钮 → `DetailOverlay` 弹出 → 异步加载对应节点 detail（金线取自 `goldThread`，骨架取自 `details/{id}.json`）→ KaTeX 渲染公式、`AnimPlayer` 播放动图。
5. **路径生成**：用户选择目标 → `pathAlgorithm` 生成三条路径 → 展示在 `PathPlanner`，可保存、对比、分享 → 可跳转到 3D 复盘。
6. **3D 复盘**：根据选中的路径节点序列，按依赖深度在 Three.js 中分层排列，发光螺旋脊柱连接，支持沿路径漫游。

## 性能目标

- 首屏 JS 包 < 200 KB（gzip），ECharts 和 Three.js 按需分割。
- 图谱渲染节点总数（含骨架）≤ 500，保证 ECharts 力导向布局流畅。
- 详情浮层打开延迟 < 300ms（含内容加载）。
- 移动端图谱交互帧率 ≥ 30fps。

## 测试与验收

- 确保金线 60 个节点均可在图谱中正确展示、点击并打开 L3 详情。
- 四条主线切换均能正确按 `depends_on` 闭包剪枝，聚焦对应主干。
- 路径生成功能对“电力电子”“电机控制”等目标能产出 3 条差异化路径。
- 溯源模式：点击顶层节点，高亮路径能准确追溯到数学/电磁学基础。
- 3D 复盘：路径节点按依赖深度分层排列，连线不重叠。
- 离线 PWA：断网后图谱、L3 详情、3D 复盘完整可用。
```

这份 `Claude.md` 可作为该项目的 AI 辅助开发指南，帮助 Claude（或其他遵循同样指令的 AI）理解项目架构、约定和目标。