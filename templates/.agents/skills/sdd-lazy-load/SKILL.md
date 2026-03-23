---
name: sdd-lazy-load
description: 대용량 requirements.md 섹션별 로드 유틸리티. 파일이 크면 전체 로드 대신 INDEX 먼저 읽고 필요한 섹션만 로드. sdd-impl, sdd-delta, sdd-update에서 참조.
allowed-tools: Bash Read Grep LS
---

# 대용량 요구사항 Lazy Loading

## 언제 사용하나

requirements.md가 **100줄 이상**이면 전체 로드 대신 섹션별 로드.

이유: 100줄 미만이면 전체 로드가 더 단순하다. 줄 수 먼저 확인 후 전략을 선택해야 한다

**예시: 파일 크기 확인 → 전략 결정**
```bash
# 이유: 로드 전략 결정의 기준이 되는 줄 수를 먼저 확인
wc -l .sdd/specs/$FEATURE/requirements.md
# 100줄 미만 → 전체 로드 (일반 방식)
# 100줄 이상 → Lazy Loading 적용
```

## requirements.md 섹션 구조

대용량 스펙은 아래 구조를 따른다 (spec-requirements가 생성):

**예시: INDEX 포함 대용량 requirements.md 구조**
```markdown
# 요구사항: [Feature 이름]

## INDEX
<!-- sdd-lazy-load: 이 섹션을 먼저 읽고 필요한 섹션만 로드하세요 -->

| 섹션 | 줄 번호 | REQ 범위 | 요약 |
|------|---------|---------|------|
| 1. 사용자 인증 | L15~L60 | REQ-001~005 | 로그인, 회원가입, JWT |
| 2. 권한 관리 | L61~L110 | REQ-006~012 | RBAC, 역할 부여 |
| 3. 세션 관리 | L111~L150 | REQ-013~018 | 토큰 갱신, 로그아웃 |

## 개요
[Feature 설명]

## 요구사항

### 1. 사용자 인증
[REQ-001~005 내용]

### 2. 권한 관리
[REQ-006~012 내용]
...
```

## Lazy Load 절차

### 1단계: INDEX만 읽기

이유: 파일 전체를 로드하지 않고 목차만 파악해야 토큰 비용을 최소화할 수 있다

**예시: INDEX 섹션 추출**
```bash
# 이유: INDEX 섹션만 잘라서 읽기 — sed 범위 패턴으로 ## 개요 직전까지만 추출
sed -n '/^## INDEX/,/^## [^I]/p' requirements.md | head -20
```

### 2단계: 관련 섹션 판단

현재 작업(태스크/요구사항)과 관련된 섹션만 선택:
- 태스크에 REQ ID가 명시된 경우 → 해당 REQ 범위 섹션만 로드
- 키워드 기반인 경우 → INDEX 요약에서 관련 섹션 판단

### 3단계: 해당 섹션만 로드

이유: 섹션 이름 패턴 매칭으로 필요한 범위만 추출한다. INDEX 테이블에 줄 번호가 있으면 직접 지정이 더 정확하다

**예시: 섹션 이름 기반 추출**
```bash
# 이유: "### N." 헤더부터 다음 "###" 헤더 전까지를 해당 섹션 범위로 간주
sed -n '/^### 1\. 사용자 인증/,/^### [^1]/p' requirements.md
```

**예시: 줄 번호 직접 지정**
```bash
# 이유: INDEX 테이블의 L15~L60 정보를 활용하면 패턴 매칭보다 확실하게 범위 지정 가능
sed -n '15,60p' requirements.md
```

## requirements.md에 INDEX 생성

`spec-requirements` 실행 시 파일이 예상 100줄 초과일 때 INDEX 섹션 자동 생성:
→ `sdd-requirements/SKILL.md` 참조

기존 파일에 INDEX 추가:
```
/sdd:spec-index <feature>
```
→ requirements.md 분석 → INDEX 섹션 자동 삽입

## 로드 전략 요약

| 파일 크기 | 전략 | 이유 |
|----------|------|------|
| < 100줄 | 전체 로드 (일반 방식) | 토큰 비용 < 로드 복잡도 |
| 100~300줄 | INDEX 먼저 → 관련 섹션 로드 | 필요 섹션만 읽어 토큰 절약 |
| 300줄 초과 | INDEX 먼저 → 필요한 REQ ID만 grep 추출 | 전체 로드 시 컨텍스트 초과 위험 |

## 다른 스킬에서 사용하는 방법

이유: 이 스킬은 독립 실행이 아니라 다른 스킬에서 참조(인라인 호출)하는 방식으로 사용된다

**예시: sdd-impl/sdd-delta/sdd-update에서의 호출 순서**
```
1. wc -l requirements.md 확인  — 이유: 로드 전략 결정 기준
2. 100줄 초과 → .agents/skills/sdd-lazy-load/SKILL.md 읽고 INDEX 방식 적용
3. 100줄 이하 → 전체 로드  — 이유: 별도 절차 없이 Read 도구로 바로 읽기
```
