import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();
  const [selectedStore, setSelectedStore] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  const stores = [
    { id: 'store-nowon', name: '노원점' },
    { id: 'store-gangnam', name: '강남점' },
    { id: 'store-hongdae', name: '홍대점' },
    { id: 'store-jamsil', name: '잠실점' },
    { id: 'store-busan', name: '부산점' },
    { id: 'store-daegu', name: '대구점' }
  ];

  const admins = ['admin1', 'admin2', 'admin3', 'admin4'];

  const handleLogin = () => {
    if (!selectedStore) {
      alert('매장을 선택해주세요!');
      return;
    }

    if (!adminName) {
      alert('관리자를 선택해주세요!');
      return;
    }

    const store = stores.find(s => s.id === selectedStore);
    localStorage.setItem('myStore', store.id);
    localStorage.setItem('currentStore', store.id);
    localStorage.setItem('adminName', adminName);
    localStorage.setItem('adminEmail', adminEmail || '');
    
    console.log('✅ 로그인 성공! localStorage 저장:', {
      myStore: store.id,
      currentStore: store.id,
      adminName: adminName,
      adminEmail: adminEmail || ''
    });
    
    navigate('/home');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        padding: '3rem',
        maxWidth: '500px',
        width: '90%'
      }}>
        {/* 로고 영역 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>🏪</div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>S2S 재고 관리 시스템</h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>Store to Store Inventory Management</p>
        </div>

        {/* 매장 선택 영역 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            매장 선택
          </label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none',
              transition: '0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">매장을 선택하세요</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* 관리자 선택 영역 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            관리자 선택
          </label>
          <select
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              cursor: 'pointer',
              outline: 'none',
              transition: '0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          >
            <option value="">관리자를 선택하세요</option>
            {admins.map(admin => (
              <option key={admin} value={admin}>
                {admin}
              </option>
            ))}
          </select>
        </div>

        {/* 이메일 입력 영역 */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            📧 이메일 주소
          </label>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="이메일 주소 입력 (선택사항)"
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '0.5rem',
              backgroundColor: 'white',
              outline: 'none',
              transition: '0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.5rem',
            margin: '0.5rem 0 0 0'
          }}>
            💡 시뮬레이션 모드 (선택사항)
          </p>
        </div>

        {/* 로그인 버튼 */}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            color: 'white',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: '0.2s',
            boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          로그인
        </button>

        {/* 안내 문구 */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          color: '#6b7280',
          lineHeight: '1.5'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong style={{ color: '#374151' }}>📌 시스템 안내</strong>
          </p>
          <p>
            · 매장 간 재고 이동 및 수선 관리 시스템입니다.<br />
            · 소속 매장을 선택하여 업무를 시작하세요.<br />
            · 다른 매장 재고는 조회 전용으로 확인 가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
