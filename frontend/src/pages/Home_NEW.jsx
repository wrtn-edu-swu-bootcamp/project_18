import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

export default function Home() {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [myStore, setMyStore] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [todayStats, setTodayStats] = useState({ outgoing: 0, repairs: 0, pending: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ 
    topRequests: [], 
    emptyDisplay: [], 
    avgProcessingTime: 0 
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (stores.length > 0) {
      const storedMyStoreName = localStorage.getItem('myStore');
      const storedAdminName = localStorage.getItem('adminName');
      
      setAdminName(storedAdminName || 'admin1');
      
      let myStoreObj;
      
      if (storedMyStoreName) {
        myStoreObj = stores.find(s => s.name === storedMyStoreName) || stores[0];
      } else {
        myStoreObj = stores.find(s => s.id === 'store-nowon') || stores[0];
      }
      
      setMyStore(myStoreObj);
      loadTodayStats(myStoreObj.id);
      loadMonthlyStats(myStoreObj.id);
      
      const storedCurrentName = localStorage.getItem('currentStore');
      if (storedCurrentName) {
        const currentStoreObj = stores.find(s => s.name === storedCurrentName) || myStoreObj;
        setCurrentStore(currentStoreObj);
        localStorage.setItem('currentStore', currentStoreObj.name);
      } else {
        setCurrentStore(myStoreObj);
        localStorage.setItem('currentStore', myStoreObj.name);
      }
    }
  }, [stores]);

  async function loadStores() {
    try {
      const data = await getStores();
      setStores(data);
    } catch (error) {
      console.error('매장 불러오기 실패:', error);
    }
  }

  async function loadTodayStats(storeId) {
    try {
      const [outgoingRes, repairsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE}/requests/outgoing/${storeId}`),
        fetch(`${API_BASE}/repairs/store/${storeId}`),
        fetch(`${API_BASE}/requests/incoming/${storeId}`)
      ]);
      
      const outgoing = await outgoingRes.json();
      const repairs = await repairsRes.json();
      const requests = await requestsRes.json();
      
      setTodayStats({
        outgoing: outgoing.filter(r => r.status === 'requested' || r.status === 'approved').length,
        repairs: repairs.filter(r => r.repairStatus === '수선 완료' && !r.delivered).length,
        pending: requests.filter(r => r.status !== 'completed').length
      });
    } catch (error) {
      console.error('오늘 통계 불러오기 실패:', error);
    }
  }

  async function loadMonthlyStats(storeId) {
    try {
      const [requestsRes, inventoryRes] = await Promise.all([
        fetch(`${API_BASE}/requests`),
        fetch(`${API_BASE}/stores/${storeId}/inventory`)
      ]);
      
      const requests = await requestsRes.json();
      const inventory = await inventoryRes.json();
      
      const itemCounts = {};
      requests.forEach(r => {
        if (r.toStoreId === storeId || r.fromStoreId === storeId) {
          itemCounts[r.item] = (itemCounts[r.item] || 0) + r.quantity;
        }
      });
      
      const topRequests = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([item, count]) => ({ item, count }));
      
      const emptyDisplay = inventory
        .filter(item => (item.displayQuantity || 0) === 0 && (item.stockQuantity || 0) > 0)
        .slice(0, 5)
        .map(item => ({ 
          item: item.id, 
          stockQuantity: item.stockQuantity 
        }));
      
      const completedRequests = requests.filter(r => 
        r.status === 'completed' && 
        r.createdAt && 
        r.updatedAt &&
        (r.toStoreId === storeId || r.fromStoreId === storeId)
      );
      
      let avgProcessingTime = 0;
      if (completedRequests.length > 0) {
        const totalTime = completedRequests.reduce((sum, r) => {
          const start = new Date(r.createdAt);
          const end = new Date(r.updatedAt);
          const hours = (end - start) / (1000 * 60 * 60);
          return sum + hours;
        }, 0);
        avgProcessingTime = Math.round(totalTime / completedRequests.length);
      }
      
      setMonthlyStats({
        topRequests,
        emptyDisplay,
        avgProcessingTime
      });
    } catch (error) {
      console.error('월간 통계 불러오기 실패:', error);
    }
  }

  const isMyStore = currentStore?.id === myStore?.id;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* 상단 헤더 - 다크 테마 */}
      <div style={{ backgroundColor: '#1e293b', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '1.5rem' }}>🏪</div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0, marginBottom: '0.25rem' }}>
                {myStore?.name || '노원점'}
              </h1>
              <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0 }}>
                관리자: {adminName} | S2S 재고 관리
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('로그아웃 하시겠습니까?')) {
                localStorage.clear();
                navigate('/');
              }
            }}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: '0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
          >
            로그아웃
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '1.5rem 1.5rem' }}>
        
        {/* 긴급 업무 - 최상단 */}
        {isMyStore && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>⚡</span>
                긴급 처리 필요
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                실시간 업데이트
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {/* 출고 처리 */}
              <div
                onClick={() => navigate('/outgoing')}
                style={{
                  backgroundColor: todayStats.outgoing > 0 ? '#fff7ed' : 'white',
                  border: `2px solid ${todayStats.outgoing > 0 ? '#fb923c' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📦</span>
                  {todayStats.outgoing > 0 && <span style={{ fontSize: '0.75rem', backgroundColor: '#fb923c', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600' }}>긴급</span>}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>출고 처리</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: todayStats.outgoing > 0 ? '#ea580c' : '#94a3b8', margin: 0 }}>
                  {todayStats.outgoing}
                </p>
              </div>

              {/* 수선 완료 */}
              <div
                onClick={() => navigate('/repairs', { state: { initialTab: '수선 완료' } })}
                style={{
                  backgroundColor: todayStats.repairs > 0 ? '#fdf2f8' : 'white',
                  border: `2px solid ${todayStats.repairs > 0 ? '#ec4899' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🧵</span>
                  {todayStats.repairs > 0 && <span style={{ fontSize: '0.75rem', backgroundColor: '#ec4899', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600' }}>긴급</span>}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>수선 완료</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: todayStats.repairs > 0 ? '#db2777' : '#94a3b8', margin: 0 }}>
                  {todayStats.repairs}
                </p>
              </div>

              {/* 입고 처리 */}
              <div
                onClick={() => navigate('/incoming')}
                style={{
                  backgroundColor: todayStats.pending > 0 ? '#eff6ff' : 'white',
                  border: `2px solid ${todayStats.pending > 0 ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📨</span>
                  {todayStats.pending > 0 && <span style={{ fontSize: '0.75rem', backgroundColor: '#3b82f6', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontWeight: '600' }}>대기</span>}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>입고 처리</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: todayStats.pending > 0 ? '#2563eb' : '#94a3b8', margin: 0 }}>
                  {todayStats.pending}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 빠른 액션 */}
        {isMyStore && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              빠른 액션
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
              <Link to="/chat" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(59,130,246,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>재고봇</p>
                </div>
              </Link>
              <Link to="/inventory" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(16,185,129,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>재고 관리</p>
                </div>
              </Link>
              <Link to="/history" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(139,92,246,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>거래 내역</p>
                </div>
              </Link>
              <Link to="/repairs" style={{ textDecoration: 'none' }}>
                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1rem', textAlign: 'center', cursor: 'pointer', transition: '0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#ec4899'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(236,72,153,0.1)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🧵</div>
                  <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0f172a', margin: 0 }}>수선 관리</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* 주요 통계 - 간결하게 */}
        {isMyStore && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a', margin: 0, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              주요 통계
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
              
              {/* 평균 처리 시간 */}
              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                  <span style={{ fontSize: '0.75rem', color: monthlyStats.avgProcessingTime <= 24 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                    {monthlyStats.avgProcessingTime <= 24 ? '✓' : '⚠'}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>평균 처리 시간</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  {monthlyStats.avgProcessingTime}시간
                </p>
              </div>

              {/* 진열 공백 */}
              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.75rem', color: monthlyStats.emptyDisplay.length > 0 ? '#f59e0b' : '#10b981', fontWeight: '600' }}>
                    {monthlyStats.emptyDisplay.length > 0 ? '주의' : '양호'}
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>진열 공백 품목</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  {monthlyStats.emptyDisplay.length}개
                </p>
              </div>

              {/* TOP 요청 */}
              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>인기 품목</p>
                <p style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>
                  {monthlyStats.topRequests.length > 0 ? monthlyStats.topRequests[0].item : '데이터 없음'}
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
