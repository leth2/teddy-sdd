---
name: sdd-delta
description: 스펙 변경 → 영향 코드 위치 분석. @impl 태그 기반으로 스펙 문장과 코드를 1:1 매핑. 스펙이 바뀌면 어느 코드를 수정해야 하는지 즉시 파악. spec-delta 커맨드에서 사용.
allowed-tools: Bash Read Write Edit Glob Grep LS
---

# spec-delta — 스펙-코드 변경 전파 분석

## @impl 태그 형식

스펙 문장 뒤에 코드 위치를 명시하는 태그:

```markdown
`REQ-001` UserAuthService는 JWT와 Refresh 토큰을 발급한다.
<!-- @impl: REQ-001 → src/auth/UserAuthService.ts#UserAuthService.issueToken -->
<!-- @impl: REQ-001 → src/auth/UserAuthService.ts#UserAuthService.issueRefreshToken -->

`REQ-002` 토큰 만료는 24시간이다.
<!-- @impl: REQ-002 → src/auth/constants.ts#TOKEN_EXPIRY -->
```

**구버전 형식 (하위 호환):**
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

```bash
# feature 인자로 스펙 폴더 찾기
SPEC_DIR=$(find .sdd/specs -maxdepth 1 -type d -name "*$FEATURE*" | head -1)
[ -z "$SPEC_DIR" ] && echo "스펙을 찾을 수 없음: $FEATURE" && exit 1
```

### Step 3: git 상태 확인

```bash
# git 레포인지 확인
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "⚠️ git 레포가 아님 — spec-delta는 git 기반입니다"
  exit 1
fi

# untracked 스펙 파일 감지
UNTRACKED=$(git ls-files --others --exclude-standard "$SPEC_DIR/" 2>/dev/null)
if [ -n "$UNTRACKED" ]; then
  echo "📄 신규(untracked) 스펙 파일 감지:"
  echo "$UNTRACKED"
  echo "→ 새 파일은 git add -N <파일> 후 spec-delta 재실행, 또는 아래에서 신규 전체로 처리합니다"
fi
```

### Step 4: git diff 읽기

```bash
# working tree 전체 변경 감지 (커밋 전 포함)
DIFF=$(git diff HEAD -- "$SPEC_DIR/")

# --staged 옵션 시
[ "$STAGED" = "true" ] && DIFF=$(git diff --cached -- "$SPEC_DIR/")

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

```bash
verify_impl() {
  local filepath=$(echo "$1" | cut -d'#' -f1 | xargs)
  local identifier=$(echo "$1" | cut -d'#' -f2 | xargs)

  # 파일 존재 확인
  [ ! -f "$filepath" ] && echo "❌ 파일 없음: $filepath" && return

  # 식별자 존재 확인 (함수/클래스/상수)
  if [ -n "$identifier" ]; then
    local found=$(grep -n "$identifier" "$filepath" | head -3)
    if [ -z "$found" ]; then
      echo "⚠️ 식별자 없음 (이동됐을 수 있음): $identifier in $filepath"
      return
    fi
    # ±5줄 컨텍스트 출력 (start는 최소 1 보장)
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

@impl 태그 없는 변경 줄에 대해:
1. 변경된 문장 키워드로 코드베이스 grep
2. 결과를 "⚠️ 추정" 표시와 함께 출력
3. 확인 요청 후 진행

```bash
grep -rn "$KEYWORD" src/ --include="*.ts" --include="*.js" --include="*.py" | head -5
```

## 출력 형식

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
