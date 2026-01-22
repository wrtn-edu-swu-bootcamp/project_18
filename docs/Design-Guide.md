# S2S 재고 관리 시스템 - Design Guide

## 1. 디자인 원칙

### 1.1 핵심 원칙
- **명확성 (Clarity)**: 정보를 직관적으로 전달
- **일관성 (Consistency)**: 통일된 UI 패턴 사용
- **효율성 (Efficiency)**: 최소한의 클릭으로 업무 완료
- **접근성 (Accessibility)**: 다양한 디바이스에서 사용 가능

### 1.2 디자인 철학
- 업무 효율을 최우선으로 하는 실용적 디자인
- 상태와 긴급도를 색상으로 즉시 인지 가능
- 모바일 환경에서도 쉬운 터치 인터페이스

---

## 2. 컬러 시스템

### 2.1 브랜드 컬러

| 용도 | 색상명 | HEX | 사용처 |
|------|--------|-----|--------|
| Primary | Blue 500 | `#3b82f6` | 주요 버튼, 링크, 강조 |
| Primary Dark | Blue 600 | `#2563eb` | 버튼 호버 |
| Secondary | Slate 800 | `#1e293b` | 다크 헤더 |

### 2.2 시맨틱 컬러 (상태 표시)

| 상태 | 배경색 | 텍스트 | 테두리 | 용도 |
|------|--------|--------|--------|------|
| 성공/완료 | `#d1fae5` | `#065f46` | `#10b981` | 완료 상태, 수선완료 |
| 경고/주의 | `#fef3c7` | `#92400e` | `#fbbf24` | 수선전, 검수필요 |
| 정보/진행 | `#dbeafe` | `#1e40af` | `#3b82f6` | 수선중, 승인됨 |
| 오류/미완료 | `#fee2e2` | `#991b1b` | `#ef4444` | 미불, 재고부족 |
| 배송중 | `#fed7aa` | `#9a3412` | `#f97316` | 배송중 상태 |

### 2.3 요청 상태별 컬러

```javascript
const STATUS_COLORS = {
  'requested': { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },  // 요청됨 (회색)
  'approved':  { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },  // 승인됨 (파랑)
  'in_transit':{ bg: '#fed7aa', text: '#9a3412', border: '#f97316' },  // 배송중 (주황)
  'completed': { bg: '#d1fae5', text: '#065f46', border: '#10b981' }   // 완료 (초록)
};
```

### 2.4 수선 상태별 컬러

```javascript
const REPAIR_COLORS = {
  '수선 전':   { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },  // 노랑
  '수선 중':   { bg: '#dbeafe', text: '#1e3a8a', border: '#3b82f6' },  // 파랑
  '수선 완료': { bg: '#d1fae5', text: '#065f46', border: '#10b981' }   // 초록
};
```

### 2.5 긴급도 컬러

| 긴급도 | 배경색 | 테두리색 | 사용처 |
|--------|--------|----------|--------|
| 긴급 (출고) | `#fff7ed` | `#fb923c` | 출고 처리 필요 |
| 긴급 (수선) | `#fdf2f8` | `#ec4899` | 수선 전달 필요 |
| 대기 (입고) | `#eff6ff` | `#3b82f6` | 입고 대기 |
| 대기 (메일) | `#fef3c7` | `#f59e0b` | 고객 메일 |

### 2.6 그레이스케일

| 명칭 | HEX | 용도 |
|------|-----|------|
| Gray 50 | `#f9fafb` | 페이지 배경 |
| Gray 100 | `#f3f4f6` | 카드 배경, 테이블 헤더 |
| Gray 200 | `#e5e7eb` | 테두리 |
| Gray 300 | `#d1d5db` | 입력 필드 테두리 |
| Gray 400 | `#9ca3af` | 비활성 텍스트 |
| Gray 500 | `#6b7280` | 보조 텍스트 |
| Gray 600 | `#4b5563` | 본문 텍스트 |
| Gray 700 | `#374151` | 헤딩 텍스트 |
| Gray 800 | `#1f2937` | 강조 텍스트 |
| Gray 900 | `#111827` | 제목 |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 
             'Helvetica Neue', sans-serif;
```

### 3.2 폰트 사이즈 스케일

| 명칭 | 크기 | Line Height | 용도 |
|------|------|-------------|------|
| xs | 0.625rem (10px) | 1.4 | 사이즈 박스 내 보조 텍스트 |
| sm | 0.75rem (12px) | 1.4 | 뱃지, 라벨, 보조 정보 |
| base | 0.875rem (14px) | 1.5 | 본문, 테이블 셀 |
| lg | 1rem (16px) | 1.5 | 버튼, 입력 필드 |
| xl | 1.125rem (18px) | 1.6 | 카드 제목 |
| 2xl | 1.25rem (20px) | 1.6 | 페이지 제목 |
| 3xl | 1.5rem (24px) | 1.4 | 대시보드 숫자 |
| 4xl | 2rem (32px) | 1.3 | 긴급 카운터 |

### 3.3 폰트 두께

| 명칭 | 값 | 용도 |
|------|-----|------|
| Normal | 400 | 일반 본문 |
| Medium | 500 | 버튼, 라벨 |
| Semibold | 600 | 카드 제목, 강조 |
| Bold | 700 | 페이지 제목, 숫자 강조 |

### 3.4 코드/제품ID 스타일

```css
font-family: monospace;
font-weight: 500;
```

---

## 4. 간격 시스템 (Spacing)

### 4.1 기본 단위
기본 단위: `0.25rem (4px)`

| 명칭 | 값 | 픽셀 | 용도 |
|------|-----|------|------|
| 1 | 0.25rem | 4px | 아이콘 간격 |
| 2 | 0.5rem | 8px | 인라인 요소 간격 |
| 3 | 0.75rem | 12px | 작은 패딩 |
| 4 | 1rem | 16px | 기본 패딩/마진 |
| 5 | 1.25rem | 20px | 카드 내부 패딩 |
| 6 | 1.5rem | 24px | 섹션 간격 |
| 8 | 2rem | 32px | 큰 섹션 간격 |

### 4.2 레이아웃 간격

```css
/* 페이지 컨테이너 */
max-width: 1440px;
margin: 0 auto;
padding: 1.5rem 1rem;

/* 카드 간격 */
gap: 0.75rem;  /* 1rem 미만 */
gap: 1rem;     /* 기본 */

/* 섹션 간 간격 */
margin-bottom: 1.5rem;
```

---

## 5. 컴포넌트 스타일

### 5.1 버튼

#### Primary Button
```css
{
  backgroundColor: '#3b82f6',
  color: 'white',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: '500',
  cursor: 'pointer',
  transition: '0.2s'
}
/* Hover: backgroundColor: '#2563eb' */
```

#### Secondary Button
```css
{
  backgroundColor: '#e5e7eb',
  color: '#374151',
  padding: '0.5rem 1rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: '500',
  cursor: 'pointer'
}
```

#### Action Button (테이블 내)
```css
{
  padding: '0.375rem 0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  fontWeight: '500'
}
```

### 5.2 카드

```css
{
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  padding: '1.25rem'
}
/* Hover effect for clickable cards */
/* transform: translateY(-2px) */
```

### 5.3 입력 필드

```css
{
  width: '100%',
  padding: '0.75rem',
  fontSize: '1rem',
  border: '2px solid #e5e7eb',
  borderRadius: '0.5rem',
  backgroundColor: 'white',
  outline: 'none',
  transition: '0.2s'
}
/* Focus: borderColor: '#3b82f6' */
```

### 5.4 Select (드롭다운)

```css
{
  width: '100%',
  padding: '0.75rem',
  fontSize: '1rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  backgroundColor: 'white',
  cursor: 'pointer',
  outline: 'none'
}
```

### 5.5 테이블

```css
/* Container */
{
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  overflow: 'hidden'
}

/* Header */
{
  backgroundColor: '#f3f4f6',
  padding: '0.75rem',
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#374151'
}

/* Cell */
{
  padding: '0.75rem',
  fontSize: '0.875rem',
  borderTop: '1px solid #e5e7eb'
}
```

### 5.6 뱃지 (Badge)

```css
/* 카테고리 뱃지 */
{
  display: 'inline-block',
  backgroundColor: '#eff6ff',
  color: '#1e40af',
  padding: '0.25rem 0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  fontWeight: '600'
}

/* 상태 뱃지 */
{
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  fontSize: '0.75rem',
  fontWeight: '600'
}
```

### 5.7 모달

```css
/* Overlay */
{
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}

/* Modal Box */
{
  backgroundColor: 'white',
  borderRadius: '0.75rem',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  padding: '2rem',
  maxWidth: '500px',
  width: '90%',
  maxHeight: '90vh',
  overflowY: 'auto'
}
```

### 5.8 탭 (Tab)

```css
/* Tab Container */
{
  display: 'flex',
  borderBottom: '2px solid #e5e7eb'
}

/* Tab Item */
{
  flex: 1,
  padding: '1rem',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s'
}

/* Active Tab */
{
  backgroundColor: '[상태색 bg]',
  color: '[상태색 text]',
  fontWeight: '600',
  borderBottom: '3px solid [상태색 border]'
}
```

---

## 6. 아이콘 시스템

### 6.1 페이지 아이콘

| 페이지 | 아이콘 |
|--------|--------|
| Home | 🏪 |
| 재고 관리 | 📦 |
| 수선 관리 | 🧵 |
| 입고 대기 | 📨 |
| 출고 대기 | 📤 |
| 고객 정보 | 👥 |
| 재고 요청 | 📧 |
| 거래 내역 | 📊 |
| 관리자 기록 | 📋 |

### 6.2 상태/액션 아이콘

| 용도 | 아이콘 |
|------|--------|
| 긴급 | ⚡ |
| 경고 | ⚠️ |
| 완료 | ✓ / ✅ |
| 보내기 | 📤 |
| 알림톡 | 💬 |
| 검수 필요 | 🧼 |
| 시간 | ⏱️ |
| 랭킹 | 🏆 |

---

## 7. 반응형 디자인

### 7.1 브레이크포인트

```css
/* Mobile First */
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### 7.2 그리드 시스템

```css
/* 카드 그리드 */
display: grid;
gridTemplateColumns: repeat(auto-fit, minmax(200px, 1fr));
gap: 0.75rem;

/* 재고 카드 그리드 */
gridTemplateColumns: repeat(auto-fill, minmax(320px, 1fr));
```

### 7.3 컨테이너 최대 너비

```css
maxWidth: '1440px'  /* 기본 페이지 */
maxWidth: '1600px'  /* Home 대시보드 */
maxWidth: '500px'   /* 로그인, 모달 */
```

---

## 8. 애니메이션 & 트랜지션

### 8.1 기본 트랜지션

```css
transition: '0.2s'
```

### 8.2 호버 효과

```css
/* 카드 호버 */
onMouseOver: transform = 'translateY(-2px)'
onMouseOut: transform = 'translateY(0)'

/* 버튼 호버 */
onMouseOver: backgroundColor = '[darker shade]'
onMouseOut: backgroundColor = '[original color]'
```

### 8.3 로딩 스피너

```css
.animate-spin {
  animation: logo-spin infinite 1s linear;
}

@keyframes logo-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 9. 접근성 가이드라인

### 9.1 컬러 대비
- 텍스트와 배경의 대비율 최소 4.5:1 유지
- 상태 색상에 텍스트 라벨 함께 표시

### 9.2 터치 타겟
- 최소 터치 영역: 44px x 44px
- 버튼 패딩: 최소 0.5rem

### 9.3 포커스 표시

```css
input:focus, select:focus {
  border-color: '#3b82f6',
  box-shadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
}
```

---

## 10. 다크 모드 (헤더)

```css
/* Home 페이지 헤더 */
{
  backgroundColor: '#1e293b',  /* Slate 800 */
  color: 'white'
}

/* 헤더 내 버튼 */
{
  backgroundColor: 'rgba(255,255,255,0.1)',
  color: 'white',
  border: '1px solid rgba(255,255,255,0.3)'
}
```

---

## 11. 실사용 예시

### 11.1 긴급 처리 카드

```javascript
<div style={{
  backgroundColor: todayStats.outgoing > 0 ? '#fff7ed' : 'white',
  border: `2px solid ${todayStats.outgoing > 0 ? '#fb923c' : '#e2e8f0'}`,
  borderRadius: '0.5rem',
  padding: '1.25rem',
  cursor: 'pointer',
  transition: '0.2s'
}}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <span style={{ fontSize: '1.5rem' }}>📦</span>
    {todayStats.outgoing > 0 && (
      <span style={{ 
        fontSize: '0.75rem', 
        backgroundColor: '#fb923c', 
        color: 'white', 
        padding: '0.25rem 0.5rem', 
        borderRadius: '0.25rem', 
        fontWeight: '600' 
      }}>긴급</span>
    )}
  </div>
  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>출고 처리</p>
  <p style={{ 
    fontSize: '2rem', 
    fontWeight: 'bold', 
    color: todayStats.outgoing > 0 ? '#ea580c' : '#94a3b8' 
  }}>
    {todayStats.outgoing}
  </p>
</div>
```

### 11.2 상태 뱃지

```javascript
<span style={{
  display: 'inline-block',
  padding: '0.25rem 0.75rem',
  borderRadius: '0.375rem',
  fontSize: '0.875rem',
  fontWeight: '500',
  backgroundColor: STATUS_COLORS[request.status].bg,
  color: STATUS_COLORS[request.status].text,
  border: `1px solid ${STATUS_COLORS[request.status].border}`
}}>
  {STATUS_LABELS[request.status]}
</span>
```
