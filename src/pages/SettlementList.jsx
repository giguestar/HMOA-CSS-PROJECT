import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SettlementList() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 필터
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    client_company: '',
    status: '',
    period: ''
  });

  useEffect(() => {
    fetchSettlements();
  }, [filters]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.year) params.append('year', filters.year);
      if (filters.month) params.append('month', filters.month);
      if (filters.client_company) params.append('client_company', filters.client_company);
      if (filters.status) params.append('status', filters.status);
      if (filters.period) params.append('period', filters.period);
      
      const response = await api.get(`/api/settlements?${params.toString()}`);
      setSettlements(response.data);
    } catch (error) {
      console.error('정산 목록 조회 실패:', error);
      alert('정산 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.split('T')[0];
  };

  const getStatusBadge = (status) => {
    const badges = {
      '청구 대기': 'bg-gray-100 text-gray-800',
      '청구 완료': 'bg-blue-100 text-blue-800',
      '입금 완료': 'bg-green-100 text-green-800',
      '정산 대기': 'bg-yellow-100 text-yellow-800',
      '정산 완료': 'bg-purple-100 text-purple-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // 통계 계산
  const stats = {
    totalCount: settlements.length,
    totalBilling: settlements.reduce((sum, s) => sum + (s.billing_total_amount || 0), 0),
    totalPayment: settlements.reduce((sum, s) => sum + (s.payment_total_amount || 0), 0),
    totalProfit: settlements.reduce((sum, s) => sum + (s.profit_amount || 0), 0)
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">정산 관리</h1>
        <button
          onClick={() => navigate('/settlements/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 정산 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">총 건수</div>
          <div className="text-2xl font-bold">{stats.totalCount}건</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">총 청구액</div>
          <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalBilling)}원</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">총 지급액</div>
          <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.totalPayment)}원</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">총 수익</div>
          <div className="text-2xl font-bold text-green-600">{formatNumber(stats.totalProfit)}원</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">년도</label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
            <input
              type="number"
              min="1"
              max="12"
              value={filters.month}
              onChange={(e) => setFilters({ ...filters, month: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사</label>
            <select
              value={filters.client_company}
              onChange={(e) => setFilters({ ...filters, client_company: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">전체</option>
              <option value="LX">LX</option>
              <option value="케스코">케스코</option>
              <option value="청암">청암</option>
              <option value="한샘">한샘</option>
              <option value="홈CC">홈CC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정산상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">전체</option>
              <option value="정산 대기">정산 대기</option>
              <option value="정산 완료">정산 완료</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정산주기</label>
            <select
              value={filters.period}
              onChange={(e) => setFilters({ ...filters, period: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">전체</option>
              <option value="월말">월말</option>
              <option value="전반기">전반기</option>
              <option value="후반기">후반기</option>
              <option value="1차">1차</option>
              <option value="2차">2차</option>
              <option value="3차">3차</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : settlements.length === 0 ? (
          <div className="p-8 text-center text-gray-500">정산 내역이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">시공일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">회사</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">현장주소</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">청구액</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">지급액</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">수익</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">정산주기</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {settlements.map((settlement) => (
                  <tr key={settlement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {formatDate(settlement.construction_date)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {settlement.client_company}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      {settlement.customer_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {settlement.site_address}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                      {formatNumber(settlement.billing_total_amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                      {formatNumber(settlement.payment_total_amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                      {formatNumber(settlement.profit_amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        {settlement.settlement_period || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(settlement.settlement_status)}`}>
                        {settlement.settlement_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => navigate(`/settlements/${settlement.id}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
