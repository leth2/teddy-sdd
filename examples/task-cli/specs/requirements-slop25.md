# 요구사항: task-cli (Slop≈25)

## 개요
로컬 CLI TODO 관리 도구. SQLite 기반.

## 요구사항

**REQ-001** 사용자는 `task add "<title>"` 명령으로 태스크를 추가할 수 있다.
- title은 필수이며 최대 200자이다.
- 성공 시 task ID를 stdout에 출력하고 exit 0.
- AC1: 유효한 제목 → stdout에 `Added task #<id>`, exit 0
- AC2: 빈 제목 → stderr에 오류 메시지, exit 1

**REQ-002** 사용자는 `task list` 명령으로 태스크 목록을 조회할 수 있다.
- `--tag <tag>` 플래그로 필터링 가능.
- `--status <status>` 플래그로 상태 필터링 가능.
- AC1: 태스크 존재 → `#<id> [<status>] <title>` 형식 출력
- AC2: 태스크 없음 → `No tasks` 출력

**REQ-003** 사용자는 `task done <id>` 명령으로 태스크를 완료 처리할 수 있다.
- 이미 완료된 태스크에 대해 오류를 반환한다.
- AC1: 성공 → `Task #<id> marked as done`, exit 0
- AC2: 존재하지 않는 ID → stderr에 오류, exit 1

**REQ-004** 사용자는 `task delete <id>` 명령으로 태스크를 삭제할 수 있다.
- AC1: 성공 → `Deleted task #<id>`, exit 0
- AC2: 존재하지 않는 ID → stderr에 오류, exit 1

**REQ-005** 사용자는 `task show <id>` 명령으로 태스크 상세 정보를 볼 수 있다.
- AC1: 성공 → 태스크 상세 출력, exit 0
- AC2: 존재하지 않는 ID → stderr에 오류, exit 1

**REQ-006** 알 수 없는 서브커맨드는 오류를 반환한다.

## 제약 조건

- DB 경로: `TASK_DB` 환경변수 또는 `~/.task-cli.db`
- 태그 최대 10개.
