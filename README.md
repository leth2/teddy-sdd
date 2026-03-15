# teddy-sdd — 스펙 기반 개발 도구

Claude Code용 스펙 주도 개발(SDD) 워크플로우. **스펙이 진실(Spec is the Truth)** 철학에 기반.

---

## 이 도구가 해결하는 문제

AI 코딩 에이전트를 쓰다 보면 이런 일이 반복됩니다:

- **같은 실수를 계속 한다** — 매 세션마다 컨텍스트가 초기화되고, 이전에 겪은 문제를 또 겪는다.
- **코드와 의도가 어긋난다** — "이런 걸 만들어 줘"로 시작한 결과물이 처음 원했던 것과 달라진다.
- **스펙이 바뀌면 어디를 고쳐야 할지 모른다** — 요구사항과 코드 사이의 연결고리가 없다.
- **대화가 길어질수록 방향을 잃는다** — AI도 사람도 "지금 뭘 만들고 있었더라"를 까먹는다.

**teddy-sdd는 이 문제를 워크플로우로 해결합니다:**

- 코드를 짜기 전에 **스펙을 먼저 작성** → 의도가 기록된다.
- **Steering 파일**이 프로젝트 메모리 역할 → 매 세션 컨텍스트 복구.
- **`@impl` 태그**로 스펙 문장과 코드 위치를 연결 → 요구사항 변경 시 영향 코드 즉시 파악.
- **Lessons Loop**로 AI 실수를 누적 학습 → 같은 버그 반복 방지.

```
단계별 예시:
/sdd:steering                  # "이 프로젝트는 TypeScript + Hono 기반 API야"  →  AI가 매 세션 기억
/sdd:spec-requirements auth    # "인증은 JWT, 7일 만료"  →  의도가 스펙에 기록됨
/sdd:spec-impl auth            # TDD로 구현  →  스펙에서 벗어나면 경고
/sdd:spec-delta auth           # 요구사항 변경  →  영향받는 코드 파일·라인 즉시 특정
```

---

## 핵심 철학

1. **스펙이 먼저** — 무엇을 왜 만드는지 정의 후 어떻게를 고민.
2. **CLAUDE.md ≤ 50줄** — 부트스트랩은 지도만 제공. 지능은 `.agents/skills/` 에.
3. **Steering = What-only** — 코드 예시 없음. 사실, 결정, 패턴만 기록.
4. **스킬 기반 lazy loading** — 명령어는 얇게, 로직은 스킬에. 필요할 때만 로드.
5. **스펙-코드 1:1 추적** — `@impl` 태그로 스펙 문장 ↔ 코드 위치 연결.

---

## 스펙 계층 구조

큰 기능은 계층으로 관리할 수 있어요:

```
Epic (큰 목표)          → /sdd:spec-decompose "사용자 관리 시스템"
└── Feature (기능 단위) → .sdd/specs/TIMESTAMP-feature/ (자동 생성)
    └── Story (요구사항) → requirements.md (REQ-NNN + EARS 형식)
        └── AC (수락 기준) → /sdd:spec-impl로 구현
```

소규모 프로젝트에서는 Feature 단위로 바로 시작해도 돼요 (`/sdd:spec-requirements`).

---

## 적합한 프로젝트 규모

| | teddy-sdd | 별도 시스템 권장 |
|---|---|---|
| 팀 규모 | 1~5명 | 6명 이상 |
| 피처 수 | ~20개 | 수십 개 이상 |
| 스펙 관리 | 마크다운 파일 | Jira / Linear 등 |
| 배포 주기 | 빠른 반복 | 엔터프라이즈 릴리즈 |

**잘 맞는 경우:** 사이드 프로젝트, PoC, 스타트업 초기, 개인 도구 개발  
**맞지 않는 경우:** 수백 개 요구사항 관리, 복잡한 승인 워크플로우, 다수 팀 병렬 개발

---

## 빠른 시작

```bash
# 원라이너 설치
curl -fsSL https://raw.githubusercontent.com/leth2/teddy-sdd/master/install.sh | bash -s /path/to/project

# 또는 클론 후 직접 실행
git clone https://github.com/leth2/teddy-sdd.git
./teddy-sdd/install.sh /path/to/project
```

설치 후 Claude Code에서:

```
/sdd:steering                        # 프로젝트 메모리 초기화 (첫 실행)
/sdd:spec-requirements <기능 설명>   # 요구사항 작성
/sdd:spec-design <feature>           # 설계 문서 생성
/sdd:spec-tasks <feature>            # 태스크 목록 생성
/sdd:spec-impl <feature>             # TDD 구현
```

---

## 설치 후 구조

```
프로젝트/
├── CLAUDE.md                          # ≤50줄 부트스트랩
│
├── .agents/skills/                    # AgentSkills 표준 경로 (cross-client)
│   ├── project-steering/              # ⚡ /sdd:steering 첫 실행 시 자동 생성
│   │   ├── SKILL.md                   #    인덱스 + 동적 로딩 규칙
│   │   └── references/
│   │       ├── product.md             #    제품 목적·기능·제약 (요구사항 작업 시)
│   │       ├── tech.md                #    기술 스택·결정 (설계·구현 시)
│   │       └── structure.md           #    폴더 구조·네이밍 (파일 생성 시)
│   ├── sdd-workflow/SKILL.md          # 전체 워크플로우 가이드
│   ├── sdd-requirements/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── ears-format.md
│   │       └── requirements-template.md   ← 스펙 템플릿
│   ├── sdd-design/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── patterns.md
│   │       └── design-template.md         ← 설계 템플릿
│   ├── sdd-tasks/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── tdd-structure.md
│   │       └── tasks-template.md          ← 태스크 템플릿
│   ├── sdd-impl/SKILL.md
│   ├── sdd-delta/SKILL.md
│   ├── sdd-steering-rules/
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── truth-hierarchy.md
│   │       ├── steering-product-template.md   ← 스티어링 템플릿
│   │       ├── steering-tech-template.md
│   │       └── steering-structure-template.md
│   └── ... (17개 스킬)
│
├── .claude/commands/sdd/              # Claude Code 커맨드 (얇은 진입점)
│   ├── spec-requirements.md
│   ├── spec-impl.md
│   └── ...
│
└── .sdd/                              # 런타임 데이터 (git 관리 대상)
    ├── req-counter.json               # 전역 REQ ID 카운터 (스펙 간 중복 방지)
    ├── specs/TIMESTAMP-feature/       # 스펙 폴더 (UTC Unix epoch)
    │   ├── requirements.md            # 요구사항 (@impl 태그 포함)
    │   ├── design.md
    │   └── tasks.md
    ├── steering/                      # (레거시, 현재는 .agents/skills/project-steering/ 사용)
    ├── lessons/                       # 누적 교훈 (Lessons Loop)
    ├── logs/                          # 자동화 실행 로그
    ├── briefings/                     # 브리핑 기록
    └── archive/                       # 아카이브된 스펙
```

### AgentSkills 호환성

`.agents/skills/`는 [AgentSkills 표준](https://agentskills.io) cross-client 경로입니다.  
Claude Code, Cursor, Gemini CLI 등 AgentSkills 호환 도구에서 자동 발견됩니다.

---

## SDD 워크플로우

**단계별 실행** (사람이 각 단계를 검토하며 진행):
```
/sdd:steering → /sdd:spec-requirements → /sdd:spec-design → /sdd:spec-tasks → /sdd:spec-impl
```

**자동 실행** (overnight용, 검토 없이 끝까지):
```
/sdd:spec-auto <설명>    # 위 5단계를 자동으로 실행, 아침에 /sdd:briefing으로 결과 확인
```

> 처음 시작하거나 중요한 기능은 단계별로. 반복적이거나 익숙한 작업은 `spec-auto`로.

> ⚠️ **`/sdd:spec-impl` 없이 직접 코딩하면 `@impl` 태그가 생성되지 않습니다.**  
> 스펙 작성 후 에디터에서 직접 코드를 짜면 스펙-코드 추적이 끊겨요.  
> `spec-delta`의 "영향 코드 즉시 특정" 기능은 `@impl` 태그가 있어야 정밀하게 동작합니다.

---

## @impl 태그 — 스펙-코드 추적

요구사항 파일에 `@impl` 태그를 달면 스펙 문장과 코드 위치를 연결합니다.

```markdown
<!-- requirements.md -->
- 메모는 고유 UUID v4 ID를 가진다 <!-- @impl: src/MemoService.ts#MemoService.add -->
- 메모를 ID로 조회할 수 있다 <!-- @impl: src/MemoService.ts#MemoService.get -->
```

```
/sdd:spec-delta <feature>
```

스펙이 바뀌었을 때 영향받는 코드 위치 즉시 파악:

```
✅ @impl 태그 있음 → 코드 위치 직접 특정 (src/MemoService.ts L17 ±5줄)
⚠️ @impl 태그 없음 → 추정 검색 결과 표시
⚠️ 삭제된 문장     → 삭제 후보 경고 (자동 삭제 없음)
```

---

## Lessons Loop — AI 실수 방지

반복되는 AI 실수를 `.sdd/lessons/` 에 누적하여 다음 구현에 자동 로드.

```
/sdd:spec-capture    # 구현 중 발견된 교훈 즉시 포착
/sdd:spec-lessons    # 현재 프로젝트 적용 가능 교훈 조회
```

`spec-impl` 실행 시 관련 lessons 자동 로드 → 같은 실수 반복 방지.

---

## 커맨드 레퍼런스

### 스펙 워크플로우

| 커맨드 | 설명 |
|--------|------|
| `/sdd:spec-requirements <feature>` | 요구사항 생성 |
| `/sdd:spec-design <feature>` | 설계 문서 생성 |
| `/sdd:spec-plan <feature>` | req + design + tasks 한 번에 |
| `/sdd:spec-tasks <feature>` | 태스크 목록 생성 |
| `/sdd:spec-impl <feature> [task]` | TDD 구현 |
| `/sdd:spec-auto <설명>` | 완전 자동 구현 (overnight용) |
| `/sdd:spec-decompose "<Epic 설명>"` | Epic → Feature→Story 계층 분해, 각 Feature 스펙 폴더 자동 생성 |
| `/sdd:spec-update <feature> "<요청>"` | 자연어 변경 요청 → 신규/수정 자동 분류 → spec-delta/spec-impl 연결 |
| `/sdd:spec-init <설명>` | 스펙 구조만 초기화 |

### 분석 및 추적

| 커맨드 | 설명 |
|--------|------|
| `/sdd:spec-delta <feature>` | 스펙 변경 → 영향 코드 위치 추적 |
| `/sdd:spec-validate <feature>` | 스펙-코드 정합성 검증 |
| `/sdd:spec-gap <feature>` | 스펙 누락/불완전 분석 |
| `/sdd:spec-search <keyword>` | lessons 검색 (기본) / `--all` 추가 시 전체 스펙 요구사항 검색 |
| `/sdd:spec-status [feature]` | 진행 상황 확인 |

### 스티어링 및 교훈

| 커맨드 | 설명 |
|--------|------|
| `/sdd:steering` | 스티어링 생성/업데이트 |
| `/sdd:steering-trim [file]` | 긴 스티어링 분리 (≤100줄 유지) |
| `/sdd:spec-capture` | 구현 중 교훈 즉시 포착 |
| `/sdd:spec-lessons` | 적용 가능 교훈 조회 |

### 기타

| 커맨드 | 설명 |
|--------|------|
| `/sdd:briefing [--since N]` | 작업 브리핑 |
| `/sdd:spec-reset [feature]` | 아카이브 및 초기화 |
| `/sdd:spec-research <topic>` | 외부 스펙/기술 조사 |
| `/sdd:spec-sync` | 스펙-코드 동기화 상태 확인 |
| `/sdd:roadmap` | 전체 진행 로드맵 |

---

## 라이선스

MIT
