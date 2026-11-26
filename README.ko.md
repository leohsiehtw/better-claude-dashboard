<p align="center"><img src="docs/icon.png" alt="BetterClaudeDashboard, Claude Code 대시보드 플러그인 아이콘" width="96"></p>

<h1 align="center">BetterClaudeDashboard</h1>

<p align="center">Claude 데스크톱 앱용 Claude Code 대시보드이자 사용량 모니터.</p>

[![License: MIT](https://img.shields.io/github/license/leohsiehtw/better-claude-dashboard)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-D97757)](#설치)
[![Languages](https://img.shields.io/badge/languages-5-blue)](#언어)

[English](README.md) · [繁體中文](README.zh-TW.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · 한국어

BetterClaudeDashboard는 Claude Code 대시보드(dashboard)입니다. 이 Claude Code plugin이자 사용량 모니터(usage monitor)는 데스크톱 앱의 사이드 패널에 상주하며, 앱을 벗어나지 않고도 토큰 사용량, 컨텍스트 윈도우, 5시간 및 주간 한도, 권한, 서브에이전트를 실시간으로 보여 줍니다. 이벤트만 관찰합니다. 모델 호출 없음, 토큰 소모 0이며, 도구 호출을 막거나 고쳐 쓰지 않으며, 중지 버튼을 두 번 눌렀을 때만 동작합니다.

## 마스코트

<table><tr><td align="center"><img src="docs/moods/idle.gif" alt="Claude Code 대시보드 마스코트: 유휴" width="150"><br><sub>유휴: 졸기, 두리번거리기, 윙크</sub></td><td align="center"><img src="docs/moods/laptop.gif" alt="Claude Code 대시보드 마스코트: 노트북으로 타이핑" width="150"><br><sub>노트북을 꺼내 타이핑</sub></td><td align="center"><img src="docs/moods/read.gif" alt="Claude Code 대시보드 마스코트: 독서" width="150"><br><sub>독서</sub></td><td align="center"><img src="docs/moods/search.gif" alt="Claude Code 대시보드 마스코트: 검색" width="150"><br><sub>검색</sub></td></tr><tr><td align="center"><img src="docs/moods/coffee.gif" alt="Claude Code 대시보드 마스코트: 커피 휴식" width="150"><br><sub>커피 휴식</sub></td><td align="center"><img src="docs/moods/walk.gif" alt="Claude Code 대시보드 마스코트: 걸으며 생각하기" width="150"><br><sub>걸으며 생각하기</sub></td><td align="center"><img src="docs/moods/bulb.gif" alt="Claude Code 대시보드 마스코트: 아이디어" width="150"><br><sub>아이디어</sub></td><td align="center"><img src="docs/moods/hop.gif" alt="Claude Code 대시보드 마스코트: 점프" width="150"><br><sub>점프</sub></td></tr></table>

## 기능

- **실행 현황**: Claude가 지금 무엇을 하는지. 실행 중인 각 도구 호출과 경과 시간, Bash / PowerShell 명령(잘라서 표시, 눈에 띄는 비밀 값은 가림), 백그라운드 셸·모니터·서브에이전트. 중지 버튼으로 턴 전체(Esc와 같음), 백그라운드 작업 하나, 또는 전부를 멈출 수 있습니다. 모든 중지는 4초 안에 한 번 더 눌러야 실행됩니다.
- **플랜 한도**: 5시간 및 7일 사용량 막대와 초기화까지 남은 시간.
- **세션**: 모델, 권한 모드, effort, 턴 수, 비용, 가동 시간, 컨텍스트 막대, 자동 압축 임계값, 가장 큰 컨텍스트 카테고리.
- **Git**: 프로젝트 폴더 이름과 현재 git 브랜치.
- **토큰**: 메인 스레드의 입력·출력 토큰과 프롬프트 캐시 적중률.
- **이 대화**: 컨텍스트 사용률과, 대시보드가 이 세션을 처음 본 뒤 사용한 5시간 한도의 대략적인 비율(「제한」 참고).
- **컨텍스트 구성**: 모든 컨텍스트 카테고리(메시지, 시스템 도구, MCP 도구, 시스템 프롬프트, 스킬, 메모리 파일, 에이전트, 자동 압축 버퍼, 여유 공간, 지연 로드 도구)의 토큰 수와 윈도우 대비 비율, 그리고 MCP 도구·메모리 파일·에이전트·스킬의 개수.
- **턴**: 진행 중인 턴 타이머, 도구 호출 수, 편집 수, 오류 수, 지난 턴 소요 시간, 세션 합계.
- **권한**: 허용 / 확인 / 거부 횟수, 파일 / 셸 / 기타 구분, 상위 도구.
- **서브에이전트**: 하나당 카드 한 장에 이름, 설명, 상태, 경과 시간, 출력 토큰, 모델을 표시.패널 너비가 64열 이상이면 카드가 두 열로, 더 좁으면 한 열로 놓입니다. 실행 중인 카드에는 그 서브에이전트가 지금 하는 일을 보여 주는 줄이 붙습니다.
- **세션 로그**: 최근 이벤트 12개(도구, 권한, 턴, 서브에이전트).
- **다국어**: English, 繁體中文, 简体中文, 日本語, 한국어를 패널의 버튼으로 전환.
- **움직이는 Claude 마스코트**: 유휴일 때는 졸고 두리번거리며, Claude가 작업하는 동안 노트북 사용, 독서, 검색, 커피, 서성이기, 아이디어, 점프를 번갈아 보여 줍니다. 데스크톱에서는 SVG로 그립니다. 비공식 팬 그림이며 Anthropic의 자산이 아닙니다.데스크톱에서는 마스코트 아래에 작업 중인 서브에이전트마다 하나씩, 작은 도우미(로봇, 병아리, 슬라임, 드론)가 나타납니다. 유휴 상태의 팀원에게는 없습니다.
- **다시 열기 가능**: 패널을 닫아도 프롬프트 위의 `Usage ▸` 버튼으로 다시 열 수 있습니다.
- 라이트 모드와 다크 모드를 모두 지원하며, 좁은 패널에서는 글자가 줄바꿈됩니다.

## 언어

패널은 English, 繁體中文, 简体中文, 日本語, 한국어로 표시할 수 있습니다. 언어는 다음 순서로 정해집니다: 마지막으로 고른 언어, Claude Code의 `language` 설정, 환경 변수 `LC_ALL` / `LC_MESSAGES` / `LANG`, 마지막으로 English. 패널 상단의 버튼은 EN → 繁中 → 简中 → 日本語 → 한국어 순서로 전환하며, 선택은 세션이 바뀌어도 유지됩니다.

## 설정

패널의 모양을 바꾸는 옵션이 세 가지 있습니다. `/better-claude-dashboard` 또는 패널 맨 위의 `⚙` 버튼으로 바꿉니다(데스크톱 앱에는 플러그인 슬래시 명령이 없어서 버튼 줄이 같은 일을 합니다).

```
/better-claude-dashboard show
/better-claude-dashboard companions on|off
/better-claude-dashboard grid auto|1|2
/better-claude-dashboard tokens both|context|plan
/better-claude-dashboard reset
```

- `companions`: 마스코트 아래의 도우미 줄(기본 켬).
- `grid`: 서브에이전트 카드를 `1`열 또는 `2`열로, 또는 `auto`(너비 64열부터 두 열, 기본).
- `tokens`: 「이 대화」에 보일 내용: `both`, `context`만, `plan` 비율만(기본 both).

한 줄에 여러 개를 줄 수 있습니다(`companions off grid 2`, 또는 `grid=2`). 알 수 없는 값은 아무것도 바꾸지 않습니다. 선택은 세션이 바뀌어도 유지됩니다.

## 설치

플러그인 이름: `better-claude-dashboard`.

```
claude plugin marketplace add leohsiehtw/better-claude-dashboard
claude plugin install better-claude-dashboard@local-mods --scope user
```

그다음 `/reload-plugins`를 실행합니다. 대상은 데스크톱 앱입니다.

데스크톱 앱에서는 입력창 옆의 +를 누르고 Plugins를 선택한 뒤, Add marketplace에 `leohsiehtw/better-claude-dashboard`를 입력하고 Add plugin 합니다.

## 훅이 하는 일

모든 훅은 관찰만 하며 이벤트를 그대로 통과시킵니다. `tool.check`는 허용 / 확인 / 거부 판정을 기록하고(판정을 기다린 뒤 그대로 반환), `tool.call`은 호출과 오류를 세고, `turn.start` / `turn.complete`는 턴을 측정하고 서브에이전트 출력 토큰을 읽으며 메인 스레드의 토큰을 합산하고, `classic.*` 이벤트는 권한 모드, effort, 권한 대화상자를 기록하고, `session.*`는 갱신 타이머를 시작하며(`session.start`는 언어도 고름), `ui.render`는 패널과 `Usage ▸` 버튼을 그립니다. 브랜치를 보여 주기 위해 약 1분에 한 번 세션 폴더에서 `git branch --show-current`를 실행합니다. `tool.call`은 실행 중인 호출과 그 호출이 시작한 백그라운드 작업(셸의 `backgroundTaskId`, Monitor의 `taskId`)도 기록하고, `classic.Stop`이 엔진의 `background_tasks`와 대조합니다. 중지 버튼을 두 번 누르면 실행 중인 턴에는 `$.turn.abort`, 백그라운드 작업이나 서브에이전트에는 `TaskStop` 도구를 호출합니다.`/better-claude-dashboard`는 인수를 받으며(「설정」 참고), 선택은 플러그인 store에 키 `settings`로 저장됩니다. 실행 중인 명령의 마스킹·축약된 텍스트는 실행되는 동안에만 플러그인 상태에 보관되며 파일에는 쓰이지 않습니다.

## 제한

API가 제공하지 않아 표시하지 않는 것: 서브에이전트별 컨텍스트 크기, 분류기의 실제 판정, 요청 수(대신 턴 수 사용), 모델별 주간 한도. "대기"는 확인이 필요하다고 판정되었으나 아직 끝나지 않은 호출 수이며 도구 자체의 실행 시간을 포함합니다. 토큰 합계는 mod가 로드된 이후의 메인 스레드 턴만 집계합니다. git 브랜치를 보려면 PATH에 `git`이 있어야 합니다. 스스로 끝난 백그라운드 작업은 그것을 알린 턴이 끝나야 종료로 표시됩니다. 턴을 멈추면 실행 중인 명령이 종료되지 않고 백그라운드로 옮겨질 수 있으며, 그러면 백그라운드 목록에 자체 중지 버튼과 함께 나타납니다. 권한 규칙이 거부한 중지나 백그라운드에서 실행되지 않는 서브에이전트는 해당 줄에 이유를 표시합니다.「이 대화」의 플랜 사용 비율은 근사치입니다. 5시간 창은 계정 전체의 것이라 다른 세션과 앱의 사용량도 포함되고, 숫자 앞에 ≈가 붙으며, 측정은 0.1% 단위이고, 기준은 대시보드가 처음 얻은 측정값입니다(그 이전 사용량은 포함되지 않음). 창이 초기화돼도 이어서 계산합니다.

## 크레딧

간결한 사용량 표시라는 아이디어는 상태 표시줄 플러그인 [uppinote20/claude-dashboard](https://github.com/uppinote20/claude-dashboard)에서 얻었습니다.
