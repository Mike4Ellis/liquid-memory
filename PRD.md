# AIGC 创意工坊 - 产品需求文档 (PRD)

> **代号**: Liquid Memory (液态记忆)  
> **版本**: v1.1  
> **日期**: 2026-02-05  
> **性质**: 开源个人自用项目

---

## 1. 产品概述

### 1.1 核心定位
一个专注于视觉内容创作的 AI 提示词实验室，让用户能够：
- **解析**：上传图片，AI 逆向工程生成结构化提示词
- **收藏**：建立个人提示词库，支持多维度标签管理
- **复刻**：一键生成相似作品（支持即梦 API）
- **探索**：通过思维导图式词汇网络，发现创作灵感

### 1.2 目标用户
- AI 绘画爱好者
- 视觉设计师
- 内容创作者
- 提示词工程师

### 1.3 非目标（明确排除）
- ❌ 视频解析（技术复杂度太高，暂缓）
- ❌ ComfyUI 集成（本地部署门槛高，暂缓）
- ❌ 商业化功能（付费、账户系统、云同步）
- ❌ 社区分享（纯本地工具）

---

## 2. 核心功能模块

### 2.1 智能解析引擎 🔍 （P0）

#### 功能描述
上传图片后，AI 进行多维度分析，生成结构化提示词。

#### 解析维度（可配置模板）
| 维度 | 说明 | 示例 |
|------|------|------|
| Subject | 主体 | 赛博朋克武士 |
| Environment | 环境 | 霓虹灯照耀的东京街头 |
| Composition | 构图 | 低角度仰拍，三分法 |
| Lighting | 光线 | 边缘光，霓虹反射 |
| Mood | 氛围 | 神秘，未来感 |
| Style | 风格 | 超写实，电影级 |
| Camera | 相机参数 | 35mm f/1.4，浅景深 |
| Color | 色彩 | 青橙对比，高饱和 |

#### 输出格式
- **结构化视图**：可编辑的字段表格
- **自然语言**：一键合并为流畅提示词
- **JSON 格式**：供开发者使用

#### 技术实现
- 模型：Qwen3-VL-plus / Kimi-k2.5
- 提示词模板：用户可自定义系统提示词
- 架构：轻量级后端代理（保护 API Key）+ 前端调用

---

### 2.2 个人创意库 📚 （P0）

#### 功能描述
本地存储所有解析记录和收藏的提示词。

#### 数据模型
```typescript
interface CreativeItem {
  id: string;
  type: 'image';
  sourcePath: string;        // 本地文件路径（原始图）
  thumbnailPath: string;     // 缩略图路径
  parsedPrompt: StructuredPrompt;
  naturalPrompt: string;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
}

interface StructuredPrompt {
  subject?: string;
  environment?: string;
  composition?: string;
  lighting?: string;
  mood?: string;
  style?: string;
  camera?: string;
  color?: string;
  [key: string]: string | undefined;
}

interface Tag {
  id: string;
  name: string;
  category: 'style' | 'usage' | 'model' | 'mood' | 'custom';
  color: string;
}
```

#### 搜索与筛选
- **模糊搜索**：支持提示词内容、标签名
- **多维度筛选**：标签组合筛选
- **排序**：时间、相关性

#### 存储方案
- **图片存储**：本地文件系统 + 缩略图压缩（避免 IndexedDB 容量限制）
- **元数据**：IndexedDB（localforage 封装）
- **备份**：导出/导入 JSON

---

### 2.3 复刻工坊 🎨 （P1）

#### 功能描述
基于解析结果，直接生成相似作品。

#### 支持平台
| 平台 | 类型 | 配置方式 | 优先级 |
|------|------|---------|--------|
| 即梦 (SeeDream) | 外部 API | API Key 配置 | P1 |
| Midjourney | 外部 API | Discord Bot 配置 | P2 |
| Stable Diffusion | 本地/API | WebUI API 地址 | P2 |
| ComfyUI | 本地部署 | WebSocket 连接 | 暂缓 |

#### 工作流程
1. 选择解析记录
2. 调整提示词（可选）
3. 选择生成平台
4. 设置参数（尺寸、数量等）
5. 生成 & 结果展示

---

### 2.4 词汇神经网络 🕸️ （P1）

#### 功能描述
思维导图式的视觉词汇表，按关联性组织。

#### 核心特性
- **自动提取**：AI 从解析结果中提取关键词汇
- **手动收藏**：点击词汇即可收藏到词库
- **关联图谱**：相关词汇自动连线，形成语义网络
- **示例图**：每个词汇关联实际作品缩略图

#### 可视化效果
- 力导向图布局（D3.js / Cytoscape.js）
- 节点大小 = 使用频率
- 边的粗细 = 共现次数
- 支持缩放、拖拽、聚焦

---

## 3. 视觉设计系统

### 3.1 设计理念：液态记忆 (Liquid Memory)

> 提示词如流动的思绪，在脑海中交织成网，碰撞出新的火花。

**核心意象**：
- 流体：思路的自由流动
- 晶体：知识的结构化沉淀
- 网络：创意的关联与发散

### 3.2 色彩系统

```css
/* 深色模式 */
--bg-primary: #0a0a0f;
--bg-secondary: #12121a;
--bg-tertiary: #1a1a25;
--accent-cyan: #00f5ff;
--accent-purple: #b829dd;
--accent-pink: #ff006e;
--text-primary: #ffffff;
--text-secondary: #a0a0b0;
```

### 3.3 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS + CSS Variables |
| 状态 | Zustand |
| 存储 | IndexedDB + 本地文件系统 |
| 图表 | D3.js |
| 动画 | Framer Motion |

---

## 4. 开发计划

### Phase 1: 基础框架 + 核心功能 (Week 1-2)
**目标**：MVP 可用（解析 + 创意库）

| 任务 | 优先级 | 验收标准 |
|------|--------|---------|
| 项目初始化 | P0 | Next.js + Tailwind + 主题系统搭建完成 |
| 轻量后端代理 | P0 | API 路由保护 VL API Key，可正常转发请求 |
| 文件上传组件 | P0 | 支持拖拽上传，生成缩略图，保存到本地目录 |
| VL API 集成 | P0 | 成功解析图片并返回结构化数据 |
| 结构化编辑器 | P0 | 可编辑各维度字段，实时预览自然语言 |
| 创意库 CRUD | P0 | 增删改查功能完整，支持标签管理 |
| 搜索筛选 | P0 | 模糊搜索 + 标签筛选正常工作 |

### Phase 2: 高级功能 (Week 3)
**目标**：增强体验

| 任务 | 优先级 | 验收标准 |
|------|--------|---------|
| 词汇网络可视化 | P1 | D3.js 力导向图正常渲染，支持交互 |
| 即梦 API 集成 | P1 | 可选择即梦平台生成图片 |
| 数据导入导出 | P1 | JSON 格式备份恢复功能 |

### Phase 3: 打磨优化 (Week 4)
**目标**：提升品质

| 任务 | 优先级 | 验收标准 |
|------|--------|---------|
| 动效优化 | P2 | 页面过渡、微交互流畅 |
| 性能优化 | P2 | 大图加载、搜索响应速度达标 |
| 文档编写 | P2 | README + 使用指南完整 |

---

## 5. 技术风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| API Key 暴露 | 高 | 必须加后端代理，禁止前端直调 |
| 本地文件权限 | 中 | 使用 Electron/Tauri 或浏览器 File System Access API |
| IndexedDB 容量 | 中 | 图片存文件系统，只存缩略图到 DB |
| VL API 稳定性 | 低 | 支持多模型 fallback |

---

## 6. 附录

### 6.1 参考资源
- Snaplex: https://github.com/ginger4soda-netizen/Snaplex
- D3.js Force Simulation: https://d3js.org/d3-force

### 6.2 待决策事项
- [ ] 是否用 Electron/Tauri 打包桌面应用？（解决文件系统访问问题）
- [ ] 默认 VL API 选哪个？（Qwen3-VL vs Kimi-k2.5）
