# 沙箱组件打包指南

本文档说明如何将沙箱组件打包到 Johnson 应用中，这样用户安装后无需再下载。

## 📦 为什么需要预装沙箱组件？

默认情况下，沙箱组件（QEMU 虚拟机和 Alpine Linux 镜像）会在用户首次使用时从网易 CDN 下载。这会带来：

1. **下载时间长** - 组件约 500MB-1GB，下载需要时间
2. **网络问题** - 某些网络环境可能无法访问网易 CDN
3. **用户体验差** - 用户需要等待下载完成才能使用沙箱功能

通过预装沙箱组件，用户安装应用后可以立即使用沙箱模式！

## 🚀 打包流程

### 1. 下载沙箱组件

```bash
# 下载当前平台的沙箱组件
npm run download:sandbox

# 下载后，文件会保存在 sandbox-resources/ 目录
# - macOS ARM64: sandbox-resources/darwin-arm64/
# - macOS AMD64: sandbox-resources/darwin-amd64/
# - Windows: sandbox-resources/win32-amd64/
```

### 2. 验证下载的文件

```bash
ls -lh sandbox-resources/<platform>/
```

应该看到：
- `qemu-system-*.gz` - QEMU 虚拟机运行时（约 50-100MB）
- `alpine-*.qcow2` - Alpine Linux 镜像（约 500MB-1GB）

### 3. 打包应用

```bash
# 构建 macOS 版本
npm run dist:mac

# 构建 Windows 版本
npm run dist:win

# 构建 Linux 版本
npm run dist:linux
```

打包后的应用会自动包含 `sandbox-resources/` 目录中的文件。

## 📂 文件结构

打包后的应用结构：

```
Johnson.app/
└── Contents/
    └── Resources/
        ├── sandbox-resources/
        │   ├── darwin-arm64/
        │   │   ├── qemu-system-aarch64.gz
        │   │   └── alpine-arm64.qcow2
        │   └── darwin-amd64/
        │       ├── qemu-system-x86_64.gz
        │       └── alpine-amd64.qcow2
        └── ...
```

## 🔧 工作原理

### 运行时检测

1. 用户启动应用并选择沙箱模式
2. 代码首先检查是否有预装的沙箱组件（`getBundledSandboxPaths()`）
3. 如果有，将预装的组件复制到用户数据目录
4. 如果没有，则尝试从网络下载（原有行为）

### 代码位置

- 沙箱组件下载脚本: `scripts/download-sandbox-components.js`
- 运行时检测逻辑: `src/main/libs/coworkSandboxRuntime.ts`
- 打包配置: `electron-builder.json`

## ⚙️ 高级配置

### 仅打包特定平台

如果只想打包某些平台的组件，修改 `scripts/download-sandbox-components.js` 中的 `main()` 函数。

### 使用自定义下载源

设置环境变量：

```bash
export COWORK_SANDBOX_RUNTIME_URL="你的自定义地址"
export COWORK_SANDBOX_IMAGE_URL="你的自定义地址"

npm run download:sandbox
```

### Universal 构建（macOS）

为 macOS Universal 构建（同时支持 Intel 和 Apple Silicon），需要下载两个平台的组件：

```bash
# 在 Apple Silicon Mac 上运行
npm run download:sandbox  # 自动下载 ARM64 和 AMD64 两个版本
```

## 📏 文件大小影响

| 平台 | 组件大小 | 对安装包的影响 |
|------|----------|---------------|
| macOS ARM64 | ~600 MB | +600 MB |
| macOS AMD64 | ~650 MB | +650 MB |
| Windows | ~650 MB | +650 MB |

**注意**: Universal macOS 构建会包含两套组件，安装包会增大约 1.2GB。

## 🚫 不想打包沙箱组件？

如果你希望保持安装包小巧，可以让用户自行下载：

1. 从 `electron-builder.json` 的 `extraResources` 中移除 `sandbox-resources`
2. 不运行 `npm run download:sandbox`
3. 用户首次使用沙箱时会自动下载

## 🔍 故障排查

### 问题：打包后沙箱仍然无法使用

**检查**:
```bash
# 查看应用包内容
ls -R "Johnson.app/Contents/Resources/sandbox-resources"

# 查看运行时日志
~/Library/Logs/Johnson/main.log
```

### 问题：下载脚本失败

**原因**: 网络连接问题或 CDN 不可用

**解决**:
1. 检查网络连接
2. 使用代理或 VPN
3. 手动下载文件并放到正确位置

### 问题：文件已存在但仍然下载

**原因**: 下载脚本会跳过已存在的文件

**解决**: 删除 `sandbox-resources/` 目录后重新下载

```bash
rm -rf sandbox-resources/
npm run download:sandbox
```

## 📝 更新日志

- 2026-03-04: 初始版本，支持 macOS ARM64/AMD64 和 Windows AMD64
