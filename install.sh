#!/bin/bash
# teddy-sdd Installer
set -e

TARGET=${1:-.}
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
TEMPLATES="$SCRIPT_DIR/templates"

echo "📦 teddy-sdd 설치 중..."
echo "   대상: $TARGET"

# Target directory must exist
if [ ! -d "$TARGET" ]; then
  echo "❌ 디렉토리가 없습니다: $TARGET"
  exit 1
fi

# 설치할 항목
# - .agents/skills/  : AgentSkills 표준 경로 (cross-client)
# - .claude/         : Claude Code 커맨드
# - .sdd/            : 런타임 데이터 디렉토리 (specs, steering, lessons...)
# - CLAUDE.md        : 부트스트랩 (≤50줄)

copy_base() {
  cp -r "$TEMPLATES/.agents"  "$TARGET/"
  cp -r "$TEMPLATES/.claude"  "$TARGET/"
  cp -r "$TEMPLATES/.sdd"     "$TARGET/"
}

if [ -f "$TARGET/CLAUDE.md" ]; then
  echo ""
  echo "⚠️  CLAUDE.md 이미 존재합니다. 덮어쓸까요? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    copy_base
    echo ""
    echo "✅ 설치 완료 (CLAUDE.md 유지)"
    echo ""
    echo "시작하려면:"
    echo "  claude 실행 후 /sdd:steering 으로 프로젝트 메모리 초기화"
    exit 0
  fi
fi

copy_base
cp "$TEMPLATES/CLAUDE.md" "$TARGET/"

echo ""
echo "✅ 설치 완료!"
echo ""
echo "설치된 구조:"
echo "  .agents/skills/   — AgentSkills 표준 경로 (cross-client 호환)"
echo "  .claude/commands/ — Claude Code 커맨드"
echo "  .sdd/             — 런타임 데이터 (specs, steering, lessons...)"
echo "  CLAUDE.md         — 부트스트랩"
echo ""
echo "시작하려면:"
echo "  1. cd $TARGET"
echo "  2. claude 실행"
echo "  3. /sdd:steering         (프로젝트 메모리 초기화)"
echo "  4. /sdd:spec-plan <설명> (스펙 자동 생성)"
echo ""
echo "overnight 자동화:"
echo "  /sdd:spec-auto <만들 것 설명>"
