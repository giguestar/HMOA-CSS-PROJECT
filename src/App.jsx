import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import RecordForm from './pages/RecordForm';
import RecordList from './pages/RecordList';
import Schedule from './pages/Schedule';
import Settlement from './pages/Settlement';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  const navigation = [
    { name: '대시보드', path: '/', icon: '📊' },
    { name: '시공내역 등록', path: '/record/new', icon: '✏️' },
    { name: '시공내역 조회', path: '/records', icon: '📋' },
    { name: '월간 스케줄', path: '/schedule', icon: '📅' },
    { name: '정산 관리', path: '/settlement', icon: '💰' },
  ];

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🏗️</span>
                <h1 className="text-xl font-bold text-gray-900">샷시시공 통합관리</h1>
              </div>
              <div className="flex space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setCurrentPath(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPath === item.path
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/record/new" element={<RecordForm />} />
            <Route path="/record/edit/:id" element={<RecordForm />} />
            <Route path="/records" element={<RecordList />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/settlement" element={<Settlement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
