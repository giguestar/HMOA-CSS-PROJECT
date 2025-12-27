import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Schedule() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [calendarNotes, setCalendarNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [noteForm, setNoteForm] = useState({
    vacation_members: '',
    daily_workers: '',
    off_teams: ''
  });

  useEffect(() => {
    fetchSchedule();
    fetchCalendarNotes();
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

  const fetchCalendarNotes = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const response = await api.get(`/api/calendar-notes/${year}/${month}`);
      
      // 날짜별로 매핑
      const notesMap = {};
      response.data.forEach(note => {
        notesMap[note.note_date] = note;
      });
      setCalendarNotes(notesMap);
    } catch (error) {
      console.error('달력 노트 조회 실패:', error);
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

  const handleDateClick = (day) => {
    if (!day) return;
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateKey);
    
    const existingNote = calendarNotes[dateKey];
    setNoteForm({
      vacation_members: existingNote?.vacation_members || '',
      daily_workers: existingNote?.daily_workers || '',
      off_teams: existingNote?.off_teams || ''
    });
    
    setShowNoteModal(true);
  };

  const handleNoteSave = async () => {
    try {
      await api.post('/api/calendar-notes', {
        note_date: selectedDate,
        ...noteForm
      });
      
      alert('저장되었습니다!');
      setShowNoteModal(false);
      fetchCalendarNotes();
    } catch (error) {
      alert('저장 실패: ' + error.message);
    }
  };

  const companyColors = {
    'LX': { bg: '#8B1538', text: 'L' },
    '케스코': { bg: '#8B4513', text: '케' },
    '청암': { bg: '#1E3A8A', text: '청' },
    '한샘': { bg: '#16A34A', text: '한' },
    '홈CC': { bg: '#F97316', text: '홈' },
    '해모아': { bg: '#6B7280', text: '해' },
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
            <p className="text-xs font-medium text-gray-600 mb-2">업체 구분 (1글자 아이콘)</p>
            <div className="space-y-1">
              {Object.entries(companyColors).map(([company, info]) => (
                <div key={company} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded flex items-center justify-center text-white font-bold text-[8px]" style={{ backgroundColor: info.bg }}>
                    {info.text}
                  </div>
                  <span className="text-xs text-gray-700">{company}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* 작업 표기 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">작업 표기</p>
            <div className="space-y-1">
              <div className="text-xs"><span className="text-orange-600 font-semibold">주황색</span>: 난/방/롤/루 (약어)</div>
              <div className="text-xs"><span className="text-purple-600 font-semibold">보라색</span>: 몰딩/타일</div>
              <div className="text-xs"><span className="text-purple-700 font-semibold">고객명</span>: 보라색 글자</div>
              <div className="text-xs"><span className="text-blue-600 font-semibold">파랑색</span>: 장비내용</div>
            </div>
          </div>
          
          {/* 팀/철거 표기 */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">팀/철거/상태 표기</p>
            <div className="space-y-1">
              <div className="text-xs"><span className="text-green-600 font-semibold">녹색</span>: 시공팀</div>
              <div className="text-xs"><span className="text-red-600 font-semibold">빨강색</span>: 철거팀</div>
              <div className="text-xs"><span className="text-blue-500 font-semibold">🔵</span>: 비거주</div>
              <div className="text-xs"><span className="text-red-600 font-semibold">🔴</span>: 제작창 (현금수금)</div>
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
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {weekDays.map((day, index) => {
              const isWeekend = index === 0 || index === 6;
              return (
                <div
                  key={day}
                  className={`py-3 text-center font-semibold text-sm ${
                    index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                  }`}
                  style={isWeekend ? { gridColumn: 'span 1' } : {}}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 min-w-[1400px]">
            {days.map((day, index) => {
              const dayRecords = getRecordsForDate(day);
              const dayOfWeek = index % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isSaturday = dayOfWeek === 6;

              return (
                <div
                  key={index}
                  className={`border-r border-b p-1.5 ${
                    !day ? 'bg-gray-50' : ''
                  } ${isToday(day) ? 'bg-yellow-50' : ''} ${
                    isWeekend ? 'min-h-[80px]' : 'min-h-[120px]'
                  }`}
                >
                  {day && (
                    <>
                      {/* 날짜 + 3블럭 한 줄로 */}
                      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                        {/* 날짜 */}
                        <div 
                          onClick={() => handleDateClick(day)}
                          className={`text-xs font-semibold cursor-pointer hover:bg-gray-200 rounded transition-colors ${
                          isToday(day) 
                            ? 'bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center' 
                            : dayOfWeek === 0
                              ? 'text-red-600' 
                              : dayOfWeek === 6
                                ? 'text-blue-600' 
                                : 'text-gray-700'
                        }`}>
                          {day}
                        </div>

                        {/* 3블럭: 휴가자, 일당, 쉬는팀 (날짜 옆) */}
                        {(() => {
                          const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dayNote = calendarNotes[dateKey];
                          
                          if (dayNote && (dayNote.vacation_members || dayNote.daily_workers || dayNote.off_teams)) {
                            return (
                              <>
                                {/* 휴가자 (녹색) */}
                                {dayNote.vacation_members && (
                                  <span className="px-1.5 py-0.5 bg-green-100 text-green-700 font-medium rounded text-[8px]">
                                    {dayNote.vacation_members}
                                  </span>
                                )}
                                
                                {/* 일당인원 (보라) */}
                                {dayNote.daily_workers && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 font-medium rounded text-[8px]">
                                    {dayNote.daily_workers}
                                  </span>
                                )}
                                
                                {/* 쉬는팀 (파랑) */}
                                {dayNote.off_teams && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 font-medium rounded text-[8px]">
                                    {dayNote.off_teams}
                                  </span>
                                )}
                              </>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* 시공 내역 */}
                      <div className="space-y-1">
                        {dayRecords.map((record) => {
                          const companyInfo = companyColors[record.client_company] || { bg: '#9CA3AF', text: record.client_company?.substring(0, 2) || '??' };
                          const bgColor = companyInfo.bg;
                          
                          // 주소 파싱 및 표기
                          // 입력: 주소="울산 북구", 상세주소="염포성원상떼빌 115동 302호"
                          // 출력: "울산 염포성원상떼빌 202/1501 (12)"
                          const addressParts = record.site_address ? record.site_address.split(' ') : [];
                          const addressPrefix = addressParts[0] || ''; // 울산
                          
                          // 상세주소에서 아파트명과 동/호 추출
                          const addressDetail = record.address_detail || ''; // 염포성원상떼빌 115동 302호
                          
                          // 정규식으로 동/호 추출: "115동 302호" -> "115/302"
                          let apartmentName = addressDetail;
                          let buildingUnit = '';
                          
                          // "숫자동 숫자호" 패턴 찾기
                          const dongHoMatch = addressDetail.match(/(\d+)동\s*(\d+)호/);
                          if (dongHoMatch) {
                            // "115동 302호" 찾음
                            const dong = dongHoMatch[1]; // 115
                            const ho = dongHoMatch[2];   // 302
                            buildingUnit = `${dong}/${ho}`;
                            
                            // 아파트명 = 동/호 앞부분
                            apartmentName = addressDetail.substring(0, dongHoMatch.index).trim();
                          }
                          
                          // 시공틀수 표기
                          const frameDisplay = record.frame_count ? ` (${record.frame_count})` : '';
                          
                          // 최종 주소: "울산 염포성원상떼빌 202/1501 (12)"
                          const displayAddress = `${addressPrefix} ${apartmentName} ${buildingUnit}${frameDisplay}`.trim();
                          
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
                          
                          // 부가작업 수집 - 주황색 (필수 제작)
                          const orangeWorks = [];
                          if (record.has_railing) orangeWorks.push('난');
                          if (record.has_security_window) orangeWorks.push('방');
                          if (record.has_roll_screen) orangeWorks.push('롤');
                          if (record.has_louver) orangeWorks.push('루');
                          const hasOrangeWork = orangeWorks.length > 0;
                          
                          // 보라색 (몰딩/타일)
                          const purpleWorks = [];
                          if (record.has_molding) purpleWorks.push('몰');
                          if (record.has_tile) purpleWorks.push('타');
                          if (record.has_molding_tile) purpleWorks.push('몰.타');
                          
                          // 토요일 AS 간단 표기
                          if (isSaturday) {
                            return (
                              <div
                                key={record.id}
                                onClick={() => navigate(`/record/edit/${record.id}`)}
                                className="text-[10px] p-1.5 bg-gray-100 rounded border border-gray-300 hover:bg-gray-200 cursor-pointer"
                              >
                                <div className="font-medium text-gray-800">
                                  AS: {displayAddress || record.site_address}
                                </div>
                                {record.special_notes && (
                                  <div className="text-gray-600 text-[9px] mt-0.5">
                                    {record.special_notes}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          
                          return (
                            <div
                              key={record.id}
                              onClick={() => navigate(`/record/edit/${record.id}`)}
                              className="text-[10px] rounded border border-gray-300 hover:shadow-md cursor-pointer transition-all overflow-hidden bg-white"
                            >
                              {/* 헤더: 업체 아이콘 + 고객명 + 주소 + 부가작업 */}
                              <div className="px-1.5 py-0.5 flex items-center gap-1 leading-tight">
                                {/* 업체 아이콘 */}
                                <div 
                                  className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center text-white font-bold text-[8px]"
                                  style={{ backgroundColor: bgColor }}
                                >
                                  {companyInfo.text}
                                </div>
                                
                                {/* 고객명 (괄호 제거) */}
                                {record.customer_name && (
                                  <span className="text-purple-700 font-medium text-[9px]">{record.customer_name}</span>
                                )}
                                
                                {/* 주소 + 동호 + 틀수 */}
                                <span className="text-gray-800 font-medium text-[9px]">
                                  {displayAddress}
                                </span>
                                
                                {/* 부가작업 (주황색) */}
                                {orangeWorks.length > 0 && (
                                  <span className="text-orange-600 font-semibold text-[9px]">{orangeWorks.join(',')}</span>
                                )}
                              </div>
                              
                              {/* 본문: 비거주 + 제작창 + 팀/철거/장비/몰타 */}
                              <div className="px-1.5 py-0.5 bg-gray-50 flex items-center gap-1 flex-wrap text-[8px] leading-tight">
                                {/* 비거주 아이콘 */}
                                {record.is_resident === '비거주' && (
                                  <span className="text-blue-600 font-bold text-[10px]" title="비거주">🔵</span>
                                )}
                                
                                {/* 제작창 아이콘 */}
                                {record.needs_fabrication === 1 && (
                                  <span className="text-red-600 font-bold text-[10px]" title="제작창(현금수금)">🔴</span>
                                )}
                                
                                {/* 시공팀 */}
                                {teamInitial && (
                                  <>
                                    <span className="text-green-600 font-bold">{teamInitial}</span>
                                    <span className="text-gray-400">/</span>
                                  </>
                                )}
                                
                                {/* 철거팀 */}
                                {demolitionDisplay && (
                                  <>
                                    <span className="text-red-600 font-bold">{demolitionDisplay}</span>
                                    <span className="text-gray-400">/</span>
                                  </>
                                )}
                                
                                {/* 장비 */}
                                {(equipmentProvider || record.equipment_desc) && (
                                  <>
                                    <span className="text-blue-600">
                                      {equipmentProvider}{record.equipment_desc}
                                    </span>
                                    <span className="text-gray-400">/</span>
                                  </>
                                )}
                                
                                {/* 몰딩/타일 */}
                                {purpleWorks.length > 0 && (
                                  <span className="text-purple-600 font-semibold">{purpleWorks.join('.')}</span>
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

      {/* 3블럭 입력 모달 */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              📅 {selectedDate} 관리
            </h2>
            
            <div className="space-y-4">
              {/* 휴가자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-green-600">●</span> 휴가자
                </label>
                <input
                  type="text"
                  value={noteForm.vacation_members}
                  onChange={(e) => setNoteForm({...noteForm, vacation_members: e.target.value})}
                  placeholder="예: 김남군, 손수용"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* 일당인원 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-purple-600">●</span> 일당인원
                </label>
                <input
                  type="text"
                  value={noteForm.daily_workers}
                  onChange={(e) => setNoteForm({...noteForm, daily_workers: e.target.value})}
                  placeholder="예: 이대성, 박지훈 (2명)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* 쉬는팀 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-blue-600">●</span> 쉬는 팀 (X표시)
                </label>
                <input
                  type="text"
                  value={noteForm.off_teams}
                  onChange={(e) => setNoteForm({...noteForm, off_teams: e.target.value})}
                  placeholder="예: 포항팀, 진주팀"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleNoteSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
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
