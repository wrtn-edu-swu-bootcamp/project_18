import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncomingRequests, getOutgoingRequests } from '../utils/api';

export default function History() {
  const [allRequests, setAllRequests] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('currentStore');
    if (stored) {
      const store = JSON.parse(stored);
      setCurrentStore(store);
      loadHistory(store.id);
    } else {
      navigate('/');
    }
  }, [navigate]);

  async function loadHistory(storeId) {
    try {
      const [incoming, outgoing] = await Promise.all([
        getIncomingRequests(storeId),
        getOutgoingRequests(storeId)
      ]);
      
      const combined = [
        ...incoming.map(r => ({...r, type: 'incoming'})),
        ...outgoing.map(r => ({...r, type: 'outgoing'}))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setAllRequests(combined);
    } catch (error) {
      console.error('거래 내역 불러오기 실패:', error);
    }
  }

  const filteredRequests = filter === 'all'
    ? allRequests
    : allRequests.filter(r => r.type === filter);

  const getStatusInfo = (status) => {
    const statusMap = {
      requested: { label: '요청됨', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '승인됨', color: 'bg-blue-100 text-blue-800' },
      in_transit: { label: '배송 중', color: 'bg-purple-100 text-purple-800' },
      completed: { label: '완료', color: 'bg-green-100 text-green-800' },
      rejected: { label: '거절됨', color: 'bg-red-100 text-red-800' }
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
              <h1 className="text-xl font-bold text-gray-900">거래 내역</h1>
              <p className="text-sm text-gray-600">{currentStore?.name}</p>
            </div>
          </div>

          {/* 필터 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter('incoming')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'incoming'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              요청한 거래
            </button>
            <button
              onClick={() => setFilter('outgoing')}
              className={`px-4 py-2 rounded-lg font-medium ${
                filter === 'outgoing'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              받은 요청
            </button>
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">📭</p>
            <p className="text-gray-500">거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="relative">
            {/* 타임라인 선 */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* 거래 목록 */}
            <div className="space-y-6">
              {filteredRequests.map((request, index) => {
                const statusInfo = getStatusInfo(request.status);
                const isIncoming = request.type === 'incoming';
                
                return (
                  <div key={request.id} className="relative flex gap-4">
                    {/* 타임라인 아이콘 */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-full ${
                      isIncoming ? 'bg-yellow-100' : 'bg-blue-100'
                    } border-4 border-white shadow-sm flex items-center justify-center text-2xl z-10`}>
                      {isIncoming ? '📥' : '📤'}
                    </div>

                    {/* 거래 카드 */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isIncoming ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isIncoming ? '요청한 거래' : '받은 요청'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.item}
                          </h3>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          {request.quantity}개
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">
                            {isIncoming ? '요청한 매장' : '요청 매장'}
                          </p>
                          <p className="font-medium text-gray-900">
                            {isIncoming ? request.toStoreName : request.fromStoreName}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">요청 날짜</p>
                          <p className="font-medium text-gray-900">
                            {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>

                      {request.updatedAt && (
                        <p className="text-xs text-gray-500 mt-3">
                          마지막 업데이트: {new Date(request.updatedAt).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
