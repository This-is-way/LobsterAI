# 沙箱模式 - 开发 vs 生产环境指南

## 🎯 核心要点

**开发模式**：无法使用沙箱，请使用本地模式
**生产模式**：沙箱完全可用，文件系统隔离

---

## 🔍 为什么开发模式不能使用沙箱？

沙箱（QEMU 虚拟机）需要以下条件：

1. **Hypervisor 权限** (`com.apple.security.hypervisor`)
   - 开发模式的 `electron .` 不会应用 entitlements
   - 只有打包后的应用才有这些权限

2. **完整的 QEMU 安装**
   - 需要 QEMU 二进制文件
   - 需要 BIOS 文件 (`bios-256k.bin`)
   - 需要正确的数据目录结构

3. **代码签名**
   - macOS 要求虚拟化相关代码必须签名
   - 开发模式下未签名

---

## 💻 开发环境（当前）

```bash
npm run electron:dev
```

**状态**：❌ 沙箱不可用
**推荐**：使用**本地模式**

**功能**：
- ✅ 所有工具可用（Bash, Read, Write, Edit等）
- ✅ 热重载，开发体验好
- ✅ 可以访问所有文件（包括 `~/.config/claude/`）
- ❌ 无文件系统隔离

**切换到本地模式**：
```
设置 → 协作工作区设置 → 执行模式 → 本地运行
```

---

## 📦 生产环境（打包后）

```bash
# 构建 macOS 应用
npm run dist:mac

# 运行打包的应用
open release/mac/Johnson.app
```

**状态**：✅ 沙箱完全可用
**推荐**：使用**沙箱模式**或**自动模式**

**功能**：
- ✅ 所有工具可用
- ✅ 文件系统完全隔离
- ✅ 无法访问 `~/.config/claude/` 等敏感路径
- ✅ HVF 硬件加速（快速）
- ✅ 预装沙箱组件（无需下载）

**文件系统隔离**：
```
你的 Mac                    沙箱虚拟机
┌─────────────┐             ┌──────────────────┐
│ ~/project/  │────────────▶│  /workspace/project/ │ (可访问)
│ ~/.config/  │ ❌ 无法访问 │                    │
│ ~/Library/  │ ❌ 无法访问 │                    │
└─────────────┘             └──────────────────┘
```

---

## 🧪 如何测试沙箱功能？

### 方法 1：构建并运行（推荐）

```bash
# 1. 下载沙箱组件（首次）
npm run download:sandbox

# 2. 构建
npm run build
npm run compile:electron
npm run dist:mac

# 3. 运行打包的应用
open release/mac/Johnson.app

# 4. 在应用中使用沙箱模式
设置 → 协作工作区设置 → 执行模式 → 自动（优先沙箱）
```

### 方法 2：开发模式下测试隔离逻辑

虽然无法运行真正的虚拟机，但你可以：

1. **在本地模式下测试 AI 行为**
   ```bash
   npm run electron:dev
   # 选择"本地运行"模式
   ```

2. **验证隔离逻辑**
   - 查看 `src/main/libs/coworkVmRunner.ts` 中的文件挂载逻辑
   - 确认只有工作目录被挂载到 `/workspace/project`

3. **打包后验证隔离**
   ```bash
   npm run dist:mac
   open release/mac/Johnson.app
   # 在沙箱中运行：ls ~/
   # 应该无法访问主目录
   ```

---

## 🔧 故障排查

### 问题：打包后沙箱仍不可用

**检查**：
```bash
# 查看应用是否包含沙箱资源
ls -R Johnson.app/Contents/Resources/sandbox-resources/

# 查看日志
tail -f ~/Library/Logs/Johnson/main.log
```

**常见原因**：
1. 未运行 `npm run download:sandbox`
2. 构建时网络问题导致下载失败
3. 权限文件 `entitlements.mac.plist` 配置错误

### 问题：开发模式强制使用沙箱

**原因**：数据库中保存了沙箱配置

**解决**：
```bash
# 方法 1：在设置中切换到本地模式
设置 → 协作工作区设置 → 执行模式 → 本地运行

# 方法 2：重置配置
node scripts/reset-cowork-config.js
```

---

## 📊 性能对比

| 模式 | 环境 | 启动时间 | 运行速度 | 文件隔离 |
|------|------|----------|----------|---------|
| **本地** | 开发 | ~1s | ⚡️ 快 | ❌ 无 |
| **沙箱 (HVF)** | 生产 | ~3s | ⚡️ 快 | ✅ 有 |
| **沙箱 (TCG)** | 理论上 | ~10s | 🐢 慢 | ✅ 有 |

---

## 🎓 最佳实践

### 日常开发
```bash
npm run electron:dev
# 使用本地模式 - 快速、方便、热重载
```

### 测试沙箱隔离
```bash
npm run dist:mac
open release/mac/Johnson.app
# 使用沙箱模式 - 完整隔离，生产环境行为
```

### 给用户分发
```bash
npm run download:sandbox  # 预装沙箱组件
npm run dist:mac           # 打包
# 分发 release/mac/Johnson.dmg
# 用户开箱即用，无需下载沙箱
```

---

## 📝 总结

| 场景 | 推荐模式 | 理由 |
|------|---------|------|
| 日常开发 | 本地 | 快速、热重载、无权限问题 |
| 测试隔离功能 | 沙箱（生产构建） | 真实环境、完整隔离 |
| 分发给用户 | 沙箱（预装组件） | 隔离、安全、无需下载 |

**重要**：不要试图在开发模式下使用沙箱。技术上很难实现，而且没有实际意义。沙箱的价值在于**生产环境的隔离**，而不是开发环境的测试。
