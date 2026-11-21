<p align="center"><img src="docs/icon.png" alt="BetterClaudeDashboard, a Claude Code dashboard plugin icon" width="96"></p>

<h1 align="center">BetterClaudeDashboard</h1>

<p align="center">A Claude Code dashboard and usage monitor for the Claude desktop app.</p>

[![License: MIT](https://img.shields.io/github/license/leohsiehtw/better-claude-dashboard)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](#install)
[![Languages](https://img.shields.io/badge/languages-5-blue)](#languages)

English · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

BetterClaudeDashboard is a Claude Code dashboard: a Claude Code plugin and usage monitor that lives in a side pane of the desktop app. It shows live token usage, the context window, 5-hour and weekly limits, permissions and subagents without leaving the app. It observes events (no model calls, zero tokens) and never blocks or rewrites tool calls; it acts only when you press a Stop button twice.

## Mascot

<table><tr><td align="center"><img src="docs/moods/idle.gif" alt="Claude Code dashboard mascot: idle" width="150"><br><sub>Idle: sleeps, looks around, winks</sub></td><td align="center"><img src="docs/moods/laptop.gif" alt="Claude Code dashboard mascot: typing on a laptop" width="150"><br><sub>Takes out a laptop and types</sub></td><td align="center"><img src="docs/moods/read.gif" alt="Claude Code dashboard mascot: reading" width="150"><br><sub>Reading</sub></td><td align="center"><img src="docs/moods/search.gif" alt="Claude Code dashboard mascot: searching" width="150"><br><sub>Searching</sub></td></tr><tr><td align="center"><img src="docs/moods/coffee.gif" alt="Claude Code dashboard mascot: coffee break" width="150"><br><sub>Coffee break</sub></td><td align="center"><img src="docs/moods/walk.gif" alt="Claude Code dashboard mascot: pacing while thinking" width="150"><br><sub>Pacing while thinking</sub></td><td align="center"><img src="docs/moods/bulb.gif" alt="Claude Code dashboard mascot: having an idea" width="150"><br><sub>Idea</sub></td><td align="center"><img src="docs/moods/hop.gif" alt="Claude Code dashboard mascot: hopping" width="150"><br><sub>Hopping</sub></td></tr></table>

## Features

- **Now**: what Claude is doing right now: each running tool call with its elapsed time, the Bash / PowerShell command (clipped, obvious secrets masked), and the background shells, monitors and subagents. Stop buttons end the turn (like Esc), one background task, or all of them; each Stop acts only on a second press within 4 seconds.
- **Plan limits**: 5-hour and 7-day usage bars with reset countdowns.
- **Session**: model, permission mode, effort, turn count, cost, uptime, context bar, auto-compact threshold and the largest context categories.
- **Git**: the project folder name and the current git branch.
- **Tokens**: main-thread input and output tokens and the prompt cache hit rate.
- **Context breakdown**: every context category (messages, system tools, MCP tools, system prompt, skills, memory files, agents, auto-compact buffer, free space and deferred tools) with tokens and share of the window, plus the number of MCP tools, memory files, agents and skills.
- **Turn**: live turn timer, tool calls, edits, errors, last turn duration, session totals.
- **Permissions**: allow / ask / deny counts, file / shell / other split, top tools.
- **Subagents**: one card each with name, description, status, elapsed time, output tokens and model.
- **Session log**: the last 12 events (tools, permissions, turns, subagents).
- **Multilingual**: English, 繁體中文, 简体中文, 日本語 and 한국어, switched with a button in the pane.
- **Animated Claude mascot**: it sleeps and looks around when idle, and while Claude works it rotates through using a laptop, reading, searching, having coffee, pacing, getting ideas and hopping. Drawn as SVG on desktop. An unofficial fan drawing, not an Anthropic asset.
- **Reopenable**: the `Usage ▸` button above the prompt brings the pane back after closing it.
- Works in light and dark mode, text wraps in a narrow pane.

## Languages

The pane is available in English, 繁體中文, 简体中文, 日本語 and 한국어. The language is picked in this order: your last choice, the Claude Code `language` setting, the `LC_ALL` / `LC_MESSAGES` / `LANG` environment variables, then English. The button at the top of the pane cycles EN → 繁中 → 简中 → 日本語 → 한국어, and the choice is kept across sessions.

## Install

Plugin name: `better-claude-dashboard`.

```
claude plugin marketplace add leohsiehtw/better-claude-dashboard
claude plugin install better-claude-dashboard@local-mods --scope user
```

Then run `/reload-plugins`. Desktop is the target surface.

In the desktop app: click + next to the prompt box, choose Plugins, Add marketplace `leohsiehtw/better-claude-dashboard`, then Add plugin.

## What the hooks do

All hooks only observe and always pass the event through unchanged: `tool.check` records the allow / ask / deny verdict (it awaits the verdict and returns it as given), `tool.call` counts calls and errors, `turn.start` / `turn.complete` time turns, read subagent output tokens and add up the main thread's tokens, `classic.*` events record permission mode, effort and permission dialogs, `session.*` start the refresh timer (and `session.start` picks the language), and `ui.render` draws the pane and the `Usage ▸` button. About once a minute it runs `git branch --show-current` in the session folder to show the branch. `tool.call` also keeps the list of running calls and the background tasks they start (a shell's `backgroundTaskId`, a Monitor's `taskId`), and `classic.Stop` checks that list against the engine's `background_tasks`. A Stop pressed twice calls `$.turn.abort` for the running turn, or the `TaskStop` tool for a background task or subagent.

## Limits

Not exposed by the API, so not shown: per-subagent context size, the classifier's real verdict, a request count (turn count is used instead), and weekly limits per model. "Pending" counts asked calls that have not finished, including the tool's own run time. Token totals count only main-thread turns since the mod loaded. The git branch needs `git` on your PATH. A background task that ends by itself shows as ended once the turn that reports it finishes. Stopping a turn may move a running command to the background instead of ending it; it then appears under background with its own Stop. A stop that a permission rule refuses, or a subagent not running in the background, shows the reason on its row.

## Credits

The idea of a compact usage readout comes from the status-line plugin [uppinote20/claude-dashboard](https://github.com/uppinote20/claude-dashboard).
