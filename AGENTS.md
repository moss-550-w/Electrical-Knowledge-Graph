```markdown
# AGENTS.md

## 项目概述

电气知识图谱可视化学习平台（Electrical Knowledge Graph Visualization Learning Platform）——一个轻量化、交互式的电气工程知识学习网站。核心是**网状知识图谱**（非简单金字塔），采用“金线深潜”策略，围绕高阶工程应用主线（首期：永磁同步电机矢量控制）构建高质量知识内容。平台以2D图谱为主要交互界面，强调知识关联的叙事性可视化，并提供多策略学习路径生成与3D路径复盘。

## 技术栈

- **前端框架**：Vue 3 (Composition API) + Vite
- **2D 图谱**：ECharts 5.x (Graph 图表，力导向/有向图)
- **3D 复盘视图**：Three.js（独立场景，用于学习路径阶梯展示）
- **公式渲染**：MathJax 3（按需加载，仅在详情浮层内使用）
- **路由与状态**：Vue Router 4 + Pinia
- **UI 组件**：Element Plus（按需引入，仅用于浮层、搜索框、路径卡片等辅助元素）
- **部署**：纯静态站点（GitHub Pages 或 Vercel）

## 核心设计原则

- **图谱即舞台**：所有交互以 2D 图谱为中心，节点聚焦、路径高亮、知识流动效为叙事核心
- **内容成熟度透明**：所有知识点标记 L1（骨架）、L2（核心）、L3（完备）。首期仅“金线”节点达到 L3
- **按需加载**：首页仅加载节点关系 JSON；详情（文字/公式/图片/动图）在用户交互时异步拉取
- **多路径学习**：针对一个目标生成理论驱动、应用驱动、控制优先三条不同路径，支持对比选择
- **移动端友好**：图谱支持手势缩放平移，详情浮层适配小屏

## 项目目录结构（约定）

```
src/
  components/
    GraphCanvas.vue          // 2D 图谱主组件
    ContextPanel.vue         // 右侧上下文面板
    DetailOverlay.vue        // 全屏详情浮层（集成 MathJax）
    PathPlanner.vue          // 多策略路径生成 UI
    PathReview3D.vue         // Three.js 3D 复盘组件
    SearchBar.vue
  stores/
    graphStore.js            // 图谱数据、当前焦点节点、路径状态
    contentStore.js          // 知识点详情缓存、成熟度
  utils/
    graphBuilder.js          // 从 JSON 构建 ECharts 配置
    pathAlgorithm.js         // 多策略路径生成逻辑
    maturityTags.js          // L1/L2/L3 标签处理
  data/
    goldThread.json          // 金线节点完整数据（L3）
    skeletonGraph.json       // 全学科骨架数据（L1/L2）
  router/
    index.js                 // 仅两个路由：/ 图谱主页，/review 3D复盘
  App.vue
  main.js
```

## 开发指南

- 使用 Composition API 和 `<script setup>` 语法。
- 图谱交互状态（当前焦点节点、高亮路径、溯源模式）统一管理在 `graphStore` 中。
- 详情内容获取使用异步 `import()` 函数，结合 Vite 的代码分割。
- ECharts 图表选项通过 `graphBuilder.js` 生成，不要直接在组件内写大段 option。
- MathJax 只在 `DetailOverlay` 组件挂载时初始化，离开销毁，避免常驻内存。
- 路径生成算法需基于知识图谱的边权重和语义关系，返回三条差异化的节点序列。
- 3D 复盘视图仅使用 BoxGeometry 和线条，不追求高精度模型；场景提供旋转、缩放、节点点击高亮。

## 内容约定

- 金线节点数据格式（goldThread.json 示例）：
  ```json
  {
    "id": "svpwm",
    "name": "SVPWM调制",
    "level": "L3",
    "summary": "空间矢量脉宽调制...",
    "detail": { "formulas": [...], "description": "...", "image": "url", "anim": "url" },
    "relations": [
      { "target": "inverter", "type": "depends_on", "weight": 1.0 },
      { "target": "dq_transform", "type": "related", "weight": 0.8 }
    ]
  }
  ```
- 骨架节点仅包含 `id`、`name`、`level`、`relations`，无 detail。
- 语义关系类型：`depends_on`、`strong_related`、`maps_to`、`suggest_sync`。

## 关键交互流程（实现时注意）

1. **图谱加载**：挂载时从 `skeletonGraph.json` 和 `goldThread.json` 合并构建 ECharts graph 数据。
2. **节点点击**：设置该节点为焦点 → 重新计算并高亮上下游路径（ECharts 的 `focusNodeAdjacency` 或自定义 action）→ 右侧面板显示摘要。
3. **展开详情**：点击“展开详情”按钮 → `DetailOverlay` 弹出 → 异步加载对应节点的 detail 资源 → 初始化 MathJax。
4. **路径生成**：用户选择目标学科 → `pathAlgorithm` 生成三条路径 → 展示在 `PathPlanner` 中，可保存、对比 → 可跳转到 3D 复盘。
5. **3D 复盘**：根据选中的路径节点序列，在 Three.js 中按依赖深度排列立方体，连线表示关系。

## 性能目标

- 首屏 JS 包 < 200 KB（gzip），ECharts 和 Three.js 按需分割。
- 图谱渲染节点总数（含骨架）≤ 500，保证 ECharts 力导向布局流畅。
- 详情浮层打开延迟 < 300ms（含内容加载）。
- 移动端图谱交互帧率 ≥ 30fps。

## 测试与验收

- 确保金线 30 个节点均可在图谱中正确展示、点击并打开 L3 详情。
- 路径生成功能对“电力电子”“电机控制”能产出 3 条差异化路径。
- 溯源模式：点击顶层节点，高亮路径能准确追溯到数学/电磁学基础。
- 3D 复盘：路径节点按阶梯排列，连线不重叠。
```



这份 `AGENTS.md` 可作为该项目的 AI 辅助开发指南，帮助 Codex（或其他遵循同样指令的 AI）理解项目架构、约定和目标。