---
name: sdd-decompose
description: Epic(큰 목표)을 Feature→Story 계층으로 분해. 각 Feature에 스펙 폴더 자동 생성. 엔터프라이즈 규모의 큰 기능을 관리 가능한 단위로 쪼갬. spec-decompose 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Glob Grep LS
---

# Epic → Feature → Story 분해

## 계층 구조

```
Epic (큰 목표 — spec-decompose 입력)
└── Feature (기능 단위 — 스펙 폴더 1개)
    └── Story (사용자 스토리 — requirements.md 항목)
        └── AC (수락 기준 — 기존 EARS 형식)
```

**현재 도구와의 연결:**
- Feature = 기존 스펙 폴더 (`.sdd/specs/TIMESTAMP-feature/`)
- Story = requirements.md의 요구사항 항목 (REQ-NNN + EARS 형식)
- AC = 기존 수락 기준

## 실행 흐름

### Step 1: Epic 파악

`$EPIC` 인자로 Epic 설명 수신.
Epic이 없거나 불명확하면:
```
어떤 큰 기능을 만들 건가요?
예: "사용자 관리 시스템", "결제 흐름", "알림 플랫폼"
```

### Step 2: Feature 도출

Epic을 분석해 **Feature 3~7개** 도출.
각 Feature는:
- 독립적으로 개발/테스트 가능한 단위
- 다른 Feature 없이도 가치 제공
- 이름: 간결한 명사구 (인증, 권한 관리, 프로필...)

**도출 결과 사용자 확인 요청:**
```
📋 Feature 분해 결과:
  1. user-auth        — 로그인/회원가입/JWT 인증
  2. user-permissions — 역할 기반 접근 제어 (RBAC)
  3. user-profile     — 프로필 조회/수정
  4. user-sessions    — 세션 관리/로그아웃

추가/제거/이름 변경하려면 알려주세요.
진행하려면 OK 입력:
```

### Step 3: 각 Feature에 Story 작성

사용자 OK 후, 각 Feature별로 Story 목록 작성:

```
Feature: user-auth
  Story 1 (REQ-XXX): 사용자가 이메일/비밀번호로 로그인할 수 있다.
  Story 2 (REQ-XXX): 사용자가 회원가입할 수 있다.
  Story 3 (REQ-XXX): 로그인 실패 시 에러 메시지를 받는다.
```

**REQ ID 부여:**
- `.sdd/req-counter.json` 읽기
- 전체 Feature의 Story를 순서대로 번호 부여
- 완료 후 카운터 업데이트

### Step 4: 스펙 폴더 생성

각 Feature별로:
```bash
TIMESTAMP=$(date -u +%s)
mkdir -p .sdd/specs/${TIMESTAMP}-${FEATURE_SLUG}/
```

생성 파일:
1. `spec.json` — 기본 메타데이터
2. `requirements.md` — Stories를 EARS 형식 요구사항으로 변환 (REQ ID 포함)

**requirements.md 구조 (자동 생성):**
```markdown
# 요구사항: [Feature 이름]

## 개요
[Epic 컨텍스트에서 이 Feature의 역할]

## 요구사항

### 1. [Story 그룹]

**1.1** `REQ-001` [EARS 형식 Story]
- AC1: [수락 기준]

### 2. [다음 Story 그룹]
...
```

### Step 5: Epic 개요 파일 생성

`.sdd/specs/epic-[epic-slug]/epic.md`:
```markdown
# Epic: [Epic 이름]

## 목표
[Epic이 해결하는 문제]

## Feature 목록

| Feature | 스펙 폴더 | 상태 |
|---------|----------|------|
| user-auth | TIMESTAMP-user-auth/ | 📋 스펙 작성됨 |
| user-permissions | TIMESTAMP-user-permissions/ | 📋 스펙 작성됨 |
...

## 개발 순서 (권장)
[Feature 간 의존성 기반 순서 제안]
```

### Step 6: 완료 안내

```
✅ Epic 분해 완료!

생성된 스펙 폴더:
  .sdd/specs/1234567890-user-auth/
  .sdd/specs/1234567891-user-permissions/
  .sdd/specs/1234567892-user-profile/
  .sdd/specs/1234567893-user-sessions/

다음 단계:
  각 Feature를 순서대로 구현하세요:
  → /sdd:spec-design user-auth
  → /sdd:spec-plan user-auth
  → /sdd:spec-tasks user-auth
  → /sdd:spec-impl user-auth
```

## 규칙

- Feature는 3개 미만이면 Epic이 너무 작음 → 직접 spec-requirements 사용 권장
- Feature는 8개 초과면 Epic이 너무 큼 → 중간 Epic으로 재분해 권장
- Story는 Feature당 2~8개 (너무 많으면 Feature 분리)
- 자동 생성된 requirements.md는 초안 — `/sdd:spec-req`로 보완 가능
