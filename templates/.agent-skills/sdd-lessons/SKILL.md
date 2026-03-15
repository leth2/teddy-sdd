---
name: sdd-lessons
description: .sdd/lessons/ 목록 조회. spec-lessons 커맨드에서 사용.
allowed-tools: Read Bash LS
---

# Lessons 조회

## 실행

1. `.sdd/lessons/` 파일 목록 확인
2. `--category <cat>` 지정 시 해당 파일만 읽기
3. 없으면 모든 `.md` 파일 읽기
4. 카테고리별로 정리하여 출력

## 출력 형식

```
📚 Lessons — docker-node (4개)
  D01: npm ci --only=production → tsc 없음
  D02: package-lock.json 누락
  D03: 환경변수 이름 불일치
  D04: UI Dockerfile 없음

📚 Lessons — acp-protocol (4개)
  A01: npx spawn stdin pipe 미전달
  ...
```

## lessons가 없을 때

`.sdd/lessons/` 디렉토리가 비어있거나 없으면:
```
📭 아직 기록된 lessons가 없습니다.
   버그 발견 시: /sdd:spec-capture "<제목>" 로 추가하세요.
```
