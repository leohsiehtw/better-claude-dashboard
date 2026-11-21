<p align="center"><img src="docs/icon.png" alt="BetterClaudeDashboard、Claude Code ダッシュボードプラグインのアイコン" width="96"></p>

<h1 align="center">BetterClaudeDashboard</h1>

<p align="center">Claude デスクトップアプリ向けの Claude Code ダッシュボードと使用量モニター。</p>

[![License: MIT](https://img.shields.io/github/license/leohsiehtw/better-claude-dashboard)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](#インストール)
[![Languages](https://img.shields.io/badge/languages-5-blue)](#言語)

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · 日本語 · [한국어](README.ko.md)

BetterClaudeDashboard は Claude Code ダッシュボード（dashboard）です。この Claude Code plugin と使用量モニター（usage monitor）はデスクトップアプリのサイドペインに常駐し、アプリを離れずにトークン使用量、コンテキストウィンドウ、5 時間と週次の上限、権限、サブエージェントをリアルタイムで確認できます。イベントを観察するだけです。モデル呼び出しなし、トークン消費ゼロで、ツール呼び出しをブロックも書き換えもしません。動くのは停止ボタンを 2 回押したときだけです。

## マスコット

<table><tr><td align="center"><img src="docs/moods/idle.gif" alt="Claude Code ダッシュボードのマスコット: アイドル" width="150"><br><sub>アイドル: 居眠り、きょろきょろ、ウインク</sub></td><td align="center"><img src="docs/moods/laptop.gif" alt="Claude Code ダッシュボードのマスコット: ノートパソコンで入力" width="150"><br><sub>ノートパソコンを取り出して入力</sub></td><td align="center"><img src="docs/moods/read.gif" alt="Claude Code ダッシュボードのマスコット: 読書" width="150"><br><sub>読書</sub></td><td align="center"><img src="docs/moods/search.gif" alt="Claude Code ダッシュボードのマスコット: 検索" width="150"><br><sub>検索</sub></td></tr><tr><td align="center"><img src="docs/moods/coffee.gif" alt="Claude Code ダッシュボードのマスコット: コーヒーブレイク" width="150"><br><sub>コーヒーブレイク</sub></td><td align="center"><img src="docs/moods/walk.gif" alt="Claude Code ダッシュボードのマスコット: 歩きながら考える" width="150"><br><sub>歩きながら考える</sub></td><td align="center"><img src="docs/moods/bulb.gif" alt="Claude Code ダッシュボードのマスコット: ひらめき" width="150"><br><sub>ひらめき</sub></td><td align="center"><img src="docs/moods/hop.gif" alt="Claude Code ダッシュボードのマスコット: ジャンプ" width="150"><br><sub>ジャンプ</sub></td></tr></table>

## 機能

- **実行状況**: Claude がいま何をしているか。実行中の各ツール呼び出しと経過時間、Bash / PowerShell のコマンド（短縮、明らかな秘密情報は伏せ字）、バックグラウンドのシェル・モニター・サブエージェント。停止ボタンでターン全体（Esc と同じ）、個別のバックグラウンドタスク、またはすべてを止められます。どの停止も 4 秒以内にもう一度押したときだけ実行されます。
- **プラン上限**: 5 時間と 7 日の使用量バーとリセットまでのカウントダウン。
- **セッション**: モデル、権限モード、effort、ターン数、コスト、稼働時間、コンテキストバー、自動コンパクトのしきい値、最も大きいコンテキストカテゴリ。
- **Git**: プロジェクトのフォルダ名と現在の git ブランチ。
- **トークン**: メインスレッドの入力・出力トークンとプロンプトキャッシュのヒット率。
- **コンテキストの内訳**: すべてのコンテキストカテゴリ（メッセージ、システムツール、MCP ツール、システムプロンプト、スキル、メモリファイル、エージェント、自動コンパクトのバッファ、空き容量、遅延読み込みツール）のトークン数とウィンドウに占める割合、および MCP ツール・メモリファイル・エージェント・スキルの数。
- **ターン**: 実行中ターンのタイマー、ツール呼び出し数、編集数、エラー数、前回のターンの所要時間、セッション合計。
- **権限**: 許可 / 確認 / 拒否の件数、ファイル / シェル / その他の内訳、よく使われるツール。
- **サブエージェント**: 1 つにつき 1 枚のカードに、名前、説明、状態、経過時間、出力トークン、モデルを表示。
- **セッションログ**: 直近 12 件のイベント（ツール、権限、ターン、サブエージェント）。
- **多言語**: English、繁體中文、简体中文、日本語、한국어をペイン内のボタンで切り替え。
- **動く Claude マスコット**: アイドル時は居眠りしてきょろきょろし、Claude の作業中はノートパソコン、読書、検索、コーヒー、歩き回り、ひらめき、ジャンプを順番に披露します。デスクトップでは SVG で描画。非公式のファンイラストで、Anthropic の素材ではありません。
- **再オープン可能**: ペインを閉じても、プロンプト上の `Usage ▸` ボタンで開き直せます。
- ライトモードとダークモードに対応し、狭いペインでは文字が折り返されます。

## 言語

ペインは English、繁體中文、简体中文、日本語、한국어で表示できます。言語は次の順で決まります: 前回の選択、Claude Code の `language` 設定、環境変数 `LC_ALL` / `LC_MESSAGES` / `LANG`、最後に English。ペイン上部のボタンは EN → 繁中 → 简中 → 日本語 → 한국어 の順に切り替わり、選択はセッションをまたいで保持されます。

## インストール

プラグイン名: `better-claude-dashboard`。

```
claude plugin marketplace add leohsiehtw/better-claude-dashboard
claude plugin install better-claude-dashboard@local-mods --scope user
```

その後 `/reload-plugins` を実行します。対象はデスクトップアプリです。

デスクトップアプリでは、入力欄の横の + をクリックし、Plugins を選び、Add marketplace に `leohsiehtw/better-claude-dashboard` を指定して Add plugin します。

## フックの動作

すべてのフックは観察のみで、イベントをそのまま通します。`tool.check` は許可 / 確認 / 拒否の判定を記録し（判定を待って、そのまま返します）、`tool.call` は呼び出しとエラーを数え、`turn.start` / `turn.complete` はターンを計時してサブエージェントの出力トークンを読み取り、メインスレッドのトークンを合算し、`classic.*` イベントは権限モード、effort、権限ダイアログを記録し、`session.*` は更新タイマーを開始し（`session.start` は言語も選びます）、`ui.render` はペインと `Usage ▸` ボタンを描画します。ブランチを表示するため、約 1 分に 1 回、セッションのフォルダで `git branch --show-current` を実行します。 `tool.call` は実行中の呼び出しと、それが始めたバックグラウンドタスク（シェルの `backgroundTaskId`、Monitor の `taskId`）も記録し、`classic.Stop` がエンジンの `background_tasks` と照合します。停止ボタンを 2 回押すと、実行中のターンには `$.turn.abort`、バックグラウンドタスクやサブエージェントには `TaskStop` ツールを呼びます。

## 制限

API が提供しないため表示しないもの: サブエージェントごとのコンテキストサイズ、分類器の実際の判定、リクエスト数（代わりにターン数を使用）、モデル別の週次上限。「保留」は確認が必要と判定されてまだ終わっていない呼び出しの数で、ツール自身の実行時間を含みます。トークン合計は mod の読み込み後のメインスレッドのターンだけを数えます。git ブランチの表示には PATH 上の `git` が必要です。 自然に終わったバックグラウンドタスクは、それを報告したターンが終わった時点で終了と表示されます。ターンを止めると、実行中のコマンドが終了せずバックグラウンドへ移ることがあり、その場合はバックグラウンド一覧に専用の停止ボタン付きで現れます。権限ルールに拒否された停止や、バックグラウンドで動いていないサブエージェントは、その行に理由を表示します。

## クレジット

コンパクトな使用量表示というアイデアは、ステータスラインプラグイン [uppinote20/claude-dashboard](https://github.com/uppinote20/claude-dashboard) から着想を得ています。
