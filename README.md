# 电气知识图谱可视化学习平台

**以网状知识图谱深度打通电气工程多学科关联**，围绕「永磁同步电机矢量控制」主线，用可视化脉络取代碎片化学习。

---

## 功能特性

- **2D 网状知识图谱** — ECharts 力导向图，节点按内容成熟度分色（金/蓝/灰），有向边区分依赖关系语义
- **节点聚焦与路径高亮** — 点击节点，自动高亮上下游依赖链，切换「溯源模式」逆向追溯所有前置知识
- **L3 知识点详情浮层** — 全屏弹出，含完整文字说明、LaTeX 公式（MathJax 按需渲染）、关联节点跳转
- **多策略学习路径生成** — 选定目标知识点，自动生成「理论驱动」「应用驱动」「控制优先」三条差异化路径并对比
- **3D 路径复盘视图** — Three.js 场景，路径节点按依赖深度排列为阶梯立体图，支持旋转缩放
- **全站模糊搜索** — 跨节点名称、ID、摘要即时检索，定位并聚焦对应节点
- **L1/L2/L3 分级过滤** — 顶栏一键显隐各成熟度节点，简洁模式聚焦金线主干

## 内容规模

| 类型 | 数量 | 说明 |
|---|---|---|
| 金线节点（L3·完备） | 30 | 含完整公式推导、跨学科关联 |
| 骨架节点（L1/L2） | 40+ | 涵盖 8 个学科方向 |
| 知识关系类型 | 4 | `depends_on` / `strong_related` / `maps_to` / `suggest_sync` |

**金线主链路**：永磁同步电机矢量控制 → SVPWM / dq坐标变换 → 三相逆变桥 / 同步电机数学模型 → IGBT/MOSFET / 电流速度环 → 电力电子基础 / 麦克斯韦方程组 → 矩阵微积分 / 傅里叶分析

## 技术栈

| 模块 | 技术 |
|---|---|
| 前端框架 | Vue 3 (Composition API / `<script setup>`) + Vite 6 |
| 2D 图谱 | ECharts 5.x（Graph 力导向图） |
| 3D 复盘 | Three.js 0.172 + OrbitControls |
| 公式渲染 | MathJax 3（CDN 按需加载，仅详情浮层触发） |
| 状态管理 | Pinia 2 |
| UI 组件 | Element Plus（`unplugin-vue-components` 按需引入） |
| 路由 | Vue Router 4（Hash 模式） |
| 部署 | 纯静态站点（GitHub Pages / Vercel） |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

## 目录结构

```
src/
├── components/
│   ├── GraphCanvas.vue      # 2D 图谱主组件（ECharts）
│   ├── ContextPanel.vue     # 右侧节点详情面板
│   ├── DetailOverlay.vue    # 全屏详情浮层（MathJax）
│   ├── PathPlanner.vue      # 多策略路径规划 UI
│   ├── PathReview3D.vue     # Three.js 3D 复盘视图
│   └── SearchBar.vue        # 全站搜索框
├── stores/
│   ├── graphStore.js        # 图谱状态（焦点节点、高亮路径、溯源模式）
│   └── contentStore.js      # 知识点详情缓存
├── utils/
│   ├── graphBuilder.js      # ECharts option 构建器
│   ├── pathAlgorithm.js     # 三策略路径生成（Dijkstra + 偏置权重）
│   └── maturityTags.js      # L1/L2/L3 颜色与语义配置
├── data/
│   ├── goldThread.json      # 30 个 L3 金线节点（含公式）
│   └── skeletonGraph.json   # 40+ 个 L1/L2 骨架节点
├── views/
│   └── GraphView.vue        # 图谱主页布局
└── router/index.js          # / 图谱主页，/review 3D 复盘
```

## 构建产物大小（gzip）

| chunk | 大小 |
|---|---|
| echarts | 343 KB |
| three（懒加载） | 124 KB |
| GraphView + Element Plus 按需 | ~71 KB |
| 入口 + 工具模块 | ~67 KB |

Element Plus 通过 `unplugin-vue-components` 按需引入，相比全量引入减少 **~330 KB gzip**。

## 路线图

- [ ] 新增「无线充电系统」金线（L3 内容建设）
- [ ] 节点自制原理动图（Lottie）接入
- [ ] 用户自定义路径保存与分享
- [ ] 移动端手势优化
- [ ] 离线 PWA 支持
