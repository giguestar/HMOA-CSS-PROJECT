import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function MeasurementList() {
  const navigate = useNavigate();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    manager: '',
    priority: ''
  });

  useEffect(() => {
    fetchMeasurements();
  }, [filters]);

  const fetchMeasurements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.manager) params.append('manager', filters.manager);
      if (filters.priority) params.append('priority', filters.priority);
      
      const response = await api.get(`/api/measurements?${params}`);
      setMeasurements(response.data);
    } catch (error) {
      console.error('실측 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/measurements/${id}`);
      alert('삭제되었습니다.');
      fetchMeasurements();
    } catch (error) {
      alert('삭제 실패: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      measured: 'bg-blue-100 text-blue-800',
      scheduled: 'bg-green-100 text-green-800',
      registered: 'bg-purple-100 text-purple-800'
    };
    const labels = {
      pending: '실측 대기중',
      measured: '실측 완료',
      scheduled: '시공일 확정',
      registered: '시공등록 완료'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800',
      normal: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    const labels = {
      urgent: '★★★ 긴급',
      normal: '★★ 보통',
      low: '★ 낮음'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[priority] || styles.normal}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const getDaysUntilConstruction = (constructionDate) => {
    if (!constructionDate) return null;
    const today = new Date();
    const construction = new Date(constructionDate);
    const diffTime = construction - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">실측 요청 관리</h1>
        <button
          onClick={() => navigate('/measurements/new')}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          + 실측 요청 등록
        </button>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              진행 상태
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="pending">실측 대기중</option>
              <option value="measured">실측 완료</option>
              <option value="scheduled">시공일 확정</option>
              <option value="registered">시공등록 완료</option>
            </select>
          </div>

          {/* 매니저 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              담당 매니저
            </label>
            <select
              value={filters.manager}
              onChange={(e) => setFilters({...filters, manager: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="이상무">이상무</option>
              <option value="정호규">정호규</option>
              <option value="김남군">김남군</option>
            </select>
          </div>

          {/* 우선순위 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              우선순위
            </label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="urgent">★★★ 긴급</option>
              <option value="normal">★★ 보통</option>
              <option value="low">★ 낮음</option>
            </select>
          </div>
        </div>
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  오더일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  대리점/고객명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  주소
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  실측 예정
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  매니저
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시공일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {measurements.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    등록된 실측 요청이 없습니다.
                  </td>
                </tr>
              ) : (
                measurements.map((item) => {
                  const daysLeft = getDaysUntilConstruction(item.confirmed_construction_date);
                  const isUrgent = daysLeft !== null && daysLeft < 6;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${isUrgent ? 'bg-red-50' : ''}`}
                      onClick={() => navigate(`/measurements/edit/${item.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.request_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.client_company}</div>
                        <div className="text-sm text-gray-500">{item.customer_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{item.site_address}</div>
                        <div className="text-sm text-gray-500">{item.address_detail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.scheduled_measurement_date ? (
                          <>
                            <div className="text-sm text-gray-900">{item.scheduled_measurement_date}</div>
                            {item.scheduled_measurement_time && (
                              <div className="text-sm text-gray-500">{item.scheduled_measurement_time}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">미정</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.assigned_manager || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.confirmed_construction_date ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.confirmed_construction_date}
                            </div>
                            {daysLeft !== null && (
                              <div className={`text-xs ${isUrgent ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                {isUrgent && '⚠️ '}{daysLeft}일 남음
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">미정</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPriorityBadge(item.priority)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/measurements/edit/${item.id}`);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          수정
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">전체 실측 요청</h3>
          <p className="text-3xl font-bold text-gray-900">{measurements.length}건</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">실측 대기중</h3>
          <p className="text-3xl font-bold text-gray-900">
            {measurements.filter(m => m.status === 'pending').length}건
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">실측 완료</h3>
          <p className="text-3xl font-bold text-blue-600">
            {measurements.filter(m => m.status === 'measured').length}건
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">긴급 처리 필요</h3>
          <p className="text-3xl font-bold text-red-600">
            {measurements.filter(m => m.priority === 'urgent').length}건
          </p>
        </div>
      </div>
    </div>
  );
}
