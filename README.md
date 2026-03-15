# teddy-sdd — 스펙 기반 개발 도구

Claude Code용 스펙 주도 개발(SDD) 워크플로우. **스펙이 진실(Spec is the Truth)** 철학에 기반.

> 스펙 → 설계 → 구현. 코드는 스펙의 결과물이지 출발점이 아닙니다.

---

## 핵심 철학

1. **스펙이 먼저** — 무엇을 왜 만드는지 정의 후 어떻게를 고민.
2. **CLAUDE.md ≤ 50줄** — 부트스트랩은 지도만 제공. 지능은 `.agents/skills/` 에.
3. **Steering = What-only** — 코드 예시 없음. 사실, 결정, 패턴만 기록.
4. **스킬 기반 lazy loading** — 명령어는 얇게, 로직은 스킬에. 필요할 때만 로드.
5. **스펙-코드 1:1 추적** — `@impl` 태그로 스펙 문장 ↔ 코드 위치 연결.

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
    ├── specs/TIMESTAMP-feature/       # 스펙 폴더 (UTC Unix epoch)
    │   ├── requirements.md            # 요구사항 (@impl 태그 포함)
    │   ├── design.md
    │   └── tasks.md
    ├── steering/                      # /sdd:steering이 생성 (처음엔 빈 폴더)
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

```
/sdd:steering → /sdd:spec-requirements → /sdd:spec-design → /sdd:spec-tasks → /sdd:spec-impl
```

각 단계는 사람의 검토 후 다음으로 진행. 자동화가 필요하면 `spec-auto` 사용.

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
| `/sdd:spec-init <설명>` | 스펙 구조만 초기화 |

### 분석 및 추적

| 커맨드 | 설명 |
|--------|------|
| `/sdd:spec-delta <feature>` | 스펙 변경 → 영향 코드 위치 추적 |
| `/sdd:spec-validate <feature>` | 스펙-코드 정합성 검증 |
| `/sdd:spec-gap <feature>` | 스펙 누락/불완전 분석 |
| `/sdd:spec-search <keyword>` | 스펙 전체 검색 |
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
