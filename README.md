# 电气知识图谱可视化学习平台

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?logo=github)](https://moss-550-w.github.io/Electrical-Knowledge-Graph/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

🌐 **在线访问：[https://moss-550-w.github.io/Electrical-Knowledge-Graph/](https://moss-550-w.github.io/Electrical-Knowledge-Graph/)**

**以网状知识图谱深度打通电气工程多学科关联**，围绕「永磁同步电机矢量控制」主线，用可视化脉络取代碎片化学习。

---

## 功能特性

- **2D 网状知识图谱** — ECharts 力导向图，节点按内容成熟度分色（金/蓝/灰），有向边区分依赖关系语义
- **三金线主线切换** — 顶栏一键在「全部」「电机控制 ⚙️」「储能 BMS 🔋」「无线充电 🔌」四种视图间切换；选中某条金线时，沿 `depends_on` 有向闭包仅聚焦该主干及其共享基础节点，他线专属节点自动剪除
- **节点聚焦与路径高亮** — 点击节点，自动高亮上下游依赖链，切换「溯源模式」逆向追溯所有前置知识
- **工程场景情境引入** — 每个 L3 节点详情顶部展示真实工程场景卡片（如「你踩下油门的瞬间，这颗器件每秒切换 2 万次…」），将抽象知识锚定到工程实践
- **L3 知识点详情浮层** — 全屏弹出，含工程场景卡片、完整文字说明、KaTeX 公式（含逐步推导折叠展开）、关联节点跳转
- **公式逐步推导** — 每条核心公式可展开 3~5 步推导，含物理直觉说明和工程注释，KaTeX 构建时渲染
- **多策略学习路径生成** — 选定目标知识点，自动生成「理论驱动」「应用驱动」「控制优先」三条差异化路径并对比
- **3D 路径复盘视图** — Three.js 场景，路径节点按依赖深度排列为阶梯立体图，支持旋转缩放
- **全站模糊搜索** — 跨节点名称、ID、摘要即时检索，定位并聚焦对应节点，支持 `Ctrl+K` 快捷唤起
- **L1/L2/L3 分级过滤** — 顶栏一键显隐各成熟度节点，简洁模式聚焦金线主干
- **我的学习地图** — localStorage 持久化已探索节点，图谱上已访问节点显示 👣 脚印标记，侧边栏展示带时间戳的探索历史时间轴，下次访问自动还原上次视角
- **明暗主题切换** — 默认深色星空主题，一键切换浅色模式，偏好 localStorage 持久化
- **新手引导** — 首次进入分步高亮讲解图谱、搜索、溯源、过滤、路径规划五大核心交互

## 内容规模

| 类型 | 数量 | 说明 |
|---|---|---|
| 金线节点（L3·完备） | 54 | 含完整公式推导、逐步推导步骤、工程场景描述、跨学科关联 |
| 骨架节点（L1/L2） | 45 | 涵盖 8 个学科方向 |
| 金线主干 | 3 | 电机控制 ⚙️ · 储能 BMS 🔋 · 无线充电 🔌 |
| 知识关系类型 | 4 | `depends_on` / `strong_related` / `maps_to` / `suggest_sync` |

**金线主干一 · 电机控制**：永磁同步电机矢量控制 → SVPWM / dq坐标变换 → 三相逆变桥 / 同步电机数学模型 → IGBT/MOSFET / 电流速度环 → 电力电子基础 / 麦克斯韦方程组 → 矩阵微积分 / 傅里叶分析

**金线主干二 · 储能 BMS**：电池储能系统 → PCS 变流器 / EKF 荷电状态估计 → 电池充放电 / 卡尔曼滤波 → 电力电子基础 / 数学基础

**金线主干三 · 无线充电**：电动汽车无线充电系统 → 磁耦合互感 / 谐振补偿(SS/LCC) / 高频全桥逆变 → 传输效率(kQ积) / 副边整流 → 谐振电路 / 法拉第定律 / 电力电子基础 → 麦克斯韦方程组 / 复数相量法

> 三条主干共享电力电子、电磁学与数学底座，在图谱中自然交汇，体现知识的网状关联。

## 技术栈

| 模块 | 技术 |
|---|---|
| 前端框架 | Vue 3 (Composition API / `<script setup>`) + Vite 6 |
| 2D 图谱 | ECharts 5.x（Graph 力导向图） |
| 3D 复盘 | Three.js 0.172 + OrbitControls |
| 公式渲染 | KaTeX 0.17（构建时渲染） |
| 状态管理 | Pinia 2 |
| UI 组件 | Element Plus（`unplugin-vue-components` 按需引入） |
| 路由 | Vue Router 4（Hash 模式） |
| 部署 | 纯静态站点（GitHub Pages / Vercel） |

## 快速开始

```bash
npm install
npm run dev      # 开发模式
npm run build    # 生产构建
npm run preview  # 预览构建产物
```

## 目录结构

```
src/
├── components/
│   ├── GraphCanvas.vue      # 2D 图谱主组件（ECharts）+ 视角持久化
│   ├── ContextPanel.vue     # 右侧节点详情面板 + 探索历史时间轴
│   ├── DetailOverlay.vue    # 全屏详情浮层（KaTeX + 工程场景卡片 + 推导步骤）
│   ├── PathPlanner.vue      # 多策略路径规划 UI
│   ├── PathReview3D.vue     # Three.js 3D 复盘视图
│   ├── SearchBar.vue        # 全站搜索框（Ctrl+K 唤起）
│   └── TourGuide.vue        # 新手分步引导浮层
├── views/
│   └── GraphView.vue        # 图谱主页面（顶栏：主线切换 / 过滤 / 主题 / 引导）
├── composables/
│   └── useTheme.js          # 明暗主题切换（localStorage 持久化）
├── stores/
│   ├── graphStore.js        # 图谱状态（焦点节点、高亮路径、溯源模式、当前主线）
│   ├── contentStore.js      # 知识点详情缓存
│   └── historyStore.js      # 探索历史与视角快照（localStorage 持久化）
├── utils/
│   ├── graphBuilder.js      # ECharts option 构建器（含脚印标记）
│   ├── pathAlgorithm.js     # 三策略路径生成（Dijkstra + 偏置权重）
│   └── maturityTags.js      # L1/L2/L3 颜色与语义配置
├── data/
│   ├── goldThread.json      # 54 个 L3 金线节点（含公式、逐步推导、工程场景）
│   ├── skeletonGraph.json   # 45 个 L1/L2 骨架节点
│   └── threads.js           # 三金线主线配置与 depends_on 闭包计算
├── styles/
│   └── dark.css             # 深色星空主题样式
└── router/index.js          # / 图谱主页，/review 3D 复盘
```

## 路线图

- [x] 「储能 BMS」金线主干（L3 内容建设 + 双主线切换）
- [x] 「无线充电系统」金线主干（磁耦合谐振 EV WPT，L3 内容建设 + 三主线切换）
- [x] 深色主题与新手引导
- [ ] 节点自制原理动图（Lottie）接入
- [ ] 用户自定义路径保存与分享
- [ ] 移动端手势优化
- [ ] 离线 PWA 支持
