# 요구사항: todo-api (Slop≈25)

## 개요
인증된 사용자가 TODO 항목을 생성·조회·수정·삭제하고 태그로 분류할 수 있는 REST API.

## 요구사항

### 1. 인증

**REQ-001** 사용자는 이메일과 비밀번호로 POST /auth/login을 통해 로그인한다.
- 비밀번호는 MUST bcrypt(cost=12)로 해싱하여 저장한다.
- JWT 토큰은 MUST 7일 후 만료된다.
- AC1: 유효한 자격증명 → HTTP 200 + `{ token, expires_at }`
- AC2: 잘못된 자격증명 → HTTP 401

**REQ-002** 인증이 필요한 API에 토큰 없이 접근하면 HTTP 401을 반환한다.

### 2. TODO 관리

**REQ-003** 인증된 사용자는 TODO를 생성할 수 있다.
- title은 필수이며 최대 200자이다.
- AC1: 유효한 요청 → HTTP 201
- AC2: title 없음 → HTTP 400
- AC3: title 200자 초과 → HTTP 400

**REQ-004** 인증된 사용자는 자신의 TODO 목록을 조회할 수 있다.
- 다른 사용자의 TODO는 포함하지 않는다.
- ?tag=값으로 필터링 가능. ?page, ?limit으로 페이지네이션 (기본 page=1, limit=20).

**REQ-005** 인증된 사용자는 자신의 TODO를 수정할 수 있다.
- 다른 사용자의 TODO 수정 시도 → HTTP 403.
- 존재하지 않는 TODO → HTTP 404.

**REQ-006** 인증된 사용자는 자신의 TODO를 삭제할 수 있다.
- 성공 시 HTTP 204를 반환한다.
- 다른 사용자 TODO 또는 존재하지 않는 TODO → 적절한 에러 코드 반환.

### 3. 태그

**REQ-007** TODO에 태그를 최대 10개까지 붙일 수 있다.
- 10개 초과 → HTTP 400.

**REQ-008** 태그로 TODO를 필터링할 수 있다.
