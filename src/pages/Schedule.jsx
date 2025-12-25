import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Schedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedule();
  }, [currentDate]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await axios.get(`/api/schedule/${year}/${month}`);
      setRecords(response.data);
    } catch (error) {
      console.error('스케줄 조회 실패:', error);
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
    const startingDayOfWeek = firstDay.getDay(); // 0 (일요일) ~ 6 (토요일)

    const days = [];
    
    // 빈 칸 추가 (이전 달)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 실제 날짜 추가
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getRecordsForDate = (day) => {
    if (!day) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.filter(record => record.construction_date === dateStr);
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

  const companyColors = {
    'LX': 'bg-purple-500 border-purple-600',
    '케스코': 'bg-blue-500 border-blue-600',
    '청암': 'bg-green-500 border-green-600',
    '한샘': 'bg-orange-500 border-orange-600',
    '홈CC': 'bg-red-500 border-red-600',
    '해모아': 'bg-cyan-500 border-cyan-600',
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

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">월간 시공 스케줄</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            오늘
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              ◀
            </button>
            <span className="text-xl font-semibold min-w-[180px] text-center">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </span>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">업체 구분</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(companyColors).map(([company, colorClass]) => (
            <div key={company} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${colorClass}`}></div>
              <span className="text-sm text-gray-700">{company}</span>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96 bg-white rounded-lg shadow">
          <div className="text-lg text-gray-600">로딩 중...</div>
        </div>
      ) : (
        /* 캘린더 */
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
              const dayRecords = getRecordsForDate(day);
              const isWeekend = index % 7 === 0 || index % 7 === 6;

              return (
                <div
                  key={index}
                  className={`min-h-[140px] border-r border-b p-2 ${
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

                      {/* 시공 내역 */}
                      <div className="space-y-1">
                        {dayRecords.map((record) => (
                          <div
                            key={record.id}
                            onClick={() => navigate(`/record/edit/${record.id}`)}
                            className={`text-xs p-2 rounded border-l-4 ${companyColors[record.client_company] || 'bg-gray-200 border-gray-400'} bg-opacity-10 hover:bg-opacity-20 cursor-pointer transition-all`}
                          >
                            <div className="font-semibold text-gray-900 mb-1">
                              {record.team} | {record.customer_name || '고객명 없음'}
                            </div>
                            <div className="text-gray-600 text-xs truncate">
                              {record.building_unit}
                            </div>
                            {record.is_resident && (
                              <div className="text-gray-500 text-xs mt-1">
                                {record.is_resident}
                              </div>
                            )}
                            {record.additional_work_types && (
                              <div className="text-purple-600 text-xs mt-1 font-medium">
                                🔧 {record.additional_work_types}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">이번 달 총 시공 건수</h3>
          <p className="text-3xl font-bold text-gray-900">{records.length}건</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">업체별 분포</h3>
          <div className="space-y-1">
            {Object.entries(
              records.reduce((acc, record) => {
                acc[record.client_company] = (acc[record.client_company] || 0) + 1;
                return acc;
              }, {})
            ).map(([company, count]) => (
              <div key={company} className="flex justify-between text-sm">
                <span className="text-gray-700">{company}</span>
                <span className="font-semibold text-gray-900">{count}건</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">팀별 분포</h3>
          <div className="space-y-1">
            {Object.entries(
              records.reduce((acc, record) => {
                acc[record.team] = (acc[record.team] || 0) + 1;
                return acc;
              }, {})
            ).map(([team, count]) => (
              <div key={team} className="flex justify-between text-sm">
                <span className="text-gray-700">{team}</span>
                <span className="font-semibold text-gray-900">{count}건</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
