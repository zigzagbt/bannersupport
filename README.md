# 배너 제작 도우미

셀러를 위한 디자인 꿀팁 도구입니다.

## 🚀 빠른 시작

### 방법 1: 한 번에 두 서버 시작 (추천)
```bash
npm run dev
```

이 명령어로 API 서버(포트 4000)와 React 앱(포트 3000)을 동시에 시작합니다.

### 방법 2: 스크립트 사용
```bash
./start.sh
```

### 방법 3: 개별 시작
```bash
# API 서버만 시작
npm run server

# React 앱만 시작
npm start
```

## 📡 서버 주소

- **React 앱**: http://localhost:3000
- **API 서버**: http://localhost:4000

## ⚙️ 환경 설정

`.env` 파일에 OpenAI API 키를 설정하세요:

```
PORT=4000
OPENAI_API_KEY=your_openai_api_key_here
```

## 📝 주요 명령어

- `npm run dev` - 두 서버 동시 시작
- `npm start` - React 앱만 시작
- `npm run server` - API 서버만 시작
- `npm run build` - 프로덕션 빌드
