---
name: sdd-lazy-load
description: 대용량 requirements.md 섹션별 로드 유틸리티. 파일이 크면 전체 로드 대신 INDEX 먼저 읽고 필요한 섹션만 로드. sdd-impl, sdd-delta, sdd-update에서 참조.
allowed-tools: Bash Read Grep LS
---

# 대용량 요구사항 Lazy Loading

## 언제 사용하나

requirements.md가 **100줄 이상**이면 전체 로드 대신 섹션별 로드:

```bash
wc -l .sdd/specs/$FEATURE/requirements.md
# 100줄 미만 → 전체 로드 (일반 방식)
# 100줄 이상 → Lazy Loading 적용
```

## requirements.md 섹션 구조

대용량 스펙은 아래 구조를 따른다 (spec-requirements가 생성):

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

```bash
# INDEX 섹션만 추출 (## INDEX ~ ## 개요 사이)
sed -n '/^## INDEX/,/^## [^I]/p' requirements.md | head -20
```

### 2단계: 관련 섹션 판단

현재 작업(태스크/요구사항)과 관련된 섹션만 선택:
- 태스크에 REQ ID가 명시된 경우 → 해당 REQ 범위 섹션만 로드
- 키워드 기반인 경우 → INDEX 요약에서 관련 섹션 판단

### 3단계: 해당 섹션만 로드

```bash
# 특정 섹션 추출 (예: "### 1. 사용자 인증" 부터 다음 "###" 전까지)
sed -n '/^### 1\. 사용자 인증/,/^### [^1]/p' requirements.md
```

또는 줄 번호로 직접:
```bash
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

| 파일 크기 | 전략 |
|----------|------|
| < 100줄 | 전체 로드 (일반 방식) |
| 100~300줄 | INDEX 먼저 → 관련 섹션 로드 |
| 300줄 초과 | INDEX 먼저 → 필요한 REQ ID만 grep 추출 |

## 다른 스킬에서 사용하는 방법

`sdd-impl`, `sdd-delta`, `sdd-update`에서 requirements.md 로드 전:

```
1. wc -l requirements.md 확인
2. 100줄 초과 → .agents/skills/sdd-lazy-load/SKILL.md 읽고 INDEX 방식 적용
3. 100줄 이하 → 전체 로드
```
