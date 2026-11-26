<p align="center"><img src="docs/icon.png" alt="BetterClaudeDashboard，Claude Code 儀表板外掛圖示" width="96"></p>

<h1 align="center">BetterClaudeDashboard</h1>

<p align="center">給 Claude 桌面版用的 Claude Code 儀表板與用量監視器。</p>

[![License: MIT](https://img.shields.io/github/license/leohsiehtw/better-claude-dashboard)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](#安裝)
[![Languages](https://img.shields.io/badge/languages-5-blue)](#語言)

[English](README.md) · 繁體中文 · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

BetterClaudeDashboard 是一個 Claude Code 儀表板（dashboard）：這個 Claude Code plugin 和用量監視器（usage monitor）放在桌面版的側邊面板，不離開 app 就能即時看 token 用量、context window、5 小時與每週限額、權限和 subagent。只觀察事件：不呼叫模型、不耗 token，也不阻擋或改寫工具呼叫；只有你連按兩次停止按鈕時才會動作。

## 吉祥物

<table><tr><td align="center"><img src="docs/moods/idle.gif" alt="Claude Code 儀表板吉祥物：閒置" width="150"><br><sub>閒置：睡覺、東張西望、眨眼</sub></td><td align="center"><img src="docs/moods/laptop.gif" alt="Claude Code 儀表板吉祥物：用筆電打字" width="150"><br><sub>拿出筆電、轉身打字</sub></td><td align="center"><img src="docs/moods/read.gif" alt="Claude Code 儀表板吉祥物：看書" width="150"><br><sub>看書</sub></td><td align="center"><img src="docs/moods/search.gif" alt="Claude Code 儀表板吉祥物：搜尋" width="150"><br><sub>搜尋</sub></td></tr><tr><td align="center"><img src="docs/moods/coffee.gif" alt="Claude Code 儀表板吉祥物：喝咖啡休息" width="150"><br><sub>喝咖啡休息</sub></td><td align="center"><img src="docs/moods/walk.gif" alt="Claude Code 儀表板吉祥物：邊走邊想" width="150"><br><sub>邊走邊想</sub></td><td align="center"><img src="docs/moods/bulb.gif" alt="Claude Code 儀表板吉祥物：靈光一閃" width="150"><br><sub>靈光一閃</sub></td><td align="center"><img src="docs/moods/hop.gif" alt="Claude Code 儀表板吉祥物：跳躍" width="150"><br><sub>跳躍</sub></td></tr></table>

## 功能

- **即時動態**：Claude 此刻在做什麼：每個執行中的工具呼叫與經過時間、Bash / PowerShell 指令（截短、明顯的金鑰會遮蔽），以及背景的 shell、monitor 與 subagent。停止按鈕可停止整個回合（同 Esc）、單一背景工作或全部；每個停止都要在 4 秒內再按一次才生效。
- **方案用量**：5 小時與 7 天用量條，附重置倒數。
- **Session**：模型、權限模式、effort、回合數、費用、運行時間、context 條、自動壓縮門檻、佔用最多的 context 類別。
- **Git**：專案資料夾名稱與目前的 git branch。
- **Tokens**：主執行緒的輸入與輸出 token，以及 prompt cache 命中率。
- **本對話**：context 使用百分比，加上自儀表板第一次看到這個 session 起，大約用掉多少 5 小時額度（見「限制」）。
- **背景資訊（context 分類）**：訊息、系統工具、MCP 工具、系統提示、Skills、記憶檔案、自訂代理、自動壓縮緩衝、可用空間與延遲載入工具，各顯示 token 數與佔視窗比例，另列出 MCP 工具、記憶檔案、自訂代理和 Skills 的數量。
- **Turn**：本回合即時計時、工具呼叫數、編輯數、錯誤數、上一回合耗時、整個 session 累計。
- **Permissions**：允許 / 詢問 / 拒絕次數、檔案 / shell / 其他分類、前幾名工具。
- **Subagents**：每個一張卡，顯示名稱、說明、狀態、經過時間、輸出 token 與模型。面板寬度至少 64 欄時，卡片分成兩欄，較窄則一欄。執行中的卡片會多一行，顯示該 subagent 目前在做什麼。
- **Session log**：最近 12 筆事件（工具、權限、回合、subagent）。
- **多語言**：English、繁體中文、简体中文、日本語、한국어，用面板裡的按鈕切換。
- **會動的 Claude 吉祥物**：閒置時睡覺、東張西望，Claude 工作時輪流表演用筆電、看書、搜尋、喝咖啡、踱步、靈光一閃和跳躍。桌面版用 SVG 繪製。這是非官方的同人繪製，不是 Anthropic 的素材。在桌面版，吉祥物下方還會出現小幫手（機器人、小雞、史萊姆、無人機），每個忙碌中的 subagent 一隻；閒置的 teammate 沒有。
- **可重開**：關掉面板後，用輸入框上方的 `Usage ▸` 按鈕重新打開。
- 淺色與深色模式都可讀，窄面板文字會自動換行。

## 語言

面板提供 English、繁體中文、简体中文、日本語、한국어。語言依這個順序決定：上次的選擇、Claude Code 的 `language` 設定、`LC_ALL` / `LC_MESSAGES` / `LANG` 環境變數，最後是 English。面板上方的按鈕依 EN → 繁中 → 简中 → 日本語 → 한국어 循環切換，選擇會跨 session 保留。

## 設定

有三個選項可調整面板外觀，可用 `/better-claude-dashboard` 或面板頂端的 `⚙` 按鈕變更（桌面版沒有外掛斜線指令，所以按鈕列提供相同功能）：

```
/better-claude-dashboard show
/better-claude-dashboard companions on|off
/better-claude-dashboard grid auto|1|2
/better-claude-dashboard tokens both|context|plan
/better-claude-dashboard reset
```

- `companions`：吉祥物下方的小幫手列（預設開）。
- `grid`：subagent 卡片分 `1` 或 `2` 欄，或 `auto`（寬度 64 欄起為兩欄；預設）。
- `tokens`：「本對話」顯示的內容：`both`、只有 `context`，或只有 `plan` 額度（預設 both）。

一行可同時給多個（`companions off grid 2`，或 `grid=2`）。不認得的值不會改動任何設定。選擇會跨 session 保留。

## 安裝

外掛名稱：`better-claude-dashboard`。

```
claude plugin marketplace add leohsiehtw/better-claude-dashboard
claude plugin install better-claude-dashboard@local-mods --scope user
```

之後執行 `/reload-plugins`。以桌面版為主。

在桌面版：點輸入框旁的 +，選 Plugins，Add marketplace `leohsiehtw/better-claude-dashboard`，再 Add plugin。

## Hook 做了什麼

所有 hook 都只觀察，並原封不動放行事件：`tool.check` 記錄允許 / 詢問 / 拒絕的判定（先取得判定結果再原樣回傳），`tool.call` 統計呼叫與錯誤，`turn.start` / `turn.complete` 計時回合、讀取 subagent 輸出 token，並加總主執行緒的 token，`classic.*` 事件記錄權限模式、effort 與權限彈窗，`session.*` 啟動更新計時器（`session.start` 也負責選擇語言），`ui.render` 繪製面板和 `Usage ▸` 按鈕。約每分鐘在 session 資料夾執行一次 `git branch --show-current` 來顯示 branch。 `tool.call` 也記錄執行中的呼叫與它們啟動的背景工作（shell 的 `backgroundTaskId`、Monitor 的 `taskId`），`classic.Stop` 用引擎的 `background_tasks` 核對這份清單。停止按鈕按兩次後，執行中的回合呼叫 `$.turn.abort`，背景工作或 subagent 呼叫 `TaskStop` 工具。`/better-claude-dashboard` 可帶參數（見「設定」），選擇存在外掛的 store，key 為 `settings`。執行中指令的遮蔽與截短後文字只在執行期間保存在外掛狀態中，不會寫入任何檔案。

## 限制

API 拿不到所以不顯示：每個 subagent 的 context 大小、分類器的真正判定、請求數（以回合數代替），以及依模型分開的週限額。「等待」是判為詢問但尚未結束的呼叫數，包含工具本身執行的時間。Token 總計只算 mod 載入之後的主執行緒回合。git branch 需要 PATH 上有 `git`。 自行結束的背景工作，要等回報它的那個回合結束才顯示為已結束。停止回合時，執行中的指令可能被移到背景而不是終止，之後會出現在背景清單並有自己的停止按鈕。被權限規則拒絕的停止，或不在背景執行的 subagent，會在該列顯示原因。「本對話」的方案額度為估算值：5 小時視窗屬於整個帳號，其他 session 與應用程式也會計入；數字前有 ≈，讀數以 0.1% 為單位，基準是儀表板看到的第一個讀數（之前的用量不計入）。視窗重置時會接續計算。

## 致謝

精簡用量顯示的點子來自 status-line 外掛 [uppinote20/claude-dashboard](https://github.com/uppinote20/claude-dashboard)。
