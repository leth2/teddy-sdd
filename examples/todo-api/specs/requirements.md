# 요구사항: todo-api

## 개요
인증된 사용자가 TODO 항목을 생성·조회·수정·삭제하고 태그로 분류할 수 있는 REST API.

## 요구사항

### 1. 인증

**1.1** `REQ-001` When 사용자가 이메일과 비밀번호로 로그인 요청을 하면,
시스템은 MUST 유효한 자격증명인 경우 JWT 액세스 토큰(만료: 7일)을 반환한다.
- AC1: 유효한 이메일+비밀번호 → HTTP 200 + `{ token: string, expiresAt: ISO8601 }`
- AC2: 잘못된 비밀번호 → HTTP 401 + `{ error: "INVALID_CREDENTIALS" }`
- AC3: 존재하지 않는 이메일 → HTTP 401 + `{ error: "INVALID_CREDENTIALS" }` (이메일 존재 여부 노출 금지)

**1.2** `REQ-002` When 인증이 필요한 API에 토큰 없이 요청하면,
시스템은 MUST HTTP 401을 반환하고 요청을 처리하지 않는다.
- AC1: Authorization 헤더 없음 → HTTP 401
- AC2: 만료된 토큰 → HTTP 401 + `{ error: "TOKEN_EXPIRED" }`
- AC3: 유효하지 않은 토큰 형식 → HTTP 401 + `{ error: "INVALID_TOKEN" }`

**1.3** `REQ-003` 비밀번호는 MUST bcrypt(cost=12)로 해싱하여 저장한다.
- AC1: DB에 평문 비밀번호가 저장되지 않음 (bcrypt 해시 형식 확인)
- AC2: 로그인 시 bcrypt.compare로 검증

### 2. TODO 관리

**2.1** `REQ-004` When 인증된 사용자가 TODO 생성을 요청하면,
시스템은 MUST 요청 본문을 검증하고 유효하면 TODO를 저장한다.
- AC1: `{ title: string(1~200자), description?: string(최대 2000자) }` → HTTP 201 + `{ id, title, description, createdAt }`
- AC2: title 없음 → HTTP 400 + `{ error: "TITLE_REQUIRED" }`
- AC3: title 200자 초과 → HTTP 400 + `{ error: "TITLE_TOO_LONG" }`
- AC4: 생성된 TODO는 해당 사용자에게만 귀속됨 (다른 사용자 접근 불가)

**2.2** `REQ-005` When 인증된 사용자가 TODO 목록을 요청하면,
시스템은 MUST 해당 사용자의 TODO만 반환한다.
- AC1: 기본 응답: `{ items: Todo[], total: number, page: number, limit: number }`
- AC2: `?tag=string` 쿼리로 태그 필터링 가능
- AC3: `?page=N&limit=N` 페이지네이션 (기본: page=1, limit=20)
- AC4: 다른 사용자의 TODO가 포함되지 않음

**2.3** `REQ-006` When 인증된 사용자가 자신의 TODO를 수정 요청하면,
시스템은 MUST 변경사항을 저장하고 수정된 TODO를 반환한다.
- AC1: 부분 수정(PATCH) 지원 — 전달한 필드만 변경
- AC2: 존재하지 않는 TODO → HTTP 404 + `{ error: "TODO_NOT_FOUND" }`
- AC3: 다른 사용자의 TODO 수정 시도 → HTTP 403 + `{ error: "FORBIDDEN" }`

**2.4** `REQ-007` When 인증된 사용자가 자신의 TODO 삭제를 요청하면,
시스템은 MUST 해당 TODO를 삭제하고 HTTP 204를 반환한다.
- AC1: 삭제 성공 → HTTP 204 (응답 본문 없음)
- AC2: 존재하지 않는 TODO → HTTP 404
- AC3: 다른 사용자의 TODO 삭제 시도 → HTTP 403

### 3. 태그

**3.1** `REQ-008` When 사용자가 TODO 생성/수정 시 tags 배열을 포함하면,
시스템은 MUST 태그를 TODO에 연결하여 저장한다.
- AC1: `tags: string[]` (각 태그 최대 50자, 최대 10개)
- AC2: 태그 개수 초과 → HTTP 400 + `{ error: "TOO_MANY_TAGS" }`
- AC3: 태그 길이 초과 → HTTP 400 + `{ error: "TAG_TOO_LONG" }`

**3.2** `REQ-009` 사용자는 MUST 태그로 TODO를 필터링할 수 있다.
- AC1: `GET /todos?tag=work` → 해당 태그가 붙은 TODO만 반환
- AC2: 존재하지 않는 태그로 필터링 → 빈 목록 반환 (404 아님)

## 제약 조건

- 시스템은 MUST 모든 API 응답을 500ms 이내에 반환한다 (p95 기준)
- 시스템은 MUST SQL Injection 방지를 위해 parameterized query를 사용한다
- 비밀번호는 MUST 어떤 로그에도 평문으로 기록되지 않는다

## 범위 외
- 알림 기능
- 팀 공유 기능
- OAuth 소셜 로그인
