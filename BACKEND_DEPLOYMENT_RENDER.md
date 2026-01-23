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
   - **Root Directory**: `backend` ✅ **매우 중요! 반드시 `backend`로 설정**
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: `Free` 선택

⚠️ **Root Directory를 `backend`로 설정하지 않으면 404 에러 발생!**

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

### 5단계: 백엔드 URL 확인 및 테스트

서버가 정상적으로 실행되었다면:

1. **백엔드 URL 확인:**
   - Render 로그에서 `Available at your primary URL` 확인
   - 예: `https://project-18-rls8.onrender.com`

2. **브라우저에서 직접 테스트:**
   - `https://project-18-rls8.onrender.com/` (루트)
   - `https://project-18-rls8.onrender.com/api/stores` (API)
   - JSON 응답이 오는지 확인

3. **404가 나온다면:**
   - 서버가 아직 완전히 시작되지 않았을 수 있음 (30초 대기)
   - 또는 경로 문제일 수 있음

### 6단계: Vercel 환경 변수 설정

백엔드가 정상 작동하는 것을 확인한 후:

1. Vercel 대시보드 접속
2. 프로젝트 → **Settings** → **Environment Variables**
3. 추가:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://project-18-rls8.onrender.com/api` (Render URL + `/api`)
   - **Environment**: Production, Preview, Development 모두 선택
4. **Save** 후 재배포 필수!

## 🔍 배포 확인

1. **Render 대시보드에서 Logs 확인**
   - 서비스 → **Logs** 탭
   - `🚀 S2S Backend server running` 메시지 확인
   - 에러가 있다면 확인

2. **다양한 경로로 테스트:**
   - `https://your-app.onrender.com/` (루트)
   - `https://your-app.onrender.com/health` (헬스 체크)
   - `https://your-app.onrender.com/api/health` (API 헬스 체크)
   - `https://your-app.onrender.com/api/stores` (매장 목록)

3. **예상 응답:**
   ```json
   {"status":"OK","message":"S2S Backend is running"}
   ```

## ⚠️ 문제 해결

### 브라우저에서 404 에러 발생 시

#### 1단계: Render Logs 확인 (가장 중요!)

1. Render 대시보드 → 서비스 → **Logs** 탭
2. 확인할 내용:
   - `🚀 S2S Backend server running on http://localhost:XXXX` 메시지가 있는지
   - 에러 메시지가 있는지
   - 빌드가 성공했는지

**예상되는 정상 로그:**
```
🚀 S2S Backend server running on http://localhost:10000
📧 이메일 서비스 설정 중...
✅ 이메일 서비스 연결 성공!
✨ Server is ready!
```

**문제가 있다면:**
- `Error: Cannot find module` → 의존성 문제
- `EADDRINUSE` → 포트 문제
- `ENOENT` → 파일 경로 문제

#### 2단계: Root Directory 확인 (404의 주요 원인!)

1. Render 대시보드 → 서비스 → **Settings** → **Build & Deploy**
2. **Root Directory** 확인:
   - ✅ 올바른 값: `backend`
   - ❌ 잘못된 값: `.` 또는 비어있음

3. **Root Directory가 잘못되었다면:**
   - `backend`로 변경
   - **Save Changes**
   - **Manual Deploy** → **Clear build cache & deploy**

#### 3단계: 서버 재배포

1. Render 대시보드 → 서비스
2. **Manual Deploy** → **Clear build cache & deploy** 선택
3. 배포 완료 대기 (2-3분)
4. Logs에서 서버 시작 메시지 확인

#### 4단계: 직접 테스트

배포 완료 후 브라우저에서 테스트:

1. **루트 경로:**
   - `https://your-app.onrender.com/`
   - 예상 응답: `{"status":"OK","message":"S2S Backend is running",...}`

2. **헬스 체크:**
   - `https://your-app.onrender.com/health`
   - 예상 응답: `{"status":"OK","message":"S2S Backend is running"}`

3. **API 엔드포인트:**
   - `https://your-app.onrender.com/api/stores`
   - 예상 응답: JSON 배열

#### 5단계: 환경 변수 확인

1. Settings → Environment Variables
2. 다음 변수들이 있는지 확인:
   - `EMAIL_USER` = `nivuss128@gmail.com`
   - `EMAIL_PASS` = `hkoo mlsd mhmw vswx`

#### 6단계: package.json 확인

Render가 `backend/package.json`을 찾을 수 있는지 확인:
- Root Directory가 `backend`면 자동으로 찾음
- `backend/package.json`이 존재하는지 확인

### 🔍 디버깅 체크리스트

- [ ] Root Directory가 `backend`로 설정됨
- [ ] Logs에 `🚀 S2S Backend server running` 메시지 있음
- [ ] Logs에 에러 메시지 없음
- [ ] 환경 변수 `EMAIL_USER`, `EMAIL_PASS` 설정됨
- [ ] `https://your-app.onrender.com/` 접속 시 JSON 응답
- [ ] `https://your-app.onrender.com/api/stores` 접속 시 JSON 배열 응답

## ⚠️ Render 무료 플랜 제한

- 15분간 요청이 없으면 자동으로 sleep (첫 요청 시 약 30초 지연)
- 월 750시간 무료 (충분함)
- 해결책: UptimeRobot 같은 서비스로 주기적으로 핑 보내기

## 📝 참고

- Render는 GitHub push 시 자동 재배포
- 로그는 실시간으로 확인 가능
- 무료 플랜도 충분히 사용 가능
