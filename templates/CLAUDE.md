# SDD — 스펙 기반 개발

## 커맨드
- `/sdd:spec-plan <설명>` — 풀 플랜 자동 생성 (req+design+tasks)
- `/sdd:spec-auto <설명>` — 완전 자동 구현 (overnight용)
- `/sdd:spec-impl <feature> [task]` — 특정 태스크 구현
- `/sdd:spec-capture "<제목>" [--category <cat>]` — 버그/lesson 기록
- `/sdd:spec-lessons [--category <cat>]` — 기록된 lessons 조회
- `/sdd:spec-search <keyword>` — 키워드로 lesson 검색
- `/sdd:spec-reset [feature]` — 스펙 초기화/아카이브
- `/sdd:spec-status` — 전체 진행 상황
- `/sdd:steering` — 스티어링 생성/업데이트
- `/sdd:steering-trim` — 긴 스티어링을 스킬로 분리

## 경로
- Specs: `.sdd/specs/<feature>/`
- Steering: `.sdd/steering/` (product, tech, structure 각각 SKILL.md)
- Skills: `.sdd/skills/` (AgentSkills 형식, lazy-load)
- Logs: `.sdd/logs/` (자동화 진행 기록)
- Archive: `.sdd/archive/` (리셋된 스펙)
- Briefings: `.sdd/briefings/` (브리핑 문서)

## 핵심 규칙
- 스티어링은 "무엇이 있는가"만 기술, 코드 예시 없음
- 스킬 파일은 필요할 때만 읽기 (progressive disclosure)
- 자동 실행 시 `.sdd/logs/YYYY-MM-DD.md`에 진행 상황 기록
- 큰 변경 전 반드시 `/sdd:spec-reset`으로 아카이브
- 전체 워크플로우: read `.sdd/skills/sdd-workflow/SKILL.md`
