---
name: sdd-steering-rules
description: 스티어링 생성 및 관리 규칙. What-only 원칙, 진실의 계층(steering→spec→code), Bootstrap/Sync/Rewrite 모드. steering 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Glob Grep LS
---

# 스티어링 관리 규칙

## 핵심 원칙

**스티어링 = 프로젝트 메모리. 문서화가 아님.**
AI가 매 세션마다 코드베이스를 처음부터 분석하지 않아도 되도록.

**What-Only**: 사실, 결정, 패턴만. 구현 방법 없음.

## 스티어링 저장 위치

스티어링은 AgentSkills 스킬로 관리한다:

```
.agents/skills/project-steering/
├── SKILL.md              ← 목록 + 동적 로딩 규칙
└── references/
    ├── product.md        (기본 — 요구사항·스펙 관련 작업 시 무조건)
    ├── tech.md           (기본 — 설계·구현 결정 시 무조건)
    ├── structure.md      (기본 — 파일·폴더 생성 시 무조건)
    └── <optional>.md     (선택 — 관련될 때만)
```

**`project-steering/SKILL.md` 역할**: LLM이 언제 어떤 스티어링을 읽을지 결정하는 인덱스.

## 모드 감지

| 상황 | 모드 | 동작 |
|------|------|------|
| `project-steering/` 없음 + 코드 없음 + `--intent` 없음 | **Bootstrap:New** | 사용자에게 프로젝트 목적 질문 후 생성 |
| `project-steering/` 없음 + 코드 있음 | **Bootstrap:Existing** | 코드베이스 분석 → 자동 생성 |
| `project-steering/` 없음 + `--intent` 있음 | **Bootstrap:Intent** | intent 기반 즉시 생성 |
| 스킬 있음, `--intent` 없음 | **Sync** | 드리프트 감지 및 정렬 확인 |
| `--intent "<새 방향>"` 있음 (스킬 있을 때) | **Rewrite** | 새 방향 중심으로 재작성 |

"코드 없음" 판단: 소스 파일 (`.ts`, `.js`, `.py`, `.go` 등) 이 존재하지 않는 경우.

## Bootstrap:New 모드 — 새 프로젝트

코드가 없고 `--intent`도 없을 때: 먼저 물어본다.

```
이 프로젝트에서 무엇을 만들 건가요?
예: "TypeScript로 메모 앱", "Python FastAPI 서버", "React 대시보드"
```

답변을 받으면 아래 Bootstrap:Intent 방식으로 진행.

## Bootstrap:Existing / Bootstrap:Intent 모드 — project-steering 생성

1. 코드베이스 분석 (있으면) 또는 `--intent` / 사용자 답변 활용
2. `.agents/skills/project-steering/` 디렉토리 생성
3. `references/` 아래에 기본 스티어링 3개 작성:
   - `product.md` — 제품 목적, 핵심 기능, 타겟 사용자, 핵심 제약
   - `tech.md` — 기술 스택, 주요 결정, 외부 서비스
   - `structure.md` — 폴더 구조, 네이밍 규칙, 모듈 경계
4. `SKILL.md` 작성 — 아래 형식 사용:

```markdown
---
name: project-steering
description: [프로젝트명] 스티어링. 제품/기술/구조 방향. spec 작업 시작 전 로드.
---

# [프로젝트명] Project Steering

## 기본 스티어링 (항상 읽기)
spec 작업 시작 전, 구현 결정 전 무조건 읽는다.

- `references/product.md` — 제품 목적·기능·제약 (요구사항 생성 시)
- `references/tech.md` — 기술 스택·결정·제약 (설계·구현 시)
- `references/structure.md` — 폴더 구조·네이밍·경계 (파일 생성 시)

## 옵셔널 스티어링 (관련될 때만)
현재 작업과 관련된 것만 읽는다.

(없음 — /sdd:steering --add <topic> 으로 추가)
```

## What-Only 수락 기준

### ✅ 허용 (What)
- "인증은 JWT, 만료 7일"
- "데이터베이스는 PostgreSQL 15"
- "feature-first 폴더 구조"
- "API 응답은 표준 JSend 형식"

### ❌ 거부 (How)
- 코드 블록 (어떤 언어든)
- 구현 단계 ("먼저 X를 하고...")
- 함수 시그니처
- 의사코드

## 파일 크기 규칙

- 각 references 파일 ≤100줄
- 100줄 넘으면 `/sdd:steer-trim` 실행
- 핵심만 스티어링에, 상세는 별도 references 파일로

## Sync 모드 주의사항

⚠️ **스티어링을 코드에 맞춰 자동 업데이트하지 않음**

드리프트 발견 시:
- 코드 ≠ 스펙 → "코드 수정 필요" 보고
- 스펙 ≠ 스티어링 → "스펙 또는 스티어링 검토 필요" 보고
- 의식적 방향 전환이 있었을 때만 스티어링 업데이트

## 스티어링 참조 방법

다른 스킬에서 스티어링 읽기:
```
Read `.agents/skills/project-steering/SKILL.md`
→ 기본 스티어링은 무조건 references 파일 읽기
→ 옵셔널은 목록에서 관련성 판단 후 선택적 읽기
```

## 개별 스티어링 파일 템플릿

→ `references/steering-product-template.md`
→ `references/steering-tech-template.md`
→ `references/steering-structure-template.md`

## 진실의 계층 및 상세 가이드

→ `references/truth-hierarchy.md`
