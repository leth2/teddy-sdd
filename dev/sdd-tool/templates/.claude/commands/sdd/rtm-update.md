# /sdd:rtm-update

Requirements Traceability Matrix 생성/갱신 커맨드.

## 실행

`/sdd:rtm-update` 를 실행하면:

1. `.sdd/specs/` 디렉토리의 모든 `requirements.md` 파일 스캔
2. `REQ-xxx` ID와 `@impl` 태그 파싱
3. `.sdd/requirements.json` 생성 (전체 REQ의 SoT)
4. `.sdd/rtm/rtm-{날짜}.md` RTM 마크다운 생성
5. 도메인 충돌(같은 domain에 active REQ 두 개) 경고

## 사용법

```bash
node skills/rtm/rtm-builder.js \
  --specs-dir .sdd/specs \
  --output .sdd/requirements.json \
  --rtm .sdd/rtm/rtm-$(date +%Y%m%d).md
```

## requirements.json 구조

```json
{
  "REQ-001": {
    "id": "REQ-001",
    "title": "JWT 토큰 만료 7일",
    "domain": "auth.token.expiry",
    "status": "active",
    "superseded_by": null,
    "source": "specs/auth/requirements.md",
    "impls": ["src/routes/auth.ts#login"]
  }
}
```

## 스펙에서 domain/status 명시 방법 (선택)

requirements.md의 REQ 섹션에 추가:

```markdown
**1.1** `REQ-001` When 사용자가 로그인 요청을 하면...
**domain:** auth.token.expiry
**status:** active
```

명시하지 않으면 파일 경로에서 자동 추론.

## 충돌 감지

같은 `domain` 에 `active` REQ가 두 개 이상이면 경고:

```
⚠️ 도메인 충돌 감지:
  domain: auth.token.expiry → REQ-001, REQ-008 모두 active
```

이 경우 둘 중 하나에 `**status:** superseded` + `**superseded_by:** REQ-xxx` 추가.
