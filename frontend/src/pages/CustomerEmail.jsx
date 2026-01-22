import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStores } from '../utils/api';

const API_BASE = 'http://localhost:3001/api';

export default function CustomerEmail() {
  const [repairs, setRepairs] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: '', content: '' });
  const [sentEmails, setSentEmails] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function initialize() {
      const storedId = localStorage.getItem('myStore');
      const name = localStorage.getItem('adminName') || 'admin';
      
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
        setAdminName(name);
        loadRepairs(store.id);
        
        // localStorage에서 발송 내역 불러오기
        const saved = localStorage.getItem('customerEmails');
        if (saved) {
          setSentEmails(JSON.parse(saved));
        }
      } catch (error) {
        console.error('매장 정보 로드 실패:', error);
        navigate('/');
      }
    }
    
    initialize();
  }, [navigate]);

  async function loadRepairs(storeId) {
    try {
      const response = await fetch(`${API_BASE}/repairs/store/${storeId}`);
      const data = await response.json();
      
      // 수선 완료되고 알림톡 발송 안된 고객만 필터링
      const completedRepairs = data.filter(repair => 
        repair.repairStatus === '수선 완료' && 
        !repair.notificationSent &&
        repair.paymentStatus === '완불'
      );
      
      setRepairs(completedRepairs);
    } catch (error) {
      console.error('수선 내역 불러오기 실패:', error);
    }
  }

  function handleSendEmail(repair) {
    setSelectedCustomer(repair);
    setEmailForm({ 
      subject: `[${currentStore.name}] 수선이 완료되었습니다`,
      content: `안녕하세요, ${repair.customerName}님\n\n맡기신 ${repair.productId} 제품의 수선이 완료되었습니다.\n매장으로 방문하시어 수령해 주시기 바랍니다.\n\n감사합니다.\n${currentStore.name}` 
    });
    setShowEmailModal(true);
  }

  async function handleEmailSubmit() {
    if (!emailForm.subject || !emailForm.content) {
      alert('제목과 내용을 입력해주세요!');
      return;
    }

    // 이메일 발송 시뮬레이션
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 고객 메일 발송 (시뮬레이션)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`고객: ${selectedCustomer.customerName}`);
    console.log(`제목: ${emailForm.subject}`);
    console.log(`내용:\n${emailForm.content}`);
    console.log('✅ 발송 성공! (시뮬레이션)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 수선 내역에 알림톡 발송 표시 업데이트
    try {
      await fetch(`${API_BASE}/repairs/${selectedCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationSent: true })
      });
      
      // 발송 내역 저장
      const newEmail = {
        id: `email-${Date.now()}`,
        customerName: selectedCustomer.customerName,
        productId: selectedCustomer.productId,
        repairContent: selectedCustomer.repairContent,
        subject: emailForm.subject,
        content: emailForm.content,
        sentBy: adminName,
        sentAt: new Date().toISOString()
      };
      
      const updatedEmails = [newEmail, ...sentEmails];
      setSentEmails(updatedEmails);
      localStorage.setItem('customerEmails', JSON.stringify(updatedEmails));
      
      alert(`✅ ${selectedCustomer.customerName}님에게 메일이 발송되었습니다!`);
      setShowEmailModal(false);
      setSelectedCustomer(null);
      
      // 목록 새로고침
      loadRepairs(currentStore.id);
    } catch (error) {
      console.error('알림톡 발송 처리 중 오류:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  }

  function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  if (!currentStore) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>로딩 중...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/home')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            ← 뒤로
          </button>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            📧 고객 메일
          </h1>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {currentStore.name} ({adminName})
        </div>
      </div>

      {/* 안내 */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '0.5rem', padding: '1rem', marginBottom: '2rem' }}>
        <p style={{ fontSize: '0.875rem', color: '#1e40af', margin: 0 }}>
          💡 수선이 완료되고 결제까지 완료된 고객에게 수령 안내 메일을 발송할 수 있습니다.
        </p>
      </div>

      {/* 수선 완료 고객 목록 */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
          🔔 메일 발송 대기 고객 ({repairs.length}명)
        </h2>

        {repairs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            메일을 보낼 고객이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>고객명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제품</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>수선 내용</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>비용</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>결제</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>완료일</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((repair) => (
                  <tr key={repair.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>{repair.customerName}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{repair.productId}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{repair.repairContent}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: '600' }}>
                      {repair.cost.toLocaleString()}원
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.5rem', 
                        backgroundColor: '#d1fae5', 
                        color: '#065f46', 
                        borderRadius: '0.25rem',
                        fontWeight: '600'
                      }}>
                        {repair.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                      {repair.completedAt ? formatTimestamp(repair.completedAt) : '-'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => handleSendEmail(repair)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        📧 메일 발송
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 발송 내역 */}
      <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
          📨 발송 내역 ({sentEmails.length}건)
        </h2>

        {sentEmails.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            발송 내역이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f3f4f6' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>고객명</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제품</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>제목</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>발송자</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>발송 시간</th>
                </tr>
              </thead>
              <tbody>
                {sentEmails.map((email) => (
                  <tr key={email.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500' }}>{email.customerName}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{email.productId}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{email.subject}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>{email.sentBy}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
                      {formatTimestamp(email.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 메일 발송 모달 */}
      {showEmailModal && selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>
              📧 수선 완료 알림 메일
            </h2>
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>고객 정보</p>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>
                {selectedCustomer.customerName}님
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>수선 내용</p>
              <p style={{ fontSize: '0.875rem', color: '#111827' }}>
                {selectedCustomer.productId} - {selectedCustomer.repairContent}
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                제목
              </label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                내용
              </label>
              <textarea
                value={emailForm.content}
                onChange={(e) => setEmailForm({ ...emailForm, content: e.target.value })}
                rows={8}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setSelectedCustomer(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                onClick={handleEmailSubmit}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📧 발송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
