import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function VendorStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedVendor, setExpandedVendor] = useState(null);
  
  // 기본 기간: 이번 달
  const today = new Date();
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
  );

  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/settlements/vendor-stats', {
        params: { startDate, endDate }
      });
      setStats(response.data);
    } catch (error) {
      console.error('업체별 집계 조회 실패:', error);
      alert('업체별 집계 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  };

  const toggleExpand = (vendor) => {
    setExpandedVendor(expandedVendor === vendor ? null : vendor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!stats || stats.vendors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">💼 업체별 인임결재 집계</h1>
            <button
              onClick={() => navigate('/settlements')}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ← 정산 목록
            </button>
          </div>

          {/* 기간 선택 */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-semibold mb-4">📅 조회 기간</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-lg text-yellow-800">📭 해당 기간에 인임결재 내역이 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">💼 업체별 인임결재 집계</h1>
          <button
            onClick={() => navigate('/settlements')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            ← 정산 목록
          </button>
        </div>

        {/* 기간 선택 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">📅 조회 기간</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* 전체 요약 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
            <div className="text-sm opacity-90 mb-1">총 업체 수</div>
            <div className="text-3xl font-bold">{stats.summary.totalVendors}개</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
            <div className="text-sm opacity-90 mb-1">총 지급액</div>
            <div className="text-3xl font-bold">{formatCurrency(stats.summary.totalAmount)}원</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
            <div className="text-sm opacity-90 mb-1">총 건수</div>
            <div className="text-3xl font-bold">{stats.summary.totalCount}건</div>
          </div>
        </div>

        {/* 업체별 목록 */}
        <div className="space-y-4">
          {stats.vendors.map((vendor, index) => (
            <div key={vendor.vendor} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 업체 요약 */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(vendor.vendor)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-purple-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{vendor.vendor}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>📦 {vendor.count}건</span>
                        <span>💰 {formatCurrency(vendor.totalAmount)}원</span>
                        <span>📊 평균 {formatCurrency(Math.round(vendor.totalAmount / vendor.count))}원</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-500 hover:text-gray-700">
                    {expandedVendor === vendor.vendor ? '▲ 접기' : '▼ 상세보기'}
                  </button>
                </div>
              </div>

              {/* 상세 내역 (펼침) */}
              {expandedVendor === vendor.vendor && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">📋 상세 내역</h4>
                    <div className="space-y-2">
                      {vendor.items.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                  {item.construction_date}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                  {item.client_company}
                                </span>
                              </div>
                              <div className="text-gray-800 font-medium mb-1">
                                🏢 {item.customer_name} ({item.site_address})
                              </div>
                              <div className="text-gray-600 text-sm">
                                📝 {item.item_name}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-2xl font-bold text-purple-600">
                                {formatCurrency(item.amount)}원
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 소계 */}
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-800">
                          {vendor.vendor} 소계
                        </div>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(vendor.totalAmount)}원
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
