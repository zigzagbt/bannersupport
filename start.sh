#!/bin/bash

# 서버 자동 시작 스크립트
echo "🚀 서버를 시작합니다..."
echo "📡 API 서버: http://localhost:4000"
echo "🌐 React 앱: http://localhost:3000"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

cd "$(dirname "$0")"
npm run dev

