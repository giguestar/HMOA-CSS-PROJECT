import { useState, useEffect } from 'react';
import api from '../api';

export default function Settlement() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });
  const [settlementData, setSettlementData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/settings/companies');
      setCompanies(response.data);
      if (response.data.length > 0) {
        setSelectedCompany(response.data[0].company_name);
      }
    } catch (error) {
      console.error('업체 조회 실패:', error);
    }
  };

  const calculateSettlement = async () => {
    if (!selectedCompany) {
      alert('업체를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/api/settlements/calculate', {
        params: {
          clientCompany: selectedCompany,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      setSettlementData(response.data);
    } catch (error) {
      console.error('정산 계산 실패:', error);
      alert('정산 계산에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSettlementSchedule = (companyName) => {
    const company = companies.find(c => c.company_name === companyName);
    if (!company) return '';

    switch (company.settlement_type) {
      case 'monthly_end':
        return '매월 말일 정산';
      case 'bimonthly':
        return '1~15일: 20일 정산 / 16~말일: 익월 5일 정산';
      case 'bimonthly_custom':
        return '21일, 1일 정산 (입금 확인 건만)';
      default:
        return '정산 주기 미설정';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  };

  const exportSettlement = () => {
    if (!settlementData) {
      alert('먼저 정산을 계산해주세요.');
      return;
    }
    // TODO: 엑셀 export 구현
    alert('엑셀 다운로드 기능은 개발 중입니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">정산 관리</h1>
        <button
          onClick={exportSettlement}
          disabled={!settlementData}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          📊 정산서 다운로드
        </button>
      </div>

      {/* 업체별 정산 주기 안내 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📅 업체별 정산 주기</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map(company => (
            <div key={company.id} className="flex items-start p-4 bg-gray-50 rounded-lg border-l-4" style={{ borderColor: company.color_code }}>
              <div className="w-3 h-3 rounded-full mt-1 mr-3" style={{ backgroundColor: company.color_code }}></div>
              <div>
                <h3 className="font-semibold text-gray-900">{company.company_name}</h3>
                <p className="text-sm text-gray-600 mt-1">{getSettlementSchedule(company.company_name)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 정산 계산 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 정산 계산</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">발주업체</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map(company => (
                <option key={company.id} value={company.company_name}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={calculateSettlement}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              {loading ? '계산 중...' : '정산 계산'}
            </button>
          </div>
        </div>

        {/* 정산 결과 */}
        {settlementData && (
          <div className="mt-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">
                {settlementData.clientCompany} 정산 내역
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                기간: {new Date(settlementData.period.start).toLocaleDateString('ko-KR')} ~ {new Date(settlementData.period.end).toLocaleDateString('ko-KR')}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">시공 건수</p>
                  <p className="text-2xl font-bold text-gray-900">{settlementData.recordCount}건</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">총 청구금액</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(settlementData.totalBilling)}원</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">총 지급금액</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(settlementData.totalPayment)}원</p>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">마진</p>
                  <p className={`text-2xl font-bold ${settlementData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(settlementData.profitMargin)}원
                  </p>
                </div>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">정산 정보</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 정산 주기: {getSettlementSchedule(settlementData.clientCompany)}</li>
                <li>• 마진율: {settlementData.totalBilling > 0 ? ((settlementData.profitMargin / settlementData.totalBilling) * 100).toFixed(2) : 0}%</li>
                <li>• 평균 시공비: {settlementData.recordCount > 0 ? formatCurrency(Math.round(settlementData.totalBilling / settlementData.recordCount)) : 0}원/건</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 빠른 정산 버튼 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 빠른 정산</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {companies.map(company => (
            <button
              key={company.id}
              onClick={() => {
                setSelectedCompany(company.company_name);
                // 현재 달 1일부터 오늘까지로 자동 설정
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setDateRange({
                  start: firstDay.toISOString().slice(0, 10),
                  end: today.toISOString().slice(0, 10)
                });
                // 자동으로 계산 실행
                setTimeout(() => calculateSettlement(), 100);
              }}
              className="p-4 text-center rounded-lg border-2 hover:shadow-lg transition-all"
              style={{ borderColor: company.color_code }}
            >
              <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: company.color_code }}></div>
              <p className="font-semibold text-gray-900 text-sm">{company.company_name}</p>
              <p className="text-xs text-gray-500 mt-1">이번 달</p>
            </button>
          ))}
        </div>
      </div>

      {/* 도움말 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">💡 정산 안내</h3>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• 업체와 기간을 선택한 후 "정산 계산" 버튼을 클릭하세요.</li>
          <li>• 빠른 정산 버튼을 사용하면 이번 달 정산이 자동으로 계산됩니다.</li>
          <li>• 정산서 다운로드 버튼으로 엑셀 파일을 받을 수 있습니다.</li>
          <li>• 각 업체의 정산 주기는 상단에 표시되어 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}
