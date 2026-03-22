# 설계: todo-api

## 기술 스택

- Runtime: Node.js 20 + TypeScript
- Framework: Express 4
- DB: SQLite (better-sqlite3)
- Auth: jsonwebtoken (HS256)
- Password: bcryptjs (cost=12)
- Validation: zod

## 아키텍처

```
src/
  app.ts          — Express 설정, 미들웨어
  server.ts       — 진입점
  routes/
    auth.ts       — POST /auth/login
    todos.ts      — GET/POST/PATCH/DELETE /todos
  middleware/
    auth.ts       — JWT 검증 미들웨어
  services/
    auth.ts       — 인증 비즈니스 로직
    todo.ts       — TODO 비즈니스 로직
  db/
    schema.ts     — DB 초기화, 테이블 생성
    users.ts      — User 쿼리
    todos.ts      — Todo 쿼리
  types/
    index.ts      — 공통 타입 정의
```

## 데이터 모델

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  todo_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
```

## 인터페이스 계약

### POST /auth/login

Given: `{ email: string, password: string }` 요청 본문
When: 유효한 자격증명
Then: `{ token: string, expires_at: string(ISO8601) }` + HTTP 200

When: 잘못된 자격증명 (이메일 없음 또는 비밀번호 불일치)
Then: `{ error: "invalid_credentials" }` + HTTP 401

### POST /todos

Precondition: Authorization 헤더에 유효한 Bearer 토큰
Given: `{ title: string, description?: string, tags?: string[] }` 요청 본문
When: 유효한 입력
Then: 생성된 TODO 객체 + HTTP 201
Postcondition: todos 테이블에 레코드 삽입됨, user_id = 요청자 ID

### GET /todos

Precondition: Authorization 헤더에 유효한 Bearer 토큰
Query: `?page=N&limit=N&tag=string` (선택)
Then: `{ items: Todo[], total: number, page: number, limit: number }` + HTTP 200
Invariant: 반환된 items는 모두 요청자 user_id 소유

### PATCH /todos/:id

Precondition: Authorization 헤더 + 해당 TODO의 소유자
Given: `{ title?: string, description?: string, tags?: string[] }` (부분 업데이트)
Then: 수정된 TODO 객체 + HTTP 200
Error: 존재하지 않음 → 404, 소유자 불일치 → 403

### DELETE /todos/:id

Precondition: Authorization 헤더 + 해당 TODO의 소유자
Then: HTTP 204 (본문 없음)
Error: 존재하지 않음 → 404, 소유자 불일치 → 403

## 에러 응답 형식 (Invariant)

모든 에러 응답은 MUST 다음 형식을 따른다:
```json
{ "error": "ERROR_CODE_SNAKE_CASE" }
```

## 설계 결정 (Why)

**SQLite 선택**: Phase B 검증용 미니 프로젝트 — 배포 복잡도 없이 빠른 사이클
**bcrypt cost=12**: REQ-003 명시값, 보안-성능 균형 (로그인 ~300ms)
**JWT 단순 구현**: 리프레시 토큰 미포함 — REQ 범위 외(requirements.md 명시)
**zod 검증**: 런타임 타입 안전성, 에러 메시지 구조화
