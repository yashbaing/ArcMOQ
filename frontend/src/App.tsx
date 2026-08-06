import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import OrdersPage from './pages/OrdersPage';
import MandatePage from './pages/MandatePage';
import AgentPage from './pages/AgentPage';
import SettlementPage from './pages/SettlementPage';
import ReceiptsPage from './pages/ReceiptsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OrdersPage />} />
        <Route path="mandate" element={<MandatePage />} />
        <Route path="agent" element={<AgentPage />} />
        <Route path="settlement" element={<SettlementPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
      </Route>
    </Routes>
  );
}
