import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

export default function MeasurementForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState({
    client_company: 'LX',
    customer_name: '',
    customer_phone: '',
    site_address: '',
    address_detail: '',
    request_date: new Date().toISOString().split('T')[0],
    scheduled_measurement_date: '',
    measurement_time: '',
    assigned_manager: '',
    measurement_assignee: '',
    priority: 'normal',
    status: 'pending',
    desired_construction_date: '',
    confirmed_construction_date: '',
    actual_measurement_date: '',
    notes: '',
    measurement_photo_url: ''
  });

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
    if (isEditMode) {
      fetchMeasurement();
    }
  }, [id]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/settings/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('업체 목록 조회 실패:', error);
    }
  };

  const fetchMeasurement = async () => {
    try {
      const response = await api.get(`/api/measurements/${id}`);
      setForm(response.data);
    } catch (error) {
      alert('실측 정보를 불러오는데 실패했습니다.');
      navigate('/measurements');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 6일 전 규칙 체크
      if (form.confirmed_construction_date && form.actual_measurement_date) {
        const constructionDate = new Date(form.confirmed_construction_date);
        const measurementDate = new Date(form.actual_measurement_date);
        const daysDiff = Math.floor((constructionDate - measurementDate) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 6) {
          if (!confirm(`⚠️ 경고: 시공일까지 ${daysDiff}일 남았습니다.\n6일 전 규칙을 위반합니다.\n그래도 진행하시겠습니까?`)) {
            setLoading(false);
            return;
          }
        }
      }

      if (isEditMode) {
        await api.put(`/api/measurements/${id}`, form);
        alert('실측 정보가 수정되었습니다.');
      } else {
        await api.post('/api/measurements', form);
        alert('실측 요청이 등록되었습니다.');
      }
      
      navigate('/measurements');
    } catch (error) {
      alert('저장 실패: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'normal': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return '실측 대기중';
      case 'measured': return '실측 완료';
      case 'scheduled': return '시공일 확정';
      case 'registered': return '시공등록 완료';
      default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {isEditMode ? '실측 정보 수정' : '실측 요청 등록'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 기본 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 대리점 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대리점 <span className="text-red-600">*</span>
                </label>
                <select
                  name="client_company"
                  value={form.client_company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {companies.map(company => (
                    <key={company.company_name} value={company.company_name}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 고객명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객명 <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* 고객 연락처 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객 연락처
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={form.customer_phone}
                  onChange={handleChange}
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 실측 오더일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  실측 오더일 <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="request_date"
                  value={form.request_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* 주소 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소 (시/구) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="site_address"
                  value={form.site_address}
                  onChange={handleChange}
                  placeholder="예: 울산 남구"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세주소 (아파트명/동/호)
                </label>
                <input
                  type="text"
                  name="address_detail"
                  value={form.address_detail}
                  onChange={handleChange}
                  placeholder="예: 신정푸르지오 202동 1501호"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 실측 일정 */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 실측 일정</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 담당 매니저 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당 매니저
                </label>
                <select
                  name="assigned_manager"
                  value={form.assigned_manager}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  <option value="이상무">이상무</option>
                  <option value="정호규">정호규</option>
                  <option value="김남군">김남군</option>
                </select>
              </div>

              {/* 실측예정자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  실측예정자
                </label>
                <input
                  type="text"
                  name="measurement_assignee"
                  value={form.measurement_assignee}
                  onChange={handleChange}
                  placeholder="실측 담당자 이름"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 실측 예정일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  실측 예정일
                </label>
                <input
                  type="date"
                  name="scheduled_measurement_date"
                  value={form.scheduled_measurement_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 실측 약속시간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  실측 약속시간
                </label>
                <input
                  type="time"
                  name="measurement_time"
                  value={form.measurement_time}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 실측 완료일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  실측 완료일
                </label>
                <input
                  type="date"
                  name="actual_measurement_date"
                  value={form.actual_measurement_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 시공일 정보 */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ 시공일 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 고객 희망 시공일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객 희망 시공일
                </label>
                <input
                  type="date"
                  name="desired_construction_date"
                  value={form.desired_construction_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 확정 시공일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  확정 시공일 ⭐
                </label>
                <input
                  type="date"
                  name="confirmed_construction_date"
                  value={form.confirmed_construction_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-yellow-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-yellow-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ 시공일 입력 시 시공 스케줄에 자동 등록됩니다
                </p>
              </div>
            </div>
          </div>

          {/* 우선순위 및 상태 */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ 우선순위 & 상태</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  우선순위
                </label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold ${getPriorityColor(form.priority)}`}
                >
                  <option value="urgent" className="text-red-600">★★★ 긴급 (시공일 잡힘 OR 6일 미만)</option>
                  <option value="normal" className="text-yellow-600">★★ 보통 (일반 실측)</option>
                  <option value="low" className="text-green-600">★ 낮음 (여유 있음)</option>
                </select>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  진행 상태
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">실측 대기중</option>
                  <option value="measured">실측 완료</option>
                  <option value="scheduled">시공일 확정</option>
                  <option value="registered">시공등록 완료</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  현재: <span className="font-semibold">{getStatusLabel(form.status)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* 특이사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              특이사항 / 메모
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="4"
              placeholder="특이사항, 고객 요청사항 등을 입력하세요..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 실측지 사진 (나중에 구현) */}
          <div className="bg-gray-50 p-4 rounded-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📸 실측지 사진 URL
            </label>
            <input
              type="text"
              name="measurement_photo_url"
              value={form.measurement_photo_url}
              onChange={handleChange}
              placeholder="사진 URL (추후 업로드 기능 추가 예정)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 현재는 URL만 입력 가능합니다. 사진 업로드 기능은 곧 추가됩니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/measurements')}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
