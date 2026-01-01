import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailData, setDetailData] = useState({ title: '', records: [] });

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // 업체별 시공 목록 클릭
  const handleCompanyClick = async (company) => {
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const response = await api.get(`/api/records?year=${year}&month=${month}&client_company=${company}`);
      setDetailData({
        title: `${company} - ${month}월 시공 목록 (${response.data.length}건)`,
        records: response.data
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('시공 목록 조회 실패:', error);
      alert('시공 목록을 불러올 수 없습니다.');
    }
  };

  // 이번 달 시공 건수 클릭
  const handleThisMonthClick = async () => {
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      const response = await api.get(`/api/records?year=${year}&month=${month}`);
      setDetailData({
        title: `${month}월 전체 시공 목록 (${response.data.length}건)`,
        records: response.data
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('시공 목록 조회 실패:', error);
      alert('시공 목록을 불러올 수 없습니다.');
    }
  };

  // 미정산 건수 클릭
  const handlePendingClick = async () => {
    try {
      const response = await api.get('/api/records?settlement_status=pending');
      setDetailData({
        title: `미정산 시공 목록 (${response.data.length}건)`,
        records: response.data
      });
      setShowDetailModal(true);
    } catch (error) {
      console.error('미정산 목록 조회 실패:', error);
      alert('미정산 목록을 불러올 수 없습니다.');
    }
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
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-${isMobile ? '3' : '6'}`}>
        {/* 이번 달 시공 건수 */}
        <div 
          onClick={handleThisMonthClick}
          className={`bg-white rounded-lg shadow ${isMobile ? 'p-4' : 'p-6'} cursor-pointer hover:shadow-lg transition-shadow active:bg-gray-50`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-600`}>
                이번 달 시공 건수 <span className="text-xs text-blue-600">👆 클릭</span>
              </p>
              <p className={`${isMobile ? 'text-4xl' : 'text-3xl'} font-bold text-gray-900 mt-2`}>
                {stats?.thisMonth?.count || 0}
                <span className={`${isMobile ? 'text-xl' : 'text-lg'} font-normal text-gray-600 ml-2`}>건</span>
              </p>
            </div>
            <div className={`${isMobile ? 'w-14 h-14' : 'w-12 h-12'} bg-blue-100 rounded-full flex items-center justify-center`}>
              <span className={`${isMobile ? 'text-3xl' : 'text-2xl'}`}>🔨</span>
            </div>
          </div>
        </div>

        {/* 미정산 건수 */}
        <div 
          onClick={handlePendingClick}
          className={`bg-white rounded-lg shadow ${isMobile ? 'p-4' : 'p-6'} cursor-pointer hover:shadow-lg transition-shadow active:bg-gray-50`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-600`}>
                미정산 건수 <span className="text-xs text-orange-600">👆 클릭</span>
              </p>
              <p className={`${isMobile ? 'text-4xl' : 'text-3xl'} font-bold text-orange-600 mt-2`}>
                {stats?.pending?.count || 0}
                <span className={`${isMobile ? 'text-xl' : 'text-lg'} font-normal text-gray-600 ml-2`}>건</span>
              </p>
            </div>
            <div className={`${isMobile ? 'w-14 h-14' : 'w-12 h-12'} bg-orange-100 rounded-full flex items-center justify-center`}>
              <span className={`${isMobile ? 'text-3xl' : 'text-2xl'}`}>⏰</span>
            </div>
          </div>
        </div>

        {/* 정산 완료 건수 */}
        <div className={`bg-white rounded-lg shadow ${isMobile ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-600`}>정산 완료</p>
              <p className={`${isMobile ? 'text-4xl' : 'text-3xl'} font-bold text-green-600 mt-2`}>
                {stats?.settled?.count || 0}
                <span className={`${isMobile ? 'text-xl' : 'text-lg'} font-normal text-gray-600 ml-2`}>건</span>
              </p>
            </div>
            <div className={`${isMobile ? 'w-14 h-14' : 'w-12 h-12'} bg-green-100 rounded-full flex items-center justify-center`}>
              <span className={`${isMobile ? 'text-3xl' : 'text-2xl'}`}>✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* 업체별 시공 현황 */}
      <div className={`bg-white rounded-lg shadow ${isMobile ? 'p-4' : 'p-6'}`}>
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900 mb-4`}>
          이번 달 업체별 시공 현황 <span className="text-sm text-blue-600 font-normal">👆 업체 클릭</span>
        </h2>
        
        {stats?.byCompany && stats.byCompany.length > 0 ? (
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'} gap-${isMobile ? '3' : '4'}`}>
            {stats.byCompany.map((item) => (
              <div 
                key={item.client_company} 
                onClick={() => handleCompanyClick(item.client_company)}
                className={`flex flex-col items-center ${isMobile ? 'p-3' : 'p-4'} bg-gray-50 rounded-lg cursor-pointer hover:shadow-md transition-shadow active:bg-gray-100`}
              >
                <div className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} ${companyColors[item.client_company] || 'bg-gray-400'} rounded-full flex items-center justify-center text-white font-bold ${isMobile ? 'text-3xl' : 'text-2xl'} mb-2`}>
                  {item.count}
                </div>
                <div className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
                  {item.client_company}
                </div>
                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>시공 건수</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            이번 달 시공 내역이 없습니다.
          </div>
        )}
      </div>

      {/* 상세 리스트 모달 */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg shadow-xl ${isMobile ? 'w-full' : 'max-w-4xl w-full'} max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* 헤더 */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                {detailData.title}
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            {/* 리스트 */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailData.records.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  시공 내역이 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {detailData.records.map((record) => (
                    <div 
                      key={record.id}
                      onClick={() => {
                        setShowDetailModal(false);
                        navigate(`/record/edit/${record.id}`);
                      }}
                      className={`bg-white border rounded-lg ${isMobile ? 'p-3' : 'p-4'} hover:shadow-md cursor-pointer transition-shadow active:bg-gray-50`}
                    >
                      {/* 날짜 + 대리점 + 고객명 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-600`}>
                            {record.construction_date}
                          </span>
                          <span className="text-gray-400">|</span>
                          <span className={`${isMobile ? 'text-lg' : 'text-base'} font-bold text-gray-900`}>
                            {record.client_company}
                          </span>
                          <span className="text-gray-400">|</span>
                          <span className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-700`}>
                            {record.customer_name}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          record.settlement_status === 'settled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {record.settlement_status === 'settled' ? '정산완료' : '미정산'}
                        </span>
                      </div>

                      {/* 주소 */}
                      <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 mb-2`}>
                        📍 {record.site_address}
                      </div>

                      {/* 시공팀 + 프레임 수 */}
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 bg-blue-100 text-blue-800 rounded ${isMobile ? 'text-sm' : 'text-xs'} font-medium`}>
                          {record.team}
                        </span>
                        <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>
                          프레임 {record.frame_count}개
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 버튼 */}
            <div className="sticky bottom-0 bg-white border-t px-6 py-4">
              <button
                onClick={() => setShowDetailModal(false)}
                className={`w-full ${isMobile ? 'py-3 text-base' : 'py-2 text-sm'} bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors`}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-${isMobile ? '3' : '4'}`}>
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
