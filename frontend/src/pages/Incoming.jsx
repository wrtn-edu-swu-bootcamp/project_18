import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncomingRequests } from '../utils/api';

export default function Incoming() {
  const [requests, setRequests] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('currentStore');
    if (stored) {
      const store = JSON.parse(stored);
      setCurrentStore(store);
      loadRequests(store.id);
    } else {
      navigate('/');
    }
  }, [navigate]);

  async function loadRequests(storeId) {
    try {
      const data = await getIncomingRequests(storeId);
      setRequests(data);
    } catch (error) {
      console.error('대기 중 재고 불러오기 실패:', error);
    }
  }

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter(r => r.status === filter);

  const getStatusInfo = (status) => {
    const statusMap = {
      requested: { label: '요청됨', color: 'bg-yellow-100 text-yellow-800', icon: '📤' },
      approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800', icon: '✅' },
      in_transit: { label: '배송 중', color: 'bg-purple-100 text-purple-800', icon: '🚚' },
      completed: { label: '완료', color: 'bg-green-100 text-green-800', icon: '✨' },
      rejected: { label: '거절됨', color: 'bg-red-100 text-red-800', icon: '❌' }
    };
    return statusMap[status] || statusMap.requested;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">대기 중 재고 (오는 재고)</h1>
              <p className="text-sm text-gray-600">{currentStore?.name}</p>
            </div>
          </div>

          {/* 필터 */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { value: 'all', label: '전체' },
              { value: 'requested', label: '요청됨' },
              { value: 'approved', label: '승인됨' },
              { value: 'in_transit', label: '배송 중' },
              { value: 'completed', label: '완료' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  filter === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 재고 목록 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">📭</p>
            <p className="text-gray-500">
              {filter === 'all' 
                ? '대기 중인 재고가 없습니다.'
                : `"${getStatusInfo(filter).label}" 상태의 재고가 없습니다.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              return (
                <div key={request.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{statusInfo.icon}</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {request.emailSent && (
                          <span className="text-xs text-gray-500">✉️ 메일 발송됨</span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {request.item}
                      </h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>수량: <span className="font-semibold text-gray-900">{request.quantity}개</span></p>
                        <p>요청한 매장: <span className="font-semibold">{request.toStoreName}</span></p>
                        <p>요청 날짜: {new Date(request.createdAt).toLocaleString('ko-KR')}</p>
                        {request.updatedAt && (
                          <p>업데이트: {new Date(request.updatedAt).toLocaleString('ko-KR')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
