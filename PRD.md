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

---

## 7. 未来规划（Roadmap v2.0）

### 7.1 云端同步 ☁️ （Phase 4）

#### 背景
原 PRD 明确排除商业化功能，但随着个人使用数据增长，本地存储存在以下痛点：
- 多设备切换时数据不同步
- 浏览器清理导致数据丢失风险
- 无法在手机/平板查看创意库

#### 目标
提供**可选**的云端同步功能，保持开源免费定位。

#### 技术方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Supabase** (PostgreSQL) | 开源、 generous free tier、实时订阅 | 学习成本略高 | ⭐⭐⭐⭐⭐ |
| **Firebase** (Firestore) | 生态成熟、实时同步 | Google 锁定、国内访问不稳定 | ⭐⭐⭐ |
| **自建后端** (Node.js + MongoDB) | 完全可控 | 运维成本高 | ⭐⭐ |

#### 推荐方案：Supabase

**架构设计**:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Supabase   │────▶│  PostgreSQL │
│  (Next.js)  │◀────│   (Auth +   │◀────│   + Storage │
└─────────────┘     │ Realtime)   │     └─────────────┘
                    └─────────────┘
```

**数据模型扩展**:
```typescript
// 云端 CreativeItem 表
interface CloudCreativeItem {
  id: string;
  user_id: string;           // Supabase Auth UUID
  local_id: string;          // 本地 IndexedDB ID（用于关联）
  image_url: string;         // Supabase Storage URL
  thumbnail_url: string;     // 压缩图 URL
  prompt: StructuredPrompt;
  natural_prompt: string;
  tags: string[];
  sync_status: 'synced' | 'pending' | 'conflict';
  created_at: string;        // ISO 8601
  updated_at: string;
  deleted_at: string | null; // 软删除
}

// 同步日志表（用于离线队列）
interface SyncLog {
  id: string;
  user_id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  record_id: string;
  payload: JSON;
  created_at: string;
  synced_at: string | null;
}
```

**核心功能**:

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 匿名登录 | 无需邮箱，一键生成临时账户 | P0 |
| 数据加密 | 端到端加密（用户密码派生密钥） | P1 |
| 增量同步 | 只传输变更数据，节省流量 | P0 |
| 冲突解决 | 时间戳优先 + 手动合并 UI | P1 |
| 离线支持 | 本地操作，联网后自动同步 | P0 |
| 多端实时 | WebSocket 推送变更到其他设备 | P2 |

**隐私策略**:
- 所有图片在上传前可选择加密（AES-GCM）
- 服务端无法解密用户数据
- 支持「仅元数据同步」模式（图片保留本地）

**定价（参考）**:
- 免费版：500MB 存储，1000 条记录
- Pro 版 ($5/月)：10GB 存储，无限记录
- 自托管版：完全免费，需自行部署 Supabase

---

### 7.2 移动端 App 📱 （Phase 5）

#### 背景
手机是灵感收集的主要场景，但 Web App 在移动端的体验受限：
- 无法接收推送通知
- 分享菜单集成困难
- 相机调用体验不佳

#### 目标
开发原生级体验的跨平台移动应用。

#### 技术选型

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| **React Native (Expo)** | 一套代码双端、热更新、生态成熟 | 性能略低于纯原生 | ✅ 推荐 |
| **Flutter** | 性能好、UI 一致 | Dart 学习成本、包体积大 | 备选 |
| **PWA + Capacitor** | Web 技术栈复用 | 原生能力受限 | 不推荐 |

#### 架构设计

```
┌─────────────────────────────────────────┐
│           Mobile App (RN + Expo)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Camera  │ │  Gallery │ │  Share   │ │
│  └──────────┘ └──────────┘ └──────────┘ │
│              ┌──────────────┐            │
│              │  Sync Engine │            │
│              │  (Offline-First)          │
│              └──────────────┘            │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Supabase Backend                │
│    (Auth + Database + Storage)          │
└─────────────────────────────────────────┘
```

**核心功能**:

| 模块 | 功能 | 说明 |
|------|------|------|
| 📷 相机 | 拍照即解析 | 调用原生相机，拍完直接 AI 分析 |
| 🖼️ 相册 | 批量导入 | 多选照片，后台批量处理 |
| 🔗 分享扩展 | 从其他 App 导入 | 支持微信、微博、浏览器等分享入口 |
| 🔔 推送 | 每日灵感 | 基于词汇网络推荐相关提示词 |
| 🌐 离线模式 | 无网可用 | 本地 SQLite，有网自动同步 |
| 🔍 以图搜图 | 相似作品发现 | 向量搜索（pgvector） |

**与 Web 端的功能对齐**:

| Web 功能 | Mobile 状态 | 备注 |
|----------|-------------|------|
| 上传解析 | ✅ 完整支持 | 相机 + 相册 |
| 结构化编辑 | ✅ 完整支持 | 适配小屏的折叠面板 |
| 创意库 | ✅ 完整支持 | 瀑布流布局 |
| 标签管理 | ✅ 完整支持 | 底部 Sheet 弹窗 |
| 词汇网络 | ⚠️ 简化版 | 2D 力导向图，暂不支持 3D 旋转 |
| AI 生成 | ⚠️ 仅查看 | 手机端暂不集成生成（耗流量） |
| 数据导出 | ❌ 暂不支持 | 复杂操作建议在 Web 端完成 |

**UI 适配策略**:

```typescript
// 响应式断点
const breakpoints = {
  mobile: 0,      // 手机竖屏 (< 480px)
  tablet: 480,    // 手机横屏/平板 (480-768px)
  desktop: 768,   // 平板横屏/桌面 (> 768px)
};

// 组件差异化渲染
function PromptEditor({ data }: { data: ParsedPrompt }) {
  const { width } = useWindowDimensions();
  
  if (width < 480) {
    return <MobilePromptEditor data={data} />;  // 折叠面板
  }
  
  return <DesktopPromptEditor data={data} />;   // 左右分栏
}
```

**开发计划**:

| 阶段 | 周期 | 里程碑 |
|------|------|--------|
| M1 基础框架 | 2周 | Expo 项目搭建，导航结构，主题系统 |
| M2 核心功能 | 3周 | 相机/相册、解析、创意库列表 |
| M3 同步引擎 | 2周 | 离线优先架构，Supabase 集成 |
| M4 高级功能 | 2周 | 分享扩展、推送通知、生物识别锁 |
| M5 打磨发布 | 1周 | TestFlight 内测，应用商店审核 |

**发布渠道**:
- iOS: App Store（TestFlight 内测先行）
- Android: Google Play + F-Droid（开源版）

---

## 8. 商业模式探讨（可选）

虽然定位为开源个人工具，但可持续运营需要合理的商业模式：

### 8.1 开源核心 + 云服务增值
- **Core**: 本地优先，完全免费，MIT 协议
- **Cloud**: 可选同步服务，freemium 定价
- **Enterprise**: 私有化部署支持（按需收费）

### 8.2 创作者经济
- **模板市场**: 优质提示词模板交易抽成（10%）
- **API 代理**: 为开发者提供稳定的 VL API 聚合服务
- **品牌合作**: 与 Midjourney、即梦等平台的分成合作

### 8.3 社区捐赠
- GitHub Sponsors
- Open Collective
- 加密货币捐赠（BTC/ETH）

---

## 9. 附录 B：技术债务追踪

| 债务项 | 影响 | 偿还计划 |
|--------|------|----------|
| IndexedDB 迁移到 SQLite | 中 | Phase 4 云端同步时统一处理 |
| D3.js 升级到 v7 | 低 | 词汇网络重构时顺便升级 |
| 测试覆盖率不足 | 高 | Phase 3 补充 E2E 测试 |
| 缺少国际化 | 低 | Phase 5 移动端时考虑 i18n |
