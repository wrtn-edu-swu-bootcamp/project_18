# 백엔드 배포 가이드 (Render - 더 쉬움!)

## 🚀 Render로 백엔드 배포하기 (추천)

Render는 Railway보다 더 간단하고 무료 플랜이 좋습니다!

### 1단계: Render 계정 생성

1. https://render.com 접속
2. "Get Started for Free" 클릭
3. GitHub 계정으로 로그인

### 2단계: 새 Web Service 생성

1. 대시보드에서 **"New +"** → **"Web Service"** 클릭
2. GitHub 저장소 연결: `wrtn-edu-swu-bootcamp/project_18`
3. 설정 입력:
   - **Name**: `s2s-backend` (원하는 이름)
   - **Region**: `Singapore` (가장 가까운 지역)
   - **Branch**: `main`
   - **Root Directory**: `backend` ✅ (중요!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free` 선택

### 3단계: 환경 변수 설정

**Environment Variables** 섹션에서:

⚠️ **주의**: 키와 값은 각각 별도의 입력 필드에 입력하세요!

1. **첫 번째 환경 변수 추가:**
   - **Key**: `EMAIL_USER` (공백 없이!)
   - **Value**: `nivuss128@gmail.com`
   - "Add" 클릭

2. **두 번째 환경 변수 추가:**
   - **Key**: `EMAIL_PASS` (공백 없이!)
   - **Value**: `hkoo mlsd mhmw vswx` (공백 포함 가능, 값에는 문제 없음)
   - "Add" 클릭

**올바른 형식:**
- ✅ `EMAIL_USER` (대문자, 언더스코어 사용 가능)
- ✅ `EMAIL_PASS`
- ❌ `EMAIL USER` (공백 불가)
- ❌ `email-user` (하이픈은 가능하지만 대문자 권장)
- ❌ `123EMAIL` (숫자로 시작 불가)

### 4단계: 배포

1. **"Create Web Service"** 클릭
2. 배포 진행 상황 확인 (약 2-3분 소요)
3. 배포 완료 후 **URL 확인** (예: `https://s2s-backend.onrender.com`)

### 5단계: Vercel 환경 변수 설정

1. Vercel 대시보드 접속
2. 프로젝트 → **Settings** → **Environment Variables**
3. 추가:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://s2s-backend.onrender.com/api`
   - **Environment**: Production, Preview, Development 모두 선택
4. **Save** 후 재배포

## 🔍 배포 확인

1. Render 대시보드에서 **Logs** 탭 확인
2. 브라우저에서 `https://your-app.onrender.com/api/health` 접속
3. `{"status":"OK","message":"S2S Backend is running"}` 응답 확인

## ⚠️ Render 무료 플랜 제한

- 15분간 요청이 없으면 자동으로 sleep (첫 요청 시 약 30초 지연)
- 월 750시간 무료 (충분함)
- 해결책: UptimeRobot 같은 서비스로 주기적으로 핑 보내기

## 📝 참고

- Render는 GitHub push 시 자동 재배포
- 로그는 실시간으로 확인 가능
- 무료 플랜도 충분히 사용 가능
