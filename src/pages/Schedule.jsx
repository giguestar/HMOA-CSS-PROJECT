import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

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
      const response = await api.get(`/api/schedule/${year}/${month}`);
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
    'LX': '#8B1538',        // 붉은 자주색
    '케스코': '#8B4513',    // 갈색
    '청암': '#1E3A8A',      // 군청색
    '한샘': '#16A34A',      // 녹색
    '홈CC': '#F97316',      // 주황색
    '해모아': '#6B7280',    // 회색
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
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📌 범례</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* 업체 색상 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">업체 구분 (배경색)</p>
            <div className="space-y-1">
              {Object.entries(companyColors).map(([company, color]) => (
                <div key={company} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                  <span className="text-xs text-gray-700">{company}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 작업 표기 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">작업 표기</p>
            <div className="space-y-1">
              <div className="text-xs"><span className="text-orange-600 font-semibold">주황색</span>: 난간대/방범창/롤망/루버</div>
              <div className="text-xs"><span className="text-purple-600 font-semibold">보라색</span>: 몰딩/타일/몰+타</div>
              <div className="text-xs"><span className="text-blue-600 font-semibold">파랑색</span>: 장비내용</div>
            </div>
          </div>
          
          {/* 팀/철거 표기 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">팀/철거 표기</p>
            <div className="space-y-1">
              <div className="text-xs"><span className="text-green-600 font-semibold">녹색</span>: 시공팀</div>
              <div className="text-xs"><span className="text-red-600 font-semibold">빨강색</span>: 철거팀</div>
              <div className="text-xs"><span className="text-blue-500 font-semibold">"비"</span>: 비거주</div>
            </div>
          </div>
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
                      <div className="space-y-1.5">
                        {dayRecords.map((record) => {
                          const bgColor = companyColors[record.client_company] || '#9CA3AF';
                          
                          // 주소 파싱 (앞 2단어 / 아파트명 / 동호수)
                          const addressParts = record.site_address ? record.site_address.split(' ') : [];
                          const addressPrefix = addressParts.slice(0, 2).join(' ');
                          const apartmentName = addressParts.slice(2).join(' ');
                          
                          // 시공팀 첫 글자
                          const teamInitial = record.team ? record.team.charAt(0) : '';
                          
                          // 철거팀 표기
                          let demolitionDisplay = '';
                          if (record.demolition_team === '시공팀') {
                            demolitionDisplay = teamInitial;
                          } else if (record.demolition_team === '경산철거') {
                            demolitionDisplay = '경';
                          }
                          
                          // 장비 주체 표기
                          const equipmentProvider = record.equipment_provider === '업체' ? '(업)' : '';
                          
                          // 부가작업 수집
                          const orangeWorks = [];
                          if (record.has_railing) orangeWorks.push('난간대');
                          if (record.has_security_window) orangeWorks.push('방범창');
                          if (record.has_roll_screen) orangeWorks.push('롤망');
                          if (record.has_louver) orangeWorks.push('루버');
                          
                          const purpleWorks = [];
                          if (record.has_molding) purpleWorks.push('몰딩');
                          if (record.has_tile) purpleWorks.push('타일');
                          if (record.has_molding_tile) purpleWorks.push('몰+타');
                          
                          return (
                            <div
                              key={record.id}
                              onClick={() => navigate(`/record/edit/${record.id}`)}
                              className="text-xs rounded-md shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden"
                              style={{ backgroundColor: bgColor + '20', borderLeft: `4px solid ${bgColor}` }}
                            >
                              {/* 첫 줄: 대리점 | 고객명 | 주소 | 비거주 */}
                              <div className="px-2 py-1.5 font-medium text-gray-900" style={{ backgroundColor: bgColor + '15' }}>
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <span className="font-bold whitespace-nowrap">{record.client_company}</span>
                                    <span className="text-gray-600">|</span>
                                    <span className="whitespace-nowrap">{record.customer_name || '고객명 없음'}</span>
                                    <span className="text-gray-600">|</span>
                                    <span className="truncate text-gray-700">
                                      {addressPrefix} / {apartmentName} / {record.building_unit}
                                    </span>
                                  </div>
                                  {record.is_resident === '비거주' && (
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">비</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* 주황색 부가작업 */}
                                {orangeWorks.length > 0 && (
                                  <div className="mt-1 text-orange-600 font-semibold">
                                    {orangeWorks.join(' ')}
                                  </div>
                                )}
                              </div>
                              
                              {/* 둘째 줄: 시공팀 | 철거팀 | 장비주체 | 장비내용 */}
                              <div className="px-2 py-1 text-gray-700 flex items-center gap-1.5 flex-wrap">
                                <span className="text-green-600 font-bold">{teamInitial}</span>
                                <span className="text-gray-400">|</span>
                                <span className="text-red-600 font-bold">{demolitionDisplay}</span>
                                {equipmentProvider && (
                                  <>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-gray-700 font-medium">{equipmentProvider}</span>
                                  </>
                                )}
                                {record.equipment_desc && (
                                  <>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-blue-600">{record.equipment_desc}</span>
                                  </>
                                )}
                                
                                {/* 보라색 작업 (몰딩, 타일) */}
                                {purpleWorks.length > 0 && (
                                  <>
                                    <span className="text-gray-400">|</span>
                                    <span className="text-purple-600 font-semibold">{purpleWorks.join(' ')}</span>
                                  </>
                                )}
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
