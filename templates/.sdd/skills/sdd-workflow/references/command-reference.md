# SDD 커맨드 레퍼런스

## 스펙 생성 커맨드

### `/sdd:spec-init <설명>`
새 feature 스펙 폴더를 초기화.
- UTC Unix 타임스탬프 기반 폴더명: `TIMESTAMP-feature-name`
- `spec.json`, `requirements.md` 생성
- 예: `/sdd:spec-init 사용자 인증 기능`

### `/sdd:spec-plan <설명> [--interactive]`
요구사항 → 설계 → 태스크를 한 번에 자동 생성.
- 기본: 각 단계 자동 승인하고 계속
- `--interactive`: 각 단계마다 승인 요청
- 예: `/sdd:spec-plan 알림 시스템 구현`

### `/sdd:spec-auto <설명>`
스펙 생성부터 TDD 구현까지 완전 자동화. Overnight 실행용.
- 로그: `.sdd/logs/YYYY-MM-DD.md`
- 오류 발생 시 로그 기록 후 계속 진행
- 예: `/sdd:spec-auto 대시보드 차트 컴포넌트`

### `/sdd:spec-requirements <feature>`
특정 feature의 `requirements.md` 생성.
- EARS 형식, What-only
- 스티어링 정렬 검증 포함
- 예: `/sdd:spec-requirements 1741834500-user-auth`

### `/sdd:spec-design <feature> [-y]`
`design.md` 생성. 아키텍처, 인터페이스 계약, Mermaid 다이어그램.
- `-y`: requirements 자동 승인 후 진행
- 예: `/sdd:spec-design 1741834500-user-auth -y`

### `/sdd:spec-tasks <feature> [-y]`
`tasks.md` 생성. TDD 구조, 병렬 태스크 표시.
- 모든 요구사항이 태스크와 매핑됐는지 검증
- 예: `/sdd:spec-tasks 1741834500-user-auth`

### `/sdd:spec-impl <feature> [task-numbers]`
TDD 구현. Red-Green-Refactor 사이클.
- task-numbers 없으면 미완료 태스크 순서대로
- 예: `/sdd:spec-impl 1741834500-user-auth 1.1`

## 관리 커맨드

### `/sdd:spec-status [feature]`
전체 또는 특정 feature의 진행 상황.
- 활성 스펙, 아카이브 모두 표시
- 타임스탬프를 로컬 시간으로 변환해서 표시

### `/sdd:spec-reset [feature] [--steering] [--skip-analysis]`
스펙 아카이브 및 재시작.
- 재사용 분석 먼저 (살릴 것 / 버릴 것)
- `--steering`: 스티어링도 아카이브
- `--skip-analysis`: 즉시 아카이브
- 예: `/sdd:spec-reset 1741834500-user-auth`

### `/sdd:briefing [--since <hours>]`
작업 현황 브리핑. Overnight 작업 후 아침에 실행.
- 기본: 최근 12시간
- 브리핑 파일: `.sdd/briefings/TIMESTAMP-briefing.md`

## 스티어링 커맨드

### `/sdd:steering [--intent "<새 방향>"]`
스티어링 생성/업데이트.
- 파일 없음 → Bootstrap 모드 (새 스티어링 생성)
- 파일 있음 → Sync 모드 (드리프트 감지)
- `--intent` → Rewrite 모드 (새 방향으로 재작성)

### `/sdd:steering-trim [file]`
100줄 넘는 스티어링을 스킬로 분리.
- 상세 내용을 `.sdd/skills/<topic>-detail.md`로 이동
- 스티어링에는 요약과 참조 링크만 유지
