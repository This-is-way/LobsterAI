# Fork 项目 Git 工作流程

## 📋 基本概念

```
原始仓库 (upstream)  netease-youdao/LobsterAI
         ↑
         | 同步更新
         |
Fork 仓库 (origin)    your-username/LobsterAI
         ↑
         | 推送代码
         |
本地仓库 (local)     /Users/dipsy/.../LobsterAI
```

## 🔧 首次设置

### 1. 添加上游仓库

```bash
# 查看当前的远程仓库
git remote -v

# 添加上游仓库（只需执行一次）
git remote add upstream https://github.com/netease-youdao/LobsterAI.git

# 验证
git remote -v
# 应该看到：
# origin    https://github.com/your-username/LobsterAI.git (fetch)
# origin    https://github.com/your-username/LobsterAI.git (push)
# upstream  https://github.com/netease-youdao/LobsterAI.git (fetch)
# upstream  https://github.com/netease-youdao/LobsterAI.git (push)
```

---

## 🔄 日常工作流程

### 场景 1：上游有更新，你想同步到本地

```bash
# 1. 获取上游的最新代码
git fetch upstream

# 2. 查看差异（可选）
git log main..upstream/main
# 或查看分支差异
git diff main upstream/main

# 3. 合并上游更新到本地 main 分支
git checkout main
git merge upstream/main

# 4. 如果有冲突，解决冲突后：
git add .
git commit -m "chore: merge upstream changes"

# 5. 推送到你的 fork 仓库
git push origin main
```

### 场景 2：你在自己的分支工作，上游有更新

```bash
# 1. 切换到 main 分支并同步上游
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# 2. 切回你的工作分支
git checkout your-feature-branch

# 3. 将 main 的更新合并到你的分支
git merge main

# 4. 如果有冲突，解决后提交
git add .
git commit -m "chore: merge main into feature branch"
```

### 场景 3：推荐的工作流（使用 rebase）

```bash
# 1. 同步上游 main
git checkout main
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease

# 2. 在你的功能分支上 rebase
git checkout your-feature-branch
git rebase main

# 3. 如果有冲突：
git add .
git rebase --continue

# 4. 推送到你的 fork（可能需要强制推送）
git push origin your-feature-branch --force-with-lease
```

---

## 🌟 推荐的完整工作流

### 开发新功能

```bash
# 1. 确保 main 是最新的
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 开发并提交
git add .
git commit -m "feat: add your feature"

# 4. 推送到你的 fork
git push origin feature/your-feature-name

# 5. 在 GitHub 上创建 Pull Request 到上游仓库
```

### 定期同步上游更新

```bash
# 每天或每周执行一次
git checkout main
git fetch upstream
git merge upstream/main
git push origin main

# 或者使用 rebase（更清晰的提交历史）
git checkout main
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

---

## ⚠️ 处理冲突

### 合并冲突时的处理

```bash
# 1. 尝试合并时如果出现冲突
git merge upstream/main
# Auto-merging file.txt
# CONFLICT (content): Merge conflict in file.txt

# 2. 查看冲突文件
git status

# 3. 手动编辑文件，解决冲突
# 编辑文件，删除冲突标记，保留需要的内容

# 4. 标记为已解决
git add file.txt

# 5. 完成合并
git commit -m "chore: resolve merge conflicts"
```

### Rebase 冲突时的处理

```bash
# 1. rebase 时出现冲突
git rebase upstream/main
# First, rewinding head to replay your work on top of it...
# Applying: your commit
# Using index info to reconstruct a base tree...
# error: could not apply your-commit

# 2. 解决冲突
# 编辑文件，解决冲突

# 3. 继续添加文件
git add .

# 4. 继续 rebase
git rebase --continue

# 5. 如果想放弃 rebase
git rebase --abort
```

---

## 🚨 常见问题

### Q: push 时提示 "non-fast-forward"

```bash
# 原因：远程有你不存在的提交（可能是上游的更新）

# 解决 1：先拉取再推送
git pull --rebase origin main
git push origin main

# 解决 2：如果你确定要覆盖（慎用）
git push origin main --force-with-lease
```

### Q: merge 产生了很多 "Merge branch 'upstream/main'"

```bash
# 使用 rebase 代替 merge 可以避免这些合并提交
git checkout main
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

### Q: 想要放弃本地修改，完全使用上游版本

```bash
git fetch upstream
git reset --hard upstream/main
git push origin main --force
```

### Q: 想要查看上游有哪些新提交

```bash
git fetch upstream
git log main..upstream/main --oneline --graph
```

---

## 📝 最佳实践

1. **定期同步**：每天或每周同步一次上游更新
2. **使用功能分支**：不要直接在 main 上开发
3. **清晰的提交信息**：使用约定式提交（feat:, fix:, chore: 等）
4. **push 前先同步**：推送前先拉取上游更新，减少冲突
5. **小步快跑**：频繁提交，频繁推送，减少大冲突

---

## 🔄 自动化脚本

创建一个同步脚本 `scripts/sync-upstream.sh`：

```bash
#!/bin/bash
set -e

echo "🔄 Syncing with upstream..."

# 获取上游更新
git fetch upstream

# 切换到 main
git checkout main

# 同步上游
git rebase upstream/main

# 推送到你的 fork
git push origin main --force-with-lease

echo "✅ Sync complete!"
```

使用：
```bash
chmod +x scripts/sync-upstream.sh
./scripts/sync-upstream.sh
```

---

## 🎯 总结

**核心命令**：
```bash
# 同步上游
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

**重要提醒**：
- ⚠️ 使用 `--force-with-lease` 而不是 `--force`（更安全）
- ⚠️ 在 public 分支上使用 rebase 要小心
- ⚠️ 如果已经和别人共享了分支，使用 merge 而不是 rebase
