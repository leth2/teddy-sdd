---
name: sdd-delta
description: 스펙 변경 → 영향 코드 위치 분석. @impl 태그 기반으로 스펙 문장과 코드를 1:1 매핑. 스펙이 바뀌면 어느 코드를 수정해야 하는지 즉시 파악. spec-delta 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Glob Grep LS
---

# spec-delta — 스펙-코드 변경 전파 분석

## @impl 태그 형식

스펙 문장 뒤에 코드 위치를 명시하는 태그:

**예시: REQ ID 포함 형식**
```markdown
`REQ-001` UserAuthService는 JWT와 Refresh 토큰을 발급한다.
<!-- @impl: REQ-001 → src/auth/UserAuthService.ts#UserAuthService.issueToken -->
<!-- @impl: REQ-001 → src/auth/UserAuthService.ts#UserAuthService.issueRefreshToken -->

`REQ-002` 토큰 만료는 24시간이다.
<!-- @impl: REQ-002 → src/auth/constants.ts#TOKEN_EXPIRY -->
```

**예시: 구버전 형식 (하위 호환)**
```markdown
<!-- @impl: src/auth/UserAuthService.ts#UserAuthService.issueToken -->
```

**형식 규칙:**
- REQ ID 포함 형식: `<!-- @impl: REQ-NNN → 파일경로#식별자 -->`
- 구버전: `<!-- @impl: 파일경로#식별자 -->` (REQ ID 없이)
- 구분자: `#` (파일경로 vs 식별자), `→` (REQ ID vs 경로)
- 클래스 메서드: `ClassName.methodName`
- 최상위 함수/상수: `identifierName`
- 파일 전체 범위: `src/auth/UserAuthService.ts` (식별자 없이 파일만)
- 한 요구사항에 여러 태그 허용 (1:N 매핑)

## 실행 흐름

### Step 1: 인자 파싱

```
spec-delta <feature> [--staged]

feature: .sdd/specs/ 아래 폴더명 (타임스탬프 포함 전체 또는 부분)
--staged: staged 변경만 감지 (기본은 working tree 전체)
```

### Step 2: 스펙 폴더 특정

이유: feature 인자로 .sdd/specs 아래 디렉토리를 부분 이름으로 탐색하기 때문에 정확한 경로 확인이 먼저다

**예시: 스펙 폴더 탐색**
```bash
# 이유: 타임스탬프 포함 전체 폴더명을 외울 필요 없도록 부분 문자열로 탐색
SPEC_DIR=$(find .sdd/specs -maxdepth 1 -type d -name "*$FEATURE*" | head -1)
# 이유: 스펙 폴더가 없으면 계속 진행해도 의미 없으므로 즉시 중단
[ -z "$SPEC_DIR" ] && echo "스펙을 찾을 수 없음: $FEATURE" && exit 1
```

### Step 3: git 상태 확인

이유: delta는 git diff 기반이라 git 레포 여부를 먼저 검사해야 한다. untracked 신규 스펙 파일은 diff에 잡히지 않으므로 별도 안내가 필요하다

**예시: git 환경 검증**
```bash
# 이유: git 없으면 diff 자체가 불가능 — 비-git 디렉토리에서 실행 시 즉시 안내
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "⚠️ git 레포가 아님 — spec-delta는 git 기반입니다"
  exit 1
fi

# 이유: git add 전 신규 파일은 diff에 없으므로 사용자에게 별도 처리 안내
UNTRACKED=$(git ls-files --others --exclude-standard "$SPEC_DIR/" 2>/dev/null)
if [ -n "$UNTRACKED" ]; then
  echo "📄 신규(untracked) 스펙 파일 감지:"
  echo "$UNTRACKED"
  echo "→ 새 파일은 git add -N <파일> 후 spec-delta 재실행, 또는 아래에서 신규 전체로 처리합니다"
fi
```

### Step 4: git diff 읽기

이유: `--staged` 플래그로 staged만 볼 수 있다. 기본은 커밋 전 포함 전체 변경이며 untracked도 포착한다

**예시: diff 추출**
```bash
# 이유: HEAD 기준으로 모든 변경(staged+unstaged)을 가져와 커밋 전 전체 파악
DIFF=$(git diff HEAD -- "$SPEC_DIR/")

# 이유: --staged 옵션은 커밋 예정 변경만 보고 싶을 때 사용 (CI 환경 등)
[ "$STAGED" = "true" ] && DIFF=$(git diff --cached -- "$SPEC_DIR/")

# 이유: 변경도 신규도 없으면 분석할 것이 없으므로 0으로 종료
[ -z "$DIFF" ] && [ -z "$UNTRACKED" ] && echo "변경된 스펙 없음" && exit 0
```

### Step 5: @impl 매핑 파싱

스펙 파일을 읽고 문장 ↔ @impl 태그 매핑 구축:

```
[문장 텍스트]
[해당 문장 아래의 연속된 @impl 태그들]
```

파싱 로직 (Claude가 직접 수행):
1. `requirements.md`, `design.md` 읽기
2. 각 줄 순회:
   - `<!-- @impl: ... -->` 패턴 → 직전 비어있지 않은 문장과 연결
   - `grep -oP '(?<=@impl: )[^-]+(?= -->)'` 로 경로#식별자 추출

### Step 6: 변경된 문장 + @impl 매핑

diff의 `+` / `-` 줄에서:
- `-` (삭제된 줄): 해당 문장의 @impl → **삭제 후보**
- `+` (추가/수정된 줄): 해당 문장의 @impl → **수정 대상**
- @impl 없는 변경 줄 → **AI 추정** 필요

### Step 7: 각 @impl 코드 확인

이유: 식별자 추출 → 파일 존재 확인 → grep 위치 파악 → ±5줄 컨텍스트를 보여준다. 리팩토링으로 이름이 바뀐 경우도 감지할 수 있다

**예시: verify_impl 헬퍼 함수**
```bash
verify_impl() {
  # 이유: @impl 경로를 파일경로#식별자로 분리
  local filepath=$(echo "$1" | cut -d'#' -f1 | xargs)
  local identifier=$(echo "$1" | cut -d'#' -f2 | xargs)

  # 이유: 파일 이동/삭제된 경우 즉시 표시 — 자동 수정하지 않음
  [ ! -f "$filepath" ] && echo "❌ 파일 없음: $filepath" && return

  if [ -n "$identifier" ]; then
    local found=$(grep -n "$identifier" "$filepath" | head -3)
    if [ -z "$found" ]; then
      # 이유: 식별자 없음 = 리팩토링으로 이름 변경됐을 가능성 — 사람이 확인해야 함
      echo "⚠️ 식별자 없음 (이동됐을 수 있음): $identifier in $filepath"
      return
    fi
    # 이유: ±5줄 컨텍스트로 수정 대상 코드를 즉시 확인할 수 있도록
    local lineno=$(echo "$found" | head -1 | cut -d: -f1)
    local start=$((lineno > 5 ? lineno - 5 : 1))
    local end=$((lineno + 5))
    echo "📄 $filepath#$identifier (L$lineno)"
    sed -n "${start},${end}p" "$filepath" | nl -ba -nrz -v$start
  else
    echo "📄 $filepath (파일 전체)"
  fi
}
```

### Step 8: AI 추정 (@impl 없는 변경)

이유: @impl 태그 없는 변경에 대해 최선 노력으로 관련 코드를 찾는다. 추정이므로 반드시 사람이 확인해야 한다

**예시: 키워드 기반 추정 탐색**
```bash
# 이유: @impl 없을 때 변경 문장의 키워드로 관련 코드 위치를 grep으로 추정
grep -rn "$KEYWORD" src/ --include="*.ts" --include="*.js" --include="*.py" | head -5
```

## 출력 형식

**예시: spec-delta 실행 결과**
```
## spec-delta — <feature>

### 📝 변경된 스펙 문장

수정: REQ-001 "기존 문장 텍스트"
  → "새 문장 텍스트"

삭제: REQ-002 "삭제된 문장 텍스트"

### 🔗 수정 대상 코드

  REQ-001 📄 src/auth/UserAuthService.ts#UserAuthService.issueToken
     42: async issueToken(...) {
     43:   ...
     45: }

  ⚠️ 추정 (REQ ID 없음) | src/auth/TokenStore.ts (keyword: TokenStore)
     — @impl 태그 없음, grep으로 추정

### 🗑️ 삭제 후보 코드 (연결된 스펙 문장 삭제됨)

  REQ-002 📄 src/auth/legacyAuth.ts#legacyLogin
  → 이 코드는 삭제된 스펙(REQ-002)과 연결됨
  → 코드 삭제 또는 스펙 복원 여부를 확인하세요 (자동 삭제 안 함)

### 💡 권장 액션

1. REQ-001: UserAuthService.issueToken 수정
2. REQ-003: TOKEN_EXPIRY 값 24h → 7d 변경
→ spec-impl을 실행하시겠습니까? [y/N]
```

## 실행 시점

- 스펙 문장 수정 후 → `spec-delta`로 영향 범위 파악
- `spec-impl` 전 사전 확인
- 코드 리뷰 전 스펙-코드 정합성 점검
