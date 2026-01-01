import { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('통계 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/backup');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `construction_backup_${new Date().toISOString().slice(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      alert('백업이 완료되었습니다!');
    } catch (error) {
      alert('백업 실패: ' + error.message);
    }
  };

  const handleRestore = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.db';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      if (!confirm('데이터베이스를 복구하시겠습니까?\n기존 데이터는 자동으로 백업됩니다.')) {
        return;
      }
      
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = btoa(
            new Uint8Array(event.target.result)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          
          await api.post('/api/restore', { data: base64Data });
          alert('복구가 완료되었습니다! 페이지를 새로고침합니다.');
          window.location.reload();
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        alert('복구 실패: ' + error.message);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0) + '원';
  };

  const companyColors = {
    'LX': 'bg-purple-500',
    '케스코': 'bg-blue-500',
    '청암': 'bg-green-500',
    '한샘': 'bg-orange-500',
    '홈CC': 'bg-red-500',
    '해모아': 'bg-cyan-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackup}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            📦 백업
          </button>
          <button
            onClick={handleRestore}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            🔄 복구
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        {new Date().toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })}
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 이번 달 시공 건수 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 시공 건수</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats?.thisMonth?.count || 0}
                <span className="text-lg font-normal text-gray-600 ml-2">건</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔨</span>
            </div>
          </div>
        </div>

        {/* 이번 달 시공 건수 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">이번 달 시공</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats?.thisMonth?.count || 0}
                <span className="text-lg font-normal text-gray-600 ml-2">건</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🔨</span>
            </div>
          </div>
        </div>

        {/* 미정산 건수 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">미정산 건수</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {stats?.pending?.count || 0}
                <span className="text-lg font-normal text-gray-600 ml-2">건</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏰</span>
            </div>
          </div>
        </div>
      </div>

      {/* 업체별 시공 현황 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">이번 달 업체별 시공 현황</h2>
        
        {stats?.byCompany && stats.byCompany.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.byCompany.map((item) => (
              <div key={item.client_company} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <div className={`w-16 h-16 ${companyColors[item.client_company] || 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2`}>
                  {item.count}
                </div>
                <div className="text-sm font-medium text-gray-700">{item.client_company}</div>
                <div className="text-xs text-gray-500">시공 건수</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            이번 달 시공 내역이 없습니다.
          </div>
        )}
      </div>

      {/* 빠른 메뉴 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a
          href="/record/new"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center text-3xl mb-3 transition-colors">
              ✏️
            </div>
            <h3 className="font-semibold text-gray-900">시공내역 등록</h3>
            <p className="text-xs text-gray-500 mt-1">새 시공 내역 입력</p>
          </div>
        </a>

        <a
          href="/schedule"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center text-3xl mb-3 transition-colors">
              📅
            </div>
            <h3 className="font-semibold text-gray-900">월간 스케줄</h3>
            <p className="text-xs text-gray-500 mt-1">스케줄 확인</p>
          </div>
        </a>

        <a
          href="/settlement"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-yellow-100 group-hover:bg-yellow-200 rounded-full flex items-center justify-center text-3xl mb-3 transition-colors">
              💰
            </div>
            <h3 className="font-semibold text-gray-900">정산 관리</h3>
            <p className="text-xs text-gray-500 mt-1">업체별 정산</p>
          </div>
        </a>

        <a
          href="/records"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer group"
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center text-3xl mb-3 transition-colors">
              📋
            </div>
            <h3 className="font-semibold text-gray-900">시공내역 조회</h3>
            <p className="text-xs text-gray-500 mt-1">전체 내역 확인</p>
          </div>
        </a>
      </div>
    </div>
  );
}
