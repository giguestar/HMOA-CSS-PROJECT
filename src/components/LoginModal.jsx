import { useState } from 'react';
import api from '../api';

export default function LoginModal({ onLogin, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 사전 정의된 계정 목록
  const accounts = [
    { username: 'admin', display_name: '관리자', icon: '👑', color: 'bg-purple-500' },
    { username: 'lee_sangmu', display_name: '이상무', icon: '👨‍💼', color: 'bg-blue-500' },
    { username: 'jung_hogyu', display_name: '정호규', icon: '👨‍💼', color: 'bg-green-500' },
    { username: 'kim_namgun', display_name: '김남군', icon: '👨‍💼', color: 'bg-orange-500' }
  ];

  const handleAccountSelect = (accountUsername) => {
    setUsername(accountUsername);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username) {
      setError('계정을 선택해주세요.');
      return;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // API 로그인 호출
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        // 로그인 성공
        const user = response.data.user;
        
        // localStorage에 사용자 정보 저장
        localStorage.setItem('user', JSON.stringify(user));
        
        // 부모 컴포넌트에 role 전달 (기존 시스템 호환)
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">해모아 시공 관리</h2>
        <p className="text-sm text-gray-500 text-center mb-6">로그인하여 시스템에 접속하세요</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  onClick={() => handleAccountSelect(account.username)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${username === account.username 
                      ? `${account.color} text-white border-transparent shadow-lg transform scale-105` 
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'}
                  `}
                >
                  <div className="text-2xl mb-1">{account.icon}</div>
                  <div className={`text-sm font-medium ${username === account.username ? 'text-white' : 'text-gray-900'}`}>
                    {account.display_name}
                  </div>
                  <div className={`text-xs ${username === account.username ? 'text-white/80' : 'text-gray-500'}`}>
                    {account.username}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 비밀번호 입력 */}
          {username && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {selectedAccount?.display_name} 비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="비밀번호 입력"
                autoFocus
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-all
              ${loading || !username || !password
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : `${selectedAccount?.color || 'bg-blue-500'} text-white hover:opacity-90 hover:shadow-lg`}
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

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700 text-center">
              💡 <strong>비밀번호 안내:</strong><br/>
              관리자: admin1234 / 매니저: 이름1234 (예: lee1234)
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
