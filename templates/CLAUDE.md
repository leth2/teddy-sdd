# SDD — 스펙 기반 개발

## 워크플로우
스펙 → 설계 → 구현. 코드는 스펙의 결과물.

## 커맨드
- `/sdd:steering` — 프로젝트 메모리 초기화/업데이트
- `/sdd:spec-requirements <feature>` — 요구사항 작성
- `/sdd:spec-design <feature>` — 설계 문서 생성
- `/sdd:spec-tasks <feature>` — 태스크 목록 생성
- `/sdd:spec-impl <feature> [task]` — TDD 구현
- `/sdd:spec-plan <설명>` — req+design+tasks 한 번에
- `/sdd:spec-auto <설명>` — 완전 자동 구현 (overnight용)
- `/sdd:spec-delta <feature>` — 스펙 변경 → 코드 영향 추적
- `/sdd:spec-status` — 전체 진행 상황
- `/sdd:spec-reset [feature]` — 스펙 아카이브/초기화
- `/sdd:spec-capture "<제목>"` — 교훈 기록
- `/sdd:briefing` — 작업 현황 브리핑

## 경로
- Skills: `.agents/skills/` (AgentSkills 표준, lazy-load)
- Specs: `.sdd/specs/TIMESTAMP-feature/`
- Steering: `.sdd/steering/` (`/sdd:steering`이 생성)
- Lessons: `.sdd/lessons/`
- Logs: `.sdd/logs/`

## 핵심 규칙
- 스티어링은 What-only (사실·결정만, 코드 예시 없음)
- 스킬은 필요할 때만 읽기 (progressive disclosure)
- 전체 워크플로우: `.agents/skills/sdd-workflow/SKILL.md`
