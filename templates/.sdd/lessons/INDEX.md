# Lessons INDEX

> `spec-capture` 로 추가 | `spec-search <keyword>` 로 검색 | 횟수 = 재발 위험도

| ID  | 카테고리 | 제목 | 키워드 | 횟수 |
|-----|---------|------|--------|------|
| D01 | docker-node | npm ci --only=production → tsc 없음 | npm, tsc, Dockerfile, build, typescript | 2 |
| D02 | docker-node | package-lock.json 누락 → npm ci 실패 | npm ci, lock, git, package | 2 |
| D03 | docker-node | 환경변수 이름 불일치 (API key) | env, ANTHROPIC, docker-compose, key | 1 |
| D04 | docker-node | UI Dockerfile 없음 → build 실패 | dockerfile, ui, build, volume | 1 |
| A01 | acp-protocol | npx spawn stdin pipe 미전달 | spawn, npx, stdio, socket, pipe, stdin | 2 |
| A02 | acp-protocol | session/new 필수 파라미터 누락 (cwd) | session, cwd, params, ACP, Invalid | 1 |
| A03 | acp-protocol | SSE 레이스 컨디션 — agent-ready 재전송 | SSE, race, ready, EventSource, 타이밍 | 1 |
| A04 | acp-protocol | 패키지명 vs 바이너리명 혼동 | npx, binary, 패키지명, not found | 2 |
| T01 | testing | Pi 환경 타임아웃 기본값 너무 짧음 | timeout, Pi, slow, 10s, TIMEOUT_MS | 2 |
| T02 | testing | HTTP/WebSocket 프로토콜 URL 혼동 | ws://, http://, WebSocket, fetch, 426 | 1 |
| T03 | testing | test-queue contains 실제 출력과 불일치 | contains, expect, 출력, 불일치 | 1 |
| T04 | testing | 서버 엔드포인트 가정 금지 | 라우트, endpoint, 404, /start | 1 |

> ⚠️ 횟수 2+ = 재발 가능성 높음 — 구현 시 우선 체크
