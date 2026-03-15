# teddy-sdd — 스펙 기반 개발 도구

Claude Code용 스펙 주도 개발(SDD) 워크플로우. **스펙이 진실(Spec is the Truth)** 철학에 기반.

> 스펙 → 설계 → 구현. 코드는 스펙의 결과물이지 출발점이 아닙니다.

---

## 핵심 철학

1. **스펙이 먼저** — 코드보다 스펙을 먼저 작성. 무엇을 왜 만드는지 정의 후 어떻게를 고민.
2. **CLAUDE.md ≤ 50줄** — 부트스트랩은 지도만 제공. 지능은 `.sdd/skills/` 에.
3. **Steering = "무엇"만** — 코드 예시 없음. 사실, 결정, 패턴만 기록.
4. **스킬 기반 lazy loading** — 명령어는 얇게, 로직은 스킬 파일에. 필요할 때만 로드.
5. **스펙-코드 1:1 추적** — `@impl` 태그로 스펙 문장 ↔ 코드 위치 연결.
6. **순서 식별 폴더링** — `TIMESTAMP-feature` (UTC Unix epoch). 타임존 무관, 충돌 없음.

---

## 빠른 시작

```bash
# 프로젝트에 설치
curl -fsSL https://raw.githubusercontent.com/leth2/teddy-sdd/master/install.sh | bash -s /path/to/project

# 또는 직접 실행
./install.sh /path/to/your/project
```

설치 후 Claude Code에서:

```
/sdd:spec-requirements <기능 설명>   # 요구사항 작성
/sdd:spec-design <feature>           # 설계 문서 생성
/sdd:spec-tasks <feature>            # 태스크 목록 생성
/sdd:spec-impl <feature>             # TDD 구현
```

---

## SDD 워크플로우

```
spec-requirements → spec-design → spec-plan(검토) → spec-tasks → spec-impl
```

각 단계는 사람의 검토 후 다음으로 진행. 자동화가 필요하면 `spec-auto` 사용.

---

## @impl 태그 — 스펙-코드 추적

요구사항 파일에 `@impl` 태그를 달면 스펙 문장과 코드 위치를 연결할 수 있습니다.

```markdown
<!-- requirements.md -->
- 메모는 고유 UUID v4 ID를 가진다 <!-- @impl: src/MemoService.ts#MemoService.add -->
- 메모를 ID로 조회할 수 있다 <!-- @impl: src/MemoService.ts#MemoService.get -->
```

변경 전파 분석:

```
/sdd:spec-delta <feature>
```

스펙이 바뀌었을 때 영향받는 코드 위치를 즉시 파악:

```
✅ @impl 태그 있음 → 코드 위치 직접 특정 (src/MemoService.ts L17 ±5줄)
⚠️ @impl 태그 없음 → 추정 검색 결과 표시
⚠️ 삭제된 문장 → 삭제 후보 경고 (자동 삭제 없음)
```

---

## Overnight 자동화

```
/sdd:spec-auto <만들 것 설명>
```

자고 일어나면 구현 완료:
1. 스펙 이름 자동 생성
2. requirements → design → tasks 자동 생성
3. 각 태스크 TDD 구현
4. 진행 상황 `.sdd/logs/YYYY-MM-DD.md` 기록

아침 브리핑:

```
/sdd:briefing
```

- ✅ 밤사이 완료된 작업
- ⚠️ 중단된 곳과 이유
- 🔜 지금 당장 해야 할 다음 액션

---

## Lessons Loop — AI 실수 방지

반복되는 AI 실수를 `.sdd/lessons/` 에 누적하여 다음 구현에 자동 로드.

```
/sdd:spec-capture    # 구현 중 발견된 교훈 즉시 포착
/sdd:spec-lessons    # 현재 프로젝트 적용 가능 교훈 조회
```

`spec-impl` 실행 시 관련 lessons 자동 로드 → 같은 실수 반복 방지.

---

## 디렉토리 구조 (설치 후)

```
프로젝트/
├── CLAUDE.md                              # ≤50줄 부트스트랩
├── .claude/commands/sdd/                  # 커맨드 (얇은 지시)
└── .sdd/
    ├── specs/1741834500-feature/          # TIMESTAMP-feature 스펙 폴더
    │   ├── requirements.md                # 요구사항 (@impl 태그 포함)
    │   ├── design.md                      # 설계 문서
    │   └── tasks.md                       # 태스크 목록
    ├── steering/                          # 프로젝트 메모리
    │   ├── product/SKILL.md               # 제품 방향
    │   ├── tech/SKILL.md                  # 기술 결정
    │   └── structure/SKILL.md             # 파일 구조
    ├── skills/                            # 재사용 로직 (lazy-load)
    ├── lessons/                           # 누적 교훈 (Lessons Loop)
    ├── logs/                              # 자동화 실행 로그
    ├── briefings/                         # 브리핑 기록
    ├── archive/                           # 아카이브된 스펙
    └── settings/                          # 템플릿, 규칙
```

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
| `/sdd:steering-trim [file]` | 긴 스티어링 분리 (≤50줄 유지) |
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

## Reset 사용법

요구사항이 크게 바뀌거나 아키텍처를 재설계할 때:

```
/sdd:spec-reset <feature>
```

리셋 전 AI가 자동 분석:
- ✅ **살릴 것**: 완료된 태스크, 유효한 요구사항, 재사용 가능한 설계
- ❌ **버릴 것**: 미완료 태스크, 방향이 바뀐 요구사항

원본 삭제 없음 — `.sdd/archive/` 에 보관.

---

## 라이선스

MIT
