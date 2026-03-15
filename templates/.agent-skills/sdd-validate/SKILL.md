---
name: sdd-validate
description: 스펙 단계별 검증. Requirements/Design/Tasks/Impl 각 단계 완료 후 품질 검증. 누락, 불일치, 테스트 미통과 항목 보고.
allowed-tools: Bash Read Write Edit Glob Grep LS WebSearch WebFetch
---

# 스펙 검증

## 언제 실행하는가

> **SDD는 직선이 아니라 피드백 루프다.** 스펙 → 코드가 아니라, 코드를 짜면서 스펙이 개선된다.  
> 검증은 이 루프를 건강하게 유지하기 위한 도구다.

각 spec 단계 완료 직후 자동 실행 (또는 수동 `/sdd:spec-validate` 호출)

## Requirements 검증

**체크리스트:**
- [ ] 모든 요구사항이 EARS 형식인가? (When/If/While/Where/The system shall)
- [ ] 각 요구사항에 수락 기준(AC)이 최소 1개 있는가?
- [ ] AC가 테스트 가능한가? (모호한 표현 없음: "빠르게", "쉽게" 등)
- [ ] 스티어링 product 목적과 정렬됐는가?
- [ ] 누락된 영역이 없는가? (엣지 케이스, 에러 처리, 보안)

**실패 처리:** 미통과 항목 목록 출력 → requirements.md 수정 → 재검증

## Design 검증

**체크리스트:**
- [ ] 모든 requirements ID가 설계에 반영됐는가?
- [ ] 인터페이스 계약이 명확한가? (입력/출력 타입 정의)
- [ ] 스티어링 tech 결정과 충돌 없는가?
- [ ] 순환 의존성 없는가?
- [ ] Mermaid 다이어그램이 실제 컴포넌트 관계를 정확히 반영하는가?
- [ ] 외부 프로토콜/API 사용 시 → 웹 검색으로 스펙 확인 후 references/ 저장

**외부 스펙 처리:**
1. design.md에 외부 API/프로토콜 참조 발견 시
2. WebSearch로 공식 스펙 검색
3. 중요 내용을 `.sdd/specs/FEATURE/references/SPEC-NAME.md`에 저장
4. design.md에 `> 참조: references/SPEC-NAME.md` 링크 추가

## Tasks 검증

**체크리스트:**
- [ ] 모든 requirements ID가 태스크에 매핑됐는가?
- [ ] 각 서브태스크가 1~3시간 범위인가?
- [ ] TDD 구조 (테스트→구현→리팩토링) 가 있는가?
- [ ] 태스크 간 의존성이 명확한가?

## @impl 태그 검증 (구현 완료 스펙에서만)

tasks.md에 `[x]` 완료 태스크가 있는 스펙에서 실행:

**체크리스트:**
- [ ] @impl 태그가 가리키는 파일이 실제로 존재하는가?
- [ ] @impl 태그의 식별자가 파일 내에 존재하는가?
- [ ] tasks.md 전체 완료인데 @impl 없는 requirements.md 문장이 있는가?

**검증 로직:**
```bash
# requirements.md에서 @impl 태그 추출
grep -oP '(?<=@impl: )[^-]+(?= -->)' requirements.md | while read impl; do
  filepath=$(echo "$impl" | cut -d'#' -f1 | xargs)
  identifier=$(echo "$impl" | cut -d'#' -f2 | xargs)

  # 파일 존재 확인
  [ ! -f "$filepath" ] && echo "⚠️ 깨진 태그 (파일 없음): $filepath" && continue

  # 식별자 존재 확인
  [ -n "$identifier" ] && ! grep -q "$identifier" "$filepath" && \
    echo "⚠️ 깨진 태그 (식별자 없음, 리팩토링됐을 수 있음): $identifier in $filepath"
done
```

**결과 처리:**
- ⚠️ 경고 수준 (오류 아님) — 리팩토링으로 위치가 바뀔 수 있음
- 깨진 태그 발견 시: `spec-delta` 재실행으로 새 위치 파악 권장

## Implementation 검증

**태스크 상태 구분:**
- `[ ]` = 미시작
- `[~]` = 코드 작성됨, 테스트 미실행
- `[x]` = 테스트 통과 확인됨 ✅

**체크리스트:**
- [ ] 구현된 인터페이스가 design.md 계약과 일치하는가?
  - 함수 시그니처 비교
  - 이벤트 이름/타입 비교
  - 데이터 모델 비교
- [ ] 테스트가 실제로 실행됐는가? (실행 불가 시 `[~]` 표시)
- [ ] 모든 AC(수락 기준)에 대응하는 테스트가 있는가?

**인터페이스 불일치 발견 시:**
1. design.md의 인터페이스를 권위로 삼음 (steering → spec 계층)
2. 구현이 설계와 다르면 → 구현 수정 (설계 변경 금지, 단 명확한 설계 오류는 예외)
3. 불일치 항목 목록 출력

## 검증 결과 형식

```
## 검증 결과 — [단계] [FEATURE] [timestamp]

### ✅ 통과
- [항목들]

### ⚠️ 경고 (수정 권장)
- [항목들]

### ❌ 실패 (수정 필수)
- [항목들]

### 📎 외부 참조 저장됨
- references/[파일명]: [설명]
```
