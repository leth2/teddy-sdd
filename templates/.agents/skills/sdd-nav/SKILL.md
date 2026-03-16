# SDD 스킬 네비게이터 (Actionable Index)

상황에 따라 어떤 스킬을 호출할지 결정하는 라우팅 가이드.
전체 목록을 읽지 말고 **해당하는 상황 섹션만** 읽는다.

---

## 🚦 상황별 경로 (Dynamic Routing)

### 새 기능을 만들어야 한다
```
spec 폴더 없음
  → /sdd:steering (스티어링 없으면)
  → /sdd:spec-req  — 요구사항 작성
  → /sdd:spec-design
  → /sdd:spec-tasks
  → 사용자 OK 후 → /sdd:spec-impl
```
**Input**: 기능 설명 (자연어)
**Output**: requirements.md → design.md → tasks.md → 코드
**성공 기준**: 모든 태스크 [x] 완료, 테스트 PASS

---

### 요구사항이 변경됐다
```
기존 requirements.md 있음 + 새 요구사항
  → /sdd:spec-update "<변경 내용>"
  → requirements.md diff 확인 후
  → /sdd:spec-design (영향받는 feature만)
  → /sdd:spec-tasks (변경된 부분만)
```
**Input**: 변경 요구사항 (자연어)
**Output**: 업데이트된 requirements.md + REQ ID 재발급
**성공 기준**: 변경된 REQ ID 추적 가능, 기존 요구사항 보존

---

### 큰 기능을 나눠야 한다
```
Epic 수준의 요구사항
  → /sdd:spec-decomp — Epic → Feature → Story 분해
  → 각 Feature별 /sdd:spec-req 진행
```
**Input**: Epic 설명
**Output**: Feature 목록 + 각 Story
**성공 기준**: 각 Feature 독립 구현 가능 크기

---

### 특정 태스크만 구현한다
```
tasks.md 있음 + 구현할 태스크 번호 알고 있음
  → /sdd:spec-impl <feature> [task]
```
**Input**: feature 이름, 선택적 task ID
**Output**: 구현 코드 + 테스트
**성공 기준**: 해당 태스크 [x], 관련 테스트 PASS

---

### 스펙과 코드가 맞는지 확인한다
```
구현 완료 후 동기화 확인
  → /sdd:spec-delta — @impl 태그 상태 확인
  → /sdd:spec-val  — 요구사항 충족 여부 검증
```
**Input**: feature 이름
**Output**: 갭 목록 또는 "동기화 완료"
**성공 기준**: 모든 REQ에 @impl 태그, 미구현 없음

---

### 회고/교훈을 기록한다
```
스프린트 끝 또는 버그 발생
  → /sdd:retro    — 회고 (Keep/Problem/Try)
  → /sdd:spec-capture "<제목>" — 단건 교훈 저장
  → /sdd:spec-lessons — 기존 교훈 조회
```
**Input**: 회고 내용 또는 교훈 제목
**Output**: `.sdd/lessons/*.md` 저장
**성공 기준**: INDEX.md에 등록, 키워드 검색 가능

---

### 스티어링이 너무 길어졌다
```
CLAUDE.md 50줄 초과 위험 또는 스티어링 비대
  → /sdd:steer-trim — 내용을 스킬 파일로 분리
```
**Input**: 현재 스티어링 파일
**Output**: 간결한 스티어링 + 별도 스킬 파일
**성공 기준**: CLAUDE.md ≤ 50줄

---

### 스펙을 처음부터 다시 시작해야 한다
```
방향 전환 또는 대규모 리팩토링
  → /sdd:spec-reset [feature] — 아카이브 후 초기화
```
**Input**: feature 이름 (없으면 전체)
**Output**: `.sdd/archive/`에 기존 스펙 보관
**성공 기준**: 아카이브 완료, 새 스펙 시작 가능

---

## 📚 전체 스킬 목록 (필요시만 펼치기)

<details>
<summary>전체 보기</summary>

| 스킬 | 커맨드 | 경로 |
|------|--------|------|
| sdd-workflow | (참조용) | `.agents/skills/sdd-workflow/SKILL.md` |
| sdd-requirements | /sdd:spec-req | `.agents/skills/sdd-requirements/SKILL.md` |
| sdd-design | /sdd:spec-design | `.agents/skills/sdd-design/SKILL.md` |
| sdd-tasks | /sdd:spec-tasks | `.agents/skills/sdd-tasks/SKILL.md` |
| sdd-impl | /sdd:spec-impl | `.agents/skills/sdd-impl/SKILL.md` |
| sdd-validate | /sdd:spec-val | `.agents/skills/sdd-validate/SKILL.md` |
| sdd-update | /sdd:spec-update | `.agents/skills/sdd-update/SKILL.md` |
| sdd-decompose | /sdd:spec-decomp | `.agents/skills/sdd-decompose/SKILL.md` |
| sdd-delta | /sdd:spec-delta | `.agents/skills/sdd-delta/SKILL.md` |
| sdd-reset | /sdd:spec-reset | `.agents/skills/sdd-reset/SKILL.md` |
| sdd-search | /sdd:spec-search | `.agents/skills/sdd-search/SKILL.md` |
| sdd-lessons | /sdd:spec-lessons | `.agents/skills/sdd-lessons/SKILL.md` |
| sdd-retrospective | /sdd:retro | `.agents/skills/sdd-retrospective/SKILL.md` |
| sdd-gap | /sdd:spec-gap | `.agents/skills/sdd-gap/SKILL.md` |
| sdd-autonomous | /sdd:spec-auto | `.agents/skills/sdd-autonomous/SKILL.md` |
| sdd-lazy-load | /sdd:spec-index | `.agents/skills/sdd-lazy-load/SKILL.md` |
| sdd-steering-rules | /sdd:steering | `.agents/skills/sdd-steering-rules/SKILL.md` |
| sdd-briefing | /sdd:briefing | `.agents/skills/sdd-briefing/SKILL.md` |

</details>
