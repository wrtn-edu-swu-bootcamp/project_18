# Vercel 배포 가이드

## 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

1. Vercel 프로젝트 설정 → Environment Variables로 이동
2. 다음 변수 추가:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: 백엔드 API URL (예: `https://your-backend.railway.app/api`)

## 백엔드 배포 필요

현재 프론트엔드만 Vercel에 배포되어 있습니다. 백엔드도 별도로 배포해야 합니다:

### 백엔드 배포 옵션:
1. **Railway** (추천)
2. **Render**
3. **Heroku**
4. **AWS/GCP/Azure**

### 백엔드 배포 후:
1. 백엔드 URL을 확인 (예: `https://s2s-backend.railway.app`)
2. Vercel 환경 변수에 `VITE_API_BASE_URL`을 `https://s2s-backend.railway.app/api`로 설정
3. 재배포

## 로컬 개발

로컬에서는 `.env` 파일을 사용할 수 있습니다:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## CORS 설정

백엔드 `server.js`에서 Vercel 도메인을 CORS 허용 목록에 추가해야 합니다:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-vercel-app.vercel.app'
];
```
