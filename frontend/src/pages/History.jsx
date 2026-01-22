import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

export default function History() {
  const [requests, setRequests] = useState([]);
  const [myStore, setMyStore] = useState(null);
  const [allStores, setAllStores] = useState([]);
  const [viewMode, setViewMode] = useState('sent');
  const navigate = useNavigate();

  // 필터 상태
  const [filters, setFilters] = useState({
    storeId: 'all',
    periodYear: new Date().getFullYear(),
    periodMonth: new Date().getMonth() + 1,
    productName: '',
    quantityCondition: 'all',
    quantityValue: ''
  });

  useEffect(() => {
    async function initializeHistory() {
      const storedId = localStorage.getItem('myStore');
      if (!storedId) {
        navigate('/');
        return;
      }
      
      try {
        const stores = await getStores();
        const store = stores.find(s => s.id === storedId);
        
        if (!store) {
          navigate('/');
          return;
        }
        
        setMyStore(store);
        setAllStores(stores);
        loadRequests(store.id);
      } catch (error) {
        console.error('매장 정보 로드 실패:', error);
        navigate('/');
      }
    }
    
    initializeHistory();
  }, [navigate]);

  async function loadRequests(storeId) {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        fetch(`${API_BASE}/requests/incoming/${storeId}`),  // 요청한 거래 (fromStoreId === myStore, 내가 다른 매장에 요청한 것)
        fetch(`${API_BASE}/requests/outgoing/${storeId}`)   // 받은 요청 (toStoreId === myStore, 다른 매장이 나에게 요청한 것)
      ]);
      
      const sent = await sentRes.json();
      const received = await receivedRes.json();
      
      setRequests({ sent, received });
    } catch (error) {
      console.error('거래 내역 불러오기 실패:', error);
      setRequests({ sent: [], received: [] });
    }
  }

  function resetFilters() {
    setFilters({
      storeId: 'all',
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
      productName: '',
      quantityCondition: 'all',
      quantityValue: ''
    });
  }

  const currentRequests = viewMode === 'sent' ? requests.sent : requests.received;

  const filteredRequests = (currentRequests || []).filter(request => {
    // 매장 필터
    if (filters.storeId !== 'all') {
      const targetStoreId = viewMode === 'sent' ? request.fromStoreId : request.toStoreId;
      if (targetStoreId !== filters.storeId) return false;
    }

    // 기간 필터
    const requestDate = new Date(request.createdAt);
    if (requestDate.getFullYear() !== filters.periodYear || 
        requestDate.getMonth() + 1 !== filters.periodMonth) {
      return false;
    }

    // 제품명 필터
    if (filters.productName && !request.item.toLowerCase().includes(filters.productName.toLowerCase())) {
      return false;
    }

    // 수량 조건 필터
    if (filters.quantityCondition !== 'all' && filters.quantityValue) {
      const qty = parseInt(filters.quantityValue);
      if (filters.quantityCondition === 'gte' && request.quantity < qty) return false;
      if (filters.quantityCondition === 'lte' && request.quantity > qty) return false;
    }

    return true;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  const getStatusColor = (status) => {
    const colors = {
      'requested': { bg: '#f3f4f6', text: '#6b7280' },
      'approved': { bg: '#dbeafe', text: '#1e40af' },
      'in_transit': { bg: '#fed7aa', text: '#9a3412' },
      'completed': { bg: '#d1fae5', text: '#065f46' }
    };
    return colors[status] || colors['requested'];
  };

  const getStatusLabel = (status) => {
    const labels = {
      'requested': '요청됨',
      'approved': '승인됨',
      'in_transit': '배송중',
      'completed': '완료'
    };
    return labels[status] || status;
  };

  // 연도 옵션 (최근 3년)
  const yearOptions = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/home')}
            style={{ marginRight: '1rem', color: '#6b7280', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
          >
            ← 뒤로
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>📊 거래 내역</h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{myStore?.name}</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* 필터 영역 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>🔍 검색 필터</h2>
            <button
              onClick={resetFilters}
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              초기화
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* 거래 매장 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                거래 매장
              </label>
              <select
                value={filters.storeId}
                onChange={(e) => setFilters({...filters, storeId: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              >
                <option value="all">전체</option>
                {allStores.filter(s => s.id !== myStore?.id).map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>

            {/* 거래 기간 (연도) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                거래 연도
              </label>
              <select
                value={filters.periodYear}
                onChange={(e) => setFilters({...filters, periodYear: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>

            {/* 거래 기간 (월) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                거래 월
              </label>
              <select
                value={filters.periodMonth}
                onChange={(e) => setFilters({...filters, periodMonth: parseInt(e.target.value)})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              >
                {monthOptions.map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>

            {/* 제품명 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                제품명
              </label>
              <input
                type="text"
                placeholder="제품명 검색"
                value={filters.productName}
                onChange={(e) => setFilters({...filters, productName: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>

            {/* 수량 조건 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                수량 조건
              </label>
              <select
                value={filters.quantityCondition}
                onChange={(e) => setFilters({...filters, quantityCondition: e.target.value})}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              >
                <option value="all">전체</option>
                <option value="gte">이상 (≥)</option>
                <option value="lte">이하 (≤)</option>
              </select>
            </div>

            {/* 수량 값 */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                수량
              </label>
              <input
                type="number"
                placeholder="수량"
                value={filters.quantityValue}
                onChange={(e) => setFilters({...filters, quantityValue: e.target.value})}
                disabled={filters.quantityCondition === 'all'}
                style={{ 
                  width: '100%', 
                  padding: '0.5rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  opacity: filters.quantityCondition === 'all' ? 0.5 : 1
                }}
              />
            </div>
          </div>
        </div>

        {/* 보기 모드 토글 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
            <button
              onClick={() => setViewMode('sent')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: viewMode === 'sent' ? '#eff6ff' : 'transparent',
                color: viewMode === 'sent' ? '#1e40af' : '#6b7280',
                fontWeight: viewMode === 'sent' ? '600' : '400',
                cursor: 'pointer',
                borderBottom: viewMode === 'sent' ? '3px solid #3b82f6' : 'none'
              }}
            >
              요청한 거래 ({requests.sent?.length || 0})
            </button>
            <button
              onClick={() => setViewMode('received')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                backgroundColor: viewMode === 'received' ? '#eff6ff' : 'transparent',
                color: viewMode === 'received' ? '#1e40af' : '#6b7280',
                fontWeight: viewMode === 'received' ? '600' : '400',
                cursor: 'pointer',
                borderBottom: viewMode === 'received' ? '3px solid #3b82f6' : 'none'
              }}
            >
              받은 요청 ({requests.received?.length || 0})
            </button>
          </div>
        </div>

        {/* 거래 내역 카드 */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {sortedRequests.length === 0 ? (
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              필터 조건에 맞는 거래 내역이 없습니다.
            </div>
          ) : (
            sortedRequests.map((request) => (
              <div key={request.id} style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem', fontFamily: 'monospace' }}>
                      {request.item}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {viewMode === 'sent' ? `받을 매장: ${request.fromStoreName}` : `보낼 매장: ${request.toStoreName}`}
                    </p>
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: getStatusColor(request.status).bg,
                    color: getStatusColor(request.status).text,
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {getStatusLabel(request.status)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>수량</p>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{request.quantity}개</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>요청자</p>
                    <p style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{request.requesterName}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>거래일시</p>
                    <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827' }}>
                      {new Date(request.createdAt).toLocaleString('ko-KR', { 
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {request.emailSent && (
                  <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: '500' }}>
                    ✉️ 메일 전송 완료
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
