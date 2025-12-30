import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import RecordForm from './pages/RecordForm';
import RecordList from './pages/RecordList';
import Schedule from './pages/Schedule';
import Settlement from './pages/Settlement';
import MeasurementForm from './pages/MeasurementForm';
import MeasurementList from './pages/MeasurementList';
import MeasurementSchedule from './pages/MeasurementSchedule';
import SettlementList from './pages/SettlementList';
import SettlementForm from './pages/SettlementForm';
import VendorStats from './pages/VendorStats';
import LoginModal from './components/LoginModal';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'viewer'
  const [currentUser, setCurrentUser] = useState(null); // 사용자 정보 객체
  const [showLogin, setShowLogin] = useState(true);

  // console.log('🎬 App 렌더링:', { userRole, showLogin, currentUser: currentUser?.username });

  const handleLogin = (role, user) => {
    console.log('🔐 handleLogin 호출됨:', { role, user });
    setUserRole(role);
    setCurrentUser(user);
    setShowLogin(false);
    localStorage.setItem('userRole', role);
    localStorage.setItem('user', JSON.stringify(user));
    console.log('✅ localStorage 저장 완료:', {
      userRole: localStorage.getItem('userRole'),
      user: localStorage.getItem('user')
    });
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setShowLogin(true);
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    // localStorage에서 로그인 정보 복원
    const savedRole = localStorage.getItem('userRole');
    const savedUser = localStorage.getItem('user');
    
    console.log('🔍 localStorage 확인:', { savedRole, savedUser });
    
    if (savedUser && savedRole) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.username && user.role) {
          console.log('✅ 로그인 정보 복원:', user);
          setUserRole(savedRole);
          setCurrentUser(user);
          setShowLogin(false);
        }
      } catch (e) {
        console.error('❌ localStorage 파싱 에러:', e);
        localStorage.clear();
      }
    } else {
      console.log('ℹ️ localStorage 비어있음, 로그인 필요');
    }
  }, []);

  // 권한에 따른 메뉴 구성
  const allNavigation = [
    { name: '대시보드', path: '/', icon: '📊', roles: ['admin', 'manager', 'viewer'] },
    { name: '실측 관리', path: '/measurements', icon: '📏', roles: ['admin', 'manager'] },
    { name: '실측 달력', path: '/measurement-schedule', icon: '📆', roles: ['admin', 'manager', 'viewer'] },
    { name: '시공내역 등록', path: '/record/new', icon: '✏️', roles: ['admin'] },
    { name: '시공내역 조회', path: '/records', icon: '📋', roles: ['admin'] },
    { name: '월간 스케줄', path: '/schedule', icon: '📅', roles: ['admin', 'manager', 'viewer'] },
    { name: '정산 목록', path: '/settlements', icon: '💰', roles: ['admin'] },
    { name: '정산 작성', path: '/settlements/new', icon: '✨', roles: ['admin'] },
    { name: '업체별 집계', path: '/vendor-stats', icon: '💼', roles: ['admin'] },
    { name: '정산 계산', path: '/settlement', icon: '📈', roles: ['admin'] },
  ];

  const navigation = allNavigation.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <Router>
      {showLogin && <LoginModal onLogin={handleLogin} />}
      
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🏗️</span>
                <h1 className="text-sm font-bold text-gray-900 whitespace-nowrap">해모아 시공관리</h1>
                {currentUser && (
                  <span className="ml-4 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {currentUser.role === 'admin' ? '👑 관리자' : '👨‍💼 ' + currentUser.display_name}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
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
                {userRole && (
                  <button
                    onClick={handleLogout}
                    className="ml-4 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    로그아웃
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard userRole={userRole} />} />
            
            {/* 관리자 전용 라우트 */}
            <Route 
              path="/record/new" 
              element={userRole === 'admin' ? <RecordForm /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/records" 
              element={userRole === 'admin' ? <RecordList /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/settlements" 
              element={userRole === 'admin' ? <SettlementList /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/settlements/new" 
              element={userRole === 'admin' ? <SettlementForm /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/settlements/edit/:id" 
              element={userRole === 'admin' ? <SettlementForm /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/vendor-stats" 
              element={userRole === 'admin' ? <VendorStats /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/settlement" 
              element={userRole === 'admin' ? <Settlement /> : <Navigate to="/" replace />} 
            />
            
            {/* 관리자 + 매니저 공통 라우트 */}
            <Route 
              path="/measurements" 
              element={(userRole === 'admin' || userRole === 'manager') ? <MeasurementList /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/measurements/new" 
              element={(userRole === 'admin' || userRole === 'manager') ? <MeasurementForm /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/measurements/edit/:id" 
              element={(userRole === 'admin' || userRole === 'manager') ? <MeasurementForm /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/record/edit/:id" 
              element={(userRole === 'admin' || userRole === 'manager') ? <RecordForm /> : <Navigate to="/" replace />} 
            />
            
            {/* 모든 사용자 접근 가능 */}
            <Route path="/measurement-schedule" element={<MeasurementSchedule userRole={userRole} />} />
            <Route path="/schedule" element={<Schedule userRole={userRole} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
