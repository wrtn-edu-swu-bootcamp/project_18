# 🔧 문제 해결 가이드

## ⚠️ "API 오류 (404)" 해결 방법

### 1단계: Vercel 환경 변수 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com → 프로젝트 선택

2. **Settings → Environment Variables 확인**
   - `VITE_API_BASE_URL`이 있는지 확인
   - 값이 올바른지 확인:
     - ✅ 올바른 형식: `https://s2s-backend.onrender.com/api`
     - ❌ 잘못된 형식: `https://s2s-backend.onrender.com` (끝에 `/api` 없음)
     - ❌ 잘못된 형식: `http://localhost:3001/api` (로컬 주소)

3. **환경 변수가 없다면 추가:**
   - Key: `VITE_API_BASE_URL`
   - Value: `https://your-backend-url.onrender.com/api` (Render URL + `/api`)
   - Environment: Production, Preview, Development 모두 선택 ✅

4. **환경 변수 저장 후 재배포 필수!**
   - Deployments 탭 → 최신 배포의 "..." → **Redeploy**

### 2단계: Render 백엔드 확인

1. **Render 대시보드 접속**
   - https://render.com → 서비스 선택

2. **Logs 탭 확인**
   - `🚀 S2S Backend server running` 메시지가 있는지 확인
   - 에러가 있다면 확인

3. **서비스 URL 확인**
   - Settings → 서비스 URL 확인 (예: `https://s2s-backend.onrender.com`)

4. **직접 테스트:**
   - 브라우저에서 `https://your-backend-url.onrender.com/api/stores` 접속
   - JSON 응답이 오는지 확인
   - 404가 나오면 서버 문제

### 3단계: 브라우저 콘솔 확인

1. **F12 키 누르기** (개발자 도구 열기)
2. **Console 탭 확인**
   - 현재 사용 중인 API URL 확인
   - 에러 메시지 확인
3. **Network 탭 확인**
   - 실패한 요청 클릭
   - Request URL 확인
   - Status Code 확인

### 4단계: 환경 변수 디버깅

프론트엔드 코드에서 현재 API URL 확인:

1. 브라우저 콘솔에서 실행:
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api');
   ```

2. 예상 결과:
   - 프로덕션: `https://s2s-backend.onrender.com/api`
   - 로컬: `http://localhost:3001/api`

### 5단계: Render 서버 재시작

Render 서버가 sleep 상태일 수 있습니다:

1. Render 대시보드 → 서비스
2. **Manual Deploy** → **Clear build cache & deploy**
3. 배포 완료 대기 (2-3분)

### 6단계: Vercel 재배포

환경 변수를 변경했다면 반드시 재배포:

1. Vercel 대시보드 → Deployments
2. 최신 배포의 "..." → **Redeploy**
3. 또는 GitHub에 push하면 자동 재배포

## ✅ 체크리스트

- [ ] Render 백엔드가 정상 작동 중 (`/api/stores` 접속 시 JSON 응답)
- [ ] Vercel 환경 변수 `VITE_API_BASE_URL` 설정됨
- [ ] 환경 변수 값이 `https://xxx.onrender.com/api` 형식 (끝에 `/api` 포함)
- [ ] Production, Preview, Development 모두에 환경 변수 설정
- [ ] 환경 변수 저장 후 Vercel 재배포 완료
- [ ] 브라우저 콘솔에서 API URL 확인
- [ ] Render 서버가 sleep 상태가 아님

## 🚨 자주 발생하는 실수

1. **환경 변수 값에 `/api` 누락**
   - ❌ `https://s2s-backend.onrender.com`
   - ✅ `https://s2s-backend.onrender.com/api`

2. **환경 변수 저장 후 재배포 안 함**
   - 환경 변수는 빌드 시점에 포함되므로 재배포 필수!

3. **로컬 주소 사용**
   - ❌ `http://localhost:3001/api`
   - ✅ `https://s2s-backend.onrender.com/api`

4. **Render 서버 sleep 상태**
   - 무료 플랜은 15분간 요청 없으면 sleep
   - 첫 요청 시 30초 지연 가능

## 📞 추가 도움

위 방법으로 해결되지 않으면:
1. 브라우저 콘솔의 전체 에러 메시지
2. Vercel 환경 변수 스크린샷 (민감 정보 제외)
3. Render Logs의 최근 에러 메시지

이 정보들을 공유해주시면 더 정확히 도와드릴 수 있습니다.
