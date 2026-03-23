# 요구사항: task-cli (Slop=0, 좋은 스펙)

## 개요
SQLite 기반 로컬 CLI TODO 관리 도구. 태스크 생성·조회·완료·삭제를 커맨드라인에서 수행한다.

## REQ-001: 태스크 추가

**REQ-001** The task-cli SHALL add a new task when the `add` subcommand is executed.

WHEN a user runs `task add "<title>"` with a valid title
  THEN the system SHALL store the task with `status=pending` and print the task ID to stdout
  THEN the system SHALL exit with code 0

IF title is empty or missing
  THEN the system SHALL print `ERROR: title required` to stderr
  THEN the system SHALL exit with code 1

IF title exceeds 200 characters
  THEN the system SHALL print `ERROR: title too long (max 200)` to stderr
  THEN the system SHALL exit with code 1

IF `--tag <tag>` flag is provided
  THEN the system SHALL associate the tag with the task (multiple `--tag` allowed)

- AC1: `task add "Buy milk"` → stdout: `Added task #1`, exit 0
- AC2: `task add ""` → stderr: `ERROR: title required`, exit 1
- AC3: `task add "$(python3 -c 'print("x"*201)')"` → stderr: `ERROR: title too long (max 200)`, exit 1
- AC4: `task add "Buy milk" --tag grocery` → task stored with tag `grocery`

## REQ-002: 태스크 목록 조회

**REQ-002** The task-cli SHALL list tasks when the `list` subcommand is executed.

WHEN a user runs `task list`
  THEN the system SHALL print all tasks to stdout in format: `#<id> [<status>] <title>`
  THEN the system SHALL exit with code 0

WHEN no tasks exist
  THEN the system SHALL print `No tasks` to stdout
  THEN the system SHALL exit with code 0

IF `--tag <tag>` flag is provided
  THEN the system SHALL print only tasks with that tag

IF `--status <status>` flag is provided (pending|done)
  THEN the system SHALL print only tasks matching that status

- AC1: tasks exist → `#1 [pending] Buy milk`
- AC2: no tasks → `No tasks`
- AC3: `task list --tag grocery` → only grocery-tagged tasks
- AC4: `task list --status done` → only completed tasks

## REQ-003: 태스크 완료 처리

**REQ-003** The task-cli SHALL mark a task as done when the `done` subcommand is executed.

WHEN a user runs `task done <id>` with a valid task ID
  THEN the system SHALL update the task status to `done`
  THEN the system SHALL print `Task #<id> marked as done` to stdout
  THEN the system SHALL exit with code 0

IF the task ID does not exist
  THEN the system SHALL print `ERROR: task #<id> not found` to stderr
  THEN the system SHALL exit with code 1

IF the task is already done
  THEN the system SHALL print `ERROR: task #<id> already done` to stderr
  THEN the system SHALL exit with code 1

- AC1: `task done 1` (pending) → stdout: `Task #1 marked as done`, exit 0
- AC2: `task done 999` → stderr: `ERROR: task #999 not found`, exit 1
- AC3: `task done 1` (already done) → stderr: `ERROR: task #1 already done`, exit 1

## REQ-004: 태스크 삭제

**REQ-004** The task-cli SHALL delete a task when the `delete` subcommand is executed.

WHEN a user runs `task delete <id>` with a valid task ID
  THEN the system SHALL delete the task and its tags
  THEN the system SHALL print `Deleted task #<id>` to stdout
  THEN the system SHALL exit with code 0

IF the task ID does not exist
  THEN the system SHALL print `ERROR: task #<id> not found` to stderr
  THEN the system SHALL exit with code 1

- AC1: `task delete 1` → stdout: `Deleted task #1`, exit 0
- AC2: `task delete 999` → stderr: `ERROR: task #999 not found`, exit 1

## REQ-005: 태스크 상세 조회

**REQ-005** The task-cli SHALL show task details when the `show` subcommand is executed.

WHEN a user runs `task show <id>` with a valid task ID
  THEN the system SHALL print task details to stdout
  THEN the system SHALL exit with code 0

IF the task ID does not exist
  THEN the system SHALL print `ERROR: task #<id> not found` to stderr
  THEN the system SHALL exit with code 1

- AC1: `task show 1` → stdout includes `#1`, title, status, tags (if any)
- AC2: `task show 999` → stderr: `ERROR: task #999 not found`, exit 1

## REQ-006: 알 수 없는 서브커맨드

**REQ-006** The task-cli SHALL reject unknown subcommands.

IF an unknown subcommand is used
  THEN the system SHALL print `ERROR: unknown command '<cmd>'` to stderr
  THEN the system SHALL exit with code 1

- AC1: `task foo` → stderr: `ERROR: unknown command 'foo'`, exit 1

## 제약 조건

- DB 파일 경로: `TASK_DB` 환경변수 또는 `~/.task-cli.db`
- 태그는 최대 10개까지 허용. 초과 시 `ERROR: too many tags (max 10)`, exit 1
- stdout은 사람이 읽을 수 있는 텍스트. JSON 출력 미지원.
- 모든 에러는 stderr로 출력, exit code 1. 성공은 stdout, exit code 0.
