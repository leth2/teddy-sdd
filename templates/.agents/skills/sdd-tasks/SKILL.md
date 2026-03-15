---
name: sdd-tasks
description: 구현 태스크 생성. tasks.md 작성. 1-3시간 크기, TDD 구조, 병렬 태스크(P) 표시, 모든 요구사항 매핑 검증. spec-tasks 커맨드에서 사용.
allowed-tools: Read Write Edit Glob Grep
---

# 태스크 생성

## 태스크 생성 전 준비

다음 파일이 있으면 읽고 태스크 생성에 반영:
- `.sdd/specs/$FEATURE/conformance-tests.yaml` — 외부 스펙 컨포먼스 테스트
- `.sdd/specs/$FEATURE/acceptance-tests.yaml` — 요구사항 수락 테스트

**테스트 파일이 있으면:**
1. 각 테스트 케이스를 태스크의 서브태스크로 생성
2. 테스트 태스크를 구현 태스크보다 먼저 배치 (TDD: Red 먼저)
3. 형식:
   ```
   - [ ] T1: [컴포넌트명] 컨포먼스 테스트
     - [ ] T1.1: [conformance-tests.yaml의 테스트명] 테스트 작성 및 통과
     - [ ] T1.2: ...
   ```

## 단계

1. `.sdd/specs/$FEATURE/spec.json`, `requirements.md`, `design.md` 읽기
2. `-y` 있으면 requirements, design 자동 승인
3. `.agents/skills/project-steering/SKILL.md` 읽기 → 기본 references (product/tech/structure) 로드
4. tasks.md 생성 (아래 규칙 적용)
5. **정렬 검증**:
   - 모든 requirements ID가 태스크와 매핑됐는가?
   - 태스크의 기술 선택이 `tech` 스티어링과 일치하는가?
   - 태스크가 design.md의 컴포넌트 경계를 따르는가?
6. `spec.json` 업데이트

## 태스크 크기 규칙

- 서브태스크 1개 = **1~3시간** 작업량
- 너무 크면 분할, 너무 작으면 합침
- 기준: "오늘 끝낼 수 있는 단위"

## 구조 규칙

- 최대 2단계: 주요 태스크 → 서브태스크
- **3단계 이상 금지**
- 주요 태스크 = 관련 서브태스크의 묶음

## TDD 구조 (기능 구현마다 필수)

```markdown
- [ ] 1. 기능 구현
  - [ ] 1.1 테스트 작성 (실패 확인)
  - [ ] 1.2 구현 (테스트 통과)
  - [ ] 1.3 리팩토링 (테스트 유지)
```

## 병렬 실행 및 의존성

```markdown
- [ ] 2. API 엔드포인트 (P)          ← 독립 실행 가능
- [ ] 3. 프론트엔드 컴포넌트 (P)      ← 독립 실행 가능
- [ ] 4. 통합 테스트 (requires: 2, 3 완료)
```

## 태스크 형식

```markdown
## 1. [주요 태스크명]
> 요구사항: 1.1, 1.2 | 예상: ~3h

- [ ] 1.1 [서브태스크] — [완료 기준]
- [ ] 1.2 [서브태스크] — [완료 기준]
```

## 태스크 설명 원칙

- 자연어로 WHAT 기술
- **HOW 없음** (구현 방법 명시 금지)
- 코드 예시 없음
- 완료 기준 명시 (무엇이 되면 완료인가)

## 생성 후 검증 체크리스트

1. 모든 requirements ID가 태스크에 매핑됐는가?
2. 각 태스크가 1~3시간인가?
3. TDD 구조가 있는가?
4. 의존성이 명확한가?
5. 병렬 가능한 태스크에 (P) 표시가 있는가?

## 태스크 상태 표시 (TDD 엄격화)

| 상태 | 의미 |
|------|------|
| `[ ]` | 미시작 |
| `[~]` | 코드 작성됨, 테스트 미실행 (npm 설치 없음 등) |
| `[x]` | 테스트 실행 + 통과 확인 ✅ |

**`[x]`는 테스트 통과가 확인된 경우에만 사용.**
실행 환경이 없으면 `[~]` 사용하고 태스크 끝에 `⚠️ 테스트 미실행` 표시.

## 생성 후 자동 검증

`.agents/skills/sdd-validate/SKILL.md` 읽고 Tasks 검증 실행.

## 상세 태스크 구조 및 예시

→ `references/tdd-structure.md` 참조

## 출력 템플릿

→ `references/tasks-template.md` 참조
