# Ralph Workflow - Liquid Memory

## 当前状态
查看 PROGRESS.md 获取最新进度

## 开发流程（手动版）

### Step 1: 确定下一个任务
```bash
node ralph-spawn.js
```
输出示例：
```
Next task: US-003 - Local File Storage and Thumbnail Generation
Run: node ralph-spawn.js US-003
```

### Step 2: 生成任务提示
```bash
node ralph-spawn.js US-003
```
这会输出完整的任务提示，复制给子 agent。

### Step 3: 启动子 Agent（或手动开发）
由于 API 限流问题，建议由我（Gre）手动顺序开发每个 US。

### Step 4: 更新进度
完成后更新：
- PROGRESS.md（标记完成）
- IMPLEMENTATION_PLAN.md（添加笔记）
- AGENTS.md（记录经验教训）

### Step 5: 提交
```bash
git add .
git commit -m "feat: US-XXX description"
git push origin master
```

## 自动化方案（未来）
当 API 限流问题解决后，可以使用：

```bash
# 真正的 Ralph 循环（需要外部 AI CLI）
while :; do cat PROMPT.md | claude ; done
```

或配置 Moltbot 的 cron job 定期 spawn 子 agent。

## 当前推荐
**由我（Gre）手动顺序开发 US-003 ~ US-014**，每个完成后立即汇报。
