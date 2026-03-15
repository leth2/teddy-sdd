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

## 모드 감지

| 상황 | 모드 | 동작 |
|------|------|------|
| `.sdd/steering/` 비어있음 | **Bootstrap** | 코드베이스 분석 → 스티어링 생성 |
| 파일 있음, `--intent` 없음 | **Sync** | 드리프트 감지 및 정렬 확인 |
| `--intent "<새 방향>"` 있음 | **Rewrite** | 새 방향 중심으로 재작성 |

## What-Only 수락 기준

### ✅ 허용 (What)
- "인증은 JWT, 만료 7일"
- "데이터베이스는 PostgreSQL 15"
- "feature-first 폴더 구조"
- "API 응답은 표준 JSend 형식"
- "테스트는 Vitest, 커버리지 80% 목표"

### ❌ 거부 (How)
- 코드 블록 (어떤 언어든, 어떤 크기든)
- 구현 단계 ("먼저 X를 하고, 그 다음 Y를...")
- 함수 시그니처 (설계 문서에서 다룸)
- 의사코드
- How-to 가이드

## 파일 크기 규칙

- 각 파일 ≤100줄
- 100줄 넘으면 `/sdd:steering-trim` 실행
- 핵심만 스티어링에, 상세는 스킬로

## Sync 모드 주의사항

⚠️ **스티어링을 코드에 맞춰 자동 업데이트하지 않음**

드리프트 발견 시:
- 코드 ≠ 스펙 → "코드 수정 필요" 보고
- 스펙 ≠ 스티어링 → "스펙 또는 스티어링 검토 필요" 보고
- 의식적 방향 전환이 있었을 때만 스티어링 업데이트

## 위반 항목 처리

스티어링에 위반 항목 발견 시:
1. 해당 항목 제거
2. What-only 요약으로 대체
3. 상세 내용이 필요하면 `.sdd/skills/<topic>-detail.md`로 이동

## 진실의 계층 및 상세 가이드

→ `references/truth-hierarchy.md` 참조
