import { useMemo, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DocumentsManagement from './pages/Documents';


function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const title = useMemo(() => {
        switch (activeTab) {
            case 'dashboard': return 'Dashboard';
            case 'documents': return 'Document Management';
            default: return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        }
    }, [activeTab]);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={title} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {activeTab === 'documents' ? (
                        <DocumentsManagement />
                    ) : (
                        <div className="text-gray-600">Main content</div>
                    )}
                </main>
            </div>
        </div>
    )
}

export default App