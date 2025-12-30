import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

export default function SettlementForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // 기본 정보
  const [basicInfo, setBasicInfo] = useState({
    construction_date: new Date().toISOString().split('T')[0],
    client_company: '',
    customer_name: '',
    site_address: '',
    team: '',
    is_cash_payment: false,
    settlement_date: ''
  });

  // 청구분 (대리점)
  const [billing, setBilling] = useState({
    standard_cost_1: 0,
    is_electronic_1: true, // 기본값: 전산
    standard_cost_2: 0,
    is_electronic_2: true, // 기본값: 전산
    measurement_cost: 0, // 💡 실측비는 청구분에만!
    protection_cost: 0,
    demolition_qty: 0,
    demolition_unit_price: 40000,
    equipment_desc: '',
    equipment_cost: 0,
    additional_items: Array(5).fill({ name: '', amount: 0 })
  });

  // 지급분 (외주팀)
  const [payment, setPayment] = useState({
    standard_cost: 0,
    // measurement_cost: 없음! (실측비는 지급 안 함)
    protection_cost: 0,
    demolition_qty: 0,
    demolition_unit_price: 40000,
    equipment_cost: 0,
    additional_items: Array(5).fill({ name: '', amount: 0 })
  });

  // 고객 원수금
  const [customerDirect, setCustomerDirect] = useState(
    Array(5).fill({ name: '', amount: 0 })
  );

  // 인임결재 (주문제작)
  const [customOrders, setCustomOrders] = useState(
    Array(5).fill({ name: '', amount: 0 })
  );

  // 수동 수정 플래그 (자동 복사 방지용)
  const [paymentManuallyEdited, setPaymentManuallyEdited] = useState({});

  // 자동 동기화 ON/OFF
  const [autoSync, setAutoSync] = useState(true);

  // 회사 목록
  const [companies, setCompanies] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    fetchCompanies();
    fetchTeams();
    if (isEditMode) {
      fetchSettlement();
    }
  }, [id]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/api/settings/companies');
      setCompanies(response.data);
    } catch (error) {
      console.error('업체 조회 실패:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/api/settings/teams');
      setTeams(response.data);
    } catch (error) {
      console.error('팀 조회 실패:', error);
    }
  };

  const fetchSettlement = async () => {
    try {
      const response = await api.get(`/api/settlements/${id}`);
      const data = response.data;
      
      setBasicInfo({
        construction_date: data.construction_date,
        client_company: data.client_company,
        customer_name: data.customer_name,
        site_address: data.site_address,
        team: data.team,
        is_cash_payment: data.is_cash_payment,
        settlement_date: data.settlement_date
      });

      setBilling({
        standard_cost_1: data.billing_standard_cost_1 || 0,
        is_electronic_1: data.billing_is_electronic_1 !== undefined ? data.billing_is_electronic_1 : true,
        standard_cost_2: data.billing_standard_cost_2 || 0,
        is_electronic_2: data.billing_is_electronic_2 !== undefined ? data.billing_is_electronic_2 : true,
        measurement_cost: data.billing_measurement_cost || 0,
        protection_cost: data.billing_protection_cost || 0,
        demolition_qty: data.billing_demolition_qty || 0,
        demolition_unit_price: data.billing_demolition_unit_price || 40000,
        equipment_desc: data.billing_equipment_desc || '',
        equipment_cost: data.billing_equipment_cost || 0,
        additional_items: JSON.parse(data.billing_additional_items || '[]')
      });

      setPayment({
        standard_cost: data.payment_standard_cost || 0,
        protection_cost: data.payment_protection_cost || 0,
        demolition_qty: data.payment_demolition_qty || 0,
        demolition_unit_price: data.payment_demolition_unit_price || 40000,
        equipment_cost: data.payment_equipment_cost || 0,
        additional_items: JSON.parse(data.payment_additional_items || '[]')
      });

      setCustomerDirect(JSON.parse(data.customer_direct_items || '[]'));
      setCustomOrders(JSON.parse(data.custom_order_items || '[]'));
    } catch (error) {
      console.error('정산 정보 조회 실패:', error);
      alert('정산 정보를 불러오는데 실패했습니다.');
    }
  };

  // 청구분 변경 시 지급분 자동 동기화
  const handleBillingChange = (field, value) => {
    setBilling({ ...billing, [field]: value });

    // 자동 동기화 ON이고, 사용자가 직접 수정하지 않았으면
    if (autoSync && !paymentManuallyEdited[field]) {
      // 실측비는 동기화하지 않음!
      if (field === 'measurement_cost') return;

      // 표준시공비는 기본값으로 동일하게 적용
      if (field === 'standard_cost_1' || field === 'standard_cost_2') {
        // standard_cost_1, standard_cost_2 모두 합산하여 payment.standard_cost에 설정
        const newBilling = { ...billing, [field]: value };
        const totalStandardCost = (Number(newBilling.standard_cost_1) || 0) + (Number(newBilling.standard_cost_2) || 0);
        setPayment({ ...payment, standard_cost: totalStandardCost });
      } else {
        setPayment({ ...payment, [field]: value });
      }
    }
  };

  // 지급분 수정 시 수동 플래그 설정
  const handlePaymentChange = (field, value) => {
    setPayment({ ...payment, [field]: value });
    setPaymentManuallyEdited({ ...paymentManuallyEdited, [field]: true });
  };

  // 총 청구액 계산
  const calculateBillingTotal = () => {
    const standard1 = Number(billing.standard_cost_1) || 0;
    const standard2 = Number(billing.standard_cost_2) || 0;
    const measurement = Number(billing.measurement_cost) || 0;
    const protection = Number(billing.protection_cost) || 0;
    const demolition = (Number(billing.demolition_qty) || 0) * (Number(billing.demolition_unit_price) || 0);
    const equipment = Number(billing.equipment_cost) || 0;
    const additional = billing.additional_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return standard1 + standard2 + measurement + protection + demolition + equipment + additional;
  };

  // 총 지급액 계산
  const calculatePaymentTotal = () => {
    const standard = Number(payment.standard_cost) || 0;
    const protection = Number(payment.protection_cost) || 0;
    const demolition = (Number(payment.demolition_qty) || 0) * (Number(payment.demolition_unit_price) || 0);
    const equipment = Number(payment.equipment_cost) || 0;
    const additional = payment.additional_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const customOrderTotal = customOrders.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    return standard + protection + demolition + equipment + additional + customOrderTotal;
  };

  // 수익 계산
  const calculateProfit = () => {
    const billingTotal = calculateBillingTotal();
    const paymentTotal = calculatePaymentTotal();
    const customerDirectTotal = customerDirect.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const profit = billingTotal + customerDirectTotal - paymentTotal;
    const profitRate = billingTotal > 0 ? (profit / billingTotal) * 100 : 0;

    return { profit, profitRate };
  };

  // 정산 예정일 자동 계산
  useEffect(() => {
    if (!basicInfo.construction_date || !basicInfo.client_company) return;

    const company = companies.find(c => c.company_name === basicInfo.client_company);
    if (!company) return;

    const date = new Date(basicInfo.construction_date);
    let settlementDate;

    switch (company.settlement_type) {
      case 'monthly_end':
        // 월말 정산: 익월 5일
        settlementDate = new Date(date.getFullYear(), date.getMonth() + 1, 5);
        break;
      case 'bimonthly':
        // 케스코: 1-15 → 30일, 16-30 → 익월 15일
        const day = date.getDate();
        if (day <= 15) {
          settlementDate = new Date(date.getFullYear(), date.getMonth(), 30);
        } else {
          settlementDate = new Date(date.getFullYear(), date.getMonth() + 1, 15);
        }
        break;
      case 'bimonthly_custom':
        // 청암: 1-11 → 11일, 12-21 → 21일, 22-30 → 익월 11일
        const day2 = date.getDate();
        if (day2 <= 11) {
          settlementDate = new Date(date.getFullYear(), date.getMonth(), 11);
        } else if (day2 <= 21) {
          settlementDate = new Date(date.getFullYear(), date.getMonth(), 21);
        } else {
          settlementDate = new Date(date.getFullYear(), date.getMonth() + 1, 11);
        }
        break;
      default:
        settlementDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }

    setBasicInfo({
      ...basicInfo,
      settlement_date: settlementDate.toISOString().split('T')[0]
    });
  }, [basicInfo.construction_date, basicInfo.client_company, companies]);

  // 저장
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 항목 체크
    if (!basicInfo.construction_date) {
      alert('시공일을 입력해주세요.');
      return;
    }
    if (!basicInfo.client_company) {
      alert('대리점을 선택해주세요.');
      return;
    }
    if (!billing.standard_cost_1 && !billing.standard_cost_2) {
      alert('표준시공비를 입력해주세요.');
      return;
    }

    // 💡 누락 체크
    const warnings = checkMissingFields();
    if (warnings.length > 0) {
      const message = '다음 항목을 확인하세요:\n\n' + warnings.join('\n') + '\n\n그래도 저장하시겠습니까?';
      if (!window.confirm(message)) {
        return;
      }
    }

    const billingTotal = calculateBillingTotal();
    const paymentTotal = calculatePaymentTotal();
    const { profit, profitRate } = calculateProfit();

    const data = {
      // 기본 정보
      construction_date: basicInfo.construction_date,
      client_company: basicInfo.client_company,
      customer_name: basicInfo.customer_name,
      site_address: basicInfo.site_address,
      team: basicInfo.team,
      is_cash_payment: basicInfo.is_cash_payment,
      settlement_date: basicInfo.settlement_date,

      // 청구분
      billing_standard_cost_1: billing.standard_cost_1,
      billing_is_electronic_1: billing.is_electronic_1,
      billing_standard_cost_2: billing.standard_cost_2,
      billing_is_electronic_2: billing.is_electronic_2,
      billing_measurement_cost: billing.measurement_cost,
      billing_protection_cost: billing.protection_cost,
      billing_demolition_qty: billing.demolition_qty,
      billing_demolition_unit_price: billing.demolition_unit_price,
      billing_equipment_desc: billing.equipment_desc,
      billing_equipment_cost: billing.equipment_cost,
      billing_total_amount: billingTotal,
      billing_additional_items: JSON.stringify(billing.additional_items),

      // 지급분
      payment_standard_cost: payment.standard_cost,
      payment_protection_cost: payment.protection_cost,
      payment_demolition_qty: payment.demolition_qty,
      payment_demolition_unit_price: payment.demolition_unit_price,
      payment_equipment_cost: payment.equipment_cost,
      payment_total_amount: paymentTotal,
      payment_additional_items: JSON.stringify(payment.additional_items),

      // 수익
      profit_amount: profit,
      profit_rate: profitRate,

      // 고객 원수금
      customer_direct_items: JSON.stringify(customerDirect),

      // 인임결재
      custom_order_items: JSON.stringify(customOrders),

      // 정산 상태
      settlement_status: basicInfo.is_cash_payment ? '완료' : '미정산'
    };

    try {
      if (isEditMode) {
        await api.put(`/api/settlements/${id}`, data);
        alert('정산이 수정되었습니다.');
      } else {
        await api.post('/api/settlements', data);
        alert('정산이 등록되었습니다.');
      }
      navigate('/settlements');
    } catch (error) {
      console.error('정산 저장 실패:', error);
      alert('정산 저장에 실패했습니다.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount || 0);
  };

  const { profit, profitRate } = calculateProfit();
  const isDifferent = (billingField, paymentField) => {
    return billing[billingField] !== payment[paymentField];
  };
  
  // 표준시공비 합계와 외주 표준시공비 비교
  const isStandardCostDifferent = () => {
    const billingTotal = (Number(billing.standard_cost_1) || 0) + (Number(billing.standard_cost_2) || 0);
    return billingTotal !== (Number(payment.standard_cost) || 0);
  };

  // 💡 빠른 입력: 일반 철거 단가 자동 설정
  const applyStandardDemolition = () => {
    const standardQty = 14;
    const standardPrice = 40000;
    
    setBilling({
      ...billing,
      demolition_qty: standardQty,
      demolition_unit_price: standardPrice
    });

    if (autoSync) {
      setPayment({
        ...payment,
        demolition_qty: 6, // 외주는 6개
        demolition_unit_price: standardPrice
      });
    }
  };

  // 💡 85% 일괄 적용
  const apply85PercentAll = () => {
    if (!window.confirm('시공비 합계(표준+보양+철거+부가)의 85%를 적용하시겠습니까?')) return;

    // 표준시공비 + 보양 + 철거 + 부가시공비 합계
    const standard1 = Number(billing.standard_cost_1) || 0;
    const standard2 = Number(billing.standard_cost_2) || 0;
    const protection = Number(billing.protection_cost) || 0;
    const demolition = (Number(billing.demolition_qty) || 0) * (Number(billing.demolition_unit_price) || 0);
    const equipment = Number(billing.equipment_cost) || 0;
    const additional = billing.additional_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    
    const totalConstructionCost = standard1 + standard2 + protection + demolition + equipment + additional;
    const payment85Percent = Math.round(totalConstructionCost * 0.85);

    setPayment({
      ...payment,
      standard_cost: payment85Percent
    });

    // 수동 플래그 초기화
    setPaymentManuallyEdited({});
  };

  // 💡 누락 체크
  const checkMissingFields = () => {
    const warnings = [];

    if (billing.standard_cost_1 === 0 && billing.standard_cost_2 === 0) {
      warnings.push('⚠️ 표준시공비가 입력되지 않았습니다.');
    }

    if (!basicInfo.team) {
      warnings.push('⚠️ 외주팀이 선택되지 않았습니다.');
    }

    if (calculateBillingTotal() === 0) {
      warnings.push('⚠️ 총 청구액이 0원입니다.');
    }

    if (calculatePaymentTotal() > calculateBillingTotal() + customerDirect.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)) {
      warnings.push('❌ 지급액이 청구액보다 큽니다! 확인하세요.');
    }

    if (profitRate < 10) {
      warnings.push('⚠️ 수익률이 10% 미만입니다. 금액을 확인하세요.');
    }

    return warnings;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? '정산 수정' : '시공 정산 작성'}
        </h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              🔄 자동동기화 {autoSync ? 'ON' : 'OFF'}
            </span>
          </label>
          
          {/* 💡 빠른 입력 버튼 */}
          <button
            type="button"
            onClick={applyStandardDemolition}
            className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-md hover:bg-yellow-200 transition-colors"
          >
            ⚡ 일반 철거 (14개/6개)
          </button>
          
          <button
            type="button"
            onClick={apply85PercentAll}
            className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md hover:bg-green-200 transition-colors"
          >
            📊 85% 일괄적용
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시공일 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={basicInfo.construction_date}
                onChange={(e) => setBasicInfo({ ...basicInfo, construction_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                대리점 <span className="text-red-500">*</span>
              </label>
              <select
                value={basicInfo.client_company}
                onChange={(e) => setBasicInfo({ ...basicInfo, client_company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-1">외주팀</label>
              <select
                value={basicInfo.team}
                onChange={(e) => setBasicInfo({ ...basicInfo, team: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">고객명</label>
              <input
                type="text"
                value={basicInfo.customer_name}
                onChange={(e) => setBasicInfo({ ...basicInfo, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">현장주소</label>
              <input
                type="text"
                value={basicInfo.site_address}
                onChange={(e) => setBasicInfo({ ...basicInfo, site_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!basicInfo.is_cash_payment}
                onChange={(e) => setBasicInfo({ ...basicInfo, is_cash_payment: !e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">☑️ 전산정산</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={basicInfo.is_cash_payment}
                onChange={(e) => setBasicInfo({ ...basicInfo, is_cash_payment: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">☐ 현금</span>
            </label>
            <div className="text-sm text-gray-600">
              정산예정일: <span className="font-semibold">{basicInfo.settlement_date || '-'}</span>
            </div>
          </div>
        </div>

        {/* 시공 내역 및 정산 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">시공 내역 및 정산</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 청구분 (좌측) */}
            <div className="border-r border-gray-200 pr-6">
              <h3 className="text-md font-semibold text-blue-900 mb-4 flex items-center">
                <span className="mr-2">📊</span> 청구분 (대리점)
              </h3>

              {/* 표준시공비 2줄 (현금/전산 분리) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  표준시공비 <span className="text-red-500">*</span>
                </label>
                
                {/* 첫 번째 줄 */}
                <div className="mb-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-600">1번</span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={billing.is_electronic_1}
                        onChange={(e) => handleBillingChange('is_electronic_1', e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-xs text-gray-700">전산</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!billing.is_electronic_1}
                        onChange={(e) => handleBillingChange('is_electronic_1', !e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-xs text-gray-700">현금</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    value={billing.standard_cost_1}
                    onChange={(e) => handleBillingChange('standard_cost_1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="표준시공비 1"
                  />
                </div>

                {/* 두 번째 줄 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-600">2번</span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={billing.is_electronic_2}
                        onChange={(e) => handleBillingChange('is_electronic_2', e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-xs text-gray-700">전산</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!billing.is_electronic_2}
                        onChange={(e) => handleBillingChange('is_electronic_2', !e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-xs text-gray-700">현금</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    value={billing.standard_cost_2}
                    onChange={(e) => handleBillingChange('standard_cost_2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="표준시공비 2"
                  />
                </div>
              </div>

              {/* 실측비 (청구분에만!) */}
              <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-blue-900 mb-1 flex items-center">
                  <span className="mr-1">💡</span> 실측비 (청구분만)
                </label>
                <input
                  type="number"
                  value={billing.measurement_cost}
                  onChange={(e) => handleBillingChange('measurement_cost', e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 연관시공비 */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🏗️ 연관시공비</h4>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">보양</label>
                    <input
                      type="number"
                      value={billing.protection_cost}
                      onChange={(e) => handleBillingChange('protection_cost', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded">
                    <label className="block text-xs text-gray-600 mb-1">철거업체</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">수량</label>
                        <input
                          type="number"
                          value={billing.demolition_qty}
                          onChange={(e) => handleBillingChange('demolition_qty', e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">단세</label>
                        <input
                          type="number"
                          value={billing.demolition_unit_price}
                          onChange={(e) => handleBillingChange('demolition_unit_price', e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-700">
                      = {formatCurrency(billing.demolition_qty * billing.demolition_unit_price)} 원
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">장비내용</label>
                    <input
                      type="text"
                      value={billing.equipment_desc}
                      onChange={(e) => handleBillingChange('equipment_desc', e.target.value)}
                      className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md mb-1"
                      placeholder="예: 사다리 40분"
                    />
                    <input
                      type="number"
                      value={billing.equipment_cost}
                      onChange={(e) => handleBillingChange('equipment_cost', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* 부가시공비 */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🔧 부가시공비 (5개)</h4>
                {billing.additional_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="내용"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...billing.additional_items];
                        newItems[index] = { ...item, name: e.target.value };
                        handleBillingChange('additional_items', newItems);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="시공비"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...billing.additional_items];
                        newItems[index] = { ...item, amount: e.target.value };
                        handleBillingChange('additional_items', newItems);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>

              {/* 고객 원수금 */}
              <div className="mb-4 bg-green-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-2">📏 고객 원수금 내역 (5개)</h4>
                {customerDirect.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="내용"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...customerDirect];
                        newItems[index] = { ...item, name: e.target.value };
                        setCustomerDirect(newItems);
                      }}
                      className="px-3 py-1 text-sm border border-green-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="시공비"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...customerDirect];
                        newItems[index] = { ...item, amount: e.target.value };
                        setCustomerDirect(newItems);
                      }}
                      className="px-3 py-1 text-sm border border-green-300 rounded-md"
                    />
                  </div>
                ))}
              </div>

              {/* 총 청구액 */}
              <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                <div className="text-lg font-bold text-blue-900">
                  💰 총 청구액: {formatCurrency(calculateBillingTotal())} 원
                </div>
              </div>
            </div>

            {/* 지급분 (우측) */}
            <div className="pl-6">
              <h3 className="text-md font-semibold text-green-900 mb-4 flex items-center">
                <span className="mr-2">📊</span> 지급분 (외주팀)
              </h3>

              {/* 표준시공비 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  표준시공비 
                  {isStandardCostDifferent() && (
                    <span className="ml-2 text-xs text-yellow-600">⚠️ 차이 발생</span>
                  )}
                  {paymentManuallyEdited.standard_cost && (
                    <span className="ml-2 text-xs text-purple-600">✏️ 수동 수정됨</span>
                  )}
                </label>
                <input
                  type="number"
                  value={payment.standard_cost}
                  onChange={(e) => handlePaymentChange('standard_cost', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                    isStandardCostDifferent()
                      ? 'bg-yellow-50 border-yellow-400 focus:ring-yellow-500'
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {autoSync && !paymentManuallyEdited.standard_cost && (
                  <p className="text-xs text-blue-600 mt-1">🔵 기본값 동일 적용</p>
                )}
                {isStandardCostDifferent() && (
                  <div className="mt-1 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                    💰 차액: +{formatCurrency((Number(billing.standard_cost_1) || 0) + (Number(billing.standard_cost_2) || 0) - (Number(payment.standard_cost) || 0))} 원
                  </div>
                )}
              </div>

              {/* 실측비 없음 표시 */}
              <div className="mb-4 bg-gray-100 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  💡 실측비 (지급 없음)
                </label>
                <input
                  type="text"
                  value="0 원"
                  disabled
                  className="w-full px-3 py-2 bg-gray-200 text-gray-500 border border-gray-300 rounded-md"
                />
              </div>

              {/* 연관시공비 */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🏗️ 연관시공비</h4>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 flex items-center">
                      보양
                      {isDifferent('protection_cost', 'protection_cost') && (
                        <span className="ml-2 text-xs text-yellow-600">⚠️ 차이</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={payment.protection_cost}
                      onChange={(e) => handlePaymentChange('protection_cost', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                        isDifferent('protection_cost', 'protection_cost')
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'border-gray-300'
                      }`}
                    />
                    {isDifferent('protection_cost', 'protection_cost') && (
                      <div className="mt-1 text-xs text-yellow-700">
                        💰 차액: +{formatCurrency(billing.protection_cost - payment.protection_cost)} 원
                      </div>
                    )}
                  </div>

                  <div className={`p-3 rounded ${
                    isDifferent('demolition_qty', 'demolition_qty') ? 'bg-yellow-50' : 'bg-gray-50'
                  }`}>
                    <label className="block text-xs text-gray-600 mb-1 flex items-center">
                      철거업체
                      {isDifferent('demolition_qty', 'demolition_qty') && (
                        <span className="ml-2 text-xs text-yellow-600">⚠️ 차이</span>
                      )}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500">수량</label>
                        <input
                          type="number"
                          value={payment.demolition_qty}
                          onChange={(e) => handlePaymentChange('demolition_qty', e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">단세</label>
                        <input
                          type="number"
                          value={payment.demolition_unit_price}
                          onChange={(e) => handlePaymentChange('demolition_unit_price', e.target.value)}
                          className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-gray-700">
                      = {formatCurrency(payment.demolition_qty * payment.demolition_unit_price)} 원
                    </div>
                    {isDifferent('demolition_qty', 'demolition_qty') && (
                      <div className="mt-2 text-xs text-yellow-700">
                        💰 차액: +{formatCurrency(
                          (billing.demolition_qty * billing.demolition_unit_price) -
                          (payment.demolition_qty * payment.demolition_unit_price)
                        )} 원
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1 flex items-center">
                      장비비
                      {isDifferent('equipment_cost', 'equipment_cost') && (
                        <span className="ml-2 text-xs text-yellow-600">⚠️ 차이</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={payment.equipment_cost}
                      onChange={(e) => handlePaymentChange('equipment_cost', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-md transition-colors ${
                        isDifferent('equipment_cost', 'equipment_cost')
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'border-gray-300'
                      }`}
                    />
                    {isDifferent('equipment_cost', 'equipment_cost') && (
                      <div className="mt-1 text-xs text-yellow-700">
                        💰 차액: +{formatCurrency(billing.equipment_cost - payment.equipment_cost)} 원
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 부가시공비 */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🔧 부가시공비 (5개)</h4>
                {payment.additional_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="내용"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...payment.additional_items];
                        newItems[index] = { ...item, name: e.target.value };
                        handlePaymentChange('additional_items', newItems);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="시공비"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...payment.additional_items];
                        newItems[index] = { ...item, amount: e.target.value };
                        handlePaymentChange('additional_items', newItems);
                      }}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                ))}
              </div>

              {/* 인임결재 (주문제작) */}
              <div className="mb-4 bg-purple-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-900 mb-2">💼 인임결재 (기타공사/주문제작 등) (5개)</h4>
                {customOrders.map((item, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="내용"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...customOrders];
                        newItems[index] = { ...item, name: e.target.value };
                        setCustomOrders(newItems);
                      }}
                      className="px-3 py-1 text-sm border border-purple-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="시공비"
                      value={item.amount}
                      onChange={(e) => {
                        const newItems = [...customOrders];
                        newItems[index] = { ...item, amount: e.target.value };
                        setCustomOrders(newItems);
                      }}
                      className="px-3 py-1 text-sm border border-purple-300 rounded-md"
                    />
                  </div>
                ))}
              </div>

              {/* 총 지급액 */}
              <div className="mt-4 p-4 bg-green-100 rounded-lg">
                <div className="text-lg font-bold text-green-900">
                  💸 총 지급액: {formatCurrency(calculatePaymentTotal())} 원
                </div>
              </div>

              {/* 예상 수익 */}
              <div className={`mt-4 p-4 rounded-lg border-2 transition-colors ${
                profitRate >= 20 ? 'bg-green-100 border-green-300' :
                profitRate >= 15 ? 'bg-blue-100 border-blue-300' :
                profitRate >= 10 ? 'bg-yellow-100 border-yellow-300' :
                'bg-red-100 border-red-300'
              }`}>
                <div className={`text-lg font-bold ${
                  profitRate >= 20 ? 'text-green-900' :
                  profitRate >= 15 ? 'text-blue-900' :
                  profitRate >= 10 ? 'text-yellow-900' :
                  'text-red-900'
                }`}>
                  {profitRate >= 20 ? '🎉' : profitRate >= 15 ? '🎯' : profitRate >= 10 ? '⚠️' : '❌'} 
                  예상 수익: {formatCurrency(profit)} 원
                </div>
                <div className={`text-sm mt-1 font-semibold ${
                  profitRate >= 20 ? 'text-green-700' :
                  profitRate >= 15 ? 'text-blue-700' :
                  profitRate >= 10 ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  수익률: {profitRate.toFixed(2)}%
                  {profitRate >= 20 && ' (우수!)'}
                  {profitRate >= 15 && profitRate < 20 && ' (양호)'}
                  {profitRate >= 10 && profitRate < 15 && ' (낮음)'}
                  {profitRate < 10 && ' (매우 낮음 - 확인 필요!)'}
                </div>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>청구분 입력 시 지급분에 자동 복사됩니다</strong> (실측비 제외)
            </p>
            <p className="text-sm text-blue-700 mt-1">
              차이가 있는 항목만 수정하세요! 노란색으로 강조 표시됩니다.
            </p>
          </div>

          {/* 💡 최종 확인 요약 */}
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg">
            <h3 className="text-lg font-bold text-purple-900 mb-4">📋 최종 확인 요약</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600 mb-1">총 청구액</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(calculateBillingTotal())} 원
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  실측비 포함: {formatCurrency(billing.measurement_cost)} 원
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-600 mb-1">총 지급액</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculatePaymentTotal())} 원
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  인임결재 포함: {formatCurrency(customOrders.reduce((sum, item) => sum + (Number(item.amount) || 0), 0))} 원
                </div>
              </div>

              <div className={`p-4 rounded-lg shadow ${
                profitRate >= 15 ? 'bg-green-50' : profitRate >= 10 ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <div className="text-sm text-gray-600 mb-1">최종 수익</div>
                <div className={`text-2xl font-bold ${
                  profitRate >= 15 ? 'text-green-600' : profitRate >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {formatCurrency(profit)} 원
                </div>
                <div className={`text-xs mt-2 font-semibold ${
                  profitRate >= 15 ? 'text-green-700' : profitRate >= 10 ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  수익률: {profitRate.toFixed(2)}%
                  {profitRate >= 15 && ' ✅'}
                  {profitRate >= 10 && profitRate < 15 && ' ⚠️'}
                  {profitRate < 10 && ' ❌'}
                </div>
              </div>
            </div>

            {/* 💡 차이 항목 안내 */}
            <div className="mt-4 p-3 bg-white rounded-lg">
              <div className="text-sm font-semibold text-gray-700 mb-2">🔍 청구 vs 지급 차이 항목:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {isDifferent('standard_cost', 'standard_cost') && (
                  <div className="flex items-center text-yellow-700">
                    ⚠️ 표준시공비: +{formatCurrency(billing.standard_cost - payment.standard_cost)} 원
                  </div>
                )}
                {isDifferent('protection_cost', 'protection_cost') && (
                  <div className="flex items-center text-yellow-700">
                    ⚠️ 보양: +{formatCurrency(billing.protection_cost - payment.protection_cost)} 원
                  </div>
                )}
                {isDifferent('demolition_qty', 'demolition_qty') && (
                  <div className="flex items-center text-yellow-700">
                    ⚠️ 철거: +{formatCurrency(
                      (billing.demolition_qty * billing.demolition_unit_price) -
                      (payment.demolition_qty * payment.demolition_unit_price)
                    )} 원
                  </div>
                )}
                {isDifferent('equipment_cost', 'equipment_cost') && (
                  <div className="flex items-center text-yellow-700">
                    ⚠️ 장비비: +{formatCurrency(billing.equipment_cost - payment.equipment_cost)} 원
                  </div>
                )}
                {billing.measurement_cost > 0 && (
                  <div className="flex items-center text-blue-700">
                    💡 실측비: +{formatCurrency(billing.measurement_cost)} 원 (지급 없음)
                  </div>
                )}
                {(!isDifferent('standard_cost', 'standard_cost') && 
                  !isDifferent('protection_cost', 'protection_cost') && 
                  !isDifferent('demolition_qty', 'demolition_qty') && 
                  !isDifferent('equipment_cost', 'equipment_cost') &&
                  billing.measurement_cost === 0) && (
                  <div className="text-green-700 col-span-2">
                    ✅ 모든 항목이 동일합니다
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/settlements')}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            💾 저장
          </button>
        </div>
      </form>
    </div>
  );
}
