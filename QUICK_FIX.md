# 🚀 빠른 해결 가이드

## 현재 상황
✅ Render 서버가 정상적으로 실행 중입니다!
- URL: `https://project-18-rls8.onrender.com`
- 서버 상태: `✨ Server is ready!`

⚠️ 이메일 연결 타임아웃은 나중에 해결 가능 (서버는 정상 작동)

## 즉시 해야 할 일

### 1단계: 백엔드 테스트

브라우저에서 다음 URL들을 테스트해보세요:

1. **루트 경로:**
   ```
   https://project-18-rls8.onrender.com/
   ```
   예상 응답: `{"status":"OK","message":"S2S Backend is running",...}`

2. **API 엔드포인트:**
   ```
   https://project-18-rls8.onrender.com/api/stores
   ```
   예상 응답: JSON 배열 (매장 목록)

3. **헬스 체크:**
   ```
   https://project-18-rls8.onrender.com/health
   ```
   예상 응답: `{"status":"OK","message":"S2S Backend is running"}`

### 2단계: Vercel 환경 변수 설정 (중요!)

⚠️ **현재 에러 원인**: 환경 변수에 잘못된 URL이 설정되어 있습니다!

**에러 메시지에서 보이는 URL**: `https://s2s-backend.onrender.com/api` ❌
**실제 Render URL**: `https://project-18-rls8.onrender.com` ✅

#### 해결 방법:

1. **Vercel 대시보드 접속**
   - https://vercel.com → 프로젝트 선택

2. **Settings → Environment Variables**

3. **기존 `VITE_API_BASE_URL` 확인:**
   - 현재 값이 `https://s2s-backend.onrender.com/api`라면 수정 필요!

4. **올바른 값으로 수정 또는 추가:**
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://project-18-rls8.onrender.com/api` ⚠️ **반드시 이 URL로!**
   - **Environment**: Production, Preview, Development 모두 선택 ✅

5. **Save 클릭**

6. **재배포 필수!** (가장 중요!)
   - Deployments 탭 → 최신 배포의 "..." → **Redeploy**
   - 환경 변수는 빌드 시점에 포함되므로 재배포 없이는 적용되지 않음!

### 3단계: 확인

1. Vercel 앱 새로고침
2. 브라우저 콘솔(F12)에서 API URL 확인
3. 정상 작동 확인!

## ⚠️ 주의사항

- 환경 변수 저장 후 **반드시 재배포**해야 합니다!
- Render 무료 플랜은 15분간 요청이 없으면 sleep됩니다
- 첫 요청 시 약 30초 지연될 수 있습니다

## 이메일 연결 타임아웃

현재 이메일 서비스 연결이 타임아웃되고 있지만, 이는 나중에 해결 가능합니다:
- 서버는 정상 작동 중
- API는 모두 사용 가능
- 이메일 기능만 나중에 수정하면 됨
