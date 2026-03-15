---
name: sdd-req-search
description: 전체 스펙 폴더에서 요구사항 검색. REQ ID + 요구사항 문장 + 스펙 폴더명 출력. spec-search --all 옵션에서 사용.
allowed-tools: Bash Read Glob Grep LS
---

# 전체 요구사항 검색

## 실행 흐름

### Step 1: 검색 대상 파악

```bash
# 모든 스펙의 requirements.md 수집
find .sdd/specs -name "requirements.md" | sort
```

파일이 없으면:
```
📭 스펙이 없어요. /sdd:spec-requirements 로 스펙을 먼저 작성하세요.
```

### Step 2: 각 requirements.md에서 키워드 검색

각 파일에서 `$KEYWORD`를 포함하는 줄을 찾되:
- REQ-NNN 패턴이 있는 요구사항 줄만 추출
- `<!-- @impl: ... -->` 태그 줄은 제외
- 빈 줄, 주석, 섹션 헤더(`#`) 제외

```bash
grep -rn "$KEYWORD" .sdd/specs/*/requirements.md \
  | grep -E "REQ-[0-9]+" \
  | grep -v "^.*@impl"
```

### Step 3: 결과 포맷

각 매칭 항목을:
```
REQ-NNN  [spec-folder-name]  "요구사항 문장"
```

형식으로 정리.

**스펙 폴더명**: 타임스탬프 제거, 이름만 표시
- `1234567890-user-auth` → `user-auth`

### Step 4: REQ ID 없는 구버전 항목 처리

REQ ID 없는 줄도 매칭되면 별도 섹션으로 표시:
```
⚠️ REQ ID 없음 (구버전 스펙):
  [user-auth] "인증 토큰은 JWT 방식을 사용한다."
  → /sdd:spec-requirements user-auth 재실행으로 REQ ID 부여 가능
```

## 출력 형식

```
🔍 요구사항 검색: "인증"
━━━━━━━━━━━━━━━━━━━━━━━━
REQ-011  [user-auth]    "사용자는 이메일/비밀번호로 인증할 수 있다."
REQ-023  [payment]      "인증된 사용자만 결제할 수 있다."
REQ-047  [user-profile] "재인증 없이 프로필을 수정할 수 없다."
━━━━━━━━━━━━━━━━━━━━━━━━
총 3개 요구사항 매칭 (3개 스펙)

💡 특정 요구사항 상세 보기:
→ .sdd/specs/TIMESTAMP-user-auth/requirements.md 에서 REQ-011 확인
```

매칭 없으면:
```
🔍 요구사항 검색: "인증"
━━━━━━━━━━━━━━━━━━━━━━━━
결과 없음.

💡 다른 키워드 시도:
→ /sdd:spec-search --all "로그인"
→ /sdd:spec-search --all "JWT"
```

## 검색 팁

- 한글/영문 혼용 검색 지원 (grep은 둘 다 매칭)
- REQ ID로 직접 검색 가능: `/sdd:spec-search --all "REQ-023"`
- 스펙 지정 검색: `/sdd:spec-search user-auth "인증"` (--all 없이)
