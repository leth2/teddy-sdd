# 태스크: todo-api

## 1. 프로젝트 초기화

- [ ] Node.js + TypeScript 프로젝트 설정 — package.json, tsconfig, jest 설정
- [ ] SQLite DB 초기화 — schema.ts, 테이블 생성 스크립트
- [ ] 기본 Express 앱 설정 — app.ts, server.ts, 에러 핸들러

시간 추정: ~1h

## 2. 인증 (REQ-001~003)

requires: 1번 완료

- [ ] POST /auth/login 구현 — bcrypt 검증, JWT 발급 — AC1~AC3 커버
- [ ] JWT 미들웨어 — Bearer 토큰 검증, 만료/형식 에러 분기 — AC1~AC3 커버
- [ ] 단위 테스트: auth.service.test.ts

시간 추정: ~1.5h

## 3. TODO CRUD (REQ-004~007)

requires: 2번 완료

- [ ] POST /todos — 입력 검증(zod), DB 저장 — REQ-004 AC1~AC4
- [ ] GET /todos — 페이지네이션, 소유자 필터 — REQ-005 AC1~AC4
- [ ] PATCH /todos/:id — 부분 수정, 403/404 분기 — REQ-006 AC1~AC3
- [ ] DELETE /todos/:id — 소유자 검증, 204 반환 — REQ-007 AC1~AC3
- [ ] 단위 테스트: todo.service.test.ts

시간 추정: ~2h

## 4. 태그 (REQ-008~009)

requires: 3번 완료

- [ ] 태그 저장/조회 로직 — tags 테이블 연동 — REQ-008 AC1~AC3
- [ ] GET /todos?tag= 필터 구현 — REQ-009 AC1~AC2
- [ ] 단위 테스트: tag.service.test.ts

시간 추정: ~1h

## 5. 통합 테스트 + Layer 검증

requires: 4번 완료 (병렬 실행 가능)

- [ ] Layer 1 단위 테스트 전체 실행 + 커버리지 확인
- [ ] Layer 2 계약 테스트 — Pre/Post/Invariant 검증
- [ ] Layer 3 RFC 2119 준수 — MUST 항목 전수 테스트 존재 확인
- [ ] Layer 4 통합 테스트 — EARS 기반 Given/When/Then 시나리오
- [ ] Slop Score 기록 + 재시도 횟수 기록 (Phase B 캘리브레이션 데이터)

시간 추정: ~1.5h
