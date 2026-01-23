# 백엔드 배포 가이드 (Railway)

## 🚀 Railway로 백엔드 배포하기

### 1단계: Railway 계정 생성 및 GitHub 연동

1. https://railway.app 접속
2. "Start a New Project" 클릭
3. GitHub 계정으로 로그인
4. 저장소 권한 부여

### 2단계: 프로젝트 배포

1. **"Deploy from GitHub repo"** 선택
2. 저장소 선택: `wrtn-edu-swu-bootcamp/project_18`
3. 배포 설정:
   - **Root Directory**: `backend` ✅ (중요!)
   - **Build Command**: 자동 감지됨 (npm install)
   - **Start Command**: `node server.js` 또는 `npm start`

### 3단계: 환경 변수 설정

Railway 대시보드에서:

1. 프로젝트 선택 → **Variables** 탭
2. **"New Variable"** 클릭하여 각각 추가:

**첫 번째 변수:**
- **Key**: `EMAIL_USER` (공백 없이!)
- **Value**: `nivuss128@gmail.com`
- "Add" 클릭

**두 번째 변수:**
- **Key**: `EMAIL_PASS` (공백 없이!)
- **Value**: `hkoo mlsd mhmw vswx` (값에 공백 있어도 됨)
- "Add" 클릭

**⚠️ 주의사항:**
- 키 이름에는 공백, 특수문자(_, -, . 제외) 사용 불가
- 키는 숫자로 시작할 수 없음
- 값에는 공백 포함 가능

**참고:** Railway는 자동으로 `PORT` 환경 변수를 제공하므로 설정할 필요 없습니다.

### 4단계: 도메인 확인

1. 배포 완료 후 **Settings** → **Networking** 탭
2. **Generate Domain** 클릭
3. 생성된 도메인 확인 (예: `s2s-backend-production.up.railway.app`)
4. 이 URL을 복사해두세요!

### 5단계: Vercel 환경 변수 설정

1. Vercel 대시보드 접속
2. 프로젝트 → **Settings** → **Environment Variables**
3. 추가:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-railway-domain.up.railway.app/api`
   - **Environment**: Production, Preview, Development 모두 선택
4. **Save** 후 재배포

## 🔍 배포 확인

배포가 완료되면:

1. Railway 대시보드에서 **Deployments** 탭 확인
2. **Logs** 탭에서 서버 로그 확인
3. 브라우저에서 `https://your-domain.up.railway.app/api/health` 접속
4. `{"status":"OK","message":"S2S Backend is running"}` 응답 확인

## ⚠️ 문제 해결

### 배포 실패 시

1. **Logs** 탭에서 에러 확인
2. `backend` 폴더가 Root Directory로 설정되었는지 확인
3. `package.json`의 `start` 스크립트 확인

### CORS 에러

백엔드 `server.js`에서 이미 `app.use(cors())`로 모든 origin을 허용하고 있으므로 추가 설정 불필요합니다.

### 포트 에러

`server.js`에서 `process.env.PORT || 3001`을 사용하도록 수정되어 있습니다.

## 📝 참고

- Railway는 무료 플랜 제공 (월 5달러 크레딧)
- 자동 재배포: GitHub에 push하면 자동으로 재배포
- 로그 확인: Railway 대시보드에서 실시간 로그 확인 가능
