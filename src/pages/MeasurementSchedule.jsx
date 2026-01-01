import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function MeasurementSchedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    fetchMeasurements();
  }, [currentDate]);

  const fetchMeasurements = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/api/measurements/schedule/${year}/${month}`);
      setMeasurements(response.data);
    } catch (error) {
      console.error('실측 스케줄 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getMeasurementsForDate = (day) => {
    if (!day) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    // 실측 예정일만 달력에 표시 (오더일 제외)
    return measurements.filter(m => 
      m.scheduled_measurement_date === dateStr
    );
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 실측 상태를 '실측 완료'로 변경
  const handleStatusToCompleted = async () => {
    if (!currentUser || !selectedMeasurement) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 권한 확인
    if (currentUser.role !== 'admin' && selectedMeasurement.assigned_manager !== currentUser.display_name) {
      alert(`본인이 담당한 실측만 완료 처리할 수 있습니다.\n담당자: ${selectedMeasurement.assigned_manager}`);
      return;
    }

    if (!confirm('실측 상태를 "실측 완료"로 변경하시겠습니까?')) return;

    try {
      await api.put(`/api/measurements/${selectedMeasurement.id}/status`, {
        username: currentUser.username,
        status: 'measured'
      });
      alert('실측 상태가 "실측 완료"로 변경되었습니다.');
      setSelectedMeasurement(null);
      fetchMeasurements(); // 목록 새로고침
    } catch (error) {
      alert('상태 변경 실패: ' + (error.response?.data?.error || error.message));
    }
  };

  const managerColors = {
    '이상무': '#3B82F6', // 파란색
    '정호규': '#10B981', // 녹색
    '김남군': '#F59E0B', // 주황색
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#9CA3AF'; // 회색
      case 'measured': return '#3B82F6'; // 파란색
      case 'scheduled': return '#10B981'; // 녹색
      case 'registered': return '#8B5CF6'; // 보라색
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return '대기';
      case 'measured': return '완료';
      case 'scheduled': return '확정';
      case 'registered': return '등록';
      default: return status;
    }
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const days = getDaysInMonth();

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // 모바일용 날짜별 그룹화
  const getMeasurementsByDate = () => {
    const grouped = {};
    measurements.forEach(m => {
      const date = m.scheduled_measurement_date;
      if (date) {
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(m);
      }
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
        <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
          📆 실측 스케줄
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className={`${isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'} bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors`}
          >
            오늘
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className={`${isMobile ? 'p-2 text-lg' : 'p-2'} hover:bg-gray-100 rounded-full transition-colors`}
            >
              ◀
            </button>
            <span className={`${isMobile ? 'text-base min-w-[140px]' : 'text-xl min-w-[180px]'} font-semibold text-center`}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={nextMonth}
              className={`${isMobile ? 'p-2 text-lg' : 'p-2'} hover:bg-gray-100 rounded-full transition-colors`}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* 범례 (PC만) */}
      {!isMobile && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📌 범례</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* 매니저별 색상 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">담당 매니저</p>
            <div className="space-y-1">
              {Object.entries(managerColors).map(([manager, color]) => (
                <div key={manager} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-xs text-gray-700">{manager}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 상태별 표기 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">진행 상태</p>
            <div className="space-y-1">
              <div className="text-xs"><span className="text-gray-600">⚪</span> 대기: 실측 대기중</div>
              <div className="text-xs"><span className="text-blue-600">🔵</span> 완료: 실측 완료</div>
              <div className="text-xs"><span className="text-green-600">🟢</span> 확정: 시공일 확정</div>
              <div className="text-xs"><span className="text-purple-600">🟣</span> 등록: 시공등록 완료</div>
              <div className="text-xs"><span className="text-green-600 font-bold">✓</span> 실측완료: 옅은 회색 표시</div>
            </div>
          </div>
          
          {/* 우선순위 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">우선순위</p>
            <div className="space-y-1">
              <div className="text-xs"><span className="text-red-600 font-bold">★★★</span> 긴급</div>
              <div className="text-xs"><span className="text-yellow-600 font-bold">★★</span> 보통</div>
              <div className="text-xs"><span className="text-green-600 font-bold">★</span> 낮음</div>
            </div>
          </div>
        </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-96 bg-white rounded-lg shadow">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
      ) : isMobile ? (
        /* 모바일 리스트 뷰 */
        <div className="space-y-3">
          {getMeasurementsByDate().length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
              이번 달 실측 일정이 없습니다.
            </div>
          ) : (
            getMeasurementsByDate().map(([date, dayMeasurements]) => (
              <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                {/* 날짜 헤더 */}
                <div className="bg-blue-600 text-white px-4 py-2 font-bold text-base">
                  📅 {date} ({new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                  <span className="ml-2 text-sm font-normal">
                    ({dayMeasurements.length}건)
                  </span>
                </div>
                
                {/* 실측 목록 */}
                <div className="divide-y">
                  {dayMeasurements.map((measurement) => {
                    const managerColor = managerColors[measurement.assigned_manager] || '#9CA3AF';
                    const isCompleted = measurement.measurement_completed === 1;
                    
                    return (
                      <div
                        key={measurement.id}
                        onClick={() => setSelectedMeasurement(measurement)}
                        className="p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                      >
                        {/* 대리점 + 고객명 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900">
                              {measurement.client_company}
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-base text-gray-700">
                              {measurement.customer_name}
                            </span>
                          </div>
                          {isCompleted && (
                            <span className="text-green-600 font-bold text-sm">✓완료</span>
                          )}
                        </div>

                        {/* 주소 */}
                        <div className="text-sm text-gray-600 mb-2">
                          📍 {measurement.site_address}
                        </div>

                        {/* 담당자 + 시간 + 상태 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="px-3 py-1 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: managerColor }}
                          >
                            {measurement.assigned_manager || '미배정'}
                          </span>
                          {measurement.scheduled_measurement_time && (
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                              🕐 {measurement.scheduled_measurement_time}
                            </span>
                          )}
                          <span 
                            className="px-3 py-1 rounded-full text-white text-sm font-medium"
                            style={{ backgroundColor: getStatusColor(measurement.status) }}
                          >
                            {getStatusLabel(measurement.status)}
                          </span>
                          {measurement.priority === 'urgent' && (
                            <span className="text-red-600 font-bold text-sm">★★★ 긴급</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* PC 캘린더 뷰 */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`py-3 text-center font-semibold text-sm ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, index) => {
              const dayMeasurements = getMeasurementsForDate(day);
              const isWeekend = index % 7 === 0 || index % 7 === 6;

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-r border-b p-2 ${
                    !day ? 'bg-gray-50' : ''
                  } ${isToday(day) ? 'bg-yellow-50' : ''}`}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-semibold mb-2 ${
                        isToday(day) 
                          ? 'bg-yellow-500 text-white rounded-full w-7 h-7 flex items-center justify-center' 
                          : index % 7 === 0 
                            ? 'text-red-600' 
                            : index % 7 === 6 
                              ? 'text-blue-600' 
                              : 'text-gray-700'
                      }`}>
                        {day}
                      </div>

                      {/* 실측 내역 */}
                      <div className="space-y-1">
                        {dayMeasurements.map((measurement) => {
                          const managerColor = managerColors[measurement.assigned_manager] || '#9CA3AF';
                          const statusColor = getStatusColor(measurement.status);
                          const isPriority = measurement.priority === 'urgent';
                          const isCompleted = measurement.measurement_completed === 1;
                          
                          return (
                            <div
                              key={measurement.id}
                              onClick={() => setSelectedMeasurement(measurement)}
                              className={`text-xs rounded-md p-1.5 cursor-pointer transition-all hover:shadow-md ${
                                isCompleted ? 'opacity-50' : ''
                              }`}
                              style={{ 
                                backgroundColor: isCompleted ? '#F3F4F6' : `${managerColor}15`,
                                borderLeft: isCompleted ? '3px solid #D1D5DB' : `3px solid ${managerColor}`
                              }}
                            >
                              {/* 첫 줄: 대리점 + 고객명 + 우선순위 + 완료 표시 */}
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <span className={`font-bold ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                                    {measurement.client_company}
                                  </span>
                                  <span className="text-gray-500">|</span>
                                  <span className={`truncate ${isCompleted ? 'text-gray-500' : 'text-gray-700'}`}>
                                    {measurement.customer_name}
                                  </span>
                                  {isCompleted && (
                                    <span className="text-green-600 font-bold text-[10px]">✓</span>
                                  )}
                                </div>
                                {isPriority && !isCompleted && (
                                  <span className="text-red-600 font-bold text-[10px]">★★★</span>
                                )}
                              </div>
                              
                              {/* 둘째 줄: 주소 */}
                              <div className={`text-[10px] truncate mb-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
                                {measurement.site_address}
                              </div>
                              
                              {/* 셋째 줄: 매니저 + 시간 + 상태 */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                  <span 
                                    className="text-white font-semibold text-[9px] px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: isCompleted ? '#9CA3AF' : managerColor }}
                                  >
                                    {measurement.assigned_manager || '미배정'}
                                  </span>
                                  {measurement.scheduled_measurement_time && (
                                    <span className={`text-[9px] ${isCompleted ? 'text-gray-500' : 'text-gray-600'}`}>
                                      {measurement.scheduled_measurement_time}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {isCompleted && (
                                    <span className="text-green-600 font-bold text-[9px]">✓완료</span>
                                  )}
                                  <span 
                                    className="text-white font-semibold text-[9px] px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: isCompleted ? '#9CA3AF' : statusColor }}
                                  >
                                    {getStatusLabel(measurement.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 상세 정보 모달 */}
      {selectedMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">실측 상세 정보</h2>
              <button
                onClick={() => setSelectedMeasurement(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">대리점</p>
                  <p className="text-base font-semibold">{selectedMeasurement.client_company}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">고객명</p>
                  <p className="text-base font-semibold">{selectedMeasurement.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">연락처</p>
                  <p className="text-base">{selectedMeasurement.customer_phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">실측 오더일</p>
                  <p className="text-base">{selectedMeasurement.request_date}</p>
                </div>
              </div>

              {/* 주소 */}
              <div>
                <p className="text-sm text-gray-600">주소</p>
                <p className="text-base font-medium">{selectedMeasurement.site_address}</p>
                {selectedMeasurement.address_detail && (
                  <p className="text-sm text-gray-600">{selectedMeasurement.address_detail}</p>
                )}
              </div>

              {/* 실측 정보 */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-gray-600">담당 매니저</p>
                  <p className="text-base font-semibold">{selectedMeasurement.assigned_manager || '미배정'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">실측 예정일</p>
                  <p className="text-base">
                    {selectedMeasurement.scheduled_measurement_date || '-'}
                    {selectedMeasurement.scheduled_measurement_time && 
                      <span className="text-sm text-gray-600 ml-2">{selectedMeasurement.scheduled_measurement_time}</span>
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">실측 완료일</p>
                  <p className="text-base">{selectedMeasurement.actual_measurement_date || '미완료'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">진행 상태</p>
                  <span 
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: getStatusColor(selectedMeasurement.status) }}
                  >
                    {getStatusLabel(selectedMeasurement.status)}
                  </span>
                </div>
              </div>

              {/* 시공일 정보 */}
              {(selectedMeasurement.desired_construction_date || selectedMeasurement.confirmed_construction_date) && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm text-gray-600">고객 희망 시공일</p>
                    <p className="text-base">{selectedMeasurement.desired_construction_date || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">확정 시공일</p>
                    <p className="text-base font-bold text-green-600">
                      {selectedMeasurement.confirmed_construction_date || '-'}
                    </p>
                  </div>
                </div>
              )}

              {/* 특이사항 */}
              {selectedMeasurement.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">특이사항</p>
                  <p className="text-base bg-gray-50 p-3 rounded-md">{selectedMeasurement.notes}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex flex-col gap-3 pt-4">
                {/* 실측 완료 버튼 (상태가 measured가 아닐 때만) */}
                {selectedMeasurement.status !== 'measured' && currentUser && (
                  <button
                    onClick={handleStatusToCompleted}
                    disabled={
                      currentUser.role !== 'admin' && 
                      selectedMeasurement.assigned_manager !== currentUser.display_name
                    }
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ 실측 완료로 변경
                  </button>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedMeasurement(null);
                      navigate(`/measurements/edit/${selectedMeasurement.id}`);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    수정하기
                  </button>
                  <button
                    onClick={() => setSelectedMeasurement(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 통계 */}
      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-600 mb-2`}>
            이번 달 실측 건수
          </h3>
          <p className={`${isMobile ? 'text-4xl' : 'text-3xl'} font-bold text-gray-900`}>
            {measurements.length}건
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-600 mb-2`}>
            매니저별 분포
          </h3>
          <div className="space-y-1">
            {Object.entries(
              measurements.reduce((acc, m) => {
                const manager = m.assigned_manager || '미배정';
                acc[manager] = (acc[manager] || 0) + 1;
                return acc;
              }, {})
            ).map(([manager, count]) => (
              <div key={manager} className="flex justify-between text-sm">
                <span className="text-gray-700">{manager}</span>
                <span className="font-semibold text-gray-900">{count}건</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-600 mb-2`}>
            상태별 분포
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">실측 대기</span>
              <span className="font-semibold text-gray-900">
                {measurements.filter(m => m.status === 'pending').length}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">실측 완료</span>
              <span className="font-semibold text-blue-600">
                {measurements.filter(m => m.status === 'measured').length}건
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">시공일 확정</span>
              <span className="font-semibold text-green-600">
                {measurements.filter(m => m.status === 'scheduled').length}건
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
