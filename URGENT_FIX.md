# 🚨 긴급 수정 가이드

## 문제 상황
- 에러 메시지: `https://s2s-backend.onrender.com/api` → 404
- 실제 Render URL: `https://project-18-rls8.onrender.com`

## 즉시 해야 할 일

### Vercel 환경 변수 수정

1. **Vercel 대시보드 접속**
   - https://vercel.com → 프로젝트 선택

2. **Settings → Environment Variables**

3. **`VITE_API_BASE_URL` 찾기**
   - 기존 값이 `https://s2s-backend.onrender.com/api`인지 확인

4. **값 수정:**
   - **기존 값 삭제** 또는 **Edit 클릭**
   - **새 값 입력**: `https://project-18-rls8.onrender.com/api`
   - **Environment**: Production, Preview, Development 모두 선택 ✅
   - **Save**

5. **재배포 (필수!):**
   - Deployments 탭으로 이동
   - 최신 배포의 "..." (오른쪽 상단) 클릭
   - **Redeploy** 선택
   - 배포 완료 대기 (약 1-2분)

6. **확인:**
   - 배포 완료 후 Vercel 앱 새로고침
   - 브라우저 콘솔(F12)에서 API URL 확인
   - `https://project-18-rls8.onrender.com/api`로 변경되었는지 확인

## 체크리스트

- [ ] Vercel 환경 변수 `VITE_API_BASE_URL` 확인
- [ ] 값이 `https://project-18-rls8.onrender.com/api`인지 확인
- [ ] Production, Preview, Development 모두에 설정
- [ ] Save 클릭
- [ ] 재배포 완료
- [ ] 브라우저 콘솔에서 올바른 URL 확인

## 왜 재배포가 필요한가?

Vite는 **빌드 시점**에 환경 변수를 번들에 포함시킵니다.
환경 변수를 변경해도 재배포하지 않으면 이전 값이 계속 사용됩니다!
