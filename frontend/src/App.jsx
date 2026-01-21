import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Chat from './pages/Chat';
import CurrentInventory from './pages/CurrentInventory';
import Incoming from './pages/Incoming';
import Outgoing from './pages/Outgoing';
import History from './pages/History';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/inventory" element={<CurrentInventory />} />
        <Route path="/incoming" element={<Incoming />} />
        <Route path="/outgoing" element={<Outgoing />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </Router>
  );
}

export default App;
