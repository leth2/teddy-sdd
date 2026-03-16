# SDD 스킬 네비게이터

사용할 스킬을 찾을 때 이 파일을 읽는다.
각 스킬의 SKILL.md 경로와 용도를 담고 있다.

## 워크플로우 스킬

| 스킬 | 경로 | 용도 |
|------|------|------|
| sdd-workflow | `.agents/skills/sdd-workflow/SKILL.md` | 전체 SDD 워크플로우 — 처음엔 반드시 읽기 |
| sdd-requirements | `.agents/skills/sdd-requirements/SKILL.md` | `/sdd:spec-req` — 요구사항 작성 |
| sdd-design | `.agents/skills/sdd-design/SKILL.md` | `/sdd:spec-design` — 설계 작성 |
| sdd-tasks | `.agents/skills/sdd-tasks/SKILL.md` | `/sdd:spec-tasks` — 태스크 작성 |
| sdd-impl | `.agents/skills/sdd-impl/SKILL.md` | `/sdd:spec-impl` — 구현 |
| sdd-validate | `.agents/skills/sdd-validate/SKILL.md` | `/sdd:spec-val` — 스펙 검증 |

## 관리 스킬

| 스킬 | 경로 | 용도 |
|------|------|------|
| sdd-steering-rules | `.agents/skills/sdd-steering-rules/SKILL.md` | `/sdd:steering` — 스티어링 생성/업데이트 |
| sdd-decompose | `.agents/skills/sdd-decompose/SKILL.md` | `/sdd:spec-decomp` — Epic→Feature→Story 분해 |
| sdd-update | `.agents/skills/sdd-update/SKILL.md` | `/sdd:spec-update` — 요구사항 변경 반영 |
| sdd-delta | `.agents/skills/sdd-delta/SKILL.md` | `/sdd:spec-delta` — @impl 태그 동기화 |
| sdd-reset | `.agents/skills/sdd-reset/SKILL.md` | `/sdd:spec-reset` — 스펙 초기화/아카이브 |
| sdd-search | `.agents/skills/sdd-search/SKILL.md` | `/sdd:spec-search` — 전체 스펙 검색 |

## 학습/인사이트 스킬

| 스킬 | 경로 | 용도 |
|------|------|------|
| sdd-lessons | `.agents/skills/sdd-lessons/SKILL.md` | `/sdd:spec-lessons` + `/sdd:spec-capture` — 교훈 저장/조회 |
| sdd-retrospective | `.agents/skills/sdd-retrospective/SKILL.md` | `/sdd:retro` — 스프린트 회고 |
| sdd-gap | `.agents/skills/sdd-gap/SKILL.md` | `/sdd:spec-gap` — 스펙↔코드 갭 분석 |

## 자동화 스킬

| 스킬 | 경로 | 용도 |
|------|------|------|
| sdd-autonomous | `.agents/skills/sdd-autonomous/SKILL.md` | `/sdd:spec-auto` — overnight 완전 자동 구현 |
| sdd-lazy-load | `.agents/skills/sdd-lazy-load/SKILL.md` | `/sdd:spec-index` — 대용량 스펙 섹션별 로딩 |

## 보조 스킬

| 스킬 | 경로 | 용도 |
|------|------|------|
| sdd-research | `.agents/skills/sdd-research/SKILL.md` | `/sdd:spec-research` — 외부 기술/API 조사 |
| sdd-briefing | `.agents/skills/sdd-briefing/SKILL.md` | `/sdd:briefing` — 진행 상황 브리핑 |
| sdd-roadmap | `.agents/skills/sdd-roadmap/SKILL.md` | `/sdd:roadmap` — 전체 로드맵 생성 |
| project-steering | `.agents/skills/project-steering/` | 프로젝트 스티어링 (런타임 생성) |

## 사용 규칙

- **처음 SDD 사용 시** → 반드시 `sdd-workflow` 먼저 읽기
- **커맨드 실행 시** → 해당 스킬만 읽기 (전체 로드 금지)
- **스킬 없으면** → `sdd-workflow`의 커맨드 참조 섹션 확인
