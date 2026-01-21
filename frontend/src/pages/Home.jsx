import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStores } from '../utils/api';

export default function Home() {
  const [stores, setStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('currentStore');
    if (stored) {
      setCurrentStore(JSON.parse(stored));
    }
  }, []);

  async function loadStores() {
    try {
      const data = await getStores();
      setStores(data);
      if (!currentStore && data.length > 0) {
        const defaultStore = data[0];
        setCurrentStore(defaultStore);
        localStorage.setItem('currentStore', JSON.stringify(defaultStore));
      }
    } catch (error) {
      console.error('매장 불러오기 실패:', error);
    }
  }

  function handleStoreChange(store) {
    setCurrentStore(store);
    localStorage.setItem('currentStore', JSON.stringify(store));
  }

  const menuItems = [
    { name: '재고 요청 (챗봇)', path: '/chat', icon: '💬', color: 'bg-blue-500' },
    { name: '현재 재고', path: '/inventory', icon: '📦', color: 'bg-green-500' },
    { name: '대기 중 재고', path: '/incoming', icon: '📥', color: 'bg-yellow-500', subtitle: '(오는 재고)' },
    { name: '준비 중 재고', path: '/outgoing', icon: '📤', color: 'bg-orange-500', subtitle: '(가는 재고)' },
    { name: '거래 내역', path: '/history', icon: '📊', color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">S2S 재고 관리</h1>
          <p className="text-sm text-gray-600 mt-1">Store to Store Inventory Management</p>
        </div>
      </div>

      {/* 매장 선택 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            현재 매장
          </label>
          <select
            value={currentStore?.id || ''}
            onChange={(e) => {
              const store = stores.find(s => s.id === e.target.value);
              handleStoreChange(store);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {stores.map(store => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col items-center text-center"
            >
              <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              {item.subtitle && (
                <p className="text-sm text-gray-500 mt-1">{item.subtitle}</p>
              )}
            </Link>
          ))}
        </div>

        {/* 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">👋 환영합니다!</h3>
          <p className="text-blue-800 text-sm">
            • <strong>재고 요청</strong>: 챗봇에서 필요한 재고를 요청하세요<br />
            • <strong>대기 중 재고</strong>: 내가 요청한 재고를 확인하세요<br />
            • <strong>준비 중 재고</strong>: 다른 매장의 요청을 승인/거절하세요
          </p>
        </div>
      </div>
    </div>
  );
}
