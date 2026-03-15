---
name: sdd-search
description: .sdd/lessons/INDEX.md에서 키워드로 lesson 검색. spec-search 커맨드에서 사용.
allowed-tools: Read
---

# Lesson 검색

## 실행

1. `.sdd/lessons/INDEX.md` 읽기
2. 입력된 키워드로 행 필터링 (제목, 키워드 컬럼 대상)
3. 매칭된 행 출력
4. 상세 내용 확인 원하면 해당 카테고리 파일 읽기

## 출력 형식

```
🔍 검색: "spawn"

매칭된 lessons (2개):
  A01 [횟수:2] acp-protocol — npx spawn stdin pipe 미전달
  A04 [횟수:2] acp-protocol — 패키지명 vs 바이너리명 혼동

상세 내용: /sdd:spec-search spawn --detail
```

## 결과 없을 때

```
🔍 검색: "<keyword>"
매칭 없음. 새 lesson 추가: /sdd:spec-capture "<제목>"
```

## 횟수 기반 정렬

횟수 높은 것부터 정렬하여 출력.
