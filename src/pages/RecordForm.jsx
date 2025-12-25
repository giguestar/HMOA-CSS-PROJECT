import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function RecordForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);

  const [formData, setFormData] = useState({
    construction_date: new Date().toISOString().slice(0, 10),
    client_company: '',
    customer_name: '',
    special_notes: '',
    is_resident: '거주',
    site_address: '',
    building_unit: '',
    team: '',
    
    // 청구 금액
    standard_cost: 0,
    protection_cost: 0,
    demolition_qty: 0,
    demolition_cost: 0,
    equipment_desc: '',
    equipment_cost: 0,
    measurement_cost: 0,
    
    // 지급 금액 (청구와 다를 경우만 입력)
    outsource_total_cost: 0,
    actual_settlement: 0,
    
    remarks: '',
    additionalWorks: []
  });

  const [additionalWorkTypes] = useState([
    '난간대', '방범창', '롤망', '루버', '몰딩', '타일', '기타'
  ]);

  useEffect(() => {
    fetchSettings();
    if (id) {
      fetchRecord();
    }
  }, [id]);

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

  const fetchRecord = async () => {
    try {
      const response = await api.get(`/api/records/${id}`);
      setFormData(response.data);
    } catch (error) {
      console.error('시공내역 조회 실패:', error);
      alert('시공내역을 불러오지 못했습니다.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseInt(value)) : value
    }));
  };

  const handleAddWork = () => {
    setFormData(prev => ({
      ...prev,
      additionalWorks: [...prev.additionalWorks, { work_type: '', is_required: false, cost: 0, notes: '' }]
    }));
  };

  const handleWorkChange = (index, field, value) => {
    setFormData(prev => {
      const newWorks = [...prev.additionalWorks];
      newWorks[index] = { ...newWorks[index], [field]: value };
      return { ...prev, additionalWorks: newWorks };
    });
  };

  const handleRemoveWork = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalWorks: prev.additionalWorks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await api.put(`/api/records/${id}`, formData);
        alert('시공내역이 수정되었습니다.');
      } else {
        await api.post('/api/records', formData);
        alert('시공내역이 등록되었습니다.');
      }
      navigate('/records');
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR').format(value || 0);
  };

  // 자동 계산: 지급금액이 비어있으면 청구금액과 동일하게
  const getDisplayPayment = () => {
    if (formData.outsource_total_cost === 0) {
      const totalBilling = 
        (formData.standard_cost || 0) + 
        (formData.protection_cost || 0) + 
        (formData.demolition_cost || 0) + 
        (formData.equipment_cost || 0) + 
        (formData.measurement_cost || 0);
      return totalBilling;
    }
    return formData.outsource_total_cost;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {id ? '시공내역 수정' : '시공내역 등록'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 */}
          <section className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시공일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="construction_date"
                  value={formData.construction_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  발주업체 <span className="text-red-500">*</span>
                </label>
                <select
                  name="client_company"
                  value={formData.client_company}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.company_name}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">고객명</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  시공팀 <span className="text-red-500">*</span>
                </label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택하세요</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.team_name}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거주 여부</label>
                <select
                  name="is_resident"
                  value={formData.is_resident}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="거주">거주</option>
                  <option value="비거주">비거주</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
                <input
                  type="text"
                  name="special_notes"
                  value={formData.special_notes}
                  onChange={handleChange}
                  placeholder="2차, 거주 등"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">현장 주소</label>
                <input
                  type="text"
                  name="site_address"
                  value={formData.site_address}
                  onChange={handleChange}
                  placeholder="울산 남구"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">동/호수</label>
                <input
                  type="text"
                  name="building_unit"
                  value={formData.building_unit}
                  onChange={handleChange}
                  placeholder="옥동 서광 101동 1608호"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </section>

          {/* 청구 금액 */}
          <section className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">💰 청구 금액 (발주업체에 청구)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">표준시공비</label>
                <input
                  type="number"
                  name="standard_cost"
                  value={formData.standard_cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.standard_cost)}원</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">보양비</label>
                <input
                  type="number"
                  name="protection_cost"
                  value={formData.protection_cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.protection_cost)}원</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">철거 수량</label>
                <input
                  type="number"
                  name="demolition_qty"
                  value={formData.demolition_qty || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">철거비</label>
                <input
                  type="number"
                  name="demolition_cost"
                  value={formData.demolition_cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.demolition_cost)}원</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장비 내용</label>
                <input
                  type="text"
                  name="equipment_desc"
                  value={formData.equipment_desc}
                  onChange={handleChange}
                  placeholder="도수, 사다리, 윈치, 스카이 등"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">장비비</label>
                <input
                  type="number"
                  name="equipment_cost"
                  value={formData.equipment_cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.equipment_cost)}원</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">실측비</label>
                <input
                  type="number"
                  name="measurement_cost"
                  value={formData.measurement_cost || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.measurement_cost)}원</p>
              </div>

              <div className="md:col-span-2">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-blue-900">
                    총 청구 금액: <span className="text-xl font-bold">
                      {formatCurrency(
                        (formData.standard_cost || 0) + 
                        (formData.protection_cost || 0) + 
                        (formData.demolition_cost || 0) + 
                        (formData.equipment_cost || 0) + 
                        (formData.measurement_cost || 0)
                      )}원
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 지급 금액 */}
          <section className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">💸 지급 금액 (외주팀에 지급)</h2>
            <p className="text-sm text-gray-600 mb-4">
              💡 청구금액과 <strong>다른 경우에만</strong> 입력하세요. 비워두면 청구금액과 동일하게 적용됩니다.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">외주 공사비</label>
                <input
                  type="number"
                  name="outsource_total_cost"
                  value={formData.outsource_total_cost || ''}
                  onChange={handleChange}
                  placeholder="청구금액과 동일 (자동 계산)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(getDisplayPayment())}원</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">실정산 금액</label>
                <input
                  type="number"
                  name="actual_settlement"
                  value={formData.actual_settlement || ''}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.actual_settlement)}원</p>
              </div>

              <div className="md:col-span-2">
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-green-900">
                    총 지급 금액: <span className="text-xl font-bold">
                      {formatCurrency(getDisplayPayment())}원
                    </span>
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    마진: {formatCurrency(
                      ((formData.standard_cost || 0) + 
                      (formData.protection_cost || 0) + 
                      (formData.demolition_cost || 0) + 
                      (formData.equipment_cost || 0) + 
                      (formData.measurement_cost || 0)) - getDisplayPayment()
                    )}원
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 부가작업 */}
          <section className="border-b pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">🔧 부가작업 (난간대, 방범창 등)</h2>
              <button
                type="button"
                onClick={handleAddWork}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
              >
                + 부가작업 추가
              </button>
            </div>

            {formData.additionalWorks.length > 0 ? (
              <div className="space-y-3">
                {formData.additionalWorks.map((work, index) => (
                  <div key={index} className="flex items-start gap-2 bg-gray-50 p-3 rounded-md">
                    <select
                      value={work.work_type}
                      onChange={(e) => handleWorkChange(index, 'work_type', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">작업 유형 선택</option>
                      {additionalWorkTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>

                    <label className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md">
                      <input
                        type="checkbox"
                        checked={work.is_required}
                        onChange={(e) => handleWorkChange(index, 'is_required', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">필수제작</span>
                    </label>

                    <input
                      type="number"
                      value={work.cost || ''}
                      onChange={(e) => handleWorkChange(index, 'cost', parseInt(e.target.value) || 0)}
                      placeholder="비용"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      value={work.notes}
                      onChange={(e) => handleWorkChange(index, 'notes', e.target.value)}
                      placeholder="메모"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveWork(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-md">
                부가작업이 없습니다. 필요시 추가 버튼을 눌러주세요.
              </div>
            )}
          </section>

          {/* 비고 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 비고</h2>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              placeholder="기타 특이사항을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </section>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium disabled:bg-gray-400"
            >
              {loading ? '저장 중...' : (id ? '수정하기' : '등록하기')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/records')}
              className="px-8 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
