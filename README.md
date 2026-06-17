# 🍎 Apple Pomodoro · 苹果风格番茄钟

一个采用 **Apple Design** 风格的番茄钟桌面应用，基于 **Electron + React + TypeScript** 构建。

<p align="center">
  <img src="https://img.shields.io/badge/Electron-31.0-blue?logo=electron" />
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss" />
  <img src="https://img.shields.io/badge/license-MIT-green" />
</p>

---

## ✨ 功能特性

- 🎯 **三种计时模式** — 专注（25 分钟）、短休（5 分钟）、长休（15 分钟）
- 🔄 **自动轮换** — 每完成 4 个专注会话，自动进入长休
- 🔔 **系统通知** — 计时结束时弹出桌面通知 + 提示音
- 📌 **窗口置顶** — 可切换始终在最前
- 🌗 **明暗主题** — Apple 风格深色/浅色切换
- 🎨 **流畅动画** — 由 Framer Motion 驱动的细腻过渡
- 🖥️ **系统托盘** — 最小化到托盘，右键菜单控制
- ⌨️ **快捷键** — `⌘/Ctrl + Shift + P` 切换窗口

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18
- **npm** ≥ 9

### 安装依赖

```bash
npm install
```

### 启动开发模式（仅 Web）

```bash
npm run dev
```

浏览器访问 `http://localhost:5173`

### 启动 Electron 桌面应用

```bash
npm run electron:dev
```

### 打包为可执行文件

```bash
npm run electron:build
```

---

## 📂 项目结构

```
pomodoro/
├── electron/
│   ├── main.cjs          # Electron 主进程
│   └── preload.cjs       # 预加载脚本
├── src/
│   ├── components/
│   │   ├── ControlButtons.tsx  # 开始/暂停/重置按钮
│   │   ├── ModeTabs.tsx        # 模式切换标签
│   │   ├── SessionDots.tsx     # 会话进度圆点
│   │   ├── ThemeToggle.tsx     # 明暗主题切换
│   │   ├── TimerRing.tsx       # 圆形进度环
│   │   └── WindowControls.tsx  # 窗口控制按钮
│   ├── App.tsx            # 主应用组件
│   ├── config.ts          # 计时器配置
│   ├── index.css          # 全局样式
│   └── main.tsx           # 入口文件
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Electron 31 |
| UI | React 18 + TypeScript |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 动画 | Framer Motion 11 |
| 图标 | Lucide React |

---

## 📄 License

MIT
