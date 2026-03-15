---
name: sdd-workflow
description: SDD (Spec-Driven Development) 전체 워크플로우 가이드. 처음 시작할 때, 어떤 커맨드를 써야 할지 모를 때, 전체 흐름을 파악할 때 로드.
compatibility: Claude Code
---

# SDD 워크플로우 가이드

SDD(Spec-Driven Development)는 **스티어링 → 스펙 → 코드** 계층으로 작동한다.
진실의 출처는 항상 상위 계층. 코드는 결과물이지 진실이 아니다.

## 언제 어떤 커맨드를 쓰는가

### 처음 시작할 때
1. `/sdd:steering` — 프로젝트 방향 정의 (Bootstrap 모드)
2. `/sdd:spec-plan <설명>` — 요구사항 + 설계 + 태스크 자동 생성
3. `/sdd:spec-impl <feature>` — TDD 구현 (@impl 태그 자동 생성 포함)

### 스펙 수정 후 코드 영향 파악할 때
- `/sdd:spec-delta <feature>` — 변경된 스펙 문장 → 수정 필요한 코드 위치 출력
- `@impl` 태그로 스펙 문장과 코드가 1:1 매핑됨 (spec-impl이 자동 생성)

### 빠르게 overnight 실행할 때
- `/sdd:spec-auto <설명>` — 스펙 생성부터 구현까지 완전 자동화

### 작업 중 개별 단계를 실행할 때
- `[선택] /sdd:spec-research <feature>` — 스펙 전 리서치 (외부 프로토콜/API 있을 때 권장)
- `/sdd:spec-requirements <feature>` — 요구사항만 생성
- `/sdd:spec-design <feature>` — 설계만 생성
- `/sdd:spec-tasks <feature>` — 태스크만 생성

### 상태 확인 및 관리
- `/sdd:spec-status` — 전체 진행 상황
- `/sdd:briefing` — overnight 작업 후 브리핑
- `/sdd:spec-reset [feature]` — 아카이브 및 재시작
- `/sdd:steering-trim` — 긴 스티어링 파일 압축

## 핵심 원칙

- **스티어링 우선**: 방향이 맞지 않으면 코드보다 스펙을, 스펙보다 스티어링을 믿어라
- **Lazy Load**: 스킬 파일은 필요할 때만 읽는다
- **What-Only 스티어링**: 스티어링에 코드 예시나 How-to 없음
- **TDD**: 모든 구현은 Red-Green-Refactor 사이클로

## 경로 맵

| 경로 | 용도 |
|------|------|
| `.sdd/steering/` | 프로젝트 방향 (product, tech, structure) |
| `.sdd/specs/<feature>/` | 각 feature의 스펙 파일들 |
| `.agents/skills/` | AI가 lazy-load하는 방법론 파일 |
| `.sdd/logs/` | 자동화 실행 로그 |
| `.sdd/archive/` | 리셋된 스펙 아카이브 |
| `.sdd/briefings/` | 브리핑 문서 |

## 상세 참조

- 진실의 계층 및 드리프트 처리: `references/hierarchy.md`
- 모든 커맨드 설명 및 예시: `references/command-reference.md`

## 스펙 초기화 메타데이터 스키마

→ `references/spec-init.json` 참조
