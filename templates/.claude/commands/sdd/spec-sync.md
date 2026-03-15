---
description: SDD 삼각형 동기화 확인. 스펙/테스트/코드 세 꼭짓점이 일치하는지 점검. 장기 프로젝트에서 드리프트(이탈) 감지.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, LS
argument-hint: <feature-name>
---

Read `.agents/skills/sdd-validate/SKILL.md` and then perform a triangle sync check.

Feature: `$ARGUMENTS`

## SDD 삼각형 동기화 체크

세 꼭짓점이 서로 일치하는지 확인:

### 1. 스펙 ↔ 테스트 동기화
- requirements.md의 모든 AC(수락 기준)에 대응하는 테스트가 있는가?
- 테스트가 없는 AC → ⚠️ 테스트 누락
- AC에 없는 테스트 → ⚠️ 스펙에 반영 안 된 동작

### 2. 스펙 ↔ 코드 동기화
- design.md의 모든 인터페이스가 코드에 구현됐는가?
- 코드에 있는데 design.md에 없는 인터페이스 → ⚠️ 스펙 이탈
- design.md에 있는데 코드에 없는 인터페이스 → ⚠️ 미구현

### 3. 외부 스펙 동기화
- references/에 저장된 외부 스펙이 최신인가?
- 외부 API/프로토콜을 사용하는데 references/가 없는가? → ⚠️ 외부 스펙 누락

### 결과 출력 형식
```
## SDD 삼각형 동기화 결과 — [FEATURE]

### ✅ 동기화됨
- [항목]

### ⚠️ 이탈 감지 (수정 권장)
- [항목]: [어떤 꼭짓점이 어긋났는지]

### ❌ 심각한 이탈 (수정 필수)
- [항목]: [구체적 불일치 내용]

### 권장 조치
1. [우선순위 순으로]
```
