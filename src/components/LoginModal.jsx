import { useState } from 'react';
import api from '../api';

export default function LoginModal({ onLogin, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // console.log('🔐 LoginModal 렌더링됨!');

  // 사전 정의된 계정 목록
  const accounts = [
    { username: 'admin', display_name: '관리자', icon: '👑', color: 'bg-purple-500', needPassword: true },
    { username: 'lee', display_name: '이상무', icon: '👨‍💼', color: 'bg-blue-500', needPassword: false },
    { username: 'jung', display_name: '정호규', icon: '👨‍💼', color: 'bg-green-500', needPassword: false },
    { username: 'kim', display_name: '김남군', icon: '👨‍💼', color: 'bg-orange-500', needPassword: false }
  ];

  // 매니저 기본 비밀번호
  const managerPasswords = {
    'lee': 'l1234',
    'jung': 'j1234',
    'kim': 'k1234'
  };

  // 매니저 클릭 시 바로 로그인
  const handleManagerClick = async (account) => {
    if (account.needPassword) {
      // 관리자는 비밀번호 입력 필요
      setUsername(account.username);
      setError('');
      return;
    }

    // 매니저는 바로 로그인
    setLoading(true);
    setError('');

    try {
      const managerPassword = managerPasswords[account.username];
      const response = await api.post('/api/auth/login', { 
        username: account.username, 
        password: managerPassword 
      });
      
      if (response.data.success) {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        onLogin(user.role, user);
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 관리자 로그인 (비밀번호 필요)
  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', { username, password });
      
      if (response.data.success) {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        onLogin(user.role, user);
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.username === username);
  const isAdminMode = username === 'admin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border-4 border-blue-500">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">해모아 시공 관리</h2>
        <p className="text-sm text-gray-500 text-center mb-6">로그인하여 시스템에 접속하세요</p>
        
        {/* 계정 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            계정 선택
          </label>
          <div className="grid grid-cols-2 gap-3">
            {accounts.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => handleManagerClick(account)}
                disabled={loading}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${username === account.username 
                    ? `${account.color} text-white border-transparent shadow-lg transform scale-105` 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'}
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-2xl mb-1">{account.icon}</div>
                <div className={`text-sm font-medium ${username === account.username ? 'text-white' : 'text-gray-900'}`}>
                  {account.display_name}
                </div>
                <div className={`text-xs ${username === account.username ? 'text-white/80' : 'text-gray-500'}`}>
                  {account.username}
                </div>
                {!account.needPassword && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    클릭하여 로그인
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 관리자 비밀번호 입력 */}
        {isAdminMode && (
          <form onSubmit={handleAdminSubmit} className="mt-4 space-y-4 animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedAccount?.display_name} 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="비밀번호 입력"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className={`
                w-full py-3 px-4 rounded-lg font-medium transition-all
                ${loading || !password
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-500 text-white hover:bg-purple-600 hover:shadow-lg'}
              `}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  로그인 중...
                </div>
              ) : (
                '로그인'
              )}
            </button>
          </form>
        )}

        {/* 로딩 중일 때 전체 메시지 */}
        {loading && !isAdminMode && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fadeIn">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-blue-700 font-medium">로그인 중...</span>
            </div>
          </div>
        )}

        {/* 에러 메시지 (매니저용) */}
        {error && !isAdminMode && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-fadeIn">
            {error}
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 text-center">
              💡 <strong>사용 방법:</strong><br/>
              관리자: 비밀번호 입력 필요<br/>
              매니저: 이름 클릭만으로 바로 로그인
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
