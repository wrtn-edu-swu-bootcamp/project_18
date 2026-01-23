# Vercel 배포 가이드

## ⚠️ 중요: 백엔드 배포 필수

프론트엔드만 배포되어 있어도 **백엔드가 배포되지 않으면 작동하지 않습니다.**

## 1단계: 백엔드 배포

### Railway로 배포 (추천)

1. https://railway.app 접속 및 로그인
2. "New Project" → "Deploy from GitHub repo" 선택
3. 프로젝트 저장소 선택
4. **Root Directory**: `backend` 설정
5. **Start Command**: `npm start` 또는 `node server.js`
6. 배포 완료 후 URL 확인 (예: `https://s2s-backend.railway.app`)

### Render로 배포

1. https://render.com 접속 및 로그인
2. "New" → "Web Service" 선택
3. GitHub 저장소 연결
4. 설정:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. 배포 완료 후 URL 확인

## 2단계: Vercel 환경 변수 설정

1. Vercel 대시보드 접속: https://vercel.com
2. 프로젝트 선택 → **Settings** → **Environment Variables**
3. 새 변수 추가:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-url.railway.app/api` (백엔드 URL + `/api`)
   - **Environment**: Production, Preview, Development **모두 선택** ✅
4. **Save** 클릭

## 3단계: 재배포

환경 변수 저장 후:
- 자동으로 재배포되거나
- **Deployments** 탭에서 최신 배포의 "..." → **Redeploy** 클릭

## 4단계: 백엔드 CORS 설정 확인

백엔드 `server.js`에서 이미 `app.use(cors())`로 모든 origin을 허용하고 있으므로 추가 설정 불필요합니다.

## 문제 해결

### "백엔드 서버에 연결할 수 없습니다" 에러

1. **브라우저 콘솔 확인** (F12 → Console)
   - 현재 API URL 확인
   - 환경 변수 값 확인

2. **Vercel 환경 변수 확인**
   - Settings → Environment Variables
   - `VITE_API_BASE_URL`이 올바르게 설정되었는지 확인
   - **모든 환경(Production, Preview, Development)에 설정되어 있는지 확인**

3. **백엔드 서버 상태 확인**
   - 백엔드 URL을 브라우저에서 직접 접속해보기
   - 예: `https://your-backend.railway.app/api/stores`
   - 응답이 오는지 확인

4. **재배포**
   - 환경 변수 변경 후 반드시 재배포 필요
   - Vercel은 빌드 시점에 환경 변수를 번들에 포함시킴

## 로컬 개발

로컬에서는 `.env` 파일을 사용할 수 있습니다:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 체크리스트

- [ ] 백엔드가 Railway/Render 등에 배포됨
- [ ] 백엔드 URL 확인 (예: `https://xxx.railway.app`)
- [ ] Vercel 환경 변수에 `VITE_API_BASE_URL` 설정
- [ ] 환경 변수 값이 `https://xxx.railway.app/api` 형식인지 확인
- [ ] Production, Preview, Development 모두에 환경 변수 설정
- [ ] 환경 변수 저장 후 재배포 완료
- [ ] 브라우저 콘솔에서 API URL 확인
