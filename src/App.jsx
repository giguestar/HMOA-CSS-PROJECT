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
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'mobile'];
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword));
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    { name: '대시보드', path: '/', icon: '📊', roles: ['admin', 'manager', 'viewer'], mobileVisible: false },
    { name: '실측 관리', path: '/measurements', icon: '📏', roles: ['admin', 'manager'], mobileVisible: true },
    { name: '실측 달력', path: '/measurement-schedule', icon: '📆', roles: ['admin', 'manager', 'viewer'], mobileVisible: true },
    { name: '시공내역 등록', path: '/record/new', icon: '✏️', roles: ['admin', 'manager'], mobileVisible: true },
    { name: '시공내역 조회', path: '/records', icon: '📋', roles: ['admin'], mobileVisible: false },
    { name: '월간 스케줄', path: '/schedule', icon: '📅', roles: ['admin', 'manager', 'viewer'], mobileVisible: true },
    { name: '정산 목록', path: '/settlements', icon: '💰', roles: ['admin'], mobileVisible: false },
    { name: '정산 작성', path: '/settlements/new', icon: '✨', roles: ['admin'], mobileVisible: false },
    { name: '업체별 집계', path: '/vendor-stats', icon: '💼', roles: ['admin'], mobileVisible: false },
    { name: '정산 계산', path: '/settlement', icon: '📈', roles: ['admin'], mobileVisible: false },
  ];

  const navigation = allNavigation.filter(item => {
    // 권한 체크
    if (!item.roles.includes(userRole)) return false;
    
    // 모바일에서는 mobileVisible이 true인 항목만
    if (isMobile && !item.mobileVisible) return false;
    
    return true;
  });

  return (
    <Router>
      {showLogin && <LoginModal onLogin={handleLogin} />}
      
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className={`${isMobile ? 'px-2' : 'max-w-7xl mx-auto px-4'}`}>
            <div className={`flex ${isMobile ? 'flex-col' : 'justify-between items-center'} ${isMobile ? 'py-2' : 'h-16'}`}>
              <div className="flex items-center justify-between w-full space-x-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className={isMobile ? 'text-xl' : 'text-2xl'}>🏗️</span>
                  <h1 className={`${isMobile ? 'text-xs' : 'text-sm'} font-bold text-gray-900 whitespace-nowrap`}>해모아 시공관리</h1>
                  {currentUser && !isMobile && (
                    <span className="ml-4 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {currentUser.role === 'admin' ? '👑 관리자' : '👨‍💼 ' + currentUser.display_name}
                    </span>
                  )}
                </div>
                {userRole && (
                  <button
                    onClick={handleLogout}
                    className={`${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
                  >
                    로그아웃
                  </button>
                )}
              </div>
              <div className="flex items-center w-full">
                <div className={`flex ${isMobile ? 'flex-col w-full space-y-2' : 'space-x-1'}`}>
                  {navigation.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setCurrentPath(item.path)}
                      className={`${isMobile ? 'w-full text-center py-3 text-base' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
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
          </div>
        </nav>

        {/* Main Content */}
        <main className={`${isMobile ? 'px-2 py-3' : 'max-w-7xl mx-auto px-4 py-6'}`}>
          <Routes>
            <Route path="/" element={<Dashboard userRole={userRole} />} />
            
            {/* 관리자 및 매니저 라우트 */}
            <Route 
              path="/record/new" 
              element={(userRole === 'admin' || userRole === 'manager') ? <RecordForm /> : <Navigate to="/" replace />} 
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
