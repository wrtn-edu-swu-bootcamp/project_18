import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

const STATUS_LABELS = {
  'requested': '요청됨',
  'approved': '승인됨',
  'in_transit': '배송중',
  'completed': '완료'
};

const STATUS_COLORS = {
  'requested': { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },
  'approved': { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  'in_transit': { bg: '#fed7aa', text: '#9a3412', border: '#f97316' },
  'completed': { bg: '#d1fae5', text: '#065f46', border: '#10b981' }
};

export default function Outgoing() {
  const [requests, setRequests] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const navigate = useNavigate();

  useEffect(() => {
    async function initializeStore() {
      console.log('📤 [Outgoing] 페이지 초기화 시작');
      
      const storedId = localStorage.getItem('currentStore');
      console.log('📤 [Outgoing] localStorage.currentStore:', storedId);
      console.log('📤 [Outgoing] localStorage 전체:', { ...localStorage });
      
      if (!storedId) {
        console.log('❌ [Outgoing] currentStore가 없어서 로그인 페이지로 이동');
        alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
        navigate('/');
        return;
      }
      
      try {
        const stores = await getStores();
        console.log('📤 [Outgoing] 백엔드에서 가져온 매장 목록:', stores.map(s => s.id));
        
        const store = stores.find(s => s.id === storedId);
        
        if (!store) {
          console.log('❌ [Outgoing] 매장을 찾을 수 없음:', storedId);
          alert(`매장 "${storedId}"을 찾을 수 없습니다. 다시 로그인해주세요.`);
          navigate('/');
          return;
        }
        
        console.log('✅ [Outgoing] 매장 찾음:', store);
        setCurrentStore(store);
        loadRequests(store.id);
      } catch (error) {
        console.error('❌ [Outgoing] 매장 정보 로드 실패:', error);
        alert('매장 정보를 불러오는데 실패했습니다.');
        navigate('/');
      }
    }
    
    initializeStore();
  }, [navigate]);

  async function loadRequests(storeId) {
    try {
      const response = await fetch(`${API_BASE}/requests/outgoing/${storeId}`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('출고 요청 불러오기 실패:', error);
    }
  }

  async function handleApprove(requestId) {
    try {
      const response = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      });
      
      if (response.ok) {
        await loadRequests(currentStore.id);
      }
    } catch (error) {
      console.error('요청 승인 처리 실패:', error);
    }
  }

  async function handleShip(requestId) {
    try {
      const response = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_transit' })
      });
      
      if (response.ok) {
        await loadRequests(currentStore.id);
      }
    } catch (error) {
      console.error('배송 처리 실패:', error);
    }
  }

  async function handleComplete(requestId) {
    try {
      const response = await fetch(`${API_BASE}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });
      
      if (response.ok) {
        await loadRequests(currentStore.id);
      }
    } catch (error) {
      console.error('요청 완료 처리 실패:', error);
    }
  }

  // 출고 처리 페이지는 요청됨과 승인됨 상태만 표시
  const pendingRequests = requests.filter(r => r.status === 'requested' || r.status === 'approved');
  
  const filteredRequests = statusFilter === 'all'
    ? pendingRequests
    : pendingRequests.filter(r => r.status === statusFilter);

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (sortBy === 'date-asc') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => navigate('/home')}
              style={{ marginRight: '1rem', color: '#6b7280', background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}
            >
              ← 뒤로
            </button>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>📤 출고 대기</h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{currentStore?.name} - 타 매장이 요청한 재고</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* 필터 및 정렬 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setStatusFilter('all')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: statusFilter === 'all' ? '#3b82f6' : '#f3f4f6',
                  color: statusFilter === 'all' ? 'white' : '#374151',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                전체 ({pendingRequests.length})
              </button>
              {/* 요청됨, 승인됨만 표시 */}
              {['requested', 'approved'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    backgroundColor: statusFilter === status ? STATUS_COLORS[status].bg : '#f3f4f6',
                    color: statusFilter === status ? STATUS_COLORS[status].text : '#374151',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {STATUS_LABELS[status]} ({pendingRequests.filter(r => r.status === status).length})
                </button>
              ))}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <option value="date-desc">최신순</option>
              <option value="date-asc">오래된순</option>
            </select>
          </div>
        </div>

        {/* 요청 목록 테이블 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제품명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>수량</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>요청 매장</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>요청일</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>요청자</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>특이사항</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>상태</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>처리</th>
                </tr>
              </thead>
              <tbody>
                {sortedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                      {statusFilter === 'all' ? '출고 요청 내역이 없습니다.' : `${STATUS_LABELS[statusFilter]} 상태의 요청이 없습니다.`}
                    </td>
                  </tr>
                ) : (
                  sortedRequests.map((request) => (
                    <tr key={request.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: '500' }}>
                        {request.item}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', fontWeight: 'bold' }}>
                        {request.quantity}개
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {request.fromStoreName}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center', color: '#6b7280' }}>
                        {new Date(request.createdAt).toLocaleString('ko-KR', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                        {request.requesterName}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        {request.needsInspection ? (
                          <span style={{ 
                            backgroundColor: '#fef3c7', 
                            color: '#92400e', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '0.25rem',
                            fontWeight: '500'
                          }}>
                            🧼 검수 필요
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
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
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {request.status === 'requested' && (
                          <button
                            onClick={() => {
                              if (window.confirm('이 요청을 승인하시겠습니까?')) {
                                handleApprove(request.id);
                              }
                            }}
                            style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            승인
                          </button>
                        )}
                        {request.status === 'approved' && (
                          <button
                            onClick={() => {
                              if (window.confirm('배송을 시작하시겠습니까?')) {
                                handleShip(request.id);
                              }
                            }}
                            style={{
                              backgroundColor: '#f97316',
                              color: 'white',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            배송
                          </button>
                        )}
                        {(request.status === 'in_transit' || request.status === 'completed') && (
                          <span style={{ color: '#10b981', fontSize: '0.875rem', fontWeight: '600' }}>✓</span>
                        )}
                        {request.status !== 'requested' && request.status !== 'approved' && request.status !== 'in_transit' && request.status !== 'completed' && (
                          <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
