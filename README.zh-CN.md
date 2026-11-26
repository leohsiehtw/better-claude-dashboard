<p align="center"><img src="docs/icon.png" alt="BetterClaudeDashboard，Claude Code 仪表盘插件图标" width="96"></p>

<h1 align="center">BetterClaudeDashboard</h1>

<p align="center">面向 Claude 桌面版的 Claude Code 仪表盘与用量监视器。</p>

[![License: MIT](https://img.shields.io/github/license/leohsiehtw/better-claude-dashboard)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](#安装)
[![Languages](https://img.shields.io/badge/languages-5-blue)](#语言)

[English](README.md) · [繁體中文](README.zh-TW.md) · 简体中文 · [日本語](README.ja.md) · [한국어](README.ko.md)

BetterClaudeDashboard 是一个 Claude Code 仪表盘（dashboard）：这个 Claude Code plugin 和用量监视器（usage monitor）位于桌面版的侧边面板，无需离开 app 就能实时查看 token 用量、context window、5 小时与每周限额、权限和 subagent。只观察事件：不调用模型、不消耗 token，也不阻止或改写工具调用；只有你连按两次停止按钮时才会动作。

## 吉祥物

<table><tr><td align="center"><img src="docs/moods/idle.gif" alt="Claude Code 仪表盘吉祥物：空闲" width="150"><br><sub>空闲：睡觉、东张西望、眨眼</sub></td><td align="center"><img src="docs/moods/laptop.gif" alt="Claude Code 仪表盘吉祥物：用笔记本电脑打字" width="150"><br><sub>拿出笔记本电脑、转身打字</sub></td><td align="center"><img src="docs/moods/read.gif" alt="Claude Code 仪表盘吉祥物：看书" width="150"><br><sub>看书</sub></td><td align="center"><img src="docs/moods/search.gif" alt="Claude Code 仪表盘吉祥物：搜索" width="150"><br><sub>搜索</sub></td></tr><tr><td align="center"><img src="docs/moods/coffee.gif" alt="Claude Code 仪表盘吉祥物：喝咖啡休息" width="150"><br><sub>喝咖啡休息</sub></td><td align="center"><img src="docs/moods/walk.gif" alt="Claude Code 仪表盘吉祥物：边走边想" width="150"><br><sub>边走边想</sub></td><td align="center"><img src="docs/moods/bulb.gif" alt="Claude Code 仪表盘吉祥物：灵光一闪" width="150"><br><sub>灵光一闪</sub></td><td align="center"><img src="docs/moods/hop.gif" alt="Claude Code 仪表盘吉祥物：跳跃" width="150"><br><sub>跳跃</sub></td></tr></table>

## 功能

- **实时动态**：Claude 此刻在做什么：每个运行中的工具调用与已用时间、Bash / PowerShell 命令（截短、明显的密钥会遮蔽），以及后台的 shell、monitor 与 subagent。停止按钮可停止整个轮次（同 Esc）、单个后台任务或全部；每次停止都要在 4 秒内再点一次才生效。
- **套餐用量**：5 小时与 7 天用量条，附重置倒计时。
- **Session**：模型、权限模式、effort、轮次数、费用、运行时间、context 条、自动压缩阈值、占用最多的 context 类别。
- **Git**：项目文件夹名称与当前的 git branch。
- **Tokens**：主线程的输入与输出 token，以及 prompt cache 命中率。
- **本对话**：context 使用百分比，加上自仪表板第一次看到这个 session 起，大约用掉多少 5 小时额度（见“限制”）。
- **上下文（context 分类）**：消息、系统工具、MCP 工具、系统提示、Skills、记忆文件、自定义代理、自动压缩缓冲、可用空间与延迟加载工具，各显示 token 数与占窗口的比例，另列出 MCP 工具、记忆文件、自定义代理和 Skills 的数量。
- **Turn**：本轮实时计时、工具调用数、编辑数、错误数、上一轮耗时、整个 session 累计。
- **Permissions**：允许 / 询问 / 拒绝次数、文件 / shell / 其他分类、前几名工具。
- **Subagents**：每个一张卡片，显示名称、说明、状态、已用时间、输出 token 与模型。面板宽度至少 64 列时，卡片分成两列，较窄则一列。运行中的卡片会多一行，显示该 subagent 当前在做什么。
- **Session log**：最近 12 条事件（工具、权限、轮次、subagent）。
- **多语言**：English、繁體中文、简体中文、日本語、한국어，用面板里的按钮切换。
- **会动的 Claude 吉祥物**：空闲时睡觉、东张西望，Claude 工作时轮流表演用笔记本电脑、看书、搜索、喝咖啡、踱步、灵光一闪和跳跃。桌面版用 SVG 绘制。这是非官方的同人绘制，不是 Anthropic 的素材。在桌面版，吉祥物下方还会出现小帮手（机器人、小鸡、史莱姆、无人机），每个忙碌中的 subagent 一只；空闲的 teammate 没有。
- **可重新打开**：关掉面板后，用输入框上方的 `Usage ▸` 按钮重新打开。
- 浅色与深色模式都可读，窄面板中文字会自动换行。

## 语言

面板提供 English、繁體中文、简体中文、日本語、한국어。语言按以下顺序决定：上次的选择、Claude Code 的 `language` 设置、`LC_ALL` / `LC_MESSAGES` / `LANG` 环境变量，最后是 English。面板顶部的按钮按 EN → 繁中 → 简中 → 日本語 → 한국어 循环切换，选择会跨 session 保留。

## 设置

有三个选项可调整面板外观，可用 `/better-claude-dashboard` 或面板顶端的 `⚙` 按钮更改（桌面版没有插件斜杠命令，所以按钮栏提供相同功能）：

```
/better-claude-dashboard show
/better-claude-dashboard companions on|off
/better-claude-dashboard grid auto|1|2
/better-claude-dashboard tokens both|context|plan
/better-claude-dashboard reset
```

- `companions`：吉祥物下方的小帮手行（默认开）。
- `grid`：subagent 卡片分 `1` 或 `2` 列，或 `auto`（宽度 64 列起为两列；默认）。
- `tokens`：“本对话”显示的内容：`both`、只有 `context`，或只有 `plan` 额度（默认 both）。

一行可同时给多个（`companions off grid 2`，或 `grid=2`）。不认识的值不会改动任何设置。选择会跨 session 保留。

## 安装

插件名称：`better-claude-dashboard`。

```
claude plugin marketplace add leohsiehtw/better-claude-dashboard
claude plugin install better-claude-dashboard@local-mods --scope user
```

然后执行 `/reload-plugins`。以桌面版为主。

在桌面版：点输入框旁的 +，选 Plugins，Add marketplace `leohsiehtw/better-claude-dashboard`，再 Add plugin。

## Hook 做了什么

所有 hook 都只观察，并原样放行事件：`tool.check` 记录允许 / 询问 / 拒绝的判定（先取得判定结果再原样返回），`tool.call` 统计调用与错误，`turn.start` / `turn.complete` 为轮次计时、读取 subagent 输出 token，并累加主线程的 token，`classic.*` 事件记录权限模式、effort 与权限弹窗，`session.*` 启动刷新计时器（`session.start` 同时负责选择语言），`ui.render` 绘制面板和 `Usage ▸` 按钮。大约每分钟在 session 文件夹中执行一次 `git branch --show-current` 来显示 branch。 `tool.call` 也记录运行中的调用及其启动的后台任务（shell 的 `backgroundTaskId`、Monitor 的 `taskId`），`classic.Stop` 用引擎的 `background_tasks` 核对这份列表。停止按钮点两次后，运行中的轮次调用 `$.turn.abort`，后台任务或 subagent 调用 `TaskStop` 工具。`/better-claude-dashboard` 可带参数（见“设置”），选择存在插件的 store，key 为 `settings`。运行中命令的遮蔽与截短后文本只在运行期间保存在插件状态中，不会写入任何文件。

## 限制

API 没有提供所以不显示：每个 subagent 的 context 大小、分类器的真实判定、请求数（以轮次数代替），以及按模型区分的每周限额。“等待”是被判为询问但尚未结束的调用数，包含工具本身的运行时间。Token 总计只统计 mod 加载之后的主线程轮次。git branch 需要 PATH 中有 `git`。 自行结束的后台任务，要等报告它的那个轮次结束才显示为已结束。停止轮次时，运行中的命令可能被移到后台而不是终止，之后会出现在后台列表并有自己的停止按钮。被权限规则拒绝的停止，或不在后台运行的 subagent，会在该行显示原因。“本对话”的套餐额度为估算值：5 小时窗口属于整个账号，其他 session 与应用也会计入；数字前有 ≈，读数以 0.1% 为单位，基准是仪表板看到的第一个读数（之前的用量不计入）。窗口重置时会接续计算。

## 致谢

精简用量显示的想法来自 status-line 插件 [uppinote20/claude-dashboard](https://github.com/uppinote20/claude-dashboard)。
