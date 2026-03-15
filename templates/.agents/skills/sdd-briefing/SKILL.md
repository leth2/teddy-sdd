---
name: sdd-briefing
description: 작업 현황 브리핑 생성. 완료/중단/다음액션 분석, 브리핑 문서 저장. 아침에 overnight 작업 확인할 때 사용.
allowed-tools: Bash Read Write Glob LS
---

# 작업 현황 브리핑

## 단계

### 1. 데이터 수집

- `.sdd/specs/` 전체 스캔 (활성 스펙)
- `.sdd/logs/` 최근 로그 파일 읽기 (`--since N` 기준, 기본 12시간)
- `.sdd/archive/` 최근 아카이브 확인
- 각 스펙의 `spec.json`, `tasks.md` 읽기

### 2. 상황 분석

**완료된 작업**:
- `[x]` 체크된 태스크 목록
- 로그에서 ✅ 항목 추출
- 완료된 스펙 단계 (requirements/design/tasks/impl)

**중단된 작업**:
- 로그에서 ⚠️, ❌ 항목 추출
- 중단 이유 파악

**다음 할 일**:
- 이어서 진행하려면 어떤 커맨드를 실행해야 하는지
- 우선순위 순으로 정렬

### 3. 브리핑 문서 생성

파일 경로: `.sdd/briefings/TIMESTAMP-briefing.md`
(TIMESTAMP = UTC Unix epoch: `date -u +%s`)

## 브리핑 없는 경우

활성 스펙도 없고 로그도 없으면:
"아직 진행 중인 작업이 없습니다. `/sdd:spec-plan <설명>`으로 시작하세요."

## 브리핑 문서 형식

→ `references/report-format.md` 참조
