#!/bin/bash
# SDD Tool Installer
set -e

TARGET=${1:-.}
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
TEMPLATES="$SCRIPT_DIR/templates"

echo "📦 SDD Tool 설치 중..."
echo "   대상: $TARGET"

# Target directory must exist
if [ ! -d "$TARGET" ]; then
  echo "❌ 디렉토리가 없습니다: $TARGET"
  exit 1
fi

if [ -f "$TARGET/CLAUDE.md" ]; then
  echo ""
  echo "⚠️  CLAUDE.md 이미 존재합니다. 덮어쓸까요? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "CLAUDE.md 건너뜀 — .claude와 .sdd만 설치합니다"
    cp -r "$TEMPLATES/.claude" "$TARGET/"
    cp -r "$TEMPLATES/.sdd" "$TARGET/"
    echo ""
    echo "✅ 설치 완료 (CLAUDE.md 제외)"
    echo ""
    echo "시작하려면:"
    echo "  claude 실행 후 /sdd:steering 으로 프로젝트 메모리 초기화"
    echo "  그 다음 /sdd:spec-plan <만들 것 설명>"
    exit 0
  fi
fi

cp -r "$TEMPLATES/." "$TARGET/"

echo ""
echo "✅ 설치 완료!"
echo ""
echo "시작하려면:"
echo "  1. cd $TARGET"
echo "  2. claude 실행"
echo "  3. /sdd:steering    (프로젝트 메모리 초기화)"
echo "  4. /sdd:spec-plan <만들 것 설명>"
echo ""
echo "overnight 자동화:"
echo "  /sdd:spec-auto <만들 것 설명>"
