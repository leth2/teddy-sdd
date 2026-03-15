# EARS 형식 상세 가이드

## EARS (Easy Approach to Requirements Syntax)

### 기본 패턴

| 패턴 | 형식 | 사용 시기 |
|------|------|-----------|
| 기본 | `The <system> shall <response>` | 일반 기능 |
| 조건부 | `When <precondition>, the <system> shall <response>` | 상태 의존 동작 |
| 이벤트 | `When <trigger>, the <system> shall <response>` | 이벤트 기반 동작 |
| 기능 포함 | `Where <feature is included>, the <system> shall <response>` | 선택적 기능 |
| 복합 | `While <state>, when <trigger>, the <system> shall <response>` | 복잡한 조건 |

### 예시

**기본:**
- The system shall display user profile information.
- The system shall process payment within 5 seconds.

**조건부:**
- When the user is not authenticated, the system shall redirect to the login page.
- When the cart is empty, the system shall disable the checkout button.

**이벤트:**
- When the user submits the form, the system shall validate all required fields.
- When payment fails, the system shall notify the user with an error message.

**기능 포함:**
- Where multi-language support is enabled, the system shall display content in the user's preferred language.

## 나쁜 요구사항 vs 좋은 요구사항

### 모호함 → 구체적
- ❌ "시스템은 빠르게 응답해야 한다"
- ✅ "The system shall respond within 200ms for 95% of requests"

### 구현 특정 → 기능적
- ❌ "MySQL을 사용해야 한다" (설계 문서에서 다룸)
- ✅ "The system shall persist user data durably across sessions"

### 테스트 불가 → 테스트 가능
- ❌ "사용자가 만족해야 한다"
- ✅ "When the user completes onboarding, the system shall show a success confirmation"

### 복합 → 단일 관심사
- ❌ "사용자는 로그인하고 프로필을 볼 수 있다"
- ✅ "The system shall authenticate users with email and password" + "The system shall display the authenticated user's profile"

## 수락 기준 작성 원칙

- **Gherkin 스타일 권장**: Given-When-Then 흐름으로 작성
- **엣지 케이스 포함**: 정상 케이스만 아닌 경계값, 오류 케이스도
- **수치 명확화**: "빠르게" → "200ms 이내", "많은" → "1000개 이상"

### 수락 기준 예시

```
**1.1** When the user submits invalid credentials, the system shall display an error message.
- AC1: 잘못된 이메일 형식 입력 시 "유효하지 않은 이메일" 메시지 표시
- AC2: 올바른 이메일 + 잘못된 비밀번호 시 "비밀번호가 올바르지 않습니다" 메시지 표시
- AC3: 5회 연속 실패 시 계정 잠금 메시지 표시
- AC4: 오류 메시지는 3초 이내에 표시됨
```

## 금지 사항

- 요구사항 문서에 코드 예시 절대 포함하지 않음
- 기술 스택 참조 최소화 (어쩔 수 없는 경우만 — 예: "OAuth 2.0 지원")
- 구현 방법 서술 금지 ("JWT를 사용하여" → 설계에서 다룸)
