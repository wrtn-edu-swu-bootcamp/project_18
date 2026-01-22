import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Chat from './pages/Chat';
import CurrentInventory from './pages/CurrentInventory';
import Incoming from './pages/Incoming';
import Outgoing from './pages/Outgoing';
import History from './pages/History';
import Repairs from './pages/Repairs';
import AdminLogs from './pages/AdminLogs';
import CustomerInfo from './pages/CustomerInfo';
import CustomerEmail from './pages/CustomerEmail';
import InventoryRequest from './pages/InventoryRequest';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 앱 초기화
    try {
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">오류 발생</h1>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/inventory-request" element={<InventoryRequest />} />
          <Route path="/inventory" element={<CurrentInventory />} />
          <Route path="/incoming" element={<Incoming />} />
          <Route path="/outgoing" element={<Outgoing />} />
          <Route path="/history" element={<History />} />
          <Route path="/repairs" element={<Repairs />} />
          <Route path="/admin-logs" element={<AdminLogs />} />
          <Route path="/customer-info" element={<CustomerInfo />} />
          <Route path="/customer-email" element={<CustomerEmail />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
