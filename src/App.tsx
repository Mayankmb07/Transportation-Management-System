import { useMemo } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BillingPage from './pages/Billing';
import InvoiceDetail from './pages/InvoiceDetail';


function App() {
    const location = useLocation();
    const navigate = useNavigate();
    const activeTab = useMemo(() => {
        if (location.pathname.startsWith('/billing')) return 'billing';
        return 'dashboard';
    }, [location.pathname]);
    const title = useMemo(() => {
        if (location.pathname.startsWith('/billing')) return 'Billing & Invoicing';
        return 'Dashboard';
    }, [location.pathname]);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
                if (tab === 'billing') navigate('/billing');
                else navigate('/');
            }} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={title} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Routes>
                        <Route path="/" element={<div className="text-gray-600">Main content</div>} />
                        <Route path="/billing" element={<BillingPage />} />
                        <Route path="/billing/:id" element={<InvoiceDetail />} />
                    </Routes>
                </main>
            </div>
        </div>
    )
}

export default App