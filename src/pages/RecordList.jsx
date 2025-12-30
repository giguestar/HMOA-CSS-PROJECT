import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function RecordList() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    clientCompany: '',
    team: ''
  });

  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchRecords();
  }, [filters]);

  const fetchSettings = async () => {
    try {
      const [companiesRes, teamsRes] = await Promise.all([
        api.get('/api/settings/companies'),
        api.get('/api/settings/teams')
      ]);
      setCompanies(companiesRes.data);
      setTeams(teamsRes.data);
    } catch (error) {
      console.error('설정 조회 실패:', error);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.clientCompany) params.append('clientCompany', filters.clientCompany);
      if (filters.team) params.append('team', filters.team);

      const response = await api.get(`/api/records?${params.toString()}`);
      setRecords(response.data);
    } catch (error) {
      console.error('시공내역 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ 진짜 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.')) return;

    try {
      await api.delete(`/api/records/${id}`);
      alert('✅ 삭제되었습니다.');
      fetchRecords();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('❌ 삭제에 실패했습니다.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const companyColors = {
    'LX': 'bg-purple-100 text-purple-800 border-purple-300',
    '케스코': 'bg-blue-100 text-blue-800 border-blue-300',
    '청암': 'bg-green-100 text-green-800 border-green-300',
    '한샘': 'bg-orange-100 text-orange-800 border-orange-300',
    '홈CC': 'bg-red-100 text-red-800 border-red-300',
    '해모아': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  };

  const exportToExcel = () => {
    // TODO: 엑셀 export 기능 구현
    alert('엑셀 다운로드 기능은 개발 중입니다.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">시공내역 조회</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            📊 엑셀 다운로드
          </button>
          <button
            onClick={() => navigate('/record/new')}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            ✏️ 새 시공내역 등록
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">발주업체</label>
            <select
              name="clientCompany"
              value={filters.clientCompany}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {companies.map(company => (
                <option key={company.id} value={company.company_name}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시공팀</label>
            <select
              name="team"
              value={filters.team}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {teams.map(team => (
                <option key={team.id} value={team.team_name}>
                  {team.team_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 결과 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">총 건수</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{records.length}건</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">총 청구금액</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(records.reduce((sum, r) => sum + (r.standard_cost || 0) + (r.protection_cost || 0) + (r.demolition_cost || 0) + (r.equipment_cost || 0) + (r.measurement_cost || 0), 0))}원
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">총 지급금액</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {formatCurrency(records.reduce((sum, r) => sum + (r.outsource_total_cost || 0), 0))}원
          </p>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">로딩 중...</div>
          </div>
        ) : records.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            조회된 시공내역이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시공일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발주업체</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">고객명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">팀</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거주</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">청구금액</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">지급금액</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">정산</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => {
                  const totalBilling = (record.standard_cost || 0) + (record.protection_cost || 0) + (record.demolition_cost || 0) + (record.equipment_cost || 0) + (record.measurement_cost || 0);
                  const totalPayment = record.outsource_total_cost || totalBilling;

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.construction_date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${companyColors[record.client_company] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                          {record.client_company}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.customer_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={`${record.site_address} ${record.building_unit}`}>
                          {record.site_address} {record.building_unit}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.team}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {record.is_resident}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                        {formatCurrency(totalBilling)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                        {formatCurrency(totalPayment)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        {record.settlement_status === 'o' ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">○</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                        <button
                          onClick={() => navigate(`/record/edit/${record.id}`)}
                          className="text-blue-600 hover:text-blue-800 mr-2"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => navigate(`/settlements/new?recordId=${record.id}`)}
                          className="text-green-600 hover:text-green-800 mr-2"
                        >
                          정산
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
