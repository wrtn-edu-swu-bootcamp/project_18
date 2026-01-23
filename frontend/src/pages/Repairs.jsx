import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export default function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('수선 전');
  const [newRepair, setNewRepair] = useState({
    managerName: '',
    customerName: '',
    productId: '',
    repairContent: '',
    cost: 0,
    paymentStatus: '미불',
    repairStatus: '수선 전',
    delivered: false,
    notificationSent: false,
    estimatedMinutes: 30,
    sentAt: null
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function initializeRepairs() {
      const storedId = localStorage.getItem('myStore');
      const storedAdminName = localStorage.getItem('adminName');
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
        
        setCurrentStore(store);
        setInventory(store.inventory || []);
        setAdminName(storedAdminName || 'admin1');
        loadRepairs(store.id);
        
        // Home에서 전달받은 초기 탭 설정
        if (location.state?.initialTab) {
          setStatusFilter(location.state.initialTab);
        }
      } catch (error) {
        console.error('매장 정보 로드 실패:', error);
        navigate('/');
      }
    }
    
    initializeRepairs();
  }, [navigate, location]);

  // 자동 수선 완료 체크 (5초마다)
  useEffect(() => {
    if (!currentStore) return;
    
    const interval = setInterval(() => {
      checkAndCompleteRepairs();
    }, 5000); // 5초마다 체크
    
    return () => clearInterval(interval);
  }, [currentStore]);

  // 남은 시간 실시간 업데이트 (1초마다 리렌더링)
  useEffect(() => {
    if (statusFilter !== '수선 중') return;
    
    const interval = setInterval(() => {
      // 강제 리렌더링으로 남은 시간 업데이트
      setRepairs(prev => [...prev]);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [statusFilter]);

  async function checkAndCompleteRepairs() {
    if (!currentStore) return;
    
    // 최신 데이터 가져오기
    const response = await fetch(`${API_BASE}/repairs/store/${currentStore.id}`);
    const latestRepairs = await response.json();
    
    const now = new Date();
    const toComplete = latestRepairs.filter(repair => {
      if (repair.repairStatus === '수선 중' && repair.sentAt) {
        const sentTime = new Date(repair.sentAt);
        const elapsedMinutes = (now - sentTime) / 1000 / 60;
        console.log(`[자동 체크] ${repair.productId}: ${elapsedMinutes.toFixed(1)}분 경과 / ${repair.estimatedMinutes}분 예상`);
        return elapsedMinutes >= (repair.estimatedMinutes || 30);
      }
      return false;
    });

    if (toComplete.length > 0) {
      console.log(`🎉 ${toComplete.length}건의 수선이 완료되었습니다!`);
      for (const repair of toComplete) {
        await handleUpdateRepair(repair.id, { 
          repairStatus: '수선 완료',
          completedAt: now.toISOString()
        });
      }
    }
  }

  async function loadRepairs(storeId) {
    try {
      const response = await fetch(`${API_BASE}/repairs/store/${storeId}`);
      const data = await response.json();
      setRepairs(data);
    } catch (error) {
      console.error('수선 내역 불러오기 실패:', error);
    }
  }

  async function handleAddRepair() {
    if (!newRepair.customerName || !newRepair.productId || !newRepair.repairContent) {
      alert('필수 항목을 입력해주세요');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/repairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRepair,
          managerName: newRepair.managerName || adminName,
          adminName: adminName,
          storeId: currentStore.id,
          storeName: currentStore.name
        })
      });
      
      if (response.ok) {
        await loadRepairs(currentStore.id);
        setNewRepair({
          managerName: '',
          customerName: '',
          productId: '',
          repairContent: '',
          cost: 0,
          paymentStatus: '미불',
          repairStatus: '수선 전',
          delivered: false,
          notificationSent: false,
          estimatedMinutes: 30,
          sentAt: null
        });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('수선 내역 추가 실패:', error);
    }
  }

  async function handleUpdateRepair(repairId, updates) {
    try {
      const response = await fetch(`${API_BASE}/repairs/${repairId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        await loadRepairs(currentStore.id);
      }
    } catch (error) {
      console.error('수선 내역 업데이트 실패:', error);
    }
  }

  async function handleSendToRepair(repair, estimatedMinutes) {
    await handleUpdateRepair(repair.id, {
      repairStatus: '수선 중',
      sentAt: new Date().toISOString(),
      estimatedMinutes: estimatedMinutes
    });
  }

  function getRemainingTime(repair) {
    if (!repair.sentAt) return null;
    
    const now = new Date();
    const sentTime = new Date(repair.sentAt);
    const elapsedMinutes = (now - sentTime) / 1000 / 60;
    const remainingMinutes = Math.max(0, (repair.estimatedMinutes || 30) - elapsedMinutes);
    
    if (remainingMinutes === 0) return '완료 대기 중...';
    if (remainingMinutes < 0.1) return '곧 완료';
    if (remainingMinutes < 1) return `${Math.ceil(remainingMinutes * 60)}초 남음`;
    return `${Math.ceil(remainingMinutes)}분 남음`;
  }

  async function handleSendSingleNotification(repair) {
    if (repair.delivered) {
      alert('이미 전달 완료된 고객입니다.');
      return;
    }
    
    if (repair.notificationSent) {
      alert('이미 알림톡을 발송한 고객입니다.');
      return;
    }
    
    const message = `${repair.customerName}님, 맡기신 ${repair.productId} 수선이 완료되었습니다.`;
    
    if (window.confirm(`알림톡을 발송하시겠습니까?\n\n${message}`)) {
      console.log(`📱 [알림톡 발송] ${message}`);
      
      // 알림톡 발송 상태 업데이트
      await handleUpdateRepair(repair.id, { notificationSent: true });
      
      alert('✅ 알림톡이 발송되었습니다!');
    }
  }

  const filteredRepairs = repairs.filter(repair => repair.repairStatus === statusFilter);

  const getStatusColor = (status) => {
    const colors = {
      '수선 전': { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
      '수선 중': { bg: '#dbeafe', text: '#1e3a8a', border: '#3b82f6' },
      '수선 완료': { bg: '#d1fae5', text: '#065f46', border: '#10b981' }
    };
    return colors[status] || colors['수선 전'];
  };

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
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>🧵 수선 관리</h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{currentStore?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            + 수선 등록
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* 수선 등록 폼 */}
        {showAddForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>수선 등록</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <select
                value={newRepair.managerName || adminName}
                onChange={(e) => setNewRepair({...newRepair, managerName: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}
              >
                <option value="admin1">admin1</option>
                <option value="admin2">admin2</option>
                <option value="admin3">admin3</option>
                <option value="admin4">admin4</option>
              </select>
              <input
                type="text"
                placeholder="고객명 (예: 이*민)"
                value={newRepair.customerName}
                onChange={(e) => setNewRepair({...newRepair, customerName: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />
              <select
                value={newRepair.productId}
                onChange={(e) => setNewRepair({...newRepair, productId: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}
              >
                <option value="">제품 선택</option>
                {inventory.map((item, index) => (
                  <option key={index} value={`${item.category}_${item.color}`}>
                    {item.category}_{item.color} (재고: {item.stockQuantity}개)
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="수선 내용 (예: 소매 수선)"
                value={newRepair.repairContent}
                onChange={(e) => setNewRepair({...newRepair, repairContent: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />
              <input
                type="number"
                placeholder="비용 (원)"
                value={newRepair.cost || ''}
                onChange={(e) => setNewRepair({...newRepair, cost: parseInt(e.target.value) || 0})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem' }}
              />
              <select
                value={newRepair.paymentStatus}
                onChange={(e) => setNewRepair({...newRepair, paymentStatus: e.target.value})}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer' }}
              >
                <option value="미불">미불</option>
                <option value="완불">완불</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleAddRepair}
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  padding: '0.5rem 1.5rem', 
                  borderRadius: '0.5rem', 
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                등록
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                style={{ 
                  backgroundColor: '#e5e7eb', 
                  color: '#374151', 
                  padding: '0.5rem 1.5rem', 
                  borderRadius: '0.5rem', 
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 상태 필터 탭 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb' }}>
            {['수선 전', '수선 중', '수선 완료'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  border: 'none',
                  backgroundColor: statusFilter === status ? getStatusColor(status).bg : 'transparent',
                  color: statusFilter === status ? getStatusColor(status).text : '#6b7280',
                  fontWeight: statusFilter === status ? '600' : '400',
                  cursor: 'pointer',
                  borderBottom: statusFilter === status ? `3px solid ${getStatusColor(status).border}` : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {status} ({repairs.filter(r => r.repairStatus === status).length})
              </button>
            ))}
          </div>
        </div>

        {/* 수선 내역 테이블 */}
        <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>관리자</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>고객명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제품명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>수선 내용</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>비용</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>결제 상태</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                    {statusFilter === '수선 전' ? '수선 보내기' : statusFilter === '수선 중' ? '예상 시간' : '전달 여부'}
                  </th>
                  {statusFilter === '수선 완료' && (
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>알림톡</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.length === 0 ? (
                  <tr>
                    <td colSpan={statusFilter === '수선 완료' ? "8" : "7"} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                      {statusFilter} 수선 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredRepairs.map((repair) => (
                    <tr key={repair.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{repair.managerName || '-'}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>{repair.customerName}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>{repair.productId}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{repair.repairContent}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '500' }}>
                        {repair.cost.toLocaleString()}원
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <select
                          value={repair.paymentStatus}
                          onChange={(e) => handleUpdateRepair(repair.id, { paymentStatus: e.target.value })}
                          style={{ 
                            padding: '0.25rem 0.5rem', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '0.375rem',
                            backgroundColor: repair.paymentStatus === '완불' ? '#d1fae5' : '#fee2e2',
                            color: repair.paymentStatus === '완불' ? '#065f46' : '#991b1b',
                            fontWeight: '500',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="미불">미불</option>
                          <option value="완불">완불</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {statusFilter === '수선 전' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                              defaultValue={repair.estimatedMinutes || 30}
                              onChange={(e) => {
                                const minutes = parseInt(e.target.value);
                                repairs.find(r => r.id === repair.id).tempEstimatedMinutes = minutes;
                              }}
                              style={{ 
                                padding: '0.25rem 0.5rem', 
                                border: '1px solid #d1d5db', 
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                cursor: 'pointer'
                              }}
                            >
                              <option value={1}>1분 (테스트)</option>
                              <option value={2}>2분 (테스트)</option>
                              <option value={5}>5분 (테스트)</option>
                              <option value={30}>30분</option>
                              <option value={60}>1시간</option>
                            </select>
                            <button
                              onClick={(e) => {
                                const selectElement = e.target.previousElementSibling;
                                const minutes = parseInt(selectElement.value);
                                handleSendToRepair(repair, minutes);
                              }}
                              style={{
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              📤 보내기
                            </button>
                          </div>
                        ) : statusFilter === '수선 중' ? (
                          <div style={{ fontSize: '0.875rem' }}>
                            <div style={{ 
                              padding: '0.5rem', 
                              backgroundColor: '#dbeafe', 
                              borderRadius: '0.375rem',
                              border: '1px solid #3b82f6',
                              marginBottom: '0.25rem'
                            }}>
                              <div style={{ fontWeight: '600', color: '#1e3a8a' }}>
                                {getRemainingTime(repair)}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                              예상: {repair.estimatedMinutes || 30}분
                            </div>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="checkbox"
                              checked={repair.delivered}
                              disabled={repair.paymentStatus === '미불'}
                              onChange={(e) => handleUpdateRepair(repair.id, { delivered: e.target.checked })}
                              style={{ 
                                width: '1.25rem', 
                                height: '1.25rem', 
                                cursor: repair.paymentStatus === '미불' ? 'not-allowed' : 'pointer',
                                opacity: repair.paymentStatus === '미불' ? 0.5 : 1
                              }}
                            />
                            <p style={{ fontSize: '0.75rem', color: repair.paymentStatus === '미불' ? '#d1d5db' : '#6b7280', marginTop: '0.25rem' }}>
                              {repair.delivered ? 'O' : 'X'}
                            </p>
                          </div>
                        )}
                      </td>
                      {statusFilter === '수선 완료' && (
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          {repair.notificationSent ? (
                            <div style={{ 
                              padding: '0.5rem 0.75rem',
                              backgroundColor: '#d1fae5',
                              color: '#065f46',
                              border: '1px solid #10b981',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              whiteSpace: 'nowrap'
                            }}>
                              ✅ 발송완료
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSendSingleNotification(repair)}
                              disabled={repair.delivered}
                              style={{
                                padding: '0.5rem 0.75rem',
                                backgroundColor: repair.delivered ? '#e5e7eb' : '#f59e0b',
                                color: repair.delivered ? '#9ca3af' : 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: repair.delivered ? 'not-allowed' : 'pointer',
                                transition: '0.2s',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseOver={(e) => {
                                if (!repair.delivered) {
                                  e.currentTarget.style.backgroundColor = '#d97706';
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!repair.delivered) {
                                  e.currentTarget.style.backgroundColor = '#f59e0b';
                                }
                              }}
                            >
                              💬 발송
                            </button>
                          )}
                        </td>
                      )}
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
